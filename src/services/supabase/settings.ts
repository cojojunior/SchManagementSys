import { requireSupabase } from "@/lib/supabase";

export type SchoolSettings = {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  scratchCardPriceNursery: number;
  scratchCardPriceKg: number;
  scratchCardPricePrimary: number;
  scratchCardPriceJhs: number;
  scratchCardMaxUses: number;
  revenueSplitSchoolPercent: number;
  revenueSplitPartnerPercent: number;
  revenueSplitPartnerName?: string;
};

type DbSettings = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  scratch_card_price_nursery: number;
  scratch_card_price_kg: number;
  scratch_card_price_primary: number;
  scratch_card_price_jhs: number;
  scratch_card_max_uses: number;
  revenue_split_school_percent: number;
  revenue_split_partner_percent: number;
  revenue_split_partner_name: string | null;
};

function toDomain(row: DbSettings): SchoolSettings {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    currencyCode: row.currency_code,
    currencySymbol: row.currency_symbol,
    timezone: row.timezone,
    scratchCardPriceNursery: Number(row.scratch_card_price_nursery),
    scratchCardPriceKg: Number(row.scratch_card_price_kg),
    scratchCardPricePrimary: Number(row.scratch_card_price_primary),
    scratchCardPriceJhs: Number(row.scratch_card_price_jhs),
    scratchCardMaxUses: row.scratch_card_max_uses,
    revenueSplitSchoolPercent: row.revenue_split_school_percent,
    revenueSplitPartnerPercent: row.revenue_split_partner_percent,
    revenueSplitPartnerName: row.revenue_split_partner_name ?? undefined,
  };
}

export const settingsService = {
  async get(): Promise<SchoolSettings> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("school_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbSettings);
  },

  async update(values: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("school_settings")
      .update({
        ...(values.name !== undefined && { name: values.name }),
        ...(values.address !== undefined && { address: values.address }),
        ...(values.phone !== undefined && { phone: values.phone }),
        ...(values.email !== undefined && { email: values.email }),
        ...(values.logoUrl !== undefined && { logo_url: values.logoUrl }),
        ...(values.currencyCode !== undefined && {
          currency_code: values.currencyCode,
        }),
        ...(values.currencySymbol !== undefined && {
          currency_symbol: values.currencySymbol,
        }),
        ...(values.timezone !== undefined && { timezone: values.timezone }),
        ...(values.scratchCardPriceNursery !== undefined && {
          scratch_card_price_nursery: values.scratchCardPriceNursery,
        }),
        ...(values.scratchCardPriceKg !== undefined && {
          scratch_card_price_kg: values.scratchCardPriceKg,
        }),
        ...(values.scratchCardPricePrimary !== undefined && {
          scratch_card_price_primary: values.scratchCardPricePrimary,
        }),
        ...(values.scratchCardPriceJhs !== undefined && {
          scratch_card_price_jhs: values.scratchCardPriceJhs,
        }),
        ...(values.scratchCardMaxUses !== undefined && {
          scratch_card_max_uses: values.scratchCardMaxUses,
        }),
        ...(values.revenueSplitSchoolPercent !== undefined && {
          revenue_split_school_percent: values.revenueSplitSchoolPercent,
        }),
        ...(values.revenueSplitPartnerPercent !== undefined && {
          revenue_split_partner_percent: values.revenueSplitPartnerPercent,
        }),
        ...(values.revenueSplitPartnerName !== undefined && {
          revenue_split_partner_name: values.revenueSplitPartnerName,
        }),
      })
      .eq("id", 1)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbSettings);
  },
};
