/**
 * API Client Module
 *
 * Provides a typed client for communicating with the Contract Negotiator backend API.
 * Includes interfaces for all API responses and methods for each endpoint.
 *
 * @module lib/api
 */

/** API base URL from environment or default to localhost */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Risk level enum for type-safe risk level handling.
 * Used throughout the application for consistent risk level references.
 */
export const RiskLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

/** Risk level type derived from RiskLevel enum values */
export type RiskLevelType = (typeof RiskLevel)[keyof typeof RiskLevel];

/**
 * Recommendation enum for type-safe recommendation handling.
 * Represents the final recommendation for a contract.
 */
export const Recommendation = {
  SIGN: "SIGN",
  NEGOTIATE: "NEGOTIATE",
  DO_NOT_SIGN: "DO_NOT_SIGN",
} as const;

/** Recommendation type derived from Recommendation enum values */
export type RecommendationType = (typeof Recommendation)[keyof typeof Recommendation];

/**
 * Contract preview data returned in list responses.
 */
export interface ContractPreview {
  /** Unique identifier for the contract */
  id: string;
  /** Display name of the contract */
  name: string;
  /** Brief description of the contract */
  description: string;
  /** Pre-assessed risk level */
  risk_level: string;
  /** First 200 characters of contract content */
  preview: string;
}

/**
 * Full contract data including content.
 */
export interface Contract {
  /** Unique identifier for the contract */
  id: string;
  /** Display name of the contract */
  name: string;
  /** Brief description of the contract */
  description: string;
  /** Pre-assessed risk level */
  risk_level: string;
  /** Full text content of the contract */
  content: string;
}

/**
 * Individual clause analysis result.
 */
export interface Clause {
  /** Clause identifier (e.g., "CLAUSE 1") */
  clause_id: string;
  /** Original text of the clause */
  original_text: string;
  /** Topic category (e.g., "rent_adjustment") */
  topic: string;
  /** Risk level assessment */
  risk_level: RiskLevelType;
  /** Detailed explanation of the risk */
  risk_explanation: string;
  /** Reference to relevant law/regulation, or null */
  law_reference: string | null;
  /** AI-suggested improved version of the clause */
  suggested_rewrite: string;
}

/** @deprecated Use Clause instead */
export type ClauseAnalysis = Clause;

/**
 * Complete contract analysis result.
 */
export interface AnalysisResult {
  /** Analyzed contract's identifier */
  contract_id: string;
  /** Analyzed contract's name */
  contract_name: string;
  /** Overall risk assessment */
  overall_risk: RiskLevelType;
  /** Executive summary of the analysis */
  summary: string;
  /** List of analyzed clauses */
  clauses: Clause[];
  /** Count of problematic clauses */
  total_issues: number;
  /** Final recommendation */
  recommendation: RecommendationType;
  /** ISO timestamp of when analysis was performed */
  analyzed_at: string;
}

/**
 * Response from document upload endpoint.
 */
export interface UploadResponse {
  /** Whether the upload was successful */
  success: boolean;
  /** Unique identifier for the uploaded document */
  upload_id: string;
  /** Original filename */
  filename: string;
  /** Length of extracted text in characters */
  text_length: number;
  /** Preview of extracted text (first 500 chars) */
  text_preview: string;
}

/**
 * API Client for the Contract Negotiator backend.
 *
 * Provides typed methods for all API endpoints including health checks,
 * contract management, document uploads, and analysis.
 *
 * @example
 * ```ts
 * // Using the default instance
 * import api from "@/lib/api";
 *
 * const result = await api.analyzeContract("mock", "fair");
 * console.log(result.recommendation);
 * ```
 *
 * @example
 * ```ts
 * // Creating a custom instance
 * const customApi = new ApiClient("https://api.example.com");
 * ```
 */
class ApiClient {
  /** Base URL for all API requests */
  private baseUrl: string;

  /**
   * Creates a new API client instance.
   *
   * @param baseUrl - Base URL for API requests. Defaults to NEXT_PUBLIC_API_URL
   *                  environment variable or http://localhost:8000.
   */
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Makes an HTTP request to the API.
   *
   * @template T - Expected response type
   * @param endpoint - API endpoint path (e.g., "/health")
   * @param options - Fetch options (method, headers, body, etc.)
   * @returns Parsed JSON response
   * @throws Error if the request fails or returns a non-OK status
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || "API request failed");
    }

    return response.json();
  }

  /**
   * Checks the API server health.
   *
   * @returns Health status object
   *
   * @example
   * ```ts
   * const health = await api.healthCheck();
   * console.log(health.status); // "healthy"
   * ```
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request("/health");
  }

  /**
   * Retrieves all available demo contracts.
   *
   * @returns Object containing array of contract previews
   *
   * @example
   * ```ts
   * const { contracts } = await api.getContracts();
   * contracts.forEach(c => console.log(c.name));
   * ```
   */
  async getContracts(): Promise<{ contracts: ContractPreview[] }> {
    return this.request("/contracts/");
  }

  /**
   * Retrieves a specific contract by ID.
   *
   * @param contractId - Unique identifier of the contract
   * @returns Full contract data including content
   * @throws Error if contract is not found
   *
   * @example
   * ```ts
   * const contract = await api.getContract("fair");
   * console.log(contract.content);
   * ```
   */
  async getContract(contractId: string): Promise<Contract> {
    return this.request(`/contracts/${contractId}`);
  }

  /**
   * Uploads a document for analysis.
   *
   * Supports PDF, DOCX, and TXT files up to 10MB.
   * The document is parsed and stored temporarily for subsequent analysis.
   *
   * @param file - File to upload
   * @returns Upload response with upload_id for analysis
   * @throws Error if upload fails or file type is unsupported
   *
   * @example
   * ```ts
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * const result = await api.uploadDocument(file);
   * console.log(`Uploaded: ${result.upload_id}`);
   * ```
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseUrl}/upload/`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Upload failed");
    }

    return response.json();
  }

  /**
   * Analyzes a contract using AI.
   *
   * Can analyze either a mock contract (by ID) or an uploaded document (by upload_id).
   * Supports request cancellation via AbortSignal for cleanup on component unmount.
   *
   * @param source - Source type: "mock" for demo contracts, "upload" for uploaded documents
   * @param contractId - ID of mock contract (required if source is "mock")
   * @param uploadId - ID of uploaded document (required if source is "upload")
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Complete analysis result with clause-by-clause breakdown
   * @throws Error if analysis fails or IDs are invalid
   * @throws AbortError if request is cancelled via signal
   *
   * @example
   * ```ts
   * // Analyze a mock contract
   * const result = await api.analyzeContract("mock", "abusive");
   *
   * // Analyze an uploaded document
   * const result = await api.analyzeContract("upload", undefined, "upload_abc123");
   *
   * // With cancellation support
   * const controller = new AbortController();
   * const result = await api.analyzeContract("mock", "fair", undefined, controller.signal);
   * // To cancel: controller.abort();
   * ```
   */
  async analyzeContract(
    source: "mock" | "upload",
    contractId?: string,
    uploadId?: string,
    signal?: AbortSignal
  ): Promise<AnalysisResult> {
    return this.request("/analyze/", {
      method: "POST",
      body: JSON.stringify({
        source,
        contract_id: contractId,
        upload_id: uploadId,
      }),
      signal,
    });
  }

  /**
   * Retrieves a previously completed analysis.
   *
   * @param analysisId - Unique identifier of the analysis
   * @returns Analysis result data
   * @throws Error if analysis is not found
   *
   * @example
   * ```ts
   * const analysis = await api.getAnalysis("analysis_xyz789");
   * console.log(analysis.recommendation);
   * ```
   */
  async getAnalysis(analysisId: string): Promise<AnalysisResult> {
    return this.request(`/analysis/${analysisId}`);
  }
}

/** Default API client instance */
export const api = new ApiClient();

export default api;
