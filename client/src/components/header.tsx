import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Plus, Home, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const navigation = [
    { name: "My Stories", href: "/", icon: BookOpen },
    { name: "Create Story", href: "/story-wizard", icon: Plus },
  ];

  const MobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <div className="flex flex-col space-y-3 mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className="w-full justify-start h-12 text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
          
          <div className="pt-4 border-t">
            {isAuthenticated && user && (
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-purple-600 text-white">
                    {getInitials(user.firstName, user.lastName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.email || "User"
                    }
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setMobileMenuOpen(false);
                window.location.href = "/api/logout";
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <Link href="/">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-700">Step Into Storytime</h1>
                <p className="text-xs sm:text-sm text-gray-500">Magical bedtime stories</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-base font-bold text-gray-700">Storytime</h1>
              </div>
            </div>
          </Link>
          
          {isAuthenticated ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className={location === item.href 
                        ? "bg-purple-600 text-white hover:bg-purple-700" 
                        : "text-gray-700 hover:text-purple-600"
                      }
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {getInitials(user?.firstName, user?.lastName, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="text-sm font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.firstName || user?.email || "User"
                          }
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                      onClick={() => window.location.href = "/api/logout"}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              {/* Mobile Menu */}
              <MobileMenu />
            </>
          ) : (
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
