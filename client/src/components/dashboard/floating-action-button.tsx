import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function FloatingActionButton() {
  return (
    <Link href="/story-wizard">
      <Button className="fixed bottom-6 right-6 bg-gradient-to-r from-story-gold via-story-sunset to-story-forest text-white p-4 rounded-full shadow-2xl hover:shadow-lg transition-shadow md:hidden z-50">
        <Plus className="w-6 h-6" />
      </Button>
    </Link>
  );
}
