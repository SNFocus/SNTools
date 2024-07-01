const { exec } = require('node:child_process');
const path = require('node:path');
const { Project } = require('ts-morph');
const fs = require('fs-extra');
const pkg = require('pkginfo').find({ id: __filename });

// 1. init ast project
const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
  skipFileDependencyResolution: true,
});
// 2. init source file
const sourceFile = project.createSourceFile(path.join(__dirname, '../lib/main.ts'), '#!/usr/bin/env node');

// 3. import registerCommand
sourceFile.addImportDeclaration({
  namedImports: ['registerCommand'],
  moduleSpecifier: './utils/common',
});
sourceFile.addImportDeclaration({
  namedImports: ['program'],
  moduleSpecifier: 'commander',
});

// 4. find cmd and import config and exec code
fs.readdirSync(path.join(__dirname, '../lib/cmd')).forEach(folder => {
  const EXEC_FILE = 'exec';
  const CONFIG_FILE = 'config';
  const configIdentifier = [folder, 'Config'].join('');
  const execFnIdentifier = [folder, 'ExecFn'].join('');

  sourceFile.addImportDeclaration({
    defaultImport: configIdentifier,
    moduleSpecifier: ['./cmd', folder, CONFIG_FILE].join('/'),
  });

  sourceFile.addImportDeclaration({
    defaultImport: execFnIdentifier,
    moduleSpecifier: ['./cmd', folder, EXEC_FILE].join('/'),
  });

  sourceFile.addStatements(`registerCommand(${configIdentifier}, ${execFnIdentifier})`);
});

// 5. append program init code
sourceFile.addStatements(`program.version('${pkg.version}', '-v, --version')`);
sourceFile.addStatements('program.parse();');
sourceFile.saveSync();
exec(`npx tsc`, () => sourceFile.deleteImmediately());
