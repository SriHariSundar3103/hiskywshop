'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, PlusCircle, Settings, LogOut, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { businessDetails } from '@/lib/data';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { useEffect } from 'react';

const navLinks = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Product List' },
  { href: '/admin/products/new', icon: PlusCircle, label: 'Add Product' },
  { href: '/admin/settings', icon: Settings, label: 'Maintenance Mode' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, loading } = useUserProfile();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect anyone who is definitively not an admin (loading finished, no admin role)
      router.replace('/');
    }
  }, [loading, isAdmin, router]);

  // Show loading spinner while checking auth state
  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icons.Logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  const desktopNav = (
    <nav className="hidden md:flex md:flex-col md:items-center md:gap-4 md:px-2 md:py-4">
      <Link
        href="/"
        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base mb-2"
      >
        <Icons.Logo className="h-6 w-6" />
        <span className="sr-only">{businessDetails.shop_name}</span>
      </Link>
      <TooltipProvider>
        {navLinks.map((link) => (
          <Tooltip key={link.href}>
            <TooltipTrigger asChild>
              <Link
                href={link.href}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                  pathname.startsWith(link.href) && 'bg-accent text-accent-foreground'
                )}
              >
                <link.icon className="h-5 w-5" />
                <span className="sr-only">{link.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{link.label}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </nav>
  );

  const mobileNav = (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
<SheetContent side="left" className="sm:max-w-xs">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Icons.Logo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">{businessDetails.shop_name}</span>
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                  pathname.startsWith(link.href) && 'text-foreground'
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        {desktopNav}
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          {mobileNav}
          <div className="ml-auto">
            <Button asChild variant="outline">
              <Link href="/">Back to Shop</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
  );
}

