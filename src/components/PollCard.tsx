import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { usePolls, Poll } from '@/hooks/usePolls';

interface PollCardProps {
  postId: string;
}

const PollCard = ({ postId }: PollCardProps) => {
  const { fetchPoll, votePoll, removeVote, loading } = usePolls();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    loadPoll();
  }, [postId]);

  const loadPoll = async () => {
    const data = await fetchPoll(postId);
    if (data) {
      setPoll(data);
      setSelectedOptions(data.userVotes);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return;
    
    await votePoll(poll.id, selectedOptions);
    await loadPoll();
  };

  const toggleOption = (optionId: string) => {
    if (poll?.userVotes.includes(optionId)) {
      removeVote(poll.id, optionId);
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
      setTimeout(loadPoll, 500);
    } else {
      if (poll?.allow_multiple) {
        setSelectedOptions(prev => [...prev, optionId]);
      } else {
        setSelectedOptions([optionId]);
      }
    }
  };

  const getTotalVotes = () => {
    return poll?.options.reduce((sum, opt) => sum + opt.votes_count, 0) || 0;
  };

  const getPercentage = (votes: number) => {
    const total = getTotalVotes();
    return total === 0 ? 0 : (votes / total) * 100;
  };

  if (!poll) return null;

  const hasVoted = poll.userVotes.length > 0;
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{poll.question}</h3>
        {poll.expires_at && (
          <p className="text-sm text-muted-foreground">
            {isExpired ? 'Expired' : `Expires ${new Date(poll.expires_at).toLocaleDateString()}`}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const isUserVote = poll.userVotes.includes(option.id);
          const percentage = getPercentage(option.votes_count);

          return (
            <div key={option.id}>
              <Button
                variant={isSelected || isUserVote ? 'default' : 'outline'}
                className="w-full justify-start relative overflow-hidden"
                onClick={() => !isExpired && toggleOption(option.id)}
                disabled={loading || isExpired}
              >
                {hasVoted && (
                  <div 
                    className="absolute inset-0 bg-primary/20"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="flex items-center gap-2 relative z-10 w-full">
                  {isUserVote ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <span className="flex-1 text-left">{option.option_text}</span>
                  {hasVoted && (
                    <span className="text-sm font-medium">
                      {option.votes_count} ({percentage.toFixed(0)}%)
                    </span>
                  )}
                </div>
              </Button>
            </div>
          );
        })}
      </div>

      {!hasVoted && !isExpired && selectedOptions.length > 0 && (
        <Button 
          onClick={handleVote} 
          disabled={loading}
          className="w-full"
        >
          Vote
        </Button>
      )}

      <p className="text-sm text-muted-foreground text-center">
        {getTotalVotes()} {getTotalVotes() === 1 ? 'vote' : 'votes'}
      </p>
    </Card>
  );
};

export default PollCard;
