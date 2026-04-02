import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Loader2 } from 'lucide-react';
import SignatureCanvas from '@/components/assinatura/SignatureCanvas';
import { fmt } from '@/components/orcamento/types';

const AssinaturaPublica = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [signerName, setSignerName] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    loadSignature();
  }, [token]);

  const loadSignature = async () => {
    setLoading(true);
    const { data: sig } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('sign_token', token)
      .single();

    if (!sig) {
      setError('Link de assinatura inválido ou expirado.');
      setLoading(false);
      return;
    }

    if (sig.status === 'assinado') {
      setSigned(true);
      setSignature(sig);
      setLoading(false);
      return;
    }

    if (new Date(sig.expires_at) < new Date()) {
      setError('Este link de assinatura expirou.');
      setLoading(false);
      return;
    }

    setSignature(sig);

    // Load document
    const table = sig.document_type === 'contrato' ? 'contracts' : 'budget_quotes';
    const { data: doc } = await supabase.from(table).select('*').eq('id', sig.document_id).single();
    setDocument(doc);
    setLoading(false);
  };

  const handleSign = async () => {
    if (!signerName || !signatureImage || !accepted) return;
    setSigning(true);

    try {
      // Get IP
      let ip = '';
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        ip = data.ip;
      } catch {}

      // Get location
      let location = '';
      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          location = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        }
      } catch {}

      await supabase
        .from('digital_signatures')
        .update({
          signer_name: signerName,
          signer_ip: ip,
          signer_location: location,
          signature_image: signatureImage,
          signed_at: new Date().toISOString(),
          status: 'assinado',
        } as any)
        .eq('sign_token', token);

      // Update document status
      if (signature.document_type === 'contrato') {
        await supabase.from('contracts').update({ status: 'assinado' } as any).eq('id', signature.document_id);
      } else {
        await supabase.from('budget_quotes').update({ status: 'aceito' }).eq('id', signature.document_id);
      }

      setSigned(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao assinar');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-lg font-bold">Documento Assinado!</h2>
            <p className="text-sm text-muted-foreground">
              Assinado por <strong>{signature?.signer_name || signerName}</strong> em{' '}
              {signature?.signed_at ? new Date(signature.signed_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
            </p>
            <Badge className="bg-primary/20 text-primary">Assinado digitalmente</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <FileText className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-lg font-bold">Assinatura Digital</h2>
              <p className="text-xs text-muted-foreground">
                {signature?.document_type === 'contrato' ? 'Contrato' : 'Orçamento'} — {document?.client_name}
              </p>
            </div>

            {/* Document summary */}
            {document && (
              <div className="bg-muted/50 rounded-md p-3 space-y-2 text-sm">
                <p><strong>Cliente:</strong> {document.client_name}</p>
                <p><strong>Valor total:</strong> R$ {fmt(Number(document.total || document.total_value || 0))}</p>
                {document.payment_conditions && (
                  <p><strong>Pagamento:</strong> {document.payment_conditions}</p>
                )}
                {document.quote_number && <p><strong>Nº:</strong> {document.quote_number}</p>}
                {document.contract_number && <p><strong>Nº:</strong> {document.contract_number}</p>}
              </div>
            )}

            {/* Signer name */}
            <div>
              <Label className="text-xs">Nome completo *</Label>
              <Input
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="h-9 text-sm"
              />
            </div>

            {/* Signature */}
            <div>
              <Label className="text-xs mb-2 block">Sua assinatura *</Label>
              <SignatureCanvas onSignature={setSignatureImage} />
            </div>

            {/* Accept terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
              />
              <label htmlFor="accept" className="text-xs text-muted-foreground cursor-pointer">
                Declaro que li e aceito os termos deste {signature?.document_type === 'contrato' ? 'contrato' : 'orçamento'}.
              </label>
            </div>

            <Button
              className="w-full"
              onClick={handleSign}
              disabled={signing || !signerName || !signatureImage || !accepted}
            >
              {signing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Assinando...</> : 'Assinar e confirmar'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground">
          Ao assinar, seu nome, data/hora e endereço IP serão registrados para fins de validade jurídica.
        </p>
      </div>
    </div>
  );
};

export default AssinaturaPublica;
