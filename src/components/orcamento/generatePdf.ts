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

/** Build detailed description for a piece */
const buildPecaDescricao = (p: any): string => {
  const wCm = Math.round((parseFloat(p.largura) || 0) * 100);
  const lCm = Math.round((parseFloat(p.comprimento) || 0) * 100);
  const q = parseInt(p.quantidade) || 1;
  let desc = `${p.tipo} (${lCm} x ${wCm} cm)`;
  if (q > 1) desc += ` — ${q} unidades`;
  if (p.descricao) desc += `\n${p.descricao}`;
  return desc;
};

/** Build detailed acabamentos lines for a piece */
const buildAcabamentos = (p: any): string => {
  const lines: string[] = [];
  if (p.tipoCuba !== 'Sem cuba') lines.push(`Cuba: ${p.tipoCuba}`);
  if (p.tipoRebaixo !== 'Sem rebaixo') lines.push(`Rebaixo: ${p.tipoRebaixo}`);
  if (p.acabamentoBorda !== 'Reto') lines.push(`Borda: ${p.acabamentoBorda} (${p.bordasComAcabamento || 'Só frontal'})`);
  if (p.furosTorneira !== 'Nenhum') lines.push(`Furos: ${p.furosTorneira}`);
  if (p.espelhoBacksplash && p.espelhoBacksplashAltura) lines.push(`Frontão (rodapia) de ${p.espelhoBacksplashAltura} cm`);
  if (p.saiaFrontal && p.saiaFrontalAltura) lines.push(`Saia frontal de ${p.saiaFrontalAltura} cm`);
  if (p.rebaixoCooktop) lines.push(`Recorte cooktop: ${p.rebaixoCooktopLargura || '—'}×${p.rebaixoCooktopComprimento || '—'} cm`);
  return lines.length > 0 ? lines.join(', ') : '—';
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
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;
  let sectionNum = 0;

  // Margin factor (never shown in PDF)
  const factor = 1 + margemLucro / 100;

  // Calculate totals with embedded margin
  const subtotalBase = subtotalMaterials + subtotalLabor + subtotalAccessories + subtotalInstallation;
  const totalBruto = subtotalBase * factor;
  const desconto = descontoTipo === 'percent'
    ? totalBruto * ((parseFloat(descontoValor) || 0) / 100)
    : (parseFloat(descontoValor) || 0);
  const totalFinal = totalBruto - desconto;

  const validadeDate = new Date(dataOrcamento);
  validadeDate.setDate(validadeDate.getDate() + (parseInt(validadeDias) || 15));

  const hasLabor = subtotalLabor > 0 || subtotalInstallation > 0;
  const empresa = companyName || 'Marmoraria Artesanal';

  // --- Helpers ---
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(7);
    doc.setTextColor(150);
    const footerY = pageH - 8;
    doc.text(empresa, marginL, footerY);
    doc.text(`Proposta Comercial ${quoteNumber}`, pageW / 2, footerY, { align: 'center' });
    doc.text(`${pageNum}/${totalPages}`, pageW - marginR, footerY, { align: 'right' });
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionTitle = (title: string) => {
    sectionNum++;
    checkPageBreak(14);
    // Blue left border bar
    doc.setFillColor(BLUE);
    doc.rect(marginL, y, 2.5, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text(`${sectionNum}. ${title.toUpperCase()}`, marginL + 6, y + 6);
    y += 14;
  };

  const subTitle = (title: string) => {
    checkPageBreak(10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text(`Ambiente: ${title}`, marginL, y);
    y += 6;
  };

  // ========================
  // PAGE 1 — HEADER
  // ========================
  const logoData = logoUrl ? await loadImage(logoUrl) : null;

  // Logo centered
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', pageW / 2 - 15, y, 30, 30); y += 34; } catch { y += 4; }
  }

  // Company name centered
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(empresa.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 6;

  // Address and contact
  if (companyAddress) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(companyAddress, pageW / 2, y, { align: 'center' });
    y += 4;
  }
  if (companyPhone) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`Contato: ${companyPhone}`, pageW / 2, y, { align: 'center' });
    y += 4;
  }

  // Separator line
  y += 2;
  doc.setDrawColor(200);
  doc.line(marginL, y, pageW - marginR, y);
  y += 10;

  // ========================
  // PROPOSTA COMERCIAL Nº
  // ========================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(`PROPOSTA COMERCIAL Nº ${quoteNumber}`, marginL, y);
  y += 8;

  // Separator
  doc.setDrawColor(200);
  doc.line(marginL, y, pageW - marginR, y);
  y += 8;

  // Data, Para, Assunto
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text('Data:', marginL, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(dataOrcamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), marginL + 15, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Para:', marginL, y);
  doc.setFont('helvetica', 'normal');
  doc.text(clienteNome, marginL + 15, y);
  y += 6;

  if (tipoAmbiente) {
    doc.setFont('helvetica', 'bold');
    doc.text('Assunto:', marginL, y);
    doc.setFont('helvetica', 'normal');
    const assuntoText = doc.splitTextToSize(`Orçamento detalhado para ${tipoAmbiente}.`, contentW - 20);
    doc.text(assuntoText, marginL + 20, y);
    y += assuntoText.length * 4 + 2;
  }

  y += 4;

  // Greeting
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  doc.text('Prezado Cliente,', marginL, y);
  y += 5;
  const introText = doc.splitTextToSize(
    'Conforme solicitado, detalhamos a proposta comercial completa. A proposta segue estruturada de forma modular.',
    contentW
  );
  doc.text(introText, marginL, y);
  y += introText.length * 4 + 8;

  // ========================
  // SECTION 1 — ESCOPO DO PROJETO
  // ========================
  sectionTitle('Escopo do Projeto');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  doc.text('O projeto contempla a confecção e instalação (conforme especificado) dos seguintes itens:', marginL, y);
  y += 8;

  // --- Tables per ambiente (Item | Descrição e Medidas | Acabamentos) ---
  ambientes.forEach((amb) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    subTitle(ambName);

    const pecasData = amb.pecas.map((p) => [
      p.tipo,
      buildPecaDescricao(p),
      buildAcabamentos(p),
    ]);

    checkPageBreak(15 + pecasData.length * 12);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Item', 'Descrição e Medidas (Aprox.)', 'Acabamentos Inclusos']],
      body: pecasData,
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: contentW * 0.4 },
        2: { cellWidth: contentW - 30 - contentW * 0.4 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  });

  // ========================
  // SECTION 2 — CUSTOS DE MATERIAL E SERVIÇOS
  // ========================
  sectionTitle('Custos de Material e Serviços');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('Custos variáveis referentes à chapa do material e à mão de obra de corte, colagem e acabamento de cada peça.', marginL, y);
  y += 8;

  ambientes.forEach((amb) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    const area = calcAmbienteArea(amb);

    subTitle(ambName.toUpperCase());

    // Note about client material if applicable
    const hasClientMat = amb.materialOptions.some(o => o.materialDoCliente);
    if (hasClientMat) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80);
      doc.text('Material: (Fornecido pelo Cliente). Valores abaixo referem-se exclusivamente à mão de obra de produção.', marginL, y);
      y += 5;
    }

    // Area info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Área total: ${fmt(area)} m² | Com desperdício (+10%): ${fmt(area * 1.1)} m²`, marginL, y);
    y += 6;

    // Material + Services table
    const laborCost = calcAmbienteLaborCost(amb) * factor;
    const matData = amb.materialOptions.map((opt, i) => {
      if (opt.materialDoCliente) {
        return [
          opt.label || `Opção ${i + 1}`,
          'Material do cliente',
          'R$ 0,00',
          `R$ ${fmt(laborCost)}`,
          `R$ ${fmt(laborCost)}`,
        ];
      }
      const matCost = calcAmbienteMaterialCost(amb, i) * factor;
      return [
        opt.label || `Opção ${i + 1}`,
        opt.stoneName || '—',
        `R$ ${fmt(matCost)}`,
        `R$ ${fmt(laborCost)}`,
        `R$ ${fmt(matCost + laborCost)}`,
      ];
    });

    checkPageBreak(15 + matData.length * 10);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Opção de Material', 'Material', 'Valor Material', 'Valor Serviços', 'Subtotal (Mat + Serv)']],
      body: matData,
      styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // ========================
  // SECTION: ACESSÓRIOS (if any)
  // ========================
  const validAccessories = acessorios.filter(a => a.nome && (parseFloat(a.valorUnitario) || 0) > 0);
  if (validAccessories.length > 0) {
    sectionTitle('Acessórios');
    const accData = validAccessories.map((a) => {
      const sub = (parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0) * factor;
      return [
        a.nome,
        a.quantidade || '1',
        `R$ ${fmt((parseFloat(a.valorUnitario) || 0) * factor)}`,
        `R$ ${fmt(sub)}`,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Acessório', 'Qtd', 'Valor Un.', 'Subtotal']],
      body: accData,
      styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ========================
  // SECTION: INSTALAÇÃO E LOGÍSTICA
  // ========================
  const installRows = ambientes
    .filter(a => !a.instalacao.semInstalacao && calcAmbienteInstallCost(a) > 0)
    .map(a => {
      const name = a.tipo === 'Ambiente Personalizado' && a.nomeCustom ? a.nomeCustom : a.tipo;
      return [
        `Instalação e Logística (${name})`,
        `R$ ${fmt(calcAmbienteInstallCost(a) * factor)}`,
      ];
    });

  if (installRows.length > 0) {
    sectionTitle('Custo Fixo (Instalação e Logística)');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Custo referente à medição técnica, transporte e mão de obra de instalação.', marginL, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Descrição', 'Valor']],
      body: installRows,
      styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 8 },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 2;

    // Total installation
    const totalInstall = subtotalInstallation * factor;
    doc.setFillColor(240, 240, 240);
    doc.rect(marginL + contentW * 0.4, y, contentW * 0.6, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text('Total (Instalação e Logística)', marginL + contentW * 0.4 + 3, y + 5);
    doc.text(`R$ ${fmt(totalInstall)}`, pageW - marginR - 3, y + 5, { align: 'right' });
    y += 12;
  }

  // ========================
  // SECTION: SIMULAÇÕES DE INVESTIMENTO TOTAL
  // ========================
  if (ambientes.some(a => a.materialOptions.length > 1)) {
    sectionTitle('Simulações de Investimento Total');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    const simIntro = doc.splitTextToSize(
      'Para sua conveniência, simulamos cenários somando os custos (Material + Serviços) dos ambientes e o custo fixo de Instalação:',
      contentW
    );
    doc.text(simIntro, marginL, y);
    y += simIntro.length * 4 + 4;

    // Build scenario headers from ambientes
    const ambNames = ambientes.map(a => a.tipo === 'Ambiente Personalizado' && a.nomeCustom ? a.nomeCustom : a.tipo);
    const maxOpts = Math.max(...ambientes.map(a => a.materialOptions.length));
    const totalInstall = subtotalInstallation * factor;

    const scenarioHead = ['Cenário de Investimento', ...ambNames.map(n => `Subtotal ${n}`), 'Custo Instalação', 'INVESTIMENTO TOTAL'];
    const scenarioRows: string[][] = [];

    for (let optIdx = 0; optIdx < maxOpts; optIdx++) {
      const row: string[] = [];
      // Label from first ambiente option
      const label = ambientes[0]?.materialOptions[Math.min(optIdx, ambientes[0].materialOptions.length - 1)]?.label
        || `Cenário ${String.fromCharCode(65 + optIdx)}`;

      // Build description
      const matNames = ambientes.map(a => {
        const idx = Math.min(optIdx, a.materialOptions.length - 1);
        const opt = a.materialOptions[idx];
        return opt?.materialDoCliente ? 'Material do Cliente' : (opt?.stoneName || '—');
      });
      row.push(`${label}\n(${matNames.join(' / ')})`);

      let scenarioTotal = 0;
      ambientes.forEach((amb, aIdx) => {
        const idx = Math.min(optIdx, amb.materialOptions.length - 1);
        const matCost = calcAmbienteMaterialCost(amb, idx) * factor;
        const labCost = calcAmbienteLaborCost(amb) * factor;
        const ambTotal = matCost + labCost;
        scenarioTotal += ambTotal;
        row.push(`R$ ${fmt(ambTotal)}`);
      });

      scenarioTotal += totalInstall + subtotalAccessories * factor;
      const scenarioFinal = descontoTipo === 'percent'
        ? scenarioTotal - scenarioTotal * ((parseFloat(descontoValor) || 0) / 100)
        : scenarioTotal - (parseFloat(descontoValor) || 0);

      row.push(`R$ ${fmt(totalInstall)}`);
      row.push(`R$ ${fmt(scenarioFinal)}`);
      scenarioRows.push(row);
    }

    checkPageBreak(20 + scenarioRows.length * 15);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [scenarioHead],
      body: scenarioRows,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        [scenarioHead.length - 1]: { fontStyle: 'bold', halign: 'right' },
        [scenarioHead.length - 2]: { halign: 'right' },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // Single option — show investment total
    sectionTitle('Investimento Total');

    if (hasLabor) {
      const displayMaterials = subtotalMaterials * factor;
      const displayLabor = subtotalLabor * factor;
      const displayAccessories = subtotalAccessories * factor;
      const displayInstallation = subtotalInstallation * factor;

      const totalsData: string[][] = [
        ['Total do Material', `R$ ${fmt(displayMaterials)}`],
        ['Total dos Serviços', `R$ ${fmt(displayLabor)}`],
      ];
      if (displayAccessories > 0) totalsData.push(['Total de Acessórios', `R$ ${fmt(displayAccessories)}`]);
      if (displayInstallation > 0) totalsData.push(['Total de Instalação', `R$ ${fmt(displayInstallation)}`]);
      if (desconto > 0) totalsData.push(['Desconto', `- R$ ${fmt(desconto)}`]);

      autoTable(doc, {
        startY: y,
        margin: { left: marginL + contentW * 0.35, right: marginR },
        body: totalsData,
        styles: { fontSize: 9, cellPadding: 2.5, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 3;

      // Total highlight box
      checkPageBreak(14);
      doc.setFillColor(BLUE);
      doc.roundedRect(marginL + contentW * 0.35, y, contentW * 0.65, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INVESTIMENTO TOTAL', marginL + contentW * 0.35 + 5, y + 7);
      doc.text(`R$ ${fmt(totalFinal)}`, pageW - marginR - 5, y + 7, { align: 'right' });
      y += 16;
    } else {
      checkPageBreak(20);
      doc.setFillColor(BLUE);
      doc.roundedRect(marginL + contentW * 0.25, y, contentW * 0.75, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL DO MATERIAL', marginL + contentW * 0.25 + 5, y + 7);
      doc.text(`R$ ${fmt(subtotalMaterials * factor)}`, pageW - marginR - 5, y + 7, { align: 'right' });
      y += 14;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#c0392b');
      doc.text('NÃO INCLUI MÃO DE OBRA DE INSTALAÇÃO', marginL + contentW * 0.25, y);
      y += 10;
    }
  }

  // ========================
  // SECTION: OBSERVAÇÃO IMPORTANTE (if any)
  // ========================
  if (observacoes) {
    sectionTitle('Observação Importante');
    checkPageBreak(15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    const splitObs = doc.splitTextToSize(observacoes, contentW);
    doc.text(splitObs, marginL, y);
    y += splitObs.length * 4 + 8;
  }

  // ========================
  // SECTION: INFORMAÇÕES ADICIONAIS
  // ========================
  sectionTitle('Informações Adicionais');
  checkPageBreak(40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);

  const bulletItems: string[] = [];
  bulletItems.push(`Validade da Proposta: ${validadeDias} dias (até ${validadeDate.toLocaleDateString('pt-BR')}).`);

  if (condicoesPagamento) {
    bulletItems.push(`Condições de Pagamento: ${condicoesPagamento}`);
    // Calculate payment values from percentages
    const percentRegex = /(\d+)\s*%/g;
    let match;
    while ((match = percentRegex.exec(condicoesPagamento)) !== null) {
      const pct = parseFloat(match[1]);
      const val = totalFinal * (pct / 100);
      bulletItems.push(`   → ${pct}% = R$ ${fmt(val)}`);
    }
  } else {
    bulletItems.push('Condições de Pagamento: A combinar.');
  }

  // Client material note
  const hasClientMaterial = ambientes.some(a => a.materialOptions.some(o => o.materialDoCliente));
  if (hasClientMaterial) {
    bulletItems.push('Material do Cliente: Quando indicado, o valor refere-se apenas ao serviço de produção, pois o material será fornecido pelo cliente. Não nos responsabilizamos por quebras ou defeitos no material fornecido.');
  }

  // No installation note
  const noInstallAmbs = ambientes.filter(a => a.instalacao.semInstalacao);
  if (noInstallAmbs.length > 0) {
    const names = noInstallAmbs.map(a => a.tipo === 'Ambiente Personalizado' && a.nomeCustom ? a.nomeCustom : a.tipo);
    bulletItems.push(`Sem instalação: Os valores para ${names.join(', ')} referem-se apenas à produção. Não incluem custos de instalação.`);
  }

  bulletItems.push('Não Incluso: Fornecimento de cubas, torneiras, válvulas, sifões, cooktop e quaisquer outros acessórios não especificados nesta proposta.');
  bulletItems.push('Observação: As medidas exatas serão confirmadas em visita técnica no local antes da produção das peças.');

  bulletItems.forEach(item => {
    checkPageBreak(10);
    doc.setFont('helvetica', item.startsWith('   →') ? 'bold' : 'normal');
    if (item.startsWith('   →')) doc.setTextColor(BLUE);
    else doc.setTextColor(DARK);

    const label = item.startsWith('   →') ? item : `• ${item}`;
    const splitItem = doc.splitTextToSize(label, contentW - 5);
    doc.text(splitItem, marginL + 3, y);
    y += splitItem.length * 4 + 2;
  });

  y += 6;

  // ========================
  // CLOSING
  // ========================
  checkPageBreak(30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  doc.text('Obrigado pela preferência!', marginL, y);
  y += 7;
  doc.text('Atenciosamente,', marginL, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`${responsibleName || empresa} - ${empresa}`, marginL, y);
  y += 6;

  if (companyAddress) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(companyAddress, marginL, y);
    y += 4;
  }
  if (companyPhone) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(companyPhone, marginL, y);
  }

  // ========================
  // FOOTERS on all pages
  // ========================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`orcamento-${quoteNumber}.pdf`);
};
