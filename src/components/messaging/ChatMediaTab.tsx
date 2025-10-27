import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, FileText, Link as LinkIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMediaTabProps {
  chatId: string;
}

export const ChatMediaTab = ({ chatId }: ChatMediaTabProps) => {
  const [media, setMedia] = useState<{ images: any[]; videos: any[]; files: any[]; links: any[] }>({
    images: [],
    videos: [],
    files: [],
    links: [],
  });

  useEffect(() => {
    fetchChatMedia();
  }, [chatId]);

  const fetchChatMedia = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, content, media_url, media_type, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const images: any[] = [];
      const videos: any[] = [];
      const files: any[] = [];
      const links: any[] = [];

      messages?.forEach((msg) => {
        if (msg.media_type === 'image') {
          images.push(msg);
        } else if (msg.media_type === 'video') {
          videos.push(msg);
        } else if (msg.media_type && msg.media_type !== 'audio') {
          files.push(msg);
        }

        // Extract links from content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundLinks = msg.content?.match(urlRegex);
        if (foundLinks) {
          foundLinks.forEach((link) => {
            links.push({ ...msg, link });
          });
        }
      });

      setMedia({ images, videos, files, links });
    } catch (error) {
      console.error('Error fetching chat media:', error);
    }
  };

  return (
    <Card className="p-4">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="images">
            <Image className="h-4 w-4 mr-2" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="h-4 w-4 mr-2" />
            Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-3 gap-2">
              {media.images.map((item) => (
                <div key={item.id} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={item.media_url}
                    alt="Chat media"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="videos">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-2">
              {media.videos.map((item) => (
                <div key={item.id} className="aspect-video rounded-lg overflow-hidden">
                  <video
                    src={item.media_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="files">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {media.files.map((item) => (
                <a
                  key={item.id}
                  href={item.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.media_url.split('/').pop()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="links">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {media.links.map((item, idx) => (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <LinkIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-primary">{item.link}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
