import { createWriteStream, type WriteStream } from "fs";
import { once } from "events";
import { injectable } from "tsyringe";
import type { TripleEnrichResult } from "../triple";
import type { Transaction } from "../../types";
import { CSV_COLUMNS } from "./csv-columns";

const TRIPLE_COLUMNS = [
  "triple_transaction_id",
  "triple_visual_enrichments_merchant_clean_name",
  "triple_visual_enrichments_merchant_logo_link",
  "triple_visual_enrichments_default_logo",
  "triple_visual_enrichments_merchant_category",
  "triple_visual_enrichments_google_places_id",
  "triple_visual_enrichments_merchant_website",
  "triple_visual_enrichments_updated",
  "triple_visual_enrichments_brand_id",
  "triple_merchant_location_enabled",
  "triple_merchant_location_coordinates_lat",
  "triple_merchant_location_coordinates_lon",
  "triple_merchant_location_address_country",
  "triple_merchant_location_address_city",
  "triple_merchant_location_address_zip_code",
  "triple_merchant_location_address_street",
  "triple_merchant_location_location_id",
  "triple_subscriptions_enabled",
  "triple_subscriptions_is_recurring",
  "triple_co2_footprint_enabled",
  "triple_co2_footprint_emissions",
  "triple_updated",
  "triple_fraud_enabled",
  "triple_fraud_merchant_flagged",
  "triple_category",
  "triple_subcategory",
  "triple_contact_enabled",
  "triple_contact_phone",
  "triple_contact_email",
  "triple_contact_website",
  "triple_payment_processor_enabled",
  "triple_payment_processor_name",
  "triple_payment_processor_logo_url",
  "triple_payment_processor_brand_id",
  "triple_raw_request_body",
  "triple_raw_request_headers",
  "triple_raw_request_timestamp",
  "triple_raw_response_status",
  "triple_raw_response_body",
  "triple_raw_response_headers",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (
    text.includes(",") ||
    text.includes("\"") ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}

/**
 * Service to write streamed CSV output to a file.
 */
@injectable()
export class CsvWriterService {
  /**
   * Creates a writable output stream.
   */
  open(outputPath: string): WriteStream {
    const stream = createWriteStream(outputPath, { encoding: "utf-8" });
    const header = [...CSV_COLUMNS, ...TRIPLE_COLUMNS].join(",");
    stream.write(`${header}\n`);
    return stream;
  }

  /**
   * Writes one CSV row and respects stream backpressure.
   */
  async writeLine(
    stream: WriteStream,
    transaction: Transaction,
    tripleResult: TripleEnrichResult,
  ): Promise<void> {
    const tripleResponse = tripleResult.enriched;
    const transactionValues = CSV_COLUMNS.map((column) =>
      csvEscape(transaction[column]),
    );

    const tripleValues = [
      csvEscape(tripleResponse?.transaction_id ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.merchant_clean_name ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.merchant_logo_link ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.default_logo ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.merchant_category ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.google_places_id ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.merchant_website ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.updated ?? ""),
      csvEscape(tripleResponse?.visual_enrichments.brand_id ?? ""),
      csvEscape(tripleResponse?.merchant_location.enabled ?? ""),
      csvEscape(tripleResponse?.merchant_location.coordinates.lat ?? ""),
      csvEscape(tripleResponse?.merchant_location.coordinates.lon ?? ""),
      csvEscape(tripleResponse?.merchant_location.address.country ?? ""),
      csvEscape(tripleResponse?.merchant_location.address.city ?? ""),
      csvEscape(tripleResponse?.merchant_location.address.zip_code ?? ""),
      csvEscape(tripleResponse?.merchant_location.address.street ?? ""),
      csvEscape(tripleResponse?.merchant_location.location_id ?? ""),
      csvEscape(tripleResponse?.subscriptions.enabled ?? ""),
      csvEscape(tripleResponse?.subscriptions.is_recurring ?? ""),
      csvEscape(tripleResponse?.co2_footprint.enabled ?? ""),
      csvEscape(tripleResponse?.co2_footprint.emissions ?? ""),
      csvEscape(tripleResponse?.updated ?? ""),
      csvEscape(tripleResponse?.fraud.enabled ?? ""),
      csvEscape(tripleResponse?.fraud.merchant_flagged ?? ""),
      csvEscape(tripleResponse?.categories[0]?.name ?? ""),
      csvEscape(tripleResponse?.categories[1]?.name ?? ""),
      csvEscape(tripleResponse?.contact.enabled ?? ""),
      csvEscape(tripleResponse?.contact.phone ?? ""),
      csvEscape(tripleResponse?.contact.email ?? ""),
      csvEscape(tripleResponse?.contact.website ?? ""),
      csvEscape(tripleResponse?.payment_processor.enabled ?? ""),
      csvEscape(tripleResponse?.payment_processor.name ?? ""),
      csvEscape(tripleResponse?.payment_processor.logo_url ?? ""),
      csvEscape(tripleResponse?.payment_processor.brand_id ?? ""),
      csvEscape(JSON.stringify(tripleResult.raw.request.body)),
      csvEscape(JSON.stringify(tripleResult.raw.request.headers)),
      csvEscape(tripleResult.raw.request.timestamp),
      csvEscape(tripleResult.raw.response.status),
      csvEscape(JSON.stringify(tripleResult.raw.response.body)),
      csvEscape(JSON.stringify(tripleResult.raw.response.headers)),
    ];

    const line = `${[...transactionValues, ...tripleValues].join(",")}\n`;
    if (!stream.write(line)) {
      await once(stream, "drain");
    }
  }

  /**
   * Closes a writable stream and waits until all buffered data is flushed.
   */
  async close(stream: WriteStream): Promise<void> {
    stream.end();
    await once(stream, "finish");
  }
}
