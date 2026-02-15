import type { Transaction } from "../../types";

/**
 * CSV column headers in the order they appear in the file.
 * Use when parsing or serialising CSV to/from Transaction[].
 */
export const CSV_COLUMNS: (keyof Transaction)[] = [
  "merchant_name",
  "transaction_type",
  "transaction_id",
  "merchant_country",
  "merchant_category_code",
  "merchant_city",
  "merchant_id",
  "transaction_timestamp",
  "transaction_amount",
  "transaction_currency",
  "transaction_reference_text",
  "account_id",
  "channel_type",
  "vat",
];
