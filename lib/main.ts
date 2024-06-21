#!/usr/bin/env node
import pkg from '../package.json'
import { program } from 'commander'
import './cmd/incrementCov/entry'

// 查看版本号
program.version(pkg.version, '-v, --version')
program.parse()
