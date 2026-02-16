# trxcategorisation

CLI tool that reads a transactions CSV, enriches each row with the Triple API, and writes an output CSV with:

- original transaction columns
- flattened Triple enriched fields
- raw request/response metadata per row

## Requirements

- Node.js 20+
- npm
- (optional) Bun, if you want standalone binaries

## Install

```bash
npm install
```

## Run

### Development (TypeScript)

```bash
npm run dev -- <inputFile> [outputFile] --token <TOKEN> [options]
```

### Compiled JS

```bash
npm run cli -- <inputFile> [outputFile] --token <TOKEN> [options]
```

## CLI Usage

```bash
trxcategorisation <inputFile> [outputFile] --token <TOKEN> [--environment sandbox|production] [--batch-size N] [--delay S]
```

### Required

- `<inputFile>`: source CSV file
- `--token`: Triple API token

### Optional

- `[outputFile]`: destination CSV path
  - default: same directory, same extension, with `-output` suffix
  - example: `transactions.csv` -> `transactions-output.csv`
- `--environment`: `sandbox` (default) or `production`
  - `sandbox` -> `https://api.sandbox.tripledev.app/api`
  - `production` -> `https://api.triple.app/api`
- `--batch-size`: batch size for concurrent requests (default `10`)
- `--delay`: seconds to wait between batches (default `0`)

### Example

```bash
npm run cli -- ./data/input.csv --token tr_test_xxx --environment sandbox --batch-size 20 --delay 2
```

## Processing Flow

1. Read input CSV as a stream, one transaction at a time.
2. Group transactions in batches of `batch-size`.
3. For each batch, call Triple concurrently using `Promise.allSettled`.
4. Write each result row immediately to output stream (no full in-memory accumulation).
5. Wait `delay` seconds before next batch.

If a request fails:

- enriched columns are left empty
- raw request/response columns are still written

## Output CSV

The output CSV contains:

- all original transaction columns (`src/services/csv/csv-columns.ts`)
- Triple flattened columns (`triple_*`)
- raw metadata columns:
  - `triple_raw_request_body`
  - `triple_raw_request_headers`
  - `triple_raw_request_timestamp`
  - `triple_raw_response_status`
  - `triple_raw_response_body`
  - `triple_raw_response_headers`

`triple_category` and `triple_subcategory` come from `categories[0]` and `categories[1]`.

## Build

```bash
npm run build
```

## Standalone Binaries (Bun)

```bash
npm run compile:binaries
```

Generates:

- `bin/trxcategorisation-macos-arm64`
- `bin/trxcategorisation-linux-x64`
- `bin/trxcategorisation-linux-arm64`

## Project Structure

```text
src/
  cli.ts                               # CLI definition (cac) and argument validation
  controllers/
    categorisation.controller.ts       # Orchestration: validate paths, batching, streaming write
  services/
    csv/
      csv-reader.service.ts            # Stream CSV reader
      csv-parser.ts                    # Row -> Transaction parser (UUID fallback)
      csv-writer.service.ts            # Stream CSV writer (input + enrich + raw)
      csv-columns.ts                   # Input CSV columns
    triple/
      triple.service.ts                # Triple HTTP client + typed response/error models
  types/
    transaction.types.ts               # Domain transaction types
```

## Notes

- Dependency injection is used for CSV reader/writer/parser orchestration (`tsyringe`).
- TripleService is instantiated with CLI-provided environment/token.
- No test suite is included yet (`npm test` is a placeholder).
