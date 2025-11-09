import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface BackNavigationProps {
  title?: string;
  showHome?: boolean;
}

export const BackNavigation = ({ title, showHome = true }: BackNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {title && (
          <h1 className="text-lg font-semibold flex-1 truncate">{title}</h1>
        )}
        
        {showHome && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9 ml-auto"
            aria-label="Go home"
          >
            <Home className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
