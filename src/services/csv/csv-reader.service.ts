import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { injectable } from "tsyringe";
import type { Transaction } from "../../types";
import { CsvParser } from "./csv-parser";

export interface ReadOptions {
  /** Number of transactions per batch. Default 100. */
  batchSize?: number;
}

/**
 * Service to read CSV files from disk.
 * Expects the input CSV to have a header row with columns matching the Transaction
 * fields (e.g. merchant_name, transaction_type, transaction_id, etc.). See CSV_COLUMNS.
 */
@injectable()
export class CsvReaderService {
  private readonly defaultBatchSize = 100;

  constructor(private readonly csvParser: CsvParser) {}

  /**
   * Reads a CSV file and yields batches of transactions.
   * @param inputPath Absolute path to the CSV file
   * @param options Optional batch size (default 100)
   * @returns Async iterable of transaction batches
   */
  read(
    inputPath: string,
    options?: ReadOptions,
  ): AsyncIterable<Transaction[]> {
    const batchSize = options?.batchSize ?? this.defaultBatchSize;
    const csvParser = this.csvParser;

    return {
      [Symbol.asyncIterator]: async function* (): AsyncGenerator<Transaction[]> {
        const parser = createReadStream(inputPath, "utf-8").pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
          }),
        ) as AsyncIterable<Record<string, string>>;

        let batch: Transaction[] = [];

        for await (const row of parser) {
          batch.push(csvParser.parseRow(row as Record<string, string>));
          if (batch.length >= batchSize) {
            yield batch;
            batch = [];
          }
        }

        if (batch.length > 0) {
          yield batch;
        }
      },
    };
  }
}
