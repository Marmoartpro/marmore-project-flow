export interface ServicoCustom {
  id: string;
  descricao: string;
  valor: string;
  tipo: 'fixo' | 'm2' | 'ml';
}

export interface PecaItem {
  id: string;
  tipo: string;
  descricao: string;
  largura: string;
  comprimento: string;
  quantidade: string;
  // Technical details
  tipoCuba: string;
  valorCuba: string;
  tipoRebaixo: string;
  acabamentoBorda: string;
  valorAcabamentoBorda: string;
  bordasComAcabamento: string;
  furosTorneira: string;
  espelhoBacksplash: boolean;
  espelhoBacksplashAltura: string;
  saiaFrontal: boolean;
  saiaFrontalAltura: string;
  rebaixoCooktop: boolean;
  rebaixoCooktopLargura: string;
  rebaixoCooktopComprimento: string;
  valorRebaixo: string;
  // Ilhargas / pés revestidos
  ilhargas: boolean;
  ilhargasQtd: string;
  ilhargasAltura: string;
  ilhargasLargura: string;
  // Extras
  extras: ExtraItem[];
}

export interface ExtraItem {
  id: string;
  descricao: string;
  valor: number;
}

export interface MaterialOption {
  id: string;
  label: string;
  stoneId: string;
  stoneName: string;
  pricePerM2: number;
  materialDoCliente: boolean;
}

export interface MaoDeObra {
  corte: string;
  corteTipo: 'fixo' | 'm2';
  polimento: string;
  polimentoTipo: 'fixo' | 'm2';
  instalacao: string;
  instalacaoTipo: 'fixo' | 'm2';
  visitaTecnica: string;
  corte45: string;
  corte45Tipo: 'fixo' | 'ml';
  corte45Metros: string;
  servicosCustom: ServicoCustom[];
}

export interface Instalacao {
  medicao: string;
  transporte: string;
  maoDeObra: string;
  semInstalacao: boolean;
}

export interface Ambiente {
  id: string;
  tipo: string;
  nomeCustom: string;
  pecas: PecaItem[];
  materialOptions: MaterialOption[];
  maoDeObra: MaoDeObra;
  instalacao: Instalacao;
}

export interface AcessorioItem {
  id: string;
  nome: string;
  quantidade: string;
  valorUnitario: string;
}

export interface OrcamentoData {
  clienteNome: string;
  tipoAmbiente: string;
  dataOrcamento: string;
  validadeDias: string;
  ambientes: Ambiente[];
  acessorios: AcessorioItem[];
  margemLucro: number;
  descontoValor: string;
  descontoTipo: 'percent' | 'reais';
  condicoesPagamento: string;
  observacoes: string;
}

export const AMBIENTE_TIPOS = [
  'Cozinha',
  'Banheiro Social',
  'Banheiro Suíte',
  'Lavatório Avulso',
  'Bancada Tanque',
  'Lavanderia',
  'Área da Piscina',
  'Acabamentos (Soleiras e Peitoris)',
  'Área Externa',
  'Ambiente Personalizado',
];

export const PECA_TIPOS: Record<string, string[]> = {
  'Cozinha': ['Bancada', 'Soleira', 'Peitoril', 'Rodapé/Filete', 'Nicho Embutido', 'Peça Personalizada'],
  'Banheiro Social': ['Bancada de Banheiro', 'Box - Piso', 'Soleira', 'Nicho Embutido', 'Rodapé/Filete', 'Peça Personalizada'],
  'Banheiro Suíte': ['Bancada de Banheiro', 'Box - Piso', 'Soleira', 'Nicho Embutido', 'Rodapé/Filete', 'Peça Personalizada'],
  'Lavatório Avulso': ['Lavatório', 'Soleira', 'Peça Personalizada'],
  'Bancada Tanque': ['Bancada Tanque', 'Peça Personalizada'],
  'Lavanderia': ['Bancada', 'Soleira', 'Rodapé/Filete', 'Peça Personalizada'],
  'Área da Piscina': ['Borda de Piscina', 'Escada/Degrau', 'Soleira', 'Peça Personalizada'],
  'Acabamentos (Soleiras e Peitoris)': ['Soleira', 'Peitoril', 'Rodapé/Filete', 'Peça Personalizada'],
  'Área Externa': ['Bancada', 'Soleira', 'Escada/Degrau', 'Borda de Piscina', 'Peça Personalizada'],
  'Ambiente Personalizado': ['Bancada', 'Lavatório', 'Bancada de Banheiro', 'Box - Piso', 'Soleira', 'Peitoril', 'Rodapé/Filete', 'Borda de Piscina', 'Escada/Degrau', 'Nicho Embutido', 'Bancada Tanque', 'Peça Personalizada'],
};

export const TIPO_CUBA = ['Sem cuba', 'Cuba de embutir', 'Cuba esculpida', 'Cuba colada por baixo (undermount)', 'Cuba sobreposta', 'Cuba flush'];
export const TIPO_REBAIXO = ['Sem rebaixo', 'Rebaixo americano', 'Rebaixo italiano', 'Rebaixo tradicional'];
export const ACABAMENTO_BORDA = ['Reto', 'Meia bola (boleado)', 'Chanfrado 45°', 'Ogiva', 'Quadrado com filete'];
export const BORDAS_COM_ACABAMENTO = ['Só frontal', 'Frontal e laterais', 'Todas as bordas'];
export const FUROS_TORNEIRA = ['Nenhum', '1 furo', '2 furos', '3 furos'];

export const newServicoCustom = (): ServicoCustom => ({
  id: crypto.randomUUID(),
  descricao: '',
  valor: '',
  tipo: 'fixo',
});

export const newPeca = (tipo: string = 'Bancada'): PecaItem => ({
  id: crypto.randomUUID(),
  tipo,
  descricao: '',
  largura: '',
  comprimento: '',
  quantidade: '1',
  tipoCuba: 'Sem cuba',
  valorCuba: '',
  tipoRebaixo: 'Sem rebaixo',
  acabamentoBorda: 'Reto',
  valorAcabamentoBorda: '',
  bordasComAcabamento: 'Só frontal',
  furosTorneira: 'Nenhum',
  espelhoBacksplash: false,
  espelhoBacksplashAltura: '',
  saiaFrontal: false,
  saiaFrontalAltura: '',
  rebaixoCooktop: false,
  rebaixoCooktopLargura: '',
  rebaixoCooktopComprimento: '',
  valorRebaixo: '',
  ilhargas: false,
  ilhargasQtd: '2',
  ilhargasAltura: '',
  ilhargasLargura: '',
  extras: [],
});

export const newMaterialOption = (label: string): MaterialOption => ({
  id: crypto.randomUUID(),
  label,
  stoneId: '',
  stoneName: '',
  pricePerM2: 0,
  materialDoCliente: false,
});

export const newAmbiente = (tipo: string): Ambiente => ({
  id: crypto.randomUUID(),
  tipo,
  nomeCustom: '',
  pecas: [newPeca(PECA_TIPOS[tipo]?.[0] || 'Bancada')],
  materialOptions: [newMaterialOption('Opção A')],
  maoDeObra: {
    corte: '', corteTipo: 'fixo',
    polimento: '', polimentoTipo: 'fixo',
    instalacao: '', instalacaoTipo: 'fixo',
    visitaTecnica: '',
    corte45: '', corte45Tipo: 'ml', corte45Metros: '',
    servicosCustom: [],
  },
  instalacao: { medicao: '', transporte: '', maoDeObra: '', semInstalacao: false },
});

export const newAcessorio = (): AcessorioItem => ({
  id: crypto.randomUUID(),
  nome: '',
  quantidade: '1',
  valorUnitario: '',
});

/**
 * Calcula a área total de uma peça incluindo espelho e saia
 * conforme o tipo de borda selecionado.
 * Largura e comprimento em metros. Alturas de espelho/saia em cm.
 */
export const calcPecaArea = (p: PecaItem): number => {
  const w = parseFloat(p.largura) || 0;    // largura em metros
  const l = parseFloat(p.comprimento) || 0; // comprimento em metros
  const q = parseInt(p.quantidade) || 1;

  // Área base da peça
  let area = w * l * q;

  // Espelho (backsplash) — altura em cm, convertida para metros
  const espelhoAltura = p.espelhoBacksplash ? (parseFloat(p.espelhoBacksplashAltura) || 0) / 100 : 0;
  // Saia frontal — altura em cm, convertida para metros
  const saiaAltura = p.saiaFrontal ? (parseFloat(p.saiaFrontalAltura) || 0) / 100 : 0;

  if (p.bordasComAcabamento === 'Só frontal') {
    // Espelho: atrás (comprimento da peça)
    if (espelhoAltura > 0) area += l * espelhoAltura * q;
    // Saia: frente (comprimento da peça)
    if (saiaAltura > 0) area += l * saiaAltura * q;
  } else if (p.bordasComAcabamento === 'Frontal e laterais') {
    // Espelho: atrás (comprimento) + 2 laterais (largura)
    if (espelhoAltura > 0) area += (l + w * 2) * espelhoAltura * q;
    // Saia: frente (comprimento) + 2 laterais (largura)
    if (saiaAltura > 0) area += (l + w * 2) * saiaAltura * q;
  } else if (p.bordasComAcabamento === 'Todas as bordas') {
    const perimeter = (l + w) * 2;
    if (espelhoAltura > 0) area += perimeter * espelhoAltura * q;
    if (saiaAltura > 0) area += perimeter * saiaAltura * q;
  } else {
    // Fallback: só frontal
    if (espelhoAltura > 0) area += l * espelhoAltura * q;
    if (saiaAltura > 0) area += l * saiaAltura * q;
  }

  return area;
};

export const calcAmbienteArea = (amb: Ambiente): number => {
  return amb.pecas.reduce((sum, p) => sum + calcPecaArea(p), 0);
};

export const calcAmbienteMaterialCost = (amb: Ambiente, optionIndex: number): number => {
  const opt = amb.materialOptions[optionIndex];
  if (!opt || opt.materialDoCliente) return 0;
  const area = calcAmbienteArea(amb);
  const areaWithMargin = area * 1.1;
  return areaWithMargin * opt.pricePerM2;
};

/**
 * Calcula todos os custos de serviços/mão de obra de um ambiente:
 * - Corte, polimento, instalação (fixo ou por m²)
 * - Visita técnica
 * - Corte 45° (fixo ou por metro linear)
 * - Rebaixo (valor por peça)
 * - Valor de cuba (por peça)
 * - Valor de acabamento de borda (por peça, para piscina etc)
 * - Extras por peça
 * - Serviços customizados
 */
export const calcAmbienteLaborCost = (amb: Ambiente): number => {
  const area = calcAmbienteArea(amb);
  const areaWithMargin = area * 1.1;
  const mo = amb.maoDeObra;
  let total = 0;

  // Corte
  total += mo.corteTipo === 'm2' ? (parseFloat(mo.corte) || 0) * areaWithMargin : (parseFloat(mo.corte) || 0);
  // Polimento
  total += mo.polimentoTipo === 'm2' ? (parseFloat(mo.polimento) || 0) * areaWithMargin : (parseFloat(mo.polimento) || 0);
  // Instalação (mão de obra)
  total += mo.instalacaoTipo === 'm2' ? (parseFloat(mo.instalacao) || 0) * areaWithMargin : (parseFloat(mo.instalacao) || 0);
  // Visita técnica
  total += parseFloat(mo.visitaTecnica) || 0;

  // Corte 45°
  if (mo.corte45Tipo === 'ml') {
    total += (parseFloat(mo.corte45) || 0) * (parseFloat(mo.corte45Metros) || 0);
  } else {
    total += parseFloat(mo.corte45) || 0;
  }

  // Rebaixo por peça
  amb.pecas.forEach(p => {
    if (p.tipoRebaixo !== 'Sem rebaixo') {
      total += parseFloat(p.valorRebaixo) || 0;
    }
  });

  // Valor cuba por peça
  amb.pecas.forEach(p => {
    if (p.tipoCuba !== 'Sem cuba') {
      total += parseFloat(p.valorCuba) || 0;
    }
  });

  // Valor acabamento borda por peça (piscina, etc)
  amb.pecas.forEach(p => {
    if (p.valorAcabamentoBorda) {
      const bordaVal = parseFloat(p.valorAcabamentoBorda) || 0;
      if (bordaVal > 0) {
        // Calcula metros lineares de borda conforme tipo
        const l = parseFloat(p.comprimento) || 0;
        const w = parseFloat(p.largura) || 0;
        const q = parseInt(p.quantidade) || 1;
        let ml = 0;
        if (p.bordasComAcabamento === 'Só frontal') {
          ml = l * q;
        } else if (p.bordasComAcabamento === 'Frontal e laterais') {
          ml = (l + w * 2) * q;
        } else if (p.bordasComAcabamento === 'Todas as bordas') {
          ml = (l + w) * 2 * q;
        } else {
          ml = l * q;
        }
        total += bordaVal * ml;
      }
    }
  });

  // Extras por peça
  amb.pecas.forEach(p => {
    p.extras.forEach(e => { total += e.valor; });
  });

  // Serviços customizados
  (mo.servicosCustom || []).forEach(s => {
    const val = parseFloat(s.valor) || 0;
    if (s.tipo === 'm2') {
      total += val * areaWithMargin;
    } else if (s.tipo === 'ml') {
      // Para ml, usa-se o valor diretamente (metros definidos no campo)
      total += val;
    } else {
      total += val;
    }
  });

  return total;
};

export const calcAmbienteInstallCost = (amb: Ambiente): number => {
  if (amb.instalacao.semInstalacao) return 0;
  return (parseFloat(amb.instalacao.medicao) || 0) +
    (parseFloat(amb.instalacao.transporte) || 0) +
    (parseFloat(amb.instalacao.maoDeObra) || 0);
};

export const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
