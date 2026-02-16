#!/usr/bin/env node

import { cac } from "cac";
import "reflect-metadata";
import { container } from "tsyringe";
import { CategorisationController } from "./controllers";
import type { TripleEnvironment } from "./services";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_DELAY = 0;
const DEFAULT_ENVIRONMENT = "sandbox";

/**
 * CLI entry point: parses CLI args and runs categorisation.
 * Usage: trxcategorisation <input-file> [output-file]
 *        trxcategorisation --help
 */
function main() {
  const cli = cac("trxcategorisation");

  cli
    .command("<inputFile> [outputFile]")
    .option("--environment <environment>", "Triple environment", {
      default: DEFAULT_ENVIRONMENT,
    })
    .option("--token <token>", "Triple API token (required)")
    .option("--batch-size <batchSize>", "Number of transactions per batch", {
      default: [DEFAULT_BATCH_SIZE],
      type: [Number],
    })
    .option(
      "--delay <delay>",
      "Seconds to wait between batches",
      {
        default: [DEFAULT_BATCH_DELAY],
        type: [Number],
      },
    )
    .action(async (inputFile, outputFile, options) => {
      const args: [string] | [string, string] =
        typeof outputFile === "string" && outputFile.length > 0
          ? [inputFile, outputFile]
          : [inputFile];
      const environment = options.environment as TripleEnvironment;
      const token = options.token as string;
      const batchSize = options.batchSize[0] as number;
      const batchDelay = options.delay[0] as number;

      if (environment !== "sandbox" && environment !== "production") {
        console.error("--environment must be either 'sandbox' or 'production'.");
        return;
      }

      if (batchSize < 1) {
        console.error("--batch-size must be an integer greater than or equal to 1.");
        return;
      }

      if (batchDelay < 0) {
        console.error("--delay must be an integer greater than or equal to 0.");
        return;
      }

      if (typeof token !== "string" || token.trim() === "") {
        console.error("--token is required.");
        return;
      }

      const categorisationController = container.resolve(CategorisationController);
      await categorisationController.run(
        args,
        batchSize,
        batchDelay,
        environment,
        token,
      );
    });

  cli.help();
  cli.parse();
}

main()
