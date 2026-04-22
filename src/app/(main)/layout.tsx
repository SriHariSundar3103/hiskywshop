import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MaintenanceWrapper } from "@/components/maintenance-wrapper";

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
