import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { injectable } from "tsyringe";
import type { Transaction } from "../../types";
import { CsvParser } from "./csv-parser";

/**
 * Service to read CSV files from disk.
 * Expects the input CSV to have a header row with columns matching the Transaction
 * fields (e.g. merchant_name, transaction_type, transaction_id, etc.). See CSV_COLUMNS.
 */
@injectable()
export class CsvReaderService {
  constructor(private readonly csvParser: CsvParser) {}

  private createParserStream(inputPath: string): AsyncIterable<Record<string, string>> {
    return createReadStream(inputPath, "utf-8").pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }),
    ) as AsyncIterable<Record<string, string>>;
  }

  /**
   * Reads a CSV file line-by-line and yields one transaction at a time.
   * @param inputPath Absolute path to the CSV file
   * @returns Async iterable of parsed transactions
   */
  async *read(inputPath: string): AsyncGenerator<Transaction> {
    const parser = this.createParserStream(inputPath);

    for await (const row of parser) {
      yield this.csvParser.parseRow(row as Record<string, string>);
    }
  }

  /**
   * Counts the total number of transaction rows in a CSV file.
   */
  async count(inputPath: string): Promise<number> {
    const parser = this.createParserStream(inputPath);
    let total = 0;
    for await (const _row of parser) {
      total += 1;
    }
    return total;
  }
}
