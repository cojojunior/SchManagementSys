import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ScrollText } from "lucide-react";
import type { DashboardSummary } from "@/services/supabase/dashboard";

const ACTION_LABELS: Record<string, string> = {
  provision_user: "Staff account created",
  activate_student: "Student activated",
  generate_scratch_cards: "Scratch cards generated",
  published: "Results published",
  approved: "Results approved",
  locked: "Results locked",
  submitted: "Results submitted",
  returned: "Results returned for correction",
  set_student_pin: "Student PIN set",
};

const ENTITY_LABELS: Record<string, string> = {
  profiles: "user",
  students: "student",
  scratch_cards: "scratch card",
  scores: "score",
};

function describe(action: string, entity: string): string {
  const a = ACTION_LABELS[action] ?? action.replace(/_/g, " ");
  const e = ENTITY_LABELS[entity] ?? entity;
  return `${a} (${e})`;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function RecentActivity({ summary }: { summary: DashboardSummary }) {
  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-brand-600" />
            <span>Recent Activity</span>
          </div>
        }
      />
      <CardBody className="p-0">
        {summary.recentActivity.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-500">
            No activity recorded yet.
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {summary.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-ink-900">
                    {describe(entry.action, entry.entity)}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {entry.actorName}
                  </div>
                </div>
                <div className="text-xs text-ink-500 shrink-0">
                  {timeAgo(entry.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
