import "./globals.css";
import Navbar from "@/components/Navbar";
import RouteTransition from "@/components/RouteTransition";

export const metadata = {
  title: "CommunitySafeConnect",
  description: "Powered by ArmPack Company"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-shell">
          <Navbar />
          <RouteTransition>{children}</RouteTransition>
        </div>
      </body>
    </html>
  );
}
