
"use client";

import { useRef, useState } from "react";

type DocumentResult = {
  name: string;
  hash: string;
  size: number;
};

export default function Home() {
  const [document, setDocument] = useState<DocumentResult | null>(null);
  const [comparison, setComparison] = useState<DocumentResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const compareInput = useRef<HTMLInputElement>(null);

  async function calculateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function processFile(
    file: File,
    isComparison = false
  ): Promise<void> {
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Klaida: pasirink PDF dokumentą.");
      return;
    }

    if (file.size === 0) {
      setMessage("Pasirinktas failas yra tuščias.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Failas per didelis. Maksimalus dydis – 10 MB.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const hash = await calculateHash(file);

      const result: DocumentResult = {
        name: file.name,
        hash,
        size: file.size,
      };

      if (isComparison) {
        setComparison(result);
        setMessage("Antro dokumento kontrolinis kodas apskaičiuotas.");
      } else {
        setDocument(result);
        setComparison(null);
        setMessage("Dokumento kontrolinis kodas apskaičiuotas.");
      }
    } catch {
      setMessage("Nepavyko apdoroti failo. Bandyk dar kartą.");
    } finally {
      setLoading(false);
    }
  }

  async function copyHash(hash: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(hash);
      setMessage("SHA-256 kodas nukopijuotas.");
    } catch {
      setMessage(
        "Nepavyko automatiškai nukopijuoti. Pažymėk ir nukopijuok kodą rankiniu būdu."
      );
    }
  }

  function compareDocuments(): void {
    if (!document || !comparison) {
      setMessage("Pirmiausia pasirink abu dokumentus.");
      return;
    }

    if (document.hash === comparison.hash) {
      setMessage("SUTAMPA — abiejų PDF failų turinys identiškas.");
    } else {
      setMessage("NESUTAMPA — PDF failų turinys skiriasi.");
    }
  }

  function reset(): void {
    setDocument(null);
    setComparison(null);
    setMessage("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }

    if (compareInput.current) {
      compareInput.current.value = "";
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-xl font-bold">
              K
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                KaspaProof
              </div>
              <div className="text-xs text-slate-400">
                Dokumentų vientisumo patikra
              </div>
            </div>
          </div>

          <span className="rounded-full border border-violet-400/30 px-3 py-1.5 text-xs text-violet-300">
            Prototipas
          </span>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            Kriptografinis dokumentų tikrinimas
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Įrodyk, kad tavo dokumentas{" "}
            <span className="text-violet-400">nepasikeitė.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Apskaičiuok PDF dokumento SHA-256 kontrolinį kodą ir patikrink,
            ar dvi failo versijos yra identiškos. Dokumentai apdorojami
            tavo naršyklėje.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-violet-950/20 sm:p-10">
          <h2 className="text-xl font-semibold">
            1. Apskaičiuok dokumento kodą
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Pasirink PDF failą iki 10 MB. Tavo dokumentas nesiunčiamas į
            šios demonstracinės versijos serverį.
          </p>

          <input
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void processFile(file);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={loading}
            className="mt-6 w-full rounded-2xl border border-dashed border-violet-400/50 bg-violet-400/[0.06] px-5 py-10 text-center transition hover:border-violet-300 hover:bg-violet-400/10 disabled:opacity-50"
          >
            <span className="text-3xl">↑</span>

            <span className="mt-3 block font-semibold">
              {loading ? "Apdorojama..." : "Pasirink PDF dokumentą"}
            </span>

            <span className="mt-2 block text-sm text-slate-400">
              PDF formatas · iki 10 MB
            </span>
          </button>

          {document && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
              <div className="font-semibold text-emerald-300">
                ✓ Kontrolinis kodas apskaičiuotas
              </div>

              <div className="mt-4 break-words text-sm text-slate-300">
                <span className="text-slate-500">Failas: </span>
                {document.name}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                Dydis: {formatSize(document.size)}
              </div>

              <div className="mt-4 text-xs text-slate-500">
                SHA-256 kontrolinis kodas
              </div>

              <div className="mt-2 break-all rounded-xl bg-black/30 p-4 font-mono text-xs leading-6 text-violet-200">
                {document.hash}
              </div>

              <button
                type="button"
                onClick={() => void copyHash(document.hash)}
                className="mt-4 text-sm text-violet-300 underline underline-offset-4 hover:text-violet-200"
              >
                Kopijuoti kontrolinį kodą
              </button>
            </div>
          )}

          <div className="my-8 border-t border-white/10" />

          <h2 className="text-xl font-semibold">
            2. Palygink kitą dokumento versiją
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Pasirink antrą PDF failą. Jei bent vienas failo baitas skiriasi,
            jų SHA-256 kodai paprastai taip pat skirsis.
          </p>

          <input
            ref={compareInput}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void processFile(file, true);
              }
            }}
          />

          <button
            type="button"
            onClick={() => compareInput.current?.click()}
            disabled={!document || loading}
            className="mt-5 w-full rounded-xl border border-white/10 px-5 py-4 text-left text-sm font-medium transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {comparison
              ? `Pasirinktas failas: ${comparison.name}`
              : "Pasirink antrą PDF palyginimui"}
          </button>

          {comparison && (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="break-words text-sm text-slate-300">
                {comparison.name}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Dydis: {formatSize(comparison.size)}
              </div>

              <div className="mt-3 break-all font-mono text-xs leading-5 text-slate-400">
                {comparison.hash}
              </div>

              <button
                type="button"
                onClick={compareDocuments}
                className="mt-5 w-full rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400"
              >
                Palyginti dokumentus
              </button>
            </div>
          )}

          {message && (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200"
            >
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="mt-6 text-sm text-slate-400 underline underline-offset-4 hover:text-white"
          >
            Pradėti iš naujo
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-5">
            <div className="text-lg">🔐</div>
            <h3 className="mt-3 font-semibold">Privatumas</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ši versija failą apdoroja naršyklėje ir jo nesiunčia į serverį.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <div className="text-lg">🔎</div>
            <h3 className="mt-3 font-semibold">SHA-256</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Kriptografinis kontrolinis kodas padeda aptikti failo pakeitimus.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <div className="text-lg">⛓️</div>
            <h3 className="mt-3 font-semibold">Kaspa blokų grandinė</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Registravimas blokų grandinėje bus įgyvendintas atskirame etape.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs leading-6 text-slate-500">
          KaspaProof demonstracinė versija. SHA-256 kodai kol kas
          neregistruojami Kaspa blokų grandinėje.
        </p>
      </section>
    </main>
  );
}
