import { PecaItem, getBordasLados } from './types';

interface Props {
  peca: PecaItem;
}

/**
 * Preview visual da peça mostrando formato + bordas com acabamento destacadas.
 * - Linhas grossas em verde = lados com acabamento
 * - Linhas finas tracejadas = sem acabamento
 */
const PecaPreview = ({ peca }: Props) => {
  const lados = getBordasLados(peca);
  const w = parseFloat(peca.largura) || 0;
  const l = parseFloat(peca.comprimento) || 0;

  // Não renderiza preview se não houver dimensões válidas e formato for retangular/L
  const isRectish = ['retangular', 'l_shape'].includes(peca.formato);
  if (!isRectish || w <= 0 || l <= 0) return null;

  // SVG viewport: 200×120 com padding interno
  const SVG_W = 220;
  const SVG_H = 130;
  const PAD = 18;
  const usableW = SVG_W - PAD * 2;
  const usableH = SVG_H - PAD * 2;

  // Escala mantendo proporção (l = comprimento horizontal, w = largura vertical)
  const scale = Math.min(usableW / l, usableH / w);
  const rectW = l * scale;
  const rectH = w * scale;
  const x0 = (SVG_W - rectW) / 2;
  const y0 = (SVG_H - rectH) / 2;

  // Cores via CSS vars (semantic tokens)
  const ON = 'hsl(var(--primary))';
  const OFF = 'hsl(var(--muted-foreground))';
  const BG = 'hsl(var(--muted))';
  const TXT = 'hsl(var(--foreground))';

  const lineProps = (active: boolean) => ({
    stroke: active ? ON : OFF,
    strokeWidth: active ? 4 : 1,
    strokeDasharray: active ? '' : '3,3',
    strokeLinecap: 'round' as const,
  });

  // L-shape rendering
  if (peca.formato === 'l_shape') {
    const w2 = parseFloat(peca.lTrecho2Largura) || 0;
    const l2 = parseFloat(peca.lTrecho2Comprimento) || 0;
    if (w2 <= 0 || l2 <= 0) {
      // fallback: render as rect
    } else {
      // Calcular caixa envolvente
      const totalL = l;
      const totalW = w + w2; // empilha trecho 2 abaixo do trecho 1 (visual simplificado)
      const sc = Math.min(usableW / totalL, usableH / totalW);
      const r1W = l * sc;
      const r1H = w * sc;
      const r2W = l2 * sc;
      const r2H = w2 * sc;
      const ox = (SVG_W - totalL * sc) / 2;
      const oy = (SVG_H - totalW * sc) / 2;

      return (
        <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="rounded-md border border-border" style={{ background: BG }}>
          {/* Trecho 1 (superior) */}
          <rect x={ox} y={oy} width={r1W} height={r1H} fill="hsl(var(--background))" stroke={OFF} strokeWidth={0.5} />
          {/* Trecho 2 (inferior, alinhado à esquerda) */}
          <rect x={ox} y={oy + r1H} width={r2W} height={r2H} fill="hsl(var(--background))" stroke={OFF} strokeWidth={0.5} />

          {/* Bordas externas — frente (topo do trecho 1) */}
          <line x1={ox} y1={oy} x2={ox + r1W} y2={oy} {...lineProps(lados.frente)} />
          {/* Fundo (base do trecho 2) */}
          <line x1={ox} y1={oy + r1H + r2H} x2={ox + r2W} y2={oy + r1H + r2H} {...lineProps(lados.fundo)} />
          {/* Esquerda (toda altura) */}
          <line x1={ox} y1={oy} x2={ox} y2={oy + r1H + r2H} {...lineProps(lados.esq)} />
          {/* Direita do trecho 1 */}
          <line x1={ox + r1W} y1={oy} x2={ox + r1W} y2={oy + r1H} {...lineProps(lados.dir)} />
          {/* Direita do trecho 2 */}
          <line x1={ox + r2W} y1={oy + r1H} x2={ox + r2W} y2={oy + r1H + r2H} {...lineProps(lados.dir)} />
          {/* Degrau (fundo do trecho 1 a partir de r2W) */}
          <line x1={ox + r2W} y1={oy + r1H} x2={ox + r1W} y2={oy + r1H} {...lineProps(lados.fundo)} />

          {/* Labels */}
          <text x={SVG_W / 2} y={oy - 4} textAnchor="middle" fontSize="8" fill={TXT}>Frente</text>
          <text x={SVG_W / 2} y={oy + r1H + r2H + 10} textAnchor="middle" fontSize="8" fill={TXT}>Fundo</text>
        </svg>
      );
    }
  }

  // Retangular (default)
  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="rounded-md border border-border" style={{ background: BG }}>
      <rect x={x0} y={y0} width={rectW} height={rectH} fill="hsl(var(--background))" stroke={OFF} strokeWidth={0.5} />

      {/* Frente (topo) */}
      <line x1={x0} y1={y0} x2={x0 + rectW} y2={y0} {...lineProps(lados.frente)} />
      {/* Fundo (base) */}
      <line x1={x0} y1={y0 + rectH} x2={x0 + rectW} y2={y0 + rectH} {...lineProps(lados.fundo)} />
      {/* Esq */}
      <line x1={x0} y1={y0} x2={x0} y2={y0 + rectH} {...lineProps(lados.esq)} />
      {/* Dir */}
      <line x1={x0 + rectW} y1={y0} x2={x0 + rectW} y2={y0 + rectH} {...lineProps(lados.dir)} />

      {/* Labels */}
      <text x={SVG_W / 2} y={y0 - 5} textAnchor="middle" fontSize="8" fill={TXT}>Frente</text>
      <text x={SVG_W / 2} y={y0 + rectH + 10} textAnchor="middle" fontSize="8" fill={TXT}>Fundo</text>
      <text x={x0 - 4} y={y0 + rectH / 2} textAnchor="end" fontSize="8" fill={TXT} dominantBaseline="middle">Esq.</text>
      <text x={x0 + rectW + 4} y={y0 + rectH / 2} textAnchor="start" fontSize="8" fill={TXT} dominantBaseline="middle">Dir.</text>

      {/* Dimensões */}
      <text x={SVG_W / 2} y={SVG_H - 2} textAnchor="middle" fontSize="7" fill={OFF}>
        {l} × {w} cm
      </text>
    </svg>
  );
};

export default PecaPreview;
