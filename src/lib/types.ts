export const DOMAINS = ["政经", "西语", "史学", "写作", "RA", "专四", "其他"] as const;
export type Domain = typeof DOMAINS[number];

export const DOMAIN_COLORS: Record<string, string> = {
  "政经": "#e8b4a2", "西语": "#a2c4e8", "史学": "#e8d4a2",
  "写作": "#c4a2e8", "RA": "#a2e8c4", "专四": "#e8a2c4", "其他": "#b0a89c",
};

export interface Memo {
  id: string;
  user_id: string;
  text: string;
  tags: string[];
  is_processed: boolean;
  domain: string | null;
  project_name: string | null;
  output: string | null;
  related_ids: string[];
  date: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  status: "active" | "paused" | "completed";
  progress: string | null;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  project_id: string | null;
  text: string;
  status: "pending" | "in_progress" | "done";
  source: string | null;
  thought_id: string | null;
  created_at: string;
}
