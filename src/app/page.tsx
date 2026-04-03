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
  WifiOff,
  Download,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Minus,
  Plus,
  ArrowUpRight,
  Star,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  MapPin,
  DollarSign,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const features = [
  {
    icon: Users,
    title: "Contactos & Leads",
    desc: "Segmenta por tags, trackea si llego por WhatsApp, Instagram o referido. Busqueda global instantanea. Tap-to-call directo.",
    color: "#10b981",
  },
  {
    icon: Building2,
    title: "Inventario de Propiedades",
    desc: "Apartamentos, casas, oficinas, locales, terrenos. Precio en USD o bolivares. Galeria de fotos, GPS, filtros combinables.",
    color: "#3b82f6",
  },
  {
    icon: MessageCircle,
    title: "Inbox Unificado",
    desc: "WhatsApp, Instagram DMs y Facebook Messenger en una sola pantalla. Responde a tus clientes sin cambiar de app.",
    color: "#8b5cf6",
  },
  {
    icon: Sparkles,
    title: "Propi Magic (IA)",
    desc: "Pregunta en español: 'Apartamentos en Altamira de 80m2'. La IA busca en MercadoLibre, analiza precios y te da el resumen.",
    color: "#f97316",
  },
  {
    icon: ShoppingBag,
    title: "Publica en Portales",
    desc: "1 click para publicar en Wasi. Tus fotos se suben automaticamente. Sincroniza con portales inmobiliarios de Venezuela.",
    color: "#ec4899",
  },
  {
    icon: Calendar,
    title: "Calendario & Citas",
    desc: "Agenda visitas, vincula al contacto y la propiedad. Ve tus citas de la semana en el dashboard.",
    color: "#f59e0b",
  },
  {
    icon: FileText,
    title: "Documentos",
    desc: "Contratos, escrituras, avaluos, planos. Todo vinculado al contacto y la propiedad. Descarga segura.",
    color: "#ef4444",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    desc: "Campanas HTML a segmentos por tag. Powered by Resend. 3,000 emails gratis al mes.",
    color: "#06b6d4",
  },
  {
    icon: BarChart3,
    title: "Dashboard & Metricas",
    desc: "Propiedades por tipo, contactos por fuente, citas de la semana, comisiones. Metricas de Instagram y Facebook.",
    color: "#0ea5e9",
  },
];

const pwaFeatures = [
  {
    icon: Download,
    title: "Instala desde el navegador",
    desc: "Sin App Store, sin Google Play. Un tap y esta en tu pantalla de inicio. Funciona en Android y iPhone.",
  },
  {
    icon: WifiOff,
    title: "Funciona sin internet",
    desc: "Consulta contactos, propiedades y citas sin conexion. Ideal para mostrar inmuebles en zonas sin señal.",
  },
  {
    icon: Zap,
    title: "Rapida en cualquier telefono",
    desc: "Optimizada para gama media. Carga en menos de 2 segundos. No necesitas el ultimo iPhone.",
  },
  {
    icon: Shield,
    title: "Segura como app nativa",
    desc: "HTTPS, autenticacion con Clerk, archivos en storage privado. Tus datos y los de tus clientes protegidos.",
  },
];

const integrations = [
  { icon: Instagram, label: "Instagram", desc: "Publica fotos, responde DMs, ve metricas de alcance y engagement", color: "#E1306C" },
  { icon: Facebook, label: "Facebook", desc: "Posts en tu pagina, comentarios, insights de visitas y seguidores", color: "#1877F2" },
  { icon: MessageCircle, label: "WhatsApp", desc: "Mensajes y templates via Meta Cloud API. Sin Twilio, sin costos extra", color: "#25D366" },
  { icon: ShoppingBag, label: "Wasi", desc: "Publica propiedades con 1 click. Fotos se suben automaticamente", color: "#FF6B00" },
  { icon: TrendingUp, label: "MercadoLibre", desc: "Analisis de mercado con IA. Precios, tendencias, comparables", color: "#FFE600" },
  { icon: Mail, label: "Resend", desc: "Email marketing a segmentos. 3,000 emails gratis al mes", color: "#000" },
];

const faqItems = [
  {
    q: "¿Necesito descargar algo del App Store?",
    a: "No. Propi es una PWA que se instala directamente desde el navegador. Abre propi.aikalabs.cc en Chrome o Safari, toca 'Agregar a pantalla de inicio' y listo.",
  },
  {
    q: "¿Funciona en mi telefono?",
    a: "Si. Funciona en Android 8+ y iOS 14+. Esta optimizada para telefonos gama media. Solo necesitas Chrome o Safari.",
  },
  {
    q: "¿Como se conecta con WhatsApp e Instagram?",
    a: "Usamos la Meta Graph API oficial. Conectas tu cuenta Business de Instagram, tu pagina de Facebook y tu numero de WhatsApp Business desde Configuracion. Un token para los tres canales.",
  },
  {
    q: "¿Mis datos estan seguros?",
    a: "Si. Autenticacion con Clerk (Google login, MFA), conexiones HTTPS, archivos en storage privado con URLs que expiran. Servidor en Europa con acceso solo via VPN.",
  },
  {
    q: "¿Cuanto cuesta?",
    a: "Modelo por seat: pagas por usuario que necesite acceso. Sin limites de contactos, propiedades o mensajes. Sin costos ocultos.",
  },
  {
    q: "¿Puedo publicar en Wasi y MercadoLibre?",
    a: "Si. Wasi ya esta integrado: 1 click desde la propiedad y se publica con fotos. MercadoLibre esta en desarrollo con analisis de mercado via IA.",
  },
  {
    q: "¿Que es Propi Magic?",
    a: "Es el sistema de inteligencia de mercado. Escribes en español lo que buscas ('Apartamentos en Las Mercedes de 100m2') y la IA busca en MercadoLibre, calcula precio promedio, mediana y te da un resumen.",
  },
  {
    q: "¿Funciona solo en Venezuela?",
    a: "Esta optimizado para Venezuela (bolivares, ciudades, barrios, MercadoLibre Venezuela). Pero funciona en cualquier pais con USD como moneda default.",
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
          <a href="#integraciones" className="hover:text-gray-900 transition-colors">Integraciones</a>
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
            <MapPin className="h-3.5 w-3.5" />
            Hecho para el mercado inmobiliario venezolano
          </div>

          <h1 className="text-4xl md:text-[72px] leading-[1.05] font-extrabold tracking-tight mb-6" style={{ color: "#0A2B1D" }}>
            Vende mas inmuebles
            <br />
            <span style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              desde tu telefono.
            </span>
          </h1>

          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10" style={{ color: "#6B7280" }}>
            CRM inmobiliario con WhatsApp, Instagram, Facebook, inteligencia de mercado con IA, y publicacion en portales. Todo en una app que funciona hasta sin internet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/sign-up" className="text-white px-8 py-4 rounded-full text-base font-semibold hover:opacity-90 transition-all shadow-lg flex items-center gap-2" style={{ background: "#0A2B1D" }}>
              Crear Cuenta Gratis
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/preview" className="px-8 py-4 rounded-full text-base font-semibold border-2 flex items-center gap-2 hover:bg-gray-50 transition-colors" style={{ borderColor: "#d1d5db", color: "#374151" }}>
              Ver Demo
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Phone mockup */}
          <div className="relative max-w-sm mx-auto">
            <div className="rounded-[40px] border-[8px] overflow-hidden shadow-2xl relative" style={{ borderColor: "#1a1a1a", background: "#090A0F" }}>
              {/* Status bar */}
              <div className="h-8 flex items-center justify-between px-6 text-[10px] font-bold" style={{ background: "#090A0F", color: "#fff" }}>
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  LTE
                </span>
              </div>
              {/* App content mock - dark theme */}
              <div className="p-4 space-y-3" style={{ background: "#090A0F" }}>
                {/* Mini dashboard */}
                <div className="rounded-2xl p-4" style={{ background: "#111218", border: "1px solid #1e1f26" }}>
                  <div className="text-[10px] font-medium mb-1" style={{ color: "#6b7280" }}>Propiedades Activas</div>
                  <div className="text-2xl font-extrabold text-white">47</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="text-[9px] text-green-400 font-bold">+12% esta semana</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-3" style={{ background: "#111218", border: "1px solid #1e1f26" }}>
                    <div className="flex items-center gap-1 text-[9px] font-bold mb-1" style={{ color: "#00FF55" }}>
                      <DollarSign className="h-3 w-3" /> Ventas
                    </div>
                    <div className="text-lg font-extrabold text-white">$285K</div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#111218", border: "1px solid #1e1f26" }}>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 mb-1">
                      <Users className="h-3 w-3" /> Leads
                    </div>
                    <div className="text-lg font-extrabold text-white">89</div>
                  </div>
                </div>
                {/* Mini inbox */}
                <div className="rounded-2xl p-3" style={{ background: "#111218", border: "1px solid #1e1f26" }}>
                  <div className="text-[10px] font-bold mb-2 text-white">Inbox</div>
                  {[
                    { name: "Maria L.", msg: "Me interesa el apto en Altamira", platform: "whatsapp", color: "#25D366" },
                    { name: "Carlos R.", msg: "Cuando podemos ver la casa?", platform: "instagram", color: "#E1306C" },
                    { name: "Ana P.", msg: "Tiene disponible el local?", platform: "facebook", color: "#1877F2" },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${m.color}20` }}>
                        {m.platform === "whatsapp" ? <MessageCircle className="h-3 w-3" style={{ color: m.color }} /> :
                         m.platform === "instagram" ? <Instagram className="h-3 w-3" style={{ color: m.color }} /> :
                         <Facebook className="h-3 w-3" style={{ color: m.color }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold truncate text-white">{m.name}</div>
                        <div className="text-[9px] truncate" style={{ color: "#6b7280" }}>{m.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Bottom nav */}
              <div className="flex items-center justify-around py-2" style={{ background: "#111218", borderTop: "1px solid #1e1f26" }}>
                {[
                  { icon: MessageCircle, label: "Inbox", active: false },
                  { icon: Users, label: "Contactos", active: false },
                  { icon: Building2, label: "Inmuebles", active: true },
                  { icon: Calendar, label: "Agenda", active: false },
                  { icon: BarChart3, label: "Mas", active: false },
                ].map((n, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5" style={{ color: n.active ? "#00FF55" : "#6b7280" }}>
                    <n.icon className="h-4 w-4" />
                    <span className="text-[8px] font-semibold">{n.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -left-4 md:-left-16 top-[15%] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3" style={{ transform: "rotate(-3deg)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#25D36615" }}>
                <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
              </div>
              <div>
                <div className="text-xs font-bold">WhatsApp + IG + FB</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>Inbox unificado</div>
              </div>
            </div>
            <div className="absolute -right-4 md:-right-16 top-[40%] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3" style={{ transform: "rotate(2deg)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f9731615" }}>
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold">Propi Magic</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>IA de mercado</div>
              </div>
            </div>
            <div className="absolute -left-4 md:-left-12 bottom-[15%] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3" style={{ transform: "rotate(1deg)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#10b98115" }}>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-xs font-bold">USD + Bs</div>
                <div className="text-[10px]" style={{ color: "#6B7280" }}>Multi-moneda</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-[44px] font-extrabold mb-4" style={{ color: "#0A2B1D" }}>
            Todo lo que necesita<br />un asesor inmobiliario.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#6B7280" }}>
            9 modulos diseñados para el dia a dia del negocio inmobiliario en Venezuela. Rapido, directo, sin menus infinitos.
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
              Tu oficina<br />en el bolsillo.
            </h2>
            <p className="text-base mb-12 max-w-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
              Muestra propiedades a tus clientes desde el telefono. Agenda citas en el momento. Responde WhatsApp sin abrir otra app. Funciona hasta en el metro de Caracas.
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

          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(74,222,128,0.1)" }} />
          <div className="absolute bottom-[-30%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(74,222,128,0.06)" }} />
        </div>
      </section>

      {/* Integrations */}
      <section id="integraciones" className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-[44px] font-extrabold mb-4" style={{ color: "#0A2B1D" }}>
            Conectado con todo
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#6B7280" }}>
            Publica, responde y mide desde un solo lugar. Sin copiar y pegar entre apps.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {integrations.map((m) => (
            <div key={m.label} className="bg-white rounded-[20px] p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${m.color}12` }}>
                <m.icon className="h-5 w-5" style={{ color: m.color }} />
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: "#0A2B1D" }}>{m.label}</div>
              <p className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>{m.desc}</p>
            </div>
          ))}
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
                <span className="font-bold" style={{ color: "#0A2B1D" }}>&ldquo;Antes tenia los contactos en una libreta, las fotos en el telefono y los mensajes en 3 apps. Propi me junto todo.&rdquo;</span>
                {" "} — Maria L., Asesora Inmobiliaria en Caracas
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
            Empieza a vender mas.<br />Hoy.
          </h2>
          <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Sin tarjeta de credito. Sin instalaciones. Abre, registrate y empieza a gestionar tu negocio inmobiliario desde el telefono.
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
            <a href="#integraciones" className="hover:text-gray-900 transition-colors">Integraciones</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="text-xs" style={{ color: "#9ca3af" }}>
            2026 Propi. Hecho en Venezuela.
          </div>
        </div>
      </footer>
    </div>
  );
}
