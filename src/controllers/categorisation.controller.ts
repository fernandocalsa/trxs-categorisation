import * as fs from "fs";
import * as path from "path";
import { injectable } from "tsyringe";
import {
  TripleApiError,
  TripleService,
  type TripleEnrichResult,
} from "../services";
import { CsvReaderService, CsvWriterService } from "../services";

/**
 * Handles the categorisation flow: validates paths, reads CSV, writes results.
 */
@injectable()
export class CategorisationController {
  constructor(
    private readonly csvReader: CsvReaderService,
    private readonly csvWriter: CsvWriterService,
    private readonly tripleService: TripleService,
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
    const outputPath = (() => {
      if (args.length === 2) {
        return path.resolve(args[1]);
      }

      const parsed = path.parse(inputPath);
      const ext = parsed.ext || ".csv";
      return path.join(parsed.dir, `${parsed.name}-output${ext}`);
    })();

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

    const outputStream = this.csvWriter.open(outputPath);
    try {
      for await (const transaction of this.csvReader.read(inputPath)) {
        let enrichResult: TripleEnrichResult;
        try {
          enrichResult = await this.tripleService.enrich(transaction);
        } catch (error) {
          if (!(error instanceof TripleApiError)) {
            throw error;
          }

          enrichResult = {
            enriched: null,
            raw: {
              request: error.request,
              response: error.response ?? {
                status: null,
                body: null,
                headers: null,
              },
            },
          };
        }

        await this.csvWriter.writeLine(
          outputStream,
          transaction,
          enrichResult,
        );
      }
    } finally {
      await this.csvWriter.close(outputStream);
    }
  }
}
