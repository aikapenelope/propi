"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const featureCards = [
  {
    num: "01",
    title: "TU CRM INMOBILIARIO",
    tag: "Contactos, Propiedades, Citas",
    desc: "Todo tu negocio inmobiliario en una sola app. Contactos con tags y fuente de origen, propiedades con fotos y filtros, citas vinculadas, documentos en la nube. Busca cualquier cosa con la busqueda global. Funciona en tu telefono como app nativa, sin descargar nada del App Store.",
    img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0dccab47-16b0-4716-9e1a-b97f124e3031_1600w.webp",
  },
  {
    num: "02",
    title: "PROPI MAGIC (IA)",
    tag: "Inteligencia de Mercado",
    desc: "Tu cliente te pregunta: 'Cuanto vale un apartamento de 80m2 en Altamira?' En vez de buscar manualmente en MercadoLibre, le escribes eso mismo a Propi Magic. En segundos te da el precio promedio, la mediana, el rango, y un resumen profesional que puedes copiar y enviar. Datos reales, actualizados diariamente, calculados con SQL, no inventados por IA.",
    img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/952269bf-60f5-48dc-afce-13953bead1eb_1600w.webp",
  },
  {
    num: "03",
    title: "PUBLICA EN PORTALES",
    tag: "Wasi con 1 click",
    desc: "Subiste las fotos, llenaste los datos de la propiedad, y ahora quieres publicarla en Wasi. En vez de abrir Wasi, copiar todo manualmente y subir las fotos de nuevo, tocas un boton en Propi. Los datos se envian automaticamente, las fotos se suben solas, y en segundos tu propiedad esta en linea. Si prefieres hacerlo manual, Propi te genera el texto listo para copiar y pegar.",
    img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/aa5ed4de-1a7e-4bb7-b0ea-1a4c511663df_1600w.webp",
  },
];

const gridFeatures = [
  { icon: "solar:users-group-two-rounded-linear", title: "Contactos & Leads", desc: "Segmenta por tags, trackea si llego por WhatsApp, Instagram o referido. Busqueda global. Tap-to-call directo." },
  { icon: "solar:home-smile-linear", title: "Inventario", desc: "Apartamentos, casas, terrenos. Precio en USD o bolivares. Galeria de fotos, GPS, filtros combinables." },
  { icon: "solar:calendar-mark-linear", title: "Calendario & Citas", desc: "Agenda visitas, vincula al contacto y la propiedad. Ve tus citas de la semana directamente en el dashboard." },
  { icon: "solar:document-text-linear", title: "Documentos", desc: "Contratos, escrituras, avaluos, planos. Todo vinculado al contacto y la propiedad. Descarga totalmente segura." },
  { icon: "solar:letter-opened-linear", title: "Email Marketing", desc: "Campanas HTML a segmentos por tag. Powered by Resend. 3,000 emails gratis al mes incluidos." },
  { icon: "solar:chart-square-linear", title: "Metricas", desc: "Propiedades por tipo, contactos por fuente, citas de la semana. Dashboard con graficos y KPIs de tu negocio." },
];

const pwaFeatures = [
  { icon: "solar:global-linear", title: "Instala desde el navegador", desc: "Sin App Store, sin Google Play. Un tap y esta en tu pantalla de inicio. Funciona en Android y iPhone perfectamente." },
  { icon: "solar:wifi-router-minimalistic-linear", title: "Funciona sin internet", desc: "Consulta contactos, propiedades y citas sin conexion. Ideal para mostrar inmuebles en zonas sin senal celular." },
  { icon: "solar:bolt-linear", title: "Rapida en cualquier telefono", desc: "Optimizada para gama media. Carga en menos de 2 segundos. No necesitas el ultimo iPhone para vender." },
  { icon: "solar:shield-check-linear", title: "Segura como app nativa", desc: "HTTPS, autenticacion robusta, archivos en storage privado. Tus datos y los de tus clientes siempre protegidos." },
];

const integrations = [
  { icon: "skill-icons:instagram", title: "Instagram", desc: "Publica fotos de propiedades, responde DMs y ve metricas. Acceso directo desde Propi." },
  { icon: "logos:facebook", title: "Facebook", desc: "Publica en tu pagina, responde comentarios y ve insights. Acceso directo a Business Suite." },
  { icon: "logos:whatsapp-icon", title: "WhatsApp", desc: "Comparte propiedades con un tap. Link directo con mensaje y fotos listas para enviar." },
  { icon: "wasi", title: "Wasi", desc: "Publica propiedades con 1 click. Las galerias de fotos se suben y redimensionan automaticamente." },
  { icon: "simple-icons:mercadolibre", title: "MercadoLibre", desc: "Datos de mercado en tiempo real. Precios, tendencias y comparables para Propi Magic. No necesitas cuenta." },
  { icon: "simple-icons:resend", title: "Resend", desc: "Email marketing a segmentos personalizados. Disfruta de 3,000 emails gratis al mes." },
];

const testimonials = [
  { name: "Carlos M.", role: "Broker Asociado", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80", text: "Publicar mis captaciones en todos los portales me tomaba horas. Con Propi, en segundos estoy en multiples plataformas. Ahorro tiempo valioso que dedico a cerrar tratos." },
  { name: "Andrea V.", role: "Top Producer", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80", text: "Publicar en Wasi con un click y tener los KPIs de mercado al instante cambio mi forma de trabajar. Ya no pierdo tiempo copiando datos manualmente entre plataformas." },
  { name: "Roberto S.", role: "Director Comercial", img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=150&q=80", text: "La busqueda global en MercadoLibre y los KPIs con data propietaria me dan una ventaja injusta al tasar. Ahora defiendo mis exclusivas con datos reales del mercado." },
];

const faqItems = [
  { q: "Necesito descargar algo del App Store?", a: "No. Propi es una PWA que se instala directamente desde el navegador. Abre propi.aikalabs.cc en Chrome o Safari, toca 'Agregar a pantalla de inicio' y listo." },
  { q: "Funciona en mi telefono?", a: "Si, Propi esta optimizado para funcionar sin problemas tanto en dispositivos Android como en iPhone, incluso en modelos de gama media o baja." },
  { q: "Como se conecta con WhatsApp e Instagram?", a: "Desde Propi tienes acceso directo a Instagram, Facebook y TikTok para publicar y responder mensajes. Tambien puedes compartir propiedades por WhatsApp con un tap desde cualquier listado." },
  { q: "Mis datos estan seguros?", a: "Completamente. Tus datos estan encriptados bajo HTTPS, con bases de datos privadas y sistemas de autenticacion de nivel bancario." },
  { q: "Puedo publicar en Wasi y MercadoLibre?", a: "La integracion con Wasi permite publicar propiedades con 1 solo click. MercadoLibre se utiliza actualmente a traves de nuestra IA para inteligencia de precios y mercado." },
  { q: "Que es Propi Magic?", a: "Es nuestra inteligencia artificial integrada. Le puedes pedir que analice precios en una zona especifica, te redacte la descripcion de una propiedad o responda preguntas basicas." },
];

// ---------------------------------------------------------------------------
// Iconify component (loads from CDN)
// ---------------------------------------------------------------------------

function Icon({ icon, className, style }: { icon: string; className?: string; style?: React.CSSProperties }) {
  return (
    // @ts-expect-error - iconify-icon is a web component
    <iconify-icon icon={icon} class={className} style={style} />
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [loaded, setLoaded] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Iconify
    const script = document.createElement("script");
    script.src = "https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js";
    document.head.appendChild(script);

    // Simulate loader
    const timer = setTimeout(() => {
      setLoaded(true);
      setTimeout(() => setLoaderDone(true), 800);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaderDone) return;

    // Dynamic import GSAP + ScrollTrigger
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Hero text reveal
        gsap.to(".hero-line", {
          y: 0,
          stagger: 0.1,
          duration: 1.2,
          ease: "power3.out",
        });
        gsap.to(".hero-fade", { opacity: 1, duration: 1, delay: 0.3 });

        // Hero parallax
        gsap.to(".hero-img", {
          yPercent: 30,
          ease: "none",
          scrollTrigger: { trigger: ".hero-img", start: "top top", end: "bottom top", scrub: true },
        });

        // Card stack
        const cards = gsap.utils.toArray<HTMLElement>(".card-item");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (next) {
            gsap.to(card.querySelector(".card-inner"), {
              scale: 0.92,
              opacity: 0.5,
              ease: "none",
              scrollTrigger: { trigger: next, start: "top bottom", end: "top 10vh", scrub: true },
            });
          }
        });

        // Footer parallax
        gsap.from(".footer-content", {
          y: 100,
          opacity: 0.5,
          scale: 0.95,
          scrollTrigger: { trigger: ".footer-sticky", start: "top bottom", end: "bottom bottom", scrub: true },
        });
      });
    });
  }, [loaderDone]);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#E3E1DC", color: "#121212", fontFamily: "'Manrope', sans-serif" }}>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9000] opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Preloader */}
      <div className={`fixed inset-0 bg-black z-[10000] flex justify-center items-center transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${loaded ? "-translate-y-full" : ""}`}>
        <div className={`transition-all duration-500 ${loaded ? "opacity-0 -translate-y-12" : ""}`} style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "5vw", fontWeight: 600, color: "#fff" }}>
          PROPI
        </div>
        <div className="absolute bottom-0 left-0 h-1 bg-white transition-all duration-1000 ease-in-out" style={{ width: loaded ? "100%" : "0%" }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full p-6 md:p-8 flex justify-between items-center z-50 mix-blend-difference text-white">
        <div className="font-semibold text-xl tracking-tighter" style={{ fontFamily: "'Syncopate', sans-serif" }}>PROPI</div>
        <div className="hidden lg:flex items-center gap-10 text-xs uppercase tracking-widest">
          <a href="#funciones" className="hover:text-gray-300 transition-colors">Funciones</a>
          <a href="#app" className="hover:text-gray-300 transition-colors">App Movil</a>
          <a href="#integraciones" className="hover:text-gray-300 transition-colors">Integraciones</a>
          <a href="#faq" className="hover:text-gray-300 transition-colors">FAQ</a>
          <div className="h-4 w-px bg-white/20" />
          <Link href="/sign-in" className="hover:text-gray-300 transition-colors">Ingresar</Link>
          <Link href="/sign-up" className="bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition-transform hover:scale-105 active:scale-95 duration-300">Empezar Gratis</Link>
        </div>
        <div className="lg:hidden text-xs uppercase tracking-widest">MENU</div>
      </nav>

      {/* Wrapper */}
      <div className="relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]" style={{ background: "#E3E1DC", marginBottom: "100vh" }}>

        {/* Hero */}
        <section ref={heroRef} className="h-screen relative flex flex-col items-center justify-center overflow-hidden pt-20">
          <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/482e7b6a-168c-4d0d-b35d-0e2ff4014577_3840w.webp" className="hero-img absolute inset-0 w-full h-full object-cover brightness-50" alt="Hero" />
          <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center text-center text-white">
            <h1 className="overflow-hidden mix-blend-difference" style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "11vw", lineHeight: 1, letterSpacing: "-0.02em" }}>
              <span className="hero-line block translate-y-full">VENDE MAS</span>
            </h1>
            <h1 className="overflow-hidden mix-blend-difference" style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "11vw", lineHeight: 1, letterSpacing: "-0.02em" }}>
              <span className="hero-line block translate-y-full">INMUEBLES</span>
            </h1>
            <div className="mt-8 md:mt-12 opacity-0 hero-fade flex flex-col items-center gap-8 max-w-3xl mx-auto">
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] font-normal leading-relaxed text-white/90 drop-shadow-md">
                Hecho para el mercado inmobiliario venezolano.<br /><br />
                <span className="opacity-80">CRM inmobiliario con WhatsApp, Instagram, Facebook, inteligencia de mercado con IA, y publicacion en portales. Todo en una app.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                <Link href="/sign-up" className="bg-white text-black px-8 py-4 rounded-full text-xs uppercase tracking-widest font-medium hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center shadow-lg">Crear Cuenta Gratis</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-32 px-6 md:px-20 grid lg:grid-cols-2 gap-16 max-w-[1800px] mx-auto" style={{ background: "#E3E1DC" }}>
          <div>
            <h2 className="text-4xl md:text-5xl tracking-tight leading-tight" style={{ fontFamily: "'Syncopate', sans-serif" }}>
              Todo lo que necesita <br /><span style={{ color: "#374336" }}>un asesor.</span>
            </h2>
          </div>
          <div className="text-xl font-normal leading-relaxed text-gray-700">
            <p className="mb-8">Modulos diseñados para el dia a dia del negocio inmobiliario. Rapido, directo y con las herramientas que realmente te ayudan a cerrar ventas.</p>
            <div className="h-px w-full bg-black/10 my-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              {[
                { t: "Inbox Unificado", d: "Ten tus mensajes de clientes en un solo lugar." },
                { t: "Multi-plataforma", d: "Publica en segundos en varias plataformas." },
                { t: "Radar de Mercado", d: "Busqueda global en todo MercadoLibre." },
                { t: "Analitica", d: "KPI tuyos y de tus publicaciones." },
              ].map((f) => (
                <div key={f.t}>
                  <div className="font-medium text-black mb-1 uppercase tracking-widest text-xs">{f.t}</div>
                  <div className="text-xs text-gray-500">{f.d}</div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <div className="font-medium text-black mb-1 uppercase tracking-widest text-xs">Data Propietaria</div>
                <div className="text-xs text-gray-500">KPI de propiedades con inteligencia de mercado.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Card Stack Section */}
        <section className="py-[10vh] text-[#E3E1DC] relative" style={{ background: "#121212" }} id="funciones">
          <div className="text-center mb-20 px-6">
            <div className="text-xs uppercase tracking-widest mb-4 opacity-50">Herramientas Principales</div>
            <h2 className="text-4xl md:text-6xl tracking-tight" style={{ fontFamily: "'Syncopate', sans-serif" }}>FUNCIONES</h2>
          </div>

          <div className="w-full max-w-[1400px] mx-auto relative pb-[10vh]">
            {featureCards.map((card) => (
              <div key={card.num} className="card-item sticky top-[10vh] h-[80vh] w-full flex items-center justify-center mb-[5vh]">
                <div className="card-inner w-[90%] h-full rounded-3xl relative overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.2fr] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="p-8 md:p-16 flex flex-col justify-start gap-6 z-10" style={{ background: "#1a1a1a" }}>
                    <div>
                      <div className="text-5xl mb-2 opacity-30 tracking-tight" style={{ fontFamily: "'Syncopate', sans-serif", color: "#E3E1DC" }}>{card.num}</div>
                      <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">{card.title}</h3>
                      <p className="text-xs mt-4 opacity-70 uppercase tracking-widest">{card.tag}</p>
                    </div>
                    <div className="text-gray-300 font-normal text-base leading-relaxed">{card.desc}</div>
                  </div>
                  <div className="relative w-full h-full overflow-hidden">
                    <img src={card.img} alt={card.title} className="w-full h-full object-cover brightness-75 hover:scale-105 transition-transform duration-[1.5s]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* More features grid */}
          <div className="max-w-[1400px] mx-auto px-6 pb-32">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridFeatures.map((f) => (
                <div key={f.title} className="p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:border-white/20 transition-colors duration-300 group" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)" }}>
                  <Icon icon={f.icon} className="text-3xl mb-4 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                  <h4 className="font-medium text-lg mb-2 text-white">{f.title}</h4>
                  <p className="text-sm text-gray-400 font-normal leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PWA Section */}
        <section className="py-32 px-6 md:px-20 border-b border-black/5" style={{ background: "#E3E1DC" }} id="app">
          <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
            {/* Phone mockup */}
            <div className="text-white p-6 rounded-[3rem] w-full max-w-[340px] mx-auto h-[700px] shadow-2xl shadow-black/40 relative overflow-hidden flex flex-col border-[8px] border-gray-900" style={{ background: "#121212" }}>
              <div className="flex justify-between text-xs mb-8 opacity-80 pt-2 px-2 font-medium">
                <span>9:41</span>
                <span className="flex gap-1.5 items-center">LTE</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl border border-white/5" style={{ background: "linear-gradient(to br, rgba(255,255,255,0.1), rgba(255,255,255,0.05))" }}>
                  <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Activas</div>
                  <div className="text-3xl tracking-tight" style={{ fontFamily: "'Syncopate', sans-serif" }}>47</div>
                  <div className="text-[10px] text-green-400 mt-2 font-medium">+12% esta semana</div>
                </div>
                <div className="p-5 rounded-2xl border border-white/5" style={{ background: "linear-gradient(to br, rgba(255,255,255,0.1), rgba(255,255,255,0.05))" }}>
                  <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Ventas</div>
                  <div className="text-3xl tracking-tight" style={{ fontFamily: "'Syncopate', sans-serif" }}>$285K</div>
                  <div className="text-[10px] text-white/50 mt-2 font-medium">89 Leads nuevos</div>
                </div>
              </div>
              <div className="text-xs uppercase tracking-widest opacity-60 mb-3 mt-2 px-1">Inbox Reciente</div>
              <div className="space-y-3 flex-1 overflow-hidden">
                {[
                  { name: "Maria L.", msg: "Me interesa el apto en Altamira", color: "yellow" },
                  { name: "Carlos R.", msg: "Cuando podemos ver la casa?", color: "green" },
                  { name: "Ana P.", msg: "Tiene disponible el local?", color: "blue" },
                ].map((m) => (
                  <div key={m.name} className="bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl flex items-center gap-3 border border-white/5 cursor-pointer">
                    <div className={`w-10 h-10 rounded-full bg-${m.color}-500/20 flex items-center justify-center text-${m.color}-400 text-xs font-semibold`}>
                      {m.name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs opacity-60 mt-0.5 truncate w-[180px]">{m.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-6 pt-6 pb-2 border-t border-white/10 mt-auto">
                {["inbox", "users-group-rounded", "home-2", "calendar"].map((i, idx) => (
                  <Icon key={i} icon={`solar:${i}-linear`} className={`text-2xl ${idx === 0 ? "text-[#E3E1DC]" : "opacity-40"}`} />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-4xl md:text-5xl tracking-tight leading-tight mb-8" style={{ fontFamily: "'Syncopate', sans-serif" }}>
                Tu oficina <br /><span style={{ color: "#374336" }}>en el bolsillo.</span>
              </h2>
              <p className="text-gray-600 text-lg font-normal mb-12 max-w-xl">
                Muestra propiedades a tus clientes desde el telefono. Agenda citas en el momento. Responde WhatsApp sin abrir otra app. Funciona hasta en el metro de Caracas.
              </p>
              <div className="space-y-10">
                {pwaFeatures.map((f) => (
                  <div key={f.title} className="flex gap-5 group">
                    <Icon icon={f.icon} className="text-3xl shrink-0 group-hover:scale-110 transition-transform" style={{ color: "#374336" }} />
                    <div>
                      <h4 className="font-medium text-lg mb-1">{f.title}</h4>
                      <p className="text-sm text-gray-500 font-normal leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-32 px-6 border-b border-black/5 relative overflow-hidden" style={{ background: "#E3E1DC" }} id="integraciones">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white/40 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[1400px] mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl tracking-tight" style={{ fontFamily: "'Syncopate', sans-serif" }}>Conectado con todo.</h2>
              <p className="mt-6 text-gray-600 max-w-xl mx-auto text-lg font-normal">Publica, responde y mide desde un solo lugar. Sin copiar y pegar entre apps o pestanas.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((m) => (
                <div key={m.title} className="p-8 rounded-3xl border border-black/5 bg-white/50 backdrop-blur-xl hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
                  {m.icon === "wasi" ? (
                    <div className="w-10 h-10 bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center text-xl mb-5 opacity-80 group-hover:opacity-100 transition-opacity">W</div>
                  ) : (
                    <Icon icon={m.icon} className="text-4xl mb-5 grayscale group-hover:grayscale-0 transition-all duration-300" />
                  )}
                  <h4 className="font-semibold text-xl mb-2 tracking-tight">{m.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-normal">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6 md:py-32 text-white relative overflow-hidden" style={{ background: "#121212" }}>
          <div className="mb-16 text-center relative z-10">
            <p className="text-xs uppercase text-gray-400 tracking-widest mb-3">Casos de Exito</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl tracking-tight font-medium" style={{ fontFamily: "'Syncopate', sans-serif" }}>
              Hablan los <span style={{ color: "#374336" }}>Expertos</span>
            </h2>
          </div>
          <div className="relative flex items-center justify-center py-12 md:py-20 min-h-[450px]">
            <div className="flex flex-col md:flex-row justify-center items-center h-full w-full max-w-[1200px] px-6">
              {testimonials.map((t, i) => (
                <div key={t.name} className={`relative w-full max-w-[340px] h-[340px] flex justify-center items-center rounded-2xl ${i === 0 ? "md:-mr-[50px] -mb-16 md:mb-0 -rotate-3 md:-rotate-12 z-10" : i === 1 ? "md:-mr-[50px] -mb-16 md:mb-0 rotate-0 md:-rotate-6 z-20" : "rotate-3 md:rotate-0 z-30"}`} style={{ background: `linear-gradient(rgba(255,255,255,${0.05 + i * 0.025}), transparent)`, border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 25px 25px rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
                  <div className="absolute inset-4 rounded-xl text-white shadow-2xl ring-1 ring-white/10 overflow-hidden flex flex-col" style={{ background: `#${["1a1a1a", "1f1f1f", "252525"][i]}` }}>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 ring-1 ring-white/10 mb-4">
                        <Icon icon="solar:quote-right-bold" className="text-base text-gray-400" />
                      </div>
                      <p className="text-sm leading-relaxed text-gray-300 mb-4 flex-1">&ldquo;{t.text}&rdquo;</p>
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3">
                          <img src={t.img} alt={t.name} className="h-8 w-8 rounded-full object-cover" />
                          <div>
                            <div className="text-xs font-semibold text-white">{t.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{t.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon icon="solar:star-bold" className="text-amber-400" />
                          <span className="text-xs font-semibold">5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-32 px-6 border-t border-black/5" style={{ background: "rgba(255,255,255,0.5)" }} id="faq">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-16 text-center" style={{ fontFamily: "'Syncopate', sans-serif" }}>Preguntas Frecuentes</h2>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <details key={item.q} className="group bg-white/60 backdrop-blur-xl border border-black/5 rounded-2xl p-6 cursor-pointer hover:bg-white transition-colors duration-300 shadow-sm">
                  <summary className="font-medium text-base md:text-lg flex justify-between items-center text-black list-none [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Icon icon="solar:alt-arrow-down-linear" className="group-open:rotate-180 transition-transform text-xl opacity-50" />
                  </summary>
                  <p className="mt-4 text-gray-600 text-sm font-normal leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center flex flex-col items-center justify-center relative z-10 border-t border-black/5" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.5), #E3E1DC)" }}>
          <h2 className="text-4xl md:text-6xl tracking-tight leading-tight mb-4" style={{ fontFamily: "'Syncopate', sans-serif" }}>
            Empieza a vender mas.<br /><span style={{ color: "#374336" }}>Hoy.</span>
          </h2>
          <p className="text-gray-500 text-sm mb-12 px-6">Pago en bolivares a tasa BCV</p>

          {/* Pricing card */}
          <div className="w-full max-w-md mx-auto px-6 mb-12">
            <div className="rounded-3xl p-8 text-left" style={{ background: "#121212", color: "#fff" }}>
              <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Plan Unico</div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold" style={{ fontFamily: "'Syncopate', sans-serif" }}>$50</span>
                <span className="text-sm opacity-50">/mes por usuario</span>
              </div>
              <div className="h-px bg-white/10 mb-6" />
              <ul className="space-y-3 text-sm">
                {[
                  "Contactos y leads ilimitados",
                  "Propiedades ilimitadas (4 fotos c/u)",
                  "Inbox unificado: WhatsApp + Instagram + Facebook",
                  "Propi Magic: inteligencia de mercado con IA",
                  "KPIs de mercado: Caracas, Valencia, Maracaibo",
                  "Publicacion en Wasi con 1 click",
                  "Calendario y citas vinculadas",
                  "Documentos y contratos en la nube",
                  "Email marketing (3,000 emails/mes)",
                  "Metricas de Instagram y Facebook",
                  "Pagina publica para compartir propiedades",
                  "App movil PWA (funciona sin internet)",
                  "Soporte por WhatsApp",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">&#10003;</span>
                    <span className="opacity-80">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="h-px bg-white/10 my-6" />
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Hola, quiero contratar Propi CRM ($50/mes). Mi nombre es: ")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-all hover:opacity-90"
                style={{ background: "#25D366", color: "#fff" }}
              >
                Contratar por WhatsApp
              </a>
              <p className="text-center text-[10px] opacity-30 mt-4">
                Pago mensual en bolivares a tasa BCV del dia. Sin contratos. Cancela cuando quieras.
              </p>
            </div>
          </div>

          <Link href="/sign-up" className="px-10 py-5 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-black/80 hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-black/20" style={{ background: "#121212", color: "#fff" }}>
            Crear Cuenta Gratis
          </Link>
          <p className="text-xs text-gray-400 mt-4">Prueba gratis. Sin tarjeta de credito.</p>
        </section>
      </div>

      {/* Footer (fixed behind) */}
      <footer className="footer-sticky fixed bottom-0 left-0 w-full h-screen z-[1] flex flex-col justify-center items-center" style={{ background: "#111", color: "#fff" }}>
        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/1c6b6980-54e4-4d8c-9ff6-e09b844d7b01_3840w.webp" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" alt="" />
        <div className="footer-content relative z-10 text-center">
          <div className="text-xs uppercase tracking-[0.3em] mb-4 text-gray-400 font-normal">Revoluciona tus ventas</div>
          <Link href="/" className="block hover:text-gray-400 transition-colors" style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "min(10vw, 8vw)", letterSpacing: "-0.05em", lineHeight: 1 }}>
            PROPI
          </Link>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-12 text-xs uppercase tracking-widest text-gray-400 font-medium">
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#app" className="hover:text-white transition-colors">App Movil</a>
            <a href="#integraciones" className="hover:text-white transition-colors">Integraciones</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="mt-24 text-xs text-gray-600 uppercase tracking-widest">
            2026 Propi. Hecho en Venezuela.
          </div>
        </div>
      </footer>
    </div>
  );
}
