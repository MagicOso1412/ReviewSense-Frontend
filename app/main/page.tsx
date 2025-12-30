'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from "next/navigation";
import { BookOpen, Search, Star, Heart, ChevronDown, X } from 'lucide-react';
import type { RecommendationOut } from "@/lib/types/recommend";

interface BookFromApi {
  id: string;
  title: string;
  author: string;
  description: string;
}

interface BookUI {
  id: string;
  title: string;
  author: string;
  rating: number;
  reviews: number;
  price: number;
  cover: string;
  genre: string;
  description: string;
  synopsis?: string;
}

interface Review {
  username: string;
  text: string;
  id: string;
  sentiment_label?: string;
  sentiment_score?: number;
}

const defaultCovers = ['📚', '✨', '🌍', '⚔️', '💫', '🔒', '🐉', '🧠'];
const genres = ['Todos', 'Tecnología', 'Ficción', 'Historia', 'Clásico', 'Romance', 'Distopía', 'Fantasía', 'Biografía'];

export default function CatalogPage() {
  const router = useRouter();

  // ====== Auth (NUEVO) ======
  const [isAuthed, setIsAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ====== Libros desde backend ======
  const [apiBooks, setApiBooks] = useState<BookFromApi[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  // ====== UI ======
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [sortBy, setSortBy] = useState('popular');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // ====== Reseñas ======
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // ====== Crear reseña (solo authed) ======
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewUser, setNewReviewUser] = useState("");
  const [postingReview, setPostingReview] = useState(false);
  const [postReviewError, setPostReviewError] = useState<string | null>(null);
  const [postReviewOk, setPostReviewOk] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);

  // ====== RECOMENDACIONES (NUEVO) ======
  const [recs, setRecs] = useState<RecommendationOut[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  // ====== Check sesión (NUEVO) ======
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        setIsAuthed(Boolean(data?.authenticated));
      } catch {
        setIsAuthed(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ====== Cargar RECOMENDACIONES (NUEVO) ======
  useEffect(() => {
    const loadRecs = async () => {
      // Si no hay sesión, no pedimos recomendaciones.
      if (authLoading || !isAuthed) {
        setRecs([]);
        setRecsLoading(false);
        setRecsError(null);
        return;
      }

      setRecsLoading(true);
      setRecsError(null);

      try {
        // Gate: si no hay quiz, mandar a /quiz
        const quizRes = await fetch("/api/quiz/me", { cache: "no-store", credentials: "include" });

        if (quizRes.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }
        if (quizRes.status === 404 || quizRes.status === 400) {
          router.push("/quiz");
          router.refresh();
          return;
        }
        if (!quizRes.ok) {
          setRecsError(`No se pudo validar el quiz (${quizRes.status})`);
          setRecs([]);
          return;
        }

        const recRes = await fetch("/api/recommend/by-quiz", { cache: "no-store", credentials: "include" });

        if (recRes.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }

        const data = await recRes.json().catch(() => null);

        if (!recRes.ok) {
          setRecsError((data?.detail as string) ?? `Error al cargar recomendaciones (${recRes.status})`);
          setRecs([]);
          return;
        }

        if (!Array.isArray(data)) {
          setRecsError("La API de recomendaciones no devolvió un arreglo");
          setRecs([]);
          return;
        }

        setRecs(data);
      } catch {
        setRecsError("Error de red al cargar recomendaciones");
        setRecs([]);
      } finally {
        setRecsLoading(false);
      }
    };

    loadRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthed]);

  // ====== Logout (NUEVO) ======
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // incluso si falla, limpiamos estado local
    } finally {
      setIsAuthed(false);
      setSelectedBookId(null);
      setReviews([]);
      setReviewsError(null);

      // limpiar recs
      setRecs([]);
      setRecsError(null);
      setRecsLoading(false);

      router.push("/login");
      router.refresh();
    }
  };

  // ====== Cargar libros ======
  useEffect(() => {
    const loadBooks = async () => {
      setBooksLoading(true);
      setBooksError(null);

      try {
        const res = await fetch("/api/libros", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (data?.ok === false) {
          setBooksError(`Error API libros: ${data.status}`);
          setApiBooks([]);
          return;
        }

        if (!Array.isArray(data)) {
          setBooksError("La API no devolvió una lista de libros");
          setApiBooks([]);
          return;
        }

        const normalized: BookFromApi[] = data
          .map((b: any) => ({
            id: String(b.id ?? "").trim(),
            title: String(b.title ?? "Sin título"),
            author: String(b.author ?? "Autor desconocido"),
            description: String(b.description ?? ""),
          }))
          .filter((b: any) => b.id.length > 0);

        setApiBooks(normalized);
      } catch {
        setBooksError("Error de red al cargar libros");
        setApiBooks([]);
      } finally {
        setBooksLoading(false);
      }
    };

    loadBooks();
  }, []);

  // ====== Convertir a tu UI SIN perder id ======
  const booksUI: BookUI[] = useMemo(() => {
    return apiBooks.map((b, i) => {
      const cover = defaultCovers[i % defaultCovers.length];
      const genre = genres[1 + (i % (genres.length - 1))]; // evita "Todos"
      return {
        id: b.id,
        title: b.title,
        author: b.author,
        rating: 4.6 + ((i % 4) * 0.1),
        reviews: 300 + (i * 7) % 9000,
        price: 18.99 + (i % 7) * 3,
        cover,
        genre,
        description: b.description || 'Sin descripción disponible.',
        synopsis: b.description || 'Sin sinopsis disponible.',
      };
    });
  }, [apiBooks]);

  // ====== Filtrado + orden ======
  const filteredBooks = useMemo(() => {
    return booksUI
      .filter(book =>
        (selectedGenre === 'Todos' || book.genre === selectedGenre) &&
        (book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return b.reviews - a.reviews;
      });
  }, [booksUI, selectedGenre, searchTerm, sortBy]);

  // selectedBook desde booksUI (no filteredBooks)
  const selectedBook = useMemo(() => {
    const id = String(selectedBookId ?? "").trim();
    if (!id) return null;
    return booksUI.find(b => b.id === id) ?? null;
  }, [booksUI, selectedBookId]);

  // ====== Favoritos ======
  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  // ====== Cargar reseñas (solo si authed) ======
  const loadReviews = async (bookIdRaw?: string) => {
    const id = String(bookIdRaw ?? selectedBookId ?? "").trim();

    if (!id) {
      setReviews([]);
      setReviewsError(null);
      setReviewsLoading(false);
      return;
    }

    if (!isAuthed) {
      setReviews([]);
      setReviewsError(null);
      setReviewsLoading(false);
      return;
    }

    setReviews([]);
    setReviewsError(null);
    setReviewsLoading(true);

    try {
      const url = `/api/libros/${encodeURIComponent(id)}/resenas`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (data?.ok === false) {
        setReviewsError(data.detail ?? `Error reseñas (${data.status})`);
        return;
      }

      if (!res.ok) {
        setReviewsError(`No se pudieron cargar las reseñas (${res.status})`);
        return;
      }

      if (!Array.isArray(data)) {
        setReviewsError("La API de reseñas no devolvió un arreglo");
        return;
      }

      setReviews(data);
    } catch {
      setReviewsError("Error de red al cargar reseñas");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const id = String(selectedBookId ?? "").trim();
    if (!id) return;

    loadReviews(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookId]);

  // ====== POST reseña (solo authed) ======
  const submitReview = async () => {
    const id = String(selectedBookId ?? "").trim();
    const text = newReviewText.trim();
    const username = (newReviewUser.trim() || "Anon");
    const ratingNum = Number(rating ?? 0);

    setPostReviewError(null);
    setPostReviewOk(null);

    if (!isAuthed) {
      setPostReviewError("Necesitas iniciar sesión para escribir reseñas.");
      return;
    }
    if (!id) {
      setPostReviewError("No hay libro seleccionado (id vacío).");
      return;
    }
    if (!text) {
      setPostReviewError("Escribe una reseña antes de enviar.");
      return;
    }

    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      setPostReviewError("El rating debe ser un número entre 1 y 5.");
      return;
    }

    setPostingReview(true);
    try {
      const res = await fetch(`/api/libros/${encodeURIComponent(id)}/resenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, text, rating: ratingNum }),
      });

      const raw = await res.text();
      let data: any = raw;
      try { data = raw ? JSON.parse(raw) : null; } catch { }

      if (!res.ok) {
        console.error(
          "Review failed:",
          "status=", res.status,
          "statusText=", res.statusText,
          "url=", res.url,
          "raw=", raw
        );
        throw new Error(`HTTP ${res.status}: ${raw || "Empty response body"}`);
      }

      if (data?.ok === false) {
        throw new Error(data?.detail ?? `No se pudo enviar (${data.status ?? "?"})`);
      }

      setPostReviewOk("Reseña enviada ✅");
      setNewReviewText("");

      await loadReviews(id);
    } catch (err: any) {
      console.error("POST REVIEW ERROR:", err);
      setPostReviewError(err?.message ?? "Error de red al enviar la reseña.");
    } finally {
      setPostingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            <Link href="/">ReviewSense</Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
              <Heart size={24} className="text-gray-600 dark:text-gray-400" />
            </button>

            {!authLoading && isAuthed && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Catálogo de Libros
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explora nuestra colección de miles de libros recomendados
          </p>
        </div>

        {/* ====== RECOMENDADO PARA TI (NUEVO) ====== */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recomendado para ti
            </h2>
            <Link
              href="/recommendations"
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
            >
              Ver todo
            </Link>
          </div>

          {!isAuthed ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-300">
              Inicia sesión para ver recomendaciones personalizadas.
            </div>
          ) : recsLoading ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-300">
              Cargando recomendaciones...
            </div>
          ) : recsError ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-6 text-red-700 dark:text-red-200">
              {recsError}
            </div>
          ) : recs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-300">
              Aún no hay recomendaciones. Prueba agregando más keywords en tu quiz o reseñas en libros.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recs.slice(0, 8).map((r, idx) => {
                // Intentamos mapear recomendación -> BookUI para mantener estética y funcionalidad (modal)
                const match = booksUI.find(b => b.id === r.book_id) ?? null;

                const cardTitle = match?.title ?? r.title ?? "Libro recomendado";
                const cardAuthor = match?.author ?? "Autor desconocido";
                const cardCover = match?.cover ?? defaultCovers[idx % defaultCovers.length];
                const cardGenre = match?.genre ?? "Recomendado";
                const cardDesc = match?.description ?? "Sin descripción disponible.";
                const cardRating = match?.rating ?? 4.7;
                const cardReviews = match?.reviews ?? 0;

                const openId = match?.id ?? r.book_id;

                return (
                  <div
                    key={`${r.book_id}-${idx}`}
                    onClick={() => {
                      const id = String(openId ?? "").trim();
                      if (!id) return;
                      setSelectedBookId(id);
                    }}
                    className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
                  >
                    {/* Cover */}
                    <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform duration-300">
                      {cardCover}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!openId) return;
                          toggleFavorite(openId);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <Heart
                          size={20}
                          className={`transition ${favorites.includes(openId)
                            ? 'text-red-500 fill-red-500'
                            : 'text-gray-400'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
                          {cardTitle}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold">
                          Score: {r.score}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {cardAuthor}
                      </p>

                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < Math.floor(cardRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                          ({Number(cardReviews).toLocaleString("es-ES")})
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                          {cardGenre}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 flex-1 line-clamp-2">
                        {cardDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Libros loading/error */}
        {booksLoading && (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-gray-700 dark:text-gray-300">
            Cargando libros...
          </div>
        )}
        {booksError && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-200">
            {booksError}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm mb-8 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por título o autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer transition"
            >
              <option value="popular">Más Popular</option>
              <option value="rating">Mejor Calificado</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {/* Genres Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${selectedGenre === genre
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {!booksLoading && !booksError && filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book, idx) => (
              <div
                key={book.id || `${book.title}-${book.author}-${idx}`}
                onClick={() => {
                  const id = String(book.id ?? "").trim();
                  if (!id) return;
                  setSelectedBookId(id);
                }}
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
              >
                {/* Book Cover */}
                <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform duration-300">
                  {book.cover}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!book.id) return;
                      toggleFavorite(book.id);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Heart
                      size={20}
                      className={`transition ${favorites.includes(book.id)
                        ? 'text-red-500 fill-red-500'
                        : 'text-gray-400'
                        }`}
                    />
                  </button>
                </div>

                {/* Book Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {book.author}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(book.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                      ({book.reviews})
                    </span>
                  </div>

                  {/* Genre Badge */}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                      {book.genre}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 flex-1 line-clamp-2">
                    {book.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !booksLoading && !booksError && (
            <div className="text-center py-16">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron libros
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta ajustar tu búsqueda o filtros
              </p>
            </div>
          )
        )}
      </main>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBookId(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBookId(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition z-10"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>

            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row gap-8 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-48 h-72 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center text-8xl shadow-lg">
                    {selectedBook.cover}
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedBook.title}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                    Por {selectedBook.author}
                  </p>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={24}
                          className={
                            i < Math.floor(selectedBook.rating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      ))}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedBook.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        ({selectedBook.reviews.toLocaleString("es-ES")} reseñas)
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold">
                      {selectedBook.genre}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(selectedBook.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    <Heart size={20} className={favorites.includes(selectedBook.id) ? "fill-current" : ""} />
                    {favorites.includes(selectedBook.id) ? "Favorito" : "Agregar a Favoritos"}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 my-8" />

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sinopsis</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedBook.synopsis || selectedBook.description}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Descripción</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedBook.description}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 my-8" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reseñas</h2>

                {reviewsLoading && <p className="text-gray-600 dark:text-gray-400">Cargando reseñas...</p>}
                {reviewsError && <p className="text-red-600 dark:text-red-400">{reviewsError}</p>}

                {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400">Este libro aún no tiene reseñas.</p>
                )}

                {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {reviews.slice(0, 50).map((r, idx) => (
                      <div
                        key={r.id || `${r.username}-${idx}`}
                        className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {r.username}
                          </span>
                          {r.sentiment_label && (
                            <span className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              {r.sentiment_label}
                              {typeof r.sentiment_score === "number" ? ` (${r.sentiment_score.toFixed(2)})` : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  {authLoading ? (
                    <p className="text-gray-600 dark:text-gray-400">Verificando sesión...</p>
                  ) : !isAuthed ? (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        Inicia sesión para escribir una reseña.
                      </p>
                      <Link
                        href="/login"
                        className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold"
                      >
                        Ir a Login
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
                      {postReviewError && (
                        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{postReviewError}</p>
                      )}
                      {postReviewOk && (
                        <p className="mb-3 text-sm text-green-700 dark:text-green-400">{postReviewOk}</p>
                      )}

                      <div className="grid gap-3">
                        <input
                          value={newReviewUser}
                          onChange={(e) => setNewReviewUser(e.target.value)}
                          placeholder="Tu nombre (opcional)"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        />
                        <textarea
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                          placeholder="Escribe tu reseña..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        />
                        <button
                          type="button"
                          disabled={postingReview}
                          onClick={submitReview}
                          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {postingReview ? "Enviando..." : "Enviar reseña"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
