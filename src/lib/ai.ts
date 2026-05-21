import type { ParsedInput } from "./types";

export async function parseDailyInput(input: string, existingProjects: string[]): Promise<ParsedInput> {
  try {
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, existingProjects }),
    });
    return await res.json();
  } catch (e) {
    console.error("Parse failed:", e);
    return { domain: "其他", project_name: "", content: input, output: "" };
  }
}
