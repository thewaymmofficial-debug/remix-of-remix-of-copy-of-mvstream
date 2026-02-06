import { useState, useRef } from 'react';
import { Plus, X, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadCastPhoto } from '@/hooks/useCast';
import { toast } from 'sonner';

export interface CastEntry {
  name: string;
  character_name: string;
  photo_url: string | null;
  existing_cast_member_id?: string;
}

interface CastManagerProps {
  entries: CastEntry[];
  onChange: (entries: CastEntry[]) => void;
}

export function CastManager({ entries, onChange }: CastManagerProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addEntry = () => {
    onChange([...entries, { name: '', character_name: '', photo_url: null }]);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof CastEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed');
      return;
    }

    setUploadingIndex(index);
    try {
      const url = await uploadCastPhoto(file);
      const updated = [...entries];
      updated[index] = { ...updated[index], photo_url: url };
      onChange(updated);
      toast.success('Photo uploaded');
    } catch (error) {
      console.error('Cast photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Cast Members</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Cast
        </Button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
          No cast members added. Click "Add Cast" to start.
        </p>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {entries.map((entry, index) => (
          <div key={index} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg border border-border">
            {/* Photo */}
            <div className="flex-shrink-0">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[index] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(index, file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current[index]?.click()}
                disabled={uploadingIndex === index}
                className="w-14 h-14 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden"
              >
                {uploadingIndex === index ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : entry.photo_url ? (
                  <img src={entry.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-2 min-w-0">
              <Input
                placeholder="Actor name"
                value={entry.name}
                onChange={(e) => updateEntry(index, 'name', e.target.value)}
                className="bg-background h-8 text-sm"
              />
              <Input
                placeholder="Character name (optional)"
                value={entry.character_name}
                onChange={(e) => updateEntry(index, 'character_name', e.target.value)}
                className="bg-background h-8 text-sm"
              />
            </div>

            {/* Remove */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-8 h-8 text-destructive"
              onClick={() => removeEntry(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
