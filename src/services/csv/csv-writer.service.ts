import { injectable } from "tsyringe";
import type { Transaction } from "../../types";

/**
 * Service to write CSV content to a file.
 */
@injectable()
export class CsvWriterService {
  /**
   * Writes transactions to a CSV file.
   * @param outputPath Absolute path for the output CSV file
   * @param rows Transactions to write
   */
  async write(outputPath: string, rows: Transaction[]): Promise<void> {
    // TODO: serialize rows to CSV and write to outputPath
    void outputPath;
    void rows;
  }
}
