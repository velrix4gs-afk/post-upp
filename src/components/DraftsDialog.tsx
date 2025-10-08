import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDrafts } from '@/hooks/useDrafts';
import { FileText, Trash2, Send, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DraftsDialogProps {
  onSelectDraft?: (draft: any) => void;
}

const DraftsDialog = ({ onSelectDraft }: DraftsDialogProps) => {
  const { drafts, loading, deleteDraft, publishDraft } = useDrafts();
  const [open, setOpen] = useState(false);

  const handlePublish = async (draftId: string) => {
    await publishDraft(draftId);
    setOpen(false);
  };

  const handleSelect = (draft: any) => {
    onSelectDraft?.(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Drafts ({drafts.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Drafts</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading drafts...
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drafts saved</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">
                        {draft.content || 'No content'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                        </span>
                        {draft.scheduled_for && (
                          <>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              Scheduled for {new Date(draft.scheduled_for).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(draft)}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublish(draft.id)}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDraft(draft.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DraftsDialog;
