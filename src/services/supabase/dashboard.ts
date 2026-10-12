import { requireSupabase } from "@/lib/supabase";
import { pickOne } from "@/lib/pick-one";


export type DashboardSummary = {
  // Counts
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  activeStaff: number;

  // Financial (current term)
  feesCollected: number;
  feesOutstanding: number;
  scratchCardsSold: number;

  // School config
  currentAcademicYear: string | null;
  currentTermName: string | null;
  currentTermId: string | null;
  academicYearsCount: number;

  assessmentPercent: number;
  examPercent: number;

  gradingScalesCount: number;
  gradingScalesSummary: Array<{ name: string; divisions: string[] }>;

  feeStructuresSummary: Array<{
    id: string;
    name: string;
    total: number;
    division: string;
  }>;
  feeStructuresCount: number;

  // Recent activity
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    actorName: string;
    createdAt: string;
  }>;
};

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const supabase = requireSupabase();

    // Fire independent queries in parallel
    const [
      studentsRes,
      staffRes,
      currentYearRes,
      academicYearsCountRes,
      weightsRes,
      scalesRes,
      feeStructuresRes,
      cardsRes,
      auditRes,
    ] = await Promise.all([
      supabase.from("students").select("id, status"),
      supabase.from("staff").select("id, account_status"),
      supabase
        .from("academic_years")
        .select("id, name")
        .eq("is_current", true)
        .maybeSingle(),
      supabase
        .from("academic_years")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("assessment_weights")
        .select("assessment_percent, exam_percent")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("grading_scales")
        .select("id, name, divisions, is_active")
        .eq("is_active", true),
      supabase
        .from("fee_structures")
        .select("id, name, total, division, status")
        .eq("status", "active")
        .order("division"),
      supabase
        .from("scratch_cards")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("audit_log")
        .select("id, action, entity, actor_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Students
    const students = (studentsRes.data ?? []) as Array<{
      id: string;
      status: string;
    }>;
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === "active").length;

    // Staff
    const staff = (staffRes.data ?? []) as Array<{
      id: string;
      account_status: string;
    }>;
    const totalStaff = staff.length;
    const activeStaff = staff.filter(
      (s) => s.account_status === "active",
    ).length;

    // Current academic year + term
    const currentYearId = currentYearRes.data?.id ?? null;
    let currentTermName: string | null = null;
    let currentTermId: string | null = null;

    if (currentYearId) {
      const { data: term } = await supabase
        .from("terms")
        .select("id, name")
        .eq("academic_year_id", currentYearId)
        .eq("is_current", true)
        .maybeSingle();
      if (term) {
        currentTermName = term.name;
        currentTermId = term.id;
      }
    }

    // Fees for current term
    let feesCollected = 0;
    let feesOutstanding = 0;
    if (currentTermId) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("paid, balance")
        .eq("term_id", currentTermId);
      for (const inv of (invoices ?? []) as Array<{
        paid: number;
        balance: number;
      }>) {
        feesCollected += Number(inv.paid);
        feesOutstanding += Number(inv.balance);
      }
    }

    // Assessment weights
    const weights = weightsRes.data as {
      assessment_percent: number;
      exam_percent: number;
    } | null;

    // Grading scales summary
    const scales = (scalesRes.data ?? []) as Array<{
      id: string;
      name: string;
      divisions: string[];
      is_active: boolean;
    }>;

    // Fee structures
    const feeStructures = (feeStructuresRes.data ?? []) as Array<{
      id: string;
      name: string;
      total: number;
      division: string;
    }>;

    // Recent activity
    const recent = (auditRes.data ?? []) as Array<{
      id: string;
      action: string;
      entity: string;
      actor_name: string | null;
      created_at: string;
    }>;

    return {
      totalStudents,
      activeStudents,
      totalStaff,
      activeStaff,
      feesCollected,
      feesOutstanding,
      scratchCardsSold: cardsRes.count ?? 0,
      currentAcademicYear: currentYearRes.data?.name ?? null,
      currentTermName,
      currentTermId,
      academicYearsCount: academicYearsCountRes.count ?? 0,
      assessmentPercent: weights?.assessment_percent ?? 40,
      examPercent: weights?.exam_percent ?? 60,
      gradingScalesCount: scales.length,
      gradingScalesSummary: scales.map((s) => ({
        name: s.name,
        divisions: s.divisions,
      })),
      feeStructuresSummary: feeStructures.map((f) => ({
        id: f.id,
        name: f.name,
        total: Number(f.total),
        division: f.division,
      })),
      feeStructuresCount: feeStructures.length,
      recentActivity: recent.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        actorName: pickOne(r.actor_name) ?? "System",
        createdAt: r.created_at,
      })),
    };
  },
};
