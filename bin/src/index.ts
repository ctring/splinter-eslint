#!/usr/bin/env node
import * as path from "path";
import * as fs from 'fs';
import { ESLint } from "eslint";
import {
  EntityMessage,
  JsonMessage,
  MethodMessage,
} from "eslint-plugin-typeorm-analyzer/messages";

const lintCodebase = async (rootDir: string) => {
  const eslint = new ESLint({
    useEslintrc: false,
    overrideConfig: {
        parser: '@typescript-eslint/parser',
        parserOptions: {
          project: true,
        },
        plugins: ['typeorm-analyzer'],
        rules: {
          "typeorm-analyzer/find-schema": "warn",
          "typeorm-analyzer/find-api": "warn",
        },
    },
  });

  const files = await getAllFiles(rootDir);

  console.log("Linting {} files", files.length);

  const reports = await Promise.all(
    files.map(async (file) => {
      const code = fs.readFileSync(file, 'utf8');
      const report = await eslint.lintText(code, { filePath: file });
      return report;
    })
  );

  reports.forEach((report) => {
    if (report[0].messages.length > 0) {
      console.error(`Lint Report for ${report[0].filePath}:`);
      report[0].messages.forEach((message) => {
        console.error(`  - ${message.message} (rule: ${message.ruleId})`);
      });
    }
  });
};

async function getAllFiles(dir: string): Promise<string[]> {
  const files = await fs.promises.readdir(dir);
  const allFiles = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      console.log("Checking file:", filePath);
      if ((await fs.promises.stat(filePath)).isDirectory()) {
        // Skip node_modules
        if (filePath.includes('node_modules')) {
          return [];
        }
        return getAllFiles(filePath);
      } else {
        // Only return TypeScript files
        if (!filePath.endsWith('.ts')) {
          return [];
        }
        return filePath;
      }
    })
  );
  return allFiles.flat();
}

// Entry point for npx execution
if (require.main === module) {
  const rootDir = process.argv[2];
  if (!rootDir) {
    console.error('Please provide the root directory of the codebase to lint.');
    process.exit(1);
  }
  lintCodebase(rootDir)
    .then(() => console.log('Linting complete.'))
    .catch((error) => console.error(error));
}

