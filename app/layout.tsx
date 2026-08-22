import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/landing/CustomCursor';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BookSeat - Ticket Booking Platform',
  description: 'Book seats for movies and concerts with real-time seat maps',
  icons: {
    icon: '/icon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`overflow-x-hidden ${inter.className}`}>
        <AuthProvider>
          {children}
          <CustomCursor />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
