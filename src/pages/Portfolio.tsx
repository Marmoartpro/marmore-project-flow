import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Portfolio = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPortfolio(); }, [slug]);

  const fetchPortfolio = async () => {
    if (!slug) return;
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('portfolio_slug', slug)
      .single();
    if (!prof) { setLoading(false); return; }
    setProfile(prof);
    const { data: pics } = await supabase
      .from('portfolio_photos')
      .select('*')
      .eq('owner_id', prof.user_id)
      .order('display_order');
    setPhotos(pics || []);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#111] text-[#E8E4DC]">Carregando...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-[#111] text-[#E8E4DC]">Portfólio não encontrado.</div>;

  const envTypes = ['Todos', ...Array.from(new Set(photos.map(p => p.environment_type).filter(Boolean)))];
  const filtered = filter === 'Todos' ? photos : photos.filter(p => p.environment_type === filter);

  const whatsappUrl = profile.portfolio_whatsapp
    ? `https://wa.me/${profile.portfolio_whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <div className="min-h-screen bg-[#111] text-[#E8E4DC]">
      {/* Header */}
      <header className="py-12 text-center border-b border-[#2A2A2A]">
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
        )}
        <h1 className="text-3xl font-display font-bold">{profile.office_name || profile.full_name}</h1>
        <p className="text-[#E8E4DC]/60 mt-1">{profile.portfolio_city || profile.city}</p>
      </header>

      {/* Filters */}
      {envTypes.length > 1 && (
        <div className="flex gap-2 justify-center py-4 overflow-x-auto px-4">
          {envTypes.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${filter === t ? 'bg-[#2E7DB5] border-[#2E7DB5] text-white' : 'border-[#2A2A2A] text-[#E8E4DC]/60 hover:border-[#2E7DB5]'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 max-w-5xl mx-auto">
        {filtered.map(p => (
          <div key={p.id} className="aspect-square overflow-hidden rounded-md group relative">
            <img src={p.photo_url} alt={p.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {p.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm">{p.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-[#E8E4DC]/40 py-12">Nenhuma foto no portfólio.</p>}

      {/* WhatsApp CTA */}
      {whatsappUrl && (
        <div className="fixed bottom-6 right-6 z-50">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full h-14 px-6 text-base shadow-xl bg-[#25D366] hover:bg-[#20bd5a] text-white">
              <MessageSquare className="w-5 h-5 mr-2" /> Fale conosco
            </Button>
          </a>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
