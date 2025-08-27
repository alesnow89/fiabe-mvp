
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { outline, style } = await req.json();
    if (!outline?.length) return NextResponse.json({ error: "Outline mancante" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY mancante" }, { status: 500 });

    const images: { scene: string; url: string; caption: string }[] = [];
    for (const s of outline as any[]) {
      const prompt = `${style?.imagePrompt || "illustrazione"}. Scena: ${s.scene}. Descrizione: ${s.text}`;
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x768",
          quality: "high",
          n: 1,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const url = data.data?.[0]?.url as string;
      images.push({ scene: s.scene, url, caption: s.text.slice(0, 120) + (s.text.length > 120 ? "…" : "") });
    }
    return NextResponse.json({ images });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 });
  }
}
