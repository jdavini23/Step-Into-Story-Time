import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Story } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: stories = [], isLoading: storiesLoading, error } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-600">Loading your magical world...</p>
        </div>
      </div>
    );
  }

  const recentStories = stories.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-700 mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! ✨
          </h2>
          <p className="text-gray-600">Ready to create another magical bedtime adventure?</p>
        </div>
        
        {/* Quick actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/story-wizard">
            <Card className="bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 text-white p-6 hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-0">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="font-semibold text-lg mb-1">Create New Story</h3>
                <p className="text-white/80 text-sm">Start a magical adventure</p>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="p-6 shadow-lg">
            <CardContent className="p-0">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-lg mb-1 text-gray-700">
                {storiesLoading ? "..." : `${stories.length} Stories`}
              </h3>
              <p className="text-gray-600 text-sm">Total created</p>
            </CardContent>
          </Card>
          
          <Link href="/dashboard">
            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="text-3xl mb-2">💝</div>
                <h3 className="font-semibold text-lg mb-1 text-gray-700">View Library</h3>
                <p className="text-gray-600 text-sm">All your stories</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {/* Recent stories */}
        {recentStories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-700">Recent Stories</h3>
              <Link href="/dashboard">
                <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentStories.map((story) => (
                <Link key={story.id} href={`/story/${story.id}`}>
                  <Card className="shadow-lg hover:scale-105 transition-transform cursor-pointer overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-purple-100 via-blue-100 to-yellow-100 flex items-center justify-center">
                      <span className="text-4xl">📖</span>
                    </div>
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-lg text-gray-700 mb-2">{story.title}</h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        A {story.tone} story featuring {story.childName}...
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(story.createdAt || '').toLocaleDateString()}</span>
                        <span>Age {story.childAge}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {stories.length === 0 && !storiesLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Your story library is waiting!</h3>
            <p className="text-gray-600 mb-6">Create your first magical bedtime story and start building memories.</p>
            <Link href="/story-wizard">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg">
                ✨ Create Your First Story
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
