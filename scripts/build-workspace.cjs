#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const [,, workspacePath, ...rest] = process.argv;
if (!workspacePath) {
  console.error('Usage: node scripts/build-workspace.cjs <workspace-path> [vite args]');
  process.exit(2);
}

const viteBin = path.resolve(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');
const args = [viteBin, ...rest];

const opts = { stdio: 'inherit', cwd: path.resolve(process.cwd(), workspacePath) };
const result = spawnSync(process.execPath, args, opts);
process.exit(result.status || 0);
