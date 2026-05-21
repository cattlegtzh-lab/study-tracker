import { createClient } from "@supabase/supabase-js";

const SURL = "https://kpyloojyravbpcpijkgj.supabase.co";
const SANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweWxvb2p5cmF2YnBjcGlqa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTQwMDYsImV4cCI6MjA5NDkzMDAwNn0.SErYmFghWsB9_BDAcD82Pe3xAf6UDbsTFt-A11ZXlvQ";

export const supabase = createClient(SURL, SANON);

// 固定用户 ID — 跨设备数据互通。以后如果要分账号，换成 Supabase Auth。
export function getUserId(): string {
  return "default";
}
