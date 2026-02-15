import {
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestHeaders,
} from "axios";
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

export interface TripleEnrichResult {
  enriched: TripleEnrichResponse | null;
  raw: {
    request: TripleRawRequest;
    response: TripleRawResponse;
  };
}

export interface TripleRawRequest {
  body: unknown;
  headers: unknown;
  timestamp: string;
}

export interface TripleRawResponse {
  status: number | null;
  body: unknown;
  headers: unknown;
}

export class TripleApiError extends Error {
  constructor(
    message: string,
    public readonly request: TripleRawRequest,
    public readonly response: TripleRawResponse | undefined,
    public readonly error: unknown,
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

  private stripAuthorization(
    headers: AxiosRequestHeaders | undefined,
  ): Record<string, unknown> {
    if (!headers) return {};
    const plainHeaders = headers.toJSON() as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(plainHeaders)) {
      if (key.toLowerCase() !== "authorization") {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  async enrich(transaction: Transaction): Promise<TripleEnrichResult> {
    const timestamp = new Date().toISOString();
    try {
      const response = await this.axiosClient.post<TripleEnrichResponse>(
        "/v1/enrich-transaction/",
        transaction,
      );

      return {
        enriched: response.data,
        raw: {
          request: {
            body: transaction,
            headers: this.stripAuthorization(response.config.headers),
            timestamp,
          },
          response: {
            status: response.status,
            body: response.data,
            headers: response.headers,
          },
        },
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const request: TripleRawRequest = {
          body: transaction,
          headers: this.stripAuthorization(error.config?.headers),
          timestamp,
        };
        const response: TripleRawResponse = {
          status: error.response?.status ?? null,
          body: error.response?.data ?? null,
          headers: error.response?.headers ?? null,
        };

        throw new TripleApiError(
          "Triple API request failed.",
          request,
          response,
          error,
        );
      }

      throw new TripleApiError(
        "Triple API request failed.",
        {
          body: transaction,
          headers: {},
          timestamp,
        },
        undefined,
        error,
      );
    }
  }
}
