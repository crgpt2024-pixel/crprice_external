/**
 * EstimateApp.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 마스터 데이터 기반 디자인/리소스 선택 폼 + 실시간 요약 패널.
 *
 *  ┌──────────────────────────────────────────┬───────────────────────────┐
 *  │ 검색 · 풀 필터 · 초기화                       │ 요약 패널 (sticky)         │
 *  │ ┌ 풀 A · 프로덕션 ───────────────────────┐ │  · 합계 M/M / 원가 / 금액   │
 *  │ │ 트랙 ▸ 항목 [월 건수] 소모 · 원가 · 금액  │ │  · 풀별 가동률 게이지        │
 *  │ └───────────────────────────────────────┘ │  · 하위 제약               │
 *  │ ┌ 풀 B · 디자인 …                         │ │  · 인력/배분 설정            │
 *  │ ┌ 공용 …                                  │ │  · PDF / Excel 내보내기     │
 *  └──────────────────────────────────────────┴───────────────────────────┘
 */
import React, { useMemo, useState } from 'react';

import { exportEstimateExcel, exportEstimatePdf, fmtHead, fmtPct, fmtRes, fmtWon } from './exportUtils';
import { useEstimateCalculator } from './useEstimateCalculator';
import type { DesignItem, LineResult, Pool, Verdict } from './types';

/**
 * 내부용 패널(풀별 가동률 · 하위 제약 · 인력 배분 설정) 표시 여부.
 *  ★ 이 파일은 외부용(고객 공개용) 빌드입니다 → false 고정.
 *    내부용 소스에서는 true 입니다. 두 버전은 이 한 줄만 다릅니다.
 * 세 패널만 숨겨지고, 견적 계산·PDF/Excel 내보내기는 내부용과 동일하게 동작합니다.
 */
const SHOW_INTERNAL_PANELS = false;


const POOL_TITLE: Record<Pool, string> = {
  A: 'A · 프로덕션 (촬영·편집·모션·AI영상·리터칭)',
  B: 'B · 디자인 (정적·브랜딩·패키지·캐릭터·AI이미지)',
  공용: '공용',
};
const POOL_ORDER: Pool[] = ['A', 'B', '공용'];

const CSS = `
  .est { --ink:#1F2A37; --sub:#5B6B7C; --line:#D9E0E7; --paper:#FFFFFF; --bg:#F6F4F2;
         --accent:#F15C21; --accent-strong:#D64A14; --accent-soft:#FDECE4; --ok:#087443; --warn:#B54708; --bad:#B42318;
         --input:#FFF6D5; font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
         color:var(--ink); background:var(--bg); min-height:100vh; font-size:14px; line-height:1.45; }
  .est * { box-sizing:border-box; }
  .est input, .est button { font:inherit; }
  .est-wrap { max-width:1360px; margin:0 auto; padding:28px 24px 64px; display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:24px; align-items:start; }
  @media (max-width:980px){ .est-wrap { grid-template-columns:1fr; } .est-side { position:static !important; } }
  .est-head { grid-column:1/-1; display:flex; flex-wrap:wrap; gap:12px 20px; align-items:flex-end; justify-content:space-between; margin-bottom:4px; padding-top:14px; border-top:3px solid var(--accent); }
  .est-head h1 { font-size:22px; font-weight:700; margin:0; letter-spacing:-0.01em; }
  .est-head h1 b { color:var(--accent); font-weight:700; }
  .est-head p { margin:2px 0 0; color:var(--sub); }
  .est-meta { display:flex; gap:8px; flex-wrap:wrap; }
  .est-meta input { border:1px solid var(--line); border-radius:6px; padding:8px 10px; min-width:220px; background:var(--paper); }
  .est-meta input:focus { outline:2px solid var(--accent); outline-offset:1px; }
  .est-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
  .est-toolbar input[type=search] { flex:1 1 240px; border:1px solid var(--line); border-radius:6px; padding:8px 10px; background:var(--paper); }
  .est-toolbar input[type=search]:focus { outline:2px solid var(--accent); outline-offset:1px; }
  .est-chip { border:1px solid var(--line); background:var(--paper); border-radius:999px; padding:6px 12px; cursor:pointer; color:var(--sub); }
  .est-chip[aria-pressed=true] { background:var(--accent); border-color:var(--accent); color:#fff; }
  .est-chip:focus-visible, .est-btn:focus-visible, .est-qty:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .est-btn { border:1px solid var(--line); background:var(--paper); border-radius:6px; padding:8px 12px; cursor:pointer; color:var(--ink); }
  .est-btn.primary { background:var(--accent); border-color:var(--accent-strong); color:#fff; font-weight:600; }
  .est-btn.primary:hover:not(:disabled) { background:var(--accent-strong); }
  .est-btn:disabled { opacity:.5; cursor:default; }
  .est-pool { background:var(--paper); border:1px solid var(--line); border-radius:10px; margin-bottom:16px; overflow:hidden; }
  .est-pool > summary { list-style:none; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 16px; font-weight:700; border-bottom:1px solid var(--line); }
  .est-pool > summary::-webkit-details-marker { display:none; }
  .est-pool > summary small { font-weight:500; color:var(--sub); }
  .est-track { padding:6px 16px 4px; color:var(--sub); font-size:12px; background:#FAFBFC; border-bottom:1px solid var(--line); }
  .est-row { display:grid; grid-template-columns:minmax(0,1fr) 84px 88px 110px 110px; gap:10px; align-items:center; padding:7px 16px; border-bottom:1px solid var(--line); }
  .est-row:last-child { border-bottom:0; }
  .est-row.active { background:var(--accent-soft); }
  .est-row .name { min-width:0; }
  .est-row .name span { display:block; color:var(--sub); font-size:12px; }
  .est-row .name span.note { color:var(--accent-strong); font-size:11.5px; margin-top:1px; }
  .est-qty { width:84px; text-align:right; border:1px solid var(--line); border-radius:6px; padding:6px 8px; background:var(--input); }
  .est-num { text-align:right; font-variant-numeric:tabular-nums; }
  .est-num.dim { color:var(--sub); }
  .est-colhead { display:grid; grid-template-columns:minmax(0,1fr) 84px 88px 110px 110px; gap:10px; padding:6px 16px; color:var(--sub); font-size:12px; border-bottom:1px solid var(--line); background:#FAFBFC; }
  .est-colhead > :not(:first-child) { text-align:right; }
  @media (max-width:640px){ .est-row, .est-colhead { grid-template-columns:minmax(0,1fr) 72px 80px; } .est-row > :nth-child(n+4), .est-colhead > :nth-child(n+4) { display:none; } }
  .est-side { position:sticky; top:16px; display:flex; flex-direction:column; gap:14px; }
  .est-card { background:var(--paper); border:1px solid var(--line); border-radius:10px; padding:16px; }
  .est-card h2 { font-size:13px; margin:0 0 10px; color:var(--sub); font-weight:600; }
  .est-total { display:grid; grid-template-columns:1fr 1fr; gap:10px 14px; }
  .est-total .k { color:var(--sub); font-size:12px; }
  .est-total .v { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:-0.01em; }
  .est-total .v.accent { color:var(--accent); }
  .est-total .v small { font-size:12px; font-weight:500; color:var(--sub); margin-left:3px; }
  .est-gauge { margin-top:12px; }
  .est-gauge:first-of-type { margin-top:0; }
  .est-gauge .top { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
  .est-gauge .top b { font-weight:600; }
  .est-gauge .bar { position:relative; height:8px; background:#E9EEF3; border-radius:999px; margin:6px 0 4px; overflow:hidden; }
  .est-gauge .bar i { position:absolute; inset:0 auto 0 0; border-radius:999px; transition:width .25s ease; }
  @media (prefers-reduced-motion:reduce){ .est-gauge .bar i { transition:none; } }
  .est-gauge .bar u { position:absolute; top:-2px; bottom:-2px; width:2px; background:var(--ink); opacity:.35; left:85%; }
  .est-gauge .sub { display:flex; justify-content:space-between; color:var(--sub); font-size:12px; }
  .est-verdict { font-weight:700; }
  .est-verdict[data-v="여유"] { color:var(--ok); }
  .est-verdict[data-v="포화 임박"] { color:var(--warn); }
  .est-verdict[data-v="인력 부족"] { color:var(--bad); }
  .est-set { display:grid; grid-template-columns:1fr auto; gap:8px 12px; align-items:center; }
  .est-set label { color:var(--sub); }
  .est-set input { width:96px; text-align:right; border:1px solid var(--line); border-radius:6px; padding:6px 8px; background:var(--input); }
  .est-set input:focus { outline:2px solid var(--accent); outline-offset:1px; }
  .est-actions { display:flex; gap:8px; }
  .est-actions .est-btn { flex:1; }
  .est-status { color:var(--sub); font-size:12px; min-height:18px; }
  .est-empty { padding:32px 16px; color:var(--sub); text-align:center; }
  .est-mobilebar { display:none; }
  @media (max-width:980px){
    .est-wrap { padding-bottom:96px; }
    .est-mobilebar { display:flex; position:fixed; left:0; right:0; bottom:0; z-index:10; gap:12px; align-items:center;
      padding:10px 16px calc(10px + env(safe-area-inset-bottom)); background:var(--paper); border-top:1px solid var(--line); box-shadow:0 -6px 20px rgba(31,42,55,.08); }
    .est-mobilebar .nums { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
    .est-mobilebar .nums b { font-size:16px; font-variant-numeric:tabular-nums; }
    .est-mobilebar .nums span { font-size:12px; color:var(--sub); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .est-mobilebar .est-btn { flex:0 0 auto; }
  }
`;

/* ─────────────────────────── 하위 컴포넌트 ─────────────────────────── */

const Gauge: React.FC<{ title: string; resource: number; headcount: number; utilization: number; verdict: Verdict; shortage?: number }> = ({
  title,
  resource,
  headcount,
  utilization,
  verdict,
  shortage,
}) => {
  const width = Math.min(100, utilization * 100);
  const color = verdict === '인력 부족' ? 'var(--bad)' : verdict === '포화 임박' ? 'var(--warn)' : 'var(--accent)';
  return (
    <div className="est-gauge" role="group" aria-label={title}>
      <div className="top">
        <b>{title}</b>
        <span className="est-verdict" data-v={verdict}>
          {verdict}
          {shortage ? ` · ${fmtHead(shortage)} 부족` : ''}
        </span>
      </div>
      <div className="bar" aria-hidden>
        <i style={{ width: `${width}%`, background: color }} />
        <u title="실무 상한 85%" />
      </div>
      <div className="sub">
        <span>
          필요 {fmtRes(resource)} / 보유 {fmtHead(headcount)}
        </span>
        <span>{fmtPct(utilization)}</span>
      </div>
    </div>
  );
};

const LineRow: React.FC<{ line: LineResult; onChange: (id: string, qty: number) => void }> = React.memo(({ line, onChange }) => {
  const { item, qty } = line;
  return (
    <div className={`est-row${qty > 0 ? ' active' : ''}`}>
      <div className="name">
        {item.name}
        <span>
          1건당 {fmtRes(item.resourcePerUnit)} M/M · 내부 {fmtWon(item.internalPrice)} · 외부 {fmtWon(item.externalPrice)}
        </span>
        {item.note ? <span className="note">{item.note}</span> : null}
      </div>
      <input
        className="est-qty"
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        aria-label={`${item.name} 월 건수`}
        value={qty === 0 ? '' : qty}
        placeholder="0"
        onChange={(e) => onChange(item.id, e.target.value === '' ? 0 : Number(e.target.value))}
      />
      <div className={`est-num${qty ? '' : ' dim'}`}>{fmtRes(line.resource)}</div>
      <div className={`est-num${qty ? '' : ' dim'}`}>{fmtWon(line.internalCost)}</div>
      <div className={`est-num${qty ? '' : ' dim'}`}>{fmtWon(line.externalAmount)}</div>
    </div>
  );
});
LineRow.displayName = 'LineRow';

/* ─────────────────────────── 메인 ─────────────────────────── */

export default function EstimateApp() {
  const calc = useEstimateCalculator();
  const { master, input, result, isCalculating } = calc;

  const [query, setQuery] = useState('');
  const [poolFilter, setPoolFilter] = useState<Pool | 'all'>('all');
  const [onlySelected, setOnlySelected] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'xlsx' | null>(null);
  const [status, setStatus] = useState('');

  /* 풀 → 그룹(트랙 또는 트랙·하위구분) → 라인 그룹핑 (필터 적용) */
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<Pool, Map<string, LineResult[]>>();
    for (const line of result.lines) {
      const it: DesignItem = line.item;
      if (poolFilter !== 'all' && it.pool !== poolFilter) continue;
      if (onlySelected && line.qty <= 0) continue;
      if (q && !`${it.name} ${it.track} ${it.subGroup ?? ''} ${it.note ?? ''}`.toLowerCase().includes(q)) continue;
      // 하위 구분(subGroup)이 있으면 "트랙 · 하위구분"으로 세분화, 없으면 트랙 그대로
      const groupKey = it.subGroup ? `${it.track} · ${it.subGroup}` : it.track;
      const byGroup = map.get(it.pool) ?? new Map<string, LineResult[]>();
      byGroup.set(groupKey, [...(byGroup.get(groupKey) ?? []), line]);
      map.set(it.pool, byGroup);
    }
    return map;
  }, [result.lines, query, poolFilter, onlySelected]);

  const selectedCount = result.lines.filter((l) => l.qty > 0).length;

  /** 실제로 항목이 존재하는 풀만 (재배치로 비게 된 풀은 필터·설정에서 숨김) */
  const activePools = useMemo(() => {
    const set = new Set<Pool>();
    result.lines.forEach((l) => set.add(l.item.pool));
    return POOL_ORDER.filter((p) => set.has(p));
  }, [result.lines]);
  const hasShared = activePools.includes('공용');

  const poolSubtotal = (pool: Pool) => {
    const ls = result.lines.filter((l) => l.item.pool === pool);
    return { res: ls.reduce((a, l) => a + l.resource, 0), cost: ls.reduce((a, l) => a + l.internalCost, 0), n: ls.filter((l) => l.qty > 0).length };
  };

  const handlePdf = async () => {
    setBusy('pdf');
    setStatus('PDF를 만드는 중…');
    try {
      await exportEstimatePdf(result);
      setStatus('PDF를 내려받았습니다.');
    } catch (e) {
      setStatus(`PDF 생성 실패: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };
  const handleExcel = async () => {
    setBusy('xlsx');
    setStatus('Excel을 만드는 중…');
    try {
      await exportEstimateExcel(master, result);
      setStatus('Excel을 내려받았습니다. (2개 탭: 통합_단가마스터 / 캐파_시뮬레이터)');
    } catch (e) {
      setStatus(`Excel 생성 실패: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const numberInput = (value: number, onChange: (n: number) => void, opts?: { step?: number; max?: number; suffix?: string }) => (
    <input
      type="number"
      min={0}
      max={opts?.max}
      step={opts?.step ?? 1}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );

  return (
    <div className="est">
      <style>{CSS}</style>
      <div className="est-wrap">
        {/* ── 헤더 ── */}
        <header className="est-head">
          <div>
            <h1>디자인 <b>견적</b> 및 리소스 산출</h1>
            <p>월 건수를 입력하면 소모 리소스(M/M)·내부 원가·외부 금액이 바로 계산됩니다.</p>
          </div>
          <div className="est-meta">
            <input aria-label="프로젝트명" value={input.title} onChange={(e) => calc.setMeta({ title: e.target.value })} placeholder="프로젝트명 (선택)" />
            <input aria-label="담당팀" value={input.client} onChange={(e) => calc.setMeta({ client: e.target.value })} placeholder="담당팀 (선택)" />
          </div>
        </header>

        {/* ── 좌: 선택 폼 ── */}
        <main>
          <div className="est-toolbar" role="group" aria-label="항목 필터">
            <input type="search" placeholder="산출물·트랙 검색" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="산출물 검색" />
            {(['all', ...activePools] as const).map((p) => (
              <button key={p} type="button" className="est-chip" aria-pressed={poolFilter === p} onClick={() => setPoolFilter(p)}>
                {p === 'all' ? '전체' : p}
              </button>
            ))}
            <button type="button" className="est-chip" aria-pressed={onlySelected} onClick={() => setOnlySelected((v) => !v)}>
              선택된 항목만 ({selectedCount})
            </button>
            <button type="button" className="est-btn" onClick={calc.clearQuantities}>
              모두 0으로
            </button>
            <button type="button" className="est-btn" onClick={calc.reset}>
              엑셀 기본값으로
            </button>
          </div>

          {grouped.size === 0 && <div className="est-card est-empty">조건에 맞는 항목이 없습니다. 검색어나 필터를 바꿔 보세요.</div>}

          {POOL_ORDER.filter((p) => grouped.has(p)).map((pool) => {
            const sub = poolSubtotal(pool);
            return (
              <details key={pool} className="est-pool" open>
                <summary>
                  <span>{POOL_TITLE[pool]}</span>
                  <small>
                    {sub.n}개 선택 · {fmtRes(sub.res)} M/M · 내부 {fmtWon(sub.cost)}원
                  </small>
                </summary>
                <div className="est-colhead" aria-hidden>
                  <div>산출물</div>
                  <div>월 건수</div>
                  <div>소모 M/M</div>
                  <div>내부 원가</div>
                  <div>외부 금액</div>
                </div>
                {[...grouped.get(pool)!.entries()].map(([track, lines]) => (
                  <React.Fragment key={track}>
                    <div className="est-track">{track}</div>
                    {lines.map((line) => (
                      <LineRow key={line.item.id} line={line} onChange={calc.setQuantity} />
                    ))}
                  </React.Fragment>
                ))}
              </details>
            );
          })}
        </main>

        {/* ── 우: 실시간 요약 ── */}
        <aside id="est-summary" className="est-side" aria-live="polite">
          <section className="est-card">
            <h2>총 투입 리소스 요약{isCalculating ? ' · 계산 중' : ''}</h2>
            <div className="est-total">
              <div>
                <div className="k">필요 리소스</div>
                <div className="v accent">
                  {fmtRes(result.total.resource)}
                  <small>M/M</small>
                </div>
              </div>
              <div>
                <div className="k">월 투입 일수</div>
                <div className="v">
                  {result.total.workingDays.toFixed(1)}
                  <small>일</small>
                </div>
              </div>
              <div>
                <div className="k">내부 원가</div>
                <div className="v">
                  {fmtWon(result.total.internalCost)}
                  <small>원</small>
                </div>
              </div>
              <div>
                <div className="k">외부 금액</div>
                <div className="v">
                  {fmtWon(result.total.externalAmount)}
                  <small>원</small>
                </div>
              </div>
            </div>
          </section>

          {SHOW_INTERNAL_PANELS && (
            <>
              <section className="est-card">
                <h2>풀별 가동률{hasShared ? ' (공용 배분 반영)' : ''}</h2>
                {result.poolLoads.map((p) => (
                  <Gauge key={p.pool} title={`${p.pool} · ${p.name}`} resource={p.resource} headcount={p.headcount} utilization={p.utilization} verdict={p.verdict} shortage={p.shortage} />
                ))}
              </section>

              <section className="est-card">
                <h2>하위 제약</h2>
                {result.subConstraints.map((sc) => (
                  <Gauge key={sc.track} title={`${sc.label} · ${sc.track}`} resource={sc.resource} headcount={sc.headcount} utilization={sc.utilization} verdict={sc.verdict} />
                ))}
              </section>

              <section className="est-card">
                <h2>인력 · 배분 설정</h2>
                <div className="est-set">
                  {hasShared && (
                    <>
                      <label>공용 → 프로덕션 배분 비율 (%)</label>
                      {numberInput(Math.round(input.sharedRatioToA * 1000) / 10, (n) => calc.setSharedRatio(n / 100), { step: 5, max: 100 })}
                    </>
                  )}
                  {master.resource.pools.map((p) => (
                    <React.Fragment key={p.pool}>
                      <label>
                        {p.pool} · {p.name} 보유 인원
                      </label>
                      {numberInput(input.poolHeadcount[p.pool], (n) => calc.setPoolHeadcount(p.pool, n))}
                    </React.Fragment>
                  ))}
                  {master.resource.subConstraints.map((sc) => (
                    <React.Fragment key={sc.track}>
                      <label>{sc.label} 가능 인원</label>
                      {numberInput(input.subHeadcount[sc.track] ?? sc.headcount, (n) => calc.setSubHeadcount(sc.track, n))}
                    </React.Fragment>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="est-card">
            <h2>내보내기</h2>
            <div className="est-actions">
              <button type="button" className="est-btn primary" disabled={busy !== null} onClick={handlePdf}>
                {busy === 'pdf' ? '생성 중…' : 'PDF 저장'}
              </button>
              <button type="button" className="est-btn" disabled={busy !== null} onClick={handleExcel}>
                {busy === 'xlsx' ? '생성 중…' : 'Excel 저장'}
              </button>
            </div>
            <div className="est-status">{status}</div>
          </section>
        </aside>
      </div>

      {/* ── 모바일 하단 요약 바 (980px 이하) ── */}
      <div className="est-mobilebar" role="region" aria-label="요약">
        <div className="nums">
          <b>
            {fmtRes(result.total.resource)} M/M · {fmtWon(result.total.externalAmount)}원
          </b>
          <span>선택 {selectedCount}건 · 외부 금액 기준</span>
        </div>
        <button type="button" className="est-btn primary" onClick={() => document.getElementById('est-summary')?.scrollIntoView({ behavior: 'smooth' })}>
          요약 보기
        </button>
      </div>
    </div>
  );
}
