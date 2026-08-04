import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ChunkErrorBoundaryProps {
  children: ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Evita a tela branca quando um chunk de rota não pode ser carregado
 * (deploy novo + HTML antigo em cache). Mostra uma UI de recuperação
 * que limpa caches e recarrega a aplicação.
 */
export class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("[ChunkErrorBoundary]", error, info.componentStack);
  }

  private handleReload = async (): Promise<void> => {
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      window.sessionStorage.removeItem("lovable:chunk-reloaded");
    } catch {
      /* ignorar */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_r", Date.now().toString(36));
    window.location.replace(url.toString());
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
        <h1 className="text-xl font-semibold text-foreground">Não foi possível carregar esta página</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Uma nova versão do aplicativo foi publicada. Atualize para continuar.
        </p>
        <Button onClick={this.handleReload}>Atualizar aplicativo</Button>
      </div>
    );
  }
}

export default ChunkErrorBoundary;
