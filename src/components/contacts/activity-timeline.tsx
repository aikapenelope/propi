import {
  Mail,
  Calendar,
  ArrowRight,
  Share2,
  StickyNote,
  UserPlus,
  CheckSquare,
  FileText,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  email_sent: <Mail className="h-3.5 w-3.5 text-amber-400" />,
  appointment_created: <Calendar className="h-3.5 w-3.5 text-blue-400" />,
  appointment_completed: <Calendar className="h-3.5 w-3.5 text-green-400" />,
  pipeline_moved: <ArrowRight className="h-3.5 w-3.5 text-purple-400" />,
  property_shared: <Share2 className="h-3.5 w-3.5 text-pink-400" />,
  note_added: <StickyNote className="h-3.5 w-3.5 text-yellow-400" />,
  contact_created: <UserPlus className="h-3.5 w-3.5 text-green-400" />,
  task_created: <CheckSquare className="h-3.5 w-3.5 text-blue-400" />,
  document_uploaded: <FileText className="h-3.5 w-3.5 text-orange-400" />,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(date).toLocaleDateString("es", { day: "numeric", month: "short" });
}

interface Activity {
  id: string;
  type: string;
  title: string;
  metadata: string | null;
  createdAt: Date;
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay actividad registrada
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-3 py-2">
          {/* Dot with icon */}
          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-border">
            {typeIcons[activity.type] ?? typeIcons.contact_created}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm text-foreground truncate">
              {activity.title}
            </p>
            {activity.metadata && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {activity.metadata}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {timeAgo(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
