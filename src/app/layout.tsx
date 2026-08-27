import './globals.css';
import Navbar from '@/components/layout/Navbar';
import type { Metadata, Viewport } from 'next';
import { Kanit } from 'next/font/google';

const kanit = Kanit({ 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['thai', 'latin'],
  variable: '--font-kanit',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Logic E-Learning - ระบบเรียนรู้ตรรกศาสตร์ ปวช.',
  description: 'ระบบเรียนรู้ตรรกศาสตร์และคณิตศาสตร์คอมพิวเตอร์ สำหรับนักเรียนระดับประกาศนียบัตรวิชาชีพ (ปวช.)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${kanit.variable}`} suppressHydrationWarning>
      <body className="bg-background text-slate-800 antialiased min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}
