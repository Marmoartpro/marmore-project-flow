import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin, Clock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

type Appointment = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  type: string;
  color: string | null;
  status: string;
  project_id: string | null;
  client_id: string | null;
  reminder_minutes: number | null;
};

const TYPES = [
  { value: 'compromisso', label: 'Compromisso', color: '#3b82f6' },
  { value: 'visita', label: 'Visita técnica', color: '#10b981' },
  { value: 'instalacao', label: 'Instalação', color: '#f59e0b' },
  { value: 'medicao', label: 'Medição', color: '#8b5cf6' },
  { value: 'reuniao', label: 'Reunião', color: '#ec4899' },
  { value: 'entrega', label: 'Entrega', color: '#14b8a6' },
  { value: 'outro', label: 'Outro', color: '#64748b' },
];

const fmtDateInput = (d: Date) => {
  const off = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return off.toISOString().slice(0, 16);
};

const Agenda = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<any>({
    title: '', description: '', start_at: fmtDateInput(new Date()), end_at: '',
    all_day: false, location: '', type: 'compromisso', project_id: '', client_id: '',
    reminder_minutes: 60,
  });

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const [ap, pj, cl] = await Promise.all([
      supabase.from('appointments').select('*').order('start_at'),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('clients').select('id, name').order('name'),
    ]);
    setItems((ap.data as any) || []);
    setProjects(pj.data || []);
    setClients(cl.data || []);
  };

  const openNew = (date?: Date) => {
    const base = date || selectedDay;
    const start = new Date(base);
    start.setHours(9, 0, 0, 0);
    setEditing(null);
    setForm({
      title: '', description: '', start_at: fmtDateInput(start), end_at: '',
      all_day: false, location: '', type: 'compromisso', project_id: '', client_id: '',
      reminder_minutes: 60,
    });
    setOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description || '',
      start_at: fmtDateInput(new Date(a.start_at)),
      end_at: a.end_at ? fmtDateInput(new Date(a.end_at)) : '',
      all_day: a.all_day,
      location: a.location || '',
      type: a.type,
      project_id: a.project_id || '',
      client_id: a.client_id || '',
      reminder_minutes: a.reminder_minutes ?? 60,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) return toast.error('Informe um título');
    if (!form.start_at) return toast.error('Informe data/hora de início');

    const typeColor = TYPES.find(t => t.value === form.type)?.color || '#3b82f6';
    const payload: any = {
      owner_id: user.id,
      title: form.title.trim(),
      description: form.description || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      all_day: !!form.all_day,
      location: form.location || null,
      type: form.type,
      color: typeColor,
      project_id: form.project_id || null,
      client_id: form.client_id || null,
      reminder_minutes: Number(form.reminder_minutes) || null,
      created_by: user.id,
    };

    if (editing) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editing.id);
      if (error) return toast.error('Erro ao salvar');
      toast.success('Compromisso atualizado');
    } else {
      const { error } = await supabase.from('appointments').insert(payload);
      if (error) return toast.error('Erro ao criar');
      toast.success('Compromisso criado');
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este compromisso?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) return toast.error('Erro ao excluir');
    toast.success('Excluído');
    load();
  };

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dayItems = useMemo(
    () => items.filter(i => sameDay(new Date(i.start_at), selectedDay))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [items, selectedDay]
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    return items
      .filter(i => new Date(i.start_at) >= now)
      .slice(0, 8);
  }, [items]);

  const daysWithEvents = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      const d = new Date(i.start_at);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [items]);

  const eventsCountByDay = (d: Date) =>
    items.filter(i => sameDay(new Date(i.start_at), d)).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" /> Agenda
            </h1>
            <p className="text-sm text-muted-foreground">Seus compromissos, visitas e instalações</p>
          </div>
          <Button onClick={() => openNew()}>
            <Plus className="w-4 h-4 mr-2" /> Novo compromisso
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendário */}
          <Card className="lg:col-span-2">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="font-medium capitalize">
                  {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Calendar
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={selectedDay}
                onSelect={(d) => d && setSelectedDay(d)}
                locale={ptBR}
                className={cn("p-0 pointer-events-auto w-full")}
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-2",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.75rem]",
                  row: "flex w-full mt-1",
                  cell: "flex-1 h-12 text-center text-sm p-0 relative",
                  day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md relative",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                }}
                components={{
                  DayContent: ({ date }: any) => {
                    const count = eventsCountByDay(date);
                    return (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span>{date.getDate()}</span>
                        {count > 0 && (
                          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    );
                  },
                }}
              />

              {/* Eventos do dia selecionado */}
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">
                    {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => openNew(selectedDay)}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {dayItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Sem compromissos neste dia</p>
                ) : (
                  <div className="space-y-2">
                    {dayItems.map(a => <AppointmentItem key={a.id} a={a} onEdit={openEdit} onDelete={remove} />)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Próximos */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Próximos compromissos
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Nada agendado</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(a => <AppointmentItem key={a.id} a={a} onEdit={openEdit} onDelete={remove} compact />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar compromisso' : 'Novo compromisso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Visita técnica - Cliente João" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} /> {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início *</Label>
                <Input type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Local</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Endereço ou referência" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Projeto (opcional)</Label>
                <Select value={form.project_id || 'none'} onValueChange={v => setForm({ ...form, project_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={form.client_id || 'none'} onValueChange={v => setForm({ ...form, client_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Lembrete (minutos antes)</Label>
              <Input type="number" min={0} value={form.reminder_minutes} onChange={e => setForm({ ...form, reminder_minutes: e.target.value })} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            {editing && (
              <Button variant="destructive" onClick={() => { remove(editing.id); setOpen(false); }} className="mr-auto">
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

const AppointmentItem = ({ a, onEdit, onDelete, compact }: { a: Appointment; onEdit: (a: Appointment) => void; onDelete: (id: string) => void; compact?: boolean }) => {
  const start = new Date(a.start_at);
  const end = a.end_at ? new Date(a.end_at) : null;
  const typeLabel = TYPES.find(t => t.value === a.type)?.label || a.type;
  return (
    <div
      className="p-2.5 rounded-md border border-border bg-card hover:bg-accent/40 cursor-pointer transition-colors"
      onClick={() => onEdit(a)}
    >
      <div className="flex items-start gap-2">
        <div className="w-1 self-stretch rounded-full" style={{ background: a.color || '#3b82f6' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{a.title}</p>
            <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {compact ? start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' : ''}
              {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {end && ` - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
            {a.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" /> {a.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
