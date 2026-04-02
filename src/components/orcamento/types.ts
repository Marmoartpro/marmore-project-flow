/* ─── Orcamento Types ─── All measurements in CENTIMETERS ─── */

export interface ServicoCustom {
  id: string;
  descricao: string;
  valor: string;
  tipo: 'fixo' | 'm2' | 'ml';
}

export interface ExtraItem {
  id: string;
  descricao: string;
  valor: number;
}

export interface Abertura {
  id: string;
  descricao: string;
  largura: string; // cm
  altura: string;  // cm
}

export interface CubaEsculpidaData {
  compExterno: string;
  largExterno: string;
  compInterno: string;
  largInterno: string;
  profundidade: string;
  espessuraParede: string;
  quantidade: string;
}

export type FormatoPeca =
  | 'retangular' | 'l_shape' | 'oval' | 'redondo'
  | 'triangular' | 'trapezoidal' | 'semicircular'
  | 'setor_circular' | 'irregular';

export interface PecaItem {
  id: string;
  nomePeca: string;
  tipo: string;
  descricao: string;
  formato: FormatoPeca;
  // Dimensions in cm
  largura: string;
  comprimento: string;
  quantidade: string;
  // L-shape (two rectangles)
  lTrecho2Largura: string;
  lTrecho2Comprimento: string;
  // Geometric shapes
  raio: string;          // redondo / semicircular / setor
  baseMaior: string;     // trapézio
  baseMenor: string;     // trapézio
  alturaForma: string;   // triângulo / trapézio
  angulo: string;        // setor circular
  areaManualCm2: string; // irregular
  // Cuba
  tipoCuba: string;
  valorCuba: string;
  cubaEsculpida: CubaEsculpidaData;
  // Rebaixo
  tipoRebaixo: string;
  valorRebaixo: string;
  rebaixoComprimento: string; // cm
  rebaixoLargura: string;     // cm
  // Borda
  acabamentoBorda: string;
  valorAcabamentoBorda: string;
  bordasComAcabamento: string;
  // Furos
  furosTorneira: string;
  valorFuroTorneira: string;
  // Espelho / Saia
  espelhoBacksplash: boolean;
  espelhoBacksplashAltura: string; // cm
  saiaFrontal: boolean;
  saiaFrontalAltura: string;       // cm
  // Cooktop
  rebaixoCooktop: boolean;
  rebaixoCooktopLargura: string;   // cm
  rebaixoCooktopComprimento: string; // cm
  valorRecorteCooktop: string;
  // Ilhargas / pés revestidos
  ilhargas: boolean;
  ilhargasQtd: string;
  ilhargasAltura: string; // cm
  ilhargasLargura: string; // cm
  // Prateleira inferior (lavatório)
  prateleira: boolean;
  prateleiraLargura: string;
  prateleiraComprimento: string;
  // Piscina
  cantosInternos: string;
  valorCantoInterno: string;
  cantosExternos: string;
  valorCantoExterno: string;
  canaletaEscoamento: boolean;
  canaletaMetros: string;
  valorCanaletaMetro: string;
  profundidadeSubmersa: string; // cm
  // Escada
  alturaEspelho: string;  // cm (parte vertical do degrau)
  frisosAntiderrapante: boolean;
  qtdFrisosPorDegrau: string;
  valorFrisoMetro: string;
  // Soleira / Peitoril
  metodoCalculo: 'area' | 'ml';
  boleadoLados: string; // '0' | '1' | '2'
  valorBoleadoMetro: string;
  pingadeira: boolean;
  valorPingadeiraMetro: string;
  encaixePorta: boolean;
  profundidadeEncaixe: string; // cm
  valorEncaixe: string;
  // Rodapé / Filete
  rodapeCantosInternos: string;
  rodapeCantosExternos: string;
  valorCantoRodape: string;
  valorAcabSuperior: string;
  // Revestimento de parede
  aberturas: Abertura[];
  painelRipado: boolean;
  valorRecorteDecorat: string;
  // Piso
  padraoPiso: 'normal' | 'espinha' | 'diagonal' | 'xadrez';
  rodapeIntegrado: boolean;
  perimetroAmbiente: string; // cm
  larguraPortas: string;     // cm
  // Tampo de mesa
  furoColuna: boolean;
  valorFuroColuna: string;
  diametroFuro: string; // cm
  // Nicho
  nichoProfundidade: string; // cm
  nichoQtdPrateleiras: string;
  valorServicoNicho: string;
  // Box banheiro
  paredesBox: string; // qty of walls
  alturaParede: string; // cm
  larguraParede1: string;
  larguraParede2: string;
  larguraParede3: string;
  bancoBox: boolean;
  bancoLargura: string;
  bancoComprimento: string;
  bancoAltura: string;
  raloLinear: boolean;
  raloComprimento: string;
  raloLargura: string;
  valorServicoRalo: string;
  // Nicho in box
  nichoBoxLargura: string;
  nichoBoxAltura: string;
  nichoBoxProfundidade: string;
  nichoBoxQtd: string;
  valorServicoNichoBox: string;
  // Extras
  extras: ExtraItem[];
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

/* ─── Constants ─── */

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
  'Sala / Estar',
  'Área Gourmet',
  'Ambiente Personalizado',
];

export const PECA_TIPOS: Record<string, string[]> = {
  'Cozinha': ['Bancada', 'Ilha Gourmet', 'Soleira', 'Peitoril', 'Rodapé/Filete', 'Nicho Embutido', 'Revestimento de Parede', 'Piso', 'Peça Personalizada'],
  'Banheiro Social': ['Bancada de Banheiro', 'Box - Piso', 'Soleira', 'Nicho Embutido', 'Rodapé/Filete', 'Revestimento de Parede', 'Peça Personalizada'],
  'Banheiro Suíte': ['Bancada de Banheiro', 'Box - Piso', 'Soleira', 'Nicho Embutido', 'Rodapé/Filete', 'Revestimento de Parede', 'Peça Personalizada'],
  'Lavatório Avulso': ['Lavatório', 'Soleira', 'Peça Personalizada'],
  'Bancada Tanque': ['Bancada Tanque', 'Peça Personalizada'],
  'Lavanderia': ['Bancada', 'Soleira', 'Rodapé/Filete', 'Piso', 'Peça Personalizada'],
  'Área da Piscina': ['Borda de Piscina', 'Escada/Degrau', 'Soleira', 'Piso', 'Peça Personalizada'],
  'Acabamentos (Soleiras e Peitoris)': ['Soleira', 'Peitoril', 'Rodapé/Filete', 'Peça Personalizada'],
  'Área Externa': ['Bancada', 'Soleira', 'Escada/Degrau', 'Borda de Piscina', 'Piso', 'Peça Personalizada'],
  'Sala / Estar': ['Tampo de Mesa', 'Revestimento de Parede', 'Piso', 'Rodapé/Filete', 'Lareira', 'Peça Personalizada'],
  'Área Gourmet': ['Bancada', 'Ilha Gourmet', 'Soleira', 'Piso', 'Revestimento de Parede', 'Peça Personalizada'],
  'Ambiente Personalizado': [
    'Bancada', 'Ilha Gourmet', 'Lavatório', 'Bancada de Banheiro', 'Box - Piso',
    'Soleira', 'Peitoril', 'Rodapé/Filete', 'Borda de Piscina', 'Escada/Degrau',
    'Nicho Embutido', 'Bancada Tanque', 'Revestimento de Parede', 'Piso',
    'Tampo de Mesa', 'Calha/Pingadeira', 'Lareira', 'Peça Personalizada',
  ],
};

export const TIPO_CUBA = [
  'Sem cuba', 'Cuba de embutir', 'Cuba esculpida',
  'Cuba colada por baixo (undermount)', 'Cuba sobreposta', 'Cuba flush',
];
export const TIPO_REBAIXO = ['Sem rebaixo', 'Rebaixo americano', 'Rebaixo italiano', 'Rebaixo tradicional'];
export const ACABAMENTO_BORDA = ['Reto', 'Meia bola (boleado)', 'Chanfrado 45°', 'Ogiva', 'Quadrado com filete'];
export const BORDAS_COM_ACABAMENTO = ['Só frontal', 'Frontal e laterais', 'Todas as bordas'];
export const FUROS_TORNEIRA = ['Nenhum', '1 furo', '2 furos', '3 furos'];
export const FORMATOS_PECA: { value: FormatoPeca; label: string }[] = [
  { value: 'retangular', label: 'Retangular' },
  { value: 'l_shape', label: 'Em L' },
  { value: 'oval', label: 'Oval' },
  { value: 'redondo', label: 'Redondo' },
  { value: 'triangular', label: 'Triângulo' },
  { value: 'trapezoidal', label: 'Trapézio' },
  { value: 'semicircular', label: 'Semicírculo' },
  { value: 'setor_circular', label: 'Setor circular' },
  { value: 'irregular', label: 'Forma irregular' },
];
export const PADROES_PISO = [
  { value: 'normal', label: 'Normal (10% desperdício)' },
  { value: 'espinha', label: 'Espinha de peixe (15%)' },
  { value: 'diagonal', label: 'Diagonal (15%)' },
  { value: 'xadrez', label: 'Xadrez (15%)' },
];

/* ─── Factory functions ─── */

export const newServicoCustom = (): ServicoCustom => ({
  id: crypto.randomUUID(), descricao: '', valor: '', tipo: 'fixo',
});

const emptyCubaEsculpida = (): CubaEsculpidaData => ({
  compExterno: '', largExterno: '', compInterno: '', largInterno: '',
  profundidade: '', espessuraParede: '2', quantidade: '1',
});

export const newPeca = (tipo: string = 'Bancada'): PecaItem => ({
  id: crypto.randomUUID(),
  tipo,
  descricao: '',
  formato: 'retangular',
  largura: '', comprimento: '', quantidade: '1',
  lTrecho2Largura: '', lTrecho2Comprimento: '',
  raio: '', baseMaior: '', baseMenor: '', alturaForma: '',
  angulo: '', areaManualCm2: '',
  tipoCuba: 'Sem cuba', valorCuba: '',
  cubaEsculpida: emptyCubaEsculpida(),
  tipoRebaixo: 'Sem rebaixo', valorRebaixo: '',
  rebaixoComprimento: '', rebaixoLargura: '',
  acabamentoBorda: 'Reto', valorAcabamentoBorda: '',
  bordasComAcabamento: 'Só frontal',
  furosTorneira: 'Nenhum', valorFuroTorneira: '',
  espelhoBacksplash: false, espelhoBacksplashAltura: '',
  saiaFrontal: false, saiaFrontalAltura: '',
  rebaixoCooktop: false, rebaixoCooktopLargura: '', rebaixoCooktopComprimento: '',
  valorRecorteCooktop: '',
  ilhargas: false, ilhargasQtd: '2', ilhargasAltura: '', ilhargasLargura: '',
  prateleira: false, prateleiraLargura: '', prateleiraComprimento: '',
  cantosInternos: '0', valorCantoInterno: '',
  cantosExternos: '0', valorCantoExterno: '',
  canaletaEscoamento: false, canaletaMetros: '', valorCanaletaMetro: '',
  profundidadeSubmersa: '',
  alturaEspelho: '', frisosAntiderrapante: false, qtdFrisosPorDegrau: '2',
  valorFrisoMetro: '',
  metodoCalculo: 'area', boleadoLados: '0', valorBoleadoMetro: '',
  pingadeira: false, valorPingadeiraMetro: '',
  encaixePorta: false, profundidadeEncaixe: '', valorEncaixe: '',
  rodapeCantosInternos: '0', rodapeCantosExternos: '0',
  valorCantoRodape: '', valorAcabSuperior: '',
  aberturas: [], painelRipado: false, valorRecorteDecorat: '',
  padraoPiso: 'normal', rodapeIntegrado: false,
  perimetroAmbiente: '', larguraPortas: '',
  furoColuna: false, valorFuroColuna: '', diametroFuro: '',
  nichoProfundidade: '', nichoQtdPrateleiras: '0', valorServicoNicho: '',
  paredesBox: '0', alturaParede: '', larguraParede1: '', larguraParede2: '', larguraParede3: '',
  bancoBox: false, bancoLargura: '', bancoComprimento: '', bancoAltura: '',
  raloLinear: false, raloComprimento: '', raloLargura: '', valorServicoRalo: '',
  nichoBoxLargura: '', nichoBoxAltura: '', nichoBoxProfundidade: '', nichoBoxQtd: '0',
  valorServicoNichoBox: '',
  extras: [],
});

export const newMaterialOption = (label: string): MaterialOption => ({
  id: crypto.randomUUID(), label, stoneId: '', stoneName: '', pricePerM2: 0, materialDoCliente: false,
});

export const newAmbiente = (tipo: string): Ambiente => ({
  id: crypto.randomUUID(), tipo, nomeCustom: '',
  pecas: [newPeca(PECA_TIPOS[tipo]?.[0] || 'Bancada')],
  materialOptions: [newMaterialOption('Opção A')],
  maoDeObra: {
    corte: '', corteTipo: 'fixo', polimento: '', polimentoTipo: 'fixo',
    instalacao: '', instalacaoTipo: 'fixo', visitaTecnica: '',
    corte45: '', corte45Tipo: 'ml', corte45Metros: '', servicosCustom: [],
  },
  instalacao: { medicao: '', transporte: '', maoDeObra: '', semInstalacao: false },
});

export const newAcessorio = (): AcessorioItem => ({
  id: crypto.randomUUID(), nome: '', quantidade: '1', valorUnitario: '',
});

export const newAbertura = (): Abertura => ({
  id: crypto.randomUUID(), descricao: '', largura: '', altura: '',
});

/* ─── Formatting ─── */
/** Round up to 2 decimal places */
export const ceilM2 = (v: number): number => Math.ceil(v * 100) / 100;
/** Round up to 1 decimal place (for metros lineares) */
export const ceilML = (v: number): number => Math.ceil(v * 10) / 10;
/** Round up monetary values */
export const ceilMoney = (v: number): number => Math.ceil(v * 100) / 100;
export const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Parse cm string to number */
const cm = (s: string): number => parseFloat(s) || 0;
/** Convert cm² to m² */
const cm2toM2 = (cm2: number): number => cm2 / 10000;

/* ─── Area Calculations (all inputs in cm) ─── */

/** Calculate base area of piece in m² (without extras like espelho, saia) */
export const calcPecaAreaBase = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  let areaCm2 = 0;

  switch (p.formato) {
    case 'retangular':
      areaCm2 = cm(p.largura) * cm(p.comprimento);
      break;
    case 'l_shape': {
      const a1 = cm(p.largura) * cm(p.comprimento);
      const a2 = cm(p.lTrecho2Largura) * cm(p.lTrecho2Comprimento);
      // Deduct overlap at corner (largura of piece 2 x largura of piece 1)
      const overlapW = Math.min(cm(p.largura), cm(p.lTrecho2Largura));
      const overlap = overlapW * overlapW; // approximate square corner
      areaCm2 = a1 + a2 - overlap;
      break;
    }
    case 'oval':
      areaCm2 = Math.PI * (cm(p.comprimento) / 2) * (cm(p.largura) / 2);
      break;
    case 'redondo':
      areaCm2 = Math.PI * Math.pow(cm(p.raio), 2);
      break;
    case 'triangular':
      areaCm2 = (cm(p.comprimento) * cm(p.alturaForma)) / 2;
      break;
    case 'trapezoidal':
      areaCm2 = ((cm(p.baseMaior) + cm(p.baseMenor)) / 2) * cm(p.alturaForma);
      break;
    case 'semicircular':
      areaCm2 = (Math.PI * Math.pow(cm(p.raio), 2)) / 2;
      break;
    case 'setor_circular':
      areaCm2 = ((cm(p.angulo) || 0) / 360) * Math.PI * Math.pow(cm(p.raio), 2);
      break;
    case 'irregular':
      areaCm2 = cm(p.areaManualCm2);
      break;
    default:
      areaCm2 = cm(p.largura) * cm(p.comprimento);
  }

  return cm2toM2(areaCm2) * q;
};

/** Deductions from base area */
export const calcPecaDeductions = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  let deductCm2 = 0;

  // Cuba de embutir / undermount — deduct recorte
  if (['Cuba de embutir', 'Cuba colada por baixo (undermount)'].includes(p.tipoCuba)) {
    const ce = p.cubaEsculpida;
    const cubaQ = parseInt(ce.quantidade) || 1;
    deductCm2 += cm(ce.compExterno) * cm(ce.largExterno) * cubaQ;
  }

  // Cuba esculpida — NÃO desconta
  // Cuba sobreposta — small hole deduction (approximate)
  if (p.tipoCuba === 'Cuba sobreposta') {
    const ce = p.cubaEsculpida;
    deductCm2 += cm(ce.compExterno) * cm(ce.largExterno) * 0.8 * (parseInt(ce.quantidade) || 1);
  }

  // Rebaixo area (for reference, not deducted from material but from finished surface)
  // Cooktop recorte — deduct from m²
  if (p.rebaixoCooktop) {
    deductCm2 += cm(p.rebaixoCooktopLargura) * cm(p.rebaixoCooktopComprimento);
  }

  // Furo coluna (tampo de mesa)
  if (p.furoColuna && cm(p.diametroFuro) > 0) {
    deductCm2 += Math.PI * Math.pow(cm(p.diametroFuro) / 2, 2);
  }

  return cm2toM2(deductCm2) * q;
};

/** Calculates additional areas (espelho, saia, ilhargas, piscina submersa, etc.) in m² */
export const calcPecaExtrasArea = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  let extraCm2 = 0;
  const w = cm(p.largura);
  const l = cm(p.comprimento);

  // Espelho / backsplash
  const espH = p.espelhoBacksplash ? cm(p.espelhoBacksplashAltura) : 0;
  // Saia frontal
  const saiaH = p.saiaFrontal ? cm(p.saiaFrontalAltura) : 0;

  if (p.bordasComAcabamento === 'Só frontal') {
    if (espH > 0) extraCm2 += l * espH;
    if (saiaH > 0) extraCm2 += l * saiaH;
  } else if (p.bordasComAcabamento === 'Frontal e laterais') {
    if (espH > 0) extraCm2 += (l + w * 2) * espH;
    if (saiaH > 0) extraCm2 += (l + w * 2) * saiaH;
  } else if (p.bordasComAcabamento === 'Todas as bordas') {
    const perim = (l + w) * 2;
    if (espH > 0) extraCm2 += perim * espH;
    if (saiaH > 0) extraCm2 += perim * saiaH;
  } else {
    if (espH > 0) extraCm2 += l * espH;
    if (saiaH > 0) extraCm2 += l * saiaH;
  }

  // Ilhargas / pés revestidos
  if (p.ilhargas) {
    const ilhQ = parseInt(p.ilhargasQtd) || 0;
    extraCm2 += ilhQ * cm(p.ilhargasAltura) * cm(p.ilhargasLargura);
  }

  // Prateleira inferior (lavatório)
  if (p.prateleira) {
    extraCm2 += cm(p.prateleiraLargura) * cm(p.prateleiraComprimento);
  }

  // Piscina submersa
  if (cm(p.profundidadeSubmersa) > 0) {
    extraCm2 += cm(p.profundidadeSubmersa) * l;
  }

  // Escada — espelho vertical
  if (p.tipo === 'Escada/Degrau' && cm(p.alturaEspelho) > 0) {
    extraCm2 += cm(p.alturaEspelho) * l; // per step, q already handles multiples
  }

  // Box paredes
  const nParedes = parseInt(p.paredesBox) || 0;
  if (nParedes >= 1) extraCm2 += cm(p.alturaParede) * cm(p.larguraParede1);
  if (nParedes >= 2) extraCm2 += cm(p.alturaParede) * cm(p.larguraParede2);
  if (nParedes >= 3) extraCm2 += cm(p.alturaParede) * cm(p.larguraParede3);

  // Banco no box
  if (p.bancoBox) {
    extraCm2 += cm(p.bancoLargura) * cm(p.bancoComprimento); // tampo
    extraCm2 += cm(p.bancoAltura) * cm(p.bancoComprimento);  // frente
  }

  // Nicho no box
  const nichoQ = parseInt(p.nichoBoxQtd) || 0;
  if (nichoQ > 0) {
    const nW = cm(p.nichoBoxLargura);
    const nH = cm(p.nichoBoxAltura);
    const nD = cm(p.nichoBoxProfundidade);
    extraCm2 += nichoQ * (nW * nH + 2 * nD * nH); // fundo + 2 laterais
  }

  // Revestimento — deduct aberturas
  // (aberturas are subtracted, so they go as negative extras)
  if (p.aberturas && p.aberturas.length > 0) {
    p.aberturas.forEach(ab => {
      extraCm2 -= cm(ab.largura) * cm(ab.altura);
    });
  }

  return cm2toM2(extraCm2) * q;
};

/** Nicho embutido standalone */
export const calcNichoArea = (p: PecaItem): number => {
  if (p.tipo !== 'Nicho Embutido') return 0;
  const q = parseInt(p.quantidade) || 1;
  const w = cm(p.largura);
  const h = cm(p.comprimento); // using comprimento as height for nicho
  const d = cm(p.nichoProfundidade);
  const nPrat = parseInt(p.nichoQtdPrateleiras) || 0;
  let areaCm2 = w * h; // fundo
  areaCm2 += 2 * d * h; // laterais
  areaCm2 += nPrat * w * d; // prateleiras
  return cm2toM2(areaCm2) * q;
};

/** Total area of piece (m² líquido) */
export const calcPecaAreaLiquida = (p: PecaItem): number => {
  if (p.tipo === 'Nicho Embutido') return calcNichoArea(p);
  const base = calcPecaAreaBase(p);
  const deductions = calcPecaDeductions(p);
  const extras = calcPecaExtrasArea(p);
  return Math.max(0, base - deductions + extras);
};

/** Total area with waste margin */
export const calcPecaAreaCompra = (p: PecaItem): number => {
  const liquida = calcPecaAreaLiquida(p);
  const wastePercent = (p.padraoPiso === 'espinha' || p.padraoPiso === 'diagonal' || p.padraoPiso === 'xadrez')
    && ['Piso'].includes(p.tipo) ? 0.15 : 0.10;
  const withWaste = liquida * (1 + wastePercent);
  // Minimum 0.10 m² for small pieces
  return ceilM2(Math.max(withWaste, liquida > 0 ? 0.10 : 0));
};

// Legacy compat aliases
export const calcPecaArea = calcPecaAreaLiquida;

/** Cuba esculpida detailed calculation */
export interface CubaEsculpidaCalc {
  paredeFrontal: number;
  paredeTraseira: number;
  paredeLateralEsq: number;
  paredeLateralDir: number;
  fundo: number;
  totalM2: number;
  volumeCm3: number;
}

export const calcCubaEsculpida = (ce: CubaEsculpidaData): CubaEsculpidaCalc => {
  const ci = cm(ce.compInterno);
  const li = cm(ce.largInterno);
  const prof = cm(ce.profundidade);
  const cubaQ = parseInt(ce.quantidade) || 1;

  const frontal = cm2toM2(ci * prof) * cubaQ;
  const traseira = cm2toM2(ci * prof) * cubaQ;
  const latEsq = cm2toM2(li * prof) * cubaQ;
  const latDir = cm2toM2(li * prof) * cubaQ;
  const fundo = cm2toM2(ci * li) * cubaQ;
  const total = frontal + traseira + latEsq + latDir + fundo;
  const volume = ci * li * prof * cubaQ;

  return {
    paredeFrontal: ceilM2(frontal),
    paredeTraseira: ceilM2(traseira),
    paredeLateralEsq: ceilM2(latEsq),
    paredeLateralDir: ceilM2(latDir),
    fundo: ceilM2(fundo),
    totalM2: ceilM2(total),
    volumeCm3: Math.ceil(volume),
  };
};

/** Metros lineares de borda */
export const calcMetrosLinearesBorda = (p: PecaItem): number => {
  const l = cm(p.comprimento) / 100; // convert to meters
  const w = cm(p.largura) / 100;
  const q = parseInt(p.quantidade) || 1;
  let ml = 0;
  if (p.bordasComAcabamento === 'Só frontal') ml = l;
  else if (p.bordasComAcabamento === 'Frontal e laterais') ml = l + w * 2;
  else if (p.bordasComAcabamento === 'Todas as bordas') ml = (l + w) * 2;
  else ml = l;
  return ceilML(ml * q);
};

/* ─── Ambiente-level calculations ─── */

export const calcAmbienteArea = (amb: Ambiente): number => {
  return amb.pecas.reduce((sum, p) => sum + calcPecaAreaLiquida(p), 0);
};

export const calcAmbienteAreaCompra = (amb: Ambiente): number => {
  return amb.pecas.reduce((sum, p) => sum + calcPecaAreaCompra(p), 0);
};

export const calcAmbienteMaterialCost = (amb: Ambiente, optionIndex: number): number => {
  const opt = amb.materialOptions[optionIndex];
  if (!opt || opt.materialDoCliente) return 0;
  const areaCompra = calcAmbienteAreaCompra(amb);
  return ceilMoney(areaCompra * opt.pricePerM2);
};

/** Calcula todos os custos de serviços/mão de obra */
export const calcAmbienteLaborCost = (amb: Ambiente): number => {
  const areaCompra = calcAmbienteAreaCompra(amb);
  const mo = amb.maoDeObra;
  let total = 0;

  total += mo.corteTipo === 'm2' ? (parseFloat(mo.corte) || 0) * areaCompra : (parseFloat(mo.corte) || 0);
  total += mo.polimentoTipo === 'm2' ? (parseFloat(mo.polimento) || 0) * areaCompra : (parseFloat(mo.polimento) || 0);
  total += mo.instalacaoTipo === 'm2' ? (parseFloat(mo.instalacao) || 0) * areaCompra : (parseFloat(mo.instalacao) || 0);
  total += parseFloat(mo.visitaTecnica) || 0;

  if (mo.corte45Tipo === 'ml') {
    total += (parseFloat(mo.corte45) || 0) * (parseFloat(mo.corte45Metros) || 0);
  } else {
    total += parseFloat(mo.corte45) || 0;
  }

  // Per-piece costs
  amb.pecas.forEach(p => {
    const q = parseInt(p.quantidade) || 1;

    // Rebaixo
    if (p.tipoRebaixo !== 'Sem rebaixo') total += parseFloat(p.valorRebaixo) || 0;

    // Cuba value
    if (p.tipoCuba !== 'Sem cuba') {
      total += parseFloat(p.valorCuba) || 0;
      // Cuba esculpida service cost
      if (p.tipoCuba === 'Cuba esculpida') {
        const cubaCalc = calcCubaEsculpida(p.cubaEsculpida);
        // cubaCalc.totalM2 is already the sculpted area — cost = totalM2 * valor per m² (stored in valorCuba)
        // valorCuba is the total cost set by user, so we don't multiply again
      }
    }

    // Acabamento borda
    if (p.valorAcabamentoBorda) {
      const bordaVal = parseFloat(p.valorAcabamentoBorda) || 0;
      if (bordaVal > 0) total += bordaVal * calcMetrosLinearesBorda(p);
    }

    // Furos torneira
    if (p.furosTorneira !== 'Nenhum') {
      const nFuros = parseInt(p.furosTorneira) || 0;
      total += nFuros * (parseFloat(p.valorFuroTorneira) || 0);
    }

    // Recorte cooktop
    if (p.rebaixoCooktop) total += parseFloat(p.valorRecorteCooktop) || 0;

    // Piscina cantos
    total += (parseInt(p.cantosInternos) || 0) * (parseFloat(p.valorCantoInterno) || 0);
    total += (parseInt(p.cantosExternos) || 0) * (parseFloat(p.valorCantoExterno) || 0);

    // Canaleta escoamento
    if (p.canaletaEscoamento) {
      total += (parseFloat(p.canaletaMetros) || 0) * (parseFloat(p.valorCanaletaMetro) || 0);
    }

    // Escada frisos antiderrapante
    if (p.frisosAntiderrapante) {
      const mlFrisos = (cm(p.comprimento) / 100) * (parseInt(p.qtdFrisosPorDegrau) || 0) * q;
      total += mlFrisos * (parseFloat(p.valorFrisoMetro) || 0);
    }

    // Soleira/Peitoril boleado
    if (parseInt(p.boleadoLados) > 0) {
      const mlSoleira = cm(p.comprimento) / 100 * q;
      total += parseInt(p.boleadoLados) * mlSoleira * (parseFloat(p.valorBoleadoMetro) || 0);
    }

    // Pingadeira
    if (p.pingadeira) {
      total += (cm(p.comprimento) / 100 * q) * (parseFloat(p.valorPingadeiraMetro) || 0);
    }

    // Encaixe porta
    if (p.encaixePorta) total += parseFloat(p.valorEncaixe) || 0;

    // Rodapé cantos
    total += (parseInt(p.rodapeCantosInternos) || 0) * (parseFloat(p.valorCantoRodape) || 0);
    total += (parseInt(p.rodapeCantosExternos) || 0) * (parseFloat(p.valorCantoRodape) || 0);

    // Rodapé acabamento superior
    if (parseFloat(p.valorAcabSuperior) > 0) {
      total += (cm(p.comprimento) / 100 * q) * (parseFloat(p.valorAcabSuperior) || 0);
    }

    // Painel ripado
    if (p.painelRipado) total += parseFloat(p.valorRecorteDecorat) || 0;

    // Piso rodapé integrado
    if (p.rodapeIntegrado) {
      const perimM = cm(p.perimetroAmbiente) / 100;
      const portasM = cm(p.larguraPortas) / 100;
      const mlRodape = perimM - portasM;
      // rodapé cost added as a separate line (user sets in serviços customizados)
    }

    // Furo coluna tampo
    if (p.furoColuna) total += parseFloat(p.valorFuroColuna) || 0;

    // Nicho serviço
    if (p.tipo === 'Nicho Embutido') total += parseFloat(p.valorServicoNicho) || 0;

    // Box ralo
    if (p.raloLinear) total += parseFloat(p.valorServicoRalo) || 0;

    // Box nicho
    if ((parseInt(p.nichoBoxQtd) || 0) > 0) {
      total += (parseInt(p.nichoBoxQtd) || 0) * (parseFloat(p.valorServicoNichoBox) || 0);
    }

    // Extras
    p.extras.forEach(e => { total += e.valor; });
  });

  // Serviços customizados
  (mo.servicosCustom || []).forEach(s => {
    const val = parseFloat(s.valor) || 0;
    if (s.tipo === 'm2') total += val * areaCompra;
    else total += val;
  });

  return ceilMoney(total);
};

export const calcAmbienteInstallCost = (amb: Ambiente): number => {
  if (amb.instalacao.semInstalacao) return 0;
  return ceilMoney(
    (parseFloat(amb.instalacao.medicao) || 0) +
    (parseFloat(amb.instalacao.transporte) || 0) +
    (parseFloat(amb.instalacao.maoDeObra) || 0)
  );
};

/* ─── Alerts ─── */

export interface AlertaOrcamento {
  tipo: 'warning' | 'danger' | 'info';
  mensagem: string;
  pecaId?: string;
}

export const gerarAlertas = (ambientes: Ambiente[]): AlertaOrcamento[] => {
  const alertas: AlertaOrcamento[] = [];
  let areaTotal = 0;

  ambientes.forEach(amb => {
    amb.pecas.forEach(p => {
      const w = cm(p.largura);
      const l = cm(p.comprimento);
      const area = calcPecaAreaLiquida(p);
      areaTotal += area;

      // Bancada > 4m (400cm)
      if (['Bancada', 'Ilha Gourmet', 'Bancada de Banheiro'].includes(p.tipo) && l > 400) {
        alertas.push({
          tipo: 'warning', pecaId: p.id,
          mensagem: `Bancada muito longa (${(l / 100).toFixed(1)}m) — verifique se haverá emenda. Emendas podem gerar custo adicional.`,
        });
      }

      // Borda piscina > 50m lineares
      if (p.tipo === 'Borda de Piscina' && l / 100 > 50) {
        alertas.push({
          tipo: 'info', pecaId: p.id,
          mensagem: 'Projeto grande — considere solicitar orçamento especial ao fornecedor.',
        });
      }

      // Soleira < 8cm largura
      if (p.tipo === 'Soleira' && w > 0 && w < 8) {
        alertas.push({
          tipo: 'warning', pecaId: p.id,
          mensagem: 'Soleira muito estreita — verifique disponibilidade deste corte no material escolhido.',
        });
      }

      // Cuba esculpida profundidade > espessura pedra (we don't know thickness, warn > 5cm)
      if (p.tipoCuba === 'Cuba esculpida') {
        const prof = cm(p.cubaEsculpida.profundidade);
        const esp = cm(p.cubaEsculpida.espessuraParede);
        if (prof > 0 && prof > 15) {
          alertas.push({
            tipo: 'danger', pecaId: p.id,
            mensagem: `Profundidade da cuba (${prof}cm) muito grande — verifique se a espessura da pedra é suficiente.`,
          });
        }
        if (esp > 0 && esp < 1.5) {
          alertas.push({
            tipo: 'danger', pecaId: p.id,
            mensagem: `Espessura da parede da cuba (${esp}cm) muito fina — risco de quebra. Recomendamos mínimo de 1,5cm.`,
          });
        }
      }

      // Peça estreita < 10cm
      if (w > 0 && w < 10 && !['Rodapé/Filete', 'Soleira'].includes(p.tipo)) {
        alertas.push({
          tipo: 'info', pecaId: p.id,
          mensagem: `Peça estreita (${w}cm) — pode ser necessário comprar uma chapa inteira dependendo do material.`,
        });
      }
    });
  });

  // Área total > 50m²
  if (areaTotal > 50) {
    alertas.push({
      tipo: 'info',
      mensagem: `Projeto de grande porte (${fmt(areaTotal)} m²) — recomendamos visita técnica antes de fechar o orçamento.`,
    });
  }

  return alertas;
};

/* ─── Material Summary (internal) ─── */

export interface ResumoMaterial {
  stoneName: string;
  stoneId: string;
  totalM2Liquido: number;
  totalM2Compra: number;
  pricePerM2: number;
  custoTotal: number;
  chapasNecessarias: number;
}

export const calcResumoConsumo = (
  ambientes: Ambiente[],
  optionIndex: number = 0,
  m2PorChapa: number = 6,
): ResumoMaterial[] => {
  const map = new Map<string, ResumoMaterial>();

  ambientes.forEach(amb => {
    const idx = Math.min(optionIndex, amb.materialOptions.length - 1);
    const opt = amb.materialOptions[idx];
    if (!opt || opt.materialDoCliente || !opt.stoneId) return;

    const key = opt.stoneId;
    if (!map.has(key)) {
      map.set(key, {
        stoneName: opt.stoneName,
        stoneId: opt.stoneId,
        totalM2Liquido: 0,
        totalM2Compra: 0,
        pricePerM2: opt.pricePerM2,
        custoTotal: 0,
        chapasNecessarias: 0,
      });
    }
    const entry = map.get(key)!;
    const ambLiq = calcAmbienteArea(amb);
    const ambCompra = calcAmbienteAreaCompra(amb);
    entry.totalM2Liquido += ambLiq;
    entry.totalM2Compra += ambCompra;
    entry.custoTotal += ambCompra * opt.pricePerM2;
  });

  map.forEach(entry => {
    entry.totalM2Liquido = ceilM2(entry.totalM2Liquido);
    entry.totalM2Compra = ceilM2(entry.totalM2Compra);
    entry.custoTotal = ceilMoney(entry.custoTotal);
    entry.chapasNecessarias = Math.ceil(entry.totalM2Compra / m2PorChapa);
  });

  return Array.from(map.values());
};
