import type { User } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardHeaderProps {
  user: User | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! ✨
      </h2>
      <p className="text-sm sm:text-base text-gray-600">Ready to create another magical bedtime adventure?</p>
       <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Welcome back, {user.name || user.email?.split('@')[0] || 'Storyteller'}!
          </span>
          <ThemeToggle />
        </div>
    </div>
  );
}