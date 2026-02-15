import { injectable } from "tsyringe";
import type { Transaction } from "../../types";

/**
 * Service to read CSV files from disk.
 */
@injectable()
export class CsvReaderService {
  /**
   * Reads a CSV file and returns an array of transactions.
   * @param inputPath Absolute path to the CSV file
   * @returns Parsed transactions
   */
  async read(inputPath: string): Promise<Transaction[]> {
    // TODO: read file and parse CSV into Transaction[]
    void inputPath;
    return [];
  }
}
