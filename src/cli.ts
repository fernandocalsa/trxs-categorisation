#!/usr/bin/env node

import "reflect-metadata";
import { container } from "tsyringe";
import { Router } from "./controllers";

/**
 * CLI entry point: passes arguments to the router.
 * Usage: trxcategorisation <input-file> [output-file]
 *        trxcategorisation --help
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const router = container.resolve(Router);
  await router.route(args);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
