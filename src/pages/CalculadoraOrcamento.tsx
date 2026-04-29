import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Calculator, Plus, Save, Trash2, FileText, Clock, Sparkles, LayoutTemplate } from 'lucide-react';
import { generateOrcamentoPdf } from '@/components/orcamento/generatePdf';
import { toast } from 'sonner';
import ClienteSection from '@/components/orcamento/ClienteSection';
import AmbienteBlock from '@/components/orcamento/AmbienteBlock';
import AcessoriosSection from '@/components/orcamento/AcessoriosSection';
import TotaisSection from '@/components/orcamento/TotaisSection';
import LogoUpload from '@/components/orcamento/LogoUpload';
import ResumoConsumo from '@/components/orcamento/ResumoConsumo';
import {
  OrcamentoData, Ambiente, AcessorioItem, PecaItem,
  AMBIENTE_TIPOS, newAmbiente, newAcessorio, newPeca,
  calcAmbienteMaterialCost, calcAmbienteLaborCost, calcAmbienteInstallCost, gerarAlertas, fmt,
} from '@/components/orcamento/types';
import AlertasOrcamento from '@/components/orcamento/AlertasOrcamento';
import SmartBudgetGenerator from '@/components/orcamento/SmartBudgetGenerator';
import AIReviewButton from '@/components/orcamento/AIReviewButton';
import BudgetTemplates from '@/components/orcamento/BudgetTemplates';
import VersoesOrcamento, { VersaoOrcamento } from '@/components/orcamento/VersoesOrcamento';

const today = () => new Date().toISOString().split('T')[0];

const CalculadoraOrcamento = () => {
  const { user, profile } = useAuth();
  const [resolvedOwnerId, setResolvedOwnerId] = useState<string | null>(null);
  const { quoteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDuplicate = searchParams.get('duplicate') === 'true';
  const openAI = searchParams.get('ai') === 'true';

  const [showAIGenerator, setShowAIGenerator] = useState(openAI);
  const [showTemplates, setShowTemplates] = useState(false);

  const [stones, setStones] = useState<any[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(quoteId || null);
  const [editingVersion, setEditingVersion] = useState(1);
  const [editingQuoteNumber, setEditingQuoteNumber] = useState('');

  // Orcamento state
  const [clienteNome, setClienteNome] = useState('');
  const [tipoAmbiente, setTipoAmbiente] = useState('');
  const [dataOrcamento, setDataOrcamento] = useState(today());
  const [validadeDias, setValidadeDias] = useState('15');
  const [ambientes, setAmbientes] = useState<Ambiente[]>([newAmbiente('Cozinha')]);
  const [acessorios, setAcessorios] = useState<AcessorioItem[]>([newAcessorio()]);
  const [margemMaterial, setMargemMaterial] = useState(30);
  const [margemServicos, setMargemServicos] = useState(30);
  const [margemAcessorios, setMargemAcessorios] = useState(30);
  const [margemInstalacao, setMargemInstalacao] = useState(20);
  const [descontoValor, setDescontoValor] = useState('');
  const [descontoTipo, setDescontoTipo] = useState<'percent' | 'reais'>('percent');
  const [condicoesPagamento, setCondicoesPagamento] = useState('Entrada 40%, parcela intermediária 30%, saldo na conclusão 30%');
  const [observacoes, setObservacoes] = useState('');
  const [showAddAmbiente, setShowAddAmbiente] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState('Marmoraria Artesanal');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [enderecoEmpresa, setEnderecoEmpresa] = useState('');
  const [telefoneEmpresa, setTelefoneEmpresa] = useState('');

  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const draftIdRef = useRef<string | null>(null);
  const loadedRef = useRef(false);

  // Load existing quote for editing
  useEffect(() => {
    if (!user || !quoteId || loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      const { data } = await supabase.from('budget_quotes').select('*').eq('id', quoteId).single();
      if (!data) { toast.error('Orçamento não encontrado'); return; }
      const d = data.data as any;
      setClienteNome(data.client_name || '');
      setTipoAmbiente(data.environment_type || '');
      setDataOrcamento(data.quote_date || today());
      setValidadeDias(String(data.validity_days || 15));
      if (d?.ambientes) setAmbientes(d.ambientes);
      if (d?.acessorios) setAcessorios(d.acessorios);
      setMargemMaterial(d?.margemMaterial ?? data.profit_margin_percent ?? 30);
      setMargemServicos(d?.margemServicos ?? 30);
      setMargemAcessorios(d?.margemAcessorios ?? 30);
      setMargemInstalacao(d?.margemInstalacao ?? 20);
      setDescontoValor(String(data.discount || ''));
      setDescontoTipo((data.discount_type as any) || 'percent');
      setCondicoesPagamento(data.payment_conditions || '');
      setObservacoes(data.observations || '');
      setNomeEmpresa(d?.nomeEmpresa || 'Marmoraria Artesanal');
      setNomeResponsavel(d?.nomeResponsavel || '');
      setEnderecoEmpresa(d?.enderecoEmpresa || '');
      setTelefoneEmpresa(d?.telefoneEmpresa || '');

      if (isDuplicate) {
        setEditingQuoteId(null);
        setEditingVersion(1);
        setEditingQuoteNumber('');
        toast.info('Orçamento duplicado — salve como novo');
      } else {
        setEditingQuoteId(data.id);
        setEditingVersion(data.version || 1);
        setEditingQuoteNumber(data.quote_number);
      }
    })();
  }, [user, quoteId, isDuplicate]);

  // FIX #6: Resolve owner_id for team members (vendedor)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: member } = await supabase
        .from('team_members').select('owner_id').eq('user_id', user.id).eq('active', true).maybeSingle();
      setResolvedOwnerId(member?.owner_id || user.id);
    })();
    supabase.from('stones').select('id, name, price_per_m2, category').order('name').then(({ data }) => setStones(data || []));
  }, [user]);

  useEffect(() => {
    if (profile) setCompanyLogo((profile as any).company_logo_url || null);
  }, [profile]);

  // Auto-save to Supabase every 15s
  useEffect(() => {
    if (!user || !clienteNome) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = buildPayload('rascunho');
        if (draftIdRef.current && !editingQuoteId) {
          await supabase.from('budget_quotes').update(payload).eq('id', draftIdRef.current);
        } else if (!editingQuoteId) {
          const { data } = await supabase.from('budget_quotes').insert([{ ...payload, quote_number: generateQuoteNumber() }]).select('id').single();
          if (data) draftIdRef.current = data.id;
        }
        const now = new Date();
        setAutoSaveStatus(`Rascunho salvo às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      } catch {}
    }, 15000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [clienteNome, tipoAmbiente, ambientes, acessorios, margemMaterial, margemServicos, margemAcessorios, margemInstalacao, descontoValor, observacoes]);

  // Auto-add marble warning
  useEffect(() => {
    const hasMarble = ambientes.some(amb =>
      amb.materialOptions.some(opt => {
        const stone = stones.find(s => s.id === opt.stoneId);
        return stone?.category === 'Mármore';
      })
    );
    if (hasMarble && !observacoes.includes('naturalmente poroso')) {
      const marbleName = ambientes.flatMap(a => a.materialOptions)
        .map(opt => stones.find(s => s.id === opt.stoneId))
        .find(s => s?.category === 'Mármore')?.name || 'mármore selecionado';
      setObservacoes(prev => {
        const warning = `Ao optar pelo ${marbleName}, lembramos que ele é um material naturalmente poroso e mais sensível a ácidos e pigmentos. Seu uso requer cuidados redobrados e manutenção constante.`;
        return prev ? `${prev}\n\n${warning}` : warning;
      });
    }
  }, [ambientes, stones]);

  const handleClienteChange = (field: string, value: string) => {
    if (field === 'clienteNome') setClienteNome(value);
    if (field === 'tipoAmbiente') setTipoAmbiente(value);
    if (field === 'dataOrcamento') setDataOrcamento(value);
    if (field === 'validadeDias') setValidadeDias(value);
    if (field === 'nomeEmpresa') setNomeEmpresa(value);
    if (field === 'nomeResponsavel') setNomeResponsavel(value);
    if (field === 'enderecoEmpresa') setEnderecoEmpresa(value);
    if (field === 'telefoneEmpresa') setTelefoneEmpresa(value);
  };

  const updateAmbiente = (id: string, amb: Ambiente) => {
    setAmbientes(prev => prev.map(a => a.id === id ? amb : a));
  };
  const removeAmbiente = (id: string) => {
    if (ambientes.length <= 1) return;
    setAmbientes(prev => prev.filter(a => a.id !== id));
  };
  const addAmbiente = (tipo: string) => {
    setAmbientes(prev => [...prev, newAmbiente(tipo)]);
    setShowAddAmbiente(false);
  };

  // Totals
  const subtotalMaterials = ambientes.reduce((sum, amb) => sum + calcAmbienteMaterialCost(amb, 0), 0);
  const subtotalLabor = ambientes.reduce((sum, amb) => sum + calcAmbienteLaborCost(amb), 0);
  const subtotalAccessories = acessorios.reduce((sum, a) => sum + (parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0), 0);
  const subtotalInstallation = ambientes.reduce((sum, amb) => sum + calcAmbienteInstallCost(amb), 0);

  const generateQuoteNumber = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const initials = clienteNome.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 2) || 'XX';
    return `${y}-${m}-${day}-${initials}-V1`;
  };

  const buildPayload = (status: string) => {
    const materialComMargem = subtotalMaterials * (1 + margemMaterial / 100);
    const servicosComMargem = subtotalLabor * (1 + margemServicos / 100);
    const acessoriosComMargem = subtotalAccessories * (1 + margemAcessorios / 100);
    const instalacaoComMargem = subtotalInstallation * (1 + margemInstalacao / 100);
    const totalBruto = materialComMargem + servicosComMargem + acessoriosComMargem + instalacaoComMargem;
    const desconto = descontoTipo === 'percent'
      ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
      : (parseFloat(descontoValor) || 0);
    const totalFinal = totalBruto - desconto;

    return {
      owner_id: resolvedOwnerId || user!.id,
      client_name: clienteNome,
      environment_type: tipoAmbiente,
      quote_date: dataOrcamento,
      validity_days: parseInt(validadeDias) || 15,
      data: JSON.parse(JSON.stringify({
        ambientes, acessorios, condicoesPagamento, observacoes,
        margemMaterial, margemServicos, margemAcessorios, margemInstalacao,
        nomeEmpresa, nomeResponsavel, enderecoEmpresa, telefoneEmpresa,
      })),
      subtotal_materials: subtotalMaterials,
      subtotal_labor: subtotalLabor,
      subtotal_accessories: subtotalAccessories,
      subtotal_installation: subtotalInstallation,
      profit_margin_percent: margemMaterial,
      discount: parseFloat(descontoValor) || 0,
      discount_type: descontoTipo,
      total: totalFinal,
      payment_conditions: condicoesPagamento,
      observations: observacoes,
      status,
    };
  };

  const saveOrcamento = async () => {
    if (!user || !clienteNome) { toast.error('Informe o nome do cliente'); return; }
    setSaving(true);
    try {
      if (editingQuoteId) {
        // Create new version
        const newVersion = editingVersion + 1;
        const newNumber = editingQuoteNumber.replace(/V\d+$/, `V${newVersion}`);
        const payload = { ...buildPayload('rascunho'), version: newVersion, quote_number: newNumber };
        await supabase.from('budget_quotes').update(payload).eq('id', editingQuoteId);
        setEditingVersion(newVersion);
        setEditingQuoteNumber(newNumber);
        toast.success(`Orçamento atualizado para V${newVersion}!`);
      } else {
        const quoteNumber = generateQuoteNumber();
        const payload = { ...buildPayload('rascunho'), quote_number: quoteNumber };
        const { data, error } = await supabase.from('budget_quotes').insert([payload]).select('id').single();
        if (error) throw error;
        setEditingQuoteId(data.id);
        setEditingQuoteNumber(quoteNumber);
        // Remove draft if different
        if (draftIdRef.current && draftIdRef.current !== data.id) {
          await supabase.from('budget_quotes').delete().eq('id', draftIdRef.current);
        }
        draftIdRef.current = null;

        // Save client if new
        const ownerId = resolvedOwnerId || user.id;
        const { data: existing } = await supabase.from('clients').select('id').eq('owner_id', ownerId).eq('name', clienteNome).limit(1);
        if (!existing || existing.length === 0) {
          await supabase.from('clients').insert({ owner_id: ownerId, name: clienteNome, service_type: tipoAmbiente });
        }
        toast.success('Orçamento salvo com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const limparTudo = () => {
    if (!confirm('Tem certeza que deseja limpar todos os campos?')) return;
    setClienteNome(''); setTipoAmbiente(''); setDataOrcamento(today()); setValidadeDias('15');
    setAmbientes([newAmbiente('Cozinha')]); setAcessorios([newAcessorio()]);
    setMargemMaterial(30); setMargemServicos(30); setMargemAcessorios(30); setMargemInstalacao(20);
    setDescontoValor(''); setDescontoTipo('percent');
    setCondicoesPagamento('Entrada 40%, parcela intermediária 30%, saldo na conclusão 30%');
    setObservacoes(''); setEditingQuoteId(null); setEditingVersion(1); setEditingQuoteNumber('');
    draftIdRef.current = null;
    toast.success('Campos limpos!');
  };

  const handleGeneratePdf = async () => {
    if (!clienteNome) { toast.error('Informe o nome do cliente'); return; }
    setGeneratingPdf(true);
    try {
      await generateOrcamentoPdf({
        quoteNumber: editingQuoteNumber || generateQuoteNumber(),
        clienteNome, tipoAmbiente, dataOrcamento, validadeDias, ambientes, acessorios,
        subtotalMaterials, subtotalLabor, subtotalAccessories, subtotalInstallation,
        margemMaterial, margemServicos, margemAcessorios, margemInstalacao,
        descontoValor, descontoTipo, condicoesPagamento, observacoes,
        logoUrl: companyLogo, companyName: nomeEmpresa || 'Marmoraria Artesanal',
        responsibleName: nomeResponsavel, companyAddress: enderecoEmpresa,
        companyPhone: telefoneEmpresa || (profile as any)?.phone || '',
      });
      toast.success('PDF gerado!');
    } catch (err: any) { toast.error(err.message || 'Erro ao gerar PDF'); } finally { setGeneratingPdf(false); }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              {editingQuoteId ? `Editando ${editingQuoteNumber} (V${editingVersion})` : 'Calculadora de Orçamento'}
            </h2>
            {autoSaveStatus && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {autoSaveStatus}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)}>
              <LayoutTemplate className="w-4 h-4 mr-1" /> Templates
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAIGenerator(true)}>
              <Sparkles className="w-4 h-4 mr-1" /> Preencher com IA
            </Button>
            <AIReviewButton ambientes={ambientes} acessorios={acessorios} />
            <Button size="sm" variant="outline" onClick={limparTudo}>
              <Trash2 className="w-4 h-4 mr-1" /> Limpar
            </Button>
            <Button size="sm" variant="outline" onClick={handleGeneratePdf} disabled={generatingPdf || !clienteNome}>
              <FileText className="w-4 h-4 mr-1" /> {generatingPdf ? 'Gerando...' : 'Gerar PDF'}
            </Button>
            <Button size="sm" onClick={saveOrcamento} disabled={saving || !clienteNome}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : editingQuoteId ? 'Salvar nova versão' : 'Salvar orçamento'}
            </Button>
          </div>
        </div>

        {editingQuoteId && (
          <div className="bg-accent/50 border border-accent rounded-md px-3 py-2 text-xs text-accent-foreground">
            Editando orçamento Nº <strong>{editingQuoteNumber}</strong> — versão anterior disponível no histórico.
          </div>
        )}

        <LogoUpload logoUrl={companyLogo} onUpdate={setCompanyLogo} />

        <ClienteSection
          clienteNome={clienteNome} tipoAmbiente={tipoAmbiente} dataOrcamento={dataOrcamento}
          validadeDias={validadeDias} nomeEmpresa={nomeEmpresa} nomeResponsavel={nomeResponsavel}
          enderecoEmpresa={enderecoEmpresa} telefoneEmpresa={telefoneEmpresa} onChange={handleClienteChange}
        />

        {/* Ambientes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-semibold">Ambientes</h3>
            <Button size="sm" variant="outline" onClick={() => setShowAddAmbiente(!showAddAmbiente)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar ambiente
            </Button>
          </div>
          {showAddAmbiente && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {AMBIENTE_TIPOS.map(tipo => (
                <Button key={tipo} size="sm" variant="outline" className="text-xs h-8 justify-start" onClick={() => addAmbiente(tipo)}>
                  {tipo}
                </Button>
              ))}
            </div>
          )}
          {ambientes.map(amb => (
            <AmbienteBlock key={amb.id} ambiente={amb} stones={stones}
              onUpdate={(updated) => updateAmbiente(amb.id, updated)}
              onRemove={() => removeAmbiente(amb.id)} canRemove={ambientes.length > 1} />
          ))}
        </div>

        <AlertasOrcamento alertas={gerarAlertas(ambientes)} />
        <AcessoriosSection acessorios={acessorios} onUpdate={setAcessorios} />

        <ResumoConsumo
          ambientes={ambientes} subtotalMaterials={subtotalMaterials} subtotalLabor={subtotalLabor}
          subtotalAccessories={subtotalAccessories} subtotalInstallation={subtotalInstallation}
          margemMaterial={margemMaterial} margemServicos={margemServicos}
          margemAcessorios={margemAcessorios} margemInstalacao={margemInstalacao}
        />

        <TotaisSection
          subtotalMaterials={subtotalMaterials} subtotalLabor={subtotalLabor}
          subtotalAccessories={subtotalAccessories} subtotalInstallation={subtotalInstallation}
          margemMaterial={margemMaterial} setMargemMaterial={setMargemMaterial}
          margemServicos={margemServicos} setMargemServicos={setMargemServicos}
          margemAcessorios={margemAcessorios} setMargemAcessorios={setMargemAcessorios}
          margemInstalacao={margemInstalacao} setMargemInstalacao={setMargemInstalacao}
          descontoValor={descontoValor} descontoTipo={descontoTipo}
          setDescontoValor={setDescontoValor} setDescontoTipo={setDescontoTipo}
          condicoesPagamento={condicoesPagamento} setCondicoesPagamento={setCondicoesPagamento}
          observacoes={observacoes} setObservacoes={setObservacoes}
        />

        {/* Scenario table */}
        {ambientes.some(a => a.materialOptions.length > 1) && (
          <div className="space-y-2">
            <h3 className="text-sm font-display font-semibold">Cenários de Investimento</h3>
            <div className="border border-border rounded-md overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-3 py-2">Cenário</th>
                    {ambientes.map(amb => (
                      <th key={amb.id} className="text-right px-3 py-2">{amb.tipo === 'Ambiente Personalizado' ? (amb.nomeCustom || 'Personalizado') : amb.tipo}</th>
                    ))}
                    <th className="text-right px-3 py-2">Instalação</th>
                    <th className="text-right px-3 py-2 font-bold text-primary">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ambientes[0]?.materialOptions.map((_, optIdx) => {
                    const scenarioTotal = ambientes.reduce((sum, amb) => {
                      const matCost = calcAmbienteMaterialCost(amb, Math.min(optIdx, amb.materialOptions.length - 1)) * (1 + margemMaterial / 100);
                      const labCost = calcAmbienteLaborCost(amb) * (1 + margemServicos / 100);
                      return sum + matCost + labCost;
                    }, 0) + subtotalAccessories * (1 + margemAcessorios / 100) + subtotalInstallation * (1 + margemInstalacao / 100);
                    return (
                      <tr key={optIdx} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">Cenário {String.fromCharCode(65 + optIdx)}</td>
                        {ambientes.map(amb => {
                          const idx = Math.min(optIdx, amb.materialOptions.length - 1);
                          const opt = amb.materialOptions[idx];
                          const matCost = calcAmbienteMaterialCost(amb, idx) * (1 + margemMaterial / 100);
                          const labCost = calcAmbienteLaborCost(amb) * (1 + margemServicos / 100);
                          return (
                            <td key={amb.id} className="text-right px-3 py-2">
                              <span className="text-muted-foreground">{opt?.stoneName || opt?.materialDoCliente ? 'Cliente' : '—'}</span>
                              <br />R$ {fmt(matCost + labCost)}
                            </td>
                          );
                        })}
                        <td className="text-right px-3 py-2">R$ {fmt(subtotalInstallation * (1 + margemInstalacao / 100))}</td>
                        <td className="text-right px-3 py-2 font-bold text-primary">R$ {fmt(scenarioTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SmartBudgetGenerator
        open={showAIGenerator}
        onOpenChange={setShowAIGenerator}
        stones={stones}
        onAmbientesGenerated={(newAmbs, resumo) => {
          setAmbientes(prev => [...prev.filter(a => a.pecas.some(p => p.nomePeca || p.largura)), ...newAmbs]);
          if (resumo) toast.info(resumo, { duration: 8000 });
        }}
      />

      <BudgetTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onApply={(newAmbs) => {
          setAmbientes(prev => {
            const hasContent = prev.some(a => a.pecas.some(p => p.nomePeca || p.largura));
            return hasContent ? [...prev, ...newAmbs] : newAmbs;
          });
          toast.success('Template aplicado!');
        }}
      />
    </AppLayout>
  );
};

export default CalculadoraOrcamento;
