"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Minus,
  Plus,
  ArrowUpRight,
  MessageCircle,
  Calendar,
  FileText,
  Instagram,
  Facebook,
  Mail,
  BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "¿Como busco y filtro contactos eficientemente?",
    answer:
      "Puedes realizar busquedas globales por nombre, email, telefono o empresa. Ademas, nuestro sistema permite la segmentacion avanzada utilizando tags de colores personalizados, y filtrado por fuente (Web, Referido, Instagram, WhatsApp, etc.).",
  },
  {
    question: "¿Se integra con WhatsApp, Instagram y Facebook?",
    answer:
      "Si. Propi tiene un Inbox Unificado que conecta los tres canales usando la Meta Graph API. Recibes y respondes mensajes de WhatsApp, Instagram DMs y Facebook Messenger desde una sola pantalla, sin cambiar de app.",
  },
  {
    question: "¿El inventario soporta multiples monedas?",
    answer:
      "Si. Cada propiedad puede tener su precio en USD, COP o EUR. Los filtros de precio funcionan por moneda y la calculadora de comisiones se adapta automaticamente.",
  },
  {
    question: "¿Como funciona la gestion de documentos y contratos?",
    answer:
      "Subes archivos directamente desde el navegador (PDF, DOC, imagenes). Cada documento se vincula a un contacto y/o propiedad. Puedes clasificarlos por tipo: contrato, escritura, avaluo, plano, factura. La descarga usa URLs firmadas con expiracion de 1 hora.",
  },
  {
    question: "¿Puedo gestionar citas y vincularlas a propiedades?",
    answer:
      "Si. El calendario te permite crear citas con hora inicio/fin, ubicacion (fisica o virtual), y vincularlas a un contacto y una propiedad. Puedes ver las proximas citas desde el dashboard y desde el detalle de cada contacto.",
  },
  {
    question: "¿Funciona como app en el telefono?",
    answer:
      "Si. Propi es una PWA (Progressive Web App) que se instala desde el navegador sin app stores. Funciona offline, tiene notificaciones, y esta optimizada para telefonos gama media. Se ve y se siente como una app nativa.",
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
        background: "#FAF9F6",
        color: "#111827",
        fontFamily: "var(--font-jakarta), sans-serif",
      }}
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: "-10%",
            left: "10%",
            width: 600,
            height: 600,
            background: "rgba(255,237,213,0.6)",
            filter: "blur(120px)",
            mixBlendMode: "multiply",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "10%",
            right: "10%",
            width: 700,
            height: 700,
            background: "rgba(233,213,255,0.5)",
            filter: "blur(120px)",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Navigation */}
      <header className="w-full max-w-[1440px] mx-auto px-8 md:px-16 py-8 flex items-center justify-between relative z-50">
        <nav className="hidden md:flex items-center gap-10 text-sm font-medium" style={{ color: "#6B7280" }}>
          <Link href="/" className="font-bold" style={{ color: "#1A1D20" }}>
            Inicio
          </Link>
          <Link href="/sign-up" className="hover:opacity-80 transition-opacity">
            Contactos
          </Link>
          <Link href="/sign-up" className="hover:opacity-80 transition-opacity">
            Inventario
          </Link>
          <Link href="/sign-up" className="hover:opacity-80 transition-opacity">
            Calendario
          </Link>
        </nav>

        <div
          className="flex items-center gap-2 font-bold text-2xl tracking-tight"
          style={{ color: "#1A1D20" }}
        >
          <Building2 className="h-7 w-7" />
          Propi
        </div>

        <Link
          href="/sign-in"
          className="text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          style={{ background: "#1A1D20" }}
        >
          Ingresar
        </Link>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-[1440px] mx-auto px-8 md:px-16 pt-12 pb-24 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1
            className="text-4xl md:text-[64px] leading-[1.1] font-extrabold tracking-tight mb-6"
            style={{ color: "#111827" }}
          >
            Tu CRM Inmo
            <span className="relative inline-block">
              <span
                className="w-12 h-12 rounded-full absolute -left-2 top-2 -z-10 overflow-hidden inline-block"
                style={{ background: "#e5e7eb" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  className="w-full h-full object-cover opacity-80"
                  alt=""
                />
              </span>
              biliario
            </span>
            , <br />
            A un Solo Clic.
          </h1>
          <p className="text-lg font-medium" style={{ color: "#6B7280" }}>
            Centraliza contactos, inventario, inbox unificado y marketing.
            <br />
            La plataforma definitiva para el profesional de bienes raices.
          </p>
        </div>

        {/* Hero Image & Badges */}
        <div className="relative max-w-4xl mx-auto mb-20 z-10">
          <div className="rounded-[40px] overflow-hidden shadow-2xl relative bg-white aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Propiedad Moderna"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Left Badge */}
          <div
            className="absolute top-[45%] -left-[5%] hidden md:flex bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl items-center gap-4 border border-white/50"
            style={{
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)",
              transform: "rotate(-4deg)",
            }}
          >
            <div className="bg-gray-100 p-2 rounded-2xl">
              <Users className="h-5 w-5" style={{ color: "#1A1D20" }} />
            </div>
            <div>
              <div className="font-bold text-xl leading-none mb-1">+5K</div>
              <div className="text-xs font-medium" style={{ color: "#6B7280" }}>
                Contactos
              </div>
            </div>
          </div>

          {/* Right Badge */}
          <div
            className="absolute top-[15%] -right-[5%] hidden md:flex bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl items-center gap-4 border border-white/50"
            style={{
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)",
              transform: "rotate(2deg)",
            }}
          >
            <div className="bg-gray-100 p-2 rounded-2xl">
              <CheckCircle2 className="h-5 w-5" style={{ color: "#1A1D20" }} />
            </div>
            <div>
              <div className="font-bold text-xl leading-none mb-1">+1K</div>
              <div className="text-xs font-medium" style={{ color: "#6B7280" }}>
                Cierres Exitosos
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="bg-white rounded-[40px] p-3 hidden md:flex items-center justify-between max-w-4xl mx-auto border border-gray-100 relative -mt-32 z-20"
          style={{ boxShadow: "0 20px 50px -12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex-1 flex items-center divide-x divide-gray-100">
            {["Venta/Arriendo", "Tipo Inmueble", "Ubicacion", "Estado CRM"].map(
              (label) => (
                <div
                  key={label}
                  className="px-8 py-3 cursor-pointer flex items-center justify-between w-full hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              ),
            )}
          </div>
          <Link
            href="/sign-up"
            className="text-white px-8 py-4 rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all ml-2"
            style={{ background: "#1A1D20" }}
          >
            <Search className="h-4 w-4" />
            Buscar
          </Link>
        </div>
      </main>

      {/* Stats Section */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              value: "1,250+",
              title: "Contactos Activos",
              desc: "Gestiona eficientemente toda tu cartera de clientes potenciales, prospectos y referidos.",
            },
            {
              value: "85%",
              title: "Tasa de Respuesta",
              desc: "Mejora tu engagement y tiempos de respuesta usando nuestro Inbox Unificado multicanal.",
            },
            {
              value: "320+",
              title: "Propiedades Activas",
              desc: "Control total sobre tu inventario: estados, galerias y filtros dinamicos integrados.",
            },
            {
              value: "$2.5M+",
              title: "En Comisiones",
              desc: "Proyecta ingresos y monitorea metas financieras con la calculadora de comisiones interactiva.",
            },
          ].map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-3xl p-8 border border-gray-100/60"
              style={{ boxShadow: "0 10px 30px -15px rgba(0,0,0,0.03)" }}
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: "#1A1D20" }}
              >
                {stat.value}
              </div>
              <div className="text-sm font-bold mb-3" style={{ color: "#111827" }}>
                {stat.title}
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#6B7280" }}
              >
                {stat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Section */}
      <section className="w-full max-w-[1440px] mx-auto py-20 overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            Explora tu Inventario
          </h2>
          <p style={{ color: "#6B7280" }}>
            Acceso rapido a propiedades destacadas vinculadas a contactos o
            listas para mostrar.
            <br />
            Gestion visual completa desde el panel principal.
          </p>
          <div className="mx-auto mt-6 w-16 h-8 rounded-full overflow-hidden inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
              className="w-full h-full object-cover"
              alt=""
            />
          </div>
        </div>

        {/* Gallery Slider */}
        <div className="relative px-4 md:px-16">
          <button className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center z-10 hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center z-10 hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x pb-8 px-4">
            {[
              { img: "photo-1600607687939-ce8a6c25118c", badge: "Activa", badgeClass: "bg-white/90 text-black" },
              { img: "photo-1600585154340-be6161a56a0c", badge: "Reservada", badgeClass: "bg-yellow-400/90 text-black" },
              { img: "photo-1600566753086-00f18efc2291", badge: "Borrador", badgeClass: "bg-white/90 text-black" },
              { img: "photo-1600047509807-ba8f99d2cdde", badge: "Vendida", badgeClass: "bg-green-500/90 text-white" },
              { img: "photo-1512917774080-9991f1c4c750", badge: "Activa", badgeClass: "bg-white/90 text-black" },
            ].map((card, i) => (
              <div
                key={i}
                className="min-w-[280px] h-[400px] rounded-[32px] overflow-hidden snap-center relative shadow-md flex-shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://images.unsplash.com/${card.img}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80`}
                  className="w-full h-full object-cover"
                  alt=""
                />
                <div
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold ${card.badgeClass}`}
                >
                  {card.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Collage Section */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 py-24 bg-white/40">
        <div className="text-center mb-16">
          <h2 className="text-[28px] md:text-[38px] font-bold mb-4">
            Gestion 360° —
            <br />
            Control Total de tus Procesos
          </h2>
          <p
            className="max-w-2xl mx-auto text-sm"
            style={{ color: "#6B7280" }}
          >
            Encuentra todo lo que necesitas bajo un mismo techo: desde captar el
            primer prospecto, agendar citas en el calendario, hasta firmar
            contratos digitales con confianza.
          </p>
        </div>

        {/* Feature Cards instead of collage (better for mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Users, title: "Contactos & Tags", desc: "Segmenta leads por fuente, asigna tags de colores, busca globalmente." },
            { icon: Building2, title: "Inventario Completo", desc: "7 tipos de inmueble, 3 operaciones, 6 estados, galeria de fotos, GPS." },
            { icon: MessageCircle, title: "Inbox Unificado", desc: "WhatsApp, Instagram y Facebook en una sola pantalla con chatscope." },
            { icon: Calendar, title: "Calendario & Citas", desc: "Agenda visitas, vincula a contacto y propiedad, 5 estados de cita." },
            { icon: FileText, title: "Documentos", desc: "Contratos, escrituras, avaluos. Upload directo, vinculado al CRM." },
            { icon: Mail, title: "Email Marketing", desc: "Campanas HTML a segmentos por tag. Envio masivo con Nodemailer." },
            { icon: Instagram, title: "Instagram & Facebook", desc: "Publica, comenta, ve metricas. Todo desde el mismo panel." },
            { icon: BarChart3, title: "Dashboard & KPIs", desc: "Propiedades, contactos, citas, comisiones. Todo en tiempo real." },
            { icon: Facebook, title: "PWA Instalable", desc: "Se instala desde el navegador. Funciona offline. Gama media friendly." },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-3xl p-6 border border-gray-100/60 hover:shadow-lg transition-shadow"
              style={{ boxShadow: "0 10px 30px -15px rgba(0,0,0,0.03)" }}
            >
              <div className="bg-gray-100 w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5" style={{ color: "#1A1D20" }} />
              </div>
              <div className="text-sm font-bold mb-2" style={{ color: "#111827" }}>
                {feature.title}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Collage Section (desktop only) */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 py-24 hidden md:block">
        <div className="relative w-full max-w-4xl mx-auto h-[600px]">
          <div className="absolute top-0 left-0 w-[45%] h-[65%] rounded-[32px] overflow-hidden shadow-xl z-10 border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="absolute top-8 right-[5%] w-[42%] h-[55%] rounded-[32px] overflow-hidden shadow-xl z-20 border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="absolute bottom-[10%] left-[-8%] w-[50%] h-[38%] rounded-[32px] overflow-hidden shadow-2xl z-30 border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="absolute bottom-[5%] right-[12%] w-[45%] h-[40%] rounded-[32px] overflow-hidden shadow-xl z-10 border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="absolute top-[40%] right-[40%] w-[18%] h-[18%] rounded-2xl overflow-hidden shadow-lg z-40 border-[6px] border-white bg-white flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover rounded-xl" alt="" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-[800px] mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-[32px] font-bold mb-4">
            FAQ — Dudas Comunes
          </h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Resolvemos tus preguntas sobre la gestion de contactos, propiedades
            y la configuracion de nuestra plataforma inmobiliaria integral.
          </p>
        </div>

        <div className="space-y-0">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border-b border-gray-200 py-6">
              <button
                className="w-full flex justify-between items-center text-left group"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              >
                <span className="font-bold text-lg" style={{ color: "#111827" }}>
                  {item.question}
                </span>
                {openFaq === idx ? (
                  <span
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 ml-4"
                    style={{ background: "#1A1D20" }}
                  >
                    <Minus className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center flex-shrink-0 ml-4 text-gray-400 group-hover:text-gray-800 transition-colors">
                    <Plus className="h-5 w-5" />
                  </span>
                )}
              </button>
              {openFaq === idx && (
                <div
                  className="mt-4 text-sm leading-relaxed pr-12"
                  style={{ color: "#6B7280" }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-[1440px] mx-auto px-8 md:px-16 py-16">
        <div
          className="grid grid-cols-1 md:grid-cols-12 gap-12 bg-white rounded-[40px] p-8 md:p-12 border border-gray-100/50"
          style={{ boxShadow: "0 20px 50px -15px rgba(0,0,0,0.02)" }}
        >
          {/* Testimonial Area */}
          <div className="md:col-span-5 relative">
            <h3 className="text-2xl font-bold mb-4">
              Agencias que Confian en Nosotros
            </h3>
            <p
              className="text-sm mb-12 max-w-sm"
              style={{ color: "#6B7280" }}
            >
              No te quedes solo con nuestras palabras — descubre como otras
              inmobiliarias estan escalando sus ventas y gestionando sus leads
              con Propi.
            </p>

            {/* Testimonial Card */}
            <div className="bg-[#F9F9FB] rounded-3xl p-6 relative ml-0 md:ml-8 shadow-sm border border-gray-100">
              <div className="font-bold text-sm mb-2">
                &ldquo;Control Total y Eficiencia&rdquo;
              </div>
              <p
                className="text-xs leading-relaxed mb-4"
                style={{ color: "#6B7280" }}
              >
                &ldquo;Como director de agencia, organizar las visitas y el
                inventario era un caos. Propi conecto nuestro WhatsApp directo
                al CRM y automatizo el seguimiento. El equipo es mucho mas
                productivo ahora.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                  className="w-10 h-10 rounded-full object-cover"
                  alt="Carlos Rivera"
                />
                <div>
                  <div className="text-sm font-bold">Carlos Rivera</div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "#6B7280" }}
                  >
                    Broker Inmobiliario, COL
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 right-6 flex gap-2">
                <button className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Links & Newsletter */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12 pt-8">
              <div>
                <h4 className="font-bold text-sm mb-6 uppercase tracking-wider">
                  Plataforma
                </h4>
                <ul className="space-y-4 text-sm" style={{ color: "#6B7280" }}>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Dashboard</Link></li>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Inventario Multi-moneda</Link></li>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Inbox Unificado</Link></li>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Calculadora de Comisiones</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-6 uppercase tracking-wider">
                  Recursos
                </h4>
                <ul className="space-y-4 text-sm" style={{ color: "#6B7280" }}>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Centro de Ayuda</Link></li>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Blog Inmobiliario</Link></li>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Guia de WhatsApp API</Link></li>
                  <li><Link href="/sign-up" className="hover:opacity-80 transition-opacity">Webhooks</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-6 uppercase tracking-wider">
                  Social Media
                </h4>
                <ul className="space-y-4 text-sm" style={{ color: "#6B7280" }}>
                  <li><a href="#" className="hover:opacity-80 transition-opacity">Facebook</a></li>
                  <li><a href="#" className="hover:opacity-80 transition-opacity">Instagram</a></li>
                  <li><a href="#" className="hover:opacity-80 transition-opacity">X / Twitter</a></li>
                  <li><a href="#" className="hover:opacity-80 transition-opacity">LinkedIn</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="border-t border-gray-100 pt-8 mt-auto">
              <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
                Unete a nuestro newsletter y no te pierdas las ultimas
                tendencias en marketing inmobiliario.
              </p>
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm">Actualizaciones de Propi</div>
                <Link
                  href="/sign-up"
                  className="text-white px-6 py-2 rounded-full text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-colors"
                  style={{ background: "#1A1D20" }}
                >
                  Suscribirse
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
