import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface Props {
  clienteNome: string;
  tipoAmbiente: string;
  dataOrcamento: string;
  validadeDias: string;
  onChange: (field: string, value: string) => void;
}

const ClienteSection = ({ clienteNome, tipoAmbiente, dataOrcamento, validadeDias, onChange }: Props) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-display flex items-center gap-2">
        <User className="w-4 h-4 text-primary" /> Dados do Cliente e Projeto
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nome do cliente *</Label>
          <Input value={clienteNome} onChange={e => onChange('clienteNome', e.target.value)} className="h-8 text-sm" placeholder="Nome completo" />
        </div>
        <div>
          <Label className="text-xs">Tipo de ambiente principal</Label>
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
    </CardContent>
  </Card>
);

export default ClienteSection;
