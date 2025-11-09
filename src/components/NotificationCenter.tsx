import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile full-screen backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 z-[60] lg:hidden"
        onClick={onClose}
      />
      
      {/* Notification panel - full screen on mobile, dropdown on desktop */}
      <Card className="fixed top-0 right-0 bottom-0 z-[70] lg:absolute lg:top-2 lg:right-2 lg:bottom-auto w-full lg:w-96 lg:h-[600px] bg-card shadow-xl overflow-hidden lg:rounded-lg rounded-none border-0 lg:border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          </div>

          {/* Notifications list */}
          <ScrollArea className="flex-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' 
                    ? 'All caught up!' 
                    : 'Notifications will appear here when you receive them'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium mb-1">
                            {notification.title}
                          </h4>
                          {notification.content && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        
                        {!notification.is_read && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          </div>
                        )}
                      </div>

                      {/* Action buttons for friend requests */}
                      {notification.type === 'friend_request' && notification.data?.friendship_id && (
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" className="h-7 px-2 text-xs">
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
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
            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full" size="sm">
                View all notifications
              </Button>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default NotificationCenter;