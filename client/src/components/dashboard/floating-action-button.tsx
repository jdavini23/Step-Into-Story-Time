
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function FloatingActionButton() {
  return (
    <Link href="/story-wizard">
      <Button className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform md:hidden z-50">
        <Plus className="w-6 h-6" />
      </Button>
    </Link>
  );
}
