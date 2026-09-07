/**
 * useEstimateCalculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * RxJS 기반 실시간 계산 Custom Hook.
 *
 *  quantities$ ─┐
 *  ratio$      ─┤
 *  headcount$  ─┼─ combineLatest ─ debounceTime(150ms) ─ map(calculateEstimate) ─ distinctUntilChanged ─▶ result
 *  meta$       ─┘
 *
 *  - 각 입력 축은 BehaviorSubject 로 분리되어 있어 어떤 필드를 바꾸든 150ms 내
 *    묶어서 1회만 재계산한다.
 *  - 첫 렌더에서 결과가 비지 않도록 초기값은 동기 계산(useState 초기화)한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { calculateEstimate, createDefaultInput } from './calcEngine';
import { MASTER_DATA } from './masterData';
import type { EstimateInput, EstimateResult, MasterData, QuantityMap } from './types';

export interface UseEstimateCalculatorOptions {
  master?: MasterData;
  initialInput?: Partial<EstimateInput>;
  /** 기본 150ms */
  debounceMs?: number;
}

export interface UseEstimateCalculator {
  master: MasterData;
  input: EstimateInput;
  result: EstimateResult;
  /** 150ms 디바운스 중이면 true (UI에 "계산 중" 표시용) */
  isCalculating: boolean;

  setQuantity: (itemId: string, qty: number) => void;
  setQuantities: (patch: QuantityMap) => void;
  setSharedRatio: (ratio: number) => void;
  setPoolHeadcount: (pool: 'A' | 'B', headcount: number) => void;
  setSubHeadcount: (track: string, headcount: number) => void;
  setMeta: (patch: Partial<Pick<EstimateInput, 'title' | 'client'>>) => void;
  /** 모든 월 건수를 0으로 */
  clearQuantities: () => void;
  /** 엑셀 원본 값으로 되돌리기 */
  reset: () => void;
}

type MetaState = Pick<EstimateInput, 'title' | 'client'>;
type HeadcountState = Pick<EstimateInput, 'poolHeadcount' | 'subHeadcount'>;

export function useEstimateCalculator(options: UseEstimateCalculatorOptions = {}): UseEstimateCalculator {
  const master = options.master ?? MASTER_DATA;
  const debounceMs = options.debounceMs ?? 150;

  /* 초기 입력 (엑셀 원본 값 + 옵션 오버라이드) */
  const initial = useMemo<EstimateInput>(
    () => ({ ...createDefaultInput(master), ...options.initialInput }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [master],
  );

  /* ── BehaviorSubject 스트림 (컴포넌트 수명 동안 1개씩만 생성) ── */
  const quantities$ = useRef(new BehaviorSubject<QuantityMap>(initial.quantities)).current;
  const ratio$ = useRef(new BehaviorSubject<number>(initial.sharedRatioToA)).current;
  const headcount$ = useRef(
    new BehaviorSubject<HeadcountState>({
      poolHeadcount: initial.poolHeadcount,
      subHeadcount: initial.subHeadcount,
    }),
  ).current;
  const meta$ = useRef(new BehaviorSubject<MetaState>({ title: initial.title, client: initial.client })).current;

  /* React 상태 (렌더 트리거) */
  const [input, setInput] = useState<EstimateInput>(initial);
  const [result, setResult] = useState<EstimateResult>(() => calculateEstimate(master, initial));
  const [isCalculating, setIsCalculating] = useState(false);

  /* ── 파이프라인 ── */
  useEffect(() => {
    const merged$ = combineLatest([quantities$, ratio$, headcount$, meta$]).pipe(
      map(([quantities, sharedRatioToA, hc, meta]): EstimateInput => ({
        title: meta.title,
        client: meta.client,
        quantities,
        sharedRatioToA,
        poolHeadcount: hc.poolHeadcount,
        subHeadcount: hc.subHeadcount,
      })),
    );

    // 입력 변화 즉시 반영 (폼 컨트롤은 지연 없이 갱신)
    const inputSub = merged$.subscribe((next) => {
      setInput(next);
      setIsCalculating(true);
    });

    // 150ms 디바운스 후 계산
    const resultSub = merged$
      .pipe(
        debounceTime(debounceMs),
        map((next) => calculateEstimate(master, next)),
        distinctUntilChanged(
          (a, b) =>
            a.total.resource === b.total.resource &&
            a.total.internalCost === b.total.internalCost &&
            a.total.externalAmount === b.total.externalAmount &&
            a.input === b.input,
        ),
      )
      .subscribe((res) => {
        setResult(res);
        setIsCalculating(false);
      });

    return () => {
      inputSub.unsubscribe();
      resultSub.unsubscribe();
    };
  }, [master, debounceMs, quantities$, ratio$, headcount$, meta$]);

  /* ── 액션 ── */
  const setQuantity = useCallback(
    (itemId: string, qty: number) => {
      const safe = Number.isFinite(qty) && qty >= 0 ? qty : 0;
      quantities$.next({ ...quantities$.value, [itemId]: safe });
    },
    [quantities$],
  );

  const setQuantities = useCallback(
    (patch: QuantityMap) => quantities$.next({ ...quantities$.value, ...patch }),
    [quantities$],
  );

  const setSharedRatio = useCallback(
    (ratio: number) => ratio$.next(Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0))),
    [ratio$],
  );

  const setPoolHeadcount = useCallback(
    (pool: 'A' | 'B', headcount: number) =>
      headcount$.next({
        ...headcount$.value,
        poolHeadcount: { ...headcount$.value.poolHeadcount, [pool]: Math.max(0, headcount || 0) },
      }),
    [headcount$],
  );

  const setSubHeadcount = useCallback(
    (track: string, headcount: number) =>
      headcount$.next({
        ...headcount$.value,
        subHeadcount: { ...headcount$.value.subHeadcount, [track]: Math.max(0, headcount || 0) },
      }),
    [headcount$],
  );

  const setMeta = useCallback((patch: Partial<MetaState>) => meta$.next({ ...meta$.value, ...patch }), [meta$]);

  const clearQuantities = useCallback(() => {
    const zero: QuantityMap = {};
    master.designItems.forEach((it) => (zero[it.id] = 0));
    quantities$.next(zero);
  }, [master, quantities$]);

  const reset = useCallback(() => {
    quantities$.next(initial.quantities);
    ratio$.next(initial.sharedRatioToA);
    headcount$.next({ poolHeadcount: initial.poolHeadcount, subHeadcount: initial.subHeadcount });
    meta$.next({ title: initial.title, client: initial.client });
  }, [initial, quantities$, ratio$, headcount$, meta$]);

  return {
    master,
    input,
    result,
    isCalculating,
    setQuantity,
    setQuantities,
    setSharedRatio,
    setPoolHeadcount,
    setSubHeadcount,
    setMeta,
    clearQuantities,
    reset,
  };
}
