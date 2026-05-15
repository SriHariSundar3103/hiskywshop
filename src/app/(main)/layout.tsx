'use client';

import dynamic from 'next/dynamic';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// HYDRATION FIX: Dynamically import MaintenanceWrapper with ssr: false
// to prevent Firebase hooks from executing during server-side rendering
const MaintenanceWrapper = dynamic(
  () => import("@/components/maintenance-wrapper").then(mod => mod.MaintenanceWrapper),
  { ssr: false, loading: () => <></> }
);

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background">
        <MaintenanceWrapper>
          {children}
        </MaintenanceWrapper>
      </main>
      <Footer />
    </div>
  );
}
