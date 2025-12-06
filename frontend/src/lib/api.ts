const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ContractPreview {
  id: string;
  name: string;
  description: string;
  risk_level: string;
  preview: string;
}

export interface Contract {
  id: string;
  name: string;
  description: string;
  risk_level: string;
  content: string;
}

export interface ClauseAnalysis {
  clause_id: string;
  original_text: string;
  topic: string;
  risk_level: "low" | "medium" | "high" | "critical";
  risk_explanation: string;
  law_reference: string | null;
  suggested_rewrite: string;
}

export interface AnalysisResult {
  contract_id: string;
  contract_name: string;
  overall_risk: "low" | "medium" | "high" | "critical";
  summary: string;
  clauses: ClauseAnalysis[];
  total_issues: number;
  recommendation: "SIGN" | "NEGOTIATE" | "DO_NOT_SIGN";
  analyzed_at: string;
}

export interface UploadResponse {
  success: boolean;
  upload_id: string;
  filename: string;
  text_length: number;
  text_preview: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

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

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request("/health");
  }

  // Get all contracts
  async getContracts(): Promise<{ contracts: ContractPreview[] }> {
    return this.request("/contracts/");
  }

  // Get single contract
  async getContract(contractId: string): Promise<Contract> {
    return this.request(`/contracts/${contractId}`);
  }

  // Upload document
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

  // Analyze contract
  async analyzeContract(
    source: "mock" | "upload",
    contractId?: string,
    uploadId?: string
  ): Promise<AnalysisResult> {
    return this.request("/analyze/", {
      method: "POST",
      body: JSON.stringify({
        source,
        contract_id: contractId,
        upload_id: uploadId,
      }),
    });
  }

  // Get analysis result
  async getAnalysis(analysisId: string): Promise<AnalysisResult> {
    return this.request(`/analysis/${analysisId}`);
  }
}

export const api = new ApiClient();
export default api;
