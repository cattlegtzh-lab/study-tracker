import { createClient } from "@supabase/supabase-js";

const SURL = "https://kpyloojyravbpcpijkgj.supabase.co";
const SANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweWxvb2p5cmF2YnBjcGlqa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTQwMDYsImV4cCI6MjA5NDkzMDAwNn0.SErYmFghWsB9_BDAcD82Pe3xAf6UDbsTFt-A11ZXlvQ";

export const supabase = createClient(SURL, SANON);

export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("study_tracker_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("study_tracker_user_id", id);
  }
  return id;
}
