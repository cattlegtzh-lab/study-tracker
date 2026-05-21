export type Domain = "政经" | "西语" | "史学" | "写作" | "RA" | "专四" | "其他";

export const DOMAINS: Domain[] = ["政经", "西语", "史学", "写作", "RA", "专四", "其他"];

export const DOMAIN_COLORS: Record<Domain, string> = {
  "政经": "#ef4444",
  "西语": "#3b82f6",
  "史学": "#f59e0b",
  "写作": "#8b5cf6",
  "RA": "#10b981",
  "专四": "#ec4899",
  "其他": "#6b7280",
};

export interface DailyRecord {
  id: string;
  raw_input: string;
  domain: Domain | null;
  project_name: string | null;
  content: string | null;
  output: string | null;
  date: string;
  created_at: string;
}

export interface Thought {
  id: string;
  text: string;
  date: string;
  promoted_to_todo: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  domain: Domain | null;
  status: "active" | "paused" | "completed";
  progress: string | null;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  project_id: string | null;
  text: string;
  status: "pending" | "in_progress" | "done";
  source: string | null;
  thought_id: string | null;
  created_at: string;
}

export interface ParsedInput {
  domain: Domain;
  project_name: string;
  content: string;
  output: string;
}
