import { isAxiosError, type AxiosInstance } from "axios";
import { inject, injectable } from "tsyringe";
import type { Transaction } from "../../types";

export interface TripleEnrichCategory {
  name: string;
}

export interface TripleEnrichResponse {
  transaction_id: string;
  visual_enrichments: {
    merchant_clean_name: string;
    merchant_logo_link: string;
    default_logo: boolean;
    merchant_category: string;
    google_places_id: string;
    merchant_website: string;
    updated: string;
    brand_id: string;
  };
  merchant_location: {
    enabled: boolean;
    coordinates: {
      lat: string;
      lon: string;
    };
    address: {
      country: string;
      city: string;
      zip_code: string;
      street: string;
    };
    location_id: string;
  };
  subscriptions: {
    enabled: boolean;
    is_recurring: boolean;
  };
  co2_footprint: {
    enabled: boolean;
    emissions: string;
  };
  updated: string;
  fraud: {
    enabled: boolean;
    merchant_flagged: boolean;
  };
  categories: TripleEnrichCategory[];
  contact: {
    enabled: boolean;
    phone: string;
    email: string;
    website: string;
  };
  payment_processor: {
    enabled: boolean;
    name: string;
    logo_url: string;
    brand_id: string;
  };
}

export class TripleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly responseBody: unknown,
    public readonly responseHeaders: unknown,
    public readonly originalError: unknown,
  ) {
    super(message);
    this.name = "TripleApiError";
  }
}

@injectable()
export class TripleService {
  constructor(
    @inject("TripleAxiosClient")
    protected readonly axiosClient: AxiosInstance,
  ) {}

  async enrich(transaction: Transaction): Promise<TripleEnrichResponse> {
    try {
      const response = await this.axiosClient.post<TripleEnrichResponse>(
        "/v1/enrich-transaction/",
        transaction,
      );

      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new TripleApiError(
          "Triple API request failed.",
          error.response?.status ?? null,
          error.response?.data ?? null,
          error.response?.headers ?? null,
          error,
        );
      }

      throw new TripleApiError(
        "Triple API request failed.",
        null,
        null,
        null,
        error,
      );
    }
  }
}
