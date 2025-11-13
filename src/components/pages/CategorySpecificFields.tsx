import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface CategorySpecificFieldsProps {
  category: string;
  metadata: any;
  onChange: (metadata: any) => void;
}

export const CategorySpecificFields = ({ category, metadata = {}, onChange }: CategorySpecificFieldsProps) => {
  const [tempValue, setTempValue] = useState('');

  const addToList = (key: string) => {
    if (!tempValue.trim()) return;
    const list = metadata[key] || [];
    onChange({ ...metadata, [key]: [...list, tempValue.trim()] });
    setTempValue('');
  };

  const removeFromList = (key: string, index: number) => {
    const list = metadata[key] || [];
    onChange({ ...metadata, [key]: list.filter((_: any, i: number) => i !== index) });
  };

  if (!category) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Select a category to see specific fields</p>
      </div>
    );
  }

  // Business Page Fields
  if (category === 'business') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Business Hours</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input
              placeholder="Opening time"
              value={metadata.opening_time || ''}
              onChange={(e) => onChange({ ...metadata, opening_time: e.target.value })}
            />
            <Input
              placeholder="Closing time"
              value={metadata.closing_time || ''}
              onChange={(e) => onChange({ ...metadata, closing_time: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Services Offered</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add a service"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('services'))}
            />
            <Button type="button" size="icon" onClick={() => addToList('services')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(metadata.services || []).map((service: string, i: number) => (
              <div key={i} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <span className="text-sm">{service}</span>
                <button onClick={() => removeFromList('services', i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Price Range</Label>
          <Select
            value={metadata.price_range || ''}
            onValueChange={(value) => onChange({ ...metadata, price_range: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select price range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="$">$ - Budget friendly</SelectItem>
              <SelectItem value="$$">$$ - Moderate</SelectItem>
              <SelectItem value="$$$">$$$ - Upscale</SelectItem>
              <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Payment Methods</Label>
          <div className="space-y-2 mt-2">
            {['Cash', 'Credit Card', 'Debit Card', 'Mobile Payment', 'Online Transfer'].map((method) => (
              <label key={method} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(metadata.payment_methods || []).includes(method)}
                  onChange={(e) => {
                    const methods = metadata.payment_methods || [];
                    onChange({
                      ...metadata,
                      payment_methods: e.target.checked
                        ? [...methods, method]
                        : methods.filter((m: string) => m !== method)
                    });
                  }}
                  className="rounded"
                />
                <span className="text-sm">{method}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Community Page Fields
  if (category === 'community') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Community Rules</Label>
          <Textarea
            placeholder="List your community rules..."
            value={metadata.rules || ''}
            onChange={(e) => onChange({ ...metadata, rules: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <Label>Member Requirements</Label>
          <Input
            placeholder="e.g., 18+, Local residents only"
            value={metadata.requirements || ''}
            onChange={(e) => onChange({ ...metadata, requirements: e.target.value })}
          />
        </div>

        <div>
          <Label>Discussion Topics</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add a topic"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('topics'))}
            />
            <Button type="button" size="icon" onClick={() => addToList('topics')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(metadata.topics || []).map((topic: string, i: number) => (
              <div key={i} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <span className="text-sm">{topic}</span>
                <button onClick={() => removeFromList('topics', i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Entertainment Page Fields
  if (category === 'entertainment') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Genre/Type</Label>
          <Input
            placeholder="e.g., Comedy, Gaming, Reviews"
            value={metadata.genre || ''}
            onChange={(e) => onChange({ ...metadata, genre: e.target.value })}
          />
        </div>

        <div>
          <Label>Content Rating</Label>
          <Select
            value={metadata.rating || ''}
            onValueChange={(value) => onChange({ ...metadata, rating: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="G">G - General Audiences</SelectItem>
              <SelectItem value="PG">PG - Parental Guidance</SelectItem>
              <SelectItem value="PG-13">PG-13 - Ages 13+</SelectItem>
              <SelectItem value="R">R - Restricted</SelectItem>
              <SelectItem value="18+">18+ - Adults Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Posting Schedule</Label>
          <Input
            placeholder="e.g., Daily at 6 PM, Tuesdays & Thursdays"
            value={metadata.schedule || ''}
            onChange={(e) => onChange({ ...metadata, schedule: e.target.value })}
          />
        </div>

        <div>
          <Label>External Links</Label>
          <div className="space-y-2">
            <Input
              placeholder="YouTube"
              value={metadata.youtube || ''}
              onChange={(e) => onChange({ ...metadata, youtube: e.target.value })}
            />
            <Input
              placeholder="Twitch"
              value={metadata.twitch || ''}
              onChange={(e) => onChange({ ...metadata, twitch: e.target.value })}
            />
            <Input
              placeholder="TikTok"
              value={metadata.tiktok || ''}
              onChange={(e) => onChange({ ...metadata, tiktok: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  // Music Page Fields
  if (category === 'music') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Music Genre</Label>
          <Input
            placeholder="e.g., Pop, Rock, Hip Hop, Electronic"
            value={metadata.genre || ''}
            onChange={(e) => onChange({ ...metadata, genre: e.target.value })}
          />
        </div>

        <div>
          <Label>Streaming Links</Label>
          <div className="space-y-2">
            <Input
              placeholder="Spotify"
              value={metadata.spotify || ''}
              onChange={(e) => onChange({ ...metadata, spotify: e.target.value })}
            />
            <Input
              placeholder="Apple Music"
              value={metadata.apple_music || ''}
              onChange={(e) => onChange({ ...metadata, apple_music: e.target.value })}
            />
            <Input
              placeholder="SoundCloud"
              value={metadata.soundcloud || ''}
              onChange={(e) => onChange({ ...metadata, soundcloud: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Band Members</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add member name"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('members'))}
            />
            <Button type="button" size="icon" onClick={() => addToList('members')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(metadata.members || []).map((member: string, i: number) => (
              <div key={i} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <span className="text-sm">{member}</span>
                <button onClick={() => removeFromList('members', i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fitness Page Fields
  if (category === 'fitness') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Specialties</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="e.g., Yoga, CrossFit, Personal Training"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('specialties'))}
            />
            <Button type="button" size="icon" onClick={() => addToList('specialties')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(metadata.specialties || []).map((specialty: string, i: number) => (
              <div key={i} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <span className="text-sm">{specialty}</span>
                <button onClick={() => removeFromList('specialties', i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Certifications</Label>
          <Textarea
            placeholder="List your certifications and qualifications..."
            value={metadata.certifications || ''}
            onChange={(e) => onChange({ ...metadata, certifications: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <Label>Class Schedule</Label>
          <Textarea
            placeholder="e.g., Monday 6AM - Yoga, Tuesday 7PM - HIIT..."
            value={metadata.class_schedule || ''}
            onChange={(e) => onChange({ ...metadata, class_schedule: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <Label>Pricing</Label>
          <Textarea
            placeholder="e.g., Single class: $20, Monthly: $150..."
            value={metadata.pricing || ''}
            onChange={(e) => onChange({ ...metadata, pricing: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    );
  }

  // Education Page Fields
  if (category === 'education') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Subjects/Courses</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add a subject or course"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('subjects'))}
            />
            <Button type="button" size="icon" onClick={() => addToList('subjects')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(metadata.subjects || []).map((subject: string, i: number) => (
              <div key={i} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <span className="text-sm">{subject}</span>
                <button onClick={() => removeFromList('subjects', i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Instructor Qualifications</Label>
          <Textarea
            placeholder="Describe your qualifications and experience..."
            value={metadata.qualifications || ''}
            onChange={(e) => onChange({ ...metadata, qualifications: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <Label>Course Duration</Label>
          <Input
            placeholder="e.g., 8 weeks, Self-paced, 6 months"
            value={metadata.duration || ''}
            onChange={(e) => onChange({ ...metadata, duration: e.target.value })}
          />
        </div>

        <div>
          <Label>Learning Format</Label>
          <Select
            value={metadata.format || ''}
            onValueChange={(value) => onChange({ ...metadata, format: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="in-person">In Person</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return null;
};
