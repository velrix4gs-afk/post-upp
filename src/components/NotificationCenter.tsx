import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2,
  AtSign,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-orange-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-yellow-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-l">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-background/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-6 px-2">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="flex-1 rounded-xl transition-all duration-300"
              >
                All <span className="ml-1.5 opacity-70">({notifications.length})</span>
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="flex-1 rounded-xl transition-all duration-300"
              >
                Unread <span className="ml-1.5 opacity-70">({unreadCount})</span>
              </Button>
            </div>

            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="w-full mt-3 rounded-xl hover:bg-primary/10 transition-all duration-300"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications list */}
          <ScrollArea className="flex-1 px-4">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' 
                    ? 'All caught up!' 
                    : 'Notifications will appear here when you receive them'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 py-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${
                      !notification.is_read 
                        ? 'bg-primary/5 hover:bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        !notification.is_read ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-muted'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors duration-300">
                            {notification.title}
                          </h4>
                          {notification.content && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        
                        {!notification.is_read && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Action buttons for friend requests */}
                      {notification.type === 'friend_request' && notification.data?.friendship_id && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="h-8 px-3 text-xs rounded-lg flex-1">
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-lg flex-1">
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t bg-background/50">
              <Button 
                variant="ghost" 
                className="w-full rounded-xl hover:bg-primary/10 transition-all duration-300" 
                size="sm"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;