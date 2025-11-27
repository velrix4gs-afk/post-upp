import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ProfilePreviewCard } from "./ProfilePreviewCard";
import { useState } from "react";

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const ProfileHoverCard = ({ userId, children, disabled }: ProfileHoverCardProps) => {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={600} closeDelay={300}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="bottom" 
        align="start" 
        className="p-0 w-auto border-none shadow-none bg-transparent"
        sideOffset={8}
      >
        <ProfilePreviewCard userId={userId} onClose={() => setOpen(false)} />
      </HoverCardContent>
    </HoverCard>
  );
};
