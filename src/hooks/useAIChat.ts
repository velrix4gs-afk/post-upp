import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI_CHAT_URL = `https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/ai-chat`;

export const useAIChat = (isAdmin: boolean = false) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeXl4a2pwZ2Viam5zdGV2Z2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODk0ODMsImV4cCI6MjA3NDM2NTQ4M30.u1lTe8ZgbRj6R2TJ1_gvEGvG1EHKD4ytId8IDjojbVI`,
        },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: userMessage.trim() }],
          isAdmin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setStreamingContent(assistantContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Add final assistant message
      const assistantMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setStreamingContent('');
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isAdmin]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    sendMessage,
    clearHistory,
  };
};
