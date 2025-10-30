import { useEffect } from 'react'
import { Link, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './state/store'
import logo from './assets/logo-sumakey.png' // LOGO
import Footer from './components/layout/Footer'

// Core pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Program from './pages/Program'
import Clients from './pages/Clients'
import PublicRegister from './pages/PublicRegister'
import Scan from './pages/Scan'
import QRView from './pages/QRView'

// Marketing
import Home from './pages/marketing/Home'
import Solucion from './pages/marketing/Solucion'
import Precios from './pages/marketing/Precios'
import FAQ from './pages/marketing/FAQ'
import Blog from './pages/marketing/Blog'
import Contacto from './pages/marketing/Contacto'

// Panel (dentro del dashboard)
import Cards from './pages/panel/Cards'
import RestaurantGeneral from './pages/panel/RestaurantGeneral'
import RestaurantPrograms from './pages/panel/RestaurantPrograms'
import RestaurantLanding from './pages/panel/RestaurantLanding'
import RestaurantDesign from './pages/panel/RestaurantDesign'
import RestaurantQRSignup from './pages/panel/RestaurantQRSignup'
import RestaurantHistory from './pages/panel/RestaurantHistory'

/** Protege rutas que requieren sesión */
function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

/** Header global con logo grande y limpio */
function Nav() {
  const { token, business, logout } = useAuth()
  const { pathname } = useLocation()

  const NavLinkItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      className={
        'px-2 py-1 rounded-md hover:text-brand transition ' +
        (pathname === to ? 'text-brand font-semibold' : 'text-gray-700')
      }
    >
      {children}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="Sumakey"
            className="h-12 md:h-14 w-auto transition-transform duration-200 group-hover:scale-105"
            loading="eager"
          />
        </Link>

        {/* Menú público */}
        <nav className="hidden md:flex gap-4 text-[15px] font-medium">
          <NavLinkItem to="/solucion">Solución</NavLinkItem>
          <NavLinkItem to="/precios">Precios</NavLinkItem>
          <NavLinkItem to="/faq">FAQ</NavLinkItem>
          <NavLinkItem to="/blog">Blog</NavLinkItem>
          <NavLinkItem to="/contacto">Contacto</NavLinkItem>
          {token && <NavLinkItem to="/dashboard">Dashboard</NavLinkItem>}
        </nav>

        {/* Acciones derecha */}
        <div className="ml-auto flex items-center gap-3">
          {!token ? (
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="px-3 py-2 rounded-xl bg-brand text-white text-sm font-semibold shadow-[0_5px_15px_rgba(255,106,0,0.30)] hover:opacity-90 transition"
              >
                Prueba 14 días
              </Link>
            </>
          ) : (
            <>
              {business && (
                <span className="hidden md:inline text-sm text-gray-600">
                  {business.name}
                </span>
              )}
              <button
                onClick={logout}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm transition"
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isShelllessRoute = /^\/(public|qr)\//.test(pathname)
  const { token, business, refreshMe } = useAuth()

  // ✅ NUEVO: refresca el negocio si hay token pero no está cargado
  useEffect(() => {
    if (token && !business) {
      refreshMe().catch(() => {
        console.warn('No se pudo refrescar negocio (token inválido o expirado)')
      })
    }
  }, [token, business, refreshMe])

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {!isShelllessRoute && <Nav />}

      <div className={isShelllessRoute ? '' : 'flex-1'}>
        <Routes>
          {/* Marketing (público) */}
          <Route path="/" element={<Home />} />
          <Route path="/solucion" element={<Solucion />} />
          <Route path="/precios" element={<Precios />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* Auth (público) */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Público: registro de clientes (sin shell) */}
          <Route path="/public/:slug" element={<PublicRegister />} />
          <Route path="/qr/:clientId" element={<QRView />} />

          {/* App protegida */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/clientes"
            element={
              <RequireAuth>
                <Clients />
              </RequireAuth>
            }
          />
          <Route
            path="/programa"
            element={
              <RequireAuth>
                <Program />
              </RequireAuth>
            }
          />
          <Route
            path="/scan"
            element={
              <RequireAuth>
                <Scan />
              </RequireAuth>
            }
          />

          {/* Panel Restaurante (todas protegidas) */}
          <Route
            path="/tarjetas"
            element={
              <RequireAuth>
                <Cards />
              </RequireAuth>
            }
          />
          <Route
            path="/restaurante/general"
            element={
              <RequireAuth>
                <RestaurantGeneral />
              </RequireAuth>
            }
          />
          <Route
            path="/restaurante/programas"
            element={
              <RequireAuth>
                <RestaurantPrograms />
              </RequireAuth>
            }
          />
          <Route
            path="/restaurante/landing"
            element={
              <RequireAuth>
                <RestaurantLanding />
              </RequireAuth>
            }
          />
          <Route
            path="/restaurante/diseno"
            element={
              <RequireAuth>
                <RestaurantDesign />
              </RequireAuth>
            }
          />
          <Route
            path="/restaurante/qr-alta"
            element={
              <RequireAuth>
                <RestaurantQRSignup />
              </RequireAuth>
            }
          />
          <Route
            path="/restaurante/historial"
            element={
              <RequireAuth>
                <RestaurantHistory />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {!isShelllessRoute && <Footer />}
    </div>
  )
}
