import { supabase } from '@/integrations/supabase/client';
import { logError } from './errorLogger';

export interface QueuedMessage {
  id?: string;
  tempId: string;
  chatId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  replyTo?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

class MessageQueue {
  private processing = false;

  async addToQueue(message: Omit<QueuedMessage, 'id' | 'status' | 'retryCount' | 'createdAt'>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('message_queue')
      .insert({
        user_id: user.id,
        chat_id: message.chatId,
        content: message.content,
        media_url: message.mediaUrl,
        media_type: message.mediaType,
        reply_to: message.replyTo,
        temp_id: message.tempId,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) throw error;
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return data.id;
  }

  async processQueue() {
    if (this.processing || !navigator.onLine) return;

    this.processing = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pending } = await supabase
        .from('message_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (!pending || pending.length === 0) return;

      for (const msg of pending) {
        try {
          await this.sendMessage(msg);
        } catch (error) {
          await this.handleFailure(msg.id, error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async sendMessage(msg: any) {
    await supabase.from('message_queue').update({ status: 'sending' }).eq('id', msg.id);

    const { error } = await supabase.from('messages').insert({
      chat_id: msg.chat_id,
      sender_id: msg.user_id,
      content: msg.content,
      media_url: msg.media_url,
      media_type: msg.media_type,
      reply_to: msg.reply_to
    });

    if (error) throw error;

    await supabase.from('message_queue').update({
      status: 'sent',
      sent_at: new Date().toISOString()
    }).eq('id', msg.id);
  }

  private async handleFailure(queueId: string, error: any) {
    const { data: msg } = await supabase
      .from('message_queue')
      .select('retry_count')
      .eq('id', queueId)
      .single();

    const retryCount = (msg?.retry_count || 0) + 1;
    
    if (retryCount >= 3) {
      await supabase.from('message_queue').update({
        status: 'failed',
        retry_count: retryCount,
        error_message: error.message
      }).eq('id', queueId);

      await logError({
        type: 'network',
        message: 'Message send failed after retries',
        error,
        severity: 'error',
        componentName: 'MessageQueue',
        metadata: { queueId, retryCount }
      });
    } else {
      await supabase.from('message_queue').update({
        status: 'pending',
        retry_count: retryCount
      }).eq('id', queueId);
    }
  }

  async getPendingMessages(chatId: string): Promise<QueuedMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('message_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('chat_id', chatId)
      .in('status', ['pending', 'sending'])
      .order('created_at', { ascending: true });

    if (!data) return [];

    return data.map(msg => ({
      id: msg.id,
      tempId: msg.temp_id,
      chatId: msg.chat_id,
      content: msg.content || undefined,
      mediaUrl: msg.media_url || undefined,
      mediaType: msg.media_type || undefined,
      replyTo: msg.reply_to || undefined,
      status: msg.status as any,
      retryCount: msg.retry_count,
      errorMessage: msg.error_message || undefined,
      createdAt: msg.created_at
    }));
  }
}

export const messageQueue = new MessageQueue();

// Auto-process queue when coming online
window.addEventListener('online', () => {
  messageQueue.processQueue();
});
