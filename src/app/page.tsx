"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  MessageCircle,
  Calendar,
  FileText,
  Instagram,
  Facebook,
  Mail,
  BarChart3,
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Zap,
  Shield,
  Globe,
  Search,
  ChevronRight,
  Minus,
  Plus,
  ArrowUpRight,
  Star,
  CheckCircle2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const features = [
  {
    icon: Users,
    title: "Contactos & Leads",
    desc: "Segmenta por tags, trackea fuente (WhatsApp, Instagram, referido), busqueda global instantanea.",
    color: "#10b981",
  },
  {
    icon: Building2,
    title: "Inventario de Propiedades",
    desc: "7 tipos de inmueble, multi-moneda, galeria de fotos, filtros combinables, GPS integrado.",
    color: "#3b82f6",
  },
  {
    icon: MessageCircle,
    title: "Inbox Unificado",
    desc: "WhatsApp, Instagram DMs y Facebook Messenger en una sola pantalla. Responde sin cambiar de app.",
    color: "#8b5cf6",
  },
  {
    icon: Calendar,
    title: "Calendario & Citas",
    desc: "Agenda visitas, vincula a contacto y propiedad. Notificaciones y estados de seguimiento.",
    color: "#f59e0b",
  },
  {
    icon: FileText,
    title: "Documentos & Contratos",
    desc: "Sube contratos, escrituras, avaluos. Vinculados al contacto y propiedad. Descarga segura.",
    color: "#ef4444",
  },
  {
    icon: BarChart3,
    title: "Dashboard & KPIs",
    desc: "Metricas en tiempo real: propiedades, contactos, citas, comisiones. Todo en un vistazo.",
    color: "#0ea5e9",
  },
];

const pwaFeatures = [
  {
    icon: Download,
    title: "Instala desde el navegador",
    desc: "Sin App Store, sin Google Play. Un tap y esta en tu pantalla de inicio.",
  },
  {
    icon: WifiOff,
    title: "Funciona sin internet",
    desc: "Consulta contactos, propiedades y citas incluso sin conexion. Se sincroniza al volver.",
  },
  {
    icon: Zap,
    title: "Rapida en cualquier telefono",
    desc: "Optimizada para gama media. Carga en menos de 2 segundos despues de la primera visita.",
  },
  {
    icon: Shield,
    title: "Segura como app nativa",
    desc: "HTTPS, autenticacion con Clerk, datos encriptados. Sin riesgos de apps de terceros.",
  },
];

const marketingFeatures = [
  { icon: Instagram, label: "Instagram", desc: "Publica fotos, responde DMs, ve metricas" },
  { icon: Facebook, label: "Facebook", desc: "Posts en tu pagina, comentarios, insights" },
  { icon: MessageCircle, label: "WhatsApp", desc: "Mensajes y templates via Meta Cloud API" },
  { icon: Mail, label: "Email", desc: "Campanas HTML a segmentos por tag" },
];

const faqItems = [
  {
    q: "¿Necesito descargar algo del App Store?",
    a: "No. Propi es una PWA que se instala directamente desde el navegador. Abre propi.app en Chrome o Safari, toca 'Agregar a pantalla de inicio' y listo. Sin tiendas, sin esperas, sin actualizaciones manuales.",
  },
  {
    q: "¿Funciona en mi telefono?",
    a: "Si. Propi esta optimizada para telefonos gama media en adelante. Funciona en Android 8+ y iOS 14+. Solo necesitas un navegador moderno (Chrome, Safari, Edge).",
  },
  {
    q: "¿Como se conecta con WhatsApp e Instagram?",
    a: "Usamos la Meta Graph API oficial. Conectas tu cuenta Business de Instagram, tu pagina de Facebook y tu numero de WhatsApp Business desde la configuracion. Un solo token para los tres canales.",
  },
  {
    q: "¿Mis datos estan seguros?",
    a: "Si. Autenticacion con Clerk (MFA, social login), conexiones HTTPS, archivos en storage privado con URLs firmadas que expiran. Tu datos nunca se comparten con terceros.",
  },
  {
    q: "¿Cuanto cuesta?",
    a: "Modelo por seat: pagas por usuario. Cada persona de tu equipo que necesite acceso es un seat. Sin costos ocultos, sin limites de contactos o propiedades.",
  },
  {
    q: "¿Puedo publicar en portales como Wasi o MercadoLibre?",
    a: "Estamos trabajando en integraciones con portales inmobiliarios. La publicacion en Wasi y MercadoLibre estara disponible desde la version web del CRM.",
  },
];

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: "#FAFAF8",
        color: "#111827",
        fontFamily: "var(--font-jakarta), sans-serif",
      }}
    >
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-[900px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute rounded-full" style={{ top: "-15%", left: "5%", width: 700, height: 700, background: "rgba(16,185,129,0.08)", filter: "blur(140px)" }} />
        <div className="absolute rounded-full" style={{ top: "5%", right: "0%", width: 800, height: 800, background: "rgba(139,92,246,0.06)", filter: "blur(140px)" }} />
      </div>

      {/* Nav */}
      <header className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-6 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight" style={{ color: "#0A2B1D" }}>
          <Building2 className="h-6 w-6" />
          Propi
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#6B7280" }}>
          <a href="#features" className="hover:text-gray-900 transition-colors">Funciones</a>
          <a href="#pwa" className="hover:text-gray-900 transition-colors">App Movil</a>
          <a href="#marketing" className="hover:text-gray-900 transition-colors">Marketing</a>
          <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-semibold hover:text-gray-900 transition-colors hidden md:block" style={{ color: "#6B7280" }}>
            Ingresar
          </Link>
          <Link href="/sign-up" className="text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-md" style={{ background: "#0A2B1D" }}>
            Empezar Gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full max-w-[1440px] mx-auto px-6 md:px-16 pt-16 md:pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8" style={{ background: "#E2F2E9", color: "#0A2B1D" }}>
            <Smartphone className="h-3.5 w-3.5" />
            CRM que se instala como app en tu telefono
          </div>

          <h1 className="text-4xl md:text-[72px] leading-[1.05] font-extrabold tracking-tight mb-6" style={{ color: "#0A2B1D" }}>
            Tu CRM y dashboard,
            <br />
            <span style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              en tu bolsillo.
            </span>
          </h1>

          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10" style={{ color: "#6B7280" }}>
            Dashboard, contactos, propiedades, citas, documentos e inbox unificado de WhatsApp, Instagram y Facebook. Todo desde una app que funciona hasta sin internet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/sign-up" className="text-white px-8 py-4 rounded-full text-base font-semibold hover:opacity-90 transition-all shadow-lg flex items-center gap-2" style={{ background: "#0A2B1D" }}>
              Empezar Gratis
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/preview" className="px-8 py-4 rounded-full text-base font-semibold border-2 flex items-center gap-2 hover:bg-gray-50 transition-colors" style={{ borderColor: "#d1d5db", color: "#374151" }}>
              Ver Demo
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Phone mockup - realistic iPhone style */}
          <div className="relative max-w-[320px] mx-auto">
            {/* Phone frame */}
            <div className="relative rounded-[48px] p-[10px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)]" style={{ background: "#1a1a1a" }}>
              {/* Notch / Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[32px] rounded-b-[20px] z-20" style={{ background: "#1a1a1a" }} />

              {/* Screen */}
              <div className="rounded-[38px] overflow-hidden relative" style={{ background: "#E4E7E1" }}>
                {/* Status bar */}
                <div className="h-12 flex items-end justify-between px-8 pb-1 text-[11px] font-semibold relative z-10" style={{ background: "#0A2B1D", color: "#fff" }}>
                  <span>9:41</span>
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3 w-3" />
                    <svg className="h-3 w-5" viewBox="0 0 25 12" fill="white"><rect x="0" y="1" width="21" height="10" rx="2" stroke="white" strokeWidth="1" fill="none"/><rect x="2" y="3" width="15" height="6" rx="1" fill="white"/><rect x="22" y="4" width="3" height="4" rx="1" fill="white" opacity="0.4"/></svg>
                  </span>
                </div>

                {/* Dashboard header */}
                <div className="px-5 pt-3 pb-4" style={{ background: "#0A2B1D" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Buenos dias</div>
                      <div className="text-sm font-bold text-white">Dashboard</div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "rgba(255,255,255,0.15)" }}>CR</div>
                  </div>
                  {/* Search bar */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Search className="h-3 w-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Buscar contactos, propiedades...</span>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="px-4 py-3 space-y-3">
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-2.5 shadow-sm">
                      <div className="text-[8px] font-medium mb-0.5" style={{ color: "#8BA398" }}>Contactos</div>
                      <div className="text-base font-extrabold" style={{ color: "#0A2B1D" }}>1,250</div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: "#E2F2E9" }}>
                      <div className="text-[8px] font-medium mb-0.5 text-green-700">Activas</div>
                      <div className="text-base font-extrabold" style={{ color: "#0A2B1D" }}>320</div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: "#E2F3F9" }}>
                      <div className="text-[8px] font-medium mb-0.5 text-blue-700">Citas</div>
                      <div className="text-base font-extrabold" style={{ color: "#0A2B1D" }}>8</div>
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-[9px] font-bold mb-2" style={{ color: "#0A2B1D" }}>Canales</div>
                    <div className="flex gap-2">
                      {[
                        { icon: Instagram, color: "#E1306C", label: "IG" },
                        { icon: Facebook, color: "#1877F2", label: "FB" },
                        { icon: MessageCircle, color: "#25D366", label: "WA" },
                        { icon: Mail, color: "#F59E0B", label: "Email" },
                      ].map((ch) => (
                        <div key={ch.label} className="flex-1 rounded-lg py-1.5 flex flex-col items-center gap-0.5" style={{ background: `${ch.color}10` }}>
                          <ch.icon className="h-3 w-3" style={{ color: ch.color }} />
                          <span className="text-[7px] font-bold" style={{ color: ch.color }}>{ch.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inbox preview */}
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-bold" style={{ color: "#0A2B1D" }}>Inbox Reciente</div>
                      <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EF4444", color: "#fff" }}>3</div>
                    </div>
                    {[
                      { name: "Maria Lopez", msg: "Me interesa el apto del centro", color: "#25D366", icon: MessageCircle, time: "2m" },
                      { name: "Carlos Rivera", msg: "Cuando podemos agendar visita?", color: "#E1306C", icon: Instagram, time: "15m" },
                      { name: "Ana Gutierrez", msg: "Necesito los documentos del...", color: "#1877F2", icon: Facebook, time: "1h" },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}12` }}>
                          <m.icon className="h-3 w-3" style={{ color: m.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold truncate" style={{ color: "#0A2B1D" }}>{m.name}</span>
                            <span className="text-[8px] flex-shrink-0 ml-1" style={{ color: "#9ca3af" }}>{m.time}</span>
                          </div>
                          <div className="text-[8px] truncate" style={{ color: "#8BA398" }}>{m.msg}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next appointment */}
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-[9px] font-bold mb-1.5" style={{ color: "#0A2B1D" }}>Proxima Cita</div>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: "#E2F2E9", color: "#0A2B1D" }}>15</div>
                      <div>
                        <div className="text-[9px] font-bold" style={{ color: "#0A2B1D" }}>Visita Apto 302</div>
                        <div className="text-[8px]" style={{ color: "#8BA398" }}>10:00 - Maria Lopez</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="flex items-center justify-around py-2.5 border-t" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
                  {[
                    { icon: BarChart3, label: "Inicio", active: true },
                    { icon: Users, label: "Contactos", active: false },
                    { icon: Building2, label: "Inmuebles", active: false },
                    { icon: Calendar, label: "Agenda", active: false },
                    { icon: MessageCircle, label: "Inbox", active: false },
                  ].map((n, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5" style={{ color: n.active ? "#0A2B1D" : "#9ca3af" }}>
                      <n.icon className="h-4 w-4" />
                      <span className="text-[7px] font-semibold">{n.label}</span>
                    </div>
                  ))}
                </div>

                {/* Home indicator bar */}
                <div className="flex justify-center py-2" style={{ background: "#fff" }}>
                  <div className="w-[100px] h-[4px] rounded-full" style={{ background: "#d1d5db" }} />
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-4 md:-left-20 top-[18%] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3" style={{ transform: "rotate(-3deg)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E2F2E9" }}>
                <Wifi className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: "#0A2B1D" }}>Offline Ready</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>Funciona sin internet</div>
              </div>
            </div>
            <div className="absolute -right-4 md:-right-20 top-[45%] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3" style={{ transform: "rotate(2deg)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
                <Globe className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: "#0A2B1D" }}>3 Canales</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>IG + FB + WA</div>
              </div>
            </div>
            <div className="absolute -right-2 md:-right-16 top-[78%] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3" style={{ transform: "rotate(-1deg)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: "#0A2B1D" }}>Gama Media</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>Carga en &lt;2s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-[44px] font-extrabold mb-4" style={{ color: "#0A2B1D" }}>
            Todo lo que necesitas,<br />nada que no.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#6B7280" }}>
            Cada modulo diseñado para usarse con el pulgar. Rapido, directo, sin menus infinitos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-[24px] p-6 border border-gray-100/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${f.color}12` }}>
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <div className="text-base font-bold mb-2" style={{ color: "#0A2B1D" }}>{f.title}</div>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PWA Section */}
      <section id="pwa" className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-20">
        <div className="rounded-[40px] p-8 md:p-16 relative overflow-hidden" style={{ background: "#0A2B1D" }}>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6" style={{ background: "rgba(255,255,255,0.1)", color: "#4ade80" }}>
              <Smartphone className="h-3.5 w-3.5" />
              Progressive Web App
            </div>

            <h2 className="text-3xl md:text-[44px] font-extrabold mb-4 text-white leading-tight">
              Una app real.<br />Sin app stores.
            </h2>
            <p className="text-base mb-12 max-w-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
              Propi se instala en tu telefono como cualquier app. Pero no necesitas descargar nada de una tienda. Abre, instala, usa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              {pwaFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <f.icon className="h-5 w-5 mb-3" style={{ color: "#4ade80" }} />
                  <div className="text-sm font-bold text-white mb-1">{f.title}</div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(74,222,128,0.1)" }} />
          <div className="absolute bottom-[-30%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(74,222,128,0.06)" }} />
        </div>
      </section>

      {/* Marketing */}
      <section id="marketing" className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-[44px] font-extrabold mb-4" style={{ color: "#0A2B1D" }}>
            Marketing integrado
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#6B7280" }}>
            Publica contenido, responde mensajes y mide resultados. Todo desde el mismo lugar donde gestionas tus contactos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {marketingFeatures.map((m) => (
            <div key={m.label} className="bg-white rounded-[20px] p-5 border border-gray-100/80 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <m.icon className="h-6 w-6 mx-auto mb-3" style={{ color: "#0A2B1D" }} />
              <div className="text-sm font-bold mb-1" style={{ color: "#0A2B1D" }}>{m.label}</div>
              <p className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Metricas detalladas, publicacion en portales (Wasi, MercadoLibre) y email marketing disponibles en la version web.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-16">
        <div className="bg-white rounded-[32px] p-8 md:p-12 border border-gray-100/60 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white" style={{ background: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"][i - 1] }}>
                  {["ML", "CR", "AG", "PS", "JD"][i - 1]}
                </div>
              ))}
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                <span className="font-bold" style={{ color: "#0A2B1D" }}>&ldquo;Propi conecto nuestro WhatsApp al CRM y el equipo es mucho mas productivo.&rdquo;</span>
                {" "} — Carlos R., Broker Inmobiliario
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full max-w-[800px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-[36px] font-extrabold mb-4" style={{ color: "#0A2B1D" }}>
            Preguntas frecuentes
          </h2>
        </div>
        <div>
          {faqItems.map((item, idx) => (
            <div key={idx} className="border-b border-gray-200 py-5">
              <button className="w-full flex justify-between items-center text-left group" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                <span className="font-bold text-base pr-4" style={{ color: "#0A2B1D" }}>{item.q}</span>
                {openFaq === idx ? (
                  <span className="w-7 h-7 rounded-full text-white flex items-center justify-center flex-shrink-0" style={{ background: "#0A2B1D" }}>
                    <Minus className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-gray-800 transition-colors">
                    <Plus className="h-4 w-4" />
                  </span>
                )}
              </button>
              {openFaq === idx && (
                <p className="mt-3 text-sm leading-relaxed pr-12" style={{ color: "#6B7280" }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-16">
        <div className="rounded-[40px] p-10 md:p-16 text-center" style={{ background: "#0A2B1D" }}>
          <h2 className="text-3xl md:text-[44px] font-extrabold text-white mb-4 leading-tight">
            Empieza hoy.<br />Tu CRM en tu bolsillo.
          </h2>
          <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Sin tarjeta de credito. Sin instalaciones complicadas. Abre, registrate y empieza a gestionar.
          </p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 text-base font-semibold px-8 py-4 rounded-full shadow-lg hover:opacity-90 transition-all" style={{ background: "#fff", color: "#0A2B1D" }}>
            Crear Cuenta Gratis
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "#0A2B1D" }}>
            <Building2 className="h-5 w-5" />
            Propi
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "#6B7280" }}>
            <a href="#features" className="hover:text-gray-900 transition-colors">Funciones</a>
            <a href="#pwa" className="hover:text-gray-900 transition-colors">App Movil</a>
            <a href="#marketing" className="hover:text-gray-900 transition-colors">Marketing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="text-xs" style={{ color: "#9ca3af" }}>
            2026 Propi. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
