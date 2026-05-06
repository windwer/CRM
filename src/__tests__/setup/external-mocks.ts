import { vi } from "vitest";

// === Microsoft Graph ===
export const graphMocks = {
  sendMail: vi.fn().mockResolvedValue({ id: "mock-msg-id" }),
  getDeltaEmails: vi.fn().mockResolvedValue({ emails: [], deltaToken: "delta-token" }),
  getValidAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
};

vi.mock("@/lib/outlook/graphService", () => ({
  GraphService: vi.fn().mockImplementation(() => graphMocks),
  getValidAccessToken: graphMocks.getValidAccessToken,
}));

// === Azure Blob ===
export const blobMocks = {
  uploadBlob: vi.fn().mockResolvedValue("mock-blob-id"),
  getBlob: vi.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
  deleteBlob: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/azure/blobService", () => blobMocks);

// === IA Providers (Anthropic/OpenAI/Gemini) ===
export const aiMocks = {
  parseCV: vi.fn().mockResolvedValue({
    fullName: "Test Candidate",
    email: "test@example.com",
    skills: ["React", "TypeScript"],
    experienceYears: 5,
    seniorityLevel: "mid",
  }),
  scoreCandidate: vi.fn().mockResolvedValue({
    overall_score: 0.75,
    matched_required_skills: ["React"],
    missing_required_skills: ["Kubernetes"],
    matched_nice_to_have: [],
    strengths: ["Frontend solido"],
    gaps: ["DevOps limitado"],
    recommendation: "consider",
    summary: "Mock score",
  }),
};

vi.mock("@/lib/ai/claudeService", () => ({
  parseCV: aiMocks.parseCV,
  scoreCandidate: aiMocks.scoreCandidate,
}));

export function resetExternalMocks() {
  Object.values(graphMocks).forEach((m) => m.mockClear());
  Object.values(blobMocks).forEach((m) => m.mockClear());
  Object.values(aiMocks).forEach((m) => m.mockClear());
}
