'use client';

import Link from "next/link";
import { BookOpen, Star, ArrowRight } from 'lucide-react';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizLanding() {
  const router = useRouter();

  useEffect(() => {
    const checkQuiz = async () => {
      try {
        const res = await fetch("/api/quiz/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 200) {
          // Ya hizo el quiz → main
          router.replace("/main");
          return;
        }

        if (res.status === 401) {
          // No autenticado → login
          router.replace("/login");
          return;
        }

        // 404 u otro → se queda en /quiz para hacerlo
      } catch {
        // Error de red → login por seguridad
        router.replace("/login");
      }
    };

    checkQuiz();
  }, [router]);

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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full text-amber-800 dark:text-amber-200 font-medium mb-6">
            <Star size={16} />
            Quiz Interactivo
          </div>

          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Descubre Tu Próximo Libro Favorito
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Responde unas pocas preguntas y obtén recomendaciones personalizadas de libros basadas en tus gustos y preferencias literarias.
          </p>

          <Link
            href="/quiz/start"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Empezar Quiz
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Recomendaciones Personalizadas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Basado en tus respuestas, te sugerimos libros que realmente disfrutarás.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Rápido y Divertido
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Solo toma 5 minutos completar el quiz y obtener tus resultados.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Amplia Biblioteca
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Accede a miles de libros de diferentes géneros y autores.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Listo para encontrar tu próxima lectura?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Únete a miles de lectores que han descubierto sus libros favoritos a través de nuestro quiz.
          </p>

          <Link
            href="/quiz/start"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Comenzar Ahora
            <ArrowRight size={20} />
          </Link>
        </div>
      </main>
    </div>
  );
}
