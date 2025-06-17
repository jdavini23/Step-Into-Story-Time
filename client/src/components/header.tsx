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
import { BookOpen, Plus, Users, Home, LogOut, Menu, Crown } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof BookOpen;
}

const navigation: NavigationItem[] = [
  { name: "My Stories", href: "/", icon: BookOpen },
  { name: "Create Story", href: "/story-wizard", icon: Plus },
  { name: "Characters", href: "/characters", icon: Users },
  { name: "Go Premium", href: "/subscribe", icon: Crown },
];

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Memoize user initials to prevent recalculation on every render
  const userInitials = useMemo(() => {
    if (!user) return "U";

    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  }, [user?.firstName, user?.lastName, user?.email]);

  // Memoize user display name
  const userDisplayName = useMemo(() => {
    if (!user) return "User";

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.email || "User";
  }, [user?.firstName, user?.lastName, user?.email]);

  // Optimize logout handler
  const handleLogout = useCallback(() => {
    setMobileMenuOpen(false);
    window.location.href = "/api/logout";
  }, []);

  const handleLogin = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <Link href="/" aria-label="Go to homepage">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-700 group-hover:text-purple-600 transition-colors">
                  Step Into Storytime
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Magical bedtime stories
                </p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-base font-bold text-gray-700 group-hover:text-purple-600 transition-colors">
                  Storytime
                </h1>
              </div>
            </div>
          </Link>

          {isAuthenticated ? (
            <>
              {/* Desktop Navigation */}
              <nav
                className="hidden md:flex items-center space-x-6"
                role="navigation"
                aria-label="Main navigation"
              >
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className={
                        location === item.href
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "text-gray-700 hover:text-purple-600"
                      }
                      aria-current={location === item.href ? "page" : undefined}
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full hover:bg-purple-50"
                      aria-label={`User menu for ${userDisplayName}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user?.profileImageUrl || undefined}
                          alt={`${userDisplayName}'s profile picture`}
                        />
                        <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="text-sm font-medium">{userDisplayName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              {/* Mobile Menu */}
              <MobileMenu
                navigation={navigation}
                location={location}
                user={user}
                userInitials={userInitials}
                userDisplayName={userDisplayName}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                onCloseMobileMenu={closeMobileMenu}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Extracted Mobile Menu Component for better organization
interface MobileMenuProps {
  navigation: NavigationItem[];
  location: string;
  user: any;
  userInitials: string;
  userDisplayName: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onCloseMobileMenu: () => void;
  onLogout: () => void;
}

function MobileMenu({
  navigation,
  location,
  user,
  userInitials,
  userDisplayName,
  mobileMenuOpen,
  setMobileMenuOpen,
  onCloseMobileMenu,
  onLogout,
}: MobileMenuProps) {
  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 hover:bg-purple-50"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <nav
          className="flex flex-col space-y-3 mt-6"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className={`w-full justify-start h-12 text-base transition-colors ${
                    location === item.href
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "hover:bg-purple-50"
                  }`}
                  onClick={onCloseMobileMenu}
                  aria-current={location === item.href ? "page" : undefined}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-gray-200">
            {user && (
              <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-gray-50">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.profileImageUrl || undefined}
                    alt={`${userDisplayName}'s profile picture`}
                  />
                  <AvatarFallback className="bg-purple-600 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
