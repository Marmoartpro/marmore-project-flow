import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  stone: any;
}

const ShareStoneModal = ({ open, onClose, stone }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!open || !stone) return;
    const stoneUrl = `${window.location.origin}/mostruario/${stone.id}`;
    setUrl(stoneUrl);
    setTimeout(() => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, stoneUrl, { width: 200, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } });
      }
    }, 100);
  }, [open, stone]);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá! Segue a ficha técnica do *${stone.name}* do nosso mostruário: ${url}${stone.pros ? `\n\nPrós: ${stone.pros}` : ''}${stone.usage_indication ? `\nIdeal para: ${stone.usage_indication}` : ''}\n\nQualquer dúvida estou à disposição!`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Compartilhar {stone?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} className="rounded-lg" />
          <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-1 text-xs" onClick={copyLink}>
              <Copy className="w-3.5 h-3.5" /> Copiar link
            </Button>
            <Button className="flex-1 gap-1 text-xs" onClick={sendWhatsApp}>
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStoneModal;
