import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Funding Radar',
  description: 'Government funding opportunity matching platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
