/**
 * exportUtils.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * PDF와 Excel을 하나의 '견적서(Quote)' 양식으로 통일해서 내보낸다.
 *
 *  통일 기준(두 포맷 100% 일치):
 *   · 대상        : 사용자가 선택한(월 건수 > 0) 항목만
 *   · 컬럼 구성    : No. / 풀 / 트랙 / 산출물 / 월 건수 / 내부 단가 / 외부 단가 / 소모(M/M) / 내부 원가 / 외부 금액
 *   · 금액 계산    : 소모 = 1건당 소모 × 월 건수, 내부 원가 = 월 건수 × 내부 단가, 외부 금액 = 월 건수 × 외부 단가
 *   · 표 레이아웃  : 헤더 → 라인아이템 → 합계 → 풀별 요약 → 산출 근거
 *
 *  buildQuoteModel() 이 두 exporter의 단일 소스이므로 컬럼·명칭·계산식이 어긋날 수 없다.
 *  PDF는 한글 폰트 + 멀티 페이지(헤더 고정·페이지 번호), Excel은 동일 레이아웃 + 라이브 수식.
 */
import React from 'react';
import { Document, Font, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';

const { saveAs } = FileSaver; // CJS 패키지 — 번들러/Node ESM 양쪽에서 안전한 default import

import { CALC_NOTES, QUOTE_CONDITIONS } from './masterData';
import type { EstimateResult, LineResult, MasterData, Pool } from './types';

/* ═══════════════════════════════════════════════════════════════════════════
 *  공통 포맷터
 * ═══════════════════════════════════════════════════════════════════════════ */
export const fmtWon = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}`;
export const fmtRes = (n: number) => n.toFixed(3);
export const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
export const fmtHead = (n: number) => `${n.toFixed(1)}명`;
export const fmtDays = (n: number) => `${n.toFixed(1)}일`;
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

/* ═══════════════════════════════════════════════════════════════════════════
 *  견적서 공통 모델 — PDF/Excel 단일 소스
 * ═══════════════════════════════════════════════════════════════════════════ */

const POOL_LABEL: Record<Pool, string> = { A: 'A', B: 'B', 공용: '공용' };

export interface QuoteColumn {
  key: string;
  label: string;
  align: 'left' | 'right' | 'center';
  pdfWidth: number; // % (합계 100)
  xlsWidth: number; // Excel column width
}

export const QUOTE_COLUMNS: QuoteColumn[] = [
  { key: 'no', label: 'No.', align: 'center', pdfWidth: 4, xlsWidth: 5 },
  { key: 'pool', label: '풀', align: 'center', pdfWidth: 5, xlsWidth: 6 },
  { key: 'track', label: '트랙', align: 'left', pdfWidth: 11, xlsWidth: 14 },
  { key: 'name', label: '산출물', align: 'left', pdfWidth: 23, xlsWidth: 34 },
  { key: 'qty', label: '월 건수', align: 'right', pdfWidth: 7, xlsWidth: 9 },
  { key: 'unitInternal', label: '내부 단가', align: 'right', pdfWidth: 10, xlsWidth: 13 },
  { key: 'unitExternal', label: '외부 단가', align: 'right', pdfWidth: 10, xlsWidth: 13 },
  { key: 'resource', label: '소모(M/M)', align: 'right', pdfWidth: 8, xlsWidth: 11 },
  { key: 'internal', label: '내부 원가', align: 'right', pdfWidth: 11, xlsWidth: 14 },
  { key: 'external', label: '외부 금액', align: 'right', pdfWidth: 11, xlsWidth: 14 },
];

export interface QuoteRow {
  no: number;
  line: LineResult;
}

export interface QuotePoolSummary {
  key: Pool | '합계';
  label: string;
  resource: number;
  internal: number;
  external: number;
}

export interface QuoteModel {
  title: string;
  client: string;
  dateStr: string;
  rows: QuoteRow[];
  totalQty: number;
  totalResource: number;
  totalInternal: number;
  totalExternal: number;
  discountRate: number;
  discountedInternal: number;
  discountedExternal: number;
  extras: EstimateResult['extras'];
  poolSummary: QuotePoolSummary[];
  notes: string[];
}

const POOL_SUMMARY_LABEL: Record<Pool, string> = {
  A: 'A · 프로덕션 (촬영·편집)',
  B: 'B · 디자인 (디자인·모션·캐릭터)',
  공용: '공용 (AI·리터칭·포맷 변환)',
};

/** 선택된 항목(월 건수>0)만으로 견적서 모델을 만든다. PDF/Excel이 공유. */
export function buildQuoteModel(result: EstimateResult): QuoteModel {
  const selected = result.lines.filter((l) => l.qty > 0);
  const rows: QuoteRow[] = selected.map((line, i) => ({ no: i + 1, line }));

  const poolKeys: Pool[] = ['A', 'B', '공용'];
  const poolSummary: QuotePoolSummary[] = poolKeys
    .map((p) => {
      const ls = selected.filter((l) => l.item.pool === p);
      return {
        key: p as Pool | '합계',
        label: POOL_SUMMARY_LABEL[p],
        resource: ls.reduce((a, l) => a + l.resource, 0),
        internal: ls.reduce((a, l) => a + l.totalInternal, 0),
        external: ls.reduce((a, l) => a + l.totalExternal, 0),
      };
    })
    .filter((s) => s.resource > 0 || s.internal > 0);

  const totalQty = selected.reduce((a, l) => a + l.qty, 0);
  const totalResource = selected.reduce((a, l) => a + l.resource, 0);
  const totalInternal = selected.reduce((a, l) => a + l.totalInternal, 0);
  const totalExternal = selected.reduce((a, l) => a + l.totalExternal, 0);

  poolSummary.push({ key: '합계', label: '합계', resource: totalResource, internal: totalInternal, external: totalExternal });

  return {
    title: result.input.title || '디자인 견적서',
    client: result.input.client,
    dateStr: fmtDate(result.calculatedAt),
    rows,
    totalQty,
    totalResource,
    totalInternal,
    totalExternal,
    discountRate: result.discountRate,
    discountedInternal: Math.round(totalInternal * (1 - result.discountRate)),
    discountedExternal: Math.round(totalExternal * (1 - result.discountRate)),
    extras: result.extras,
    poolSummary,
    notes: CALC_NOTES,
  };
}

function cellText(col: QuoteColumn, r: QuoteRow): string {
  const { line, no } = r;
  const opts: string[] = [];
  if (line.variationQty > 0) opts.push(`베리에이션 ${line.variationQty}종`);
  if (line.extraPageQty > 0) opts.push(`추가 본문 ${line.extraPageQty}p`);
  switch (col.key) {
    case 'no': return String(no);
    case 'pool': return POOL_LABEL[line.item.pool];
    case 'track': return line.item.track;
    case 'name': return line.item.name + (opts.length ? `  (+${opts.join(', +')})` : '');
    case 'qty': return String(line.qty);
    case 'unitInternal': return fmtWon(line.item.internalPrice);
    case 'unitExternal': return fmtWon(line.item.externalPrice);
    case 'resource': return fmtRes(line.resource);
    case 'internal': return fmtWon(line.totalInternal);
    case 'external': return fmtWon(line.totalExternal);
    default: return '';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  ① PDF — 견적서 양식
 * ═══════════════════════════════════════════════════════════════════════════ */

export const KOREAN_FONT_FAMILY = 'NanumGothic';
let fontRegistered = false;
export function registerKoreanFont(src?: { regular: string; bold?: string }) {
  if (fontRegistered) return;
  const regular = src?.regular ?? 'https://fonts.gstatic.com/s/nanumgothic/v17/PN_3Rfi-oW3hYwmKDpxS7F_z_tLfxno73g.ttf';
  const bold = src?.bold ?? 'https://fonts.gstatic.com/s/nanumgothic/v17/PN_oRfi-oW3hYwmKDpxS7F_LQv37zlEn14YEUQ.ttf';
  Font.register({ family: KOREAN_FONT_FAMILY, fonts: [{ src: regular, fontWeight: 'normal' }, { src: bold, fontWeight: 'bold' }] });
  Font.registerHyphenationCallback((word) => [word]);
  fontRegistered = true;
}

const C = {
  ink: '#1F2A37',
  sub: '#5B6B7C',
  line: '#E2D9D3',
  head: '#FDECE4',
  accent: '#F15C21',
  accentStrong: '#D64A14',
  zebra: '#FBF7F5',
};

const s = StyleSheet.create({
  page: { fontFamily: KOREAN_FONT_FAMILY, fontSize: 9, color: C.ink, paddingTop: 38, paddingBottom: 54, paddingHorizontal: 36 },
  brandbar: { height: 4, backgroundColor: C.accent, marginBottom: 14, borderRadius: 2 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  h1: { fontSize: 20, fontWeight: 'bold' },
  h1accent: { color: C.accent },
  metaRight: { textAlign: 'right', fontSize: 9, color: C.sub, lineHeight: 1.5 },
  metaClient: { fontSize: 11, color: C.ink, fontWeight: 'bold', marginBottom: 2 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: C.accentStrong, marginTop: 12, marginBottom: 6 },
  table: { borderWidth: 0.6, borderColor: C.line, borderBottomWidth: 0 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.6, borderColor: C.line, minHeight: 16, alignItems: 'center' },
  th: { backgroundColor: C.head, fontWeight: 'bold' },
  zebra: { backgroundColor: C.zebra },
  total: { backgroundColor: '#FCE9DF', fontWeight: 'bold' },
  td: { paddingVertical: 3, paddingHorizontal: 4 },
  right: { textAlign: 'right' },
  center: { textAlign: 'center' },
  notes: { marginTop: 12, fontSize: 8, color: C.sub, lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 22, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: C.sub },
});

const alignStyle = (a: QuoteColumn['align']) => (a === 'right' ? s.right : a === 'center' ? s.center : {});

const HeaderRow: React.FC = () => (
  <View style={[s.tr, s.th]} fixed wrap={false}>
    {QUOTE_COLUMNS.map((col) => (
      <Text key={col.key} style={[s.td, { width: `${col.pdfWidth}%` }, alignStyle(col.align)]}>
        {col.label}
      </Text>
    ))}
  </View>
);

const Footer: React.FC<{ title: string }> = ({ title }) => (
  <View style={s.footer} fixed>
    <Text>{title}</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

export interface EstimatePdfProps {
  result: EstimateResult;
}

export const EstimateQuoteDocument: React.FC<EstimatePdfProps> = ({ result }) => {
  registerKoreanFont();
  const m = buildQuoteModel(result);

  return (
    <Document title={m.title} author="디자인 견적 및 리소스 산출 프로그램" language="ko">
      <Page size="A4" style={s.page}>
        <View style={s.brandbar} fixed />
        <View style={s.headRow}>
          <Text style={s.h1}>
            디자인 <Text style={s.h1accent}>견적서</Text>
          </Text>
          <View>
            {m.client ? <Text style={s.metaClient}>{m.client} 貴中</Text> : null}
            <Text style={s.metaRight}>{m.title}</Text>
            <Text style={s.metaRight}>산출일: {m.dateStr}</Text>
          </View>
        </View>
        <View style={s.divider} />

        <Text style={s.sectionTitle}>견적 내역 (선택 항목 {m.rows.length}건)</Text>
        {m.rows.length === 0 ? (
          <Text style={{ fontSize: 9, color: C.sub, paddingVertical: 8 }}>선택된 항목이 없습니다. 월 건수를 1 이상 입력한 항목이 견적서에 표시됩니다.</Text>
        ) : (
          <View style={s.table}>
            <HeaderRow />
            {m.rows.map((r) => (
              <View key={r.line.item.id} style={[s.tr, r.no % 2 === 0 ? s.zebra : {}]} wrap={false}>
                {QUOTE_COLUMNS.map((col) => (
                  <Text key={col.key} style={[s.td, { width: `${col.pdfWidth}%` }, alignStyle(col.align)]}>
                    {cellText(col, r)}
                  </Text>
                ))}
              </View>
            ))}
            <View style={[s.tr, s.total]} wrap={false}>
              {QUOTE_COLUMNS.map((col) => {
                let v = '';
                if (col.key === 'name') v = '합계';
                else if (col.key === 'qty') v = String(m.totalQty);
                else if (col.key === 'resource') v = fmtRes(m.totalResource);
                else if (col.key === 'internal') v = fmtWon(m.totalInternal);
                else if (col.key === 'external') v = fmtWon(m.totalExternal);
                return (
                  <Text key={col.key} style={[s.td, { width: `${col.pdfWidth}%` }, alignStyle(col.align)]}>
                    {v}
                  </Text>
                );
              })}
            </View>
          </View>
        )}

        <Text style={s.sectionTitle}>풀별 요약</Text>
        <View style={s.table}>
          <View style={[s.tr, s.th]} wrap={false}>
            <Text style={[s.td, { width: '40%' }]}>구분</Text>
            <Text style={[s.td, s.right, { width: '20%' }]}>소모 (M/M)</Text>
            <Text style={[s.td, s.right, { width: '20%' }]}>내부 원가</Text>
            <Text style={[s.td, s.right, { width: '20%' }]}>외부 금액</Text>
          </View>
          {m.poolSummary.map((p) => (
            <View key={p.key} style={[s.tr, p.key === '합계' ? s.total : {}]} wrap={false}>
              <Text style={[s.td, { width: '40%' }]}>{p.label}</Text>
              <Text style={[s.td, s.right, { width: '20%' }]}>{fmtRes(p.resource)}</Text>
              <Text style={[s.td, s.right, { width: '20%' }]}>{fmtWon(p.internal)}</Text>
              <Text style={[s.td, s.right, { width: '20%' }]}>{fmtWon(p.external)}</Text>
            </View>
          ))}
        </View>

        {m.extras.total > 0 ? (
          <>
            <Text style={s.sectionTitle}>출장비 · 실비 (원가)</Text>
            <View style={s.table}>
              {m.extras.lines.map((l, i) => (
                <View key={i} style={s.tr} wrap={false}>
                  <Text style={[s.td, { width: '70%' }]}>{l.label}</Text>
                  <Text style={[s.td, s.right, { width: '30%' }]}>{fmtWon(l.amount)}</Text>
                </View>
              ))}
              <View style={[s.tr, s.total]} wrap={false}>
                <Text style={[s.td, { width: '70%' }]}>출장비·실비 합계</Text>
                <Text style={[s.td, s.right, { width: '30%' }]}>{fmtWon(m.extras.total)}</Text>
              </View>
            </View>
          </>
        ) : null}

        <View style={s.notes}>
          <Text style={{ fontWeight: 'bold', marginBottom: 2, color: C.ink }}>산출 근거</Text>
          {m.notes.map((n, i) => (
            <Text key={i}>· {n}</Text>
          ))}
        </View>
        <View style={s.notes} wrap={false}>
          <Text style={{ fontWeight: 'bold', marginBottom: 2, color: C.accentStrong }}>견적 조건 · 특약</Text>
          {QUOTE_CONDITIONS.map((n, i) => (
            <Text key={i} style={{ marginBottom: 1 }}>· {n}</Text>
          ))}
        </View>
        <Footer title={m.title} />
      </Page>
    </Document>
  );
};

export const EstimatePdfDocument = EstimateQuoteDocument;

export async function exportEstimatePdf(result: EstimateResult, fileName?: string): Promise<void> {
  registerKoreanFont();
  const blob = await pdf(<EstimateQuoteDocument result={result} />).toBlob();
  saveAs(blob, fileName ?? `견적서_${fmtDate(result.calculatedAt)}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  ② Excel — 동일한 견적서 양식 (라이브 수식)
 * ═══════════════════════════════════════════════════════════════════════════ */

export const SHEET_QUOTE = '견적서';

const FMT = { res: '0.000', int: '0', won: '#,##0' } as const;
const FONT = { name: 'Malgun Gothic', size: 10 };
const HEAD_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDECE4' } };
const TOTAL_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE9DF' } };
const ZEBRA_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF7F5' } };
const ACCENT = 'FFF15C21';
const THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2D9D3' } },
  left: { style: 'thin', color: { argb: 'FFE2D9D3' } },
  bottom: { style: 'thin', color: { argb: 'FFE2D9D3' } },
  right: { style: 'thin', color: { argb: 'FFE2D9D3' } },
};

const COL_LETTERS = QUOTE_COLUMNS.map((_, i) => String.fromCharCode('B'.charCodeAt(0) + i));
const colLetter = (key: string) => COL_LETTERS[QUOTE_COLUMNS.findIndex((c) => c.key === key)];

function styleCell(cell: ExcelJS.Cell, col: QuoteColumn, opts?: { bold?: boolean; fill?: ExcelJS.Fill; numFmt?: string }) {
  cell.font = { ...FONT, bold: !!opts?.bold };
  cell.border = THIN;
  cell.alignment = { horizontal: col.align, vertical: 'middle' };
  if (opts?.fill) cell.fill = opts.fill;
  if (opts?.numFmt) cell.numFmt = opts.numFmt;
}

export function buildEstimateWorkbook(_master: MasterData, result: EstimateResult): ExcelJS.Workbook {
  const m = buildQuoteModel(result);
  const wb = new ExcelJS.Workbook();
  wb.creator = '디자인 견적 및 리소스 산출 프로그램';
  wb.created = result.calculatedAt;

  const ws = wb.addWorksheet(SHEET_QUOTE, { views: [{ showGridLines: false }] });
  ws.getColumn('A').width = 2;
  QUOTE_COLUMNS.forEach((col, i) => (ws.getColumn(COL_LETTERS[i]).width = col.xlsWidth));

  const firstCol = COL_LETTERS[0];
  const lastCol = COL_LETTERS[COL_LETTERS.length - 1];

  ws.mergeCells(`${firstCol}2:${lastCol}2`);
  const titleCell = ws.getCell(`${firstCol}2`);
  titleCell.value = '디자인 견적서';
  titleCell.font = { ...FONT, size: 16, bold: true, color: { argb: ACCENT } };

  ws.mergeCells(`${firstCol}3:${lastCol}3`);
  ws.getCell(`${firstCol}3`).value = `${m.client ? `${m.client} 貴中    ·    ` : ''}${m.title}    ·    산출일: ${m.dateStr}`;
  ws.getCell(`${firstCol}3`).font = { ...FONT, color: { argb: 'FF5B6B7C' } };

  ws.mergeCells(`${firstCol}4:${lastCol}4`);
  ws.getCell(`${firstCol}4`).value = `견적 내역 (선택 항목 ${m.rows.length}건)`;
  ws.getCell(`${firstCol}4`).font = { ...FONT, bold: true, color: { argb: 'FFD64A14' } };

  const headRow = 5;
  QUOTE_COLUMNS.forEach((col, i) => {
    const cell = ws.getCell(`${COL_LETTERS[i]}${headRow}`);
    cell.value = col.label;
    styleCell(cell, col, { bold: true, fill: HEAD_FILL });
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  const dataStart = headRow + 1;
  const qCol = colLetter('qty');
  const uiCol = colLetter('unitInternal');
  const ueCol = colLetter('unitExternal');

  m.rows.forEach((r, i) => {
    const row = dataStart + i;
    const zebra = i % 2 === 1 ? ZEBRA_FILL : undefined;
    const putV = (key: string, value: ExcelJS.CellValue, numFmt?: string) => {
      const col = QUOTE_COLUMNS.find((c) => c.key === key)!;
      const cell = ws.getCell(`${colLetter(key)}${row}`);
      cell.value = value;
      styleCell(cell, col, { fill: zebra, numFmt });
    };
    const putF = (key: string, formula: string, resultVal: number, numFmt: string) => {
      const col = QUOTE_COLUMNS.find((c) => c.key === key)!;
      const cell = ws.getCell(`${colLetter(key)}${row}`);
      cell.value = { formula, result: resultVal } as ExcelJS.CellFormulaValue;
      styleCell(cell, col, { fill: zebra, numFmt });
    };
    putV('no', r.no, FMT.int);
    putV('pool', POOL_LABEL[r.line.item.pool]);
    putV('track', r.line.item.track);
    putV('name', r.line.item.name);
    putV('qty', r.line.qty, FMT.int);
    putV('unitInternal', r.line.item.internalPrice, FMT.won);
    putV('unitExternal', r.line.item.externalPrice, FMT.won);
    putF('resource', `${r.line.item.resourcePerUnit}*${qCol}${row}`, r.line.resource, FMT.res);
    putF('internal', `${qCol}${row}*${uiCol}${row}`, r.line.internalCost, FMT.won);
    putF('external', `${qCol}${row}*${ueCol}${row}`, r.line.externalAmount, FMT.won);
  });

  const totalRow = dataStart + m.rows.length;
  const rngStart = dataStart;
  const rngEnd = totalRow - 1;
  QUOTE_COLUMNS.forEach((col) => {
    const letter = colLetter(col.key);
    const cell = ws.getCell(`${letter}${totalRow}`);
    const numFmt = col.key === 'resource' ? FMT.res : col.key === 'qty' ? FMT.int : col.key === 'internal' || col.key === 'external' ? FMT.won : undefined;
    if (col.key === 'name') cell.value = '합계';
    else if (m.rows.length && (col.key === 'qty' || col.key === 'resource' || col.key === 'internal' || col.key === 'external')) {
      const resultVal = col.key === 'qty' ? m.totalQty : col.key === 'resource' ? m.totalResource : col.key === 'internal' ? m.totalInternal : m.totalExternal;
      cell.value = { formula: `SUM(${letter}${rngStart}:${letter}${rngEnd})`, result: resultVal } as ExcelJS.CellFormulaValue;
    }
    styleCell(cell, col, { bold: true, fill: TOTAL_FILL, numFmt });
  });

  const sumTitleRow = totalRow + 2;
  ws.mergeCells(`${firstCol}${sumTitleRow}:${lastCol}${sumTitleRow}`);
  ws.getCell(`${firstCol}${sumTitleRow}`).value = '풀별 요약';
  ws.getCell(`${firstCol}${sumTitleRow}`).font = { ...FONT, bold: true, color: { argb: 'FFD64A14' } };

  const sumHeadRow = sumTitleRow + 1;
  const sumLetters = ['B', 'C', 'D', 'E'];
  const sumHeaders: [string, QuoteColumn['align']][] = [['구분', 'left'], ['소모 (M/M)', 'right'], ['내부 원가', 'right'], ['외부 금액', 'right']];
  sumHeaders.forEach(([label, align], i) => {
    const cell = ws.getCell(`${sumLetters[i]}${sumHeadRow}`);
    cell.value = label;
    cell.font = { ...FONT, bold: true };
    cell.fill = HEAD_FILL;
    cell.border = THIN;
    cell.alignment = { horizontal: align === 'right' ? 'right' : 'left', vertical: 'middle' };
  });
  m.poolSummary.forEach((p, i) => {
    const row = sumHeadRow + 1 + i;
    const isTotal = p.key === '합계';
    const vals: [ExcelJS.CellValue, QuoteColumn['align'], string?][] = [
      [p.label, 'left'],
      [p.resource, 'right', FMT.res],
      [p.internal, 'right', FMT.won],
      [p.external, 'right', FMT.won],
    ];
    vals.forEach(([value, align, numFmt], j) => {
      const cell = ws.getCell(`${sumLetters[j]}${row}`);
      cell.value = value;
      cell.font = { ...FONT, bold: isTotal };
      cell.border = THIN;
      if (isTotal) cell.fill = TOTAL_FILL;
      cell.alignment = { horizontal: align === 'right' ? 'right' : 'left', vertical: 'middle' };
      if (numFmt) cell.numFmt = numFmt;
    });
  });

  let noteRow = sumHeadRow + m.poolSummary.length + 3;

  if (m.extras.total > 0) {
    ws.getCell(`B${noteRow}`).value = '출장비 · 실비 (원가)';
    ws.getCell(`B${noteRow}`).font = { ...FONT, bold: true, color: { argb: 'FFD64A14' } };
    m.extras.lines.forEach((l) => {
      noteRow += 1;
      ws.getCell(`B${noteRow}`).value = l.label;
      ws.getCell(`B${noteRow}`).font = { ...FONT, size: 9 };
      const c = ws.getCell(`${colLetter('external')}${noteRow}`);
      c.value = l.amount; c.numFmt = FMT.won; c.font = { ...FONT, size: 9 }; c.alignment = { horizontal: 'right' };
    });
    noteRow += 1;
    ws.getCell(`B${noteRow}`).value = '출장비·실비 합계';
    ws.getCell(`B${noteRow}`).font = { ...FONT, bold: true };
    const ct = ws.getCell(`${colLetter('external')}${noteRow}`);
    ct.value = m.extras.total; ct.numFmt = FMT.won; ct.font = { ...FONT, bold: true }; ct.fill = TOTAL_FILL; ct.alignment = { horizontal: 'right' };
    noteRow += 2;
  }
  ws.getCell(`B${noteRow}`).value = '산출 근거';
  ws.getCell(`B${noteRow}`).font = { ...FONT, bold: true };
  m.notes.forEach((n) => {
    noteRow += 1;
    ws.getCell(`B${noteRow}`).value = `· ${n}`;
    ws.getCell(`B${noteRow}`).font = { ...FONT, size: 9, color: { argb: 'FF5B6B7C' } };
  });

  noteRow += 2;
  ws.getCell(`B${noteRow}`).value = '견적 조건 · 특약';
  ws.getCell(`B${noteRow}`).font = { ...FONT, bold: true, color: { argb: 'FFD64A14' } };
  QUOTE_CONDITIONS.forEach((n) => {
    noteRow += 1;
    const cell = ws.getCell(`B${noteRow}`);
    cell.value = `· ${n}`;
    cell.font = { ...FONT, size: 9, color: { argb: 'FF5B6B7C' } };
    cell.alignment = { wrapText: true, vertical: 'top' };
    ws.mergeCells(`B${noteRow}:${lastCol}${noteRow}`);
    ws.getRow(noteRow).height = 26;
  });

  ws.views = [{ state: 'frozen', ySplit: headRow, showGridLines: false }];
  return wb;
}

export async function exportEstimateExcel(master: MasterData, result: EstimateResult, fileName?: string): Promise<void> {
  const wb = buildEstimateWorkbook(master, result);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName ?? `견적서_${fmtDate(result.calculatedAt)}.xlsx`);
}
