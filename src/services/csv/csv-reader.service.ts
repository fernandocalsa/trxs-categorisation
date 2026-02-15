import { injectable } from "tsyringe";
import type { CsvContent } from "./csv.types";

/**
 * Service to read CSV files from disk.
 */
@injectable()
export class CsvReaderService {
  /**
   * Reads a CSV file and returns its content (headers and rows).
   * @param inputPath Absolute path to the CSV file
   * @returns Parsed CSV content
   */
  async read(inputPath: string): Promise<CsvContent> {
    // TODO: read file and parse CSV
    void inputPath;
    return { headers: [], rows: [] };
  }
}
