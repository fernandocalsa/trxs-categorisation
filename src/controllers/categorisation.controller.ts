import * as fs from "fs";
import * as path from "path";
import { injectable } from "tsyringe";
import type { Transaction } from "../types";
import { CsvReaderService, CsvWriterService } from "../services";

/**
 * Handles the categorisation flow: validates paths, reads CSV, writes results.
 */
@injectable()
export class CategorisationController {
  constructor(
    private readonly csvReader: CsvReaderService,
    private readonly csvWriter: CsvWriterService,
  ) {}

  private validate(args: string[]): { inputPath: string; outputPath: string } {
    if (args.length === 0) {
      console.error("Error: missing input file path.");
      console.error("Usage: trxcategorisation <input-file> [output-file]");
      process.exit(1);
    }

    if (args.length > 2) {
      console.error(
        "Error: expected at most two arguments (input file and optional output file).",
      );
      console.error("Usage: trxcategorisation <input-file> [output-file]");
      process.exit(1);
    }

    const inputPath = path.resolve(args[0]);
    const outputPath =
      args.length === 2 ? path.resolve(args[1]) : `${inputPath}.output`;

    if (!fs.existsSync(inputPath)) {
      console.error(`Error: file not found: ${inputPath}`);
      process.exit(1);
    }

    const stat = fs.statSync(inputPath);
    if (!stat.isFile()) {
      console.error(`Error: path is not a file: ${inputPath}`);
      process.exit(1);
    }

    if (inputPath === outputPath) {
      console.error(
        "Error: input and output file paths must not be the same.",
      );
      process.exit(1);
    }

    return { inputPath, outputPath };
  }

  async run(args: string[]): Promise<void> {
    const { inputPath, outputPath } = this.validate(args);

    const allRows: Transaction[] = [];
    for await (const batch of this.csvReader.read(inputPath)) {
      // TODO: run HTTP requests using batch, enrich or transform
      allRows.push(...batch);
    }

    await this.csvWriter.write(outputPath, allRows);
  }
}
