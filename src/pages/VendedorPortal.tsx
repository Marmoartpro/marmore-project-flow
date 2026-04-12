import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Package, Calculator, Search } from 'lucide-react';

const VendedorPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const { data: member } = await supabase
      .from('team_members').select('owner_id').eq('user_id', user!.id).eq('active', true).maybeSingle();
    if (!member) { setLoading(false); return; }

    const [qRes, cRes] = await Promise.all([
      supabase.from('budget_quotes').select('*').eq('owner_id', member.owner_id).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('owner_id', member.owner_id).order('name'),
    ]);
    setQuotes(qRes.data || []);
    setClients(cRes.data || []);
    setLoading(false);
  };

  const filteredQuotes = quotes.filter(q => q.client_name?.toLowerCase().includes(search.toLowerCase()) || q.quote_number?.includes(search));
  const filteredClients = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-display font-bold">Vendas</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar orçamentos ou clientes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Tabs defaultValue="orcamentos">
          <TabsList>
            <TabsTrigger value="orcamentos"><FileText className="w-4 h-4 mr-1" /> Orçamentos</TabsTrigger>
            <TabsTrigger value="clientes"><Users className="w-4 h-4 mr-1" /> Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="orcamentos" className="space-y-2 mt-4">
            <Button onClick={() => navigate('/calculadora')}>Nova calculadora</Button>
            {filteredQuotes.map(q => (
              <Card key={q.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{q.quote_number} — {q.client_name}</p>
                    <p className="text-xs text-muted-foreground">R$ {Number(q.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <Badge variant={q.status === 'aprovado' ? 'default' : 'secondary'} className="text-[10px]">{q.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="clientes" className="space-y-2 mt-4">
            {filteredClients.map(c => (
              <Card key={c.id}>
                <CardContent className="py-3">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.whatsapp} • {c.email}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default VendedorPortal;
