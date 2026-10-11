import { requireSupabase } from "@/lib/supabase";

export type ActivationResult = { ok: true } | { ok: false; reason: string };

export type StudentLoginResult =
  | { ok: true; studentId: string; fullName: string }
  | { ok: false; reason: string };

type ActivateResponse = {
  ok: boolean;
  reason?: string;
  studentId?: string;
  email?: string;
  password?: string;
  fullName?: string;
};

type VerifyResponse = {
  ok: boolean;
  reason?: string;
  studentId?: string;
  proof?: string;
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
   * Full activation flow: verify + create user + set PIN, all in one call.
   * Signs the student in on success.
   */
  async activate(
    admissionNumber: string,
    dateOfBirth: string,
    pin: string,
  ): Promise<ActivationResult> {
    const supabase = requireSupabase();

    const { data, error } = await supabase.functions.invoke<ActivateResponse>(
      "activate-and-mint-student",
      {
        body: { admissionNumber, dateOfBirth, pin },
      },
    );

    if (error) {
      return { ok: false, reason: error.message };
    }
    if (!data?.ok) {
      return { ok: false, reason: data?.reason ?? "Activation failed" };
    }

    // Sign in with the minted credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email!,
      password: data.password!,
    });

    if (signInError) {
      return { ok: false, reason: signInError.message };
    }

    return { ok: true };
  },

  /**
   * Sign in: admission + PIN. The Edge Function verifies the PIN and returns
   * a short-lived proof; we then exchange it for a real session.
   */
  async login(
    admissionNumber: string,
    pin: string,
  ): Promise<StudentLoginResult> {
    const supabase = requireSupabase();

    const { data, error } = await supabase.functions.invoke<VerifyResponse>(
      "verify-student-pin",
      { body: { admissionNumber, pin } },
    );

    if (error) return { ok: false, reason: error.message };
    if (!data?.ok || !data.studentId || !data.proof) {
      return { ok: false, reason: data?.reason ?? "Invalid credentials" };
    }

    const { data: minted, error: mintError } =
      await supabase.functions.invoke<MintResponse>("mint-student-session", {
        body: { studentId: data.studentId, proof: data.proof },
      });

    if (mintError || !minted?.ok) {
      return { ok: false, reason: minted?.reason ?? "Could not start session" };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: minted.email!,
      password: minted.password!,
    });

    if (signInError) return { ok: false, reason: signInError.message };

    return {
      ok: true,
      studentId: data.studentId,
      fullName: minted.fullName ?? "",
    };
  },

  async signOut(): Promise<void> {
    const supabase = requireSupabase();
    await supabase.auth.signOut();
  },
};
