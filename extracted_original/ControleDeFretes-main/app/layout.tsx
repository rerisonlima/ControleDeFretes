import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rápido Carioca - Logistics ERP',
  description: 'Sistema completo de gestão logística para controle de fretes, frotas, pagamentos e despesas.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#181411] text-slate-100`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
