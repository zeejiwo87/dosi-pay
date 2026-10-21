
import type { ReactNode } from "react";
import WaliNavigationShell from "./components/WaliNavigationShell";

export default function WaliLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <WaliNavigationShell>
      {children}
    </WaliNavigationShell>
  );
}
