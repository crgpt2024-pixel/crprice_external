/**
 * types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 첨부 엑셀(시뮬레이터_raw.xlsx) 구조를 그대로 옮긴 타입 정의.
 *
 *  - 통합_단가마스터  : 풀(B) / 트랙(C) / 산출물(E) / 1건당 소모(I) / 내부 단가(J) / 외부 단가(M)
 *  - 캐파_시뮬레이터  : 항목별 월 건수 입력(F) → 소모 리소스(G) / 내부 원가(H) / 외부 금액(I)
 *                      → 풀별 집계(85~86행) / 하위 제약(89~90행) / 요약(101~104행) / 점검(108~109행)
 */

/** 엑셀 마스터 B열 "풀" 값 */
export type Pool = 'A' | 'B' | '공용';

/**
 * 엑셀 마스터 C열 "트랙" 값.
 * 단가표 개정 때마다 트랙 명칭이 바뀔 수 있어 문자열로 둔다.
 * (현재 사용 중인 값은 아래 KNOWN_TRACKS 참고 — 자동완성용)
 */
export type Track = string;

/** 참고용: 현재 마스터에 존재하는 트랙 값 (타입 강제는 아님) */
export type KnownTrack =
  | '리터칭'
  | 'AI 이미지'
  | 'AI 영상'
  | '가로형 영상 편집 (롱폼)'
  | '세로형 영상 편집 (숏폼)'
  | '행사 스케치 영상 편집'
  | '포맷 전환 · 재편집'
  | '자막 · 인트로'
  | '사진 촬영'
  | '영상 촬영'
  | '모션'
  | '정적 디자인'
  | '브랜딩'
  | '패키지'
  | '캐릭터';

/** 통합_단가마스터 1행 (= 디자인 단가 항목) */
export interface DesignItem {
  /** 프로그램 내부 식별자 */
  id: string;
  /** 원본 마스터 시트에서의 행 번호 (5~79). Excel 내보내기 시 동일 위치에 기록 */
  masterRow: number;
  pool: Pool;
  track: Track;
  /** 산출물명 (마스터 E열, MATCH 키) */
  name: string;
  /** 1건당 소모 리소스 (M/M). 마스터 I열 */
  resourcePerUnit: number;
  /** 내부 단가 (원). 마스터 J열 */
  internalPrice: number;
  /** 외부 단가 (원, 마크업 반영). 마스터 M열 */
  externalPrice: number;
  /** 시뮬레이터 시트 F열에 기입돼 있던 기본 월 건수 */
  defaultQty: number;
  /**
   * 트랙 안에서의 하위 구분 (예: 정적 디자인 → 'PPT' | '웹·디지털' | 'SNS' | '행사·오프라인' 등).
   * UI 그룹 헤더와 PDF/Excel 정렬에 사용. 없으면 track으로 묶인다.
   */
  subGroup?: string;
  /** 비고/설명 — 작업 범위·구성 요소·난이도 기준. UI 항목 설명과 PDF/Excel 비고란에 반영. */
  note?: string;
  /** 고객 표시용 난이도 라벨 (S/A/B/C). 없으면 미표시. 외부 단가 산정에는 관여하지 않음. */
  difficulty?: 'S' | 'A' | 'B' | 'C';
  /** 등급 (M1~M5) — 외부가 배율 근거 (참고용 표시). */
  grade?: string;
  /** 베리에이션(+50%) 가능 항목 여부. true면 추가안 수량 입력 UI 노출. */
  variationAllowed?: boolean;
  /** 캐러셀 여부. true면 "추가 본문 1p = 기본가 5%" 입력 UI 노출. */
  isCarousel?: boolean;
  /** 예시 링크 (포트폴리오·레퍼런스 URL). 비면 미표시. masterData.ts에서 편집. */
  sampleLink?: string;
}

/** 시뮬레이터 85~86행: 풀(인력 풀) 정의 */
export interface ResourcePool {
  pool: Exclude<Pool, '공용'>;
  /** C열 "풀 이름" */
  name: string;
  /** 요약표(101~102행) B열 라벨 */
  summaryLabel: string;
  /** 점검표(108~109행) B열 라벨 */
  checkLabel: string;
  /** E열 "보유 인원" (명) */
  headcount: number;
}

/** 시뮬레이터 89~90행: 트랙 단위 하위 제약 */
export interface SubConstraint {
  /** B열 "하위 제약" 라벨 */
  label: string;
  /** C열 "대상 트랙" (SUMIF 키) */
  track: Track;
  /** E열 "가능 인원" (명) */
  headcount: number;
}

/** 시뮬레이터 시트에 박혀 있던 계산 상수 */
export interface CalcConstants {
  /** F82: 공용(AI·리터칭·베리에이션) 중 프로덕션(A) 풀이 소화하는 비율 */
  sharedRatioToA: number;
  /** E101~E104: 리소스 1.0 = 22 영업일 */
  workingDaysPerMonth: number;
  /** G열 판정식: 가동률 > 1 → "인력 부족" */
  shortageThreshold: number;
  /** G열 판정식: 가동률 > 0.85 → "포화 임박" */
  saturationThreshold: number;
}

/** 리소스 단가/인력 마스터 (= 인력/리소스 시트) */
export interface ResourceMaster {
  pools: ResourcePool[];
  subConstraints: SubConstraint[];
  constants: CalcConstants;
}

/** 프로그램 전체 마스터 데이터 */
export interface MasterData {
  designItems: DesignItem[];
  resource: ResourceMaster;
}

/* ───────────────────────────── 입력(State) ───────────────────────────── */

/** 사용자 입력: 항목 id → 월 건수 (시뮬레이터 F열) */
export type QuantityMap = Record<string, number>;

export interface EstimateInput {
  /** 견적 제목 / 발주사 (PDF 헤더용) */
  title: string;
  client: string;
  /** 항목별 월 건수 */
  quantities: QuantityMap;
  /** 항목별 베리에이션 추가안 수량 (기본가 ×50% × 수량). variationAllowed 항목만. */
  variations?: QuantityMap;
  /** 캐러셀 항목별 추가 본문 페이지 수 (기본가 ×5% × 페이지). isCarousel 항목만. */
  extraPages?: QuantityMap;
  /** F82 공용 배분 비율 (0~1) */
  sharedRatioToA: number;
  /** 풀별 보유 인원 (E85/E86 = D108/D109) */
  poolHeadcount: Record<Exclude<Pool, '공용'>, number>;
  /** 하위 제약 가능 인원 (E89/E90) */
  subHeadcount: Record<string, number>;
  /** 출장비·실비 옵션 (원가 그대로 가산) */
  extras?: EstimateExtras;
}

/** 출장비·AI 실비 등 추가 비용 입력 */
export interface EstimateExtras {
  /** 국내 출장 권역 키 ('' = 없음, 'metro'|'central'|'south'|'jeju') */
  domesticRegion?: string;
  /** 국내 출장 횟수 */
  domesticCount?: number;
  /** 해외 출장 권역 ('' | 'A' | 'B' | 'C') */
  overseasRegion?: string;
  /** 해외 출장 인원 */
  overseasHeadcount?: number;
  /** 해외 왕복 이동 횟수 (보통 1) */
  overseasTrips?: number;
  /** 해외 기타 실비 직접 입력 (숙박·식대·항공·장비 등, 이미 ×1.1 적용된 최종 금액) */
  overseasExpense?: number;
  /** AI 크레딧 실비 (사용액, ×1.1 자동 적용) */
  aiCredit?: number;
  /** 라이선스·장비 실비 (사용액, ×1.1 자동 적용) */
  licenseExpense?: number;
}

/* ───────────────────────────── 출력(Result) ───────────────────────────── */

/** G열 판정 문자열 */
export type Verdict = '인력 부족' | '포화 임박' | '여유';

/** 시뮬레이터 6~80행 1줄 */
export interface LineResult {
  item: DesignItem;
  /** F열 */
  qty: number;
  /** G = E × F */
  resource: number;
  /** H = F × 내부 단가 */
  internalCost: number;
  /** I = F × 외부 단가 */
  externalAmount: number;
  /** 베리에이션 추가안 수량 (variationAllowed 항목만) */
  variationQty: number;
  /** 베리에이션 추가 내부/외부 금액 = 단가 × 50% × 수량 */
  variationInternal: number;
  variationExternal: number;
  /** 캐러셀 추가 본문 페이지 수 */
  extraPageQty: number;
  /** 추가 페이지 내부/외부 금액 = 단가 × 5% × 페이지 */
  extraPageInternal: number;
  extraPageExternal: number;
  /** 옵션 포함 합계 (내부/외부) = 기본 + 베리에이션 + 추가페이지 */
  totalInternal: number;
  totalExternal: number;
}

/** 85~86행 (공용 배분 반영 풀 집계) */
export interface PoolLoad {
  pool: Exclude<Pool, '공용'>;
  name: string;
  /** D = SUMIF(풀) + SUMIF(공용) × 배분비율 */
  resource: number;
  /** E */
  headcount: number;
  /** F = IFERROR(D/E,0) */
  utilization: number;
  /** G */
  verdict: Verdict;
  /** H = SUMIF(풀, 내부원가) + SUMIF(공용, 내부원가) × 배분비율 */
  internalCost: number;
  /** G108/G109 = IF(C>D, ROUNDUP(C-D,1), 0) */
  shortage: number;
}

/** 89~90행 (하위 제약) */
export interface SubConstraintLoad {
  label: string;
  track: Track;
  /** D = SUMIF(트랙, 소모 리소스) */
  resource: number;
  headcount: number;
  utilization: number;
  verdict: Verdict;
}

/** 101~104행 (발주사 확인용 요약) */
export interface SummaryRow {
  key: Pool | '합계';
  label: string;
  /** C: 리소스 (M/M) */
  resource: number;
  /** D: 환산 인원 (= C) */
  headcountEquivalent: number;
  /** E: 월 투입 일수 (= C × 22) */
  workingDays: number;
  /** F: 내부 원가 */
  internalCost: number;
  /** G: 외부 금액 */
  externalAmount: number;
}

export interface EstimateResult {
  input: EstimateInput;
  lines: LineResult[];
  poolLoads: PoolLoad[];
  subConstraints: SubConstraintLoad[];
  summary: SummaryRow[];
  /** 요약 합계 (104행) */
  total: SummaryRow;
  /** 적용된 할인율 (0.1 = 10%) */
  discountRate: number;
  /** 할인 후 총 내부 원가 / 외부 금액 */
  discountedInternal: number;
  discountedExternal: number;
  /** 할인가 기준으로 재산출한 총 리소스 (M/M) */
  discountedResource: number;
  /** 할인가 기준 월 투입 일수 */
  discountedWorkingDays: number;
  /** 출장비·실비 계산 결과 */
  extras: ExtrasResult;
  calculatedAt: Date;
}

/** 출장비·실비 계산 결과 (원가 그대로) */
export interface ExtrasResult {
  domestic: number;
  overseasTravel: number; // 이동 인건비 + 일비 (자동)
  overseasExpense: number; // 직접 입력 실비
  aiCredit: number; // ×1.1 적용값
  licenseExpense: number; // ×1.1 적용값
  total: number;
  /** 계산 근거 라벨 (표시용) */
  lines: { label: string; amount: number }[];
}
