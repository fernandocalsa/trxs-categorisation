import { injectable } from "tsyringe";
import type { Transaction } from "../../types";
import { ChannelType, TransactionType } from "../../types";

/**
 * Parses a CSV row (record keyed by column name) into a Transaction.
 */
@injectable()
export class CsvParser {
  /**
   * Converts a CSV row to a Transaction.
   * @param row Raw row object (e.g. from csv-parse with columns: true)
   * @returns Parsed transaction
   */
  parseRow(row: Record<string, string>): Transaction {
    const get = (key: keyof Transaction): string | undefined =>
      row[key as string]?.trim() || undefined;

    const transaction: Transaction = {
      merchant_name: get("merchant_name") ?? "",
      transaction_type: this.parseTransactionType(get("transaction_type")),
      transaction_id: get("transaction_id") ?? "",
    };

    const optionalString = (v: string | undefined) =>
      v === undefined || v === "" ? null : v;
    const optionalNumber = (v: string | undefined): number | null => {
      if (v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    transaction.merchant_country = optionalString(get("merchant_country"));
    transaction.merchant_category_code = optionalNumber(
      get("merchant_category_code"),
    );
    transaction.merchant_city = optionalString(get("merchant_city"));
    transaction.merchant_id = optionalString(get("merchant_id"));
    transaction.transaction_timestamp = optionalString(
      get("transaction_timestamp"),
    );
    transaction.transaction_amount = optionalString(get("transaction_amount"));
    transaction.transaction_currency = optionalString(
      get("transaction_currency"),
    );
    transaction.transaction_reference_text = optionalString(
      get("transaction_reference_text"),
    );
    transaction.account_id = optionalString(get("account_id"));
    transaction.channel_type = this.parseChannelType(get("channel_type"));
    transaction.vat = optionalString(get("vat"));

    return transaction;
  }

  private parseTransactionType(
    value: string | undefined,
  ): TransactionType {
    if (!value) return TransactionType.BANK_TRANSFER;
    const v = value.toUpperCase().replace(/-/g, "_");
    if (v === TransactionType.BANK_TRANSFER) return TransactionType.BANK_TRANSFER;
    if (v === TransactionType.CARD_TRANSACTION)
      return TransactionType.CARD_TRANSACTION;
    if (v === TransactionType.INVOICE) return TransactionType.INVOICE;
    return TransactionType.BANK_TRANSFER;
  }

  private parseChannelType(value: string | undefined): ChannelType | null {
    if (!value || value === "") return null;
    const v = value.toUpperCase();
    if (v === ChannelType.ATM) return ChannelType.ATM;
    if (v === ChannelType.POS) return ChannelType.POS;
    if (v === ChannelType.ECOMMERCE) return ChannelType.ECOMMERCE;
    return null;
  }
}
