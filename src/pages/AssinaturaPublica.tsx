import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Loader2, AlertTriangle, Download } from 'lucide-react';
import SignatureCanvas from '@/components/assinatura/SignatureCanvas';
import { fmt } from '@/components/orcamento/types';
import jsPDF from 'jspdf';

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
  const [contractText, setContractText] = useState('');
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState('');
  const contractScrollRef = useRef<HTMLDivElement>(null);

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
      setSignedPdfUrl((sig as any).signed_pdf_url || '');
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

    // Load contract text if it's a contract
    if (sig.document_type === 'contrato' && doc) {
      setContractText((doc as any).contract_text || '');
    }

    setLoading(false);
  };

  const handleContractScroll = useCallback(() => {
    const el = contractScrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToEnd(true);
    }
  }, []);

  const isContract = signature?.document_type === 'contrato';
  const canAccept = isContract ? scrolledToEnd : true;

  const generateSignedPdf = async (sigName: string, sigImage: string, sigIp: string, sigLocation: string): Promise<string | null> => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const mL = 20, mR = 20;
      const cW = pageW - mL - mR;
      let y = 20;

      // Header
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('CONTRATO ASSINADO DIGITALMENTE', pageW / 2, y, { align: 'center' });
      y += 10;

      doc.setDrawColor(180);
      doc.line(mL, y, pageW - mR, y);
      y += 8;

      // Contract text
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      const textLines = contractText.split('\n');
      for (const line of textLines) {
        if (y > pageH - 25) { doc.addPage(); y = 20; }
        if (line.startsWith('═══')) {
          doc.setFont('times', 'bold');
          doc.setFontSize(11);
          const clean = line.replace(/═/g, '').trim();
          doc.text(clean, pageW / 2, y, { align: 'center' });
          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          y += 7;
        } else {
          const wrapped = doc.splitTextToSize(line || ' ', cW);
          for (const wl of wrapped) {
            if (y > pageH - 25) { doc.addPage(); y = 20; }
            doc.text(wl, mL, y);
            y += 4.5;
          }
        }
      }

      // Signature page
      doc.addPage();
      y = 30;

      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('FOLHA DE ASSINATURA DIGITAL', pageW / 2, y, { align: 'center' });
      y += 15;

      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      const now = new Date();
      const signedAt = now.toLocaleString('pt-BR');

      const infoLines = [
        `Signatário: ${sigName}`,
        `Data e hora: ${signedAt}`,
        `IP registrado: ${sigIp || 'Não capturado'}`,
        `Localização: ${sigLocation || 'Não capturada'}`,
        `Token de verificação: ${token}`,
      ];

      infoLines.forEach(line => {
        doc.text(line, mL, y);
        y += 6;
      });

      y += 10;

      // Add signature image
      if (sigImage) {
        doc.text('Assinatura:', mL, y);
        y += 5;
        try {
          doc.addImage(sigImage, 'PNG', mL, y, 80, 30);
          y += 35;
        } catch {
          doc.text('[Assinatura digital registrada]', mL, y);
          y += 8;
        }
      }

      y += 10;
      doc.setDrawColor(180);
      doc.line(mL, y, pageW - mR, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text('Este documento foi assinado digitalmente. A assinatura, data, hora e IP foram registrados eletronicamente.', mL, y);

      // Add footers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`${i}/${totalPages}`, pageW - mR, pageH - 6, { align: 'right' });
        doc.text('Documento assinado digitalmente', mL, pageH - 6);
      }

      // Convert to blob and upload
      const pdfBlob = doc.output('blob');
      const fileName = `assinado-${token}.pdf`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Error generating signed PDF:', err);
      return null;
    }
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

      // Generate signed PDF if contract
      let pdfUrl = '';
      if (isContract && contractText) {
        const url = await generateSignedPdf(signerName, signatureImage, ip, location);
        if (url) pdfUrl = url;
      }

      await supabase
        .from('digital_signatures')
        .update({
          signer_name: signerName,
          signer_ip: ip,
          signer_location: location,
          signature_image: signatureImage,
          signed_at: new Date().toISOString(),
          status: 'assinado',
          ...(pdfUrl ? { signed_pdf_url: pdfUrl } : {}),
        } as any)
        .eq('sign_token', token);

      // Update document status
      if (isContract) {
        const updatePayload: any = { status: 'assinado' };
        if (pdfUrl) updatePayload.signed_pdf_url = pdfUrl;
        await supabase.from('contracts').update(updatePayload).eq('id', signature.document_id);
      } else {
        await supabase.from('budget_quotes').update({ status: 'aceito' }).eq('id', signature.document_id);
      }

      setSignedPdfUrl(pdfUrl);
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
            {(signedPdfUrl || (signature as any)?.signed_pdf_url) && (
              <Button
                className="w-full mt-3"
                variant="outline"
                onClick={() => window.open(signedPdfUrl || (signature as any)?.signed_pdf_url, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" /> Baixar contrato assinado
              </Button>
            )}
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
                {isContract ? 'Contrato' : 'Orçamento'} — {document?.client_name}
              </p>
            </div>

            {/* Contract full text with scroll requirement */}
            {isContract && contractText ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-warning/10 text-warning-foreground border border-warning/30 rounded-md p-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Leia o contrato completo antes de assinar. Role até o final para habilitar a assinatura.</span>
                </div>
                <div
                  ref={contractScrollRef}
                  onScroll={handleContractScroll}
                  className="bg-muted/30 border border-border rounded-md p-4 text-xs whitespace-pre-wrap overflow-y-auto font-mono leading-relaxed"
                  style={{ maxHeight: '55vh' }}
                >
                  {contractText}
                </div>
                {!scrolledToEnd && (
                  <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                    ↓ Role até o final do contrato para continuar ↓
                  </p>
                )}
              </div>
            ) : (
              /* Document summary for budget quotes */
              document && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {document.client_name}</p>
                  <p><strong>Valor total:</strong> R$ {fmt(Number(document.total || document.total_value || 0))}</p>
                  {document.payment_conditions && (
                    <p><strong>Pagamento:</strong> {document.payment_conditions}</p>
                  )}
                  {document.quote_number && <p><strong>Nº:</strong> {document.quote_number}</p>}
                  {document.contract_number && <p><strong>Nº:</strong> {document.contract_number}</p>}
                </div>
              )
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
            <div className={`flex items-start gap-2 transition-opacity duration-300 ${canAccept ? 'opacity-100' : 'opacity-40'}`}>
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                disabled={!canAccept}
              />
              <label htmlFor="accept" className={`text-xs cursor-pointer ${canAccept ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                Declaro que li e aceito os termos deste {isContract ? 'contrato' : 'orçamento'}.
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
