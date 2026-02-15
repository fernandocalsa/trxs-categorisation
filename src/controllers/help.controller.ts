import { injectable } from "tsyringe";

/**
 * Handles the --help / -h flow: prints usage and exits.
 */
@injectable()
export class HelpController {
  run(): void {
    console.log("Usage: trxcategorisation <input-file> [output-file]");
    console.log("");
    console.log("Arguments:");
    console.log("  input-file   Path to the input file (required)");
    console.log(
      "  output-file Path for the output file (optional; default: <input-file>.output)",
    );
    console.log("");
    console.log('Paths containing spaces must be quoted (e.g. "my file.txt").');
    console.log("");
    console.log("Options:");
    console.log("  --help, -h   Show this help");
    process.exit(0);
  }
}
