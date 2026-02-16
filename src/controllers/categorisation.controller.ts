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

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${seconds === 1 ? "" : "s"}`;
    }

    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  private printProgress(
    processed: number,
    total: number,
    ok: number,
    failed: number,
  ): void {
    const percentage = total === 0 ? 100 : (processed / total) * 100;
    process.stdout.write(
      `\rBatch processed: ${processed}/${total} (${percentage.toFixed(2)}%) | ok: ${ok} | failed: ${failed}`,
    );
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
  ): Promise<{ ok: number; failed: number }> {
    const settledResults = await Promise.allSettled(
      batch.map((transaction) => tripleService.enrich(transaction)),
    );
    let ok = 0;
    let failed = 0;

    for (let index = 0; index < batch.length; index += 1) {
      const transaction = batch[index];
      const settledResult = settledResults[index];
      if (settledResult.status === "fulfilled") {
        ok += 1;
      } else {
        failed += 1;
      }
      const enrichResult =
        settledResult.status === "fulfilled"
          ? settledResult.value
          : this.toFailedEnrichResult(settledResult.reason);

      await this.csvWriter.writeLine(outputStream, transaction, enrichResult);
    }

    return { ok, failed };
  }

  async run(
    args: [string] | [string, string],
    batchSize: number,
    batchDelay: number,
    environment: TripleEnvironment,
    token: string,
  ): Promise<void> {
    const startTime = Date.now();
    const { inputPath, outputPath } = this.validate(args);
    const totalTransactions = await this.csvReader.count(inputPath);
    console.log(`Total transactions to process: ${totalTransactions}`);
    const tripleService = new TripleService(environment, token);
    let processedTransactions = 0;
    let okTransactions = 0;
    let failedTransactions = 0;

    const outputStream = this.csvWriter.open(outputPath);
    try {
      let batch: Transaction[] = [];
      for await (const transaction of this.csvReader.read(inputPath)) {
        batch.push(transaction);
        if (batch.length >= batchSize) {
          const { ok, failed } = await this.processBatch(
            batch,
            outputStream,
            tripleService,
          );
          processedTransactions += batch.length;
          okTransactions += ok;
          failedTransactions += failed;
          this.printProgress(
            processedTransactions,
            totalTransactions,
            okTransactions,
            failedTransactions,
          );
          batch = [];
          if (batchDelay > 0) {
            await this.sleep(batchDelay * 1000);
          }
        }
      }

      if (batch.length > 0) {
        const { ok, failed } = await this.processBatch(
          batch,
          outputStream,
          tripleService,
        );
        processedTransactions += batch.length;
        okTransactions += ok;
        failedTransactions += failed;
        this.printProgress(
          processedTransactions,
          totalTransactions,
          okTransactions,
          failedTransactions,
        );
      }
    } finally {
      await this.csvWriter.close(outputStream);
    }

    const elapsedMs = Date.now() - startTime;
    process.stdout.write("\n");
    console.log(`Processing completed in ${this.formatDuration(elapsedMs)}.`);
  }
}
