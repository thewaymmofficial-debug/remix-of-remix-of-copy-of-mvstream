import { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SlideImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export default function SlideImageUpload({ imageUrl, onImageChange }: SlideImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('slide-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('slide-images')
        .getPublicUrl(fileName);

      onImageChange(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onImageChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="Image URL or upload below..."
          className="text-sm flex-1"
        />
        {imageUrl && (
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove} className="shrink-0 h-10 w-10">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>

      {imageUrl && (
        <div className="rounded-lg overflow-hidden border border-border h-32">
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
