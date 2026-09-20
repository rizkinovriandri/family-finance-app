import {
  IconBell,
  IconBuildingBank,
  IconBulb,
  IconCalendar,
  IconCamera,
  IconCash,
  IconChevronLeft,
  IconChevronRight,
  IconCircleMinus,
  IconCopy,
  IconCreditCard,
  IconChartLine,
  IconEye,
  IconEyeOff,
  IconFolder,
  IconHome,
  IconInfoCircle,
  IconLayoutGrid,
  IconLock,
  IconLogout,
  IconMail,
  IconPencil,
  IconSettings,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconTrendingUp,
  IconUser,
  IconWallet,
  type IconProps,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

// Ikon UI umum (navigasi, tombol, form, dsb.) — dibungkus tipis di atas Tabler
// Icons supaya tetap satu titik impor (`@/components/icons`) untuk semua
// pemakai, tanpa perlu ubah tiap komponen saat ganti icon pack.
function tabler(Icon: ComponentType<IconProps>): ComponentType<{ className?: string }> {
  return ({ className }) => <Icon className={className} stroke={1.75} />;
}

export const WalletIcon = tabler(IconWallet);
export const HomeIcon = tabler(IconHome);
export const LineChartIcon = tabler(IconChartLine);
export const GridIcon = tabler(IconLayoutGrid);
export const BankIcon = tabler(IconBuildingBank);
export const TrendUpIcon = tabler(IconTrendingUp);
export const CashIcon = tabler(IconCash);
export const CreditCardIcon = tabler(IconCreditCard);
export const MinusCircleIcon = tabler(IconCircleMinus);
export const FolderIcon = tabler(IconFolder);
export const UserIcon = tabler(IconUser);
export const GearIcon = tabler(IconSettings);
export const BellIcon = tabler(IconBell);
export const LightbulbIcon = tabler(IconBulb);
export const ChevronRightIcon = tabler(IconChevronRight);
export const CopyIcon = tabler(IconCopy);
export const ChevronLeftIcon = tabler(IconChevronLeft);
export const MailIcon = tabler(IconMail);
export const LockIcon = tabler(IconLock);
export const LogOutIcon = tabler(IconLogout);
export const InfoIcon = tabler(IconInfoCircle);
export const PencilIcon = tabler(IconPencil);
export const CameraIcon = tabler(IconCamera);
export const TrashIcon = tabler(IconTrash);
export const CalendarIcon = tabler(IconCalendar);
export const StarIcon = tabler(IconStar);
export const StarFilledIcon = tabler(IconStarFilled);

export function EyeIcon({ className, off }: { className?: string; off?: boolean }) {
  const Icon = off ? IconEyeOff : IconEye;
  return <Icon className={className} stroke={1.75} />;
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.96-2.92l-3.88-3c-1.08.72-2.46 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.26v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.75l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4 3.1c.95-2.85 3.61-4.98 6.74-4.98Z"
      />
    </svg>
  );
}

export function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.36 1c.12 1.06-.32 2.1-.94 2.86-.64.78-1.7 1.4-2.72 1.32-.14-1.02.36-2.1.96-2.8.66-.78 1.8-1.36 2.7-1.38Zm2.66 16.8c-.5 1.14-.74 1.65-1.38 2.66-.9 1.4-2.16 3.14-3.72 3.16-1.38.02-1.74-.9-3.6-.9-1.86 0-2.28.88-3.6.92-1.5.04-2.64-1.5-3.54-2.9C1.3 17.9.5 13.3 2.32 10.2c.9-1.54 2.5-2.52 4.24-2.54 1.44-.03 2.8.98 3.6.98.8 0 2.44-1.21 4.12-1.03.7.03 2.66.28 3.92 2.13-.1.06-2.34 1.37-2.32 4.08.03 3.24 2.84 4.32 2.86 4.33-.02.07-.44 1.53-1.72 3.65Z" />
    </svg>
  );
}
