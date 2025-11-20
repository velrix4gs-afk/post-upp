import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateStoryProps {
  onStoryCreated?: () => void;
}

const CreateStory = ({ onStoryCreated }: CreateStoryProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => navigate('/create/story')}
    >
      <Plus className="h-4 w-4" />
      Add Story
    </Button>
  );
};

export default CreateStory;
