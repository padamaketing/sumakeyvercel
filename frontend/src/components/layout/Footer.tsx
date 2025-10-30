import { Link } from "react-router-dom"
import logo from "../../assets/logo-sumakey.png" // reutilizamos tu PNG

export default function Footer() {
  return (
    <footer className="mt-16 bg-neutral-50 border-t">
      {/* Bloque principal */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        {/* Columna 1: Logo + texto + redes */}
        <div>
          <Link to="/" className="inline-flex items-center">
            <img
              src={logo}
              alt="Sumakey"
              className="h-8 w-auto"
              loading="lazy"
            />
          </Link>
          <p className="mt-4 text-sm text-gray-600 max-w-sm">
            La solución de fidelización basada en el Mobile Wallet más
            versátil y fácil de usar del mercado.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
              </svg>
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="6.5" y="10" width="2.5" height="7" fill="currentColor"/>
                <circle cx="7.7" cy="7.5" r="1.3" fill="currentColor"/>
                <path d="M12 17v-4a2 2 0 0 1 4 0v4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M14 9h-2v-2a1 1 0 0 1 1-1h1V3h-2a4 4 0 0 0-4 4v2H6v3h2v9h4v-9h2l1-3Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Columna 2: Acceso rápido */}
        <div>
          <h4 className="text-gray-900 font-semibold text-lg">Acceso rápido</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/precios" className="text-gray-700 hover:text-brand">
                Precios
              </Link>
            </li>
            <li>
              <Link to="/blog" className="text-gray-700 hover:text-brand">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/solucion" className="text-gray-700 hover:text-brand">
                Solución
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Información de contacto (dummy por ahora) */}
        <div>
          <h4 className="text-gray-900 font-semibold text-lg">Información de contacto</h4>

          <div className="mt-4 space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-brand mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <p>
                Calle Ejemplo 123<br/>Ciudad, País
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22 16.9v2a2 2 0 0 1-2.2 2c-1.9-.2-3.8-.9-5.5-1.9a19 19 0 0 1-6-6c-1-1.7-1.7-3.6-1.9-5.5A2 2 0 0 1 7.4 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L10 9.9a15 15 0 0 0 4.9 4.9l1.5-1.5a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <p>+34 000 000 000</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 6l8 6 8-6v12H4V6Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <p>info@sumakey.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Banda legal inferior */}
      <div className="bg-sky-800 text-white text-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-2 md:gap-6 items-center justify-between">
          <div className="text-center md:text-left">
            <a href="#" className="hover:underline">Términos y condiciones</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:underline">Política de privacidad</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:underline">Política de cookies</a>
          </div>
          <div className="opacity-90 text-center md:text-right">
            Copyright © {new Date().getFullYear()} Sumakey.
          </div>
        </div>
      </div>
    </footer>
  )
}
