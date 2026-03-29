import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Ambiente, AcessorioItem,
  calcAmbienteArea, calcAmbienteMaterialCost, calcAmbienteLaborCost, calcAmbienteInstallCost, fmt,
} from './types';

interface PdfParams {
  quoteNumber: string;
  clienteNome: string;
  tipoAmbiente: string;
  dataOrcamento: string;
  validadeDias: string;
  ambientes: Ambiente[];
  acessorios: AcessorioItem[];
  subtotalMaterials: number;
  subtotalLabor: number;
  subtotalAccessories: number;
  subtotalInstallation: number;
  margemLucro: number;
  descontoValor: string;
  descontoTipo: 'percent' | 'reais';
  condicoesPagamento: string;
  observacoes: string;
  logoUrl: string | null;
  companyName: string;
}

const BLUE = '#2E7DB5';
const DARK = '#1a1a2e';
const GRAY_BG = '#f5f5f5';
const GRAY_LINE = '#e0e0e0';
const WHITE = '#ffffff';

const loadImage = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateOrcamentoPdf = async (params: PdfParams) => {
  const {
    quoteNumber, clienteNome, tipoAmbiente, dataOrcamento, validadeDias,
    ambientes, acessorios, subtotalMaterials, subtotalLabor, subtotalAccessories,
    subtotalInstallation, margemLucro, descontoValor, descontoTipo,
    condicoesPagamento, observacoes, logoUrl, companyName,
  } = params;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 15;
  let sectionNum = 0;

  // Totals calculation
  const subtotalBase = subtotalMaterials + subtotalLabor + subtotalAccessories + subtotalInstallation;
  const valorMargem = subtotalBase * (margemLucro / 100);
  const totalBruto = subtotalBase + valorMargem;
  const desconto = descontoTipo === 'percent'
    ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
    : (parseFloat(descontoValor) || 0);
  const totalFinal = totalBruto - desconto;

  const validadeDate = new Date(dataOrcamento);
  validadeDate.setDate(validadeDate.getDate() + (parseInt(validadeDias) || 15));

  // --- Helper functions ---
  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(150);
    const footerY = pageH - 8;
    doc.text(companyName || 'MármorePro', marginL, footerY);
    doc.text(`Orçamento ${quoteNumber}`, pageW - marginR, footerY, { align: 'right' });
    doc.text(`Página ${doc.getNumberOfPages()}`, pageW / 2, footerY, { align: 'center' });
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageH - 20) {
      addFooter();
      doc.addPage();
      y = 15;
    }
  };

  const sectionTitle = (title: string) => {
    sectionNum++;
    checkPageBreak(12);
    doc.setFillColor(GRAY_BG);
    doc.rect(marginL, y, contentW, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text(`${sectionNum}. ${title}`, marginL + 3, y + 5.5);
    y += 12;
  };

  const labelValue = (label: string, value: string, xOffset = 0) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80);
    doc.text(label, marginL + xOffset, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text(value, marginL + xOffset + doc.getTextWidth(label) + 2, y);
  };

  // --- HEADER ---
  const logoData = logoUrl ? await loadImage(logoUrl) : null;

  // Header background
  doc.setFillColor(BLUE);
  doc.rect(0, 0, pageW, 35, 'F');

  if (logoData) {
    try { doc.addImage(logoData, 'PNG', marginL, 5, 25, 25); } catch { /* ignore */ }
  }

  doc.setTextColor(WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA COMERCIAL', logoData ? marginL + 30 : marginL, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName || '', logoData ? marginL + 30 : marginL, 24);

  // Quote number box
  doc.setFillColor(WHITE);
  doc.roundedRect(pageW - marginR - 55, 8, 55, 18, 2, 2, 'F');
  doc.setTextColor(BLUE);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Nº ORÇAMENTO', pageW - marginR - 50, 15);
  doc.setFontSize(9);
  doc.setTextColor(DARK);
  doc.text(quoteNumber, pageW - marginR - 50, 22);

  y = 42;

  // --- SECTION 1: Client data ---
  sectionTitle('Dados do Cliente');
  labelValue('Cliente:', clienteNome);
  y += 5;
  labelValue('Ambiente:', tipoAmbiente || '—');
  labelValue('Data:', new Date(dataOrcamento).toLocaleDateString('pt-BR'), contentW / 2);
  y += 5;
  labelValue('Validade:', `${validadeDias} dias (até ${validadeDate.toLocaleDateString('pt-BR')})`);
  y += 8;

  // --- SECTIONS PER AMBIENTE ---
  ambientes.forEach((amb, ambIdx) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    const area = calcAmbienteArea(amb);
    const laborCost = calcAmbienteLaborCost(amb);
    const installCost = calcAmbienteInstallCost(amb);

    sectionTitle(`${ambName}`);

    // Peças table
    const pecasData = amb.pecas.map((p, i) => {
      const pArea = (parseFloat(p.largura) || 0) * (parseFloat(p.comprimento) || 0) * (parseInt(p.quantidade) || 1);
      const extras: string[] = [];
      if (p.espelhoBacksplash) extras.push(`Espelho ${p.espelhoBacksplashAltura}cm`);
      if (p.saiaFrontal) extras.push(`Saia ${p.saiaFrontalAltura}cm`);
      if (p.tipoCuba !== 'Sem cuba') extras.push(p.tipoCuba);
      if (p.tipoRebaixo !== 'Sem rebaixo') extras.push(p.tipoRebaixo);
      if (p.acabamentoBorda !== 'Reto') extras.push(`Borda: ${p.acabamentoBorda}`);
      if (p.furosTorneira !== 'Nenhum') extras.push(p.furosTorneira);
      return [
        String(i + 1),
        p.tipo,
        p.descricao || '—',
        `${p.largura || '0'} x ${p.comprimento || '0'}`,
        p.quantidade || '1',
        fmt(pArea),
        extras.join(', ') || '—',
      ];
    });

    checkPageBreak(20 + pecasData.length * 7);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['#', 'Peça', 'Descrição', 'Medidas (m)', 'Qtd', 'Área m²', 'Detalhes']],
      body: pecasData,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [46, 125, 181], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 10 },
        5: { cellWidth: 15 },
        6: { cellWidth: contentW - 107 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    // Area summary
    checkPageBreak(8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`Área total: ${fmt(area)} m²  |  +10% desperdício: ${fmt(area * 1.1)} m²`, marginL + 3, y);
    y += 6;

    // Material options
    if (amb.materialOptions.length > 0) {
      checkPageBreak(10 + amb.materialOptions.length * 7);
      const matData = amb.materialOptions.map((opt, i) => {
        if (opt.materialDoCliente) return [opt.label || `Opção ${i + 1}`, 'Material do cliente', '—', 'R$ 0,00'];
        const matCost = calcAmbienteMaterialCost(amb, i);
        return [
          opt.label || `Opção ${i + 1}`,
          opt.stoneName || '—',
          `R$ ${fmt(opt.pricePerM2)}/m²`,
          `R$ ${fmt(matCost)}`,
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        head: [['Opção', 'Material', 'Valor/m²', 'Subtotal Material']],
        body: matData,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [46, 125, 181], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    }

    // Labor & Install summary
    checkPageBreak(12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text(`Serviços: R$ ${fmt(laborCost)}`, marginL + 3, y);
    doc.text(`Instalação: R$ ${fmt(installCost)}${amb.instalacao.semInstalacao ? ' (sem instalação)' : ''}`, marginL + 60, y);
    y += 8;
  });

  // --- ACCESSORIES ---
  const validAccessories = acessorios.filter(a => a.nome && (parseFloat(a.valorUnitario) || 0) > 0);
  if (validAccessories.length > 0) {
    sectionTitle('Acessórios');
    const accData = validAccessories.map((a, i) => [
      String(i + 1),
      a.nome,
      a.quantidade || '1',
      `R$ ${fmt(parseFloat(a.valorUnitario) || 0)}`,
      `R$ ${fmt((parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0))}`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['#', 'Acessório', 'Qtd', 'Valor Un.', 'Subtotal']],
      body: accData,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [46, 125, 181], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // --- SCENARIOS (if multiple material options) ---
  if (ambientes.some(a => a.materialOptions.length > 1)) {
    sectionTitle('Cenários de Investimento');

    const maxOpts = Math.max(...ambientes.map(a => a.materialOptions.length));
    for (let optIdx = 0; optIdx < maxOpts; optIdx++) {
      const scenarioTotal = ambientes.reduce((sum, amb) => {
        const idx = Math.min(optIdx, amb.materialOptions.length - 1);
        return sum + calcAmbienteMaterialCost(amb, idx) + calcAmbienteLaborCost(amb);
      }, 0) + subtotalAccessories + subtotalInstallation;
      const withMargin = scenarioTotal * (1 + margemLucro / 100);
      const scenarioDesc = descontoTipo === 'percent'
        ? withMargin - withMargin * ((parseFloat(descontoValor) || 0) / 100)
        : withMargin - (parseFloat(descontoValor) || 0);

      checkPageBreak(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BLUE);
      doc.text(`Cenário ${String.fromCharCode(65 + optIdx)}: R$ ${fmt(scenarioDesc)}`, marginL + 3, y);
      y += 6;
    }
    y += 4;
  }

  // --- TOTALS ---
  sectionTitle('Resumo Financeiro');

  checkPageBreak(40);

  const totalsData = [
    ['Materiais', `R$ ${fmt(subtotalMaterials)}`],
    ['Mão de obra / Serviços', `R$ ${fmt(subtotalLabor)}`],
    ['Acessórios', `R$ ${fmt(subtotalAccessories)}`],
    ['Instalação', `R$ ${fmt(subtotalInstallation)}`],
    ['Subtotal', `R$ ${fmt(subtotalBase)}`],
    [`Margem (${margemLucro}%)`, `R$ ${fmt(valorMargem)}`],
  ];
  if (desconto > 0) {
    totalsData.push(['Desconto', `- R$ ${fmt(desconto)}`]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: marginL + contentW * 0.4, right: marginR },
    body: totalsData,
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80] },
      1: { halign: 'right' },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  // Total highlight
  checkPageBreak(14);
  doc.setFillColor(BLUE);
  doc.roundedRect(marginL + contentW * 0.4, y, contentW * 0.6, 10, 2, 2, 'F');
  doc.setTextColor(WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTIMENTO TOTAL', marginL + contentW * 0.4 + 5, y + 7);
  doc.text(`R$ ${fmt(totalFinal)}`, pageW - marginR - 5, y + 7, { align: 'right' });
  y += 16;

  // --- PAYMENT CONDITIONS ---
  if (condicoesPagamento) {
    sectionTitle('Condições de Pagamento');
    checkPageBreak(15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    const splitCond = doc.splitTextToSize(condicoesPagamento, contentW - 6);
    doc.text(splitCond, marginL + 3, y);
    y += splitCond.length * 4 + 6;
  }

  // --- OBSERVATIONS ---
  if (observacoes) {
    sectionTitle('Observações Importantes');
    checkPageBreak(15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    const splitObs = doc.splitTextToSize(observacoes, contentW - 6);
    doc.text(splitObs, marginL + 3, y);
    y += splitObs.length * 4 + 6;
  }

  // --- VALIDITY ---
  checkPageBreak(12);
  doc.setFillColor(GRAY_BG);
  doc.rect(marginL, y, contentW, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(
    `Este orçamento é válido por ${validadeDias} dias, até ${validadeDate.toLocaleDateString('pt-BR')}. Após esta data, os valores poderão ser reajustados.`,
    marginL + 3, y + 5,
  );
  y += 14;

  // Footer on last page
  addFooter();

  // Add footers to all previous pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i < totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  // Download
  doc.save(`orcamento-${quoteNumber}.pdf`);
};
