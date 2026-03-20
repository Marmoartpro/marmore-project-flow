import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, User, Layers } from 'lucide-react';

interface Props {
  project: any;
  invite: any;
  isOwner: boolean;
}

const ProjectOverview = ({ project, invite, isOwner }: Props) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" /> Dados do projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{project.client_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ambiente</span>
              <span className="font-medium">{project.environment_type || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo</span>
              <span className="font-medium">
                {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Endereço</span>
              <span className="font-medium text-right max-w-[200px]">{project.address || '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Escopo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedra</span>
              <span className="font-medium">{project.stone_type || '—'} {project.stone_color || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Espessura</span>
              <span className="font-medium">{project.thickness || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Acabamento</span>
              <span className="font-medium">{project.finish || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peças</span>
              <span className="font-medium">{project.pieces || '—'}</span>
            </div>
            {project.observations && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-xs mb-1">Observações</p>
                <p className="text-sm">{project.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {invite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <User className="w-4 h-4 text-accent" /> Arquiteta
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{invite.architect_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium">{invite.architect_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WhatsApp</span>
              <span className="font-medium">{invite.architect_phone || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge className={invite.accepted ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                {invite.accepted ? 'Aceito' : 'Pendente'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectOverview;
