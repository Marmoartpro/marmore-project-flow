import { ReactNode } from 'react';
import { usePermissions, PermissionKey } from '@/hooks/usePermissions';

interface Props {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

const PermissionGate = ({ permission, children, fallback = null }: Props) => {
  const { can } = usePermissions();
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
};

export default PermissionGate;
