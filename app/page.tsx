'use client';

import Link from "next/link";
import { BookOpen, Star, Users, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            <BookOpen size={28} />
            ReviewSense
          </div>
          <button className="px-6 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium">
            <Link href="/login">
            Comenzar
            </Link>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
            Descubre tu próximo libro favorito
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            ReviewSense te ayuda a encontrar las mejores recomendaciones de libros basadas en tus preferencias y las opiniones de la comunidad lectora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:shadow-lg transition-shadow">
              <Link href="/main">
              Explorar Libros
              </Link>
            </button>
            <button className="px-8 py-4 rounded-full border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              Saber Más
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-950 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            ¿Por qué elegir ReviewSense?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-block p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Sparkles className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Recomendaciones Inteligentes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Algoritmos avanzados que aprenden de tus gustos para recomendarte libros que realmente amarás.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-block p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Users className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Comunidad Activa
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Conecta con otros lectores, comparte reseñas y descubre lo que la comunidad recomienda.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-block p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Star className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Reseñas Verificadas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Lee opiniones de lectores reales y confía en reseñas verificadas de la comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-12 sm:p-16 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para encontrar tu próxima lectura?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Únete a miles de lectores que ya están descubriendo sus libros favoritos con ReviewSense.
          </p>
          <button className="px-8 py-4 rounded-full bg-white text-amber-600 font-semibold text-lg hover:shadow-lg transition-shadow">
            <Link href="/singup">
            Crear Cuenta Gratis
            </Link>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Explorar</a></li>
                <li><a href="#" className="hover:text-white transition">Recomendaciones</a></li>
                <li><a href="#" className="hover:text-white transition">Listas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Comunidad</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Foro</a></li>
                <li><a href="#" className="hover:text-white transition">Eventos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Términos</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Soporte</a></li>
                <li><a href="#" className="hover:text-white transition">Email</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 ReviewSense. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
