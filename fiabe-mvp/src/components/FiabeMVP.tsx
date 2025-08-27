
import React, { useMemo, useState, useEffect } from "react";

const USE_MOCK = false; // call API routes for images (set true to preview SVGs)

const STYLES = [
  {
    id: "olivetti-soft",
    name: "Olivetti Soft",
    palette: ["#111827", "#f3f4f6", "#e5e7eb", "#374151"],
    description:
      "Geometrie pulite, tipografia moderna, accenti industrial-chic. Ideale per racconti contemporanei.",
    imagePrompt:
      "illustrazione vettoriale pulita, palette minimal, ombre morbide, isometrico leggero, texture carta riciclata, stile modernista italiano",
  },
  {
    id: "acquerello-pastello",
    name: "Acquerello Pastello",
    palette: ["#0b3954", "#bfd7ea", "#ff7f50", "#ffda77"],
    description:
      "Pennellate leggere, colori tenui e sfumature morbide. Perfetto per fiabe per bambini.",
    imagePrompt:
      "acquerello morbido, colori pastello, bordi sfumati, carta ruvida, atmosfera sognante, luce calda",
  },
  {
    id: "noir-minimal",
    name: "Noir Minimal",
    palette: ["#0f0f0f", "#fafafa", "#d1d5db", "#a1a1aa"],
    description:
      "Contrasti netti, linee essenziali, silhouette e ombre. Per racconti misteriosi o avventure urbane.",
    imagePrompt:
      "illustrazione minimal in bianco e nero, luci drammatiche, silhouette, granulosità fine, atmosfera noir",
  },
];

const initialForm = {
  tipo: "fiaba",
  eta: "6-9",
  scene: 6,
  protagonisti: "Luna (bimba curiosa), Otto (gatto parlante)",
  ambientazione: "borgo sul mare in Sardegna, vicoli e fari",
  tono: "magico, gentile, educativo",
  stileId: STYLES[1].id,
  titolo: "",
  dedicataA: "",
};

function classNames(...arr: any[]) {
  return arr.filter(Boolean).join(" ");
}

function StepBadge({ n, active, done }: { n: number | string; active: boolean; done: boolean }) {
  return (
    <div
      className={classNames(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
        done ? "bg-emerald-500 text-white" : active ? "bg-black text-white" : "bg-gray-200 text-gray-700"
      )}
    >
      {done ? "✓" : n}
    </div>
  );
}

function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export default function FiabeMVP() {
  const [form, setForm] = useLocalStorage("fiabe-form", initialForm);
  const [step, setStep] = useLocalStorage("fiabe-step", 1);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useLocalStorage("fiabe-story", {
    title: "",
    dedication: "",
    outline: [] as { id: number; scene: string; text: string }[],
    fullText: "",
  });
  const [images, setImages] = useLocalStorage("fiabe-images", [] as { scene: string; url: string; caption: string }[]);

  const style = useMemo(() => STYLES.find((s) => s.id === form.stileId) || STYLES[0], [form.stileId]);
  const progress = useMemo(() => (step / 4) * 100, [step]);

  function update(field: string, value: any) {
    setForm((f: any) => ({ ...f, [field]: value }));
  }

  async function handleGenerateStory() {
    setLoading(true);
    try {
      // Local mock outline/text (no external LLM needed)
      const scenes = Array.from({ length: Number((form as any).scene) || 6 }, (_, i) => i + 1);
      const outline = scenes.map((n) => ({
        id: n,
        scene: `Scena ${n}`,
        text:
          n === 1
            ? `Nel ${form.ambientazione}, ${form.protagonisti} scoprono un indizio luminoso che appare solo al tramonto.`
            : n === scenes.length
            ? `La magia rivela il suo segreto: il coraggio e la gentilezza cambiano davvero il mondo. Tutti festeggiano con lanterne sul mare.`
            : `Un incontro inatteso guida i protagonisti più vicino al faro e a un mistero antico.`,
      }));
      const title =
        form.titolo?.trim() ||
        (form.tipo === "fiaba"
          ? "La lanterna che parla"
          : form.tipo === "viaggio"
          ? "Taccuino di un faro"
          : "Il profumo del mare");

      const fullText = outline.map((s) => `${s.scene}: ${s.text}`).join("\\n\\n");
      setStory({ title, dedication: form.dedicataA, outline, fullText });
      setStep(3);
    } catch (e) {
      alert("Errore durante la generazione della storia.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImages() {
    setLoading(true);
    try {
      if (USE_MOCK) {
        const imgs = story.outline.map((s, idx) => ({
          scene: s.scene,
          url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderPlaceholderSVG(idx, (style as any).palette, s.scene))}`,
          caption: s.text.slice(0, 120) + (s.text.length > 120 ? "…" : ""),
        }));
        setImages(imgs);
        setStep(4);
      } else {
        const res = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outline: story.outline, style }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setImages(data.images);
        setStep(4);
      }
    } catch (e: any) {
      alert("Errore durante la generazione delle illustrazioni: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }
  function resetAll() {
    setForm(initialForm);
    setStory({ title: "", dedication: "", outline: [], fullText: "" });
    setImages([]);
    setStep(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl" style={{ background: (style as any).palette?.[0] || "#111827" }} />
            <h1 className="text-xl font-semibold tracking-tight">FiabeMVP · Storie illustrate personalizzate</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">
              Nuova storia
            </button>
            <button onClick={handlePrint} className="px-3 py-2 text-sm rounded-lg bg-black text-white">
              Stampa / PDF
            </button>
          </div>
        </div>
        <div className="w-full h-1 bg-gray-200">
          <div className="h-1 bg-black transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <StepBadge n={1} active={step === 1} done={step > 1} />
            <span className="text-sm font-medium">Dettagli</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2">
            <StepBadge n={2} active={step === 2} done={step > 2} />
            <span className="text-sm font-medium">Stile</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2">
            <StepBadge n={3} active={step === 3} done={step > 3} />
            <span className="text-sm font-medium">Storyboard</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2">
            <StepBadge n={4} active={step === 4} done={false} />
            <span className="text-sm font-medium">Illustrazioni</span>
          </div>
        </div>

        {step === 1 && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Tipo di storia</span>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={(form as any).tipo}
                  onChange={(e) => update("tipo", e.target.value)}
                >
                  <option value="fiaba">Fiaba per bambini</option>
                  <option value="viaggio">Racconto di viaggio</option>
                  <option value="ricordo">Ricordo di famiglia</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Età lettore</span>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={(form as any).eta}
                    onChange={(e) => update("eta", e.target.value)}
                  >
                    <option>3-5</option>
                    <option>6-9</option>
                    <option>10-12</option>
                    <option>13+</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Numero di scene</span>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    className="w-full border rounded-lg px-3 py-2"
                    value={(form as any).scene}
                    onChange={(e) => update("scene", e.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Protagonisti (nomi + breve descrizione)</span>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 min-h-[84px]"
                  value={(form as any).protagonisti}
                  onChange={(e) => update("protagonisti", e.target.value)}
                  placeholder="Es: Luna (bimba curiosa), Otto (gatto parlante)"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Ambientazione</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={(form as any).ambientazione}
                  onChange={(e) => update("ambientazione", e.target.value)}
                  placeholder="Es: borgo sul mare in Sardegna, vicoli e fari"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Tono / messaggio</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={(form as any).tono}
                  onChange={(e) => update("tono", e.target.value)}
                  placeholder="Es: magico, gentile, educativo"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Titolo (opzionale)</span>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={(form as any).titolo}
                    onChange={(e) => update("titolo", e.target.value)}
                    placeholder="Es: La lanterna che parla"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Dedicata a (opzionale)</span>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={(form as any).dedicataA}
                    onChange={(e) => update("dedicataA", e.target.value)}
                    placeholder="Es: A Sofia"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-black text-white">
                  Continua →
                </button>
              </div>
            </div>

            <aside className="p-4 rounded-2xl border bg-white">
              <h3 className="font-semibold mb-2">Suggerimenti rapidi</h3>
              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-700">
                <li>Usa dettagli sensoriali (profumi, suoni) per rendere la storia più viva.</li>
                <li>Mantieni i protagonisti coerenti scena per scena.</li>
                <li>Per lettori 3–5 ➜ frasi brevi; 6–9 ➜ lessico ricco ma semplice.</li>
              </ul>
            </aside>
          </section>
        )}

        {step === 2 && (
          <section className="grid md:grid-cols-3 gap-4">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => update("stileId", s.id)}
                className={classNames(
                  "p-4 rounded-2xl border text-left hover:shadow-sm transition bg-white",
                  (form as any).stileId === s.id ? "ring-2 ring-black" : ""
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  {s.palette.slice(0, 3).map((c, i) => (
                    <span key={i} className="w-5 h-5 rounded" style={{ background: c }} />
                  ))}
                </div>
                <div className="font-semibold">{s.name}</div>
                <p className="text-sm text-gray-700 mt-1">{s.description}</p>
                <p className="text-xs mt-2 text-gray-500">Prompt base: {s.imagePrompt}</p>
              </button>
            ))}

            <div className="md:col-span-3 flex items-center justify-between mt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border">
                ← Indietro
              </button>
              <button onClick={handleGenerateStory} className="px-4 py-2 rounded-lg bg-black text-white" disabled={loading}>
                {loading ? "Genero…" : "Genera storyboard"}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6 print:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{(story as any).title || "Titolo in definizione"}</h2>
                {(story as any)?.dedication && <p className="text-sm text-gray-600">Dedicata a: {(story as any).dedication}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  Stile: {(style as any).name} · Lettore: {(form as any).eta} · Scene: {(form as any).scene}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(2)} className="px-3 py-2 rounded-lg border">
                  ← Cambia stile
                </button>
                <button onClick={handleGenerateImages} className="px-3 py-2 rounded-lg bg-black text-white" disabled={loading}>
                  {loading ? "Creo illustrazioni…" : "Genera illustrazioni"}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 print:grid-cols-1">
              {(story as any).outline.map((s: any) => (
                <article key={s.id} className="p-4 rounded-2xl border bg-white">
                  <h3 className="font-semibold mb-1">{s.scene}</h3>
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{s.text}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6 print:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Illustrazioni generate</h2>
                <p className="text-sm text-gray-500">Stile: {(style as any).name} · Palette coerente</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(3)} className="px-3 py-2 rounded-lg border">
                  ← Torna allo storyboard
                </button>
                <button onClick={handlePrint} className="px-3 py-2 rounded-lg bg-black text-white">
                  Stampa / PDF
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 print:grid-cols-1">
              {images.map((img, idx) => (
                <figure key={idx} className="p-3 rounded-2xl border bg-white">
                  <img src={img.url} alt={img.caption} className="w-full h-auto rounded-xl" />
                  <figcaption className="text-sm mt-2 text-gray-700">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 shadow-xl border text-center w-[320px]">
              <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-3" />
              <p className="font-medium">Lavoro in corso…</p>
              <p className="text-sm text-gray-600">Sto preparando magia narrativa ✨</p>
            </div>
          </div>
        )}
      </main>

      <style>{`@media print { header, .no-print { display: none !important; } main { padding: 0 !important; } article, figure { page-break-inside: avoid; } }`}</style>
    </div>
  );
}

function renderPlaceholderSVG(idx: number, palette: string[], title: string) {
  const id = `grad-${idx}`;
  return `
  <svg viewBox='0 0 800 500' xmlns='http://www.w3.org/2000/svg'>
    <defs>
      <linearGradient id='${id}' x1='0' x2='1'>
        <stop offset='0%' stop-color='${palette[0] || "#ddd"}' />
        <stop offset='100%' stop-color='${palette[1] || "#bbb"}' />
      </linearGradient>
    </defs>
    <rect width='800' height='500' fill='url(#${id})' />
    <g>
      <circle cx='120' cy='120' r='60' fill='${palette[2] || "#999"}' opacity='0.6' />
      <rect x='420' y='280' width='260' height='140' rx='18' fill='#ffffff' opacity='0.25' />
      <text x='40' y='460' font-size='28' fill='#111827' opacity='0.7'>${escapeXml(title)}</text>
    </g>
  </svg>`;
}
function escapeXml(unsafe: string) {
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\"/g, "&quot;").replace(/'/g, "&apos;");
}
