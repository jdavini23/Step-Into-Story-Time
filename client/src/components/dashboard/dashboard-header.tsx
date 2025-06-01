
import type { User } from "@shared/schema";

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
    </div>
  );
}
