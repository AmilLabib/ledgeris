import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TOUR_KEY = "tour_shown_v1";

type Step = {
  id: string;
  title: string;
  body: string;
  selector?: string;
  path?: string;
};

const STEPS: Step[] = [
  {
    id: "sidebar",
    title: "Navigasi Utama",
    body: "Gunakan sidebar untuk berpindah antar modul: Dashboard, Kasir, Financial, dsb.",
    selector: ".sidebar-root",
    path: "/dashboard",
  },
  {
    id: "kasir",
    title: "Kasir / POS",
    body: "Akses POS cepat untuk menangani transaksi pelanggan.",
    selector: "a[href='/kasir']",
    path: "/kasir",
  },
  {
    id: "financial",
    title: "Financial",
    body: "Lihat laporan keuangan, jurnal, dan posting transaksi di sini.",
    selector: "a[href='/financial']",
    path: "/financial",
  },
  {
    id: "chart",
    title: "Chart of Accounts",
    body: "Manajemen daftar akun dan mapping untuk posting jurnal.",
    selector: "a[href='/chart-of-accounts']",
    path: "/chart-of-accounts",
  },
  {
    id: "data-driven",
    title: "Data Driven",
    body: "Insight anomali dan rekomendasi berbasis data untuk bisnis kamu.",
    selector: "a[href='/data-driven']",
    path: "/data-driven",
  },
];

export default function TourGuide() {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const shown = localStorage.getItem(TOUR_KEY);
      if (!shown) {
        setVisible(true);
        setShowWelcome(true);
      }
    } catch {
      setVisible(true);
      setShowWelcome(true);
    }
  }, []);

  const step = STEPS[stepIndex];

  const next = () => setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStepIndex((s) => Math.max(s - 1, 0));
  const finish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(TOUR_KEY, "1");
      } catch {}
    }
    setVisible(false);
  };
  const skip = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(TOUR_KEY, "1");
      } catch {}
    }
    setVisible(false);
  };

  // navigate and scroll target into view when step changes
  useEffect(() => {
    if (!visible || showWelcome) return;

    if (step.path) {
      navigate(step.path);
    }

    const sel = step.selector;
    if (!sel) return;

    // Slight delay to allow DOM to update after potential navigation
    const timeoutId = setTimeout(() => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el && typeof el.scrollIntoView === "function") {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
      }
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, visible, showWelcome, navigate]);

  if (!visible) return null;

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto">
        <div className="absolute inset-0 bg-black/40" />
        <div className="bg-white rounded-2xl p-6 shadow-xl z-10 max-w-sm w-full mx-4 relative">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-3xl">🚀</span>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">
            Selamat Datang di Catalyst
          </h3>
          <p className="text-gray-600 mb-4 text-center text-sm">
            Ikuti tutorial untuk mempelajari aplikasi ini.
          </p>

          <div className="flex gap-3">
            <button
              onClick={skip}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Lewati
            </button>
            <button
              onClick={() => {
                if (dontShowAgain) {
                  try {
                    localStorage.setItem(TOUR_KEY, "1");
                  } catch {}
                }
                setShowWelcome(false);
              }}
              className="flex-1 px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Lanjut
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              Jangan tampilkan lagi
            </label>
          </div>
        </div>
      </div>
    );
  }

  // compute highlight position if selector exists
  let rect: DOMRect | null = null;
  if (step.selector) {
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el) rect = el.getBoundingClientRect();
  }

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {!rect && (
        <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" />
      )}
      {rect && (
        <div
          className="absolute border-2 border-primary rounded-md pointer-events-none transition-all duration-500 ease-in-out"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
          }}
        />
      )}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(92%,520px)] pointer-events-auto transition-transform duration-500 ease-in-out">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">{step.title}</h4>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{step.body}</p>
            </div>
            <div className="flex items-center shrink-0">
              <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-md">
                Skip
              </button>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-500">
              {stepIndex + 1} <span className="text-gray-300">/</span> {STEPS.length}
            </div>
            <div className="flex gap-3">
              <button
                onClick={prev}
                disabled={stepIndex === 0}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => {
                  if (stepIndex === STEPS.length - 1) finish();
                  else next();
                }}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {stepIndex === STEPS.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
