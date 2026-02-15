import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SCA Institutional Platform',
  description: 'Secure AI Operations Infrastructure',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* CHANGE: let global depth system drive background */}
      <body className="min-h-screen w-screen text-slate-100">
        {children}
      </body>
    </html>
  );
}
