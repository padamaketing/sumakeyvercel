import { Link } from "react-router-dom"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import heroImg from "../../assets/hero-sumakey.png"
import stackImg from "../../assets/marketing-stack.png"
import phoneImg from "../../assets/phone-sumakey.png"
import pricingImg from "../../assets/plan-25.png" // tu imagen de precios

/**
 * Home – Secciones (todas con animaciones on-scroll):
 * 1) Hero (texto izquierda + imagen derecha)
 * 2) Hacemos fácil la fidelización (heading + 3 features con stagger)
 * 3) Mobile wallet marketing (texto + imagen + 4 cards con stagger)
 * 4) Beneficios de Sumakey (benefits + phone + benefits)
 * 5) Ecosistema Sumakey (2 bloques)
 * 6) Clientes que confían (contadores + logos)
 * 7) Teaser de precios (imagen entra desde la izq + texto)
 */

export default function Home() {
  // ---- Intersection observer para contadores (una sola vez)
  const statsRef = useRef<HTMLDivElement | null>(null)
  const [statsInView, setStatsInView] = useState(false)

  useEffect(() => {
    if (!statsRef.current) return
    const el = statsRef.current
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <main className="min-h-screen bg-white">
      {/* ========== 1) HERO ========== */}
      <section aria-label="Hero" className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-white via-white to-orange-50" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          {/* Columna izquierda: textos */}
          <Reveal variant="left">
            <div>
              <p className="text-sm font-semibold text-brand/80 mb-3">
                Más que un programa de fidelización
              </p>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-5">
                Incentiva la repetición de compra con{" "}
                <span className="text-brand">Sumakey</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                La solución de fidelización basada en el Mobile Wallet más
                versátil y fácil de usar del mercado.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/registro"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-brand text-white font-semibold shadow-[0_10px_30px_rgba(255,106,0,0.25)] hover:opacity-90 transition"
                >
                  Empieza gratis
                </Link>
                <Link
                  to="/solucion"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition"
                >
                  Ver solución
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-white">
                  ⭐ 4.9/5 negocios satisfechos
                </span>
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-white">
                  🔒 Sin apps — Wallet nativo
                </span>
              </div>
            </div>
          </Reveal>

          {/* Columna derecha: imagen + pop-up */}
          <Reveal variant="right">
            <div className="relative">
              <div aria-hidden className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl" />
              <img
                src={heroImg}
                alt="Tarjeta Sumakey en el móvil y una clienta feliz"
                className="relative z-[1] w-full max-w-xl mx-auto rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] object-contain"
                loading="eager"
              />
              <div
                role="status"
                aria-live="polite"
                className="hidden sm:flex items-start gap-3 absolute z-[2] top-6 left-6 bg-white/95 backdrop-blur border rounded-xl px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
              >
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                  S
                </div>
                <div className="text-[13px] leading-snug">
                  <p className="font-semibold">SUMAKEY · WALLET</p>
                  <p className="text-gray-700">
                    Hola Fernando, mañana tienes un{" "}
                    <span className="font-semibold">20% de descuento</span>.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== 2) HACEMOS FÁCIL LA FIDELIZACIÓN ========== */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-16 md:pb-20">
        <div aria-hidden className="hidden md:block absolute left-0 top-16 h-32 w-6 rounded-r-full bg-gradient-to-b from-orange-200/40 to-transparent" />
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <Reveal variant="up">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Hacemos fácil la <span className="text-brand">fidelización</span>
            </h2>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <p className="text-gray-600 text-lg">
              Sumakey es una <span className="font-semibold">solución integral</span> de fidelización que te
              permite personalizar cada detalle del programa, adaptándolo a tu negocio y a tus clientes.
              Con tarjetas digitales para Apple Wallet y Google Wallet, escaneo web y mensajes inteligentes,
              lograrás una experiencia moderna y eficaz sin apps.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-8">
          <Reveal variant="up">
            <FeatureCard
              icon={<IconCup />}
              title="Pequeños negocios locales"
              desc="Configuración sencilla y rápida. Tus clientes se adhieren con un escaneo y guardan su tarjeta en el móvil. Ideal para construir clientes fieles."
            />
          </Reveal>
          <Reveal variant="up" delay={120}>
            <FeatureCard
              icon={<IconBuilding />}
              title="Cadenas y grupos"
              desc="Campañas, control por locales, mensajes personalizados y métricas. Escala sin cambiar tus procesos."
            />
          </Reveal>
          <Reveal variant="up" delay={240}>
            <FeatureCard
              icon={<IconWallet />}
              title="Amplia gama de programas"
              desc="Sellos, puntos o niveles. Cumpleaños, catálogo de premios y reglas flexibles enfocadas a la repetición."
            />
          </Reveal>
        </div>

        <Reveal variant="up" delay={120}>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold shadow-[0_10px_30px_rgba(255,106,0,0.25)] hover:opacity-95 transition"
            >
              Solicita demo <span className="ml-2" aria-hidden>➜</span>
            </Link>
            <Link
              to="/registro"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition"
            >
              Prueba 14 días <span className="ml-2 text-xs rounded-full border px-1.5 py-0.5">0€</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ========== 3) MOBILE WALLET MARKETING ========== */}
      <section className="px-6 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[28px] overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-sky-100 to-sky-200" aria-hidden />
            <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-10 p-6 md:p-10">
              {/* Columna izquierda: textos + imagen apilada */}
              <div className="flex flex-col justify-between">
                <Reveal variant="left">
                  <div className="max-w-xl">
                    <p className="text-sm font-semibold text-sky-700/90 mb-2">
                      Canal de comunicación directo
                    </p>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-sky-900 mb-4">
                      Mobile wallet marketing
                    </h3>
                    <p className="text-sky-900/80">
                      Convierte el wallet móvil de tus clientes en un{" "}
                      <span className="font-semibold">canal directo</span> y personalizado.
                      Experiencias contextuales, <span className="font-semibold">en el bolsillo</span> de tus clientes.
                    </p>
                  </div>
                </Reveal>

                <Reveal variant="up" delay={120}>
                  <div className="mt-8">
                    <img
                      src={stackImg}
                      alt="Tarjetas de Sumakey apiladas sobre un smartphone"
                      className="w-full max-w-lg rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
                      loading="lazy"
                    />
                  </div>
                </Reveal>
              </div>

              {/* Columna derecha: grid 2x2 de cards */}
              <div className="grid sm:grid-cols-2 gap-6 self-start">
                <Reveal variant="up"><MarketingCard iconBg="bg-sky-500" icon={<IconCheck />} title="Conversión y fidelización" desc="Impulsa la recurrencia e incrementa el ticket medio, mejorando la retención." /></Reveal>
                <Reveal variant="up" delay={120}><MarketingCard iconBg="bg-sky-500" icon={<IconChat />} title="Comunicación personalizada" desc="Notificaciones contextuales y geolocalizadas en momentos clave." /></Reveal>
                <Reveal variant="up" delay={240}><MarketingCard iconBg="bg-orange-500" icon={<IconRocket />} title="Alcance y captación" desc="Aprovecha los QR para captar clientes al instante desde cualquier canal." /></Reveal>
                <Reveal variant="up" delay={360}><MarketingCard iconBg="bg-green-500" icon={<IconLeaf />} title="Sostenibilidad y eficiencia" desc="Menos papel, menos costes y una experiencia más responsable." /></Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4) BENEFICIOS DE SUMAKEY ========== */}
      <section className="bg-sky-50/60 border-y">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <Reveal variant="up">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-sm font-semibold text-sky-700/90">Funcionalidades que convierten</p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-sky-900">Beneficios de Sumakey</h3>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-10 items-center">
            {/* Columna izquierda: 3 beneficios */}
            <div className="space-y-10">
              <Reveal variant="up"><BenefitItem icon={<IconPhone />} title="100% digital" desc="Tarjeta de fidelización en el móvil, sin tarjetas físicas. Disponible en iPhone y Android." /></Reveal>
              <Reveal variant="up" delay={120}><BenefitItem icon={<IconSettings />} title="Facilidad de uso y gestión" desc="Crea tu programa en menos de un día y adminístralo desde un panel intuitivo." /></Reveal>
              <Reveal variant="up" delay={240}><BenefitItem icon={<IconQr />} title="Onboarding sin complicaciones" desc="Con un QR, tus clientes se unen en minutos y guardan la tarjeta en su Wallet." /></Reveal>
            </div>

            {/* Centro: teléfono */}
            <Reveal variant="scale" delay={120}>
              <div className="justify-self-center">
                <img
                  src={phoneImg}
                  alt="Tarjeta Sumakey mostrada en un iPhone"
                  className="w-[320px] md:w-[360px] lg:w-[400px] drop-shadow-2xl"
                  loading="lazy"
                />
              </div>
            </Reveal>

            {/* Columna derecha: 3 beneficios */}
            <div className="space-y-10">
              <Reveal variant="up"><BenefitItem icon={<IconUser />} title="Experiencia personalizada" desc="Mensajes y recompensas adaptadas a tu estrategia y al perfil de tus clientes." /></Reveal>
              <Reveal variant="up" delay={120}><BenefitItem icon={<IconChart />} title="Decisiones basadas en datos" desc="Analiza el comportamiento y mide resultados con histórico de acciones y métricas." /></Reveal>
              <Reveal variant="up" delay={240}><BenefitItem icon={<IconMegaphone />} title="Marketing efectivo y segmentado" desc="Activa campañas en momentos clave para aumentar la frecuencia y el ticket medio." /></Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5) EL ECOSISTEMA SUMAKEY ========== */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <Reveal variant="up">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-brand/90">Suite conectada para maximizar tu programa</p>
            <h3 className="text-3xl md:text-4xl font-extrabold">
              El ecosistema <span className="text-brand">Sumakey</span>
            </h3>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8">
          <Reveal variant="left">
            <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden border bg-gray-50 mb-5">
                <img
                  src={heroImg}
                  alt="Panel y experiencia Sumakey"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-start gap-3">
                <BadgeNumber>1</BadgeNumber>
                <div>
                  <h4 className="text-brand text-lg font-extrabold mb-1">Plataforma digital</h4>
                  <p className="text-sm text-gray-700">
                    Gestiona tarjetas, campañas y recompensas desde una plataforma centralizada accesible
                    en cualquier dispositivo. Diseña reglas, automatiza mensajes y consulta analítica para
                    tomar decisiones basadas en datos.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal variant="right">
            <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden border bg-gray-50 mb-5">
                <img
                  src={stackImg}
                  alt="Tarjetas de fidelización Sumakey en Apple Wallet y Google Wallet"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-start gap-3">
                <BadgeNumber>2</BadgeNumber>
                <div>
                  <h4 className="text-brand text-lg font-extrabold mb-1">Wallet cliente</h4>
                  <p className="text-sm text-gray-700">
                    Tus clientes siempre llevan la tarjeta en Apple Wallet o Google Wallet. Escanean un QR para
                    sumar sellos o puntos, y canjean recompensas al alcanzar el umbral. Experiencia nativa, sin apps.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-gray-50"> Wallet</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-gray-50">Google Wallet</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 bg-gray-50">QR Scan</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== 6) CLIENTES QUE CONFÍAN ========== */}
      <section className="relative">
        <Reveal variant="up">
          <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-sky-700 text-white">
            <div className="max-w-7xl mx-auto px-6 py-10 md:py-12 text-center">
              <h3 className="text-2xl md:text-3xl font-extrabold">Clientes que confían en Sumakey</h3>
              <p className="mt-3 text-white/90 max-w-3xl mx-auto text-sm md:text-base">
                Somos la solución de fidelización para pequeños negocios y cadenas. Tarjetas en Wallet, escaneo
                web y analítica para convertir cada visita en repetición.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="max-w-7xl mx-auto px-6 pb-12 md:pb-16" ref={statsRef}>
          <div className="grid sm:grid-cols-3 gap-8 py-8">
            <Reveal variant="up"><Metric prefix="+" to={100} duration={1200} running={statsInView} label="Clientes" format={(n) => new Intl.NumberFormat("es-ES").format(n)} accent="text-sky-700" /></Reveal>
            <Reveal variant="up" delay={120}><Metric prefix="+" to={1000} duration={1400} running={statsInView} label="Tarjetas emitidas" format={(n) => new Intl.NumberFormat("es-ES").format(n)} accent="text-sky-700" /></Reveal>
            <Reveal variant="up" delay={240}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-orange-500 select-none">
                  <span className="align-middle inline-flex items-center justify-center rounded-full border border-orange-300 px-4 py-1">
                    PIN
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">Identificación segura</div>
              </div>
            </Reveal>
          </div>

          <Reveal variant="up" delay={120}>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center">
              {["Cafés Luna", "Bar Central", "La Parrilla", "Green Sushi", "Hotel Sol", "Bocados"].map(
                (name) => <LogoPlaceholder key={name} label={name} />
              )}
            </div>
          </Reveal>

          <Reveal variant="up" delay={180}>
            <div className="mt-8 flex gap-3 justify-center">
              <Link
                to="/contacto"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition"
              >
                Solicita demo
              </Link>
              <Link
                to="/registro"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-brand text-white font-semibold shadow-[0_10px_30px_rgba(255,106,0,0.25)] hover:opacity-90 transition"
              >
                Prueba 14 días
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== 7) TEASER DE PRECIOS ========== */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <Reveal variant="left">
            <img
              src={pricingImg}
              alt="Plan Sumakey por 25 € al mes"
              className="w-full max-w-xl mx-auto rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.10)]"
              loading="lazy"
            />
          </Reveal>

          <Reveal variant="right">
            <div>
              <p className="text-sm font-semibold text-brand/90 mb-2">Planes claros</p>
              <h3 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                Hay un precio <span className="text-brand">Sumakey</span> para cada negocio
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                Elige un plan fijo y empieza a fidelizar sin complicaciones. Tarjetas en Wallet, escaneo por
                QR y recompensas listas para activar desde tu panel.
              </p>

              <div className="flex items-center gap-3">
                <Link
                  to="/precios"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
                >
                  Ver precios
                </Link>
                <span className="text-sm text-gray-500">Plan fijo: 25€ / mes</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* util (solo para el fade-in del pop-up del hero) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}

/* =========================================================
   REVEAL: componente de animación on-scroll reutilizable
   ========================================================= */

function Reveal({
  children,
  variant = "up",
  delay = 0,
  once = true,
}: {
  children: ReactNode
  variant?: "up" | "down" | "left" | "right" | "scale"
  delay?: number
  once?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setTimeout(() => setShown(true), delay)
          if (once) io.disconnect()
        } else if (!once) {
          setShown(false)
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay, once])

  const baseHidden = "opacity-0 will-change-transform"
  const baseShown = "opacity-100 translate-x-0 translate-y-0 scale-100"
  const dir =
    variant === "left"
      ? "-translate-x-6"
      : variant === "right"
      ? "translate-x-6"
      : variant === "down"
      ? "-translate-y-6"
      : variant === "up"
      ? "translate-y-6"
      : "scale-[0.97]"

  return (
    <div
      ref={ref}
      className={`transition-all duration-[800ms] ease-out ${
        shown ? baseShown : `${baseHidden} ${dir}`
      }`}
    >
      {children}
    </div>
  )
}

/* =========================
   Helpers / componentes UI
   ========================= */

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-3 text-gray-800">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function MarketingCard({
  iconBg,
  icon,
  title,
  desc,
}: {
  iconBg: string
  icon: ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur border p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-700">{desc}</p>
    </div>
  )
}

function BenefitItem({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="grid grid-cols-[40px_auto] gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center shadow">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  )
}

function BadgeNumber({ children }: { children: ReactNode }) {
  return (
    <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-lg shrink-0">
      {children}
    </div>
  )
}

function LogoPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-10 flex items-center justify-center rounded-md border text-gray-500 text-sm bg-white">
      {label}
    </div>
  )
}

/** Contador animado con requestAnimationFrame */
function Metric({
  prefix = "",
  to,
  duration = 1200,
  running,
  label,
  format,
  accent = "text-gray-900",
}: {
  prefix?: string
  to: number
  duration?: number
  running: boolean
  label: string
  format?: (n: number) => string
  accent?: string
}) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!running) return
    let raf = 0
    const start = performance.now()
    const animate = (t: number) => {
      const elapsed = t - start
      const p = Math.min(1, elapsed / duration)
      // Ease-out
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(to * eased))
      if (p < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [running, to, duration])

  const shown = useMemo(() => (format ? format(val) : String(val)), [val, format])

  return (
    <div className="text-center">
      <div className={`text-4xl md:text-5xl font-extrabold ${accent} select-none`}>
        {prefix}
        {shown}
      </div>
      <div className="mt-2 text-sm text-gray-500">{label}</div>
    </div>
  )
}

/* ---------- Icons (inline SVG) ---------- */

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 15a4 4 0 0 1-4 4H9l-6 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}
function IconRocket() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 13s3-6 10-9c0 0 3 3 3 7s-3 8-9 10c0 0-1-4-4-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
    </svg>
  )
}
function IconLeaf() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19C7 7 19 5 19 5s-2 12-14 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M5 19c4-6 8-10 14-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}
function IconCup() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 8h12v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M15 9h2.5a2.5 2.5 0 1 1 0 5H15" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}
function IconBuilding() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15M4 20h8M4 12h8M8 4v16" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 20V9a1 1 0 0 1 1-1h3v12h-4Z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}
function IconWallet() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 8a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M18 10h-4a2 2 0 1 0 0 4h4v-4Z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}
function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8 4a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}
function IconQr() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h6v6h-6v-6Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 9h6v6H9V9Z" fill="currentColor"/>
    </svg>
  )
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5M20 19H4" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 17V9M12 17V7M16 17v-5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}
function IconMegaphone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 11l12-5v12L3 13v-2Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M15 8l6-2v10l-6-2" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 14l1.5 4.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
