import fs from 'fs-extra'
import type { FileCoverageData, FunctionMapping, Range } from 'istanbul-lib-coverage'
import istanbulCoverage from 'istanbul-lib-coverage'
import type { ReportOptions } from 'istanbul-reports'
import reports from 'istanbul-reports'
import libReport from 'istanbul-lib-report'
import { diffLines, getHeadHash } from '../../utils/git'
import chalk from 'chalk'

/** ------ @types ------ */
export interface IArgs {
  covFile: string
  targetBranch: string
  sourceBranch?: string
  output?: string
  reporters?: ('lcov' | 'text' | 'text-summary')[]
  type?: 'jest'
}

type DiffMap = Record<string, Record<string, boolean>>

/** ------ @constants ------ */
const COV_TYPE_KEYS = [
  ['fnMap', 'f'],
  ['branchMap', 'b'],
  ['statementMap', 's'],
]
const mergeOptions = (opts: IArgs) => ({
  reporters: ['lcov', 'text', 'text-summary'] as const,
  output: './coverage',
  sourceBranch: getHeadHash(),
  ...opts,
})

/** ------ @functions ------ */

/**
 * 根据istanbul生成对应的报告
 */
function createReport(
  mapData: istanbulCoverage.CoverageMapData,
  output: string,
  type: keyof ReportOptions = 'text-summary',
) {
  console.info(chalk.bgGreen.white.bold(`------  生成${type}报告 ------`))
  const map = istanbulCoverage.createCoverageMap(mapData)
  const ctx = libReport.createContext({
    dir: output,
    coverageMap: map,
    watermarks: libReport.getDefaultWatermarks(),
  })
  const report = reports.create(type, {
    skipEmpty: false,
    skipFull: false,
    maxCols: process.stdout.columns || Infinity,
  })
  report.execute(ctx)
}
/**
 * 获取不同类型维度数据对应的行数区间信息
 */
function getLineRange(metricName: string, metric: FunctionMapping | Range) {
  const line = [0, 0]
  switch (metricName) {
    case 'fnMap':
    case 'branchMap':
      line[0] = (metric as FunctionMapping).loc.start.line
      line[1] = (metric as FunctionMapping).loc.end.line
      break
    case 'statementMap':
      line[0] = (metric as Range).start.line
      line[1] = (metric as Range).end.line
      break
    default:
  }
  return line
}
/**
 * 获取增量行对应的覆盖率数据
 */
function genIncrementCov(cov: Record<string, FileCoverageData>, diffLines: DiffMap) {
  const incrementCov: Record<string, FileCoverageData> = {}
  Object.entries(cov).forEach(([filePath, fileCov]) => {
    COV_TYPE_KEYS.forEach(([mapKey, calcKey]) => {
      const sourceMap = fileCov[mapKey]
      const statistics = fileCov[calcKey]
      Object.entries(sourceMap).forEach(([idx, desc]) => {
        const [start = 0, end = 0] = getLineRange(mapKey, desc as Range)
        // 获取当前指标位置对应复用范围中的函数数据，若无说明不在复用范围内，返回null
        const inChangedLines = new Array(end - start + 1).fill(0).some((_, i) => diffLines[filePath]?.[start + i])
        if (inChangedLines) {
          const memo = incrementCov[filePath] || istanbulCoverage.createFileCoverage(filePath)
          memo[mapKey][idx] = sourceMap[idx]
          memo[calcKey][idx] = statistics[idx]
          incrementCov[filePath] = memo
        }
      })
    })
  })
  return incrementCov
}
/**
 * 将diff行信息转换成map结构，方便后续查找
 */
function transfer2DiffMap(data: Record<string, number[]>) {
  return Object.entries(data).reduce<DiffMap>((rst, [filePath, lines]) => {
    rst[filePath] = {}
    lines.forEach((l) => (rst[filePath][l] = true))
    return rst
  }, {})
}

/**
 * @entry 入口函数
 */
export default function main(options: IArgs) {
  const config = mergeOptions(options)
  console.info(chalk.bgGreen.white.bold('------  配置 ------\n'), config)
  const diffs = diffLines(config.sourceBranch, config.targetBranch)
  const source = fs.readFileSync(config.covFile, { encoding: 'utf-8' })
  const incrementCov = genIncrementCov(JSON.parse(source).coverageMap, transfer2DiffMap(diffs))
  config.reporters.forEach((type) => createReport(incrementCov, config.output, type))
}
