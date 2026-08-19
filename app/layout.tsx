import type { Metadata } from "next";
import "./globals.css";
import "./conversion.css";

export const metadata: Metadata = {
  title: "Mabrig Academic Assistance",
  description: "Academic assistance, document processing, Word conversion, printing and campus delivery.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
