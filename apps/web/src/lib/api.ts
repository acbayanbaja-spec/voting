export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface User {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "COMELEC_OFFICER" | "SYSTEM_ADMIN";
  department: string;
  yearLevel: string;
}

export interface Candidate {
  id: string;
  positionId: string;
  electionId: string;
  fullName: string;
  studentId: string;
  partyList?: string;
  platform: string;
  photoUrl?: string;
}

export interface Position {
  id: string;
  electionId: string;
  title: string;
  description?: string;
  orderIndex: number;
  maxChoices: number;
  isRequired: boolean;
  candidates: Candidate[];
}

export interface Election {
  id: string;
  title: string;
  description: string;
  academicYear: string;
  semester: string;
  status: "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "UNDER_REVIEW" | "PUBLISHED" | "CANCELLED";
  startTime: string;
  endTime: string;
  positions?: Position[];
  _count?: {
    positions: number;
    candidates: number;
    voterEligibilities: number;
    ballotSubmissions: number;
  };
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("seait_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}
