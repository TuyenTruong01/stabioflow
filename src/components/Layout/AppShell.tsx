import { Header } from "@/components/Header/Header";
import { WalletProvider } from "@/components/Wallet/WalletProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <WalletProvider><div className="app-shell"><div className="shell"><Header /><main>{children}</main></div><footer className="site-footer"><div className="site-footer-inner"><nav className="footer-links" aria-label="Footer navigation"><a href="/help">About</a><a href="https://docs.arc.io" target="_blank" rel="noreferrer">Arc Docs</a><a href="https://docs.arc.io/app-kit" target="_blank" rel="noreferrer">App Kit Docs</a><a className="footer-x-link" href="https://x.com/StabioFlow" target="_blank" rel="noopener noreferrer" aria-label="Stabio Flow on X" title="Stabio Flow on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 15.6 6.4 22H3.3l7.3-8.4L2.9 2h6.3l4.4 5.8L18.9 2Zm-1.1 18h1.7L8.3 3.9H6.5L17.8 20Z" /></svg></a></nav><div className="site-footer-bottom">© 2026 Stabio Flow</div></div></footer></div></WalletProvider>;
}
