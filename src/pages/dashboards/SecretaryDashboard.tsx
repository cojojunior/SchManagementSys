import { GraduationCap, CreditCard, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export default function SecretaryDashboard() {
  return (
    <>
      <PageHeader title="Secretary" description="Records and finances" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Student records"
          value="312"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding fees"
          value="GH₵21,540"
          icon={<CreditCard className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Arrears (students)"
          value="47"
          icon={<AlertCircle className="h-5 w-5" />}
          tone="red"
        />
      </div>
    </>
  );
}
