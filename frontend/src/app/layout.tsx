import { SidebarProvider } from "@/components/ui/sidebar";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata = {
  title: "BATS - Browser Agent Testing Suite",
  description:
    "Generate realistic websites to test your browser agents with configurable difficulty and scenarios",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦇</text></svg>",
    shortcut:
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦇</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* Global gradient background to match landing page */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#0d1b2a] via-[#0f2742] to-[#1b1f3a]" />
        <SidebarProvider className="flex min-h-screen flex-col">
          <AppSidebar />
          <main>
            <div className="flex min-h-screen flex-col">{children}</div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
