import { requireSupabase } from "@/lib/supabase";
import { pickOne } from "@/lib/pick-one";
import type {
  ScratchCard,
  ScratchCardFilters,
  ScratchCardFormValues,
  ScratchCardStatus,
  ScratchCardUsage,
} from "@/types/scratch-card";
import type { Paginated } from "@/types/common";

type Joined<T> = T | T[] | null;

type DbCard = {
  id: string;
  serial_number: string;
  pin_hash: string;
  pin_plain: string | null;
  pin_unique_key: string | null;
  masked_pin: string;
  division: "nursery" | "kg" | "primary" | "jhs";
  term_id: string;
  academic_year: string;
  price: number;
  status: ScratchCardStatus;
  uses_remaining: number;
  issued_to_student_id: string | null;
  issued_at: string | null;
  issued_by: string | null;
  invalidated_at: string | null;
  invalidated_reason: string | null;
  created_at: string;
  updated_at: string;
  terms?: Joined<{ name: string }>;
  students?: Joined<{ first_name: string; last_name: string }>;
  issuedByProfile?: Joined<{ full_name: string }>;
};

type DbUsage = {
  id: string;
  card_id: string;
  student_id: string;
  term_id: string;
  accessed_at: string;
  students?: Joined<{ first_name: string; last_name: string }>;
  terms?: Joined<{ name: string }>;
  scratch_cards?: Joined<{ serial_number: string }>;
};

const SELECT = `
  *,
  terms(name),
  students(first_name, last_name),
  issuedByProfile:profiles!scratch_cards_issued_by_fkey(full_name)
`;

function toDomain(row: DbCard): ScratchCard {
  const st = pickOne(row.students);
  const term = pickOne(row.terms);
  const issuer = pickOne(row.issuedByProfile);
  return {
    id: row.id,
    serialNumber: row.serial_number,
    pinHash: row.pin_hash,
    pinPlain: row.pin_plain ?? undefined,
    maskedPin: row.masked_pin,
    division: row.division,
    termId: row.term_id,
    termName: term?.name ?? "—",
    academicYear: row.academic_year,
    price: Number(row.price),
    status: row.status,
    usesRemaining: row.uses_remaining,
    issuedToStudentId: row.issued_to_student_id ?? undefined,
    issuedToStudentName: st ? `${st.first_name} ${st.last_name}` : undefined,
    issuedAt: row.issued_at ?? undefined,
    issuedBy: row.issued_by ?? undefined,
    issuedByName: issuer?.full_name ?? undefined,
    invalidatedAt: row.invalidated_at ?? undefined,
    invalidatedReason: row.invalidated_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const scratchCardsService = {
  async list(
    filters: ScratchCardFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<Paginated<ScratchCard>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("scratch_cards")
      .select(SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      query = query.ilike("serial_number", `%${filters.search}%`);
    }
    if (filters.division && filters.division !== "all") {
      query = query.eq("division", filters.division);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.termId && filters.termId !== "all") {
      query = query.eq("term_id", filters.termId);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbCard[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<ScratchCard | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scratch_cards")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbCard) : null;
  },

  /**
   * Summary: total cards, total value, broken down by division.
   */
  async summary(): Promise<{
    totalCards: number;
    totalValue: number;
    byDivision: Array<{ division: string; count: number; value: number }>;
  }> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scratch_cards")
      .select("division, price");
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{ division: string; price: number }>;
    const map = new Map<string, { count: number; value: number }>();
    let totalValue = 0;

    for (const r of rows) {
      const price = Number(r.price);
      totalValue += price;
      const cur = map.get(r.division) ?? { count: 0, value: 0 };
      cur.count += 1;
      cur.value += price;
      map.set(r.division, cur);
    }

    return {
      totalCards: rows.length,
      totalValue,
      byDivision: Array.from(map.entries())
        .map(([division, v]) => ({ division, ...v }))
        .sort((a, b) => a.division.localeCompare(b.division)),
    };
  },

  /**
   * Generate N cards via the Edge Function.
   * Returns the created cards. PIN == serial.
   */
  async generate(values: ScratchCardFormValues): Promise<ScratchCard[]> {
    const supabase = requireSupabase();

    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      reason?: string;
      cards?: Array<{
        id: string;
        serialNumber: string;
        pin: string;
        price: number;
      }>;
    }>("generate-scratch-cards", {
      body: {
        division: values.division,
        termId: values.termId,
        academicYear: values.academicYear,
        quantity: values.quantity,
        priceOverride: values.priceOverride,
      },
    });

    if (error) throw new Error(error.message);
    if (!data?.ok || !data.cards) {
      throw new Error(data?.reason ?? "Could not generate cards");
    }

    return data.cards.map((c) => ({
      id: c.id,
      serialNumber: c.serialNumber,
      pinHash: "",
      pinPlain: c.pin, // the 4-digit PIN
      maskedPin: "••••",
      division: values.division,
      termId: values.termId,
      termName: "—",
      academicYear: values.academicYear,
      price: c.price,
      status: "unused" as ScratchCardStatus,
      usesRemaining: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  },

  async issue(
    cardId: string,
    studentId: string,
    _issuedBy: string,
  ): Promise<ScratchCard> {
    const supabase = requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("scratch_cards")
      .update({
        issued_to_student_id: studentId,
        issued_at: new Date().toISOString(),
        issued_by: user?.id ?? null,
      })
      .eq("id", cardId);
    if (error) throw new Error(error.message);
    return (await this.get(cardId))!;
  },

  async invalidate(cardId: string, reason: string): Promise<ScratchCard> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("scratch_cards")
      .update({
        invalidated_at: new Date().toISOString(),
        invalidated_reason: reason,
        status: "invalidated",
      })
      .eq("id", cardId);
    if (error) throw new Error(error.message);
    return (await this.get(cardId))!;
  },

  /**
   * Delete a scratch card. Uses the `delete-scratch-card` Edge Function.
   * `hard: true` permanently removes it (Super Admin only).
   * `hard: false` (default) soft-invalidates it.
   */
  async remove(
    id: string,
    options: { hard?: boolean } = {},
  ): Promise<{ hardDeleted: boolean }> {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      reason?: string;
      hardDeleted?: boolean;
    }>("delete-scratch-card", {
      body: { cardId: id, hard: options.hard ?? false },
    });

    if (error) throw new Error(error.message);
    if (!data?.ok) {
      throw new Error(data?.reason ?? "Could not delete card");
    }
    return { hardDeleted: data.hardDeleted ?? false };
  },

  async listUsages(cardId: string): Promise<ScratchCardUsage[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scratch_card_usages")
      .select(
        "*, students(first_name, last_name), terms(name), scratch_cards(serial_number)",
      )
      .eq("card_id", cardId)
      .order("accessed_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data as unknown as DbUsage[]).map((u) => ({
      id: u.id,
      cardId: u.card_id,
      serialNumber: pickOne(u.scratch_cards)?.serial_number ?? "—",
      studentId: u.student_id,
      studentName: u.students
        ? `${pickOne(u.students)?.first_name} ${pickOne(u.students)?.last_name}`
        : "Unknown",
      termId: u.term_id,
      termName: pickOne(u.terms)?.name ?? "—",
      accessedAt: u.accessed_at,
    }));
  },

  async listAllUsages(): Promise<ScratchCardUsage[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scratch_card_usages")
      .select(
        "*, students(first_name, last_name), terms(name), scratch_cards(serial_number)",
      )
      .order("accessed_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data as unknown as DbUsage[]).map((u) => ({
      id: u.id,
      cardId: u.card_id,
      serialNumber: pickOne(u.scratch_cards)?.serial_number ?? "—",
      studentId: u.student_id,
      studentName: u.students
        ? `${pickOne(u.students)?.first_name} ${pickOne(u.students)?.last_name}`
        : "Unknown",
      termId: u.term_id,
      termName: pickOne(u.terms)?.name ?? "—",
      accessedAt: u.accessed_at,
    }));
  },

  async redeem(
    rawPin: string,
    studentId: string,
    termId: string,
  ): Promise<{ ok: boolean; usesRemaining?: number; reason?: string }> {
    const supabase = requireSupabase();

    const { data, error } = await supabase.rpc("redeem_scratch_card", {
      p_pin: rawPin,
      p_student_id: studentId,
      p_term_id: termId,
    });

    if (error) return { ok: false, reason: error.message };

    const result = data as {
      ok: boolean;
      uses_remaining?: number;
      reason?: string;
    };

    return {
      ok: result.ok,
      usesRemaining: result.uses_remaining,
      reason: result.reason,
    };
  },
};
