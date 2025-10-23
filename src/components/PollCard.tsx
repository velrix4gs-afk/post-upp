import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Clock } from 'lucide-react';
import { usePolls, Poll } from '@/hooks/usePolls';
import { formatDistanceToNow } from 'date-fns';

interface PollCardProps {
  postId: string;
}

export const PollCard = ({ postId }: PollCardProps) => {
  const { fetchPoll, votePoll, removeVote, loading } = usePolls();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    loadPoll();
  }, [postId]);

  const loadPoll = async () => {
    const pollData = await fetchPoll(postId);
    if (pollData) {
      setPoll(pollData);
      setSelectedOptions(pollData.userVotes);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!poll) return;

    try {
      if (selectedOptions.includes(optionId)) {
        // Remove vote
        await removeVote(poll.id, optionId);
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        // Add vote
        if (poll.allow_multiple) {
          await votePoll(poll.id, [...selectedOptions, optionId]);
          setSelectedOptions([...selectedOptions, optionId]);
        } else {
          // Single choice - remove previous and add new
          if (selectedOptions.length > 0) {
            await removeVote(poll.id, selectedOptions[0]);
          }
          await votePoll(poll.id, [optionId]);
          setSelectedOptions([optionId]);
        }
      }
      // Reload poll to get updated counts
      await loadPoll();
    } catch (error) {
      console.error('[POLL_001] Error voting:', error);
    }
  };

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes_count, 0);
  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const hasVoted = selectedOptions.length > 0;

  return (
    <Card className="p-4 bg-gradient-card border-0">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-lg">{poll.question}</h3>
        {poll.expires_at && !isExpired && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
          </Badge>
        )}
        {isExpired && (
          <Badge variant="destructive">Ended</Badge>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes_count / totalVotes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.id);

          return (
            <Button
              key={option.id}
              variant="outline"
              className={`w-full justify-start relative overflow-hidden h-auto py-3 ${
                isSelected ? 'border-primary bg-primary/10' : ''
              }`}
              onClick={() => !isExpired && handleVote(option.id)}
              disabled={loading || isExpired}
            >
              {hasVoted && (
                <div 
                  className="absolute left-0 top-0 h-full bg-primary/20 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                  <span>{option.option_text}</span>
                </div>
                {hasVoted && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{Math.round(percentage)}%</span>
                    <span>({option.votes_count})</span>
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {poll.allow_multiple && (
          <Badge variant="outline" className="text-xs">Multiple choices allowed</Badge>
        )}
      </div>
    </Card>
  );
};
