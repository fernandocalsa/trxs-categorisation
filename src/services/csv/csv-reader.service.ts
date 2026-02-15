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

  /**
   * Reads a CSV file line-by-line and yields one transaction at a time.
   * @param inputPath Absolute path to the CSV file
   * @returns Async iterable of parsed transactions
   */
  async *read(inputPath: string): AsyncGenerator<Transaction> {
    const parser = createReadStream(inputPath, "utf-8").pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }),
    ) as AsyncIterable<Record<string, string>>;

    for await (const row of parser) {
      yield this.csvParser.parseRow(row as Record<string, string>);
    }
  }
}
