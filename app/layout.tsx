import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daftar Lamaran - Sekar Ayu Herdyningrum",
  description:
    "Kumpulan lamaran kerja Sekar Ayu Herdyningrum: 163 lowongan via email dan portal, lengkap dengan draft cover letter siap kirim.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F4E78",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
