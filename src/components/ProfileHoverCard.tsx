import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { MiniProfilePopup } from "./MiniProfilePopup";
import { useState, useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const ProfileHoverCard = ({ userId, children, disabled }: ProfileHoverCardProps) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDrawerOpen(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  // Mobile: Use Drawer with long-press
  if (isMobile) {
    return (
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className="touch-none"
          >
            {children}
          </div>
        </DrawerTrigger>
        <DrawerContent className="px-4 pb-8">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
          <MiniProfilePopup userId={userId} onClose={() => setDrawerOpen(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use HoverCard
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={400} closeDelay={200}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="bottom" 
        align="start" 
        className="p-0 w-auto border-none shadow-2xl bg-transparent"
        sideOffset={8}
      >
        <MiniProfilePopup userId={userId} onClose={() => setOpen(false)} />
      </HoverCardContent>
    </HoverCard>
  );
};
