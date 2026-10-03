import type { Metadata } from "next";
import "./globals.css";
import "./background.css";
import "./mobile.css";
import "./move.css";
import "./wallet.css";
import "./wallet-picker.css";
import "./wallet-pending.css";
import "./move-direction.css";
import "./move-ux.css";
import "./move-notice.css";
import "./move-polish.css";
import "./swap.css";
import "./swap-ux.css";
import "./earn.css";
import "./earn-actions.css";
import "./earn-panel.css";
import "./header-nav.css";
import "./wallet-layout.css";
import "./assets.css";
import "./about.css";
import "./footer.css";
import "./automate.css";
import "./flows.css";
import "./flows-back-link.css";
import "./amount-allocation.css";
import "./buttons.css";
import "./flows-overview.css";
import { AppShell } from "@/components/Layout/AppShell";

export const metadata: Metadata = { title: "Stabio Flow", description: "Move. Earn. Swap. Flows." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
