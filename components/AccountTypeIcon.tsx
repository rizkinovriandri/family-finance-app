import type { AccountType } from "@/lib/types/database";
import {
  BankIcon,
  TrendUpIcon,
  WalletIcon,
  CashIcon,
  CreditCardIcon,
  MinusCircleIcon,
  FolderIcon,
} from "@/components/icons";

const STYLE_BY_TYPE: Record<
  AccountType,
  { Icon: typeof BankIcon; bg: string; color: string }
> = {
  Tabungan: { Icon: BankIcon, bg: "#0B2A4A", color: "#4FA0F0" },
  Giro: { Icon: BankIcon, bg: "#0B2A4A", color: "#4FA0F0" },
  Deposito: { Icon: BankIcon, bg: "#0B2A4A", color: "#4FA0F0" },
  "Investasi Saham": { Icon: TrendUpIcon, bg: "#12332E", color: "#3ECFAE" },
  "Investasi Reksadana": { Icon: TrendUpIcon, bg: "#12332E", color: "#3ECFAE" },
  "Investasi Obligasi": { Icon: TrendUpIcon, bg: "#12332E", color: "#3ECFAE" },
  "Investasi Emas": { Icon: TrendUpIcon, bg: "#12332E", color: "#3ECFAE" },
  "Investasi Kripto": { Icon: TrendUpIcon, bg: "#12332E", color: "#3ECFAE" },
  "Dana Pensiun": { Icon: TrendUpIcon, bg: "#12332E", color: "#3ECFAE" },
  "E-Wallet": { Icon: WalletIcon, bg: "#222149", color: "#AC6FF0" },
  "Kas Tunai": { Icon: CashIcon, bg: "#0E3B2E", color: "#16D992" },
  "Kartu Kredit": { Icon: CreditCardIcon, bg: "#3A1620", color: "#F86673" },
  "Pinjaman/Utang": { Icon: MinusCircleIcon, bg: "#2E1F26", color: "#F0554F" },
  Lainnya: { Icon: FolderIcon, bg: "#1E2938", color: "#8896A8" },
};

export function AccountTypeIcon({
  accountType,
  className = "w-10 h-10",
}: {
  accountType: AccountType;
  className?: string;
}) {
  const style = STYLE_BY_TYPE[accountType];
  const Icon = style.Icon;

  return (
    <span
      className={`shrink-0 rounded-xl flex items-center justify-center ${className}`}
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      <Icon className="w-[45%] h-[45%]" />
    </span>
  );
}
