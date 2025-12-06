import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  sticky?: boolean;
}

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
        "bg-background/95 backdrop-blur-xl border-b border-border z-40 overflow-x-auto scrollbar-hide",
        sticky && "sticky top-[53px]"
      )}
      onTouchStart={handleTouchStart}
    >
      <div className="flex relative min-w-max">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el)}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 min-w-[80px] px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <span className="flex items-center justify-center gap-1">
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "text-xs",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
        
        {/* Animated underline indicator */}
        <div 
          className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </div>
  );
};
