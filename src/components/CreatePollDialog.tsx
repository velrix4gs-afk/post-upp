import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, X, BarChart3 } from 'lucide-react';
import { usePolls } from '@/hooks/usePolls';

interface CreatePollDialogProps {
  postId: string;
  onPollCreated?: () => void;
}

const CreatePollDialog = ({ postId, onPollCreated }: CreatePollDialogProps) => {
  const { createPoll, loading } = usePolls();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | undefined>();

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    const validOptions = options.filter(opt => opt.trim());
    if (!question.trim() || validOptions.length < 2) return;

    try {
      await createPoll(postId, question, validOptions, expiresIn, allowMultiple);
      setOpen(false);
      resetForm();
      onPollCreated?.();
    } catch (err) {
      console.error('Error creating poll:', err);
    }
  };

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setExpiresIn(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Add Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Question</Label>
            <Input
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Allow multiple choices</Label>
            <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
          </div>

          <div>
            <Label>Poll Duration</Label>
            <Select value={expiresIn?.toString()} onValueChange={(val) => setExpiresIn(val ? Number(val) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="No expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">1 Day</SelectItem>
                <SelectItem value="72">3 Days</SelectItem>
                <SelectItem value="168">1 Week</SelectItem>
                <SelectItem value="720">1 Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !question.trim() || options.filter(o => o.trim()).length < 2}
              className="flex-1"
            >
              Create Poll
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;
