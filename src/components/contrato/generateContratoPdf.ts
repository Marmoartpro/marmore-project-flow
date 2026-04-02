import jsPDF from 'jspdf';
import { fmt } from '@/components/orcamento/types';

interface ContratoParams {
  contractNumber: string;
  contractDate: string;
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  companyResponsible: string;
  companyPhone: string;
  clientName: string;
  clientCpfCnpj: string;
  clientAddress: string;
  clientPhone: string;
  scopeDescription: string;
  totalValue: number;
  paymentConditions: string;
  startDate: string;
  endDate: string;
  warrantyDays: number;
  exclusions: string;
  cancellationPolicy: string;
  additionalClauses: string;
  logoUrl: string | null;
}

const loadImage = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const BLUE = '#2E7DB5';
const DARK = '#1a1a2e';

export const generateContratoPdf = async (params: ContratoParams) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mL = 20, mR = 20;
  const cW = pageW - mL - mR;
  let y = 20;
  let clauseNum = 0;

  const checkPage = (n: number) => { if (y + n > pageH - 20) { doc.addPage(); y = 20; } };

  const addClause = (title: string) => {
    clauseNum++;
    checkPage(14);
    doc.setFillColor(BLUE);
    doc.rect(mL, y, 2.5, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text(`CLÁUSULA ${clauseNum}ª — ${title.toUpperCase()}`, mL + 6, y + 6);
    y += 14;
  };

  const addParagraph = (text: string) => {
    checkPage(12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    const lines = doc.splitTextToSize(text, cW);
    doc.text(lines, mL, y);
    y += lines.length * 4 + 4;
  };

  // Header
  const logoData = params.logoUrl ? await loadImage(params.logoUrl) : null;
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', pageW / 2 - 15, y, 30, 30); y += 34; } catch { y += 4; }
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(params.companyName.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 5;
  if (params.companyAddress) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80);
    doc.text(params.companyAddress, pageW / 2, y, { align: 'center' }); y += 4;
  }
  if (params.companyPhone) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80);
    doc.text(`Contato: ${params.companyPhone}`, pageW / 2, y, { align: 'center' }); y += 4;
  }
  y += 2;
  doc.setDrawColor(200); doc.line(mL, y, pageW - mR, y); y += 8;

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK);
  doc.text(`CONTRATO DE PRESTAÇÃO DE SERVIÇOS`, pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(80);
  doc.text(`Nº ${params.contractNumber}`, pageW / 2, y, { align: 'center' });
  y += 12;

  // Cláusula 1 — PARTES
  addClause('Das Partes');
  addParagraph(
    `CONTRATADA: ${params.companyName}` +
    (params.companyCnpj ? `, CNPJ: ${params.companyCnpj}` : '') +
    (params.companyAddress ? `, com sede em ${params.companyAddress}` : '') +
    (params.companyResponsible ? `, representada por ${params.companyResponsible}` : '') +
    '.'
  );
  addParagraph(
    `CONTRATANTE: ${params.clientName}` +
    (params.clientCpfCnpj ? `, CPF/CNPJ: ${params.clientCpfCnpj}` : '') +
    (params.clientAddress ? `, residente em ${params.clientAddress}` : '') +
    (params.clientPhone ? `, telefone: ${params.clientPhone}` : '') +
    '.'
  );

  // Cláusula 2 — OBJETO
  addClause('Do Objeto');
  addParagraph('O presente contrato tem por objeto a prestação de serviços de produção e instalação de peças em pedras naturais e/ou industriais, conforme escopo detalhado a seguir:');
  if (params.scopeDescription) addParagraph(params.scopeDescription);

  // Cláusula 3 — VALOR E PAGAMENTO
  addClause('Do Valor e Condições de Pagamento');
  addParagraph(`O valor total dos serviços descritos neste contrato é de R$ ${fmt(params.totalValue)} (${valorPorExtenso(params.totalValue)}).`);
  if (params.paymentConditions) addParagraph(`Condições de pagamento: ${params.paymentConditions}`);

  // Cláusula 4 — PRAZO
  addClause('Do Prazo de Execução');
  const startStr = params.startDate ? new Date(params.startDate).toLocaleDateString('pt-BR') : 'a definir';
  const endStr = params.endDate ? new Date(params.endDate).toLocaleDateString('pt-BR') : 'a definir';
  addParagraph(`O prazo de execução será de ${startStr} a ${endStr}. Atrasos causados pelo CONTRATANTE (indisponibilidade do local, atrasos nos pagamentos, alterações no escopo) poderão estender o prazo proporcionalmente, sem ônus para a CONTRATADA.`);

  // Cláusula 5 — RESPONSABILIDADES DA CONTRATADA
  addClause('Responsabilidades da Contratada');
  addParagraph(`a) Garantir a precisão dos cortes conforme medidas aprovadas pelo CONTRATANTE.`);
  addParagraph(`b) Prazo de garantia dos serviços: ${params.warrantyDays} dias a partir da data de instalação.`);
  addParagraph(`c) Responsabilizar-se por danos causados durante a instalação, desde que comprovada a responsabilidade da equipe.`);

  // Cláusula 6 — RESPONSABILIDADES DO CONTRATANTE
  addClause('Responsabilidades do Contratante');
  addParagraph('a) Efetuar os pagamentos nas datas acordadas.');
  addParagraph('b) Garantir o acesso e disponibilidade do local para medição e instalação.');
  addParagraph('c) Fornecer energia elétrica e água no local quando necessário para a execução dos serviços.');

  // Cláusula 7 — EXCLUSÕES
  addClause('Do que Não Está Incluso');
  addParagraph(params.exclusions || 'Cubas, torneiras, rejunte e instalação hidráulica não estão inclusos nesta proposta.');

  // Cláusula 8 — ALTERAÇÕES
  addClause('Das Alterações');
  addParagraph('Qualquer alteração no escopo dos serviços após a aprovação deste contrato deverá ser formalizada por meio de aditivo contratual, podendo acarretar ajustes nos valores e prazos.');

  // Cláusula 9 — CANCELAMENTO
  addClause('Do Cancelamento');
  addParagraph(params.cancellationPolicy || 'Em caso de cancelamento após aprovação, será cobrada multa de 30% sobre o valor total do contrato.');

  // Cláusula 10 — CLÁUSULAS ADICIONAIS
  if (params.additionalClauses) {
    addClause('Disposições Adicionais');
    addParagraph(params.additionalClauses);
  }

  // Cláusula final — FORO
  addClause('Do Foro');
  addParagraph('As partes elegem o foro da comarca onde se situa a sede da CONTRATADA para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato.');

  // Assinaturas
  checkPage(60);
  y += 10;
  const dateStr = params.contractDate ? new Date(params.contractDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(DARK);
  doc.text(`Local e data: __________________, ${dateStr}`, mL, y);
  y += 20;

  const colW = cW / 2 - 10;
  // Left — contratada
  doc.line(mL, y, mL + colW, y);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('CONTRATADA', mL, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(params.companyName, mL, y + 10);
  if (params.companyResponsible) doc.text(params.companyResponsible, mL, y + 14);

  // Right — contratante
  const rX = mL + colW + 20;
  doc.line(rX, y, rX + colW, y);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATANTE', rX, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(params.clientName, rX, y + 10);

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text(params.companyName, mL, pageH - 8);
    doc.text(`Contrato ${params.contractNumber}`, pageW / 2, pageH - 8, { align: 'center' });
    doc.text(`${i}/${totalPages}`, pageW - mR, pageH - 8, { align: 'right' });
  }

  doc.save(`contrato-${params.contractNumber}.pdf`);
};

function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  const partes: string[] = [];
  if (inteiro > 0) partes.push(`${inteiro.toLocaleString('pt-BR')} reais`);
  if (centavos > 0) partes.push(`${centavos} centavos`);
  return partes.join(' e ');
}
