import "./globals.css";
import Navbar from "@/components/Navbar";
import RouteTransition from "@/components/RouteTransition";

export const metadata = {
  title: "CommunitySafetyConnect",
  description: "Real-time safety infrastructure for communities, campuses, and businesses. Powered by Armstrong Pack Company."
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
