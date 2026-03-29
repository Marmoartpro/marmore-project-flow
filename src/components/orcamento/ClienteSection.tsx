import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface Props {
  clienteNome: string;
  tipoAmbiente: string;
  dataOrcamento: string;
  validadeDias: string;
  nomeEmpresa: string;
  nomeResponsavel: string;
  enderecoEmpresa: string;
  telefoneEmpresa: string;
  onChange: (field: string, value: string) => void;
}

const ClienteSection = ({
  clienteNome, tipoAmbiente, dataOrcamento, validadeDias,
  nomeEmpresa, nomeResponsavel, enderecoEmpresa, telefoneEmpresa,
  onChange,
}: Props) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-display flex items-center gap-2">
        <User className="w-4 h-4 text-primary" /> Dados do Cliente e Empresa
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nome do cliente *</Label>
          <Input value={clienteNome} onChange={e => onChange('clienteNome', e.target.value)} className="h-8 text-sm" placeholder="Nome completo" />
        </div>
        <div>
          <Label className="text-xs">Tipo de ambiente / projeto</Label>
          <Input value={tipoAmbiente} onChange={e => onChange('tipoAmbiente', e.target.value)} className="h-8 text-sm" placeholder="Ex: Reforma cozinha e banheiro" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Data do orçamento</Label>
          <Input type="date" value={dataOrcamento} onChange={e => onChange('dataOrcamento', e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Validade (dias)</Label>
          <Input type="number" min="1" value={validadeDias} onChange={e => onChange('validadeDias', e.target.value)} className="h-8 text-sm" />
        </div>
      </div>

      {/* Company / Responsible fields for PDF */}
      <div className="border-t border-border pt-3 mt-2">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase font-medium">Dados da empresa (aparecem no PDF)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nome da empresa para o PDF</Label>
            <Input value={nomeEmpresa} onChange={e => onChange('nomeEmpresa', e.target.value)} className="h-8 text-sm" placeholder="Marmoraria Artesanal" />
          </div>
          <div>
            <Label className="text-xs">Nome do responsável (assinatura)</Label>
            <Input value={nomeResponsavel} onChange={e => onChange('nomeResponsavel', e.target.value)} className="h-8 text-sm" placeholder="Seu nome completo" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs">Endereço da empresa</Label>
            <Input value={enderecoEmpresa} onChange={e => onChange('enderecoEmpresa', e.target.value)} className="h-8 text-sm" placeholder="Rua, nº - Cidade/UF" />
          </div>
          <div>
            <Label className="text-xs">Telefone / WhatsApp</Label>
            <Input value={telefoneEmpresa} onChange={e => onChange('telefoneEmpresa', e.target.value)} className="h-8 text-sm" placeholder="(16) 99330-1423" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ClienteSection;
