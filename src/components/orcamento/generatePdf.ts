import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Ambiente, AcessorioItem,
  calcAmbienteArea, calcAmbienteAreaCompra, calcAmbienteMaterialCost,
  calcAmbienteLaborCost, calcAmbienteInstallCost, calcCubaEsculpida, fmt,
  calcPecaAreaLiquida, calcPecaAreaCompra, calcMetrosLinearesBorda,
} from './types';

interface VersaoPdf {
  id: string;
  nome: string;
  ambientes: Ambiente[];
  acessorios: AcessorioItem[];
}

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
  margemMaterial: number;
  margemServicos: number;
  margemAcessorios: number;
  margemInstalacao: number;
  descontoValor: string;
  descontoTipo: 'percent' | 'reais';
  condicoesPagamento: string;
  observacoes: string;
  logoUrl: string | null;
  companyName: string;
  responsibleName: string;
  companyAddress: string;
  companyPhone: string;
  // Versões alternativas (opcional). A primeira é a principal/atual.
  versoes?: VersaoPdf[];
  versaoPrincipalNome?: string;
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

/** Build detailed, client-friendly description for a piece (measurements in cm) */
const buildPecaDescricao = (p: any): string => {
  const w = parseFloat(p.largura) || 0;
  const l = parseFloat(p.comprimento) || 0;
  const q = parseInt(p.quantidade) || 1;
  const lines: string[] = [];
  const nome = p.nomePeca || p.tipo;
  lines.push(nome);
  if (w > 0 && l > 0) lines.push(`Dimensões: ${l} cm (comp.) × ${w} cm (larg.)`);
  if (q > 1) lines.push(`Quantidade: ${q} unidades`);
  // Cálculos reais (já consideram quantidade, formato, deduções e extras)
  const areaLiq = calcPecaAreaLiquida(p);
  const areaCompra = calcPecaAreaCompra(p);
  const mlBorda = calcMetrosLinearesBorda(p);
  if (areaLiq > 0) lines.push(`Área líquida: ${fmt(areaLiq)} m²`);
  if (areaCompra > 0 && areaCompra !== areaLiq) lines.push(`Chapa c/ desperdício: ${fmt(areaCompra)} m²`);
  if (mlBorda > 0) lines.push(`Acabamento: ${fmt(mlBorda)} ml de borda`);
  if (p.descricao) lines.push(`Obs: ${p.descricao}`);
  return lines.join('\n');
};

/** Build detailed, client-friendly acabamentos for a piece */
const buildAcabamentos = (p: any): string => {
  const lines: string[] = [];

  // Acabamento de borda — sempre visível
  const bordaDesc = p.acabamentoBorda === 'Reto' ? 'Acabamento reto (padrão)' : `Acabamento ${p.acabamentoBorda}`;
  let bordasLabel = '';
  if (p.bordasLadosAtivo) {
    const ls: string[] = [];
    if (p.bordaFrente) ls.push('frente');
    if (p.bordaFundo) ls.push('fundo');
    if (p.bordaEsquerda) ls.push('lateral esquerda');
    if (p.bordaDireita) ls.push('lateral direita');
    bordasLabel = ls.length ? `aplicado em: ${ls.join(', ')}` : 'sem acabamento de borda';
  } else {
    bordasLabel = p.bordasComAcabamento === 'Só frontal' ? 'aplicado na borda frontal'
      : p.bordasComAcabamento === 'Sem acabamento de borda' ? 'sem acabamento de borda'
      : p.bordasComAcabamento === 'Todas as bordas' ? 'aplicado em todas as bordas'
      : `aplicado: ${(p.bordasComAcabamento || '').toLowerCase()}`;
  }
  lines.push(`${bordaDesc}, ${bordasLabel}`);

  // Cuba
  if (p.tipoCuba !== 'Sem cuba') {
    const cubaDescMap: Record<string, string> = {
      'Cuba de embutir': 'Recorte para cuba de embutir',
      'Cuba esculpida': 'Cuba esculpida no próprio material',
      'Cuba colada por baixo (undermount)': 'Recorte e colagem para cuba undermount',
      'Cuba sobreposta': 'Furo para encaixe de cuba sobreposta',
      'Cuba flush': 'Cuba nivelada (flush) com a bancada',
    };
    lines.push(cubaDescMap[p.tipoCuba] || `Cuba: ${p.tipoCuba}`);
  }

  // Rebaixo
  if (p.tipoRebaixo !== 'Sem rebaixo') {
    const rebDescMap: Record<string, string> = {
      'Rebaixo americano': 'Rebaixo estilo americano para encaixe de pia',
      'Rebaixo italiano': 'Rebaixo estilo italiano com canais de escoamento',
      'Rebaixo tradicional': 'Rebaixo tradicional na bancada',
    };
    lines.push(rebDescMap[p.tipoRebaixo] || `Rebaixo: ${p.tipoRebaixo}`);
  }

  // Furos
  if (p.furosTorneira !== 'Nenhum') {
    lines.push(`Perfuração para torneira (${p.furosTorneira})`);
  }

  // Espelho / Frontão
  if (p.espelhoBacksplash && p.espelhoBacksplashAltura) {
    lines.push(`Frontão (rodapé/espelho) com ${p.espelhoBacksplashAltura} cm de altura`);
  }

  // Saia
  if (p.saiaFrontal && p.saiaFrontalAltura) {
    lines.push(`Saia decorativa de ${p.saiaFrontalAltura} cm — ${p.saiaOpcao || 'Só frente'}`);
  }

  // Prateleira inferior
  if (p.prateleira && (p.prateleiraLargura || p.prateleiraComprimento)) {
    lines.push(`Prateleira inferior: ${p.prateleiraLargura || '—'} × ${p.prateleiraComprimento || '—'} cm${p.prateleiraComSaia && p.prateleiraAltura ? ` com saia de ${p.prateleiraAltura} cm` : ''}`);
  }

  // Cooktop
  if (p.rebaixoCooktop) {
    lines.push(`Recorte para cooktop: ${p.rebaixoCooktopLargura || '—'} × ${p.rebaixoCooktopComprimento || '—'} cm`);
  }

  // Ilhargas / pés revestidos
  if (p.ilhargas) {
    const qtd = parseInt(p.ilhargasQtd) || 0;
    lines.push(`${qtd} ilharga(s) / pé(s) revestido(s) — ${p.ilhargasAltura || '—'} × ${p.ilhargasLargura || '—'} cm`);
  }

  // Extras
  if (p.extras && p.extras.length > 0) {
    p.extras.forEach((e: any) => {
      if (e.descricao) lines.push(`Serviço adicional: ${e.descricao}`);
    });
  }
  return lines.length > 0 ? lines.join('\n') : '—';
};

export const generateOrcamentoPdf = async (params: PdfParams) => {
  const {
    quoteNumber, clienteNome, tipoAmbiente, dataOrcamento, validadeDias,
    ambientes, acessorios, subtotalMaterials, subtotalLabor, subtotalAccessories,
    subtotalInstallation, margemMaterial, margemServicos, margemAcessorios, margemInstalacao,
    descontoValor, descontoTipo,
    condicoesPagamento, observacoes, logoUrl, companyName, responsibleName,
    companyAddress, companyPhone,
    versoes, versaoPrincipalNome,
  } = params;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;
  let sectionNum = 0;

  // Per-section margin factors (never shown in PDF)
  const fMat = 1 + margemMaterial / 100;
  const fServ = 1 + margemServicos / 100;
  const fAcc = 1 + margemAcessorios / 100;
  const fInst = 1 + margemInstalacao / 100;

  // Calculate totals with embedded margins
  const totalMat = subtotalMaterials * fMat;
  const totalServ = subtotalLabor * fServ;
  const totalAcc = subtotalAccessories * fAcc;
  const totalInst = subtotalInstallation * fInst;
  const totalBruto = totalMat + totalServ + totalAcc + totalInst;
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

  if (logoData) {
    try { doc.addImage(logoData, 'PNG', pageW / 2 - 15, y, 30, 30); y += 34; } catch { y += 4; }
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(empresa.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 6;

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

  y += 2;
  doc.setDrawColor(200);
  doc.line(marginL, y, pageW - marginR, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(`PROPOSTA COMERCIAL Nº ${quoteNumber}`, marginL, y);
  y += 8;

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

  ambientes.forEach((amb) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    subTitle(ambName);

    const pecasData = amb.pecas.map((p) => [
      p.nomePeca || p.tipo,
      buildPecaDescricao(p),
      buildAcabamentos(p),
    ]);

    checkPageBreak(15 + pecasData.length * 12);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Item', 'Descrição e Medidas', 'Acabamentos Inclusos']],
      body: pecasData,
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak', textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: contentW * 0.35 },
        2: { cellWidth: contentW - 28 - contentW * 0.35 },
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
  doc.text('Custos por opção de pedra, somando material, mão de obra e instalação para facilitar a comparação.', marginL, y);
  y += 8;

  ambientes.forEach((amb) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    const area = calcAmbienteArea(amb);

    subTitle(ambName.toUpperCase());

    const hasClientMat = amb.materialOptions.some(o => o.materialDoCliente);
    if (hasClientMat) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80);
      doc.text('Material: (Fornecido pelo Cliente). Valores abaixo referem-se exclusivamente à mão de obra de produção.', marginL, y);
      y += 5;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Área total do ambiente: ${fmt(area)} m²`, marginL, y);
    y += 6;

    const laborCost = calcAmbienteLaborCost(amb) * fServ;
    const installCost = calcAmbienteInstallCost(amb) * fInst;
    const matData = amb.materialOptions.map((opt, i) => {
      if (opt.materialDoCliente) {
        return [
          opt.label || `Opção ${i + 1}`,
          'Material do cliente',
          'R$ 0,00',
          `R$ ${fmt(laborCost)}`,
          `R$ ${fmt(installCost)}`,
          `R$ ${fmt(laborCost + installCost)}`,
        ];
      }
      const matCost = calcAmbienteMaterialCost(amb, i) * fMat;
      return [
        opt.label || `Opção ${i + 1}`,
        opt.stoneName || '—',
        `R$ ${fmt(matCost)}`,
        `R$ ${fmt(laborCost)}`,
        `R$ ${fmt(installCost)}`,
        `R$ ${fmt(matCost + laborCost + installCost)}`,
      ];
    });

    checkPageBreak(15 + matData.length * 10);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Opção de Material', 'Material', 'Valor Material', 'Valor Serviços', 'Instalação', 'Total da Opção']],
      body: matData,
      styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // ========================
  // SECTION — BREAKDOWN TÉCNICO POR PEÇA
  // ========================
  sectionTitle('Detalhamento Técnico (Memória de Cálculo)');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('Resumo técnico das medidas calculadas para cada peça (m² de chapa e ml de acabamento).', marginL, y);
  y += 8;

  ambientes.forEach((amb) => {
    const ambName = amb.tipo === 'Ambiente Personalizado' && amb.nomeCustom ? amb.nomeCustom : amb.tipo;
    subTitle(ambName);

    const breakdownRows = amb.pecas.map((p) => {
      const areaLiq = calcPecaAreaLiquida(p);
      const areaCompra = calcPecaAreaCompra(p);
      const mlBorda = calcMetrosLinearesBorda(p);
      const desperdicio = areaLiq > 0 ? ((areaCompra / areaLiq - 1) * 100) : 0;
      return [
        p.nomePeca || p.tipo,
        `${parseInt(p.quantidade) || 1}`,
        areaLiq > 0 ? `${fmt(areaLiq)} m²` : '—',
        areaCompra > 0 ? `${fmt(areaCompra)} m²` : '—',
        desperdicio > 0 ? `+${desperdicio.toFixed(0)}%` : '—',
        mlBorda > 0 ? `${fmt(mlBorda)} ml` : '—',
      ];
    });

    // Totais do ambiente
    const totLiq = amb.pecas.reduce((s, p) => s + calcPecaAreaLiquida(p), 0);
    const totCompra = amb.pecas.reduce((s, p) => s + calcPecaAreaCompra(p), 0);
    const totML = amb.pecas.reduce((s, p) => s + calcMetrosLinearesBorda(p), 0);
    breakdownRows.push([
      'TOTAL DO AMBIENTE', '', `${fmt(totLiq)} m²`, `${fmt(totCompra)} m²`, '', `${fmt(totML)} ml`,
    ]);

    checkPageBreak(15 + breakdownRows.length * 7);

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Peça', 'Qtd', 'Área Líquida', 'Chapa Necessária', 'Desperdício', 'ML Acabamento']],
      body: breakdownRows,
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: contentW * 0.32 },
        1: { halign: 'center', cellWidth: 12 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      didParseCell: (data) => {
        // destaque na linha de total
        if (data.row.index === breakdownRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [248, 248, 248];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  });

  // ========================
  // SECTION: ACESSÓRIOS (if any)
  // ========================
  const validAccessories = acessorios.filter(a => a.nome && (parseFloat(a.valorUnitario) || 0) > 0);
  if (validAccessories.length > 0) {
    sectionTitle('Acessórios');
    const accData = validAccessories.map((a) => {
      const sub = (parseInt(a.quantidade) || 1) * (parseFloat(a.valorUnitario) || 0) * fAcc;
      return [
        a.nome,
        a.quantidade || '1',
        `R$ ${fmt((parseFloat(a.valorUnitario) || 0) * fAcc)}`,
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
        `R$ ${fmt(calcAmbienteInstallCost(a) * fInst)}`,
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

    doc.setFillColor(240, 240, 240);
    doc.rect(marginL + contentW * 0.4, y, contentW * 0.6, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text('Total (Instalação e Logística)', marginL + contentW * 0.4 + 3, y + 5);
    doc.text(`R$ ${fmt(totalInst)}`, pageW - marginR - 3, y + 5, { align: 'right' });
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

    const ambNames = ambientes.map(a => a.tipo === 'Ambiente Personalizado' && a.nomeCustom ? a.nomeCustom : a.tipo);
    const maxOpts = Math.max(...ambientes.map(a => a.materialOptions.length));

    const scenarioHead = ['Cenário de Investimento', ...ambNames.map(n => `Subtotal ${n}`), 'Custo Instalação', 'INVESTIMENTO TOTAL'];
    const scenarioRows: string[][] = [];

    for (let optIdx = 0; optIdx < maxOpts; optIdx++) {
      const row: string[] = [];
      const label = ambientes[0]?.materialOptions[Math.min(optIdx, ambientes[0].materialOptions.length - 1)]?.label
        || `Cenário ${String.fromCharCode(65 + optIdx)}`;

      const matNames = ambientes.map(a => {
        const idx = Math.min(optIdx, a.materialOptions.length - 1);
        const opt = a.materialOptions[idx];
        return opt?.materialDoCliente ? 'Material do Cliente' : (opt?.stoneName || '—');
      });
      row.push(`${label}\n(${matNames.join(' / ')})`);

      let scenarioTotal = 0;
      ambientes.forEach((amb) => {
        const idx = Math.min(optIdx, amb.materialOptions.length - 1);
        const matCost = calcAmbienteMaterialCost(amb, idx) * fMat;
        const labCost = calcAmbienteLaborCost(amb) * fServ;
        const instCost = calcAmbienteInstallCost(amb) * fInst;
        const ambTotal = matCost + labCost + instCost;
        scenarioTotal += ambTotal;
        row.push(`R$ ${fmt(ambTotal)}`);
      });

      scenarioTotal += totalAcc;
      // Apply discount to scenario
      const scenarioDiscount = descontoTipo === 'percent'
        ? scenarioTotal * ((parseFloat(descontoValor) || 0) / 100)
        : (parseFloat(descontoValor) || 0);
      const scenarioFinal = scenarioTotal - scenarioDiscount;

      row.push(`Incluída nos subtotais`);
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
    y = (doc as any).lastAutoTable.finalY + 4;

    // Discount highlight for scenarios
    if (desconto > 0) {
      checkPageBreak(16);
      doc.setFillColor(39, 174, 96);
      doc.roundedRect(marginL, y, contentW, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`DESCONTO PARA PAGAMENTO À VISTA (${descontoTipo === 'percent' ? `${descontoValor}%` : `R$ ${descontoValor}`})`, marginL + 5, y + 7);
      doc.text(`- R$ ${fmt(desconto)}`, pageW - marginR - 5, y + 7, { align: 'right' });
      y += 14;
    }
  } else {
    // Single option — show investment total
    sectionTitle('Investimento Total');

    if (hasLabor) {
      const totalsData: string[][] = [
        ['Total do Material', `R$ ${fmt(totalMat)}`],
        ['Total dos Serviços', `R$ ${fmt(totalServ)}`],
      ];
      if (totalAcc > 0) totalsData.push(['Total de Acessórios', `R$ ${fmt(totalAcc)}`]);
      if (totalInst > 0) totalsData.push(['Total de Instalação', `R$ ${fmt(totalInst)}`]);

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

      // Discount highlight
      if (desconto > 0) {
        checkPageBreak(14);
        doc.setFillColor(39, 174, 96);
        doc.roundedRect(marginL + contentW * 0.35, y, contentW * 0.65, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('DESC. PGTO À VISTA', marginL + contentW * 0.35 + 5, y + 7);
        doc.text(`- R$ ${fmt(desconto)}`, pageW - marginR - 5, y + 7, { align: 'right' });
        y += 14;
      }

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
      doc.text(`R$ ${fmt(totalMat)}`, pageW - marginR - 5, y + 7, { align: 'right' });
      y += 14;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#c0392b');
      doc.text('NÃO INCLUI MÃO DE OBRA DE INSTALAÇÃO', marginL + contentW * 0.25, y);
      y += 10;
    }
  }

  // ========================
  // SECTION: OBSERVAÇÃO IMPORTANTE
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

  // Discount note
  if (desconto > 0) {
    bulletItems.push(`Desconto para Pagamento à Vista: ${descontoTipo === 'percent' ? `${descontoValor}%` : `R$ ${fmt(desconto)}`} — Valor à vista: R$ ${fmt(totalFinal)}`);
  }

  const hasClientMaterial = ambientes.some(a => a.materialOptions.some(o => o.materialDoCliente));
  if (hasClientMaterial) {
    bulletItems.push('Material do Cliente: Quando indicado, o valor refere-se apenas ao serviço de produção, pois o material será fornecido pelo cliente. Não nos responsabilizamos por quebras ou defeitos no material fornecido.');
  }

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
