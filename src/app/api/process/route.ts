import { NextResponse } from "next/server";
import { DOMAINS } from "@/lib/types";

export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_DEEPSEEK_BASE || "https://api.deepseek.com";

  // Fetch unprocessed memos using REST API
  const supabaseUrl = "https://kpyloojyravbpcpijkgj.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweWxvb2p5cmF2YnBjcGlqa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTQwMDYsImV4cCI6MjA5NDkzMDAwNn0.SErYmFghWsB9_BDAcD82Pe3xAf6UDbsTFt-A11ZXlvQ";

  const fetchUrl = `${supabaseUrl}/rest/v1/memos?select=*&is_processed=eq.false&order=created_at&limit=20`;
  const res = await fetch(fetchUrl, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
  const memos = await res.json();

  if (!memos || memos.length === 0) {
    return NextResponse.json({ count: 0, message: "没有待处理的卡片" });
  }

  let processed = 0;

  for (const memo of memos) {
    try {
      let domain = null;
      let output = null;

      // Local tag-based domain detection
      for (const tag of (memo.tags || [])) {
        if (DOMAINS.includes(tag)) { domain = tag; break; }
      }

      // If no domain found in tags, try basic keyword detection
      if (!domain) {
        const t = memo.text.toLowerCase();
        if (t.includes("#政经") || t.includes("资本论") || t.includes("徐禾") || t.includes("政治经济") || t.includes("prebisch") || t.includes("斯拉法")) domain = "政经";
        else if (t.includes("#西语") || t.includes("变位") || t.includes("虚拟")) domain = "西语";
        else if (t.includes("#专四") || t.includes("听力")) domain = "专四";
        else if (t.includes("#史学") || t.includes("章永乐") || t.includes("思想史") || t.includes("历史")) domain = "史学";
        else if (t.includes("#写作") || t.includes("公众号") || t.includes("amauta") || t.includes("文章")) domain = "写作";
        else if (t.includes("#RA") || t.includes("投资") || t.includes("研究助理")) domain = "RA";
      }

      if (memo.text.includes("产出") || memo.text.includes("写完") || memo.text.includes("发了") || memo.text.includes("记了笔记") || memo.text.includes("笔记")) {
        output = "笔记/产出";
      }

      // If API key available, try AI-based related memo matching
      if (apiKey && memos.length > 1) {
        try {
          const otherMemos = memos.filter((m: { id: string }) => m.id !== memo.id).slice(0, 5);
          const aiRes = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: "deepseek-v4-flash",
              messages: [{ role: "system", content: "判断用户输入最可能是哪个领域：政经、西语、史学、写作、RA、专四、其他。只返回领域名。" }, { role: "user", content: memo.text }],
              temperature: 0.1, max_tokens: 50,
            }),
          });
          const aiData = await aiRes.json();
          const aiText = aiData.choices?.[0]?.message?.content?.trim() || "";
          if (DOMAINS.includes(aiText) && !domain) domain = aiText;
        } catch { /* AI failed, keep local result */ }
      }

      const updateUrl = `${supabaseUrl}/rest/v1/memos?id=eq.${memo.id}`;
      await fetch(updateUrl, {
        method: "PATCH",
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ domain, output, is_processed: true, updated_at: new Date().toISOString() }),
      });
      processed++;
    } catch { /* skip failed memos */ }
  }

  return NextResponse.json({ count: processed });
}
