import {
  Bell,
  ChartColumn,
  FileText,
  FileUser,
  History,
  House,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon } from "@/lib/navigation";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  home: House,
  dashboard: LayoutDashboard,
  expenses: Receipt,
  invoices: FileText,
  treasury: Wallet,
  reports: ChartColumn,
  staff: Users,
  payslips: FileUser,
  history: History,
  notifications: Bell,
  settings: Settings,
};
