#!/usr/bin/env node

import fs from 'fs-extra'
import { program } from 'commander'
import './cmd/incrementCov/entry'

// 读取package.json配置信息
const pkg = fs.readJsonSync('./package.json')

// 查看版本号
program.version(pkg.version, '-v, --version')
program.parse()
