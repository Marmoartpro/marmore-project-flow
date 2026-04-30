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

export type CubaFundoTipo =
  | 'reto'
  | 'inclinado_escoamento'
  | 'cuba_dentro_cuba'
  | 'canaleta_central'
  | 'fundo_curvo';

export interface CubaEsculpidaData {
  compExterno: string;
  largExterno: string;
  compInterno: string;
  largInterno: string;
  profundidade: string;
  espessuraParede: string;
  quantidade: string;
  // Tipo de fundo da cuba (afeta área de acabamento e custo de mão de obra)
  fundoTipo: CubaFundoTipo;
  // Profundidade do rebaixo central (escoamento/canaleta) — cm
  fundoProfundidadeExtra: string;
  // Custo adicional por cuba pelo tipo de fundo (R$)
  fundoValorAdicional: string;
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
  lPosicao: string;
  // Geometric shapes
  raio: string;
  baseMaior: string;
  baseMenor: string;
  alturaForma: string;
  angulo: string;
  areaManualCm2: string;
  // Cuba
  tipoCuba: string;
  valorCuba: string;
  cubaEsculpida: CubaEsculpidaData;
  // Rebaixo
  tipoRebaixo: string;
  valorRebaixo: string;
  rebaixoComprimento: string;
  rebaixoLargura: string;
  // Rebaixo tradicional (filete por ml)
  rebaixoTradicionalML: string;
  valorRebaixoTradicionalML: string;
  // Borda
  acabamentoBorda: string;
  valorAcabamentoBorda: string;
  valorChanfrado45ML: string;
  bordasComAcabamento: string;
  // Seleção individual de bordas (modo avançado). Se ativo, sobrepõe `bordasComAcabamento`.
  bordasLadosAtivo: boolean;
  bordaFrente: boolean;
  bordaFundo: boolean;
  bordaEsquerda: boolean;
  bordaDireita: boolean;
  // Saia (independente das bordas)
  saiaOpcao: string;
  // Furos
  furosTorneira: string;
  valorFuroTorneira: string;
  // Espelho / Saia
  espelhoBacksplash: boolean;
  espelhoBacksplashAltura: string;
  saiaFrontal: boolean;
  saiaFrontalAltura: string;
  // Cooktop
  rebaixoCooktop: boolean;
  rebaixoCooktopLargura: string;
  rebaixoCooktopComprimento: string;
  valorRecorteCooktop: string;
  // Ilhargas / pés revestidos
  ilhargas: boolean;
  ilhargasQtd: string;
  ilhargasAltura: string;
  ilhargasLargura: string;
  // Prateleira inferior (lavatório)
  prateleira: boolean;
  prateleiraLargura: string;
  prateleiraComprimento: string;
  prateleiraAltura: string;
  prateleiraComSaia: boolean;
  // Piscina
  cantosInternos: string;
  valorCantoInterno: string;
  cantosExternos: string;
  valorCantoExterno: string;
  canaletaEscoamento: boolean;
  canaletaMetros: string;
  valorCanaletaMetro: string;
  profundidadeSubmersa: string;
  // Escada
  alturaEspelho: string;
  frisosAntiderrapante: boolean;
  qtdFrisosPorDegrau: string;
  valorFrisoMetro: string;
  // Soleira / Peitoril
  metodoCalculo: 'area' | 'ml';
  boleadoLados: string;
  valorBoleadoMetro: string;
  pingadeira: boolean;
  valorPingadeiraMetro: string;
  encaixePorta: boolean;
  profundidadeEncaixe: string;
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
  perimetroAmbiente: string;
  larguraPortas: string;
  // Tampo de mesa
  furoColuna: boolean;
  valorFuroColuna: string;
  diametroFuro: string;
  // Nicho Embutido
  nichoProfundidade: string;
  nichoQtdPrateleiras: string;
  valorServicoNicho: string;
  nichoPolimentoML: string;       // metros lineares de borda polida (boca do nicho)
  valorPolimentoML: string;       // R$ por ML de polimento
  nichoQtd45: string;             // qtd de cantos com 45° interno
  valorServico45: string;         // R$ por canto 45°
  // Jardineira / Vaso (largura e comprimento = boca; altura = profundidade do vaso)
  jardineiraAltura: string;          // altura/profundidade interna em cm
  jardineiraEspessuraParede: string; // cm (visual/cálculo de topo)
  jardineiraComFundo: boolean;       // se há fundo em pedra
  jardineiraFuroDreno: boolean;      // furo de drenagem
  valorFuroDreno: string;            // R$ por furo
  // Box banheiro
  paredesBox: string;
  alturaParede: string;
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
  // Prateleira/Canaleta de Box (sobreposta — sem cortar parede)
  prateleiraBoxQtd: string;             // quantidade de prateleiras/canaletas
  prateleiraBoxComprimento: string;     // cm — extensão horizontal (largura da parede)
  prateleiraBoxProfundidade: string;    // cm — quanto sai da parede (profundidade da base)
  prateleiraBoxAlturaAba: string;       // cm — altura da aba frontal (borda contenção)
  prateleiraBoxTampasLaterais: boolean; // adiciona 2 tampas laterais fechando os cantos
  prateleiraBoxCorteEscoamento: boolean;// inclui corte/rasgo p/ escoamento
  valorServicoCorteEscoamento: string;  // R$ por corte de escoamento (cobrança fixa)
  valorServicoPrateleiraBox: string;    // R$ adicional por prateleira (montagem/colagem)
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
  polimentoTipo: 'fixo' | 'm2' | 'ml';
  instalacao: string;
  instalacaoTipo: 'fixo' | 'm2';
  visitaTecnica: string;
  corte45: string;
  corte45Tipo: 'fixo' | 'ml';
  corte45Metros: string;
  // Chanfrado 45° independente (R$/ml)
  polimentoChanfradoML: string;
  polimentoChanfradoTipo: 'fixo' | 'ml';
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
  'Lavabo',
  'Lavatório Avulso',
  'Bancada Tanque',
  'Lavanderia',
  'Área da Piscina',
  'Acabamentos (Soleiras e Peitoris)',
  'Área Externa',
  'Sala / Estar',
  'Área Gourmet',
  'Churrasqueira',
  'Escadaria',
  'Ambiente Personalizado',
];

export const PECA_TIPOS: Record<string, string[]> = {
  'Cozinha': [
    'Bancada', 'Ilha Gourmet', 'Península', 'Bancada com Cooktop', 'Frontão',
    'Soleira', 'Peitoril', 'Rodapé/Filete', 'Nicho Embutido',
    'Revestimento de Parede', 'Piso', 'Peça Personalizada',
  ],
  'Banheiro Social': [
    'Bancada de Banheiro', 'Bancada Suspensa', 'Tampo Cuba Dupla',
    'Frontão de Banheira', 'Box - Piso', 'Soleira de Box', 'Soleira',
    'Nicho Embutido', 'Nicho de Box', 'Prateleira/Canaleta de Box',
    'Rodapé/Filete', 'Revestimento de Parede', 'Peça Personalizada',
  ],
  'Banheiro Suíte': [
    'Bancada de Banheiro', 'Bancada Suspensa', 'Tampo Cuba Dupla',
    'Frontão de Banheira', 'Box - Piso', 'Soleira de Box', 'Soleira',
    'Nicho Embutido', 'Nicho de Box', 'Prateleira/Canaleta de Box',
    'Rodapé/Filete', 'Revestimento de Parede', 'Peça Personalizada',
  ],
  'Lavatório Avulso': ['Lavatório', 'Soleira', 'Peça Personalizada'],
  'Bancada Tanque': ['Bancada Tanque', 'Peça Personalizada'],
  'Lavanderia': ['Bancada', 'Soleira', 'Rodapé/Filete', 'Piso', 'Peça Personalizada'],
  'Área da Piscina': [
    'Borda de Piscina', 'Escada/Degrau', 'Espelho de Escada', 'Rodapé Escada',
    'Soleira', 'Piso', 'Peça Personalizada',
  ],
  'Acabamentos (Soleiras e Peitoris)': [
    'Soleira', 'Peitoril', 'Rodapé/Filete', 'Calha/Pingadeira', 'Peça Personalizada',
  ],
  'Área Externa': [
    'Bancada', 'Bancada de Churrasqueira', 'Lavabo Externo',
    'Soleira', 'Peitoril', 'Escada/Degrau', 'Espelho de Escada',
    'Borda de Piscina', 'Piso', 'Revestimento de Parede',
    'Jardineira/Vaso', 'Peça Personalizada',
  ],
  'Sala / Estar': [
    'Tampo de Mesa', 'Mesa de Mármore', 'Revestimento de Parede',
    'Lareira', 'Piso', 'Rodapé/Filete', 'Jardineira/Vaso', 'Peça Personalizada',
  ],
  'Área Gourmet': [
    'Bancada', 'Bancada Gourmet', 'Ilha Gourmet', 'Bancada com Cooktop',
    'Bancada de Churrasqueira', 'Soleira', 'Piso', 'Revestimento de Parede',
    'Jardineira/Vaso', 'Peça Personalizada',
  ],
  'Churrasqueira': [
    'Bancada de Churrasqueira', 'Tampo de Grelha', 'Revestimento de Parede',
    'Lareira', 'Soleira', 'Peça Personalizada',
  ],
  'Lavabo': [
    'Lavatório', 'Bancada de Banheiro', 'Bancada Suspensa', 'Frontão',
    'Soleira', 'Peça Personalizada',
  ],
  'Escadaria': [
    'Escada/Degrau', 'Espelho de Escada', 'Rodapé Escada', 'Soleira',
    'Peça Personalizada',
  ],
  'Ambiente Personalizado': [
    'Bancada', 'Bancada Gourmet', 'Bancada com Cooktop', 'Ilha Gourmet', 'Península',
    'Lavatório', 'Bancada de Banheiro', 'Bancada Suspensa', 'Tampo Cuba Dupla',
    'Frontão', 'Frontão de Banheira',
    'Box - Piso', 'Soleira de Box', 'Nicho de Box', 'Prateleira/Canaleta de Box',
    'Soleira', 'Peitoril', 'Rodapé/Filete', 'Calha/Pingadeira',
    'Borda de Piscina', 'Escada/Degrau', 'Espelho de Escada', 'Rodapé Escada',
    'Bancada de Churrasqueira', 'Tampo de Grelha', 'Lavabo Externo',
    'Nicho Embutido', 'Bancada Tanque', 'Revestimento de Parede', 'Piso',
    'Tampo de Mesa', 'Mesa de Mármore', 'Lareira',
    'Jardineira/Vaso', 'Peça Personalizada',
  ],
};

export const TIPO_CUBA = [
  'Sem cuba', 'Cuba de embutir', 'Cuba esculpida',
  'Cuba colada por baixo (undermount)', 'Cuba sobreposta', 'Cuba flush',
];
export const TIPO_REBAIXO = ['Sem rebaixo', 'Rebaixo americano', 'Rebaixo italiano', 'Rebaixo tradicional'];
export const ACABAMENTO_BORDA = ['Reto', 'Meia bola (boleado)', 'Chanfrado 45°', 'Ogiva', 'Quadrado com filete'];
export const BORDAS_COM_ACABAMENTO = [
  'Sem acabamento de borda',
  'Só frontal',
  'Frontal e lado direito',
  'Frontal e lado esquerdo',
  'Frontal e duas laterais',
  'Todas as bordas',
];
export const SAIA_OPCOES = [
  'Só frente',
  'Frente e lado direito',
  'Frente e lado esquerdo',
  'Frente e duas laterais',
  'Todas as 4 laterais',
];
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
  fundoTipo: 'reto', fundoProfundidadeExtra: '', fundoValorAdicional: '',
});

export const newPeca = (tipo: string = 'Bancada'): PecaItem => ({
  id: crypto.randomUUID(),
  nomePeca: '',
  tipo,
  descricao: '',
  formato: 'retangular',
  largura: '', comprimento: '', quantidade: '1',
  lTrecho2Largura: '', lTrecho2Comprimento: '', lPosicao: 'superior_direito',
  raio: '', baseMaior: '', baseMenor: '', alturaForma: '',
  angulo: '', areaManualCm2: '',
  tipoCuba: 'Sem cuba', valorCuba: '',
  cubaEsculpida: emptyCubaEsculpida(),
  tipoRebaixo: 'Sem rebaixo', valorRebaixo: '',
  rebaixoComprimento: '', rebaixoLargura: '',
  rebaixoTradicionalML: '', valorRebaixoTradicionalML: '',
  acabamentoBorda: 'Reto', valorAcabamentoBorda: '',
  valorChanfrado45ML: '',
  bordasComAcabamento: 'Só frontal',
  bordasLadosAtivo: false,
  bordaFrente: true, bordaFundo: false, bordaEsquerda: false, bordaDireita: false,
  saiaOpcao: 'Só frente',
  furosTorneira: 'Nenhum', valorFuroTorneira: '',
  espelhoBacksplash: false, espelhoBacksplashAltura: '',
  saiaFrontal: false, saiaFrontalAltura: '',
  rebaixoCooktop: false, rebaixoCooktopLargura: '', rebaixoCooktopComprimento: '',
  valorRecorteCooktop: '',
  ilhargas: false, ilhargasQtd: '2', ilhargasAltura: '', ilhargasLargura: '',
  prateleira: false, prateleiraLargura: '', prateleiraComprimento: '', prateleiraAltura: '', prateleiraComSaia: false,
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
  nichoPolimentoML: '', valorPolimentoML: '', nichoQtd45: '0', valorServico45: '',
  jardineiraAltura: '', jardineiraEspessuraParede: '2',
  jardineiraComFundo: true, jardineiraFuroDreno: false, valorFuroDreno: '',
  paredesBox: '0', alturaParede: '', larguraParede1: '', larguraParede2: '', larguraParede3: '',
  bancoBox: false, bancoLargura: '', bancoComprimento: '', bancoAltura: '',
  raloLinear: false, raloComprimento: '', raloLargura: '', valorServicoRalo: '',
  nichoBoxLargura: '', nichoBoxAltura: '', nichoBoxProfundidade: '', nichoBoxQtd: '0',
  valorServicoNichoBox: '',
  prateleiraBoxQtd: '0', prateleiraBoxComprimento: '', prateleiraBoxProfundidade: '',
  prateleiraBoxAlturaAba: '', prateleiraBoxTampasLaterais: false,
  prateleiraBoxCorteEscoamento: false, valorServicoCorteEscoamento: '',
  valorServicoPrateleiraBox: '',
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
    corte45: '', corte45Tipo: 'ml', corte45Metros: '',
    polimentoChanfradoML: '', polimentoChanfradoTipo: 'ml',
    servicosCustom: [],
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
export const ceilM2 = (v: number): number => Math.ceil(v * 100) / 100;
export const ceilML = (v: number): number => Math.ceil(v * 10) / 10;
export const ceilMoney = (v: number): number => Math.ceil(v * 100) / 100;
export const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Parse cm string to number */
const cm = (s: string): number => parseFloat(s) || 0;
/** Convert cm² to m² */
const cm2toM2 = (cm2: number): number => cm2 / 10000;

/* ─── Area Calculations (all inputs in cm) ─── */

export const calcPecaAreaBase = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  // Prateleira/Canaleta de Box: área é totalmente derivada de campos próprios (extras).
  if (p.tipo === 'Prateleira/Canaleta de Box') return 0;
  let areaCm2 = 0;

  switch (p.formato) {
    case 'retangular':
      areaCm2 = cm(p.largura) * cm(p.comprimento);
      break;
    case 'l_shape': {
      const a1 = cm(p.largura) * cm(p.comprimento);
      const a2 = cm(p.lTrecho2Largura) * cm(p.lTrecho2Comprimento);
      const overlapW = Math.min(cm(p.largura), cm(p.lTrecho2Largura));
      const overlap = overlapW * overlapW;
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

export const calcPecaDeductions = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  let deductCm2 = 0;

  if (['Cuba de embutir', 'Cuba colada por baixo (undermount)'].includes(p.tipoCuba)) {
    const ce = p.cubaEsculpida;
    const cubaQ = parseInt(ce.quantidade) || 1;
    deductCm2 += cm(ce.compExterno) * cm(ce.largExterno) * cubaQ;
  }

  if (p.tipoCuba === 'Cuba sobreposta') {
    const ce = p.cubaEsculpida;
    deductCm2 += cm(ce.compExterno) * cm(ce.largExterno) * 0.8 * (parseInt(ce.quantidade) || 1);
  }

  if (p.rebaixoCooktop) {
    deductCm2 += cm(p.rebaixoCooktopLargura) * cm(p.rebaixoCooktopComprimento);
  }

  if (p.furoColuna && cm(p.diametroFuro) > 0) {
    deductCm2 += Math.PI * Math.pow(cm(p.diametroFuro) / 2, 2);
  }

  return cm2toM2(deductCm2) * q;
};

/** Helper: calculate saia area based on saiaOpcao (independent from bordas) */
const calcSaiaArea = (p: PecaItem): number => {
  const saiaH = p.saiaFrontal ? cm(p.saiaFrontalAltura) : 0;
  if (saiaH <= 0) return 0;
  const w = cm(p.largura);
  const l = cm(p.comprimento);
  const opcao = p.saiaOpcao || 'Só frente';

  switch (opcao) {
    case 'Só frente': return l * saiaH;
    case 'Frente e lado direito': return (l + w) * saiaH;
    case 'Frente e lado esquerdo': return (l + w) * saiaH;
    case 'Frente e duas laterais': return (l + w * 2) * saiaH;
    case 'Todas as 4 laterais': return (l * 2 + w * 2) * saiaH;
    default: return l * saiaH;
  }
};

/** Retorna quais lados têm acabamento. Prioriza modo avançado (bordasLadosAtivo). */
export const getBordasLados = (p: PecaItem): { frente: boolean; fundo: boolean; esq: boolean; dir: boolean } => {
  if (p.bordasLadosAtivo) {
    return { frente: !!p.bordaFrente, fundo: !!p.bordaFundo, esq: !!p.bordaEsquerda, dir: !!p.bordaDireita };
  }
  switch (p.bordasComAcabamento || 'Só frontal') {
    case 'Sem acabamento de borda': return { frente: false, fundo: false, esq: false, dir: false };
    case 'Só frontal': return { frente: true, fundo: false, esq: false, dir: false };
    case 'Frontal e lado direito': return { frente: true, fundo: false, esq: false, dir: true };
    case 'Frontal e lado esquerdo': return { frente: true, fundo: false, esq: true, dir: false };
    case 'Frontal e duas laterais':
    case 'Frontal e laterais': return { frente: true, fundo: false, esq: true, dir: true };
    case 'Todas as bordas': return { frente: true, fundo: true, esq: true, dir: true };
    default: return { frente: true, fundo: false, esq: false, dir: false };
  }
};

/** Helper: calculate espelho area based on bordas selecionadas */
const calcEspelhoArea = (p: PecaItem): number => {
  const espH = p.espelhoBacksplash ? cm(p.espelhoBacksplashAltura) : 0;
  if (espH <= 0) return 0;
  const w = cm(p.largura);
  const l = cm(p.comprimento);
  const lados = getBordasLados(p);
  // Espelho geralmente é nas bordas que encostam na parede — usamos os lados selecionados
  let perim = 0;
  if (lados.frente) perim += l;
  if (lados.fundo) perim += l;
  if (lados.esq) perim += w;
  if (lados.dir) perim += w;
  return perim * espH;
};

export const calcPecaExtrasArea = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  let extraCm2 = 0;

  // Espelho (uses bordasComAcabamento)
  extraCm2 += calcEspelhoArea(p);

  // Saia (uses saiaOpcao, independent)
  extraCm2 += calcSaiaArea(p);

  // Ilhargas / pés revestidos
  if (p.ilhargas) {
    const ilhQ = parseInt(p.ilhargasQtd) || 0;
    extraCm2 += ilhQ * cm(p.ilhargasAltura) * cm(p.ilhargasLargura);
  }

  // Prateleira inferior (lavatório)
  if (p.prateleira) {
    extraCm2 += cm(p.prateleiraLargura) * cm(p.prateleiraComprimento);
    // Saia da prateleira
    if (p.prateleiraComSaia && cm(p.prateleiraAltura) > 0) {
      extraCm2 += cm(p.prateleiraLargura) * cm(p.prateleiraAltura);
    }
  }

  // Piscina submersa
  if (cm(p.profundidadeSubmersa) > 0) {
    extraCm2 += cm(p.profundidadeSubmersa) * cm(p.comprimento);
  }

  // Escada — espelho vertical
  if (p.tipo === 'Escada/Degrau' && cm(p.alturaEspelho) > 0) {
    extraCm2 += cm(p.alturaEspelho) * cm(p.comprimento);
  }

  // Box paredes
  const nParedes = parseInt(p.paredesBox) || 0;
  if (nParedes >= 1) extraCm2 += cm(p.alturaParede) * cm(p.larguraParede1);
  if (nParedes >= 2) extraCm2 += cm(p.alturaParede) * cm(p.larguraParede2);
  if (nParedes >= 3) extraCm2 += cm(p.alturaParede) * cm(p.larguraParede3);

  // Banco no box
  if (p.bancoBox) {
    extraCm2 += cm(p.bancoLargura) * cm(p.bancoComprimento);
    extraCm2 += cm(p.bancoAltura) * cm(p.bancoComprimento);
  }

  // Nicho no box — 5 faces internas (fundo + topo + base + 2 laterais)
  const nichoQ = parseInt(p.nichoBoxQtd) || 0;
  if (nichoQ > 0) {
    const nW = cm(p.nichoBoxLargura);
    const nH = cm(p.nichoBoxAltura);
    const nD = cm(p.nichoBoxProfundidade);
    extraCm2 += nichoQ * (nW * nH + 2 * nW * nD + 2 * nD * nH);
  }

  // Prateleira/Canaleta de Box — peça sobreposta na parede (tipo "L" deitado)
  // Área = base (comp×prof) + aba frontal (comp×altAba) + opcional 2 tampas laterais (prof×altAba)
  if (p.tipo === 'Prateleira/Canaleta de Box') {
    const pratQ = parseInt(p.prateleiraBoxQtd) || 1;
    const pComp = cm(p.prateleiraBoxComprimento);
    const pProf = cm(p.prateleiraBoxProfundidade);
    const pAba = cm(p.prateleiraBoxAlturaAba);
    let pCm2 = pComp * pProf;                       // base superior
    if (pAba > 0) pCm2 += pComp * pAba;             // aba frontal
    if (p.prateleiraBoxTampasLaterais && pAba > 0) {
      pCm2 += 2 * (pProf * pAba);                   // 2 tampas laterais
    }
    extraCm2 += pratQ * pCm2;
  }

  // Revestimento — deduct aberturas
  if (p.aberturas && p.aberturas.length > 0) {
    p.aberturas.forEach(ab => {
      extraCm2 -= cm(ab.largura) * cm(ab.altura);
    });
  }

  return cm2toM2(extraCm2) * q;
};

/** Nicho embutido standalone — 5 faces internas + prateleiras
 * largura (w) = boca largura, comprimento (h) = boca altura, profundidade (d).
 * Faces: fundo (w×h) + topo (w×d) + base (w×d) + 2 laterais (d×h) + prateleiras (w×d)
 */
export const calcNichoArea = (p: PecaItem): number => {
  if (p.tipo !== 'Nicho Embutido') return 0;
  const q = parseInt(p.quantidade) || 1;
  const w = cm(p.largura);
  const h = cm(p.comprimento);
  const d = cm(p.nichoProfundidade);
  const nPrat = parseInt(p.nichoQtdPrateleiras) || 0;
  let areaCm2 = w * h;          // fundo
  areaCm2 += 2 * (w * d);       // topo + base
  areaCm2 += 2 * (d * h);       // laterais
  areaCm2 += nPrat * w * d;     // prateleiras
  return cm2toM2(areaCm2) * q;
};

export const calcJardineiraArea = (p: PecaItem): number => {
  if (p.tipo !== 'Jardineira/Vaso') return 0;
  const q = parseInt(p.quantidade) || 1;
  const w = cm(p.largura);
  const l = cm(p.comprimento);
  const h = cm(p.jardineiraAltura);
  if (w <= 0 || l <= 0 || h <= 0) return 0;
  // 4 paredes externas (perímetro × altura) + opcional fundo (largura × comprimento)
  let areaCm2 = 2 * (w + l) * h;
  if (p.jardineiraComFundo) areaCm2 += w * l;
  return cm2toM2(areaCm2) * q;
};

export const calcPecaAreaLiquida = (p: PecaItem): number => {
  if (p.tipo === 'Nicho Embutido') return calcNichoArea(p);
  if (p.tipo === 'Jardineira/Vaso') return calcJardineiraArea(p);
  const base = calcPecaAreaBase(p);
  const deductions = calcPecaDeductions(p);
  const extras = calcPecaExtrasArea(p);
  return Math.max(0, base - deductions + extras);
};

export const calcPecaAreaCompra = (p: PecaItem): number => {
  const liquida = calcPecaAreaLiquida(p);
  const wastePercent = (p.padraoPiso === 'espinha' || p.padraoPiso === 'diagonal' || p.padraoPiso === 'xadrez')
    && ['Piso'].includes(p.tipo) ? 0.15 : 0.10;
  const withWaste = liquida * (1 + wastePercent);
  return ceilM2(Math.max(withWaste, liquida > 0 ? 0.10 : 0));
};

export const calcPecaArea = calcPecaAreaLiquida;

/** Cuba esculpida detailed calculation */
export interface CubaEsculpidaCalc {
  paredeFrontal: number;
  paredeTraseira: number;
  paredeLateralEsq: number;
  paredeLateralDir: number;
  fundo: number;
  fundoExtra: number;     // área adicional gerada pelo tipo de fundo
  fundoLabel: string;     // descrição amigável
  totalM2: number;
  volumeCm3: number;
}

export const CUBA_FUNDO_OPCOES: { value: CubaFundoTipo; label: string; descricao: string }[] = [
  { value: 'reto', label: 'Fundo reto', descricao: 'Fundo plano horizontal (padrão)' },
  { value: 'inclinado_escoamento', label: 'Inclinado p/ escoamento', descricao: 'Caimento suave em direção ao ralo (+~5% área)' },
  { value: 'cuba_dentro_cuba', label: 'Cuba dentro de cuba', descricao: 'Rebaixo central interno adicional' },
  { value: 'canaleta_central', label: 'Canaleta central', descricao: 'Canaleta linear de escoamento' },
  { value: 'fundo_curvo', label: 'Fundo curvo (côncavo)', descricao: 'Fundo arredondado tipo concha (+~15% área)' },
];

export const calcCubaEsculpida = (ce: CubaEsculpidaData): CubaEsculpidaCalc => {
  const ci = cm(ce.compInterno);
  const li = cm(ce.largInterno);
  const prof = cm(ce.profundidade);
  const esp = cm(ce.espessuraParede) || 2;
  const cubaQ = parseInt(ce.quantidade) || 1;
  const fundoTipo = ce.fundoTipo || 'reto';
  const profExtra = cm(ce.fundoProfundidadeExtra);

  // Paredes internas
  const frontal = cm2toM2(ci * prof) * cubaQ;
  const traseira = cm2toM2(ci * prof) * cubaQ;
  const latEsq = cm2toM2(li * prof) * cubaQ;
  const latDir = cm2toM2(li * prof) * cubaQ;
  const fundoBase = cm2toM2(ci * li) * cubaQ;
  // Topo das paredes (espessura visível)
  const topoParedes = cm2toM2(2 * (ci + li + 2 * esp) * esp) * cubaQ;

  // Acréscimo de área pelo tipo de fundo
  let fundoExtraCm2 = 0;
  let fundoLabel = 'Fundo reto';
  switch (fundoTipo) {
    case 'inclinado_escoamento':
      // Fundo inclinado ~3-5° → acréscimo ~5% sobre área do fundo
      fundoExtraCm2 = ci * li * 0.05;
      fundoLabel = 'Inclinado para escoamento';
      break;
    case 'cuba_dentro_cuba': {
      // Rebaixo central com profundidade extra (default 3cm) ocupando ~60% da área
      const pe = profExtra > 0 ? profExtra : 3;
      const subCi = ci * 0.7;
      const subLi = li * 0.7;
      // 4 paredes do rebaixo + área do fundo do rebaixo (já contada como parte do fundo, então só somamos paredes)
      fundoExtraCm2 = 2 * (subCi + subLi) * pe;
      fundoLabel = `Cuba dentro de cuba (rebaixo ${pe} cm)`;
      break;
    }
    case 'canaleta_central': {
      // Canaleta longitudinal: largura 5cm × prof extra (default 2cm) × comprimento interno
      const pe = profExtra > 0 ? profExtra : 2;
      const cw = 5; // cm
      // 2 laterais + fundo da canaleta
      fundoExtraCm2 = (2 * pe + cw) * ci;
      fundoLabel = `Canaleta central (${cw}×${pe} cm)`;
      break;
    }
    case 'fundo_curvo':
      // Fundo curvo aumenta área superficial em ~15%
      fundoExtraCm2 = ci * li * 0.15;
      fundoLabel = 'Fundo curvo (côncavo)';
      break;
    default:
      break;
  }
  const fundoExtra = cm2toM2(fundoExtraCm2) * cubaQ;

  const total = frontal + traseira + latEsq + latDir + fundoBase + topoParedes + fundoExtra;
  const volume = ci * li * prof * cubaQ;

  return {
    paredeFrontal: ceilM2(frontal),
    paredeTraseira: ceilM2(traseira),
    paredeLateralEsq: ceilM2(latEsq),
    paredeLateralDir: ceilM2(latDir),
    fundo: ceilM2(fundoBase),
    fundoExtra: ceilM2(fundoExtra),
    fundoLabel,
    totalM2: ceilM2(total),
    volumeCm3: Math.ceil(volume),
  };
};

/** Helper: calculate ml for bordas selecionadas (modo avançado ou legado) */
const calcBordaML = (p: PecaItem, l: number, w: number): number => {
  const lados = getBordasLados(p);
  let ml = 0;
  if (lados.frente) ml += l;
  if (lados.fundo) ml += l;
  if (lados.esq) ml += w;
  if (lados.dir) ml += w;
  return ml;
};

/** Metros lineares de borda — calcula perímetro real por formato */
export const calcMetrosLinearesBorda = (p: PecaItem): number => {
  const q = parseInt(p.quantidade) || 1;
  let ml = 0;

  // Soleira/Peitoril usa boleadoLados para definir ml
  if (['Soleira', 'Peitoril'].includes(p.tipo)) {
    const lados = parseInt(p.boleadoLados) || 0;
    if (lados === 0) {
      const l = cm(p.comprimento) / 100;
      const w = cm(p.largura) / 100;
      ml = calcBordaML(p, l, w);
      return ceilML(ml * q);
    }
    ml = (cm(p.comprimento) / 100) * lados;
    return ceilML(ml * q);
  }

  switch (p.formato) {
    case 'l_shape': {
      const c1 = cm(p.comprimento) / 100;
      const w1 = cm(p.largura) / 100;
      const c2 = cm(p.lTrecho2Comprimento) / 100;
      const w2 = cm(p.lTrecho2Largura) / 100;
      const overlapSide = Math.min(w1, w2);
      const lados = getBordasLados(p);
      if (lados.frente) ml += Math.max(0, c1 + c2 - overlapSide);
      if (lados.fundo) ml += Math.max(0, c1 + c2 - overlapSide);
      if (lados.esq) ml += w1 + w2;
      if (lados.dir) ml += w1 + w2;
      break;
    }
    case 'redondo':
      ml = 2 * Math.PI * cm(p.raio) / 100;
      break;
    case 'oval': {
      const a = cm(p.comprimento) / 2 / 100;
      const b = cm(p.largura) / 2 / 100;
      ml = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      break;
    }
    case 'semicircular':
      ml = (Math.PI * cm(p.raio) + 2 * cm(p.raio)) / 100;
      break;
    case 'triangular': {
      const base = cm(p.comprimento) / 100;
      const lado = cm(p.largura) / 100;
      ml = base + lado * 2;
      break;
    }
    case 'trapezoidal': {
      const bM = cm(p.baseMaior) / 100;
      const bm = cm(p.baseMenor) / 100;
      const h = cm(p.alturaForma) / 100;
      const ladoT = Math.sqrt(Math.pow((bM - bm) / 2, 2) + h * h);
      ml = bM + bm + ladoT * 2;
      break;
    }
    default: {
      const l = cm(p.comprimento) / 100;
      const w = cm(p.largura) / 100;
      ml = calcBordaML(p, l, w);
    }
  }

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

  // Corte
  total += mo.corteTipo === 'm2' ? (parseFloat(mo.corte) || 0) * areaCompra : (parseFloat(mo.corte) || 0);

  // Polimento — fixo, m² ou ml
  if (mo.polimentoTipo === 'm2') {
    total += (parseFloat(mo.polimento) || 0) * areaCompra;
  } else if (mo.polimentoTipo === 'ml') {
    const totalML = amb.pecas.reduce((s, p) => s + calcMetrosLinearesBorda(p), 0);
    total += (parseFloat(mo.polimento) || 0) * totalML;
  } else {
    total += parseFloat(mo.polimento) || 0;
  }

  // Chanfrado 45° independente (por ml das peças com chanfrado)
  if (mo.polimentoChanfradoTipo === 'ml') {
    const totalML45 = amb.pecas
      .filter(p => p.acabamentoBorda === 'Chanfrado 45°')
      .reduce((s, p) => s + calcMetrosLinearesBorda(p), 0);
    total += (parseFloat(mo.polimentoChanfradoML) || 0) * totalML45;
  } else {
    total += parseFloat(mo.polimentoChanfradoML) || 0;
  }

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

    // Rebaixo: tradicional = por ml, americano/italiano = por m²
    if (p.tipoRebaixo !== 'Sem rebaixo') {
      if (p.tipoRebaixo === 'Rebaixo tradicional') {
        total += (parseFloat(p.valorRebaixoTradicionalML) || 0) * (parseFloat(p.rebaixoTradicionalML) || 0) * q;
      } else {
        const areaRebaixo = cm(p.rebaixoComprimento) * cm(p.rebaixoLargura) / 10000;
        total += (parseFloat(p.valorRebaixo) || 0) * areaRebaixo * q;
      }
    }

    // Cuba — esculpida por m² (totalM2 já inclui cubaQ; só multiplica por q de peças)
    if (p.tipoCuba !== 'Sem cuba') {
      if (p.tipoCuba === 'Cuba esculpida') {
        const cubaCalc = calcCubaEsculpida(p.cubaEsculpida);
        // FIX: totalM2 já considera quantidade de cubas internamente
        total += (parseFloat(p.valorCuba) || 0) * cubaCalc.totalM2 * q;
        // Adicional fixo pelo tipo de fundo (por cuba, não por m²)
        const cubaQ = parseInt(p.cubaEsculpida.quantidade) || 1;
        const fundoAdic = parseFloat(p.cubaEsculpida.fundoValorAdicional) || 0;
        if (fundoAdic > 0) total += fundoAdic * cubaQ * q;
      } else {
        const cubaQ = parseInt(p.cubaEsculpida.quantidade) || 1;
        total += (parseFloat(p.valorCuba) || 0) * cubaQ * q;
      }
    }

    // Acabamento borda — FIX: chanfrado 45° é cobrado em polimentoChanfradoML, evita duplicidade
    if (p.valorAcabamentoBorda && p.acabamentoBorda !== 'Chanfrado 45°') {
      const bordaVal = parseFloat(p.valorAcabamentoBorda) || 0;
      if (bordaVal > 0) total += bordaVal * calcMetrosLinearesBorda(p);
    }
    // Chanfrado 45° por peça (caso usuário preencha valorAcabamentoBorda mas não use polimentoChanfradoML)
    if (p.acabamentoBorda === 'Chanfrado 45°' && parseFloat(p.valorAcabamentoBorda) > 0
        && (!parseFloat(amb.maoDeObra.polimentoChanfradoML) || amb.maoDeObra.polimentoChanfradoTipo !== 'ml')) {
      total += (parseFloat(p.valorAcabamentoBorda) || 0) * calcMetrosLinearesBorda(p);
    }

    // Furos torneira
    if (p.furosTorneira !== 'Nenhum') {
      const nFuros = parseInt(p.furosTorneira) || 0;
      total += nFuros * (parseFloat(p.valorFuroTorneira) || 0) * q;
    }

    // Recorte cooktop
    if (p.rebaixoCooktop) total += (parseFloat(p.valorRecorteCooktop) || 0) * q;

    // Piscina cantos
    total += (parseInt(p.cantosInternos) || 0) * (parseFloat(p.valorCantoInterno) || 0) * q;
    total += (parseInt(p.cantosExternos) || 0) * (parseFloat(p.valorCantoExterno) || 0) * q;

    // Canaleta escoamento
    if (p.canaletaEscoamento) {
      total += (parseFloat(p.canaletaMetros) || 0) * (parseFloat(p.valorCanaletaMetro) || 0) * q;
    }

    // Escada frisos antiderrapante — FIX: friso percorre a LARGURA do degrau (sentido transversal),
    // não o comprimento. q = quantidade de degraus.
    if (p.frisosAntiderrapante) {
      const larguraDegrau = cm(p.largura) / 100; // largura do degrau em metros
      const nFrisos = parseInt(p.qtdFrisosPorDegrau) || 2;
      total += (parseFloat(p.valorFrisoMetro) || 0) * nFrisos * larguraDegrau * q;
    }

    // Soleira/Peitoril boleado
    if (parseInt(p.boleadoLados) > 0) {
      total += (parseFloat(p.valorBoleadoMetro) || 0) * (cm(p.comprimento) / 100) * parseInt(p.boleadoLados) * q;
    }

    // Pingadeira
    if (p.pingadeira) {
      total += (parseFloat(p.valorPingadeiraMetro) || 0) * (cm(p.comprimento) / 100) * q;
    }

    // Encaixe porta
    if (p.encaixePorta) total += (parseFloat(p.valorEncaixe) || 0) * q;

    // Rodapé cantos e acabamento superior
    if (p.tipo === 'Rodapé/Filete') {
      total += (parseInt(p.rodapeCantosInternos) || 0) * (parseFloat(p.valorCantoRodape) || 0) * q;
      total += (parseInt(p.rodapeCantosExternos) || 0) * (parseFloat(p.valorCantoRodape) || 0) * q;
      if (parseFloat(p.valorAcabSuperior) > 0) {
        total += (parseFloat(p.valorAcabSuperior) || 0) * (cm(p.comprimento) / 100) * q;
      }
    }

    // Painel ripado
    if (p.painelRipado) total += (parseFloat(p.valorRecorteDecorat) || 0) * q;

    // Furo coluna tampo
    if (p.furoColuna) total += (parseFloat(p.valorFuroColuna) || 0) * q;

    // Nicho Embutido — serviço base + polimento de bordas (ML) + 45° internos
    if (p.tipo === 'Nicho Embutido') {
      total += (parseFloat(p.valorServicoNicho) || 0) * q;
      const polML = parseFloat(p.nichoPolimentoML) || 0;
      total += polML * (parseFloat(p.valorPolimentoML) || 0) * q;
      const qtd45 = parseInt(p.nichoQtd45) || 0;
      total += qtd45 * (parseFloat(p.valorServico45) || 0) * q;
    }

    // Jardineira/Vaso — furo de dreno
    if (p.tipo === 'Jardineira/Vaso' && p.jardineiraFuroDreno) {
      total += (parseFloat(p.valorFuroDreno) || 0) * q;
    }

    // Box ralo
    if (p.raloLinear) total += (parseFloat(p.valorServicoRalo) || 0) * q;

    // Box nicho
    if ((parseInt(p.nichoBoxQtd) || 0) > 0) {
      total += (parseInt(p.nichoBoxQtd) || 0) * (parseFloat(p.valorServicoNichoBox) || 0) * q;
    }

    // Extras
    (p.extras || []).forEach(e => { total += (e.valor || 0) * q; });
  });

  // Serviços customizados
  (mo.servicosCustom || []).forEach(s => {
    const val = parseFloat(s.valor) || 0;
    if (s.tipo === 'm2') total += val * areaCompra;
    else if (s.tipo === 'ml') {
      const totalML = amb.pecas.reduce((sum, p) => sum + calcMetrosLinearesBorda(p), 0);
      total += val * totalML;
    }
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

      if (['Bancada', 'Ilha Gourmet', 'Bancada de Banheiro'].includes(p.tipo) && l > 400) {
        alertas.push({
          tipo: 'warning', pecaId: p.id,
          mensagem: `Bancada muito longa (${(l / 100).toFixed(1)}m) — verifique se haverá emenda.`,
        });
      }

      if (p.tipo === 'Borda de Piscina' && l / 100 > 50) {
        alertas.push({
          tipo: 'info', pecaId: p.id,
          mensagem: 'Projeto grande — considere solicitar orçamento especial ao fornecedor.',
        });
      }

      if (p.tipo === 'Soleira' && w > 0 && w < 8) {
        alertas.push({
          tipo: 'warning', pecaId: p.id,
          mensagem: 'Soleira muito estreita — verifique disponibilidade deste corte.',
        });
      }

      if (p.tipoCuba === 'Cuba esculpida') {
        const prof = cm(p.cubaEsculpida.profundidade);
        const esp = cm(p.cubaEsculpida.espessuraParede);
        if (prof > 0 && prof > 15) {
          alertas.push({
            tipo: 'danger', pecaId: p.id,
            mensagem: `Profundidade da cuba (${prof}cm) muito grande.`,
          });
        }
        if (esp > 0 && esp < 1.5) {
          alertas.push({
            tipo: 'danger', pecaId: p.id,
            mensagem: `Espessura da parede da cuba (${esp}cm) muito fina — risco de quebra.`,
          });
        }
      }

      if (w > 0 && w < 10 && !['Rodapé/Filete', 'Soleira'].includes(p.tipo)) {
        alertas.push({
          tipo: 'info', pecaId: p.id,
          mensagem: `Peça estreita (${w}cm) — pode precisar chapa inteira.`,
        });
      }
    });
  });

  if (areaTotal > 50) {
    alertas.push({
      tipo: 'info',
      mensagem: `Projeto grande (${fmt(areaTotal)} m²) — recomendamos visita técnica.`,
    });
  }

  return alertas;
};

/* ─── Material Summary ─── */

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
