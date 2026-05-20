import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import React from "react";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Server-side PDF report generation.
 *
 * GET /api/reports/pdf?start=2026-01-01&end=2026-01-31
 *
 * Generates a professional multi-page PDF report using @react-pdf/renderer.
 * The PDF is rendered server-side and streamed to the client.
 *
 * Dynamic imports are used to avoid loading @react-pdf/renderer and the
 * report builder at build time (they depend on DB and Clerk).
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing start or end query parameters" },
      { status: 400 },
    );
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    // Dynamic imports to avoid loading at build time
    const { buildFullReport } = await import("@/server/actions/reports");
    const { ReportPDF } = await import("@/lib/report-pdf");
    const { renderToBuffer } = await import("@react-pdf/renderer");

    const data = await buildFullReport(userId, { startDate, endDate });

    const element = React.createElement(ReportPDF, { data });
    const buffer = await renderToBuffer(
      element as Parameters<typeof renderToBuffer>[0],
    );

    const filename = `reporte-propi-${startDate}-a-${endDate}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    log.http.error({ error: err instanceof Error ? err.message : String(err) }, "PDF report generation failed");
    return NextResponse.json(
      { error: "Error generando el PDF. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
