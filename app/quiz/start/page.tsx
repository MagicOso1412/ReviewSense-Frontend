'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Star, X, Plus } from "lucide-react";

type ActionLevel = "low" | "medium" | "high";

type QuizAnswers = {
  favorite_genre: string;
  action_level: ActionLevel;
  keywords: string[];
};

type StepId = "genre" | "action" | "keywords";

const STEPS: { id: StepId; title: string; subtitle: string }[] = [
  {
    id: "genre",
    title: "Género favorito",
    subtitle: "Elige el género que más disfrutas.",
  },
  {
    id: "action",
    title: "Nivel de acción",
    subtitle: "¿Qué tan intensa te gusta la historia?",
  },
  {
    id: "keywords",
    title: "Keywords (temas que te interesan)",
    subtitle: "Agrega palabras clave como “misterio”, “amistad”, “magia”… (mínimo 1).",
  },
];

const GENRES = [
  "Fantasía",
  "Ciencia ficción",
  "Misterio / Thriller",
  "Romance",
  "Terror",
  "Histórica",
  "No ficción",
  "Autoayuda",
  "Filosofía",
  "Clásicos",
];

const KEYWORD_SUGGESTIONS = [
  "amistad",
  "superación",
  "magia",
  "aventura",
  "distopía",
  "crimen",
  "misterio",
  "familia",
  "viajes",
  "psicología",
  "drama",
  "humor",
];

export default function QuizStart() {
  // --- Form state (MIS preguntas / secciones) ---
  const [favoriteGenre, setFavoriteGenre] = useState<string>("");
  const [actionLevel, setActionLevel] = useState<ActionLevel>("medium");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);

  // --- Landing / steps (TU flujo de “pasar de pregunta”) ---
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completed, setCompleted] = useState(false);

  // --- Submit state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canGoNext = useMemo(() => {
    if (step.id === "genre") return favoriteGenre.trim().length > 0;
    if (step.id === "action") return !!actionLevel;
    if (step.id === "keywords") return keywords.length >= 1;
    return false;
  }, [step.id, favoriteGenre, actionLevel, keywords]);

  const canSubmit = useMemo(() => {
    return favoriteGenre.trim().length > 0 && !!actionLevel && keywords.length >= 1;
  }, [favoriteGenre, actionLevel, keywords]);

  const addKeyword = (raw: string) => {
    const k = raw.trim().toLowerCase();
    if (!k) return;
    if (k.length > 24) return;
    if (keywords.includes(k)) return;
    setKeywords(prev => [...prev, k]);
  };

  const removeKeyword = (k: string) => setKeywords(prev => prev.filter(x => x !== k));

  const onAddKeyword = () => {
    addKeyword(keywordInput);
    setKeywordInput("");
  };

  const goNext = () => {
    setError("");
    if (!canGoNext) {
      if (step.id === "genre") setError("Selecciona tu género favorito para continuar.");
      else if (step.id === "action") setError("Selecciona un nivel de acción para continuar.");
      else setError("Agrega al menos 1 keyword para continuar.");
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCompleted(true);
    }
  };

  const goBack = () => {
    setError("");
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const resetQuiz = () => {
    setFavoriteGenre("");
    setActionLevel("medium");
    setKeywordInput("");
    setKeywords([]);
    setCurrentStep(0);
    setCompleted(false);
    setError("");
    setLoading(false);
  };

  const onSubmit = async () => {
    setError("");
    if (!canSubmit) {
      setError("Completa el género, el nivel de acción y al menos 1 keyword.");
      return;
    }

    const payload: QuizAnswers = {
      favorite_genre: favoriteGenre,
      action_level: actionLevel,
      keywords,
    };

    try {
      setLoading(true);
      const res = await fetch("/api/quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        setError(data?.detail ?? "No se pudo guardar tu quiz.");
        return;
      }

      window.location.href = "/main";
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Completed screen (TU landing, pero con MIS datos)
  // -----------------------------
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              <Link href="/">ReviewSense</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/main"
                className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
              >
                Catálogo
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full text-green-800 dark:text-green-200 font-medium mb-6">
              <CheckCircle2 size={16} />
              Quiz Completado
            </div>

            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              ¡Listo! Guardemos tus preferencias
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Con estas respuestas podremos recomendarte libros más acordes a tus gustos.
            </p>

            <div className="space-y-4">
              <button
                onClick={onSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200 mr-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Ver Recomendaciones"}
                <ArrowRight size={20} />
              </button>

              <button
                onClick={resetQuiz}
                className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Hacer Quiz de Nuevo
              </button>
            </div>
          </div>

          {/* Resumen (sin usar tus preguntas; resumen de MIS secciones) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Tus Respuestas
            </h2>

            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  {STEPS[0].title}
                </p>
                <p className="text-amber-600 dark:text-amber-400">{favoriteGenre || "-"}</p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  {STEPS[1].title}
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  {actionLevel === "low" ? "Tranquilo" : actionLevel === "high" ? "Intenso" : "Balanceado"}
                </p>
              </div>

              <div className="pb-2">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  {STEPS[2].title}
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  {keywords.length ? keywords.join(", ") : "-"}
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -----------------------------
  // Step screen (TU landing, pero con MIS secciones)
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            <Link href="/">ReviewSense</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/quiz"
              className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar (TU estilo de progreso) */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pregunta {currentStep + 1} de {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-amber-600 to-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card (TU card/landing) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 sm:p-12 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-amber-600 dark:text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full text-amber-800 dark:text-amber-200 font-medium mb-6">
              <Star size={16} />
              Quiz Interactivo
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{step.subtitle}</p>
          </div>

          {/* Content por step (MIS preguntas/secciones) */}
          <div className="space-y-4">
            {step.id === "genre" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GENRES.map(g => {
                  const active = favoriteGenre === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setFavoriteGenre(g);
                        setError("");
                      }}
                      className={[
                        "w-full p-4 text-left rounded-xl border transition-all duration-200 group",
                        active
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-600",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">{g}</span>
                        <ArrowRight
                          size={20}
                          className={[
                            "transition-colors",
                            active
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400",
                          ].join(" ")}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step.id === "action" && (
              <div className="space-y-4">
                {([
                  { id: "low", label: "Tranquilo", desc: "Más reflexión y calma" },
                  { id: "medium", label: "Balanceado", desc: "Un poco de todo" },
                  { id: "high", label: "Intenso", desc: "Ritmo rápido y acción" },
                ] as const).map(opt => {
                  const active = actionLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setActionLevel(opt.id);
                        setError("");
                      }}
                      className={[
                        "w-full p-4 text-left rounded-xl border transition-all duration-200 group",
                        active
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-600",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium">{opt.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{opt.desc}</div>
                        </div>
                        <ArrowRight
                          size={20}
                          className={[
                            "transition-colors",
                            active
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400",
                          ].join(" ")}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step.id === "keywords" && (
              <>
                <div className="flex gap-2">
                  <input
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    placeholder="Escribe una keyword..."
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400/40"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddKeyword();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={onAddKeyword}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold px-4 py-3 hover:shadow-lg transition-all duration-200"
                  >
                    <Plus size={18} />
                    Agregar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {keywords.map(k => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full text-sm font-semibold"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => removeKeyword(k)}
                        className="opacity-80 hover:opacity-100"
                        aria-label={`Eliminar ${k}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      Aún no agregas keywords.
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {KEYWORD_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addKeyword(s)}
                      className="text-sm px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-600 transition"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Controls (mantiene tu “pasar de pregunta”) */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="inline-flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Atrás
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              {currentStep < STEPS.length - 1 ? "Siguiente" : "Finalizar"}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
