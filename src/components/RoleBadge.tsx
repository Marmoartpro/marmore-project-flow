import { Badge } from '@/components/ui/badge';

const roleConfig: Record<string, { label: string; className: string }> = {
  marmorista: { label: 'Dono', className: 'bg-blue-600 text-white hover:bg-blue-700' },
  arquiteta: { label: 'Arquiteta', className: 'bg-purple-600 text-white hover:bg-purple-700' },
  cliente: { label: 'Cliente', className: 'bg-green-600 text-white hover:bg-green-700' },
  instalador: { label: 'Instalador', className: 'bg-orange-600 text-white hover:bg-orange-700' },
  vendedor: { label: 'Vendedor', className: 'bg-yellow-600 text-white hover:bg-yellow-700' },
  rh: { label: 'RH', className: 'bg-gray-500 text-white hover:bg-gray-600' },
  admin: { label: 'Admin', className: 'bg-red-600 text-white hover:bg-red-700' },
};

const RoleBadge = ({ role }: { role: string }) => {
  const config = roleConfig[role] || { label: role, className: 'bg-muted text-muted-foreground' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

export default RoleBadge;
