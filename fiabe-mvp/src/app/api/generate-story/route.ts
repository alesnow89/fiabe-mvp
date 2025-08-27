
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { form } = await req.json();
    const title =
      form?.titolo?.trim() ||
      (form?.tipo === "fiaba" ? "La lanterna che parla" : form?.tipo === "viaggio" ? "Taccuino di un faro" : "Il profumo del mare");
    const scenes = Array.from({ length: Number(form?.scene) || 6 }, (_, i) => i + 1);
    const outline = scenes.map((n) => ({
      id: n,
      scene: `Scena ${n}`,
      text:
        n === 1
          ? `Nel ${form.ambientazione}, ${form.protagonisti} trovano un indizio che appare al tramonto.`
          : n === scenes.length
          ? `La magia rivela il suo segreto e il faro illumina il ritorno a casa.`
          : `Un incontro inatteso li guida verso il faro e un mistero antico.`,
    }));
    const fullText = outline.map((s) => `${s.scene}: ${s.text}`).join("\\n\\n");
    return NextResponse.json({ title, dedication: form?.dedicataA, outline, fullText });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 });
  }
}
