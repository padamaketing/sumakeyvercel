import { Link, NavLink } from "react-router-dom"
import logo from "../../assets/logo-sumakey.png"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 md:py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="Sumakey logo"
            className="h-9 w-auto transition-transform duration-200 group-hover:scale-105"
            loading="eager"
          />
        </Link>

        {/* Menu */}
        <ul className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-700">
          {[
            { name: "Solución", to: "/solucion" },
            { name: "Precios", to: "/precios" },
            { name: "FAQ", to: "/faq" },
            { name: "Blog", to: "/blog" },
            { name: "Contacto", to: "/contacto" },
          ].map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `hover:text-brand transition ${
                    isActive ? "text-brand font-semibold" : ""
                  }`
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Botones */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/registro"
            className="px-4 py-2.5 text-white font-semibold rounded-xl bg-brand shadow-[0_5px_15px_rgba(255,106,0,0.3)] hover:opacity-90 transition"
          >
            Prueba 14 días
          </Link>
          <Link
            to="/login"
            className="px-4 py-2.5 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>
    </header>
  )
}
