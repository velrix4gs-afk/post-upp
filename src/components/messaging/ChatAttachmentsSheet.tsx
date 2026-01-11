import { 
  Image, 
  Camera, 
  Film, 
  Smile, 
  Paperclip, 
  MapPin, 
  Users, 
  Clock,
  LucideIcon
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';

interface AttachmentOption {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface ChatAttachmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGalleryClick: () => void;
  onCameraClick: () => void;
  onGifsClick: () => void;
  onStickersClick: () => void;
  onFilesClick: () => void;
  onLocationClick: () => void;
  onContactsClick: () => void;
  onScheduleClick: () => void;
}

const AttachmentButton = ({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: LucideIcon; 
  label: string; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 group-active:scale-95 transition-all duration-200">
      <Icon className="h-6 w-6 text-foreground" />
    </div>
    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
      {label}
    </span>
  </button>
);

export const ChatAttachmentsSheet = ({
  open,
  onOpenChange,
  onGalleryClick,
  onCameraClick,
  onGifsClick,
  onStickersClick,
  onFilesClick,
  onLocationClick,
  onContactsClick,
  onScheduleClick,
}: ChatAttachmentsSheetProps) => {
  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const options: AttachmentOption[] = [
    { icon: Image, label: 'Gallery', onClick: () => handleAction(onGalleryClick) },
    { icon: Camera, label: 'Camera', onClick: () => handleAction(onCameraClick) },
    { icon: Film, label: 'GIFs', onClick: () => handleAction(onGifsClick) },
    { icon: Smile, label: 'Stickers', onClick: () => handleAction(onStickersClick) },
    { icon: Paperclip, label: 'Files', onClick: () => handleAction(onFilesClick) },
    { icon: MapPin, label: 'Location', onClick: () => handleAction(onLocationClick) },
    { icon: Users, label: 'Contacts', onClick: () => handleAction(onContactsClick) },
    { icon: Clock, label: 'Schedule', onClick: () => handleAction(onScheduleClick) },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <div className="p-6 pt-4">
          <div className="grid grid-cols-4 gap-4 sm:gap-6">
            {options.map((option) => (
              <AttachmentButton
                key={option.label}
                icon={option.icon}
                label={option.label}
                onClick={option.onClick}
              />
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
