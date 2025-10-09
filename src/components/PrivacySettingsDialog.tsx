import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PrivacySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentSettings: {
    is_private?: boolean;
  };
  onUpdate: () => void;
}

export const PrivacySettingsDialog = ({
  isOpen,
  onClose,
  userId,
  currentSettings,
  onUpdate
}: PrivacySettingsDialogProps) => {
  const [isPrivate, setIsPrivate] = useState(currentSettings.is_private || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({ is_private: isPrivate })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Privacy settings updated successfully",
      });
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Privacy Settings</DialogTitle>
          <DialogDescription>
            Control who can see your profile and content
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="private-account">Private Account</Label>
              <p className="text-sm text-muted-foreground">
                When your account is private, only people you approve can see your posts and follow you
              </p>
            </div>
            <Switch
              id="private-account"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
