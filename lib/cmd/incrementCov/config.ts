export interface IArgs {
  covFile: string;
  output: string;
  reporters?: ('lcov' | 'text' | 'text-summary')[];
  type: 'jest';
  extension: string[];
  diff: string;
}
export type DiffMap = Record<string, Record<string, boolean>>;
export const JEST_CASE_RESULT_MAP = {
  numFailedTestSuites: 'FailedSuites',
  numFailedTests: 'FailedTests',
  numPassedTestSuites: 'PassedSuites',
  numPassedTests: 'PassedTests',
  numPendingTestSuites: 'PendingSuites',
  numPendingTests: 'PendingTests',
  numRuntimeErrorTestSuites: 'RuntimeErrorSuites',
  numTodoTests: 'TodoTests',
  numTotalTestSuites: 'TotalSuites',
  numTotalTests: 'TotalTests',
};

export const COV_TYPE_KEYS = [
  ['fnMap', 'f'],
  ['branchMap', 'b'],
  ['statementMap', 's'],
];

export default {
  command: 'inc-Cov',
  alias: 'ic',
  description: '生成增量覆盖率报告',
  options: [
    {
      name: 'covFile',
      message: '覆盖率数据文件',
      type: 'input',
      default: './coverage/coverage-final.json',
      extra: {
        argument: '<file>',
      },
    },
    {
      name: 'output',
      message: '报告输出目录',
      type: 'input',
      default: './coverage',
      extra: {
        argument: '<folder>',
      },
    },
    // {
    //   name: 'type',
    //   choices: ['jest'],
    //   message: '覆盖率数据文件格式',
    //   type: 'list',
    //   default: 'jest',
    //   extra: {
    //     argument: '<type>',
    //   },
    // },
    {
      name: 'extension',
      choices: ['.js', '.ts', '.tsx', '.jsx'],
      message: '支持的文件后缀名',
      type: 'checkbox',
      default: ['.js', '.ts', '.tsx', '.jsx'],
      extra: {
        argument: '<extension>',
      },
    },
    {
      name: 'diff',
      message: '类似git diff命令参数，仅支持 [空]，[commit/branch],[cached]，[first-branch]...[second-branch]',
      type: 'input',
      default: 'HEAD',
      extra: {
        argument: '[cmd]',
      },
    },
    {
      name: 'reporters',
      choices: ['lcov', 'text', 'text-summary'],
      message: '生成报告类型, 默认lcov, text, text-summary',
      type: 'checkbox',
      default: ['lcov', 'text', 'text-summary'],
      extra: {
        argument: '<reporter>',
      },
    },
  ],
} as CmdConfig;
