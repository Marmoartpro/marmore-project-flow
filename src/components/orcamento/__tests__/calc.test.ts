/**
 * Testes unitários das fórmulas centrais de orçamento.
 * Cobrem os 5 bugs matemáticos corrigidos na auditoria (Onda 2).
 */
import { describe, it, expect } from 'vitest';
import {
  newPeca,
  calcPecaAreaBase,
  calcPecaAreaLiquida,
  calcPecaAreaCompra,
  calcBordaPiscinaRedonda,
  calcAmbienteArea,
  calcAmbienteAreaCompra,
  calcTotais,
  MIN_AREA_M2_AMBIENTE,
  CUBA_SOBREPOSTA_DEDUCAO_PCT,
  type PecaItem,
} from '../types';

const approx = (a: number, b: number, tol = 0.001) => Math.abs(a - b) <= tol;

const mkPeca = (over: Partial<PecaItem> = {}): PecaItem =>
  ({ ...newPeca('Bancada'), ...over });

describe('calcPecaAreaBase — retangular', () => {
  it('200x60 cm × q=1 = 1.20 m²', () => {
    const p = mkPeca({ largura: '60', comprimento: '200', quantidade: '1' });
    expect(approx(calcPecaAreaBase(p), 1.2)).toBe(true);
  });

  it('escala corretamente com quantidade', () => {
    const p = mkPeca({ largura: '60', comprimento: '200', quantidade: '3' });
    expect(approx(calcPecaAreaBase(p), 3.6)).toBe(true);
  });
});

describe('calcPecaAreaBase — L-shape (bug #3 corrigido)', () => {
  it('L com larguras diferentes usa overlap retangular w1×w2', () => {
    // Trecho1: 60×200 = 12000 cm². Trecho2: 40×150 = 6000. Overlap corner: 60×40 = 2400.
    // Total: (12000 + 6000 - 2400) / 10000 = 1.56 m²
    const p = mkPeca({
      formato: 'l_shape',
      largura: '60', comprimento: '200',
      lTrecho2Largura: '40', lTrecho2Comprimento: '150',
      quantidade: '1',
    });
    expect(approx(calcPecaAreaBase(p), 1.56, 0.01)).toBe(true);
  });

  it('overlap nunca excede as dimensões reais das faixas', () => {
    // Trecho2 comprimento (10cm) menor que largura1 (60): overlap limitado.
    const p = mkPeca({
      formato: 'l_shape',
      largura: '60', comprimento: '200',
      lTrecho2Largura: '40', lTrecho2Comprimento: '10',
      quantidade: '1',
    });
    // overlap = min(60,10) × min(40,200) = 10 × 40 = 400
    // total = (12000 + 400 - 400) / 10000 = 1.20 m²
    expect(approx(calcPecaAreaBase(p), 1.20, 0.01)).toBe(true);
  });
});

describe('calcBordaPiscinaRedonda (bug #2 — desperdício aplicado 1× só)', () => {
  it('anel circular D=400cm com borda 40cm', () => {
    const p = mkPeca({
      tipo: 'Borda de Piscina',
      formatoPiscina: 'redonda',
      piscinaMedidaTipo: 'diametro',
      piscinaDiametroInterno: '400',
      largura: '40',
      desperdicioCurvo: '25',
      quantidade: '1',
    });
    const calc = calcBordaPiscinaRedonda(p);
    // r_int = 200, r_ext = 240 → área = π(240² - 200²) = π×17600 ≈ 55292 cm² ≈ 5.53 m²
    expect(approx(calc.areaM2, 5.529, 0.01)).toBe(true);
    // perímetro interno = 2π×200/100 ≈ 12.566 m
    expect(approx(calc.perimetroInternoM, 12.566, 0.01)).toBe(true);

    // Área de COMPRA final aplica desperdício EXATAMENTE UMA VEZ (fix bug #2).
    const areaCompra = calcPecaAreaCompra(p);
    expect(approx(areaCompra, calc.areaM2 * 1.25, 0.001)).toBe(true);
  });
});

describe('calcPecaAreaCompra (bug #5 — sem arredondamento por peça)', () => {
  it('retorna valor bruto sem ceilM2 nem piso 0.10', () => {
    const p = mkPeca({ largura: '10', comprimento: '10', quantidade: '1' });
    // líquida = 0.01 m². Com waste 10% = 0.011. Sem piso mínimo por peça.
    expect(approx(calcPecaAreaCompra(p), 0.011, 0.0001)).toBe(true);
  });

  it('peça com liquida=0 retorna 0', () => {
    const p = mkPeca({ largura: '0', comprimento: '0' });
    expect(calcPecaAreaCompra(p)).toBe(0);
  });
});

describe('calcAmbienteAreaCompra (bug #5 — arredondamento no ambiente)', () => {
  const ambiente = (pecas: PecaItem[]) => ({
    id: 'a1', nome: 'A',
    pecas,
    materialOptions: [],
    maoDeObra: {} as any,
    instalacao: {} as any,
  } as any);

  it('aplica piso mínimo UMA vez por ambiente (não por peça)', () => {
    // 3 peças de 0.03 m² cada; total líquido 0.09 → deve virar MIN_AREA_M2_AMBIENTE
    // (antes do fix: cada peça arredondava para 0.10 → total ≥ 0.30, superfaturamento).
    const pecas = [
      mkPeca({ largura: '15', comprimento: '20' }),
      mkPeca({ largura: '15', comprimento: '20' }),
      mkPeca({ largura: '15', comprimento: '20' }),
    ];
    const result = calcAmbienteAreaCompra(ambiente(pecas));
    // Cada peça: 15×20/10000 = 0.03 m². Total: 0.09 × 1.1 waste = 0.099 → arredonda para 0.10
    expect(result).toBeGreaterThanOrEqual(MIN_AREA_M2_AMBIENTE);
    expect(result).toBeLessThan(0.15); // muito abaixo dos ~0.33 antigos
  });

  it('ambiente vazio retorna 0 (não aplica piso)', () => {
    expect(calcAmbienteAreaCompra(ambiente([]))).toBe(0);
  });
});

describe('calcPecaExtrasArea — aberturas (bug #1)', () => {
  it('aberturas de revestimento não escalam com q', () => {
    // Peça 200×100 = 2 m² com q=3 = 6 m². Uma abertura 50×100 = 0.5 m² (janela física).
    // Antes do fix: subtraía 0.5 × 3 = 1.5. Correto: subtrai 0.5 uma vez.
    const p = mkPeca({
      tipo: 'Revestimento',
      largura: '100', comprimento: '200', quantidade: '3',
      aberturas: [{ id: 'ab1', descricao: 'Janela', largura: '50', altura: '100' }],
    });
    const liq = calcPecaAreaLiquida(p);
    // 6.0 - 0.5 = 5.5 (não 6.0 - 1.5 = 4.5)
    expect(approx(liq, 5.5, 0.01)).toBe(true);
  });
});

describe('calcPecaDeductions — Cuba sobreposta usa constante nomeada (fix #7)', () => {
  it('deduz 80% do footprint da cuba sobreposta', () => {
    expect(CUBA_SOBREPOSTA_DEDUCAO_PCT).toBe(0.8);
  });
});

describe('calcTotais — cálculo unificado (fix #9)', () => {
  it('material com margem = subtotal × (1 + margem/100)', () => {
    const t = calcTotais(
      { materials: 1000, labor: 500, accessories: 100, installation: 200 },
      { material: 30, servicos: 30, acessorios: 30, instalacao: 20 },
      { valor: '0', tipo: 'reais' },
    );
    expect(t.materialComMargem).toBe(1300);
    expect(t.servicosComMargem).toBe(650);
    expect(t.acessoriosComMargem).toBe(130);
    expect(t.instalacaoComMargem).toBe(240);
    expect(t.totalBruto).toBe(2320);
    expect(t.totalFinal).toBe(2320);
    expect(t.totalMargem).toBe(300 + 150 + 30 + 40); // 520
  });

  it('desconto percentual aplica sobre total bruto', () => {
    const t = calcTotais(
      { materials: 1000, labor: 0, accessories: 0, installation: 0 },
      { material: 0, servicos: 0, acessorios: 0, instalacao: 0 },
      { valor: '10', tipo: 'percent' },
    );
    expect(t.totalBruto).toBe(1000);
    expect(t.desconto).toBe(100);
    expect(t.totalFinal).toBe(900);
  });

  it('desconto em reais nunca deixa total negativo', () => {
    const t = calcTotais(
      { materials: 100, labor: 0, accessories: 0, installation: 0 },
      { material: 0, servicos: 0, acessorios: 0, instalacao: 0 },
      { valor: '999', tipo: 'reais' },
    );
    expect(t.totalFinal).toBe(0);
  });

  it('parcelamento 40/30/30 do total final', () => {
    const t = calcTotais(
      { materials: 1000, labor: 0, accessories: 0, installation: 0 },
      { material: 0, servicos: 0, acessorios: 0, instalacao: 0 },
      { valor: '0', tipo: 'reais' },
    );
    expect(approx(t.parcelas.entrada, 400)).toBe(true);
    expect(approx(t.parcelas.parcela, 300)).toBe(true);
    expect(approx(t.parcelas.saldo, 300)).toBe(true);
    expect(approx(t.parcelas.entrada + t.parcelas.parcela + t.parcelas.saldo, t.totalFinal)).toBe(true);
  });
});
