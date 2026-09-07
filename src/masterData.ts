/**
 * masterData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CR팀 4분기 단가체계(CR팀_4분기_단가체계_0907.xlsx, 2026-10-01 적용) 반영.
 *
 *  ▸ DESIGN_ITEMS      : 통합_단가마스터 72개 항목 — 계산된 값(내부/외부 단가, 1건당 소모)을 그대로 옮김
 *                        · 신규 1인 리소스 단가 7,160,000원 기준
 *                        · 트랙 체계 개편(가로형 롱폼 / 세로형 숏폼 / 자막·인트로 / 포맷 전환·재편집 등)
 *  ▸ RESOURCE_MASTER   : 기준 시트 ④ 인력 구조 — A·프로덕션 10명 / B·디자인 14명,
 *                        하위 제약(사진 3명·모션 3명), 공용 배분 비율, 22영업일, 판정 임계값
 *
 *  소모·원가 계산 로직은 기존과 동일하며, 항목 명칭·금액·트랙만 최신화했습니다.
 */
import type { DesignItem, MasterData, ResourceMaster } from './types';

export const DESIGN_ITEMS: DesignItem[] = [
  { id: "item_001", masterRow: 6, pool: "A", track: "AI 영상", name: "AI 영상 (상) 1분 인물·상품 합성", resourcePerUnit: 0.5, internalPrice: 3580000, externalPrice: 5000000, defaultQty: 1 },
  { id: "item_002", masterRow: 7, pool: "A", track: "AI 영상", name: "AI 영상 (중) 30초~1분 단일 소재", resourcePerUnit: 0.125, internalPrice: 900000, externalPrice: 1200000, defaultQty: 1 },
  { id: "item_003", masterRow: 8, pool: "A", track: "AI 영상", name: "AI 영상 (하) 15초 단순 무빙", resourcePerUnit: 0.05, internalPrice: 360000, externalPrice: 500000, defaultQty: 1 },
  { id: "item_004", masterRow: 9, pool: "B", track: "AI 이미지", name: "AI 이미지 (생성+편집, 1컷)", resourcePerUnit: 0.04504504504504505, internalPrice: 330000, externalPrice: 600000, defaultQty: 1 },
  { id: "item_005", masterRow: 10, pool: "B", track: "AI 이미지", name: "AI 이미지 (생성만, 1컷)", resourcePerUnit: 0.02, internalPrice: 144000, externalPrice: 260000, defaultQty: 1 },
  { id: "item_006", masterRow: 11, pool: "A", track: "리터칭", name: "리터칭 (1장)", resourcePerUnit: 0.013966480446927375, internalPrice: 100000, externalPrice: 120000, defaultQty: 1 },
  { id: "item_007", masterRow: 12, pool: "A", track: "리터칭", name: "심화 보정 (포토샵)", resourcePerUnit: 0.014804469273743017, internalPrice: 106000, externalPrice: 120000, defaultQty: 1 },
  { id: "item_008", masterRow: 13, pool: "A", track: "영상 촬영", name: "촬영 스탭 1인 추가", resourcePerUnit: 0.0558659217877095, internalPrice: 400000, externalPrice: 520000, defaultQty: 1 },
  { id: "item_009", masterRow: 14, pool: "A", track: "사진 촬영", name: "인물 사진 촬영 (반일)", resourcePerUnit: 0.09090909090909091, internalPrice: 660000, externalPrice: 860000, defaultQty: 1 },
  { id: "item_010", masterRow: 15, pool: "A", track: "사진 촬영", name: "제품 사진 촬영 (1회)", resourcePerUnit: 0.08333333333333333, internalPrice: 600000, externalPrice: 780000, defaultQty: 1 },
  { id: "item_011", masterRow: 16, pool: "A", track: "사진 촬영", name: "제품 사진 추가 A컷", resourcePerUnit: 0.02793296089385475, internalPrice: 200000, externalPrice: 260000, defaultQty: 1 },
  { id: "item_012", masterRow: 17, pool: "A", track: "사진 촬영", name: "제품 사진 추가 B컷", resourcePerUnit: 0.013966480446927375, internalPrice: 100000, externalPrice: 130000, defaultQty: 1 },
  { id: "item_013", masterRow: 18, pool: "A", track: "사진 촬영", name: "행사 스케치 사진 (반일)", resourcePerUnit: 0.08333333333333333, internalPrice: 600000, externalPrice: 780000, defaultQty: 1 },
  { id: "item_014", masterRow: 19, pool: "A", track: "사진 촬영", name: "행사 스케치 사진 (종일)", resourcePerUnit: 0.16666666666666666, internalPrice: 1200000, externalPrice: 1500000, defaultQty: 1 },
  { id: "item_015", masterRow: 20, pool: "A", track: "가로형 영상 편집 (롱폼)", name: "가로형 영상 편집 (1~3분)", resourcePerUnit: 0.14804469273743018, internalPrice: 1060000, externalPrice: 1400000, defaultQty: 1 },
  { id: "item_016", masterRow: 21, pool: "A", track: "가로형 영상 편집 (롱폼)", name: "가로형 영상 편집 (3~5분)", resourcePerUnit: 0.2946927374301676, internalPrice: 2110000, externalPrice: 2900000, defaultQty: 1 },
  { id: "item_017", masterRow: 22, pool: "A", track: "가로형 영상 편집 (롱폼)", name: "가로형 영상 편집 (5~10분)", resourcePerUnit: 0.441340782122905, internalPrice: 3160000, externalPrice: 4400000, defaultQty: 1 },
  { id: "item_018", masterRow: 23, pool: "A", track: "세로형 영상 편집 (숏폼)", name: "세로형 영상 편집 (1분)", resourcePerUnit: 0.06983240223463687, internalPrice: 500000, externalPrice: 650000, defaultQty: 1 },
  { id: "item_019", masterRow: 24, pool: "A", track: "세로형 영상 편집 (숏폼)", name: "세로형 영상 편집 (2분)", resourcePerUnit: 0.09776536312849163, internalPrice: 700000, externalPrice: 900000, defaultQty: 1 },
  { id: "item_020", masterRow: 25, pool: "A", track: "세로형 영상 편집 (숏폼)", name: "세로형 영상 편집 (3분)", resourcePerUnit: 0.13966480446927373, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1 },
  { id: "item_021", masterRow: 26, pool: "A", track: "행사 스케치 영상 편집", name: "행사 스케치 영상 편집 (1분 이내)", resourcePerUnit: 0.06983240223463687, internalPrice: 500000, externalPrice: 650000, defaultQty: 1 },
  { id: "item_022", masterRow: 27, pool: "A", track: "행사 스케치 영상 편집", name: "행사 스케치 영상 편집 (2분 이내)", resourcePerUnit: 0.09776536312849163, internalPrice: 700000, externalPrice: 910000, defaultQty: 1 },
  { id: "item_023", masterRow: 28, pool: "A", track: "행사 스케치 영상 편집", name: "행사 스케치 영상 편집 (5분 이내)", resourcePerUnit: 0.13966480446927373, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1 },
  { id: "item_024", masterRow: 29, pool: "A", track: "포맷 전환 · 재편집", name: "가로형 → 세로형 단순 재편집", resourcePerUnit: 0.02793296089385475, internalPrice: 200000, externalPrice: 260000, defaultQty: 1 },
  { id: "item_025", masterRow: 30, pool: "A", track: "자막 · 인트로", name: "인트로·자막 (1분 이내)", resourcePerUnit: 0.02793296089385475, internalPrice: 200000, externalPrice: 260000, defaultQty: 1 },
  { id: "item_026", masterRow: 31, pool: "A", track: "자막 · 인트로", name: "인트로·자막 (3~5분)", resourcePerUnit: 0.09776536312849163, internalPrice: 700000, externalPrice: 900000, defaultQty: 1 },
  { id: "item_027", masterRow: 32, pool: "B", track: "정적 디자인", name: "PPT 본문 (그래프, 장당)", resourcePerUnit: 0.018156424581005585, internalPrice: 130000, externalPrice: 150000, defaultQty: 1 , subGroup: "PPT", note: "기존 PPT 템플릿 내 데이터를 차트·다이어그램으로 시각화 (기본 디자인 적용, 장당)." },
  { id: "item_028", masterRow: 33, pool: "B", track: "정적 디자인", name: "PPT 본문 (인포그래픽, 장당)", resourcePerUnit: 0.02094972067039106, internalPrice: 150000, externalPrice: 190000, defaultQty: 1 , subGroup: "PPT", note: "기존 PPT 템플릿 내 텍스트·표를 다이어그램·인포그래픽으로 시각화 (기본 디자인 적용, 장당). 슬라이드 단위 과금." },
  { id: "item_029", masterRow: 34, pool: "B", track: "정적 디자인", name: "PPT 본문 (텍스트, 장당)", resourcePerUnit: 0.013966480446927375, internalPrice: 100000, externalPrice: 120000, defaultQty: 1 , subGroup: "PPT", note: "기존 PPT 템플릿 내 텍스트·표 정돈 및 기본 레이아웃 (다이어그램화 미포함)." },
  { id: "item_030", masterRow: 35, pool: "B", track: "정적 디자인", name: "PPT 템플릿 디자인", resourcePerUnit: 0.06983240223463687, internalPrice: 500000, externalPrice: 700000, defaultQty: 1 , subGroup: "PPT" },
  { id: "item_031", masterRow: 36, pool: "A", track: "모션", name: "SNS 피드 + 모션", resourcePerUnit: 0.08659217877094971, internalPrice: 620000, externalPrice: 870000, defaultQty: 1 },
  { id: "item_032", masterRow: 37, pool: "B", track: "정적 디자인", name: "SNS 피드 이미지", resourcePerUnit: 0.047619047619047616, internalPrice: 350000, externalPrice: 420000, defaultQty: 1 , subGroup: "SNS" },
  { id: "item_033", masterRow: 38, pool: "A", track: "모션", name: "모션 기본 씬 (씬당)", resourcePerUnit: 0.02094972067039106, internalPrice: 150000, externalPrice: 200000, defaultQty: 1 },
  { id: "item_034", masterRow: 39, pool: "A", track: "모션", name: "모션 배경 메인 모델링 (배경당)", resourcePerUnit: 0.06983240223463687, internalPrice: 500000, externalPrice: 700000, defaultQty: 1 },
  { id: "item_035", masterRow: 40, pool: "A", track: "모션", name: "모션 배경 모델링 씬 (씬당)", resourcePerUnit: 0.06983240223463687, internalPrice: 500000, externalPrice: 700000, defaultQty: 1 },
  { id: "item_036", masterRow: 41, pool: "A", track: "모션", name: "모션 제품 3D 모델링 (제품당)", resourcePerUnit: 0.04189944134078212, internalPrice: 300000, externalPrice: 420000, defaultQty: 1 },
  { id: "item_037", masterRow: 42, pool: "B", track: "정적 디자인", name: "배너·현수막", resourcePerUnit: 0.014804469273743017, internalPrice: 106000, externalPrice: 120000, defaultQty: 1 , subGroup: "인쇄·편집" },
  { id: "item_038", masterRow: 43, pool: "B", track: "브랜딩", name: "브랜드 가이드라인 개발", resourcePerUnit: 0.9090909090909091, internalPrice: 6510000, externalPrice: 9100000, defaultQty: 1 },
  { id: "item_039", masterRow: 44, pool: "B", track: "브랜딩", name: "브랜드 아이덴티티 (라이트)", resourcePerUnit: 0.6816632583503749, internalPrice: 4890000, externalPrice: 6800000, defaultQty: 1 },
  { id: "item_040", masterRow: 45, pool: "B", track: "브랜딩", name: "브랜드 아이덴티티 (베이직)", resourcePerUnit: 1.8181818181818181, internalPrice: 13100000, externalPrice: 18300000, defaultQty: 1 },
  { id: "item_041", masterRow: 46, pool: "B", track: "브랜딩", name: "브랜드 아이덴티티 (풀)", resourcePerUnit: 3.003003003003003, internalPrice: 21600000, externalPrice: 30200000, defaultQty: 1 },
  { id: "item_042", masterRow: 47, pool: "B", track: "브랜딩", name: "브랜드 어플리케이션 (기본 5종)", resourcePerUnit: 1.1363636363636365, internalPrice: 8140000, externalPrice: 11300000, defaultQty: 1 },
  { id: "item_043", masterRow: 48, pool: "B", track: "브랜딩", name: "브랜드 어플리케이션 (확장 10종↑)", resourcePerUnit: 2.7247956403269757, internalPrice: 19600000, externalPrice: 27400000, defaultQty: 1 },
  { id: "item_044", masterRow: 49, pool: "B", track: "정적 디자인", name: "브랜딩 디자인 (단품)", resourcePerUnit: 0.3333333333333333, internalPrice: 2390000, externalPrice: 3300000, defaultQty: 1 , subGroup: "행사·오프라인" },
  { id: "item_045", masterRow: 50, pool: "B", track: "정적 디자인", name: "상품상세페이지", resourcePerUnit: 0.06005586592178771, internalPrice: 430000, externalPrice: 560000, defaultQty: 1 , subGroup: "웹·디지털" },
  { id: "item_046", masterRow: 51, pool: "B", track: "정적 디자인", name: "온라인 포스터", resourcePerUnit: 0.051675977653631286, internalPrice: 370000, externalPrice: 490000, defaultQty: 1 , subGroup: "웹·디지털" },
  { id: "item_047", masterRow: 52, pool: "B", track: "정적 디자인", name: "웹페이지 디자인 (페이지당)", resourcePerUnit: 0.0681663258350375, internalPrice: 490000, externalPrice: 690000, defaultQty: 1 , subGroup: "웹·디지털" },
  { id: "item_048", masterRow: 53, pool: "B", track: "정적 디자인", name: "이메일 디자인", resourcePerUnit: 0.03631284916201117, internalPrice: 260000, externalPrice: 320000, defaultQty: 1 , subGroup: "웹·디지털" },
  { id: "item_049", masterRow: 54, pool: "B", track: "정적 디자인", name: "인포그래픽 (단순, 1장)", resourcePerUnit: 0.02653631284916201, internalPrice: 190000, externalPrice: 250000, defaultQty: 1 , subGroup: "인포그래픽", note: "반영 원고 제공 기준. 차트·도표 3개 이하, 기본 아이콘 활용, 1페이지 완결형." },
  { id: "item_050", masterRow: 55, pool: "B", track: "정적 디자인", name: "인포그래픽 (복잡)", resourcePerUnit: 0.05307262569832402, internalPrice: 380000, externalPrice: 500000, defaultQty: 1 , subGroup: "인포그래픽", note: "원문 요약·기획 포함 OR 차트·도표 4개 이상 OR 커스텀 일러스트·지도·3D 그래픽 포함, 1페이지 완결형." },
  { id: "item_051", masterRow: 56, pool: "B", track: "정적 디자인", name: "일러스트 (단순 드로잉)", resourcePerUnit: 0.02653631284916201, internalPrice: 190000, externalPrice: 250000, defaultQty: 1 , subGroup: "일러스트" },
  { id: "item_052", masterRow: 57, pool: "B", track: "정적 디자인", name: "일러스트 (캐릭터 드로잉)", resourcePerUnit: 0.05307262569832402, internalPrice: 380000, externalPrice: 500000, defaultQty: 1 , subGroup: "일러스트" },
  { id: "item_053", masterRow: 58, pool: "B", track: "정적 디자인", name: "책자 디자인 (장당)", resourcePerUnit: 0.013966480446927375, internalPrice: 100000, externalPrice: 120000, defaultQty: 1 , subGroup: "인쇄·편집" },
  { id: "item_054", masterRow: 59, pool: "B", track: "정적 디자인", name: "초청장", resourcePerUnit: 0.03770949720670391, internalPrice: 270000, externalPrice: 330000, defaultQty: 1 , subGroup: "인쇄·편집" },
  { id: "item_055", masterRow: 60, pool: "B", track: "캐릭터", name: "캐릭터 3D 모델링·렌더링", resourcePerUnit: 0.5586592178770949, internalPrice: 4000000, externalPrice: 5600000, defaultQty: 1 },
  { id: "item_056", masterRow: 61, pool: "B", track: "캐릭터", name: "캐릭터 리뉴얼·디벨롭", resourcePerUnit: 0.48882681564245806, internalPrice: 3500000, externalPrice: 4900000, defaultQty: 1 },
  { id: "item_057", masterRow: 62, pool: "B", track: "캐릭터", name: "캐릭터 브랜드 가이드북", resourcePerUnit: 0.20949720670391062, internalPrice: 1500000, externalPrice: 2100000, defaultQty: 1 },
  { id: "item_058", masterRow: 63, pool: "B", track: "캐릭터", name: "캐릭터 신규 개발 (기본 패키지)", resourcePerUnit: 0.6983240223463687, internalPrice: 5000000, externalPrice: 7000000, defaultQty: 1 },
  { id: "item_059", masterRow: 64, pool: "B", track: "캐릭터", name: "캐릭터 응용 베리에이션 (2D, 5종)", resourcePerUnit: 0.20949720670391062, internalPrice: 1500000, externalPrice: 1900000, defaultQty: 1 },
  { id: "item_060", masterRow: 65, pool: "B", track: "캐릭터", name: "캐릭터 응용 베리에이션 (2D, 건당)", resourcePerUnit: 0.04189944134078212, internalPrice: 300000, externalPrice: 390000, defaultQty: 1 },
  { id: "item_061", masterRow: 66, pool: "B", track: "정적 디자인", name: "팜플렛 디자인 (장당)", resourcePerUnit: 0.013966480446927375, internalPrice: 100000, externalPrice: 120000, defaultQty: 1 , subGroup: "인쇄·편집" },
  { id: "item_062", masterRow: 67, pool: "B", track: "패키지", name: "패키지 디자인 (기존 브랜드)", resourcePerUnit: 0.41899441340782123, internalPrice: 3000000, externalPrice: 4200000, defaultQty: 1 },
  { id: "item_063", masterRow: 68, pool: "B", track: "패키지", name: "패키지 디자인 (신규 브랜드)", resourcePerUnit: 0.6983240223463687, internalPrice: 5000000, externalPrice: 7000000, defaultQty: 1 },
  { id: "item_064", masterRow: 69, pool: "B", track: "패키지", name: "패키지 디자인 (템플릿 변형)", resourcePerUnit: 0.13966480446927373, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1 },
  { id: "item_065", masterRow: 70, pool: "B", track: "패키지", name: "패키지 추가 SKU (단순)", resourcePerUnit: 0.02793296089385475, internalPrice: 200000, externalPrice: 260000, defaultQty: 1 },
  { id: "item_066", masterRow: 71, pool: "B", track: "패키지", name: "패키지 추가 SKU (복합)", resourcePerUnit: 0.06983240223463687, internalPrice: 500000, externalPrice: 650000, defaultQty: 1 },
  { id: "item_067", masterRow: 72, pool: "B", track: "패키지", name: "패키지 칼선·지기구 개발", resourcePerUnit: 0.04189944134078212, internalPrice: 300000, externalPrice: 390000, defaultQty: 1 },
  { id: "item_068", masterRow: 73, pool: "B", track: "정적 디자인", name: "포디움", resourcePerUnit: 0.014804469273743017, internalPrice: 106000, externalPrice: 120000, defaultQty: 1 , subGroup: "행사·오프라인" },
  { id: "item_069", masterRow: 74, pool: "B", track: "정적 디자인", name: "포스터 (시안 1종)", resourcePerUnit: 0.06284916201117319, internalPrice: 450000, externalPrice: 590000, defaultQty: 1 , subGroup: "행사·오프라인" },
  { id: "item_070", masterRow: 75, pool: "B", track: "정적 디자인", name: "포스터·광고 (기획+시안 3종)", resourcePerUnit: 0.14285714285714285, internalPrice: 1030000, externalPrice: 1300000, defaultQty: 1 , subGroup: "행사·오프라인" },
  { id: "item_071", masterRow: 76, pool: "B", track: "정적 디자인", name: "행사 키비주얼", resourcePerUnit: 0.06005586592178771, internalPrice: 430000, externalPrice: 560000, defaultQty: 1 , subGroup: "행사·오프라인" },
  { id: "item_072", masterRow: 77, pool: "B", track: "정적 디자인", name: "행사·영상 타이틀", resourcePerUnit: 0.048882681564245814, internalPrice: 350000, externalPrice: 460000, defaultQty: 1 , subGroup: "행사·오프라인" },
];

export const RESOURCE_MASTER: ResourceMaster = {
  pools: [
    { pool: 'A', name: '프로덕션', summaryLabel: 'A · 프로덕션 (촬영·편집·모션·AI영상·리터칭)', checkLabel: 'A · 프로덕션', headcount: 10 },
    { pool: 'B', name: '디자인',   summaryLabel: 'B · 디자인 (정적·브랜딩·패키지·캐릭터·AI이미지)', checkLabel: 'B · 디자인',   headcount: 14 },
  ],
  subConstraints: [
    { label: '사진', track: '사진 촬영', headcount: 3 },
    { label: '모션', track: '모션',      headcount: 3 },
  ],
  constants: {
    sharedRatioToA: 0.3,          // 공용(AI·리터칭) 중 프로덕션 풀 배분 비율
    workingDaysPerMonth: 22,      // 리소스 1.0 = 22영업일
    shortageThreshold: 1,         // IF(F>1,"인력 부족", …)
    saturationThreshold: 0.85,    // IF(F>0.85,"포화 임박","여유")
  },
};

/** 요약표 공용 라벨 */
export const SHARED_SUMMARY_LABEL = '공용 (AI·리터칭)';

export const MASTER_DATA: MasterData = {
  designItems: DESIGN_ITEMS,
  resource: RESOURCE_MASTER,
};

/** 트랙 → 풀 매핑 (UI 그룹핑용, 마스터에서 파생) */
export const TRACKS_BY_POOL = DESIGN_ITEMS.reduce<Record<string, string[]>>((acc, it) => {
  const list = (acc[it.pool] ??= []);
  if (!list.includes(it.track)) list.push(it.track);
  return acc;
}, {});

/** 산출 근거 문구 (PDF/Excel 각주에 재사용) */
export const CALC_NOTES: string[] = [
  '리소스 1.0 M/M = 1인이 한 달(22영업일)간 전담 투입되는 양입니다.',
  '항목별 소모 = 월 건수 × 1건당 소모(M/M). 1건당 소모는 해당 항목의 월 산출 개수에서 역산됩니다.',
  '내부 원가 = 월 건수 × 내부 단가 / 외부 금액 = 월 건수 × 외부 단가(등급별 마크업 반영).',
  '가동률 85%를 실무 상한으로 봅니다. 수정 대응·미팅·재작업 버퍼가 필요합니다.',
];

export const SIMULATOR_NOTES: string[] = [
  '※ 본 단가는 CR팀 4분기 단가체계(2026-10-01 적용) 기준입니다.',
  '※ 캐릭터 3D는 트랙이 「캐릭터」라 모션 인력 제약(3명)에 포함되지 않습니다.',
  '※ 풀·트랙 열은 마스터에서 자동 조회합니다.',
];
