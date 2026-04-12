import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <ShieldX className="w-16 h-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-display font-bold">Acesso não autorizado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador da conta para solicitar acesso.
        </p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    </div>
  );
};

export default Unauthorized;
