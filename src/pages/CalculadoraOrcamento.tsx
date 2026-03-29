import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Calculator, Plus, Save, Trash2, FileText } from 'lucide-react';
import { generateOrcamentoPdf } from '@/components/orcamento/generatePdf';
import { toast } from 'sonner';
import ClienteSection from '@/components/orcamento/ClienteSection';
import AmbienteBlock from '@/components/orcamento/AmbienteBlock';
import AcessoriosSection from '@/components/orcamento/AcessoriosSection';
import TotaisSection from '@/components/orcamento/TotaisSection';
import LogoUpload from '@/components/orcamento/LogoUpload';
import {
  OrcamentoData, Ambiente, AcessorioItem,
  AMBIENTE_TIPOS, newAmbiente, newAcessorio,
  calcAmbienteMaterialCost, calcAmbienteLaborCost, calcAmbienteInstallCost, fmt,
} from '@/components/orcamento/types';

const today = () => new Date().toISOString().split('T')[0];

const CalculadoraOrcamento = () => {
  const { user, profile } = useAuth();
  const [stones, setStones] = useState<any[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Orcamento state
  const [clienteNome, setClienteNome] = useState('');
  const [tipoAmbiente, setTipoAmbiente] = useState('');
  const [dataOrcamento, setDataOrcamento] = useState(today());
  const [validadeDias, setValidadeDias] = useState('15');
  const [ambientes, setAmbientes] = useState<Ambiente[]>([newAmbiente('Cozinha')]);
  const [acessorios, setAcessorios] = useState<AcessorioItem[]>([newAcessorio()]);
  // Per-section margins
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

  useEffect(() => {
    if (user) {
      supabase.from('stones').select('id, name, price_per_m2, category').order('name').then(({ data }) => setStones(data || []));
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setCompanyLogo((profile as any).company_logo_url || null);
    }
  }, [profile]);

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

  // Calculate totals (using first material option as default)
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

  const saveOrcamento = async () => {
    if (!user || !clienteNome) {
      toast.error('Informe o nome do cliente');
      return;
    }
    setSaving(true);
    try {
      const materialComMargem = subtotalMaterials * (1 + margemMaterial / 100);
      const servicosComMargem = subtotalLabor * (1 + margemServicos / 100);
      const acessoriosComMargem = subtotalAccessories * (1 + margemAcessorios / 100);
      const instalacaoComMargem = subtotalInstallation * (1 + margemInstalacao / 100);
      const totalBruto = materialComMargem + servicosComMargem + acessoriosComMargem + instalacaoComMargem;
      const desconto = descontoTipo === 'percent'
        ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
        : (parseFloat(descontoValor) || 0);
      const totalFinal = totalBruto - desconto;

      const quoteNumber = generateQuoteNumber();

      const payload = {
        owner_id: user.id,
        quote_number: quoteNumber,
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
        profit_margin_percent: margemMaterial, // store primary margin
        discount: parseFloat(descontoValor) || 0,
        discount_type: descontoTipo,
        total: totalFinal,
        payment_conditions: condicoesPagamento,
        observations: observacoes,
        status: 'rascunho',
      };

      const { error } = await supabase.from('budget_quotes').insert([payload]);
      if (error) throw error;

      // Also save/update client profile
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', clienteNome)
        .limit(1);

      if (!existingClients || existingClients.length === 0) {
        await supabase.from('clients').insert({
          owner_id: user.id,
          name: clienteNome,
          service_type: tipoAmbiente,
          observations: `Orçamento ${quoteNumber} gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        });
      }

      toast.success('Orçamento salvo com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  const limparTudo = () => {
    if (!confirm('Tem certeza que deseja limpar todos os campos?')) return;
    setClienteNome('');
    setTipoAmbiente('');
    setDataOrcamento(today());
    setValidadeDias('15');
    setAmbientes([newAmbiente('Cozinha')]);
    setAcessorios([newAcessorio()]);
    setMargemMaterial(30);
    setMargemServicos(30);
    setMargemAcessorios(30);
    setMargemInstalacao(20);
    setDescontoValor('');
    setDescontoTipo('percent');
    setCondicoesPagamento('Entrada 40%, parcela intermediária 30%, saldo na conclusão 30%');
    setObservacoes('');
    toast.success('Campos limpos!');
  };

  const handleGeneratePdf = async () => {
    if (!clienteNome) {
      toast.error('Informe o nome do cliente antes de gerar o PDF');
      return;
    }
    setGeneratingPdf(true);
    try {
      await generateOrcamentoPdf({
        quoteNumber: generateQuoteNumber(),
        clienteNome,
        tipoAmbiente,
        dataOrcamento,
        validadeDias,
        ambientes,
        acessorios,
        subtotalMaterials,
        subtotalLabor,
        subtotalAccessories,
        subtotalInstallation,
        margemMaterial,
        margemServicos,
        margemAcessorios,
        margemInstalacao,
        descontoValor,
        descontoTipo,
        condicoesPagamento,
        observacoes,
        logoUrl: companyLogo,
        companyName: nomeEmpresa || 'Marmoraria Artesanal',
        responsibleName: nomeResponsavel,
        companyAddress: enderecoEmpresa,
        companyPhone: telefoneEmpresa || (profile as any)?.phone || '',
      });
      toast.success('PDF gerado e baixado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" /> Calculadora de Orçamento
          </h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={limparTudo}>
              <Trash2 className="w-4 h-4 mr-1" /> Limpar
            </Button>
            <Button size="sm" variant="outline" onClick={handleGeneratePdf} disabled={generatingPdf || !clienteNome}>
              <FileText className="w-4 h-4 mr-1" /> {generatingPdf ? 'Gerando...' : 'Gerar PDF'}
            </Button>
            <Button size="sm" onClick={saveOrcamento} disabled={saving || !clienteNome}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar orçamento'}
            </Button>
          </div>
        </div>

        {/* Logo upload */}
        <LogoUpload logoUrl={companyLogo} onUpdate={setCompanyLogo} />

        {/* Client section */}
        <ClienteSection
          clienteNome={clienteNome}
          tipoAmbiente={tipoAmbiente}
          dataOrcamento={dataOrcamento}
          validadeDias={validadeDias}
          nomeEmpresa={nomeEmpresa}
          nomeResponsavel={nomeResponsavel}
          enderecoEmpresa={enderecoEmpresa}
          telefoneEmpresa={telefoneEmpresa}
          onChange={handleClienteChange}
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
                <Button key={tipo} size="sm" variant="outline" className="text-xs h-8 justify-start"
                  onClick={() => addAmbiente(tipo)}>
                  {tipo}
                </Button>
              ))}
            </div>
          )}

          {ambientes.map(amb => (
            <AmbienteBlock
              key={amb.id}
              ambiente={amb}
              stones={stones}
              onUpdate={(updated) => updateAmbiente(amb.id, updated)}
              onRemove={() => removeAmbiente(amb.id)}
              canRemove={ambientes.length > 1}
            />
          ))}
        </div>

        {/* Acessórios */}
        <AcessoriosSection acessorios={acessorios} onUpdate={setAcessorios} />

        {/* Totais */}
        <TotaisSection
          subtotalMaterials={subtotalMaterials}
          subtotalLabor={subtotalLabor}
          subtotalAccessories={subtotalAccessories}
          subtotalInstallation={subtotalInstallation}
          margemMaterial={margemMaterial}
          setMargemMaterial={setMargemMaterial}
          margemServicos={margemServicos}
          setMargemServicos={setMargemServicos}
          margemAcessorios={margemAcessorios}
          setMargemAcessorios={setMargemAcessorios}
          margemInstalacao={margemInstalacao}
          setMargemInstalacao={setMargemInstalacao}
          descontoValor={descontoValor}
          descontoTipo={descontoTipo}
          setDescontoValor={setDescontoValor}
          setDescontoTipo={setDescontoTipo}
          condicoesPagamento={condicoesPagamento}
          setCondicoesPagamento={setCondicoesPagamento}
          observacoes={observacoes}
          setObservacoes={setObservacoes}
        />

        {/* Scenario table when multiple material options exist */}
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
                    <th className="text-right px-3 py-2 font-bold" style={{ color: '#2E7DB5' }}>Total</th>
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
                        <td className="text-right px-3 py-2 font-bold" style={{ color: '#2E7DB5' }}>R$ {fmt(scenarioTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CalculadoraOrcamento;
