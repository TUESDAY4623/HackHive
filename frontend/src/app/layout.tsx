import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'HackHive – The Hackathon Social Platform',
  description: 'Discover hackathons, showcase projects, find teammates, and verify your skills. The ultimate platform for developer collaboration.',
  keywords: ['hackathon', 'developers', 'projects', 'teams', 'coding', 'portfolio'],
  openGraph: {
    title: 'HackHive – The Hackathon Social Platform',
    description: 'Join the hive. Build the future.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="bg-grid" />
        <div className="bg-orbs">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(10,10,31,0.95)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                fontFamily: "'Space Grotesk', sans-serif",
              },
              success: { iconTheme: { primary: '#4ade80', secondary: '#050510' } },
              error: { iconTheme: { primary: '#f472b6', secondary: '#050510' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
