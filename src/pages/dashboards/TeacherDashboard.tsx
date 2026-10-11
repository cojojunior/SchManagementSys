import { BookOpen, ClipboardList, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export default function TeacherDashboard() {
  return (
    <>
      <PageHeader title="Teacher" description="Your classes and marks entry" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Assigned classes"
          value="4"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          label="Marks entry progress"
          value="62%"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Drafts pending"
          value="3"
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
      </div>
    </>
  );
}
