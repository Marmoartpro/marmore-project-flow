import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Users, Package, Truck, FolderOpen } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'projeto' | 'orcamento' | 'cliente' | 'pedra' | 'fornecedor';
  link: string;
}

const categoryConfig = {
  projeto: { label: 'Projetos', icon: FolderOpen, color: 'bg-primary/10 text-primary' },
  orcamento: { label: 'Orçamentos', icon: FileText, color: 'bg-accent/10 text-accent-foreground' },
  cliente: { label: 'Clientes', icon: Users, color: 'bg-success/10 text-success' },
  pedra: { label: 'Pedras', icon: Package, color: 'bg-warning/10 text-warning' },
  fornecedor: { label: 'Fornecedores', icon: Truck, color: 'bg-destructive/10 text-destructive' },
};

const GlobalSearch = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !user) { setResults([]); return; }
    setLoading(true);
    const term = `%${q.trim()}%`;
    const all: SearchResult[] = [];

    try {
      // Projects
      const { data: projects } = await supabase.from('projects').select('id, name, client_name, status')
        .or(`name.ilike.${term},client_name.ilike.${term}`).limit(5);
      projects?.forEach(p => all.push({
        id: p.id, title: p.name, subtitle: p.client_name || undefined,
        category: 'projeto', link: `/projeto/${p.id}`,
      }));

      // Budget quotes
      const { data: budgetQuotes } = await supabase.from('budget_quotes').select('id, quote_number, client_name, total')
        .or(`client_name.ilike.${term},quote_number.ilike.${term}`).limit(5);
      budgetQuotes?.forEach(q => all.push({
        id: q.id, title: `${q.quote_number}`, subtitle: `${q.client_name} — R$ ${Number(q.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        category: 'orcamento', link: '/orcamentos',
      }));

      // Quotes (simple)
      const { data: quotes } = await supabase.from('quotes').select('id, client_name, estimated_value')
        .ilike('client_name', term).limit(5);
      quotes?.forEach(q => all.push({
        id: q.id, title: q.client_name, subtitle: `R$ ${Number(q.estimated_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        category: 'orcamento', link: '/orcamentos',
      }));

      // Clients
      const { data: clients } = await supabase.from('clients').select('id, name, whatsapp, city')
        .or(`name.ilike.${term},whatsapp.ilike.${term}`).limit(5);
      clients?.forEach(c => all.push({
        id: c.id, title: c.name, subtitle: [c.city, c.whatsapp].filter(Boolean).join(' • '),
        category: 'cliente', link: '/clientes',
      }));

      // Stones
      const { data: stones } = await supabase.from('stones').select('id, name, category, origin')
        .or(`name.ilike.${term},category.ilike.${term}`).limit(5);
      stones?.forEach(s => all.push({
        id: s.id, title: s.name, subtitle: [s.category, s.origin].filter(Boolean).join(' • '),
        category: 'pedra', link: '/mostruario',
      }));

      // Suppliers
      const { data: suppliers } = await supabase.from('suppliers').select('id, company_name, materials_supplied')
        .or(`company_name.ilike.${term},materials_supplied.ilike.${term}`).limit(5);
      suppliers?.forEach(s => all.push({
        id: s.id, title: s.company_name, subtitle: s.materials_supplied || undefined,
        category: 'fornecedor', link: '/fornecedores',
      }));
    } catch {}

    setResults(all);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    setQuery('');
    navigate(result.link);
  };

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar projetos, orçamentos, clientes, pedras, fornecedores..."
            className="border-0 h-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <p className="text-xs text-muted-foreground text-center py-6">Buscando...</p>}
          {!loading && query && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum resultado para "{query}"</p>
          )}
          {!loading && !query && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Digite para buscar • <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px]">Ctrl+K</kbd> para abrir
            </p>
          )}

          {Object.entries(grouped).map(([cat, items]) => {
            const config = categoryConfig[cat as keyof typeof categoryConfig];
            const Icon = config.icon;
            return (
              <div key={cat} className="mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                  <Icon className="w-3 h-3" /> {config.label}
                </p>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent/50 transition-colors"
                  >
                    <Badge variant="outline" className={`${config.color} text-[9px] px-1.5 shrink-0`}>
                      {config.label.slice(0, 3)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.subtitle && <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
