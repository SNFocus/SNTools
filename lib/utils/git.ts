import shell from 'shelljs';
import chalk from 'chalk';
import { range } from './common';
/**
 * 获取git仓库地址
 * @returns string
 */
export function getRepoPath() {
  console.info(chalk.bgGreen.white.bold('\n  仓库地址:'));
  return shell.exec('git rev-parse --show-toplevel').toString().trim();
}
/**
 * 获取当前git分支的hash
 */
export function getHeadHash() {
  console.info(chalk.bgGreen.white.bold('\n  当前分支:'));
  return shell.exec('git rev-parse HEAD').toString().trim();
}
/**
 * 对比不同分支Diff，获取改动的文件及对应的行
 */
interface DiffLinesArgs {
  diff?: string;
  extension: string[];
}
function getDiffCmd(cmd = '') {
  if (['cached', 'staged'].includes(cmd)) {
    return 'git diff --cached';
  }
  if (/^\w+\.{2,3}\w+$/.test(cmd)) {
    return `git diff ${cmd}`;
  }
  return `git diff ${cmd}`;
}
export function diffLines(args: DiffLinesArgs) {
  const { diff: diffCmd, extension } = args;
  const repoPath = getRepoPath();
  const isSupport = (fileName: string) => extension.some((ext) => fileName.endsWith(ext));
  // git diff 命令获取diff详情 --unified=0 代表仅展示改动行（默认展示改动行上下共3行）
  const gitDiffCmd = `${getDiffCmd(diffCmd)} --unified=0`;
  // 过滤掉具体的代码内容，否则内容过大会报错
  const textFilter = 'grep -s -e "^+++" -e  "^@@"';
  const diffContent = shell.exec([gitDiffCmd, textFilter].join(' | '), { silent: true }).toString();

  let currentFile = '';
  const rst = diffContent.split('\n').reduce<Record<string, number[]>>((map, line) => {
    // 初始化 / +++ 代表改动后的文件
    if (line.startsWith('+++')) {
      const absPath = line.replace(/^\+\+\+ b/, repoPath).trim();
      if (isSupport(absPath)) {
        map[(currentFile = absPath)] = [];
      }
      return map;
    }
    // @@ -1,21 +1,2 @@ 将[1,2]提取出来，1代表改动起始行，2代表增量行数
    const matchRes = line.match(/^@@\s+(?<before>\S+)\s+(?<now>\S+) @@/);
    const diff = matchRes?.groups?.now?.split(',').filter(Boolean).map(Number);
    if (currentFile && diff?.length) {
      const [startLine, increment = 1] = diff;
      const changed = range(startLine, startLine + increment - 1);
      map[currentFile].push(...changed);
    }
    return map;
  }, {});
  return rst;
}
