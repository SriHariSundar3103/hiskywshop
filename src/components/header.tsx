"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search, Phone, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { businessDetails, categories, otherNavLinks } from "@/lib/data";
import type { Category } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { signOut } from "@/firebase/auth/actions";


function NavLinkWithDropdown({ category }: { category: Category }) {
  return (
    <div className="group relative flex items-center">
      <Link 
        href={`/products/${category.slug}`}
        className="flex items-center gap-1 text-base font-medium text-foreground transition-colors hover:text-primary py-2"
      >
        {category.name}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
      </Link>
      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 invisible group-hover:visible z-30">
        <div className="w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" >
            {category.subCategories?.map((sub) => (
              <Link
                key={sub.slug}
                href={`/products/${category.slug}?sub=${sub.slug}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserNav() {
    const { user, isAdmin, loading } = useUserProfile();
    const router = useRouter();

    if (loading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
        return (
            <Button asChild variant="outline">
                <Link href="/login">Login</Link>
            </Button>
        );
    }
    
    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="flex w-full cursor-pointer items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsDialogOpen(false);
    }
  };

  const searchDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search for Products</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearchSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="search"
              placeholder="Search watches, shirts, pants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="col-span-4"
            />
          </div>
          <Button type="submit" className="w-full">Search</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white text-foreground h-[70px]">
      <div className="container flex h-full items-center justify-between px-4 md:px-6">
        {/* Left Section: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.Logo className="h-8 w-8 text-black" />
            <span className="font-bold text-[22px] text-black">Hi/sky</span>
          </Link>
        </div>

        {/* Center & Right Section */}
        <div className="flex items-center gap-6">
           {/* Center Section: Nav */}
            <nav className="hidden md:flex items-center space-x-6 ml-8">
                {categories.map((cat) => (
                <NavLinkWithDropdown key={cat.slug} category={cat} />
                ))}
                {otherNavLinks.map((link) => (
                <Link key={link.slug} href={`/${link.slug}`} className="text-base font-medium text-foreground transition-colors hover:text-primary">
                    {link.name}
                </Link>
                ))}
            </nav>

            {/* Right Section: Search and Contact */}
            <div className="flex items-center gap-4">
                {searchDialog}
                <Button asChild className="h-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-accent/90 hidden md:flex">
                    <a href={`tel:${businessDetails.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                    </a>
                </Button>
                 <UserNav />
            </div>
        </div>
        
        {/* Mobile Nav Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {searchDialog}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white text-foreground w-[300px] sm:w-[350px]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
               <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                  <Icons.Logo className="h-6 w-6" />
                  <span className="font-bold">Hi/sky</span>
                </Link>
              <div className="flex flex-col h-full">
                <nav className="flex-grow">
                  <Accordion type="single" collapsible className="w-full">
                    {categories.map((category) => (
                      <AccordionItem value={category.slug} key={category.slug}>
                        <AccordionTrigger className="text-lg font-medium hover:no-underline">
                          {category.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col space-y-2 pl-4">
                            <Link href={`/products/${category.slug}`} className="block py-1 text-muted-foreground hover:text-primary">All {category.name}</Link>
                            {category.subCategories?.map(sub => (
                              <Link key={sub.slug} href={`/products/${category.slug}?sub=${sub.slug}`} className="block py-1 text-muted-foreground hover:text-primary">{sub.name}</Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {otherNavLinks.map(link => (
                      <Link key={link.slug} href={`/${link.slug}`} className="flex w-full items-center py-4 text-lg font-medium border-b">
                          {link.name}
                      </Link>
                    ))}
                  </Accordion>
                </nav>
                <div className="mt-auto pt-6 space-y-4">
                   <Button asChild className="w-full h-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-accent/90">
                      <a href={`tel:${businessDetails.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </a>
                    </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
