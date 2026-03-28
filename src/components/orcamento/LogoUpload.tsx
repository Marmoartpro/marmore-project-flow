import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  logoUrl: string | null;
  onUpdate: (url: string) => void;
}

const LogoUpload = ({ logoUrl, onUpdate }: Props) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${user.id}/company-logo.${ext}`;
      const { error } = await supabase.storage.from('project-files').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(path);
      // Save to profile
      await supabase.from('profiles').update({ company_logo_url: urlData.publicUrl }).eq('user_id', user.id);
      onUpdate(urlData.publicUrl);
      toast.success('Logo atualizada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium flex items-center gap-1">
        <Image className="w-3 h-3" /> Logo da Marmoraria (para orçamentos)
      </Label>
      {logoUrl ? (
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-12 w-auto rounded border border-border object-contain bg-white p-1" />
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => inputRef.current?.click()}>
            {uploading ? 'Enviando...' : 'Trocar logo'}
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => inputRef.current?.click()}>
          <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground">{uploading ? 'Enviando...' : 'Clique para enviar a logo da sua empresa'}</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
    </div>
  );
};

export default LogoUpload;
