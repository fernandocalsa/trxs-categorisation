#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

/**
 * CLI entry point.
 * Usage: trxcategorisation <input-file> [output-file]
 *        trxcategorisation --help
 */

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: missing input file path.");
    console.error("Usage: trxcategorisation <input-file> [output-file]");
    process.exit(1);
  }

  const first = args[0];
  if (first === "--help" || first === "-h") {
    console.log("Usage: trxcategorisation <input-file> [output-file]");
    console.log("");
    console.log("Arguments:");
    console.log("  input-file   Path to the input file (required)");
    console.log("  output-file Path for the output file (optional)");
    console.log("");
    console.log("Paths containing spaces must be quoted (e.g. \"my file.txt\").");
    console.log("");
    console.log("Options:");
    console.log("  --help, -h   Show this help");
    process.exit(0);
    return;
  }

  if (args.length > 2) {
    console.error("Error: expected at most two arguments (input file and optional output file).");
    console.error("Usage: trxcategorisation <input-file> [output-file]");
    process.exit(1);
  }

  const inputPath = path.resolve(first);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: file not found: ${inputPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(inputPath);
  if (!stat.isFile()) {
    console.error(`Error: path is not a file: ${inputPath}`);
    process.exit(1);
  }

  const outputPath = args.length === 2 ? path.resolve(args[1]) : undefined;

  if (outputPath !== undefined && inputPath === outputPath) {
    console.error("Error: input and output file paths must not be the same.");
    process.exit(1);
  }

  // Input (and optional output) paths are valid; proceed with your logic here
  console.log("Input file:", inputPath);
  if (outputPath !== undefined) {
    console.log("Output file:", outputPath);
  }
}

main();
