import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  expires_at: string | null;
  allow_multiple: boolean;
  options: PollOption[];
  userVotes: string[];
}

export const usePolls = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createPoll = async (
    postId: string,
    question: string,
    options: string[],
    expiresIn?: number,
    allowMultiple = false
  ) => {
    try {
      setLoading(true);

      // Create poll
      const { data: poll, error: pollError } = await (supabase as any)
        .from('polls')
        .insert({
          post_id: postId,
          question,
          expires_at: expiresIn 
            ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
            : null,
          allow_multiple: allowMultiple
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create options
      const { error: optionsError } = await (supabase as any)
        .from('poll_options')
        .insert(
          options.map(option => ({
            poll_id: poll.id,
            option_text: option
          }))
        );

      if (optionsError) throw optionsError;

      toast({
        title: 'Success',
        description: 'Poll created successfully'
      });

      return poll.id;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const votePoll = async (pollId: string, optionIds: string[]) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await (supabase as any)
        .from('poll_votes')
        .insert(
          optionIds.map(optionId => ({
            poll_id: pollId,
            option_id: optionId,
            user_id: user.id
          }))
        );

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vote recorded'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeVote = async (pollId: string, optionId: string) => {
    try {
      setLoading(true);

      const { error } = await (supabase as any)
        .from('poll_votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('option_id', optionId);

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPoll = async (postId: string): Promise<Poll | null> => {
    try {
      const { data: poll, error: pollError } = await (supabase as any)
        .from('polls')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (pollError || !poll) return null;

      const { data: options, error: optionsError } = await (supabase as any)
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('created_at');

      if (optionsError) throw optionsError;

      const { data: votes, error: votesError } = await (supabase as any)
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (votesError) throw votesError;

      return {
        ...poll,
        options: options || [],
        userVotes: votes?.map(v => v.option_id) || []
      };
    } catch (err: any) {
      console.error('Error fetching poll:', err);
      return null;
    }
  };

  return {
    loading,
    createPoll,
    votePoll,
    removeVote,
    fetchPoll
  };
};
