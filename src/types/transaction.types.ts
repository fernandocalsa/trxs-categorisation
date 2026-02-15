/** Transaction type: bank transfer, card transaction or invoice */
export enum TransactionType {
  BANK_TRANSFER = "BANK_TRANSFER",
  CARD_TRANSACTION = "CARD_TRANSACTION",
  INVOICE = "INVOICE",
}

/** Payment channel: offline, online or atm */
export enum ChannelType {
  ATM = "ATM",
  POS = "POS",
  ECOMMERCE = "ECOMMERCE",
}

/**
 * Transaction record; same shape whether read from CSV or another source.
 * Required: merchant_name, transaction_type, transaction_id.
 * All other fields are optional (string | null or number | null per spec).
 */
export interface Transaction {
  /** Merchant name or description [1..255] */
  merchant_name: string;
  /** Type of transaction */
  transaction_type: TransactionType;
  /** Transaction id from API user, must be unique [1..255] */
  transaction_id: string;
  /** Country in ISO 3166 alpha-3 (e.g. ESP) */
  merchant_country?: string | null;
  /** Merchant category code, 4 digits (e.g. 8699) */
  merchant_category_code?: number | null;
  /** City where the transaction happened [1..255] */
  merchant_city?: string | null;
  /** Unique identifier of the merchant (card acceptor) [1..255] */
  merchant_id?: string | null;
  /** When the purchase took place, UTC YYYY-mm-ddTHH:MM:SS[.sssssss]Z */
  transaction_timestamp?: string | null;
  /** Amount, max 2 decimals (e.g. 10.99) */
  transaction_amount?: string | null;
  /** Currency in ISO 4217 (e.g. EUR) */
  transaction_currency?: string | null;
  /** Reference text, only for bank transfers [1..255] */
  transaction_reference_text?: string | null;
  /** Customer's account id, unique on API user system [1..255] */
  account_id?: string | null;
  /** Payment channel */
  channel_type?: ChannelType | null;
  /** Tax identification / VAT number [1..30] */
  vat?: string | null;
}
