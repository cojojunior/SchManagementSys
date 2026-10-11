import { ClipboardList, CheckCircle2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export default function HeadmasterDashboard() {
  return (
    <>
      <PageHeader title="Headmaster" description="Review and publish results" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Awaiting review"
          value="14"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Published this term"
          value="22"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Students"
          value="312"
          icon={<Users className="h-5 w-5" />}
        />
      </div>
    </>
  );
}
