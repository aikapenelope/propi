"use client";

import { useState } from "react";
import { ENABLE_META_INBOX } from "@/lib/feature-flags";
import {
  HelpCircle,
  Smartphone,
  Key,
  Building2,
  Users,
  Calendar,
  FileText,
  MessageCircle,
  Facebook,
  Mail,
  Sparkles,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Section {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { q: string; a: string }[];
}

const allSections: Section[] = [
  {
    id: "getting-started",
    icon: Zap,
    title: "Primeros Pasos",
    items: [
      {
        q: "Como instalar Propi en mi telefono?",
        a: "Abre propi.aikalabs.cc en Chrome o Safari. Toca el menu del navegador y selecciona 'Agregar a pantalla de inicio'. Propi se instala como una app sin necesidad de App Store o Google Play.",
      },
      {
        q: "Como crear mi cuenta?",
        a: "Ve a propi.aikalabs.cc/sign-up. Puedes registrarte con Google o con email y contraseña. Despues del registro, seras redirigido al dashboard.",
      },
      {
        q: "Que es el modelo por seat?",
        a: "Cada persona que necesite acceso a Propi es un seat. No hay tabla de agentes separada - tu usuario de Clerk es tu seat. Pagas por usuario, no por contacto o propiedad.",
      },
    ],
  },
  {
    id: "properties",
    icon: Building2,
    title: "Propiedades",
    items: [
      {
        q: "Como agregar una propiedad?",
        a: "Ve a Propiedades > Nueva Propiedad. Llena el formulario con titulo, tipo, operacion, precio, area, habitaciones, etc. Despues de crear, ve al detalle de la propiedad para subir imagenes.",
      },
      {
        q: "Como subir fotos a una propiedad?",
        a: "Abre el detalle de la propiedad. Debajo de la galeria veras el boton 'Subir Imagen'. Selecciona la foto (JPG, PNG, max 10MB). La imagen se sube a MinIO y aparece en la galeria.",
      },
      {
        q: "Como compartir una propiedad por WhatsApp?",
        a: "En el detalle de la propiedad, toca el boton verde 'Compartir'. Selecciona WhatsApp, Instagram, Facebook o Copiar Link. Se genera un mensaje con titulo, precio y link directo.",
      },
      {
        q: "Como publicar en portales?",
        a: "En el detalle de la propiedad, baja a 'Publicar en Portales'. Copia el texto pre-generado y usa los botones para abrir MercadoLibre, Wasi o Facebook Marketplace directamente.",
      },
      {
        q: "Que monedas soporta?",
        a: "USD (default), VES (bolivares) y EUR. Selecciona la moneda al crear o editar la propiedad.",
      },
    ],
  },
  {
    id: "contacts",
    icon: Users,
    title: "Contactos",
    items: [
      {
        q: "Como agregar un contacto?",
        a: "Ve a Contactos > Nuevo Contacto. Llena nombre, email, telefono, empresa, fuente (Web, Referido, Instagram, WhatsApp, etc.) y tags.",
      },
      {
        q: "Como usar tags para segmentar?",
        a: "Los tags son etiquetas de colores que puedes asignar a contactos y propiedades. Crea tags como 'VIP', 'Comprador', 'Inversor'. Usa los tags para filtrar contactos rapidamente.",
      },
      {
        q: "Como llamar a un contacto desde el telefono?",
        a: "En el detalle del contacto, toca el numero de telefono. Se abre la app de llamadas directamente (tap-to-call).",
      },
    ],
  },
  {
    id: "calendar",
    icon: Calendar,
    title: "Calendario",
    items: [
      {
        q: "Como crear una cita?",
        a: "Ve a Calendario > Nueva Cita. Selecciona titulo, fecha/hora inicio y fin, ubicacion, contacto vinculado y propiedad vinculada. Los estados son: programada, confirmada, completada, cancelada, no-show.",
      },
      {
        q: "Puedo vincular una cita a una propiedad?",
        a: "Si. Al crear o editar una cita, selecciona el contacto y la propiedad. Esto te permite ver las citas desde el detalle del contacto y de la propiedad.",
      },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    title: "Documentos",
    items: [
      {
        q: "Que tipos de documentos puedo subir?",
        a: "Contrato, Documento ID, Escritura, Avaluo, Plano, Factura, u Otro. Los archivos se guardan en MinIO (almacenamiento seguro). Puedes vincular cada documento a un contacto y/o propiedad.",
      },
      {
        q: "Como descargar un documento?",
        a: "En la lista de documentos, toca el icono de descarga. Se genera una URL segura que expira en 1 hora. PDFs se abren en el navegador, otros archivos se descargan.",
      },
    ],
  },
  {
    id: "inbox",
    icon: MessageCircle,
    title: "Inbox Unificado",
    items: [
      {
        q: "Como funciona el inbox?",
        a: "El inbox unifica mensajes de WhatsApp, Instagram DMs y Facebook Messenger en una sola pantalla. Puedes filtrar por canal, ver mensajes no leidos, y responder sin cambiar de app.",
      },
      {
        q: "Como recibo mensajes?",
        a: "Los mensajes llegan via webhook de Meta (/api/webhooks/meta). Configura el webhook en tu Meta Developer Dashboard con la URL: https://propi.aikalabs.cc/api/webhooks/meta y el verify token de tu .env.",
      },
      {
        q: "Los mensajes se guardan?",
        a: "Si, en la base de datos. Se retienen por 90 dias. Puedes ver el historial de conversaciones y mensajes anteriores.",
      },
    ],
  },
  {
    id: "propi-magic",
    icon: Sparkles,
    title: "Propi Magic",
    items: [
      {
        q: "Que es Propi Magic?",
        a: "Es el sistema de inteligencia de mercado de Propi. Busca propiedades en MercadoLibre, las analiza con IA (Groq), y te da precios promedio, tendencias y sugerencias. Los datos se guardan en una base de datos centralizada.",
      },
      {
        q: "Como buscar propiedades?",
        a: "Abre Propi Magic en el sidebar. Escribe en lenguaje natural: 'Apartamentos en Altamira de 80-100m2'. El sistema busca en la base de datos local y te muestra cards con imagenes, precios y links a MercadoLibre.",
      },
      {
        q: "De donde vienen los datos?",
        a: "Un cron job diario sincroniza propiedades de MercadoLibre Venezuela. Los datos se acumulan en la tabla market_listings. Los KPIs (precio/m2, mediana, etc.) se calculan con SQL, no con IA.",
      },
    ],
  },
  {
    id: "reports",
    icon: FileText,
    title: "Reportes y PDFs",
    items: [
      {
        q: "Como generar un reporte?",
        a: "Ve a Reportes en el sidebar. Selecciona el periodo (mes, trimestre, ano, o personalizado) y toca 'Generar'. Luego descarga el PDF de 5 paginas con portada, resumen ejecutivo, transacciones, pipeline e inventario.",
      },
      {
        q: "Como descargar la ficha de una propiedad?",
        a: "En el detalle de la propiedad, toca el boton 'Ficha PDF'. Se genera un PDF de 1 pagina con foto, titulo, precio, specs, descripcion y tu nombre/empresa.",
      },
      {
        q: "Como poner el nombre de mi empresa en los PDFs?",
        a: "Ve a Configuracion > Marca de la Empresa. Ingresa el nombre de tu inmobiliaria y sube tu logo. Aparecera en la portada de reportes y en el header de fichas de propiedad.",
      },
      {
        q: "Que son los comparables de mercado?",
        a: "En el detalle de cada propiedad, Propi busca automaticamente 3-5 propiedades similares en MercadoLibre (mismo tipo, ciudad, rango de precio) y te muestra el precio promedio, minimo, maximo y precio por m2. Util para justificar precios ante clientes.",
      },
    ],
  },
  {
    id: "tokens",
    icon: Key,
    title: "Tokens y Conexiones",
    items: [
      {
        q: "Como conectar Instagram/Facebook/WhatsApp?",
        a: "Ve a Configuracion. Para cada canal, necesitas un access token de Meta y el Platform Account ID (Instagram Business Account ID, Facebook Page ID, o WhatsApp Phone Number ID). Obtiene estos desde tu Meta Developer Dashboard.",
      },
      {
        q: "Cada cuanto expiran los tokens de Meta?",
        a: "Los tokens long-lived de Meta duran 60 dias. Cuando expiren, ve a Configuracion y actualiza el token. Propi te muestra la fecha de expiracion.",
      },
      {
        q: "Como funciona MercadoLibre en Propi?",
        a: "Propi extrae datos de MercadoLibre Venezuela automaticamente para Propi Magic (inteligencia de mercado). No necesitas conectar tu cuenta. Los datos se sincronizan diariamente y se usan para calcular KPIs de precios, tendencias y comparables.",
      },
      {
        q: "Como publicar en Wasi?",
        a: "En el detalle de la propiedad, usa el boton 'Wasi' para abrir wasi.co directamente. Copia el texto pre-generado y pegalo en el formulario de Wasi.",
      },
      {
        q: "Como configurar el email?",
        a: "Propi usa Resend para enviar fichas de propiedad por email. La API key global se configura como variable de entorno RESEND_API_KEY en Coolify. No necesitas configurar nada en la app.",
      },
      {
        q: "Como configurar el webhook de Meta?",
        a: "En tu Meta Developer Dashboard: 1) Ve a tu app > Webhooks. 2) Suscribete a 'messages' para Instagram, Facebook y WhatsApp. 3) URL del callback: https://propi.aikalabs.cc/api/webhooks/meta. 4) Verify token: el valor de META_WEBHOOK_VERIFY_TOKEN en tus env vars.",
      },
    ],
  },
  {
    id: "pwa",
    icon: Smartphone,
    title: "App Movil (PWA)",
    items: [
      {
        q: "Que puedo hacer en el telefono?",
        a: "Tareas, Contactos (ver, buscar, llamar), Propiedades (ver, compartir, ficha PDF), Calendario (ver citas). Todo lo demas (dashboard, reportes, Propi Magic, configuracion) esta en el boton central del menu.",
      },
      {
        q: "Funciona sin internet?",
        a: "Parcialmente. Las paginas que ya visitaste se cachean y se muestran offline. Las fotos de propiedades tambien se cachean. Pero para crear contactos o buscar propiedades necesitas conexion.",
      },
      {
        q: "Como actualizar la app?",
        a: "La PWA se actualiza automaticamente. El service worker verifica actualizaciones cada vez que abres la app. Si hay una nueva version, se descarga en segundo plano y se activa en la proxima visita.",
      },
      {
        q: "Que son los shortcuts?",
        a: "Si mantienes presionado el icono de Propi en tu pantalla de inicio (Android), aparece un menu rapido con: Nueva Propiedad, Contactos, y Calendario. Acceso directo sin abrir la app completa.",
      },
      {
        q: "Como importar contactos del telefono?",
        a: "En Contactos, toca 'Importar'. En Android con Chrome, puedes seleccionar contactos directamente del telefono. En iPhone, exporta tus contactos como archivo .vcf desde la app de Contactos y subelo a Propi.",
      },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Seguridad",
    items: [
      {
        q: "Como se protegen mis datos?",
        a: "Autenticacion con Clerk (MFA, social login). Conexiones HTTPS. Archivos en MinIO con URLs firmadas que expiran. Tokens encriptados en la base de datos. Acceso al servidor solo via Tailscale VPN.",
      },
      {
        q: "Quien puede ver mis contactos y propiedades?",
        a: "Solo los usuarios con acceso a tu instancia de Propi. Cada instancia es independiente. No compartimos datos entre clientes.",
      },
    ],
  },
];

const quickLinks = [
  { label: "Meta Developer Dashboard", url: "https://developers.facebook.com", icon: Facebook },
  { label: "Clerk Dashboard", url: "https://clerk.com", icon: Shield },
  { label: "Resend (Email)", url: "https://resend.com", icon: Mail },
  { label: "Wasi", url: "https://wasi.co", icon: ShoppingBag },
  { label: "MercadoLibre Developers", url: "https://developers.mercadolibre.com.ve", icon: ShoppingBag },
  { label: "Groq Console", url: "https://console.groq.com", icon: Sparkles },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed pr-8">
          {a}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HelpCenterPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = ENABLE_META_INBOX
    ? allSections
    : allSections.filter((s) => s.id !== "inbox" && s.id !== "tokens");

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Help Center</h1>
          <p className="text-xs text-muted-foreground">
            Guias, configuracion y preguntas frecuentes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 lg:sticky lg:top-28">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(0,255,85,0.15)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {section.title}
                </button>
              );
            })}

            {/* Quick links */}
            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 px-3">
                Links Utiles
              </p>
              {quickLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <link.icon className="h-3.5 w-3.5 shrink-0" />
                  {link.label}
                  <ExternalLink className="h-3 w-3 ml-auto opacity-30" />
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {sections
            .filter((s) => s.id === activeSection)
            .map((section) => (
              <div key={section.id}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>

                <div className="bg-[var(--card-bg)] border border-border rounded-2xl card-shadow px-5">
                  {section.items.map((item) => (
                    <AccordionItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
