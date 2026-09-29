/**
 * calcEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 캐파_시뮬레이터 시트의 수식을 1:1 로 옮긴 순수 함수.
 * (useEstimateCalculator 훅, PDF/Excel 내보내기, 검증 스크립트가 공유)
 *
 *  행     엑셀 수식                                                        구현
 *  ────  ──────────────────────────────────────────────────────────────  ───────────────────
 *  G6    =E6*F6                                                          line.resource
 *  H6    =F6*INDEX(마스터!J, MATCH(D6, 마스터!E, 0))                        line.internalCost
 *  I6    =F6*INDEX(마스터!M, MATCH(D6, 마스터!E, 0))                        line.externalAmount
 *  D85   =SUMIF(B,"A",G)+SUMIF(B,"공용",G)*$F$82                          poolLoads[A].resource
 *  D86   =SUMIF(B,"B",G)+SUMIF(B,"공용",G)*(1-$F$82)                      poolLoads[B].resource
 *  F85   =IFERROR(D85/E85,0)                                             utilization
 *  G85   =IF(F85>1,"인력 부족",IF(F85>0.85,"포화 임박","여유"))              verdict()
 *  H85   =SUMIF(B,"A",H)+SUMIF(B,"공용",H)*$F$82                          poolLoads[A].internalCost
 *  D89   =SUMIF(C,"사진 촬영",G)                                           subConstraints
 *  C101  =SUMIF(B,"A",G) / D101 =C101 / E101 =C101*22                     summary
 *  F101  =SUMIF(B,"A",H) / G101 =SUMIF(B,"A",I)
 *  C104  =SUM(C101:C103)                                                 total
 *  G108  =IF(C108>D108,ROUNDUP(C108-D108,1),0)                           shortage
 */
import type {
  CalcConstants,
  EstimateInput,
  EstimateResult,
  LineResult,
  MasterData,
  Pool,
  PoolLoad,
  SubConstraintLoad,
  SummaryRow,
  Verdict,
} from './types';
import { SHARED_SUMMARY_LABEL, DISCOUNT_RATE, DOMESTIC_TRAVEL, OVERSEAS_TRAVEL, EXPENSE_MARKUP } from './masterData';

/** 1 M/M 내부원가 기준값 (리소스 역산용) */
const RESOURCE_UNIT_COST = 7160000;

/** Excel ROUNDUP(x, digits) — 0에서 멀어지는 방향으로 올림 */
export function excelRoundUp(value: number, digits: number): number {
  const f = 10 ** digits;
  const scaled = Math.abs(value) * f;
  // 부동소수 오차 보정 (예: 1.2000000000000002 → 1.2)
  const rounded = Math.ceil(scaled - 1e-9);
  return Math.sign(value) * (rounded / f);
}

/** =IFERROR(D/E, 0) */
export function safeRatio(numerator: number, denominator: number): number {
  if (!denominator || !Number.isFinite(denominator)) return 0;
  return numerator / denominator;
}

/** =IF(F>1,"인력 부족",IF(F>0.85,"포화 임박","여유")) */
export function verdict(utilization: number, c: CalcConstants): Verdict {
  if (utilization > c.shortageThreshold) return '인력 부족';
  if (utilization > c.saturationThreshold) return '포화 임박';
  return '여유';
}

/** =SUMIF(range, key, sumRange) */
function sumIf<T>(rows: T[], pred: (r: T) => boolean, pick: (r: T) => number): number {
  return rows.reduce((acc, r) => (pred(r) ? acc + pick(r) : acc), 0);
}

/** 초기 입력값: 시뮬레이터 시트에 기입돼 있던 값 그대로 */
export function createDefaultInput(master: MasterData): EstimateInput {
  const quantities: Record<string, number> = {};
  master.designItems.forEach((it) => (quantities[it.id] = it.defaultQty));
  const poolHeadcount = { A: 0, B: 0 } as Record<'A' | 'B', number>;
  master.resource.pools.forEach((p) => (poolHeadcount[p.pool] = p.headcount));
  const subHeadcount: Record<string, number> = {};
  master.resource.subConstraints.forEach((s) => (subHeadcount[s.track] = s.headcount));
  return {
    title: '',
    client: '',
    quantities,
    variations: {},
    extraPages: {},
    sharedRatioToA: master.resource.constants.sharedRatioToA,
    poolHeadcount,
    subHeadcount,
  };
}

export function calculateEstimate(master: MasterData, input: EstimateInput): EstimateResult {
  const c = master.resource.constants;
  const ratio = input.sharedRatioToA;

  /* ── 항목별 라인 (기본 + 베리에이션 + 캐러셀 추가 페이지) ── */
  const lines: LineResult[] = master.designItems.map((item) => {
    const qty = Number(input.quantities[item.id] ?? 0) || 0;
    const internalCost = qty * item.internalPrice; // H = F*J
    const externalAmount = qty * item.externalPrice; // I = F*M

    // 베리에이션(+50%): variationAllowed 항목만
    const variationQty = item.variationAllowed ? Number(input.variations?.[item.id] ?? 0) || 0 : 0;
    const variationInternal = Math.round(item.internalPrice * 0.5) * variationQty;
    const variationExternal = Math.round(item.externalPrice * 0.5) * variationQty;

    // 캐러셀 추가 본문 1p = 기본가 × 5%: isCarousel 항목만
    const extraPageQty = item.isCarousel ? Number(input.extraPages?.[item.id] ?? 0) || 0 : 0;
    const extraPageInternal = Math.round(item.internalPrice * 0.05) * extraPageQty;
    const extraPageExternal = Math.round(item.externalPrice * 0.05) * extraPageQty;

    return {
      item,
      qty,
      resource: item.resourcePerUnit * qty, // G = E*F
      internalCost,
      externalAmount,
      variationQty,
      variationInternal,
      variationExternal,
      extraPageQty,
      extraPageInternal,
      extraPageExternal,
      totalInternal: internalCost + variationInternal + extraPageInternal,
      totalExternal: externalAmount + variationExternal + extraPageExternal,
    };
  });

  const byPool = (pool: Pool, pick: (l: LineResult) => number) =>
    sumIf(lines, (l) => l.item.pool === pool, pick);

  const sharedRes = byPool('공용', (l) => l.resource);
  const sharedCost = byPool('공용', (l) => l.internalCost);

  /* ── 85~86행 + 108~109행 ── */
  const poolLoads: PoolLoad[] = master.resource.pools.map((p) => {
    const share = p.pool === 'A' ? ratio : 1 - ratio;
    const resource = byPool(p.pool, (l) => l.resource) + sharedRes * share;
    const internalCost = byPool(p.pool, (l) => l.internalCost) + sharedCost * share;
    const headcount = Number(input.poolHeadcount[p.pool] ?? p.headcount) || 0;
    const utilization = safeRatio(resource, headcount);
    return {
      pool: p.pool,
      name: p.name,
      resource,
      headcount,
      utilization,
      verdict: verdict(utilization, c),
      internalCost,
      shortage: resource > headcount ? excelRoundUp(resource - headcount, 1) : 0,
    };
  });

  /* ── 89~90행 ── */
  const subConstraints: SubConstraintLoad[] = master.resource.subConstraints.map((s) => {
    const resource = sumIf(lines, (l) => l.item.track === s.track, (l) => l.resource);
    const headcount = Number(input.subHeadcount[s.track] ?? s.headcount) || 0;
    const utilization = safeRatio(resource, headcount);
    return { label: s.label, track: s.track, resource, headcount, utilization, verdict: verdict(utilization, c) };
  });

  /* ── 101~104행 ── */
  const mkSummary = (key: Pool, label: string): SummaryRow => {
    const resource = byPool(key, (l) => l.resource);
    return {
      key,
      label,
      resource,
      headcountEquivalent: resource,
      workingDays: resource * c.workingDaysPerMonth,
      internalCost: byPool(key, (l) => l.totalInternal),
      externalAmount: byPool(key, (l) => l.totalExternal),
    };
  };
  const summary: SummaryRow[] = [
    ...master.resource.pools.map((p) => mkSummary(p.pool, p.summaryLabel)),
    mkSummary('공용', SHARED_SUMMARY_LABEL),
  ];
  const totalRes = summary.reduce((a, r) => a + r.resource, 0);
  const total: SummaryRow = {
    key: '합계',
    label: '합계',
    resource: totalRes,
    headcountEquivalent: totalRes,
    workingDays: totalRes * c.workingDaysPerMonth,
    internalCost: summary.reduce((a, r) => a + r.internalCost, 0),
    externalAmount: summary.reduce((a, r) => a + r.externalAmount, 0),
  };

  /* ── 할인(10% 고정) 적용 + 할인가 기준 리소스 재산출 ── */
  const discountRate = DISCOUNT_RATE;
  const discountedInternal = Math.round(total.internalCost * (1 - discountRate));
  const discountedExternal = Math.round(total.externalAmount * (1 - discountRate));
  // 리소스는 할인된 내부 원가를 1 M/M 단가(716만)로 나눠 재산출
  const discountedResource = discountedInternal / RESOURCE_UNIT_COST;
  const discountedWorkingDays = discountedResource * c.workingDaysPerMonth;

  /* ── 출장비·실비 계산 (원가 그대로) ── */
  const ex = input.extras ?? {};
  const exLines: { label: string; amount: number }[] = [];

  const dRegion = DOMESTIC_TRAVEL.find((d) => d.key === ex.domesticRegion);
  const domesticCount = Number(ex.domesticCount ?? 0) || 0;
  const domestic = dRegion ? dRegion.amount * domesticCount : 0;
  if (domestic > 0) exLines.push({ label: `국내 출장 · ${dRegion!.label} × ${domesticCount}회`, amount: domestic });

  const oRegion = OVERSEAS_TRAVEL.find((o) => o.key === ex.overseasRegion);
  const oHead = Number(ex.overseasHeadcount ?? 0) || 0;
  const oTrips = Number(ex.overseasTrips ?? 0) || 0;
  // 이동 인건비 + 일비(이동일 기준) — 자동. 나머지 실비는 직접 입력.
  const overseasTravel = oRegion ? (oRegion.roundTripLabor + oRegion.perDiem * oRegion.moveDays) * oHead * oTrips : 0;
  if (overseasTravel > 0)
    exLines.push({ label: `해외 출장 · ${oRegion!.label} · ${oHead}인 × ${oTrips}회 (이동비+일비)`, amount: overseasTravel });

  const overseasExpense = Math.round(Number(ex.overseasExpense ?? 0) || 0);
  if (overseasExpense > 0) exLines.push({ label: '해외 기타 실비 (숙박·항공·장비 등)', amount: overseasExpense });

  const aiCredit = Math.round((Number(ex.aiCredit ?? 0) || 0) * EXPENSE_MARKUP);
  if (aiCredit > 0) exLines.push({ label: 'AI 크레딧 실비 (×1.1)', amount: aiCredit });

  const licenseExpense = Math.round((Number(ex.licenseExpense ?? 0) || 0) * EXPENSE_MARKUP);
  if (licenseExpense > 0) exLines.push({ label: '라이선스·장비 실비 (×1.1)', amount: licenseExpense });

  const extrasTotal = domestic + overseasTravel + overseasExpense + aiCredit + licenseExpense;

  const extras = {
    domestic,
    overseasTravel,
    overseasExpense,
    aiCredit,
    licenseExpense,
    total: extrasTotal,
    lines: exLines,
  };

  return {
    input,
    lines,
    poolLoads,
    subConstraints,
    summary,
    total,
    discountRate,
    discountedInternal,
    discountedExternal,
    discountedResource,
    discountedWorkingDays,
    extras,
    calculatedAt: new Date(),
  };
}
