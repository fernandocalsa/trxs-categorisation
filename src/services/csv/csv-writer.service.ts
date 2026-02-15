import { injectable } from "tsyringe";
import type { CsvContent } from "./csv.types";

/**
 * Service to write CSV content to a file.
 */
@injectable()
export class CsvWriterService {
  /**
   * Writes CSV content to the given path.
   * @param outputPath Absolute path for the output CSV file
   * @param content CSV content (headers and rows) to write
   */
  async write(outputPath: string, content: CsvContent): Promise<void> {
    // TODO: serialize content to CSV and write to outputPath
    void outputPath;
    void content;
  }
}
