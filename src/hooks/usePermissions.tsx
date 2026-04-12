import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type PermissionKey =
  | 'dashboard' | 'projetos' | 'projetos_financeiro' | 'projetos_cliente'
  | 'orcamentos' | 'orcamentos_editar' | 'clientes' | 'financeiro'
  | 'mostruario' | 'fornecedores' | 'contratos' | 'relatorios'
  | 'equipe' | 'estoque' | 'calculadora';

interface TeamMemberData {
  id: string;
  owner_id: string;
  role: string;
  permissions: Record<string, boolean>;
  active: boolean;
}

export const usePermissions = () => {
  const { user, profile } = useAuth();
  const [teamMember, setTeamMember] = useState<TeamMemberData | null>(null);
  const [loading, setLoading] = useState(true);

  const role = profile?.role || 'marmorista';
  // The owner is a marmorista who is NOT a team member (they own the account)
  const isOwner = role === 'marmorista' && !teamMember;

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchTeamMember = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, owner_id, role, permissions, active')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();
      
      if (data) {
        setTeamMember({
          id: data.id,
          owner_id: data.owner_id,
          role: data.role,
          permissions: (data.permissions as Record<string, boolean>) || {},
          active: data.active ?? true,
        });
      }
      setLoading(false);
    };

    fetchTeamMember();
  }, [user]);

  const can = (permission: PermissionKey): boolean => {
    if (!user) return false;
    // Owner (marmorista principal) has all permissions
    if (isOwner) return true;
    // Admin has all permissions except equipe management specifics
    if (role === 'admin' && !teamMember) return true;
    // Team member: check JSONB permissions
    if (teamMember) {
      return teamMember.permissions[permission] === true;
    }
    // Arquiteta default (not team member, came via project invite)
    if (role === 'arquiteta') {
      return permission === 'projetos' || permission === 'mostruario';
    }
    return false;
  };

  return { can, role, isOwner, teamMember, loading };
};
