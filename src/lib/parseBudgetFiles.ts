/**
 * Leitura de arquivos enviados pelos clientes (PDF e planilhas) para
 * alimentar o gerador de orçamento por IA.
 *
 * Estratégia:
 *  - PDF: extrai o texto com pdf.js. Se o PDF for digitalizado (pouco texto),
 *    renderiza as primeiras páginas como imagem para a IA "ler" visualmente.
 *  - Planilhas (xlsx/xls/csv): converte cada aba em CSV legível.
 */
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ParsedFileResult {
  /** Nome do arquivo original. */
  fileName: string;
  /** Texto extraído (pode ser vazio em PDFs digitalizados). */
  text: string;
  /** Páginas renderizadas como data URL (usadas quando não há texto). */
  images: string[];
  /** Tipo detectado, para mensagens na interface. */
  kind: "pdf" | "spreadsheet";
}

const MAX_PAGES_TEXT = 15;
const MAX_PAGES_IMAGE = 3;
/** Abaixo disso consideramos que o PDF é digitalizado (imagem). */
const MIN_TEXT_CHARS = 120;

async function renderPdfPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
): Promise<string | null> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(viewport.width, 1600);
  canvas.height = Math.round((canvas.width / viewport.width) * viewport.height);
  const context = canvas.getContext("2d");
  if (!context) return null;

  const scaled = page.getViewport({ scale: canvas.width / page.getViewport({ scale: 1 }).width });
  await page.render({ canvas, canvasContext: context, viewport: scaled }).promise;
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function parsePdf(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pageCount = Math.min(pdf.numPages, MAX_PAGES_TEXT);
  const chunks: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) chunks.push(`--- Página ${i} ---\n${pageText}`);
  }

  const text = chunks.join("\n\n");
  const images: string[] = [];

  if (text.length < MIN_TEXT_CHARS) {
    // PDF provavelmente digitalizado: mandamos as páginas como imagem.
    const limit = Math.min(pdf.numPages, MAX_PAGES_IMAGE);
    for (let i = 1; i <= limit; i++) {
      const dataUrl = await renderPdfPage(pdf, i);
      if (dataUrl) images.push(dataUrl);
    }
  }

  return { fileName: file.name, text, images, kind: "pdf" };
}

function parseSpreadsheet(file: File): Promise<ParsedFileResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Não foi possível ler "${file.name}".`));
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const parts = workbook.SheetNames.map((name) => {
          const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name], { blankrows: false });
          return `--- Planilha: ${name} ---\n${csv.trim()}`;
        });
        resolve({
          fileName: file.name,
          text: parts.join("\n\n"),
          images: [],
          kind: "spreadsheet",
        });
      } catch (err) {
        reject(new Error(`Planilha inválida ou corrompida: ${file.name}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function isSupportedBudgetFile(file: File): boolean {
  return /\.(pdf|xlsx|xls|csv)$/i.test(file.name);
}

/** Lê um PDF ou planilha e devolve conteúdo pronto para enviar à IA. */
export async function parseBudgetFile(file: File): Promise<ParsedFileResult> {
  if (/\.pdf$/i.test(file.name)) return parsePdf(file);
  if (/\.(xlsx|xls|csv)$/i.test(file.name)) return parseSpreadsheet(file);
  throw new Error("Formato não suportado. Envie PDF, XLSX, XLS ou CSV.");
}
