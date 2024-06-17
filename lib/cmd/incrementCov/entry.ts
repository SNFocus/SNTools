import { program } from 'commander'
import main, { IArgs } from './index'
import { required } from '../../utils/common'

program
  .command('inc-cov')
  .alias('ic')
  .description('增量覆盖率计算')
  .option('-tb, --target-branch <name>', '必填，需要diff的target分支名称')
  .option('-cf, --cov-file <path>', '必填，覆盖率数据文件')
  .option('-sb, --source-branch <name>', '需要diff的源分支名称，默认取运行仓库当前分支')
  .option('-o, --output <path>', '报告输出目录, 默认./coverage')
  .option('-t, --type <type>', '覆盖率数据文件格式，目前仅支持jest testResult')
  .option('-r, --reporters <reporter>', '生成报告类型, 默认lcov, text, text-summary')
  .action((options: IArgs) => {
    required(options.output, '--output')
    required(options.targetBranch, '--target-branch')
    required(options.covFile, '--cov-file')
    main(options)
  })
