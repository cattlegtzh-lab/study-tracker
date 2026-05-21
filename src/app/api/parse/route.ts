import { NextResponse } from "next/server";
import { DOMAINS } from "@/lib/types";

export async function POST(req: Request) {
  let input = "";

  try {
    const body = await req.json();
    input = body.input || "";
    const existingProjects: string[] = body.existingProjects || [];
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_DEEPSEEK_BASE || "https://api.deepseek.com";

    if (!apiKey) return NextResponse.json(fallbackParse(input));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: `解析用户学习活动为JSON。领域：${DOMAINS.join("/")}。项目：${existingProjects.join("、") || "无"}。返回格式：{"domain":"领域","project_name":"项目名或空","content":"内容","output":"产出或空"}` },
            { role: "user", content: input },
          ],
          temperature: 0.1,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        domain: DOMAINS.includes(parsed.domain) ? parsed.domain : "其他",
        project_name: parsed.project_name || "",
        content: parsed.content || input,
        output: parsed.output || "",
      });
    } catch {
      clearTimeout(timeout);
      return NextResponse.json(fallbackParse(input));
    }
  } catch {
    return NextResponse.json(fallbackParse(input));
  }
}

function fallbackParse(input: string) {
  const lower = input.toLowerCase();
  let domain = "其他";
  if (lower.includes("徐禾") || lower.includes("资本论") || lower.includes("政经") || lower.includes("政治经济") || lower.includes("马克思") || lower.includes("prebisch") || lower.includes("斯拉法")) domain = "政经";
  else if (lower.includes("西语") || lower.includes("西班牙") || lower.includes("变位") || lower.includes("虚拟")) domain = "西语";
  else if (lower.includes("专四") || lower.includes("tem4") || lower.includes("听力")) domain = "专四";
  else if (lower.includes("史学") || lower.includes("历史") || lower.includes("章永乐") || lower.includes("思想史")) domain = "史学";
  else if (lower.includes("写作") || lower.includes("公众号") || lower.includes("amauta") || lower.includes("文章")) domain = "写作";
  else if (lower.includes("ra") || lower.includes("投资") || lower.includes("研究助理")) domain = "RA";

  let project_name = "", output = "";
  if (lower.includes("笔记") || lower.includes("写了") || lower.includes("整理")) output = "笔记";
  if (lower.includes("公众号") || lower.includes("amauta")) output = "公众号文章";
  if (lower.includes("徐禾")) project_name = "徐禾";
  if (lower.includes("专四")) project_name = "专四";

  return { domain, project_name, content: input, output };
}
