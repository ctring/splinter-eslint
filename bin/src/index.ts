#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { ESLint } from "eslint";
import { parseArgs } from "util";
import { glob } from "glob";
import pluralize from "pluralize";
import { JsonMessage } from '@ctring/eslint-plugin-typeorm/messages';

export interface Result {
  filePath: string;
  fromLine: number;
  toLine: number;
  fromColumn: number;
  toColumn: number;
  message: JsonMessage;
}

export interface Output {
  results: Result[];
  doneFiles: string[];
}

async function analyze(
  rootDir: string,
  include: string,
  exclude: string,
  outDir: string,
  continueFromExistingOutput: boolean,
  batch: number | null
) {
  const absRootDir = path.resolve(rootDir);
  const eslint = new ESLint({
    useEslintrc: false,
    allowInlineConfig: false,
    overrideConfig: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: "**/tsconfig.json",
        tsconfigRootDir: absRootDir,
      },
      plugins: ['@ctring/typeorm'],
      rules: {
        "@ctring/typeorm/find-schema": "warn",
        "@ctring/typeorm/find-api": "warn",
      },
    },
  });

  console.log(`Finding files matching ${JSON.stringify({ root: absRootDir, include, exclude }, null, 4)}`);
  const files = await glob(include, { ignore: exclude, cwd: absRootDir, absolute: false });

  console.log(`Found ${files.length} ${pluralize("file", files.length)}`);

  const results: Result[] = [];
  const doneFiles: Set<string> = new Set();

  // Load existing output if needed
  if (continueFromExistingOutput && fs.existsSync(outDir)) {
    const existingOutput = fs.readFileSync(outDir, 'utf8');
    const output = JSON.parse(existingOutput) as Output;

    output.results.forEach((result) => {
      results.push(result);
    });

    output.doneFiles.forEach((file) => {
      doneFiles.add(file);
    });
  }

  const batchSize = batch ?? files.length;
  for (let i = 0; i < files.length; i += batchSize) {
    const unskippedFileBatch = files.slice(i, i + batchSize);
    const fileBatch = unskippedFileBatch.filter((file) => !doneFiles.has(file));

    // Compute number of skipped files
    const skippedFiles = unskippedFileBatch.length - fileBatch.length;
    if (skippedFiles > 0) {
      console.info(`Skipped ${skippedFiles} ${pluralize("file", skippedFiles)}`)
    }

    // Analyze a batch of files
    const reports = await Promise.all(
      fileBatch.map(async (file) => {
        const filePath = path.join(absRootDir, file);
        const code = await fs.promises.readFile(filePath, 'utf8');
        const report = await eslint.lintText(code, { filePath });
        return report;
      })
    );

    const tryParse = (message: string) => {
      try {
        return JSON.parse(message) as JsonMessage;
      } catch (e) {
        return null;
      }
    }

    // Process the results
    for (const report of reports) {
      for (const lintResult of report) {
        const relativePath = path.relative(absRootDir, lintResult.filePath);
        for (const message of lintResult.messages) {
          let parsed = tryParse(message.message);
          if (parsed) {
            const result: Result = {
              filePath: relativePath,
              fromLine: message.line - 1,
              toLine: (message.endLine || message.line) - 1,
              fromColumn: message.column - 1,
              toColumn: (message.endColumn || message.column) - 1,
              message: parsed,
            };
            results.push(result);
          } else {
            console.error(message.message);
          }
        }
      }
    }

    fileBatch.forEach((file) => {
      doneFiles.add(file);
    });

    // Write output
    const output: Output = {
      results,
      doneFiles: Array.from(doneFiles),
    };
    fs.writeFileSync(outDir, JSON.stringify(output, null, 4));

    // Print progress
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
      output: {
        type: "string",
        default: "messages.json"
      },
      continue: {
        type: "boolean",
        default: false,
      }
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
  const output = args.values.output!;
  const continueFromExistingOutput = args.values.continue!;

  analyze(
    targetPath,
    include,
    exclude,
    output,
    continueFromExistingOutput,
    batch
  )
    .catch((error) => console.error(error));
}

export {
  EntityMessage,
  JsonMessage,
  MethodMessage,
} from "@ctring/eslint-plugin-typeorm/messages";
