import { requireSupabase } from "@/lib/supabase";
import type { Staff, StaffFilters, StaffFormValues } from "@/types/staff";
import type { Paginated } from "@/types/common";

type DbStaff = {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  other_names: string | null;
  date_of_birth: string;
  gender: "male" | "female";
  phone: string;
  email: string;
  address: string;
  category: "teaching" | "non_teaching";
  department: string | null;
  job_title: string;
  employment_status: "full_time" | "part_time" | "contract";
  date_hired: string;
  qualification: string | null;
  photo_url: string | null;
  account_status: "active" | "inactive" | "suspended" | "archived";
  created_at: string;
  updated_at: string;
};

function toDomain(row: DbStaff): Staff {
  return {
    id: row.id,
    staffId: row.staff_id,
    firstName: row.first_name,
    lastName: row.last_name,
    otherNames: row.other_names ?? undefined,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    category: row.category,
    department: row.department ?? undefined,
    jobTitle: row.job_title,
    employmentStatus: row.employment_status,
    dateHired: row.date_hired,
    qualification: row.qualification ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    systemRole: null, // fetched via a join on profiles when needed
    accountStatus:
      row.account_status === "suspended" ? "inactive" : row.account_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const staffService = {
  async list(
    filters: StaffFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Staff>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("staff")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(
        `first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q},job_title.ilike.${q},staff_id.ilike.${q}`,
      );
    }
    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }
    if (filters.employmentStatus && filters.employmentStatus !== "all") {
      query = query.eq("employment_status", filters.employmentStatus);
    }
    if (filters.accountStatus && filters.accountStatus !== "all") {
      query = query.eq("account_status", filters.accountStatus);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbStaff[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Staff | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomain(data as unknown as DbStaff);
  },

  async create(values: StaffFormValues): Promise<Staff> {
    const supabase = requireSupabase();

    // Generate a staff ID
    const { count } = await supabase
      .from("staff")
      .select("*", { count: "exact", head: true });
    const next = (count ?? 0) + 1;
    const staffId = `SA-STF-${String(next).padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("staff")
      .insert({
        staff_id: staffId,
        first_name: values.firstName,
        last_name: values.lastName,
        other_names: values.otherNames ?? null,
        date_of_birth: values.dateOfBirth,
        gender: values.gender,
        phone: values.phone,
        email: values.email,
        address: values.address,
        category: values.category,
        department: values.department ?? null,
        job_title: values.jobTitle,
        employment_status: values.employmentStatus,
        date_hired: values.dateHired,
        qualification: values.qualification ?? null,
        account_status: values.accountStatus,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbStaff);
  },

  async update(id: string, values: StaffFormValues): Promise<Staff> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("staff")
      .update({
        first_name: values.firstName,
        last_name: values.lastName,
        other_names: values.otherNames ?? null,
        date_of_birth: values.dateOfBirth,
        gender: values.gender,
        phone: values.phone,
        email: values.email,
        address: values.address,
        category: values.category,
        department: values.department ?? null,
        job_title: values.jobTitle,
        employment_status: values.employmentStatus,
        date_hired: values.dateHired,
        qualification: values.qualification ?? null,
        account_status: values.accountStatus,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbStaff);
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
