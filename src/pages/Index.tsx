import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Users, Video, Camera, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SocialHub
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-primary hover:shadow-glow transition-all duration-300" asChild>
              <Link to="/auth">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4">
                🚀 Join 10M+ users worldwide
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Connect with{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  friends
                </span>{" "}
                around the world
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Share moments, discover communities, and stay connected with the people who matter most. 
                Experience social media reimagined for the modern world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300" asChild>
                  <Link to="/auth">Get Started Free</Link>
                </Button>
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 scale-105" />
              <img 
                src={heroImage} 
                alt="Social media connection" 
                className="relative rounded-3xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need to stay{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">connected</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to bring people together in meaningful ways
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Messaging</h3>
              <p className="text-muted-foreground">
                Chat instantly with friends and groups. Share photos, videos, and stay connected in real-time.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Communities</h3>
              <p className="text-muted-foreground">
                Join groups, create communities, and discover people who share your interests and passions.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Stories & Media</h3>
              <p className="text-muted-foreground">
                Share your moments with stories, create albums, and express yourself through rich media.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Video Calls</h3>
              <p className="text-muted-foreground">
                Face-to-face conversations with crystal clear video calls and screen sharing.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Feed</h3>
              <p className="text-muted-foreground">
                Discover relevant content with our AI-powered feed that learns what matters to you.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Built with modern technology for instant loading and seamless user experience.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to join the conversation?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with millions of users and discover a new way to share your world.
          </p>
          <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300" asChild>
            <Link to="/auth">Start Your Journey</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-gradient-primary flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">SocialHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SocialHub. Made with ❤️ for connecting people.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;