import { requireSupabase } from "@/lib/supabase";

export type StudentLoginResult =
  | { ok: true; studentId: string; fullName: string }
  | { ok: false; reason: string; needsActivation?: boolean };

export type ActivationVerifyResult =
  | {
      ok: true;
      studentId: string;
      fullName: string;
      admissionNumber: string;
      proof: string;
    }
  | { ok: false; reason: string };

export type ActivationCompleteResult =
  { ok: true } | { ok: false; reason: string };

type VerifyLoginResponse = {
  ok: boolean;
  reason?: string;
  needs_activation?: boolean;
  studentId?: string;
  proof?: string;
  fullName?: string;
};

type VerifyActivationResponse = {
  ok: boolean;
  reason?: string;
  studentId?: string;
  fullName?: string;
  admissionNumber?: string;
  proof?: string;
};

type SetCodeResponse = {
  ok: boolean;
  reason?: string;
  email?: string;
  password?: string;
};

type MintResponse = {
  ok: boolean;
  reason?: string;
  email?: string;
  password?: string;
  fullName?: string;
};

export const studentAuthService = {
  /**
   * Student login: admission number + 4-digit code.
   * Signs the student in on success.
   */
  async login(
    admissionNumber: string,
    code: string,
  ): Promise<StudentLoginResult> {
    const supabase = requireSupabase();

    const { data, error } =
      await supabase.functions.invoke<VerifyLoginResponse>(
        "verify-student-login",
        {
          body: {
            admissionNumber: admissionNumber.trim().toUpperCase(),
            code,
          },
        },
      );

    if (error) return { ok: false, reason: error.message };
    if (!data?.ok) {
      return {
        ok: false,
        reason: data?.reason ?? "Invalid admission number or code.",
        needsActivation: data?.needs_activation,
      };
    }

    const { data: minted, error: mintError } =
      await supabase.functions.invoke<MintResponse>("mint-student-session", {
        body: { studentId: data.studentId, proof: data.proof },
      });

    if (mintError || !minted?.ok) {
      return {
        ok: false,
        reason: minted?.reason ?? "Could not start session.",
      };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: minted.email!,
      password: minted.password!,
    });

    if (signInError) return { ok: false, reason: signInError.message };

    return {
      ok: true,
      studentId: data.studentId!,
      fullName: data.fullName ?? "",
    };
  },

  /**
   * Activation step 1: verify admission number + date of birth.
   */
  async verifyActivation(
    admissionNumber: string,
    dateOfBirth: string,
  ): Promise<ActivationVerifyResult> {
    const supabase = requireSupabase();

    const { data, error } =
      await supabase.functions.invoke<VerifyActivationResponse>(
        "student-activate-verify",
        {
          body: {
            admissionNumber: admissionNumber.trim().toUpperCase(),
            dateOfBirth,
          },
        },
      );

    if (error) return { ok: false, reason: error.message };
    if (!data?.ok) {
      return { ok: false, reason: data?.reason ?? "Verification failed." };
    }

    return {
      ok: true,
      studentId: data.studentId!,
      fullName: data.fullName ?? "",
      admissionNumber: data.admissionNumber ?? admissionNumber,
      proof: data.proof!,
    };
  },

  /**
   * Activation step 2: set the 4-digit code.
   * Signs the student in on success.
   */
  async completeActivation(
    studentId: string,
    proof: string,
    code: string,
  ): Promise<ActivationCompleteResult> {
    const supabase = requireSupabase();

    const { data, error } = await supabase.functions.invoke<SetCodeResponse>(
      "student-activate-set-code",
      {
        body: { studentId, proof, code },
      },
    );

    if (error) return { ok: false, reason: error.message };
    if (!data?.ok) {
      return { ok: false, reason: data?.reason ?? "Could not set code." };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email!,
      password: data.password!,
    });

    if (signInError) return { ok: false, reason: signInError.message };

    return { ok: true };
  },

  async signOut(): Promise<void> {
    const supabase = requireSupabase();
    await supabase.auth.signOut();
  },
};
