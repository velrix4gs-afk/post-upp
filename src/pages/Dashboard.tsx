import Navigation from "@/components/Navigation";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import MessagesList from "@/components/MessagesList";
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

const mockPosts = [
  {
    author: {
      name: "Sarah Johnson",
      username: "sarahj",
      avatar: "/placeholder.svg",
      verified: true
    },
    content: "Just launched my new portfolio website! So excited to share my latest projects with everyone. The design process was challenging but incredibly rewarding. Check it out and let me know what you think! 🚀",
    image: "/placeholder.svg",
    timestamp: "2 hours ago",
    likes: 127,
    comments: 23,
    shares: 8
  },
  {
    author: {
      name: "Mike Chen",
      username: "mikechen",
      verified: false
    },
    content: "Beautiful sunset from my evening run today. There's something magical about golden hour that makes everything feel peaceful. Nature never fails to amaze me! 🌅",
    timestamp: "4 hours ago",
    likes: 89,
    comments: 12,
    shares: 3
  },
  {
    author: {
      name: "Emma Wilson",
      username: "emmaw",
      verified: true
    },
    content: "Excited to announce that I'll be speaking at the upcoming Tech Conference 2024! Will be sharing insights about the future of AI and its impact on creative industries. Who else is attending?",
    timestamp: "6 hours ago",
    likes: 234,
    comments: 45,
    shares: 19
  }
];

const Dashboard = () => {
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
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg">JD</AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90">
                    <Camera className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <h3 className="font-semibold mt-3">John Doe</h3>
                <p className="text-sm text-muted-foreground">@johndoe</p>
                <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">1,234</div>
                    <div className="text-muted-foreground">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">567</div>
                    <div className="text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-card border-0 p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-3" />
                  Find Friends
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-3" />
                  Events
                </Button>
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
            <Card className="bg-gradient-card border-0 p-4">
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {/* Add Story */}
                <div className="flex-shrink-0 text-center">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground">
                      <AvatarFallback className="bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">Add Story</p>
                </div>

                {/* Story Items */}
                {['Sarah', 'Mike', 'Emma', 'Alex', 'Lisa'].map((name) => (
                  <div key={name} className="flex-shrink-0 text-center">
                    <Avatar className="h-16 w-16 ring-4 ring-gradient-primary cursor-pointer">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs mt-2">{name}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Create Post */}
            <CreatePost />

            {/* Posts Feed */}
            <div className="space-y-6">
              {mockPosts.map((post, index) => (
                <PostCard key={index} {...post} />
              ))}
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