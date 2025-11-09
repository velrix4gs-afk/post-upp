import Navigation from "@/components/Navigation";
import { BackNavigation } from "@/components/BackNavigation";
import Events from "@/components/Events";

const EventsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BackNavigation title="Events" />
      
      <main className="container mx-auto px-4 py-6">
        <Events />
      </main>
    </div>
  );
};

export default EventsPage;