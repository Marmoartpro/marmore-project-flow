import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { AlertaOrcamento } from './types';

interface Props {
  alertas: AlertaOrcamento[];
}

const iconMap = {
  warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
  danger: <AlertCircle className="w-4 h-4 text-destructive" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

const variantMap = {
  warning: 'border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20',
  danger: 'border-destructive/40 bg-red-50 dark:bg-red-950/20',
  info: 'border-primary/30 bg-primary/5',
};

const AlertasOrcamento = ({ alertas }: Props) => {
  if (alertas.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" /> Verificações Automáticas ({alertas.length})
      </h4>
      {alertas.map((a, i) => (
        <Alert key={i} className={`py-2 px-3 ${variantMap[a.tipo]}`}>
          <div className="flex items-start gap-2">
            {iconMap[a.tipo]}
            <AlertDescription className="text-[11px]">{a.mensagem}</AlertDescription>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default AlertasOrcamento;
