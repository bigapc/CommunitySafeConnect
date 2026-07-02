import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import RouteTransition from "@/components/RouteTransition";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex",
});

export const metadata = {
  title: "CommunitySafeConnect - Community Safety Operating System",
  description: "Next-generation real-time safety infrastructure with realtime mapping, incident command, and community coordination. Premium features for communities, campuses, and businesses."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <RouteTransition>{children}</RouteTransition>
          <footer className="border-t border-neutral-200 bg-white/90">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-neutral-600 sm:px-6 lg:px-8">
              <p>Powered by Armstrong Pack Company.</p>
              <p>Copyright {currentYear} Armstrong Pack Company. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
