import { SidebarInset } from "@/components/ui/sidebar";

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
    <SidebarInset className="bg-transparent">
      <div className="flex min-h-screen flex-col text-white">{children}</div>
    </SidebarInset>
  );
}
