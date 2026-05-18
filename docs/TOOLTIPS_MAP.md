# Propi — Mapa de Tooltips de Ayuda Contextual

## Patron de referencia

Basado en los patrones de HubSpot, Salesforce, Intercom, y Notion:
- **Icono**: `Info` de Lucide (circulo con "i"), 14px, color `muted-foreground`, opacidad 40%
- **Trigger**: hover en desktop, tap en mobile
- **Estilo**: popover pequeño (max 240px), fondo `card-bg`, borde `border`, sombra sutil
- **Posicion**: preferir derecha o abajo del icono, auto-flip si no cabe
- **Duracion**: desaparece al mover el mouse fuera o tap fuera
- **Mobile PWA**: el icono se ve pero es discreto (no compite con la accion principal)
- **Tono**: directo, en segunda persona, 1-2 oraciones max. Sin jerga tecnica.

---

## Dashboard

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Overview" | "Resumen en tiempo real de tu negocio. Los datos se actualizan cada 60 segundos." |
| Card "Propiedades" (junto al titulo) | "Total de propiedades en tu inventario. La grafica muestra la distribucion por tipo." |
| Card "Contactos" (junto al titulo) | "Contactos creados en los ultimos 6 meses. La grafica muestra el crecimiento mensual." |
| Card "Ventas Cerradas" (junto al titulo) | "Propiedades con status 'Vendida' o 'Reservada'. Cambia el status desde el detalle de cada propiedad." |
| Card "Citas esta Semana" (junto al titulo) | "Citas programadas de lunes a domingo. La grafica muestra la distribucion por dia." |
| Seccion "Proximas Citas" (junto al titulo) | "Tus proximas 4 citas. Haz click en una para editarla o cancelarla." |
| Seccion "Actividad Reciente" (junto al titulo) | "Ultimas propiedades y contactos creados o modificados." |
| Seccion "Tareas Pendientes" (junto al titulo) | "Tareas con fecha limite proxima. Marca como completada con un click." |
| Seccion "Calculadora de Comisiones" (junto al titulo) | "Calcula tu comision rapida. Para el simulador completo ve a Comisiones en el menu." |

## Contactos

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Boton "Importar" (header) | "Importa contactos desde un archivo CSV, vCard (.vcf), o directamente desde tu telefono (Chrome Android)." |
| Campo "Fuente" (formulario) | "De donde llego este contacto. Te ayuda a medir que canal genera mas leads." |
| Seccion "Preferencias de busqueda" (formulario) | "Opcional. Si llenas estas preferencias, Propi puede sugerirte propiedades compatibles con este contacto." |
| Campo "Presupuesto maximo" | "En dolares (USD). Se usa para el matching automatico con propiedades." |
| Seccion "Historial de Actividad" (detalle) | "Registro automatico de acciones: citas creadas, movimientos en pipeline, notas, emails enviados." |

## Propiedades

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Boton "Publicar/Despublicar" (detalle) | "Cambia el status a 'Activa' para que aparezca en tu portal publico y puedas compartirla." |
| Boton "Compartir" (detalle) | "Genera un link publico para enviar por WhatsApp, Instagram, Facebook, o copiar al portapapeles." |
| Boton "Enviar por email" (detalle) | "Envia una ficha con foto, precio y datos a uno o mas contactos por email." |
| Boton "Buscar contactos compatibles" (detalle) | "Encuentra contactos cuyas preferencias (tipo, ciudad, presupuesto) coinciden con esta propiedad." |
| Boton "Publicar en Wasi" (detalle) | "Publica esta propiedad en Wasi con un click. Las fotos se suben automaticamente." |
| Campo "Links externos" (formulario) | "Links a portales donde esta publicada (Wasi, MercadoLibre, etc). Se muestran en la pagina publica." |
| Limite de 4 fotos | "Maximo 4 fotos por propiedad. Formatos: JPEG, PNG, WebP, HEIC. Max 10MB cada una." |

## Pipeline

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Pipeline" (junto al subtitulo) | "Arrastra contactos entre columnas para cambiar su etapa. En mobile, mantene presionado para arrastrar." |
| Buscador del pipeline | "Filtra contactos por nombre, email, telefono o empresa. El filtro aplica a todas las columnas." |

## Calendario

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Calendario" | "En mobile: toca un dia para crear cita. Desliza izquierda/derecha para cambiar de mes. Vista agenda recomendada." |
| Boton "Nueva Cita" | "Crea una cita y vinculala a un contacto y/o propiedad. Recibiras una notificacion 24 horas antes." |

## Tareas

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Tareas" | "Crea recordatorios con fecha limite. Las tareas vencidas generan una notificacion automatica." |
| Campo "Fecha limite" (formulario) | "Opcional. Si la pones, recibiras una notificacion cuando la tarea se venza." |

## Documentos

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Boton "Subir Documento" | "Sube contratos, escrituras, avaluos, planos. Formatos: PDF, Word, Excel, imagenes. Max 10MB." |
| Campo "Tipo" (al subir) | "Clasifica el documento para encontrarlo mas facil despues." |
| Campo "Contacto/Propiedad" (al subir) | "Vincula el documento a un contacto o propiedad para verlo desde su ficha." |

## Propi Magic

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Propi Magic" | "Pregunta sobre precios, tendencias, o comparables en cualquier zona de Venezuela. Los datos vienen de MercadoLibre y se actualizan diariamente." |
| Debajo del chat input | "Ejemplo: 'Apartamentos en venta en Altamira, 80-100m2' o 'Precio promedio en Las Mercedes'." |

## KPIs de Mercado

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "KPIs de Mercado" | "Indicadores calculados con SQL sobre datos reales de MercadoLibre. No son estimaciones de IA." |
| Card "Precio promedio" | "Promedio aritmetico de todos los listings activos en la zona seleccionada." |
| Card "Mediana" | "El precio del medio: 50% de las propiedades cuestan menos y 50% cuestan mas. Mas confiable que el promedio." |
| Card "Precio por m2" | "Precio promedio dividido por area. Util para comparar propiedades de diferentes tamanos." |

## Secuencias (Drip)

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Secuencias" | "Emails automaticos que se envian en orden a tus contactos. Ideal para seguimiento de leads frios." |
| Campo "Delay (dias)" (al crear paso) | "Dias de espera antes de enviar este email. El primer paso puede tener delay 0 para envio inmediato." |
| Boton "Enrollar contacto" | "Agrega un contacto a esta secuencia. Debe tener email. No se puede enrollar dos veces en la misma secuencia." |

## Email Marketing

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Email" | "Campanas de email a segmentos de contactos. Se envian en segundo plano via tu API key de Resend." |
| Campo "Tag/Segmento" (al crear) | "Opcional. Si seleccionas un tag, solo se envia a contactos con ese tag. Si no, se envia a todos con email." |
| Boton "Enviar ahora" | "La campana se encola y se envia en segundo plano. Puedes cerrar la pagina, el envio continua." |

## Comisiones

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Titulo "Simulador de Comisiones" | "Calcula tu comision neta por operacion. Ajusta el porcentaje, el split con la agencia, y el IVA." |
| Slider "Split agencia/agente" | "Porcentaje que se queda la agencia vs lo que recibes tu. 50/50 es el estandar en Venezuela." |
| Toggle "IVA 16%" | "Impuesto al Valor Agregado de Venezuela. Se aplica sobre tu porcion de la comision." |

## Configuracion

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Seccion "Mi Portal Web" | "Tu pagina publica con todas tus propiedades activas. Comparte el link por WhatsApp." |
| Seccion "Wasi" | "Conecta tu cuenta de Wasi para publicar propiedades con un click desde Propi." |
| Seccion "Email (Resend)" | "Tu propia API key de Resend. Cada usuario tiene su propio limite de 3,000 emails/mes gratis." |
| Seccion "Invita a un amigo" | "Comparte Propi por WhatsApp. No hay programa de referidos por ahora, solo buena voluntad." |

## Sidebar / Navegacion

| Ubicacion | Texto del tooltip |
|-----------|-------------------|
| Boton "Mi Portal" (sidebar footer) | "Copia el link de tu portal publico al portapapeles. Pegalo en WhatsApp para compartir tus propiedades." |
| Campana de notificaciones (top bar) | "Notificaciones de citas proximas, tareas vencidas, y cumpleanos de contactos." |

---

## Implementacion sugerida

### Componente `InfoTooltip`

```tsx
// src/components/ui/info-tooltip.tsx
"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Informacion"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-60 rounded-lg border border-border bg-[var(--card-bg)] p-3 text-xs text-muted-foreground shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
}
```

### Uso

```tsx
<h2 className="flex items-center gap-1.5">
  Propiedades
  <InfoTooltip text="Total de propiedades en tu inventario." />
</h2>
```

### Prioridad de implementacion

1. **Dashboard** (9 tooltips) — es lo primero que ve el usuario
2. **Propiedades detalle** (5 tooltips) — donde estan las acciones principales
3. **Contactos formulario** (3 tooltips) — las preferencias son nuevas
4. **Pipeline** (2 tooltips) — el drag & drop no es obvio en mobile
5. **Resto** — ir agregando segun feedback de usuarios
