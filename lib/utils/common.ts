import shell from 'shelljs'
import chalk from 'chalk'

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export const required = (d: any, name: string) => {
  if (!d) {
    console.info(chalk.red(`缺少必要的参数：${name}`))
    shell.exit(1)
  }
}
