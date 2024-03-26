#!/usr/bin/env node
import * as fs from 'fs';
import { ESLint } from "eslint";
import { parseArgs } from "util";
import { glob } from "glob";
import pluralize from "pluralize";

const analyze = async (rootDir: string, include: string, exclude: string, batch: number | null) => {
  const eslint = new ESLint({
    useEslintrc: false,
    allowInlineConfig: false,
    overrideConfig: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: "**/tsconfig.json",
        tsconfigRootDir: rootDir,
      },
      plugins: ['@ctring/typeorm'],
      rules: {
        "@ctring/typeorm/find-schema": "warn",
        "@ctring/typeorm/find-api": "warn",
      },
    },
  });

  console.log(`Finding files matching ${JSON.stringify({ rootDir, include, exclude }, null, 4)}`);
  const files = await glob(include, { ignore: exclude, cwd: rootDir, absolute: true });

  console.log(`Found ${files.length} ${pluralize("file", files.length)}`);

  const batchSize = batch ?? files.length;
  for (let i = 0; i < files.length; i += batchSize) {
    const fileBatch = files.slice(i, i + batchSize);

    const reports = await Promise.all(
      fileBatch.map(async (file) => {
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

    if (batchSize) {
      const done = Math.min(i + batchSize, files.length);
      const progressPct = Math.min((done / files.length) * 100, 100);
      console.info(`Analyzing... ${progressPct.toFixed(2)}% (${done}/${files.length})`);
    }
  }
};

// Entry point for npx execution
if (require.main === module) {
  const args = parseArgs({
    allowPositionals: true,
    options: {
      include: {
        type: "string",
        default: "**/*.ts",
      },
      exclude: {
        type: "string",
        default: "node_modules",
      },
      batch: {
        type: "string",
      },
    }
  });

  const targetPath = args.positionals[0];
  if (!targetPath) {
    console.error("Error: must provide a root dir.");
    console.info("Usage: npx @ctring/splinter-eslint-plugin-typeorm <path>")
    process.exit(1);
  }

  const batch = args.values.batch ? parseInt(args.values.batch) : null;
  const include = args.values.include!;
  const exclude = args.values.exclude!;

  analyze(targetPath, include, exclude, batch).catch((error) => console.error(error));
}

export {
  EntityMessage,
  JsonMessage,
  MethodMessage,
} from "@ctring/eslint-plugin-typeorm/messages";