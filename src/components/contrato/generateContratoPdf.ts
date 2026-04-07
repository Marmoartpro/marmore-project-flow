import jsPDF from 'jspdf';
import { fmt } from '@/components/orcamento/types';

export interface ContratoEmpreitadaParams {
  // Contratante (client)
  clientName: string;
  clientCpf: string;
  clientRg: string;
  clientAddress: string;
  // Contratada (contractor)
  contractorName: string;
  contractorCpf: string;
  contractorAddress: string;
  // Contract details
  contractNumber: string;
  contractDate: string;
  serviceType: string;
  materialName: string;
  scopeDescription: string;
  includesInstallation: boolean;
  materialsList: string;
  totalValue: number;
  paymentConditions: string;
  // Configurable percentages
  multaInadimplemento: number;
  jurosMora: number;
  honorariosAdvocaticios: number;
  clausulaPenalRescisao: number;
  comarca: string;
  // Witnesses
  testemunha1Nome: string;
  testemunha1Cpf: string;
  testemunha2Nome: string;
  testemunha2Cpf: string;
  // Additional
  clausulasAdicionais: string;
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

const DARK = '#1a1a2e';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  const partes: string[] = [];
  if (inteiro > 0) partes.push(`${inteiro.toLocaleString('pt-BR')} reais`);
  if (centavos > 0) partes.push(`${centavos} centavos`);
  return partes.join(' e ');
}

function dataPorExtenso(dateStr: string): string {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

export const generateContratoEmpreitadaPdf = async (params: ContratoEmpreitadaParams) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mL = 25, mR = 20;
  const cW = pageW - mL - mR;
  let y = 20;
  let clauseNum = 0;

  // Build hash content for SHA256
  const hashContent = JSON.stringify({
    cn: params.contractNumber, cl: params.clientName, ct: params.contractorName,
    v: params.totalValue, d: params.contractDate, s: params.scopeDescription
  });
  const docHash = await sha256(hashContent);

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(6); doc.setTextColor(140);
    doc.text(`Hash SHA256: ${docHash}`, mL, pageH - 6);
    doc.text(`${pageNum}/${totalPages}`, pageW - mR, pageH - 6, { align: 'right' });
    doc.text(params.contractorName || 'Marmoraria', pageW / 2, pageH - 6, { align: 'center' });
  };

  const checkPage = (n: number) => { if (y + n > pageH - 18) { doc.addPage(); y = 20; } };

  const addSectionTitle = (title: string) => {
    checkPage(14);
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.setTextColor(DARK);
    doc.text(title.toUpperCase(), pageW / 2, y, { align: 'center' });
    y += 8;
  };

  const addClause = (title: string) => {
    clauseNum++;
    checkPage(12);
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.setTextColor(DARK);
    doc.text(`Cláusula ${clauseNum}ª — ${title}`, mL, y);
    y += 6;
  };

  const addParagraph = (text: string, indent = false) => {
    checkPage(10);
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor(DARK);
    const xStart = indent ? mL + 5 : mL;
    const width = indent ? cW - 5 : cW;
    const lines = doc.splitTextToSize(text, width);
    for (const line of lines) {
      checkPage(5);
      doc.text(line, xStart, y);
      y += 4.5;
    }
    y += 2;
  };

  const addParagraphBold = (text: string) => {
    checkPage(10);
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.setTextColor(DARK);
    const lines = doc.splitTextToSize(text, cW);
    for (const line of lines) {
      checkPage(5);
      doc.text(line, mL, y);
      y += 4.5;
    }
    y += 2;
  };

  // ===== HEADER =====
  const logoData = params.logoUrl ? await loadImage(params.logoUrl) : null;
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', pageW / 2 - 12, y, 24, 24); y += 28; } catch { y += 4; }
  }

  // Title
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.setTextColor(DARK);
  const titleText = `CONTRATO DE EMPREITADA EM CONSTRUÇÃO DE ${params.serviceType.toUpperCase()} EM ${params.materialName.toUpperCase()}`;
  const titleLines = doc.splitTextToSize(titleText, cW);
  titleLines.forEach((line: string) => {
    doc.text(line, pageW / 2, y, { align: 'center' });
    y += 6;
  });
  y += 4;

  doc.setDrawColor(180);
  doc.line(mL, y, pageW - mR, y);
  y += 8;

  // ===== PARTIES =====
  addParagraphBold('CONTRATANTE:');
  addParagraph(
    `${params.clientName}` +
    (params.clientCpf ? `, CPF nº ${params.clientCpf}` : '') +
    (params.clientRg ? `, RG nº ${params.clientRg}` : '') +
    (params.clientAddress ? `, residente em ${params.clientAddress}` : '') +
    '.'
  );

  addParagraphBold('CONTRATADA:');
  addParagraph(
    `${params.contractorName}` +
    (params.contractorCpf ? `, pessoa física, CPF nº ${params.contractorCpf}` : '') +
    (params.contractorAddress ? `, residente em ${params.contractorAddress}` : '') +
    '.'
  );

  y += 2;
  const serviceDesc = params.serviceType || 'prestação de serviços em pedras';
  addParagraph(
    `As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de ${serviceDesc}, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente:`
  );

  // ===== DO OBJETO DO CONTRATO =====
  addSectionTitle('DO OBJETO DO CONTRATO');
  addClause('Do Objeto');
  addParagraph(
    `O presente contrato tem por objeto a execução de serviços de construção, confecção e ${params.includesInstallation ? 'instalação' : 'entrega'} de peças em pedras naturais e/ou industriais, conforme escopo detalhado a seguir:`
  );
  if (params.scopeDescription) {
    const scopeLines = params.scopeDescription.split('\n');
    scopeLines.forEach(line => { if (line.trim()) addParagraph(line.trim(), true); });
  }

  // ===== DA EXECUÇÃO DA OBRA =====
  addSectionTitle('DA EXECUÇÃO DA OBRA');
  addClause('Da Mão de Obra');
  if (params.includesInstallation) {
    addParagraph('A CONTRATADA se compromete a fornecer mão de obra de acabamento, confecção e instalação das peças descritas neste contrato, conforme especificações técnicas acordadas.');
  } else {
    addParagraph('A CONTRATADA se compromete a fornecer mão de obra de acabamento e confecção das peças descritas neste contrato. A instalação não está incluída neste contrato.');
  }

  addClause('Dos Materiais');
  addParagraph('A CONTRATADA fornecerá os seguintes materiais para a execução dos serviços:');
  if (params.materialsList) {
    const matLines = params.materialsList.split('\n');
    matLines.forEach(line => { if (line.trim()) addParagraph(`• ${line.trim()}`, true); });
  }

  addClause('Da Aprovação do Material');
  addParagraph('O modelo e estampa do material será comunicado ao Contratante, o qual fará a confirmação escrita da aceitação do mesmo antes do início da fabricação das peças a serem utilizadas na execução do projeto.');

  addClause('Do Projeto Arquitetônico');
  addParagraph('A execução da obra será feita segundo as informações contidas no projeto arquitetônico, fornecido pelo CONTRATANTE; e que está anexado no orçamento.');

  addParagraphBold('Parágrafo único:');
  addParagraph('O CONTRATADO se responsabiliza por qualquer contratação de terceiros, se necessário, eximindo a CONTRATANTE de qualquer responsabilidade Civil, Criminal ou Trabalhista perante estes terceiros contratados.');

  addClause('Da Entrega do Local');
  addParagraph('O CONTRATANTE deverá entregar o local da obra limpo e desimpedido para a execução dos serviços pela CONTRATADA, garantindo acesso e condições adequadas de trabalho.');

  addClause('Dos Resíduos de Materiais');
  addParagraph('Os resíduos de materiais provenientes da execução dos serviços serão removidos pela CONTRATADA ao final de cada etapa de trabalho.');

  addParagraphBold('Parágrafo único:');
  addParagraph('A Contratada não se responsabiliza por qualquer material ou mão de obra dos quais não tenha fornecido, e nem por eventuais defeitos ou danos causados por estes.');

  addParagraph('Ao término da obra, a CONTRATANTE realizará vistoria para verificação dos serviços executados, podendo solicitar ajustes dentro do escopo contratado.');

  // ===== DO PAGAMENTO =====
  addSectionTitle('DO PAGAMENTO');
  addClause('Do Valor e Forma de Pagamento');
  addParagraph(
    `Pelos serviços contratados, a CONTRATANTE pagará à CONTRATADA, o valor de R$ ${fmt(params.totalValue)} (${valorPorExtenso(params.totalValue)}), que serão pagos da seguinte forma:`
  );
  if (params.paymentConditions) {
    addParagraph(params.paymentConditions, true);
  }

  // ===== DO INADIMPLEMENTO =====
  addSectionTitle('DO INADIMPLEMENTO');
  addClause('Das Penalidades por Atraso');
  addParagraph(
    `Em caso de atraso no pagamento, incidirá multa de ${params.multaInadimplemento}% (${valorPorExtenso(params.multaInadimplemento)} por cento) sobre o valor da parcela em atraso, acrescida de juros de mora de ${params.jurosMora}% (${valorPorExtenso(params.jurosMora)} por cento) ao mês, pro rata die, além de correção monetária pelo índice IGP-M/FGV ou outro índice que venha a substituí-lo.`
  );
  addParagraph(
    `Em caso de cobrança judicial, a parte inadimplente arcará com honorários advocatícios fixados em ${params.honorariosAdvocaticios}% (${valorPorExtenso(params.honorariosAdvocaticios)} por cento) sobre o valor da dívida atualizada, além das custas processuais.`
  );

  // ===== DA RESCISÃO =====
  addSectionTitle('DA RESCISÃO CONTRATUAL');
  addClause('Da Rescisão');
  addParagraph('O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação por escrito com antecedência mínima de 15 (quinze) dias, ficando a parte que rescindir obrigada a indenizar a outra pelas despesas já realizadas.');

  addParagraphBold('Parágrafo único:');
  addParagraph(
    `Em caso de rescisão indevida ou sem justa causa, a parte que der causa pagará à outra uma indenização correspondente a ${params.clausulaPenalRescisao}% (${valorPorExtenso(params.clausulaPenalRescisao)} por cento) sobre o valor total deste contrato.`
  );

  // ===== CONDIÇÕES GERAIS =====
  addSectionTitle('DAS CONDIÇÕES GERAIS');
  addClause('Dos Serviços Extras');
  addParagraph('Quaisquer serviços não previstos neste contrato só poderão ser executados mediante aditamento contratual, devidamente assinado por ambas as partes, com os respectivos valores e prazos acrescidos.');

  // Additional clauses
  if (params.clausulasAdicionais) {
    addClause('Disposições Adicionais');
    addParagraph(params.clausulasAdicionais);
  }

  // ===== DO FORO =====
  addSectionTitle('DO FORO');
  clauseNum = 14;
  addClause('Do Foro');
  addParagraph(
    `Para dirimir quaisquer controvérsias oriundas do presente CONTRATO, as partes elegem o foro da Comarca da Cidade de ${params.comarca}.`
  );

  y += 4;
  addParagraph('Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com assinaturas de duas testemunhas.');

  // ===== DATE AND SIGNATURES =====
  checkPage(65);
  y += 8;
  const comarcaCity = params.comarca.split('/')[0] || params.comarca;
  doc.setFontSize(10); doc.setFont('times', 'normal'); doc.setTextColor(DARK);
  doc.text(`${comarcaCity}, ${dataPorExtenso(params.contractDate)}`, pageW / 2, y, { align: 'center' });
  y += 20;

  const colW = cW / 2 - 10;

  // Contratada
  doc.line(mL, y, mL + colW, y);
  doc.setFontSize(9); doc.setFont('times', 'bold');
  doc.text('CONTRATADA', mL, y + 5);
  doc.setFont('times', 'normal');
  doc.text(params.contractorName, mL, y + 10);
  if (params.contractorCpf) doc.text(`CPF: ${params.contractorCpf}`, mL, y + 14);

  // Contratante
  const rX = mL + colW + 20;
  doc.line(rX, y, rX + colW, y);
  doc.setFont('times', 'bold');
  doc.text('CONTRATANTE', rX, y + 5);
  doc.setFont('times', 'normal');
  doc.text(params.clientName, rX, y + 10);
  if (params.clientCpf) doc.text(`CPF: ${params.clientCpf}`, rX, y + 14);

  y += 30;
  checkPage(30);

  // Witnesses
  doc.line(mL, y, mL + colW, y);
  doc.setFont('times', 'bold');
  doc.text('TESTEMUNHA 1', mL, y + 5);
  doc.setFont('times', 'normal');
  doc.text(params.testemunha1Nome || '____________________', mL, y + 10);
  if (params.testemunha1Cpf) doc.text(`CPF: ${params.testemunha1Cpf}`, mL, y + 14);

  doc.line(rX, y, rX + colW, y);
  doc.setFont('times', 'bold');
  doc.text('TESTEMUNHA 2', rX, y + 5);
  doc.setFont('times', 'normal');
  doc.text(params.testemunha2Nome || '____________________', rX, y + 10);
  if (params.testemunha2Cpf) doc.text(`CPF: ${params.testemunha2Cpf}`, rX, y + 14);

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`contrato-empreitada-${params.contractNumber}.pdf`);
  return docHash;
};
