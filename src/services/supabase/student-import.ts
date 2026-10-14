import { requireSupabase } from "@/lib/supabase";

export type ImportRow = {
  rowNumber: number; // 1-based, excluding header
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string;
  gender: "male" | "female";
  nationality: string;
  division: "nursery" | "kg" | "primary" | "jhs";
  className: string;
  academicYear: string;
  admissionDate: string;
  address: string;
  previousSchool?: string;
  guardian: {
    fullName: string;
    relationship: "mother" | "father" | "guardian";
    phone: string;
    email?: string;
    address: string;
    isEmergencyContact: boolean;
  };
};

export type ValidatedRow = {
  raw: ImportRow;
  errors: string[];
  className?: string; // resolved
};

export type ImportResult = {
  imported: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
  createdStudentIds: string[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const studentImportService = {
  /**
   * Validate every row against the current database.
   * Returns per-row errors before we attempt any write.
   */
  async validate(rows: Array<Record<string, string>>): Promise<ValidatedRow[]> {
    const supabase = requireSupabase();

    // Preload classes so we can resolve class_name → id
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name");
    const classMap = new Map<string, string>();
    for (const c of (classesData ?? []) as Array<{
      id: string;
      name: string;
    }>) {
      classMap.set(c.name.toLowerCase().trim(), c.id);
    }

    return rows.map((row, i) => {
      const rowNumber = i + 1;
      const errors: string[] = [];

      const firstName = (row.first_name ?? "").trim();
      const lastName = (row.last_name ?? "").trim();
      const otherNames = (row.other_names ?? "").trim();
      const dateOfBirth = (row.date_of_birth ?? "").trim();
      const gender = (row.gender ?? "").trim().toLowerCase();
      const nationality = (row.nationality ?? "Ghanaian").trim() || "Ghanaian";
      const division = (row.division ?? "").trim().toLowerCase();
      const className = (row.class_name ?? "").trim();
      const academicYear = (row.academic_year ?? "").trim();
      const admissionDate = (row.admission_date ?? "").trim();
      const address = (row.address ?? "").trim();
      const previousSchool = (row.previous_school ?? "").trim();

      const guardianName = (row.guardian_name ?? "").trim();
      const guardianRelationship = (row.guardian_relationship ?? "")
        .trim()
        .toLowerCase();
      const guardianPhone = (row.guardian_phone ?? "").trim();
      const guardianEmail = (row.guardian_email ?? "").trim();
      const guardianAddress = (row.guardian_address ?? "").trim();
      const guardianIsEmergencyRaw = (row.guardian_is_emergency ?? "true")
        .trim()
        .toLowerCase();

      if (!firstName) errors.push("first_name is required");
      if (!lastName) errors.push("last_name is required");
      if (!dateOfBirth) errors.push("date_of_birth is required");
      else if (!ISO_DATE.test(dateOfBirth))
        errors.push("date_of_birth must be YYYY-MM-DD");

      if (!["male", "female"].includes(gender))
        errors.push("gender must be 'male' or 'female'");

      if (!["nursery", "kg", "primary", "jhs"].includes(division))
        errors.push("division must be nursery / kg / primary / jhs");

      if (!className) errors.push("class_name is required");
      if (!academicYear) errors.push("academic_year is required");
      if (!admissionDate) errors.push("admission_date is required");
      else if (!ISO_DATE.test(admissionDate))
        errors.push("admission_date must be YYYY-MM-DD");

      if (!address) errors.push("address is required");

      if (!guardianName) errors.push("guardian_name is required");
      if (!["mother", "father", "guardian"].includes(guardianRelationship))
        errors.push("guardian_relationship must be mother / father / guardian");
      if (!guardianPhone) errors.push("guardian_phone is required");
      if (!guardianAddress) errors.push("guardian_address is required");

      const resolvedClassId = classMap.get(className.toLowerCase());
      if (className && !resolvedClassId) {
        errors.push(`class_name "${className}" not found`);
      }

      const importRow: ImportRow = {
        rowNumber,
        firstName,
        lastName,
        otherNames: otherNames || undefined,
        dateOfBirth,
        gender: gender as "male" | "female",
        nationality,
        division: division as ImportRow["division"],
        className,
        academicYear,
        admissionDate,
        address,
        previousSchool: previousSchool || undefined,
        guardian: {
          fullName: guardianName,
          relationship:
            guardianRelationship as ImportRow["guardian"]["relationship"],
          phone: guardianPhone,
          email: guardianEmail || undefined,
          address: guardianAddress,
          isEmergencyContact: guardianIsEmergencyRaw !== "false",
        },
      };

      return {
        raw: importRow,
        errors,
        className: resolvedClassId ? className : undefined,
      };
    });
  },

  /**
   * Import every valid row. Skips rows with errors.
   * Uses a per-row transaction so partial failures don't poison the batch.
   */
  async importRows(rows: ValidatedRow[]): Promise<ImportResult> {
    const supabase = requireSupabase();
    const result: ImportResult = {
      imported: 0,
      failed: 0,
      errors: [],
      createdStudentIds: [],
    };

    // Preload class map again (should be cheap)
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name");
    const classMap = new Map<string, string>();
    for (const c of (classesData ?? []) as Array<{
      id: string;
      name: string;
    }>) {
      classMap.set(c.name.toLowerCase().trim(), c.id);
    }

    for (const row of rows) {
      if (row.errors.length > 0) continue; // caller handles the skip count

      const { raw } = row;
      const classId = classMap.get(raw.className.toLowerCase());

      try {
        // 1. Generate admission number
        const { data: numberData, error: numberError } = await supabase.rpc(
          "next_admission_number",
        );
        if (numberError || !numberData) {
          throw new Error(
            numberError?.message ?? "Could not generate admission number",
          );
        }
        const admissionNumber = numberData as string;

        // 2. Insert student
        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert({
            admission_number: admissionNumber,
            first_name: raw.firstName,
            last_name: raw.lastName,
            other_names: raw.otherNames ?? null,
            date_of_birth: raw.dateOfBirth,
            gender: raw.gender,
            nationality: raw.nationality,
            division: raw.division,
            class_id: classId ?? null,
            academic_year: raw.academicYear,
            admission_date: raw.admissionDate,
            address: raw.address,
            previous_school: raw.previousSchool ?? null,
            status: "active",
          })
          .select("id")
          .single();

        if (studentError || !student) {
          throw new Error(studentError?.message ?? "Could not insert student");
        }

        // 3. Insert guardian
        const { error: guardianError } = await supabase
          .from("guardians")
          .insert({
            student_id: student.id,
            full_name: raw.guardian.fullName,
            relationship: raw.guardian.relationship,
            phone: raw.guardian.phone,
            email: raw.guardian.email ?? null,
            address: raw.guardian.address,
            is_emergency_contact: raw.guardian.isEmergencyContact,
          });

        if (guardianError) {
          // Roll back the student on guardian failure
          await supabase.from("students").delete().eq("id", student.id);
          throw new Error(guardianError.message);
        }

        result.imported++;
        result.createdStudentIds.push(student.id);
      } catch (e) {
        result.failed++;
        result.errors.push({
          row: raw.rowNumber,
          reason: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return result;
  },
};
