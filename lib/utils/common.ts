/* eslint-disable no-console */
import shell from 'shelljs';
import chalk from 'chalk';
import inquire from 'inquirer';
import { program } from 'commander';

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function required(d: any, name: string) {
  if (!d) {
    console.info(chalk.red(`缺少必要的参数：${name}`));
    shell.exit(1);
  }
}

export function isEmptyObj(obj = {}) {
  return Object.keys(obj).length === 0;
}

export function registerCommand<T extends Record<string, any>>(config: CmdConfig, exec: (args: T) => void) {
  const { command, alias, description, options } = config;
  let programRegister = program.command(command).alias(alias).description(description);
  programRegister = options.reduce((register, item) => {
    const isRequired = item.default === undefined;
    const short = item.extra?.short || `-${item.name.slice(0, 1)}`;
    const long = item.extra?.long || `--${item.name.replace(/[A-Z]/g, (match: string) => `-${match.toLowerCase()}`)}`;
    const requiredText = isRequired ? '必填，' : '';
    const defText = item.default !== undefined ? `（默认值：${item.default}）` : '';
    register.option([short, long].join(' '), [requiredText, item.message, defText].join(''));
    return register;
  }, programRegister);

  programRegister.action((cmdOptions: T) => {
    if (!isEmptyObj(cmdOptions)) {
      options.filter(t => t.default === undefined).forEach(t => required(options[t.name], t.name));
      exec(cmdOptions);
      return;
    }
    inquire.prompt(options).then(exec);
  });
}
