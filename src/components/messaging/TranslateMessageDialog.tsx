import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Languages, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TranslateMessageDialogProps {
  messageId: string;
  originalText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

export const TranslateMessageDialog = ({
  messageId,
  originalText,
  open,
  onOpenChange,
}: TranslateMessageDialogProps) => {
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      // TODO: Integrate with translation API (Google Translate, DeepL, etc.)
      // For now, show placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTranslatedText(`[Translated to ${targetLanguage}]: ${originalText}`);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translate Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-muted">
            <p className="text-sm">{originalText}</p>
          </Card>

          <div className="space-y-2">
            <Label>Translate to</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleTranslate} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Translate
              </>
            )}
          </Button>

          {translatedText && (
            <Card className="p-4 border-primary">
              <p className="text-sm">{translatedText}</p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
