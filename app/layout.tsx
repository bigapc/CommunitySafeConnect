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
  return (
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <RouteTransition>{children}</RouteTransition>
        </div>
      </body>
    </html>
  );
}
