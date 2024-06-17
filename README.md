# SNTools

自用全局脚手架

## 增量覆盖率

输入jest覆盖率数据文件及需要diff的目标分支名称，根据diff行筛选出对应的覆盖率数据，并生成Istanbul报告

```
Usage: sn inc-cov|ic [options]

增量覆盖率计算

Options:
  -tb --target-branch  必填，需要diff的target分支名称
  -cf --cov-file       必填，覆盖率数据文件
  -sb --source-branch  需要diff的源分支名称, 默认取运行仓库当前分支
  -o --output          报告输出目录, 默认./coverage
  -t --type            覆盖率数据文件格式，目前仅支持jest testResult
  -r --reporters       生成报告类型, 默认lcov, text, text-summary
  -h, --help           display help for command
```
