import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, X } from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  service_type: string | null;
  observations: string | null;
  projectCount?: number;
  totalValue?: number;
}

interface Props {
  value: string;
  onChange: (name: string) => void;
  onClientSelect?: (client: ClientData) => void;
  placeholder?: string;
}

const ClientPicker = ({ value, onChange, onClientSelect, placeholder }: Props) => {
  const { user } = useAuth();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ClientData[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, whatsapp, email, city, service_type, observations')
        .eq('owner_id', user.id)
        .ilike('name', `%${query}%`)
        .limit(8);

      if (!clients || clients.length === 0) { setResults([]); return; }

      // Fetch project counts and total values
      const enriched: ClientData[] = await Promise.all(
        clients.map(async (c) => {
          const { count } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('client_name', c.name);
          const { data: vals } = await supabase
            .from('projects')
            .select('total_value')
            .eq('owner_id', user.id)
            .eq('client_name', c.name);
          const totalValue = (vals || []).reduce((s, v) => s + (Number(v.total_value) || 0), 0);
          return { ...c, projectCount: count || 0, totalValue };
        })
      );
      setResults(enriched);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, user]);

  const handleSelect = (client: ClientData) => {
    setSelectedClient(client);
    onChange(client.name);
    setQuery(client.name);
    setOpen(false);
    onClientSelect?.(client);
  };

  const handleClear = () => {
    setSelectedClient(null);
    onChange('');
    setQuery('');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setSelectedClient(null); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          className="h-8 text-sm pl-7 pr-8"
          placeholder={placeholder || 'Buscar cliente cadastrado ou digitar novo nome'}
        />
        {query && (
          <button onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {selectedClient && (
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] gap-1">
            <User className="w-3 h-3" />
            {selectedClient.projectCount} projeto(s) • R$ {fmt(selectedClient.totalValue || 0)}
          </Badge>
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-3 py-2 hover:bg-accent text-xs flex items-center justify-between gap-2 border-b border-border last:border-0"
            >
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-muted-foreground">
                  {c.whatsapp && `${c.whatsapp} • `}
                  {c.service_type || 'Sem tipo'}
                  {c.city && ` • ${c.city}`}
                </p>
              </div>
              <Badge variant="secondary" className="text-[9px] shrink-0">
                {c.projectCount} proj. • R$ {fmt(c.totalValue || 0)}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientPicker;
