import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Furniture Video Engine',
  description: 'JSON-driven 3D furniture assembly and mechanism animation POC',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body suppressHydrationWarning>{children}</body></html>;
}
