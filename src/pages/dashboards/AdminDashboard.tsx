import { Users, GraduationCap, CreditCard, Ticket } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Super Admin"
        description="Overview of Supreme Academy"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total students"
          value="312"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Active staff"
          value="28"
          icon={<Users className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Fees collected (term)"
          value="GH₵84,320"
          icon={<CreditCard className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Cards sold (term)"
          value="96"
          icon={<Ticket className="h-5 w-5" />}
          tone="amber"
        />
      </div>
    </>
  );
}
