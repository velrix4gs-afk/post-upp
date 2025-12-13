import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FileText, MessageSquare, Image, Heart } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  sticky?: boolean;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  posts: <FileText className="h-4 w-4" />,
  replies: <MessageSquare className="h-4 w-4" />,
  media: <Image className="h-4 w-4" />,
  likes: <Heart className="h-4 w-4" />,
};

export const ProfileTabs = ({ tabs, activeTab, onTabChange, sticky = true }: ProfileTabsProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabEl = tabRefs.current[activeIndex];
    
    if (activeTabEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabEl.getBoundingClientRect();
      
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab, tabs]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      
      if (Math.abs(diff) > 50) {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        
        if (diff > 0 && currentIndex < tabs.length - 1) {
          onTabChange(tabs[currentIndex + 1].id);
          document.removeEventListener('touchmove', handleTouchMove);
        } else if (diff < 0 && currentIndex > 0) {
          onTabChange(tabs[currentIndex - 1].id);
          document.removeEventListener('touchmove', handleTouchMove);
        }
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "bg-background/95 backdrop-blur-xl border-b border-border z-40",
        sticky && "sticky top-[53px]"
      )}
      onTouchStart={handleTouchStart}
    >
      <div className="flex relative">
        {tabs.map((tab, index) => {
          const icon = tab.icon || TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 px-3 py-3.5 text-sm font-medium transition-all relative flex items-center justify-center gap-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/30"
              )}
            >
              {icon && (
                <span className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {icon}
                </span>
              )}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-medium",
                  isActive 
                    ? "bg-primary/15 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Animated underline indicator */}
        <div 
          className="absolute bottom-0 h-[2px] bg-primary rounded-full transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </div>
  );
};
