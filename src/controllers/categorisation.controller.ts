import * as fs from "fs";
import * as path from "path";
import { injectable } from "tsyringe";
import {
  TripleApiError,
  TripleService,
  type TripleEnvironment,
  type TripleEnrichResult,
} from "../services";
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

  private validate(args: [string] | [string, string]): { inputPath: string; outputPath: string } {
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
      throw new Error(`File not found: ${inputPath}`);
    }

    const stat = fs.statSync(inputPath);
    if (!stat.isFile()) {
      throw new Error(`Path is not a file: ${inputPath}`);
    }

    if (inputPath === outputPath) {
      throw new Error("Input and output file paths must not be the same.");
    }

    return { inputPath, outputPath };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toFailedEnrichResult(error: unknown): TripleEnrichResult {
    if (!(error instanceof TripleApiError)) {
      throw error;
    }

    return {
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

  private async processBatch(
    batch: Transaction[],
    outputStream: ReturnType<CsvWriterService["open"]>,
    tripleService: TripleService,
  ): Promise<void> {
    const settledResults = await Promise.allSettled(
      batch.map((transaction) => tripleService.enrich(transaction)),
    );

    for (let index = 0; index < batch.length; index += 1) {
      const transaction = batch[index];
      const settledResult = settledResults[index];
      const enrichResult =
        settledResult.status === "fulfilled"
          ? settledResult.value
          : this.toFailedEnrichResult(settledResult.reason);

      await this.csvWriter.writeLine(outputStream, transaction, enrichResult);
    }
  }

  async run(
    args: [string] | [string, string],
    batchSize: number,
    batchDelay: number,
    environment: TripleEnvironment,
    token: string,
  ): Promise<void> {
    const { inputPath, outputPath } = this.validate(args);
    const tripleService = new TripleService(environment, token);

    const outputStream = this.csvWriter.open(outputPath);
    try {
      let batch: Transaction[] = [];
      for await (const transaction of this.csvReader.read(inputPath)) {
        batch.push(transaction);
        if (batch.length >= batchSize) {
          await this.processBatch(batch, outputStream, tripleService);
          batch = [];
          if (batchDelay > 0) {
            await this.sleep(batchDelay * 1000);
          }
        }
      }

      if (batch.length > 0) {
        await this.processBatch(batch, outputStream, tripleService);
      }
    } finally {
      await this.csvWriter.close(outputStream);
    }
  }
}
