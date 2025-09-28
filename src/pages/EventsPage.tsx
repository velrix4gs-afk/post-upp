import Navigation from "@/components/Navigation";
import Events from "@/components/Events";

const EventsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <Events />
      </div>
    </div>
  );
};

export default EventsPage;