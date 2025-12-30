'use client';

import Link from "next/link";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function SignUp() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const validatePassword = (password: string) => {
    setValidations({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') validatePassword(value);

    // limpia errores
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverError) setServerError(null);
    if (serverSuccess) setServerSuccess(null);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un correo válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!Object.values(validations).every(v => v)) {
      newErrors.password = 'La contraseña no cumple con los requisitos';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Intento principal: { fullName, email, password }
      let res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      let data: any = await res.json().catch(() => ({}));

      // Fallback 1: muchos backends esperan "name" en vez de "fullName"
      if (!res.ok) {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
          }),
        });
        data = await res.json().catch(() => ({}));
      }

      // Fallback 2: algunos esperan username (o usan email como username)
      if (!res.ok) {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.email,
            email: formData.email,
            password: formData.password,
            name: formData.fullName,
          }),
        });
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        const detail = data?.detail ?? "No se pudo registrar";
        setServerError(typeof detail === "string" ? detail : JSON.stringify(detail));
        return;
      }

      // ✅ Registro OK (si el backend devuelve token, el route handler lo guardará como cookie)
      setServerSuccess("Cuenta creada correctamente. Redirigiendo...");

      // ✅ Decide a dónde mandar: quiz (si no está hecho) o main (si ya existe)
      // Nota: /api/quiz/me debe existir en tu Next (route handler) y apuntar al backend (/quiz/me)
      try {
        const quizRes = await fetch("/api/quiz/me", {
  method: "GET",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
});

if (quizRes.status === 200) {
  router.replace("/main");
  router.refresh();
  return;
}

// 401 (no auth) o 404 (no hecho) o cualquier otro -> quiz
router.replace("/quiz");
router.refresh();
return;

      } catch {
        // Si por lo que sea falla la verificación, mandamos a quiz (flujo seguro)
        router.replace("/quiz");
        router.refresh();
        return;
      }
    } catch {
      setServerError("Error de red. Verifica que Next y el backend estén corriendo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <div className="flex items-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
          <Link href="/">ReviewSense</Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          {/* SignUp Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-2xl p-8 sm:p-12">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Crear Cuenta
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Únete a nuestra comunidad de lectores
              </p>
            </div>

            {/* ✅ Backend error */}
            {serverError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {serverError}
              </div>
            )}

            {/* ✅ Backend success */}
            {serverSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                {serverSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Juan García"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition`}
                    autoComplete="name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                      errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-3 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Requisitos de contraseña:
                    </p>
                    {[
                      { key: 'minLength', label: 'Mínimo 8 caracteres' },
                      { key: 'hasUpperCase', label: 'Una mayúscula' },
                      { key: 'hasLowerCase', label: 'Una minúscula' },
                      { key: 'hasNumber', label: 'Un número' },
                      { key: 'hasSpecial', label: 'Un carácter especial (!@#$%^&*)' },
                    ].map(req => (
                      <div key={req.key} className="flex items-center gap-2">
                        <CheckCircle
                          size={14}
                          className={validations[req.key as keyof typeof validations] ? 'text-green-500' : 'text-gray-300'}
                        />
                        <span className={`text-xs ${
                          validations[req.key as keyof typeof validations] ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                    }}
                    className="w-4 h-4 mt-1 rounded border-gray-300 dark:border-gray-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Acepto los{' '}
                    <a href="#" className="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition">
                      Términos de Servicio
                    </a>
                    {' '}y la{' '}
                    <a href="#" className="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition">
                      Política de Privacidad
                    </a>
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.terms}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Footer Info */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-8">
            Al registrarte, aceptas nuestros{' '}
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300 underline">
              Términos de Servicio
            </a>
            {' '}y{' '}
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300 underline">
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
