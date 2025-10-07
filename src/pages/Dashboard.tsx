import Navigation from "@/components/Navigation";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import MessagesList from "@/components/MessagesList";
import Stories from "@/components/Stories";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus,
  Camera
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useFriends } from "@/hooks/useFriends";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { posts, loading: postsLoading } = usePosts();
  const { friends } = useFriends();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* User Profile Card */}
            <Card className="bg-gradient-card border-0 p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg">
                      {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90">
                    <Camera className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <h3 className="font-semibold mt-3">{profile?.display_name || 'Loading...'}</h3>
                <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{friends.length}</div>
                    <div className="text-muted-foreground">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{posts.length}</div>
                    <div className="text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-card border-0 p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/friends">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-3" />
                    Find Friends
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-3" />
                    Events
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Trending
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-3" />
                  Create Group
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
            {/* Stories */}
            <Stories />

            {/* Create Post */}
            <CreatePost />

            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading ? (
                <div className="text-center py-8">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts yet. Create your first post above!
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    id={post.id}
                    author={{
                      name: post.profiles.display_name,
                      username: post.profiles.username,
                      avatar: post.profiles.avatar_url,
                      verified: post.profiles.is_verified
                    }}
                    content={post.content || ''}
                    image={post.media_url}
                    timestamp={formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    likes={post.reactions_count}
                    comments={post.comments_count}
                    shares={0}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Messages */}
            <div className="h-[600px]">
              <MessagesList />
            </div>

            {/* Trending Topics */}
            <Card className="bg-gradient-card border-0 p-4">
              <h3 className="font-semibold mb-3">Trending Topics</h3>
              <div className="space-y-3">
                {[
                  { tag: "#TechConf2024", posts: "12.5K posts" },
                  { tag: "#MondayMotivation", posts: "8.2K posts" },
                  { tag: "#WebDevelopment", posts: "5.8K posts" },
                  { tag: "#DesignTips", posts: "3.4K posts" }
                ].map((topic) => (
                  <div key={topic.tag} className="cursor-pointer hover:bg-muted/20 p-2 rounded transition-colors">
                    <div className="font-medium text-sm text-primary">{topic.tag}</div>
                    <div className="text-xs text-muted-foreground">{topic.posts}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Friend Suggestions */}
            <Card className="bg-gradient-card border-0 p-4">
              <h3 className="font-semibold mb-3">People You May Know</h3>
              <div className="space-y-3">
                {[
                  { name: "Jessica Lee", mutualFriends: 5 },
                  { name: "David Park", mutualFriends: 3 },
                  { name: "Maria Garcia", mutualFriends: 8 }
                ].map((person) => (
                  <div key={person.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-gradient-primary text-white text-sm">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {person.mutualFriends} mutual friends
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Add</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;