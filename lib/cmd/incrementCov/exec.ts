/* eslint-disable no-console */
import fs from 'fs-extra';
import chalk from 'chalk';
import type {
  FileCoverageData,
  FunctionMapping,
  Range,
} from 'istanbul-lib-coverage';
import istanbulCoverage from 'istanbul-lib-coverage';
import type { ReportOptions } from 'istanbul-reports';
import reports from 'istanbul-reports';
import libReport from 'istanbul-lib-report';
import { diffLines } from '../../utils/git';
import type { DiffMap, IArgs } from './config';
import { COV_TYPE_KEYS, JEST_CASE_RESULT_MAP } from './config';

function mergeOptions(opts: IArgs): IArgs {
  return Object.assign(
    {},
    {
      reporters: ['lcov', 'text', 'text-summary'],
      output: './coverage',
      type: 'jest',
      extension: ['.ts', '.tsx', '.js', '.jsx'],
      covFile: './coverage/coverage-final.json',
    },
    opts,
  );
}

/**
 * 根据istanbul生成对应的报告
 */
function createReport(
  mapData: istanbulCoverage.CoverageMapData,
  output: string,
  type: keyof ReportOptions = 'text-summary',
) {
  const map = istanbulCoverage.createCoverageMap(mapData);
  const ctx = libReport.createContext({
    dir: output,
    coverageMap: map,
    watermarks: libReport.getDefaultWatermarks(),
  });
  const report = reports.create(type, {
    skipEmpty: false,
    skipFull: false,
    // eslint-disable-next-line node/prefer-global/process
    maxCols: process.stdout.columns || Infinity,
  });
  report.execute(ctx);
}
/**
 * 获取不同类型维度数据对应的行数区间信息
 */
function getLineRange(metricName: string, metric: FunctionMapping | Range) {
  const line = [0, 0];
  switch (metricName) {
    case 'fnMap':
    case 'branchMap':
      line[0] = (metric as FunctionMapping).loc.start.line;
      line[1] = (metric as FunctionMapping).loc.end.line;
      break;
    case 'statementMap':
      line[0] = (metric as Range).start.line;
      line[1] = (metric as Range).end.line;
      break;
    default:
  }
  return line;
}
/**
 * 获取增量行对应的覆盖率数据
 */
function genIncrementCov(
  cov: Record<string, FileCoverageData>,
  diffLines: DiffMap,
) {
  const incrementCov: Record<string, FileCoverageData> = {};
  Object.entries(cov).forEach(([filePath, fileCov]) => {
    COV_TYPE_KEYS.forEach(([mapKey, calcKey]) => {
      const sourceMap = fileCov[mapKey];
      const statistics = fileCov[calcKey];
      Object.entries(sourceMap).forEach(([idx, desc]) => {
        const [start = 0, end = 0] = getLineRange(mapKey, desc as Range);
        // 获取当前指标位置对应复用范围中的函数数据，若无说明不在复用范围内，返回null
        const inChangedLines = Array.from({ length: end - start + 1 })
          .fill(0)
          .some((_, i) => diffLines[filePath]?.[start + i]);
        if (inChangedLines) {
          const memo
            = incrementCov[filePath]
            || istanbulCoverage.createFileCoverage(filePath);
          memo[mapKey][idx] = sourceMap[idx];
          memo[calcKey][idx] = statistics[idx];
          incrementCov[filePath] = memo;
        }
      });
    });
  });
  return incrementCov;
}
/**
 * 将diff行信息转换成map结构，方便后续查找
 */
function transfer2DiffMap(data: Record<string, number[]>) {
  return Object.entries(data).reduce<DiffMap>((rst, [filePath, lines]) => {
    rst[filePath] = {};
    lines.forEach(l => (rst[filePath][l] = true));
    return rst;
  }, {});
}

class JestParse {
  config: IArgs;
  diffMap: DiffMap;
  source: any;
  constructor(config: IArgs, diffMap: DiffMap, source: any = {}) {
    this.config = config;
    this.diffMap = diffMap;
    this.source = source;
  }

  isCovMap(data: any = {}): data is Record<string, FileCoverageData> {
    return Object.prototype.hasOwnProperty.call(
      Object.values(data)?.[0] || {},
      'statementMap',
    );
  }

  genCoverageReport() {
    let covMap: Record<string, FileCoverageData> | undefined;
    if (this.isCovMap(this.source)) {
      covMap = this.source;
    }
    else if (this.source.coverageMap) {
      covMap = this.source.coverageMap;
    }
    if (covMap) {
      const incrementCov = genIncrementCov(covMap, this.diffMap);
      this.config.reporters?.forEach(type =>
        createReport(incrementCov, this.config.output as string, type),
      );
    }
  }

  genTestCaseState() {
    const tableData = {
      data: {} as Record<string, number>,
      header: [] as string[],
    };
    Object.entries(JEST_CASE_RESULT_MAP).forEach(([prop, label]) => {
      if (typeof this.source[prop] === 'number') {
        tableData.data[label] = this.source[prop];
        tableData.header.push(label);
      }
    });
    if (tableData.header.length) {
      console.info(
        chalk.bgGreen.bgYellowBright.white.bold('\n       测试用例状态      \n'),
      );
      console.table(tableData.data, tableData.header);
    }
  }

  run() {
    this.genTestCaseState();
    this.genCoverageReport();
  }
}

/**
 * @entry 入口函数
 */
export default function main(options: IArgs) {
  const config = mergeOptions(options);
  console.info(chalk.bgGreen.white.bold('\n       配置      \n'), config);
  const diffs = diffLines({ extension: config.extension, diff: config.diff });
  const source = fs.readFileSync(config.covFile, { encoding: 'utf-8' });
  const parseSource = JSON.parse(source);
  switch (config.type) {
    case 'jest':
      new JestParse(config, transfer2DiffMap(diffs), parseSource).run();
      break;
  }
}
