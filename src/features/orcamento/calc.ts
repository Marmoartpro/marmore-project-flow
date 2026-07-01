/**
 * Módulo público de cálculos de orçamento.
 *
 * Consolida as funções puras de cálculo (área, custo, totais) sob um caminho estável
 * `@/features/orcamento/calc` para uso futuro. As implementações continuam em
 * `src/components/orcamento/types.ts` por ora (extração incremental) — este re-export
 * evita duplicação e permite migrar imports gradualmente sem quebrar consumidores.
 */
export {
  // Peça
  calcPecaAreaBase,
  calcPecaDeductions,
  calcPecaExtrasArea,
  calcPecaAreaLiquida,
  calcPecaAreaCompra,
  calcPecaArea,
  calcNichoArea,
  calcJardineiraArea,
  calcCubaEsculpida,
  calcBordaPiscinaRedonda,
  calcMetrosLinearesBorda,
  getBordasLados,
  // Ambiente
  calcAmbienteArea,
  calcAmbienteAreaCompra,
  calcAmbienteMaterialCost,
  calcAmbienteLaborCost,
  calcAmbienteInstallCost,
  // Projeto
  calcResumoConsumo,
  calcTotais,
  gerarAlertas,
  // Constantes
  CUBA_SOBREPOSTA_DEDUCAO_PCT,
  MIN_AREA_M2_AMBIENTE,
  M2_POR_CHAPA_DEFAULT,
  PARCELAMENTO_DEFAULT,
  CUBA_FUNDO_OPCOES,
  // Helpers
  fmt,
  ceilM2,
  ceilML,
  ceilMoney,
} from '@/components/orcamento/types';

export type {
  TotaisSubtotais,
  TotaisMargens,
  TotaisDesconto,
  TotaisCalculados,
  ResumoMaterial,
  AlertaOrcamento,
  CubaEsculpidaCalc,
} from '@/components/orcamento/types';
