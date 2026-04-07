import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

const defaultSettings = {
  contractor_name: '',
  contractor_cpf: '',
  contractor_address: '',
  comarca: 'Sertãozinho/SP',
  multa_inadimplemento: 2,
  juros_mora: 1,
  honorarios_advocaticios: 20,
  clausula_penal_rescisao: 10,
  testemunha1_nome: '',
  testemunha1_cpf: '',
  testemunha2_nome: '',
  testemunha2_cpf: '',
  clausulas_adicionais: '',
};

const ContractSettingsSection = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('contract_settings').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings({
          contractor_name: data.contractor_name || '',
          contractor_cpf: data.contractor_cpf || '',
          contractor_address: data.contractor_address || '',
          comarca: data.comarca || 'Sertãozinho/SP',
          multa_inadimplemento: Number(data.multa_inadimplemento) || 2,
          juros_mora: Number(data.juros_mora) || 1,
          honorarios_advocaticios: Number(data.honorarios_advocaticios) || 20,
          clausula_penal_rescisao: Number(data.clausula_penal_rescisao) || 10,
          testemunha1_nome: data.testemunha1_nome || '',
          testemunha1_cpf: data.testemunha1_cpf || '',
          testemunha2_nome: data.testemunha2_nome || '',
          testemunha2_cpf: data.testemunha2_cpf || '',
          clausulas_adicionais: data.clausulas_adicionais || '',
        });
      }
      setLoaded(true);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { owner_id: user.id, ...settings, updated_at: new Date().toISOString() };
      const { data: existing } = await supabase.from('contract_settings').select('id').eq('owner_id', user.id).maybeSingle();
      if (existing) {
        await supabase.from('contract_settings').update(payload as any).eq('id', existing.id);
      } else {
        await supabase.from('contract_settings').insert(payload as any);
      }
      toast.success('Configurações de contrato salvas!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const upd = (key: string, val: any) => setSettings(s => ({ ...s, [key]: val }));

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Dados do Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Essas informações serão usadas como padrão na geração de contratos.</p>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Dados do Contratado</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome completo</Label><Input value={settings.contractor_name} onChange={e => upd('contractor_name', e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">CPF</Label><Input value={settings.contractor_cpf} onChange={e => upd('contractor_cpf', e.target.value)} className="h-8 text-sm" placeholder="000.000.000-00" /></div>
          </div>
          <div><Label className="text-xs">Endereço completo</Label><Input value={settings.contractor_address} onChange={e => upd('contractor_address', e.target.value)} className="h-8 text-sm" placeholder="Rua, nº, CEP, Bairro, Cidade-UF" /></div>
          <div><Label className="text-xs">Comarca do Foro</Label><Input value={settings.comarca} onChange={e => upd('comarca', e.target.value)} className="h-8 text-sm" /></div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Percentuais</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><Label className="text-xs">Multa inadimpl. (%)</Label><Input type="number" value={settings.multa_inadimplemento} onChange={e => upd('multa_inadimplemento', parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Juros mora (%/mês)</Label><Input type="number" value={settings.juros_mora} onChange={e => upd('juros_mora', parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Honorários adv. (%)</Label><Input type="number" value={settings.honorarios_advocaticios} onChange={e => upd('honorarios_advocaticios', parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Cláusula penal (%)</Label><Input type="number" value={settings.clausula_penal_rescisao} onChange={e => upd('clausula_penal_rescisao', parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Testemunhas Padrão</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Testemunha 1 — Nome</Label><Input value={settings.testemunha1_nome} onChange={e => upd('testemunha1_nome', e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Testemunha 1 — CPF</Label><Input value={settings.testemunha1_cpf} onChange={e => upd('testemunha1_cpf', e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Testemunha 2 — Nome</Label><Input value={settings.testemunha2_nome} onChange={e => upd('testemunha2_nome', e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Testemunha 2 — CPF</Label><Input value={settings.testemunha2_cpf} onChange={e => upd('testemunha2_cpf', e.target.value)} className="h-8 text-sm" /></div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Cláusulas adicionais personalizadas</Label>
          <Textarea value={settings.clausulas_adicionais} onChange={e => upd('clausulas_adicionais', e.target.value)} rows={3} className="text-sm" placeholder="Texto livre para cláusulas extras..." />
        </div>

        <Button onClick={save} disabled={saving} size="sm">
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContractSettingsSection;
