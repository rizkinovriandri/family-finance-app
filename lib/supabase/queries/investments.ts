import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BondType,
  CouponFrequency,
  Database,
  FundType,
  GoldType,
  InvestmentCategory,
} from "@/lib/types/database";
import type { HoldingFormValues } from "@/lib/validation/investment";

type Client = SupabaseClient<Database>;
type HoldingRow = Database["public"]["Tables"]["investment_holdings"]["Row"];

export interface Holding {
  id: string;
  accountId: string;
  category: InvestmentCategory;
  name: string;
  platform: string | null;
  purchaseDate: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  notes: string | null;
  fundManager: string | null;
  fundType: FundType | null;
  issuer: string | null;
  bondType: BondType | null;
  couponRate: number | null;
  couponFrequency: CouponFrequency | null;
  maturityDate: string | null;
  tickerCode: string | null;
  goldType: GoldType | null;
  // Turunan, bukan disimpan di DB — konsisten dengan pola current_balance.
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

function mapHolding(h: HoldingRow): Holding {
  const costBasis = h.quantity * h.purchase_price;
  const currentValue = h.quantity * h.current_price;
  const gainLoss = currentValue - costBasis;
  return {
    id: h.id,
    accountId: h.account_id,
    category: h.category,
    name: h.name,
    platform: h.platform,
    purchaseDate: h.purchase_date,
    quantity: h.quantity,
    purchasePrice: h.purchase_price,
    currentPrice: h.current_price,
    notes: h.notes,
    fundManager: h.fund_manager,
    fundType: h.fund_type,
    issuer: h.issuer,
    bondType: h.bond_type,
    couponRate: h.coupon_rate,
    couponFrequency: h.coupon_frequency,
    maturityDate: h.maturity_date,
    tickerCode: h.ticker_code,
    goldType: h.gold_type,
    costBasis,
    currentValue,
    gainLoss,
    gainLossPercentage: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
  };
}

export async function listHoldingsForAccount(
  supabase: Client,
  accountId: string
): Promise<Holding[]> {
  const { data, error } = await supabase
    .from("investment_holdings")
    .select("*")
    .eq("account_id", accountId)
    .order("purchase_date", { ascending: false });
  if (error) throw error;
  return data.map(mapHolding);
}

// Total nilai portofolio (quantity x current_price) per akun investasi —
// dipakai di list Akun supaya nilainya konsisten dengan yang tampil di
// halaman Portofolio, bukan dari saldo transaksi kas (yang biasanya 0 untuk
// akun investasi karena nilainya memang dari holding, bukan transaksi).
export async function getPortfolioValueByAccount(
  supabase: Client,
  familyId: string
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("investment_holdings")
    .select("account_id, quantity, current_price")
    .eq("family_id", familyId);
  if (error) throw error;

  const valueByAccount = new Map<string, number>();
  for (const h of data) {
    const value = h.quantity * h.current_price;
    valueByAccount.set(h.account_id, (valueByAccount.get(h.account_id) ?? 0) + value);
  }
  return valueByAccount;
}

function toPayload(input: HoldingFormValues) {
  const base = {
    category: input.category,
    name: input.name,
    platform: input.platform || null,
    purchase_date: input.purchase_date,
    quantity: input.quantity,
    purchase_price: input.purchase_price,
    current_price: input.current_price,
    notes: input.notes || null,
    fund_manager: null as string | null,
    fund_type: null as FundType | null,
    issuer: null as string | null,
    bond_type: null as BondType | null,
    coupon_rate: null as number | null,
    coupon_frequency: null as CouponFrequency | null,
    maturity_date: null as string | null,
    ticker_code: null as string | null,
    gold_type: null as GoldType | null,
  };

  if (input.category === "reksadana") {
    base.fund_manager = input.fund_manager;
    base.fund_type = input.fund_type;
  } else if (input.category === "obligasi_sukuk") {
    base.issuer = input.issuer;
    base.bond_type = input.bond_type;
    base.coupon_rate = input.coupon_rate;
    base.coupon_frequency = input.coupon_frequency;
    base.maturity_date = input.maturity_date;
  } else if (input.category === "saham") {
    base.ticker_code = input.ticker_code;
  } else if (input.category === "emas") {
    base.gold_type = input.gold_type;
  }

  return base;
}

export async function createHolding(
  supabase: Client,
  familyId: string,
  accountId: string,
  input: HoldingFormValues
) {
  const { error } = await supabase
    .from("investment_holdings")
    .insert({ family_id: familyId, account_id: accountId, ...toPayload(input) });
  if (error) throw error;
}

export async function updateHolding(
  supabase: Client,
  holdingId: string,
  input: HoldingFormValues
) {
  const { error } = await supabase
    .from("investment_holdings")
    .update({ ...toPayload(input), updated_at: new Date().toISOString() })
    .eq("id", holdingId);
  if (error) throw error;
}

export async function deleteHolding(supabase: Client, holdingId: string) {
  const { error } = await supabase.from("investment_holdings").delete().eq("id", holdingId);
  if (error) throw error;
}

export async function updateHoldingCurrentPrice(
  supabase: Client,
  holdingId: string,
  currentPrice: number
) {
  const { error } = await supabase
    .from("investment_holdings")
    .update({ current_price: currentPrice, updated_at: new Date().toISOString() })
    .eq("id", holdingId);
  if (error) throw error;
}

export interface SahamHolding {
  id: string;
  tickerCode: string;
}

export async function listSahamHoldings(
  supabase: Client,
  familyId: string
): Promise<SahamHolding[]> {
  const { data, error } = await supabase
    .from("investment_holdings")
    .select("id, ticker_code")
    .eq("family_id", familyId)
    .eq("category", "saham");
  if (error) throw error;
  return data
    .filter((h): h is { id: string; ticker_code: string } => !!h.ticker_code)
    .map((h) => ({ id: h.id, tickerCode: h.ticker_code }));
}
