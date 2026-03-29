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
  responsibleName: string;
  companyAddress: string;
  companyPhone: string;
}

const BLUE = '#2E7DB5';
const DARK = '#1a1a2e';
const GRAY_BG = '#f5f5f5';
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

/** Build detailed description lines for a piece */
const buildPecaDetails = (p: any): string[] => {
  const lines: string[] = [];
  if (p.tipoCuba !== 'Sem cuba') lines.push(`Cuba: ${p.tipoCuba}`);
  if (p.tipoRebaixo !== 'Sem rebaixo') lines.push(`Rebaixo: ${p.tipoRebaixo}`);
  if (p.acabamentoBorda !== 'Reto') lines.push(`Borda: ${p.acabamentoBorda} (${p.bordasComAcabamento || 'Só frontal'})`);
  if (p.furosTorneira !== 'Nenhum') lines.push(`Furos: ${p.furosTorneira}`);
  if (p.espelhoBacksplash && p.espelhoBacksplashAltura) lines.push(`Espelho/Backsplash: ${p.espelhoBacksplashAltura} cm`);
  if (p.saiaFrontal && p.saiaFrontalAltura) lines.push(`Saia frontal: ${p.saiaFrontalAltura} cm`);
  if (p.rebaixoCooktop) lines.push(`Rebaixo cooktop: ${p.rebaixoCooktopLargura || '—'}×${p.rebaixoCooktopComprimento || '—'} cm`);
  return lines;
};

export const generateOrcamentoPdf = async (params: PdfParams) => {
  const {
    quoteNumber, clienteNome, tipoAmbiente, dataOrcamento, validadeDias,
    ambientes, acessorios, subtotalMaterials, subtotalLabor, subtotalAccessories,
    subtotalInstallation, margemLucro, descontoValor, descontoTipo,
    condicoesPagamento, observacoes, logoUrl, companyName, responsibleName,
    companyAddress, companyPhone,
  } = params;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 15;
  let sectionNum = 0;

  // --- Totals with margin EMBEDDED (never shown) ---
  const subtotalBase = subtotalMaterials + subtotalLabor + subtotalAccessories + subtotalInstallation;
  const factor = 1 + margemLucro / 100;
  // Apply margin to material and labor independently for display
  const displayMaterials = subtotalMaterials * factor;
  const displayLabor = subtotalLabor * factor;
  const displayAccessories = subtotalAccessories * factor;
  const displayInstallation = subtotalInstallation * factor;
  const totalBruto = subtotalBase * factor;
  const desconto = descontoTipo === 'percent'
    ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
    : (parseFloat(descontoValor) || 0);
  const totalFinal = totalBruto - desconto;

  const validadeDate = new Date(dataOrcamento);
  validadeDate.setDate(validadeDate.getDate() + (parseInt(validadeDias) || 15));

  const hasLabor = subtotalLabor > 0 || subtotalInstallation > 0;

  // --- Helpers ---
  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(150);
    const footerY = pageH - 8;
    doc.text(companyName || 'Marmoraria Artesanal', marginL, footerY);
    doc.text(`Orçamento ${quoteNumber}`, pageW / 2, footerY, { align: 'center' });
    doc.text(`Página ${doc.getNumberOfPages()}`, pageW - marginR, footerY, { align: 'right' });
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

  doc.setFillColor(BLUE);
  doc.rect(0, 0, pageW, 35, 'F');

  if (logoData) {
    try { doc.addImage(logoData, 'PNG', marginL, 5, 25, 25); } catch { /* ignore */ }
  }

  doc.setTextColor(WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleX = logoData ? marginL + 30 : marginL;
  doc.text(companyName?.toUpperCase() || 'MARMORARIA ARTESANAL', titleX, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PROPOSTA COMERCIAL', titleX, 24);

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

  // --- SECTION 1: Client ---
  sectionTitle('Dados do Cliente');
  labelValue('Cliente:', clienteNome);
  y += 5;
  labelValue('Projeto:', tipoAmbiente || '—');
  labelValue('Data:', new Date(dataOrcamento).toLocaleDateString('pt-BR'), contentW / 2);
  y += 5;
  labelValue('Validade:', `${validadeDias} dias (até ${validadeDate.toLocaleDateString('pt-BR')})`);
  y += 8;

  // --- SECTIONS PER AMBIENTE ---
  ambientes.forEach((amb) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    const area = calcAmbienteArea(amb);

    sectionTitle(ambName);

    // --- Peças table with detailed descriptions ---
    const pecasData = amb.pecas.map((p, i) => {
      const pArea = (parseFloat(p.largura) || 0) * (parseFloat(p.comprimento) || 0) * (parseInt(p.quantidade) || 1);
      const wCm = Math.round((parseFloat(p.largura) || 0) * 100);
      const lCm = Math.round((parseFloat(p.comprimento) || 0) * 100);
      const details = buildPecaDetails(p);
      return [
        String(i + 1),
        p.tipo,
        p.descricao || '—',
        `${wCm} × ${lCm}`,
        p.quantidade || '1',
        fmt(pArea),
        details.join('\n') || '—',
      ];
    });

    checkPageBreak(20 + pecasData.length * 10);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Nº', 'Peça', 'Descrição', 'Medidas (cm)', 'Qtd', 'Área m²', 'Acabamentos Inclusos']],
      body: pecasData,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [46, 125, 181], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 10 },
        5: { cellWidth: 15 },
        6: { cellWidth: contentW - 105 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    // Area summary
    checkPageBreak(8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`Área total: ${fmt(area)} m²  |  Com desperdício (+10%): ${fmt(area * 1.1)} m²`, marginL + 3, y);
    y += 6;

    // Material options
    if (amb.materialOptions.length > 0) {
      checkPageBreak(10 + amb.materialOptions.length * 7);
      const matData = amb.materialOptions.map((opt, i) => {
        if (opt.materialDoCliente) return [opt.label || `Opção ${i + 1}`, 'Material do cliente', '—', 'R$ 0,00'];
        const matCost = calcAmbienteMaterialCost(amb, i) * factor;
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

    // Services summary (only if has labor)
    if (hasLabor) {
      const laborCost = calcAmbienteLaborCost(amb) * factor;
      const installCost = calcAmbienteInstallCost(amb) * factor;
      checkPageBreak(12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(DARK);
      doc.text(`Serviços: R$ ${fmt(laborCost)}`, marginL + 3, y);
      if (!amb.instalacao.semInstalacao && installCost > 0) {
        doc.text(`Instalação: R$ ${fmt(installCost)}`, marginL + 60, y);
      } else if (amb.instalacao.semInstalacao) {
        doc.text(`Instalação: não inclusa`, marginL + 60, y);
      }
      y += 8;
    }
  });

  // --- ACCESSORIES ---
  const validAccessories = acessorios.filter(a => a.nome && (parseFloat(a.valorUnitario) || 0) > 0);
  if (validAccessories.length > 0) {
    sectionTitle('Acessórios');
    const accData = validAccessories.map((a, i) => [
      String(i + 1),
      a.nome,
      a.quantidade || '1',
      `R$ ${fmt((parseFloat(a.valorUnitario) || 0) * factor)}`,
      `R$ ${fmt((parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0) * factor)}`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Nº', 'Acessório', 'Qtd', 'Valor Un.', 'Subtotal']],
      body: accData,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [46, 125, 181], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // --- SCENARIOS (if multiple material options) ---
  if (ambientes.some(a => a.materialOptions.length > 1)) {
    sectionTitle('Simulações de Investimento');

    const maxOpts = Math.max(...ambientes.map(a => a.materialOptions.length));
    const scenarioRows: string[][] = [];
    for (let optIdx = 0; optIdx < maxOpts; optIdx++) {
      const scenarioTotal = ambientes.reduce((sum, amb) => {
        const idx = Math.min(optIdx, amb.materialOptions.length - 1);
        return sum + calcAmbienteMaterialCost(amb, idx) + calcAmbienteLaborCost(amb);
      }, 0) + subtotalAccessories + subtotalInstallation;
      const withMargin = scenarioTotal * factor;
      const scenarioFinal = descontoTipo === 'percent'
        ? withMargin - withMargin * ((parseFloat(descontoValor) || 0) / 100)
        : withMargin - (parseFloat(descontoValor) || 0);

      // Get label from first ambiente's option
      const optLabel = ambientes[0]?.materialOptions[Math.min(optIdx, ambientes[0].materialOptions.length - 1)]?.label
        || `Cenário ${String.fromCharCode(65 + optIdx)}`;

      scenarioRows.push([optLabel, `R$ ${fmt(scenarioFinal)}`]);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: marginL + contentW * 0.3, right: marginR },
      head: [['Cenário', 'Investimento Total']],
      body: scenarioRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [46, 125, 181], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // --- TOTALS — SIMPLIFIED (no margin shown) ---
  sectionTitle('Resumo Financeiro');
  checkPageBreak(40);

  if (hasLabor) {
    // Full service mode
    const totalsData: string[][] = [
      ['Total do Material', `R$ ${fmt(displayMaterials)}`],
      ['Total dos Serviços', `R$ ${fmt(displayLabor)}`],
    ];
    if (displayAccessories > 0) {
      totalsData.push(['Total de Acessórios', `R$ ${fmt(displayAccessories)}`]);
    }
    if (displayInstallation > 0) {
      totalsData.push(['Total de Instalação', `R$ ${fmt(displayInstallation)}`]);
    }
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
  } else {
    // Material only — no labor
    checkPageBreak(14);
    doc.setFillColor(BLUE);
    doc.roundedRect(marginL + contentW * 0.3, y, contentW * 0.7, 10, 2, 2, 'F');
    doc.setTextColor(WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DO MATERIAL', marginL + contentW * 0.3 + 5, y + 7);
    doc.text(`R$ ${fmt(displayMaterials)}`, pageW - marginR - 5, y + 7, { align: 'right' });
    y += 14;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#c0392b');
    doc.text('NÃO INCLUI MÃO DE OBRA DE INSTALAÇÃO', marginL + contentW * 0.3, y);
    y += 10;
  }

  // --- PAYMENT CONDITIONS with calculated values ---
  if (condicoesPagamento) {
    sectionTitle('Condições de Pagamento');
    checkPageBreak(20);

    // Try to parse percentages and show values
    let condText = condicoesPagamento;
    // Replace percentage patterns with values
    const percentRegex = /(\d+)\s*%/g;
    let match;
    const percentParts: string[] = [];
    while ((match = percentRegex.exec(condicoesPagamento)) !== null) {
      const pct = parseFloat(match[1]);
      const val = totalFinal * (pct / 100);
      percentParts.push(`${pct}% = R$ ${fmt(val)}`);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    const splitCond = doc.splitTextToSize(condText, contentW - 6);
    doc.text(splitCond, marginL + 3, y);
    y += splitCond.length * 4 + 2;

    if (percentParts.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BLUE);
      percentParts.forEach(part => {
        doc.text(`• ${part}`, marginL + 6, y);
        y += 4;
      });
    }
    y += 4;
  }

  // --- OBSERVATIONS ---
  if (observacoes) {
    sectionTitle('Informações Adicionais');
    checkPageBreak(15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    const splitObs = doc.splitTextToSize(observacoes, contentW - 6);
    doc.text(splitObs, marginL + 3, y);
    y += splitObs.length * 4 + 6;
  }

  // --- STANDARD NOTES ---
  checkPageBreak(25);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  const standardNotes = [
    `• Este orçamento é válido por ${validadeDias} dias, até ${validadeDate.toLocaleDateString('pt-BR')}.`,
    '• Após a validade, os valores poderão ser reajustados.',
    '• Medidas finais serão confirmadas na visita técnica.',
    '• Itens não descritos nesta proposta não estão inclusos.',
  ];
  // Check if any material is client-provided
  const hasClientMaterial = ambientes.some(a => a.materialOptions.some(o => o.materialDoCliente));
  if (hasClientMaterial) {
    standardNotes.push('• Quando indicado "Material do cliente", a responsabilidade pela qualidade e quantidade do material é do contratante.');
  }
  standardNotes.forEach(note => {
    doc.text(note, marginL + 3, y);
    y += 4;
  });
  y += 6;

  // --- CLOSING ---
  checkPageBreak(30);
  doc.setDrawColor(200);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  doc.text('Obrigado pela preferência!', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Atenciosamente,', pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text(responsibleName || companyName || 'Marmoraria Artesanal', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`— ${companyName || 'Marmoraria Artesanal'}`, pageW / 2, y, { align: 'center' });
  y += 4;
  if (companyAddress) {
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(companyAddress, pageW / 2, y, { align: 'center' });
    y += 4;
  }
  if (companyPhone) {
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(companyPhone, pageW / 2, y, { align: 'center' });
    y += 4;
  }

  // Footer on all pages
  addFooter();
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i < totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  doc.save(`orcamento-${quoteNumber}.pdf`);
};
