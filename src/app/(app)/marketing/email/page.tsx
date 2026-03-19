import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import { getEmailCampaigns } from "@/server/actions/email-campaigns";
import { formatDate } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  sending: "Enviando",
  sent: "Enviada",
  failed: "Fallida",
};

const statusColors: Record<string, string> = {
  draft: "text-muted-foreground",
  scheduled: "text-amber-500",
  sending: "text-blue-500",
  sent: "text-green-600",
  failed: "text-destructive",
};

export default async function EmailMarketingPage() {
  const campaigns = await getEmailCampaigns();

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">
            Email Marketing
          </h1>
        </div>
        <Link
          href="/marketing/email/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Campana
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay campanas
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera campana de email.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {campaign.subject}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {campaign.tag && (
                    <span
                      className="rounded-full px-2 py-0.5 font-medium"
                      style={{
                        backgroundColor: `${campaign.tag.color}20`,
                        color: campaign.tag.color ?? "#6366f1",
                      }}
                    >
                      {campaign.tag.name}
                    </span>
                  )}
                  <span>
                    {campaign.sentCount || 0} enviados
                  </span>
                  {(campaign.failedCount || 0) > 0 && (
                    <span className="text-destructive">
                      {campaign.failedCount} fallidos
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium ${statusColors[campaign.status] || ""}`}
              >
                {statusLabels[campaign.status] || campaign.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(campaign.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
