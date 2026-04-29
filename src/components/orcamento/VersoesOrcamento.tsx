import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Trash2, Copy, Check, Pencil } from 'lucide-react';
import {
  Ambiente, AcessorioItem,
  calcAmbienteMaterialCost, calcAmbienteLaborCost, calcAmbienteInstallCost, fmt,
} from './types';

export interface VersaoOrcamento {
  id: string;
  nome: string;
  ambientes: Ambiente[];
  acessorios: AcessorioItem[];
}

interface Props {
  versoes: VersaoOrcamento[];
  versaoAtivaId: string;
  versaoPrincipalNome: string;
  // Estado "principal" (em edição)
  ambientesAtuais: Ambiente[];
  acessoriosAtuais: AcessorioItem[];
  // Margens (compartilhadas entre versões para comparação consistente)
  margemMaterial: number;
  margemServicos: number;
  margemAcessorios: number;
  margemInstalacao: number;
  descontoValor: string;
  descontoTipo: 'percent' | 'reais';
  // Callbacks
  onSetVersaoAtiva: (id: string) => void;
  onSaveCurrentTo: (id: string) => void; // salva ambientes/acessorios atuais na versão indicada
  onCreateVersao: (nome: string) => void; // duplica atual como nova versão
  onRenameVersao: (id: string, nome: string) => void;
  onRemoveVersao: (id: string) => void;
  onSetPrincipalNome: (nome: string) => void;
}

const calcVersaoTotal = (
  ambs: Ambiente[],
  acessorios: AcessorioItem[],
  margemMaterial: number,
  margemServicos: number,
  margemAcessorios: number,
  margemInstalacao: number,
  descontoValor: string,
  descontoTipo: 'percent' | 'reais',
) => {
  const subMat = ambs.reduce((s, a) => s + calcAmbienteMaterialCost(a, 0), 0);
  const subLab = ambs.reduce((s, a) => s + calcAmbienteLaborCost(a), 0);
  const subAcc = acessorios.reduce((s, a) => s + (parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0), 0);
  const subInst = ambs.reduce((s, a) => s + calcAmbienteInstallCost(a), 0);
  const matM = subMat * (1 + margemMaterial / 100);
  const labM = subLab * (1 + margemServicos / 100);
  const accM = subAcc * (1 + margemAcessorios / 100);
  const instM = subInst * (1 + margemInstalacao / 100);
  const bruto = matM + labM + accM + instM;
  const desc = descontoTipo === 'percent' ? bruto * ((parseFloat(descontoValor) || 0) / 100) : (parseFloat(descontoValor) || 0);
  return { material: matM, servicos: labM, acessorios: accM, instalacao: instM, bruto, desconto: desc, total: bruto - desc };
};

const VersoesOrcamento = ({
  versoes, versaoAtivaId, versaoPrincipalNome,
  ambientesAtuais, acessoriosAtuais,
  margemMaterial, margemServicos, margemAcessorios, margemInstalacao,
  descontoValor, descontoTipo,
  onSetVersaoAtiva, onSaveCurrentTo, onCreateVersao,
  onRenameVersao, onRemoveVersao, onSetPrincipalNome,
}: Props) => {
  const [novoNome, setNovoNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');

  const PRINCIPAL_ID = 'principal';
  const isPrincipalAtiva = versaoAtivaId === PRINCIPAL_ID;

  // Para comparação: a versão "principal" usa o estado atual; as outras usam seus snapshots
  const todasVersoes: { id: string; nome: string; ambientes: Ambiente[]; acessorios: AcessorioItem[]; isPrincipal: boolean }[] = [
    {
      id: PRINCIPAL_ID,
      nome: versaoPrincipalNome || 'Versão Principal',
      ambientes: isPrincipalAtiva ? ambientesAtuais : (versoes.find(v => v.id === PRINCIPAL_ID)?.ambientes || ambientesAtuais),
      acessorios: isPrincipalAtiva ? acessoriosAtuais : (versoes.find(v => v.id === PRINCIPAL_ID)?.acessorios || acessoriosAtuais),
      isPrincipal: true,
    },
    ...versoes.filter(v => v.id !== PRINCIPAL_ID).map(v => ({
      id: v.id,
      nome: v.nome,
      ambientes: v.id === versaoAtivaId ? ambientesAtuais : v.ambientes,
      acessorios: v.id === versaoAtivaId ? acessoriosAtuais : v.acessorios,
      isPrincipal: false,
    })),
  ];

  const handleCreate = () => {
    const nome = novoNome.trim() || `Versão ${todasVersoes.length}`;
    onCreateVersao(nome);
    setNovoNome('');
  };

  const handleSwitch = (newId: string) => {
    if (newId === versaoAtivaId) return;
    // salva o estado atual na versão ativa antes de trocar
    onSaveCurrentTo(versaoAtivaId);
    onSetVersaoAtiva(newId);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Versões do Orçamento</Label>
          <Badge variant="outline" className="text-[10px]">{todasVersoes.length} versão(ões)</Badge>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Crie variações no mesmo orçamento (ex: "Com ilhargas" / "Sem ilhargas"). Edite uma versão por vez — ao trocar, o que está na tela é salvo automaticamente na versão atual. O cliente verá as duas no PDF.
        </p>

        {/* Lista de versões */}
        <div className="space-y-1.5">
          {todasVersoes.map(v => {
            const ativa = v.id === versaoAtivaId;
            const isEditing = editingId === v.id;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-2 p-2 rounded-md border ${ativa ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
              >
                {ativa ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0" />
                )}
                {isEditing ? (
                  <>
                    <Input
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                      className="h-7 text-xs flex-1"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (v.isPrincipal) onSetPrincipalNome(editNome.trim() || 'Versão Principal');
                          else onRenameVersao(v.id, editNome.trim() || v.nome);
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <Button size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => {
                        if (v.isPrincipal) onSetPrincipalNome(editNome.trim() || 'Versão Principal');
                        else onRenameVersao(v.id, editNome.trim() || v.nome);
                        setEditingId(null);
                      }}>OK</Button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSwitch(v.id)}
                      className="flex-1 text-left text-xs font-medium truncate"
                    >
                      {v.nome}
                      {ativa && <span className="ml-2 text-[10px] text-primary">(editando)</span>}
                    </button>
                    <Button size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => { setEditingId(v.id); setEditNome(v.nome); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    {!v.isPrincipal && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                        onClick={() => {
                          if (!confirm(`Remover a versão "${v.nome}"?`)) return;
                          onRemoveVersao(v.id);
                        }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Adicionar nova versão */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Ex: Sem ilhargas, Com cuba esculpida..."
            className="h-8 text-xs"
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
          />
          <Button size="sm" variant="outline" onClick={handleCreate} className="h-8">
            <Copy className="w-3 h-3 mr-1" /> Duplicar atual
          </Button>
        </div>

        {/* Tabela comparativa */}
        {todasVersoes.length > 1 && (
          <div className="border border-border rounded-md overflow-x-auto mt-2">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-2 py-1.5">Versão</th>
                  <th className="text-right px-2 py-1.5">Material</th>
                  <th className="text-right px-2 py-1.5">Serviços</th>
                  <th className="text-right px-2 py-1.5">Instalação</th>
                  <th className="text-right px-2 py-1.5">Acessórios</th>
                  <th className="text-right px-2 py-1.5 font-bold text-primary">Total</th>
                </tr>
              </thead>
              <tbody>
                {todasVersoes.map(v => {
                  const t = calcVersaoTotal(
                    v.ambientes, v.acessorios,
                    margemMaterial, margemServicos, margemAcessorios, margemInstalacao,
                    descontoValor, descontoTipo,
                  );
                  return (
                    <tr key={v.id} className={`border-t border-border ${v.id === versaoAtivaId ? 'bg-primary/5' : ''}`}>
                      <td className="px-2 py-1.5 font-medium">{v.nome}</td>
                      <td className="text-right px-2 py-1.5">R$ {fmt(t.material)}</td>
                      <td className="text-right px-2 py-1.5">R$ {fmt(t.servicos)}</td>
                      <td className="text-right px-2 py-1.5">R$ {fmt(t.instalacao)}</td>
                      <td className="text-right px-2 py-1.5">R$ {fmt(t.acessorios)}</td>
                      <td className="text-right px-2 py-1.5 font-bold text-primary">R$ {fmt(t.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { calcVersaoTotal };
export default VersoesOrcamento;
