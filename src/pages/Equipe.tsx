import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import RoleBadge from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, MoreVertical, Copy, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'projetos_financeiro', label: 'Projetos — Financeiro' },
  { key: 'orcamentos', label: 'Orçamentos' },
  { key: 'orcamentos_editar', label: 'Orçamentos — Editar' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'mostruario', label: 'Mostruário' },
  { key: 'fornecedores', label: 'Fornecedores' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'estoque', label: 'Estoque' },
  { key: 'calculadora', label: 'Calculadora' },
];

const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
  marmorista: Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, true])),
  admin: Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, true])),
  arquiteta: { projetos: true, mostruario: true },
  cliente: { projetos_cliente: true },
  instalador: { projetos: true },
  vendedor: { orcamentos: true, orcamentos_editar: true, clientes: true, mostruario: true, calculadora: true },
  rh: { relatorios: true, equipe: true },
};

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'arquiteta', label: 'Arquiteta' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'instalador', label: 'Instalador' },
  { value: 'rh', label: 'RH' },
  { value: 'cliente', label: 'Cliente' },
];

const Equipe = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [generatedLink, setGeneratedLink] = useState('');

  // invite form
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invWhatsapp, setInvWhatsapp] = useState('');
  const [invRole, setInvRole] = useState('vendedor');
  const [invPerms, setInvPerms] = useState<Record<string, boolean>>({});

  // edit form
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});

  useEffect(() => { if (user) fetchMembers(); }, [user]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  const handleRoleChange = (role: string) => {
    setInvRole(role);
    const defaults = DEFAULT_PERMS[role] || {};
    const perms: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => { perms[p.key] = defaults[p.key] || false; });
    setInvPerms(perms);
  };

  const openInvite = () => {
    setInvName(''); setInvEmail(''); setInvWhatsapp('');
    setGeneratedLink('');
    handleRoleChange('vendedor');
    setShowInvite(true);
  };

  const generateInvite = async () => {
    if (!invName || !invEmail) { toast.error('Preencha nome e e-mail'); return; }
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        owner_id: user!.id,
        name: invName,
        email: invEmail,
        whatsapp: invWhatsapp,
        role: invRole as any,
        permissions: invPerms,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    const link = `${window.location.origin}/entrar/${data.invite_token}`;
    setGeneratedLink(link);
    toast.success('Convite criado!');
    fetchMembers();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copiado!');
  };

  const openEdit = (m: any) => {
    setEditMember(m);
    const perms: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => { perms[p.key] = m.permissions?.[p.key] || false; });
    setEditPerms(perms);
  };

  const savePerms = async () => {
    if (!editMember) return;
    const { error } = await supabase
      .from('team_members')
      .update({ permissions: editPerms })
      .eq('id', editMember.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Permissões atualizadas!');
    setEditMember(null);
    fetchMembers();
  };

  const toggleActive = async (m: any) => {
    await supabase.from('team_members').update({ active: !m.active }).eq('id', m.id);
    toast.success(m.active ? 'Acesso desativado' : 'Acesso reativado');
    fetchMembers();
  };

  const resendInvite = async (m: any) => {
    const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    await supabase.from('team_members').update({
      invite_token: newToken,
      invite_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    }).eq('id', m.id);
    const link = `${window.location.origin}/entrar/${newToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Novo link copiado!');
    fetchMembers();
  };

  const activeCounts: Record<string, number> = {};
  members.filter(m => m.active).forEach(m => {
    activeCounts[m.role] = (activeCounts[m.role] || 0) + 1;
  });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Equipe</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(activeCounts).map(([r, c]) => (
                <Badge key={r} variant="secondary" className="text-xs">
                  {r}: {c}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={openInvite}><UserPlus className="w-4 h-4 mr-2" /> Convidar membro</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : members.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum membro na equipe ainda.</p>
            <Button variant="outline" className="mt-4" onClick={openInvite}>Convidar primeiro membro</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <Card key={m.id}>
                <CardContent className="py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {m.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <RoleBadge role={m.role} />
                  <Badge variant={m.accepted_at ? (m.active ? 'default' : 'destructive') : 'secondary'} className="text-[10px]">
                    {m.accepted_at ? (m.active ? 'Ativo' : 'Inativo') : 'Pendente'}
                  </Badge>
                  {m.last_seen_at && (
                    <span className="text-[10px] text-muted-foreground hidden md:block">
                      Último: {new Date(m.last_seen_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openEdit(m)}>Editar permissões</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(m)}>
                        {m.active ? 'Desativar acesso' : 'Reativar acesso'}
                      </DropdownMenuItem>
                      {!m.accepted_at && <DropdownMenuItem onClick={() => resendInvite(m)}>Reenviar convite</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Invite modal */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={invName} onChange={e => setInvName(e.target.value)} /></div>
                <div><Label>E-mail</Label><Input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input value={invWhatsapp} onChange={e => setInvWhatsapp(e.target.value)} /></div>
                <div>
                  <Label>Papel</Label>
                  <Select value={invRole} onValueChange={handleRoleChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Permissões individuais</Label>
                <div className="mt-2 border rounded-md divide-y">
                  {ALL_PERMISSIONS.map(p => (
                    <div key={p.key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{p.label}</span>
                      <Switch
                        checked={invPerms[p.key] || false}
                        onCheckedChange={v => setInvPerms(prev => ({ ...prev, [p.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {generatedLink ? (
                <div className="p-3 bg-primary/10 rounded-md space-y-2">
                  <p className="text-sm font-medium text-primary">Link de convite gerado!</p>
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="text-xs" />
                    <Button size="sm" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Válido por 48 horas</p>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              {!generatedLink && <Button onClick={generateInvite}>Gerar link de convite</Button>}
              {generatedLink && <Button variant="outline" onClick={() => setShowInvite(false)}>Fechar</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit permissions modal */}
        <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Permissões — {editMember?.name}</DialogTitle></DialogHeader>
            <div className="border rounded-md divide-y">
              {ALL_PERMISSIONS.map(p => (
                <div key={p.key} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm">{p.label}</span>
                  <Switch
                    checked={editPerms[p.key] || false}
                    onCheckedChange={v => setEditPerms(prev => ({ ...prev, [p.key]: v }))}
                  />
                </div>
              ))}
            </div>
            <DialogFooter><Button onClick={savePerms}>Salvar permissões</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Equipe;
