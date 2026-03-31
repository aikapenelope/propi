import {
  CheckCircle2,
  DollarSign,
  Instagram,
  Facebook,
  MessageCircle,
  Mail,
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileText,
  Search,
  MessageSquare,
  Bell,
  Home,
} from "lucide-react";

export const dynamic = "force-static";

/**
 * Public preview of the dashboard with mock data.
 * No auth, no DB required. Remove this route before production.
 */
export default function PreviewPage() {
  return (
    <div className="flex min-h-screen" style={{ background: "#E4E7E1" }}>
      {/* Mini sidebar (desktop only) */}
      <aside className="w-[72px] flex-shrink-0 hidden md:flex flex-col items-center py-6 border-r border-gray-300/30">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm mb-8"
          style={{ background: "#fff", color: "#0A2B1D" }}
        >
          <Home className="h-5 w-5" />
        </div>
        <nav className="flex-1 flex flex-col gap-4 items-center">
          {[
            { icon: LayoutDashboard, active: true },
            { icon: Users, active: false },
            { icon: Building2, active: false },
            { icon: Calendar, active: false },
            { icon: FileText, active: false },
          ].map((item, i) => (
            <div
              key={i}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: item.active ? "#fff" : "transparent",
                color: item.active ? "#0A2B1D" : "#9ca3af",
                boxShadow: item.active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <item.icon className="h-5 w-5" />
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-4">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <div className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 relative">
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full" />
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-[72px] flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: "#0A2B1D" }}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </div>
          </div>
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar contactos, propiedades..."
                className="w-full bg-white rounded-full py-3 pl-10 pr-4 text-sm shadow-sm outline-none"
                style={{ color: "#1A1D20" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 bg-white pl-1.5 pr-3 py-1 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <span className="text-sm font-bold" style={{ color: "#1A1D20" }}>
                Demo
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto px-4 md:px-8 pb-20 md:pb-10"
          style={{ fontFamily: "var(--font-jakarta), var(--font-sans), sans-serif" }}
        >
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Big composite card */}
              <div className="col-span-1 xl:col-span-2 bg-white rounded-[32px] overflow-hidden shadow-sm flex flex-col md:flex-row relative min-h-[340px]">
                <div className="w-full md:w-[55%] p-8 flex flex-col justify-between z-10">
                  <div className="flex gap-8 md:gap-12 mb-8">
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: "#8BA398" }}>
                        Contactos Activos
                      </div>
                      <div className="text-[40px] font-extrabold leading-none tracking-tight" style={{ color: "#0A2B1D" }}>
                        1,250
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: "#8BA398" }}>
                        Citas esta Semana
                      </div>
                      <div className="text-[40px] font-extrabold leading-none tracking-tight" style={{ color: "#0A2B1D" }}>
                        8
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full max-w-sm">
                    <div className="rounded-[20px] p-5 flex-1" style={{ background: "#E2F2E9" }}>
                      <div className="flex items-center gap-2 text-sm mb-3 font-bold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Propiedades Activas
                      </div>
                      <div className="text-3xl font-extrabold mb-2" style={{ color: "#0A2B1D" }}>320</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-green-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: "80%" }} />
                        </div>
                        <span className="text-[10px] font-bold text-green-700">80%</span>
                      </div>
                    </div>
                    <div className="rounded-[20px] p-5 flex-1" style={{ background: "#E2F3F9" }}>
                      <div className="flex items-center gap-2 text-sm mb-3 font-bold text-blue-700">
                        <DollarSign className="h-4 w-4" />
                        Comisiones
                      </div>
                      <div className="text-3xl font-extrabold mb-2" style={{ color: "#0A2B1D" }}>$2.5M</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: "34%" }} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-700">34%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-[55%] h-full pointer-events-none hidden md:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                    className="w-full h-full object-cover rounded-tl-[40px]"
                    alt=""
                  />
                </div>
              </div>

              {/* Marketing card */}
              <div className="col-span-1 rounded-[32px] p-8 shadow-sm flex flex-col justify-between" style={{ background: "#EBF6D6" }}>
                <div>
                  <div className="text-green-700 text-xs font-bold uppercase tracking-wider mb-2">
                    Canales de Marketing
                  </div>
                  <h3 className="text-2xl font-extrabold mb-3 leading-tight" style={{ color: "#0A2B1D" }}>
                    Inbox Unificado<br />IG + FB + WA
                  </h3>
                  <p className="text-sm text-green-800/80 mb-6">
                    Responde mensajes de Instagram, Facebook y WhatsApp desde una sola pantalla.
                  </p>
                  <span
                    className="text-white px-6 py-3 rounded-full text-sm font-semibold inline-block"
                    style={{ background: "#0A2B1D" }}
                  >
                    Abrir Inbox
                  </span>
                </div>
                <div className="flex gap-2 mt-6">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-pink-100 text-pink-700">
                    <Instagram className="h-3 w-3 inline mr-1" />IG
                  </span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                    <Facebook className="h-3 w-3 inline mr-1" />FB
                  </span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                    <MessageCircle className="h-3 w-3 inline mr-1" />WA
                  </span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                    <Mail className="h-3 w-3 inline mr-1" />Email
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Appointments */}
              <div className="col-span-1 xl:col-span-2 bg-white rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: "#0A2B1D" }}>Proximas Citas</h3>
                    <p className="text-sm" style={{ color: "#8BA398" }}>Tus citas programadas esta semana</p>
                  </div>
                  <span className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-50" style={{ color: "#0A2B1D" }}>
                    Ver Calendario
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { day: 15, title: "Visita Apto 302 - Torre Norte", time: "10:00", contact: "Maria Lopez" },
                    { day: 15, title: "Firma contrato Casa Campestre", time: "14:30", contact: "Carlos Rivera" },
                    { day: 16, title: "Avaluo Oficina Centro", time: "09:00", contact: "Ana Gutierrez" },
                    { day: 17, title: "Entrega llaves Local 5", time: "11:00", contact: "Pedro Sanchez" },
                  ].map((apt, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: "#E2F2E9", color: "#0A2B1D" }}
                      >
                        {apt.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: "#0A2B1D" }}>{apt.title}</div>
                        <div className="text-xs" style={{ color: "#8BA398" }}>{apt.time} - {apt.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-1 flex flex-col gap-6">
                {/* Commission calculator mock */}
                <div className="bg-white rounded-[28px] p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4" style={{ color: "#0A2B1D" }} />
                    <h4 className="text-sm font-semibold" style={{ color: "#0A2B1D" }}>Calculadora de Comisiones</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#8BA398" }}>Precio de Venta</div>
                      <div className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm font-medium" style={{ color: "#0A2B1D" }}>$250,000</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#8BA398" }}>Comision (3%)</div>
                      <div className="rounded-lg p-3" style={{ background: "#E2F2E9" }}>
                        <div className="text-xs" style={{ color: "#8BA398" }}>Comision</div>
                        <div className="text-xl font-bold" style={{ color: "#0A2B1D" }}>$7,500</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory status */}
                <div className="bg-white rounded-[28px] p-6 shadow-sm">
                  <h4 className="text-base font-bold mb-4" style={{ color: "#0A2B1D" }}>Estado del Inventario</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Activa", count: 245, color: "#22c55e" },
                      { label: "Reservada", count: 38, color: "#f59e0b" },
                      { label: "Vendida", count: 52, color: "#3b82f6" },
                      { label: "Borrador", count: 15, color: "#94a3b8" },
                      { label: "Inactiva", count: 8, color: "#ef4444" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-sm" style={{ color: "#0A2B1D" }}>{s.label}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: "#0A2B1D" }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-[28px] p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#0A2B1D" }}>Propiedades Recientes</h3>
                <div className="space-y-2">
                  {[
                    { title: "Apto 302 Torre Norte", price: "$185,000" },
                    { title: "Casa Campestre La Calera", price: "$420,000" },
                    { title: "Oficina Centro Empresarial", price: "$95,000" },
                    { title: "Local Comercial Zona T", price: "$310,000" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div>
                        <span className="font-semibold text-sm" style={{ color: "#0A2B1D" }}>{p.title}</span>
                        <span className="text-xs text-blue-600 font-bold ml-2">{p.price}</span>
                      </div>
                      <span className="text-xs" style={{ color: "#8BA398" }}>Hoy</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[28px] p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#0A2B1D" }}>Contactos Recientes</h3>
                <div className="space-y-2">
                  {[
                    { name: "Maria Lopez", initials: "ML" },
                    { name: "Carlos Rivera", initials: "CR" },
                    { name: "Ana Gutierrez", initials: "AG" },
                    { name: "Pedro Sanchez", initials: "PS" },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0A2B1D" }}>
                          {c.initials}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: "#0A2B1D" }}>{c.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: "#8BA398" }}>Hoy</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: LayoutDashboard, label: "Inicio", active: true },
              { icon: Users, label: "Contactos", active: false },
              { icon: Building2, label: "Inmuebles", active: false },
              { icon: Calendar, label: "Agenda", active: false },
              { icon: MessageCircle, label: "Inbox", active: false },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs"
                style={{ color: item.active ? "#0A2B1D" : "#9ca3af" }}
              >
                <item.icon className="h-5 w-5" />
                <span className={item.active ? "font-bold" : ""}>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
