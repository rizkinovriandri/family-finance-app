// Tipe database — mengikuti skema di supabase/migrations/.
// TODO: ganti dengan hasil generate asli setelah project Supabase aktif:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts

export type AccountType =
  | "Tabungan"
  | "Giro"
  | "Deposito"
  | "Investasi Saham"
  | "Investasi Reksadana"
  | "Investasi Obligasi"
  | "Investasi Emas"
  | "Investasi Kripto"
  | "Dana Pensiun"
  | "E-Wallet"
  | "Kas Tunai"
  | "Kartu Kredit"
  | "Pinjaman/Utang"
  | "Lainnya";

export type AccountStatus = "Aktif" | "Nonaktif" | "Ditutup";

export type CurrencyCode = "IDR" | "USD" | "SGD" | "EUR" | "JPY";

export type TransactionType = "Pemasukan" | "Pengeluaran" | "Transfer Antar Akun";

export type PaymentMethod =
  | "Tunai"
  | "Transfer Bank"
  | "Kartu Debit"
  | "Kartu Kredit"
  | "E-Wallet"
  | "Autodebet"
  | "Qris"
  | "Lainnya";

export type CategoryType = "income" | "expense" | "transfer";

export type InvestmentCategory = "reksadana" | "obligasi_sukuk" | "saham" | "emas";

export type FundType = "Pasar Uang" | "Pendapatan Tetap" | "Campuran" | "Saham" | "Indeks";

export type BondType = "Obligasi Pemerintah" | "Obligasi Korporasi" | "Sukuk Ritel";

export type CouponFrequency = "Bulanan" | "Triwulanan" | "Semesteran" | "Tahunan";

export type GoldType = "Fisik/Batangan" | "Digital/Tabungan Emas";

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          month_start_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          month_start_day?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          month_start_day?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          display_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: CategoryType;
          is_default: boolean;
          family_id: string | null;
          icon: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: CategoryType;
          is_default?: boolean;
          family_id?: string | null;
          icon?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: CategoryType;
          is_default?: boolean;
          family_id?: string | null;
          icon?: string | null;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          account_type: AccountType;
          institution: string | null;
          account_identifier: string | null;
          owner_member_id: string | null;
          currency: CurrencyCode;
          opening_balance: number;
          status: AccountStatus;
          priority_goal: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          account_type: AccountType;
          institution?: string | null;
          account_identifier?: string | null;
          owner_member_id?: string | null;
          currency?: CurrencyCode;
          opening_balance?: number;
          status?: AccountStatus;
          priority_goal?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          family_id: string;
          date: string;
          type: TransactionType;
          category_id: string;
          account_id: string;
          description: string | null;
          amount: number;
          family_member_id: string;
          payment_method: PaymentMethod;
          notes: string | null;
          transfer_pair_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          date: string;
          type: TransactionType;
          category_id: string;
          account_id: string;
          description?: string | null;
          amount: number;
          family_member_id: string;
          payment_method: PaymentMethod;
          notes?: string | null;
          transfer_pair_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          family_id: string;
          month: string;
          category_id: string;
          target_amount: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          month: string;
          category_id: string;
          target_amount: number;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [];
      };
      investment_holdings: {
        Row: {
          id: string;
          family_id: string;
          account_id: string;
          category: InvestmentCategory;
          name: string;
          platform: string | null;
          purchase_date: string;
          quantity: number;
          purchase_price: number;
          current_price: number;
          notes: string | null;
          fund_manager: string | null;
          fund_type: FundType | null;
          issuer: string | null;
          bond_type: BondType | null;
          coupon_rate: number | null;
          coupon_frequency: CouponFrequency | null;
          maturity_date: string | null;
          ticker_code: string | null;
          gold_type: GoldType | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          account_id: string;
          category: InvestmentCategory;
          name: string;
          platform?: string | null;
          purchase_date: string;
          quantity: number;
          purchase_price: number;
          current_price: number;
          notes?: string | null;
          fund_manager?: string | null;
          fund_type?: FundType | null;
          issuer?: string | null;
          bond_type?: BondType | null;
          coupon_rate?: number | null;
          coupon_frequency?: CouponFrequency | null;
          maturity_date?: string | null;
          ticker_code?: string | null;
          gold_type?: GoldType | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investment_holdings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      account_balances: {
        Row: { account_id: string; family_id: string; current_balance: number };
        Relationships: [];
      };
      budget_realizations: {
        Row: {
          budget_id: string;
          family_id: string;
          month: string;
          category_id: string;
          target_amount: number;
          realisasi: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      join_family_by_invite_code: {
        Args: { p_code: string; p_display_name: string };
        Returns: { family_id: string; family_name: string }[];
      };
    };
  };
}
