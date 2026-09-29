/**
 * masterData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CR팀 단가체계 2026-09-29 보완 (단가체계_0929_보완.xlsx) 반영.
 *  · 91개 항목 (제품사진 반일/종일 분리, 책자 표지·리플렛·부스 1/2/4ea·캐러셀 C 추가)
 *  · 할인 10%는 리소스(M/M) 산출에만 적용, 금액은 정가.
 *  · 예시 링크: sampleLink 편집.
 */
import type { DesignItem, MasterData, ResourceMaster } from './types';

/** 견적 할인율 (리소스 산출 기준). 0.1 = 10% 고정. */
export const DISCOUNT_RATE = 0.1;

/** 국내 출장 권역별 출장비 (원가, 1회 기준) */
export const DOMESTIC_TRAVEL = [
  { key: 'seoul', label: '서울권', amount: 100000 },
  { key: 'metro', label: '수도권', amount: 250000 },
  { key: 'central', label: '중부권', amount: 350000 },
  { key: 'south', label: '남부권', amount: 560000 },
  { key: 'jeju', label: '제주·도서', amount: 700000 },
] as const;

/** 해외 출장 권역 (편도 이동일·왕복 이동비·일비, 원가) */
export const OVERSEAS_TRAVEL = [
  { key: 'A', label: 'A · 아시아 근거리 (일·중·대만·동남아)', roundTripLabor: 330000, perDiem: 100000, moveDays: 2 },
  { key: 'B', label: 'B · 장거리/중동/오세아니아 (인도·UAE·호주)', roundTripLabor: 660000, perDiem: 150000, moveDays: 2 },
  { key: 'C', label: 'C · 미주/유럽/아프리카/남미', roundTripLabor: 990000, perDiem: 150000, moveDays: 3 },
] as const;

/** 실비 마크업 (AI 크레딧·라이선스·장비) */
export const EXPENSE_MARKUP = 1.1;

/** 난이도 등급(S/A/B/C) 설명 — 우상단 안내용 (출장비 시트 기준) */
export const GRADE_GUIDE = [
  { grade: 'S', desc: '아예 없는 구조를 새롭게 창작하거나 최고 수준의 아트웍이 요구되는 작업. 기획·메인 콘셉트 도출, 복잡한 3D/일러스트 연출 포함. 작업 기간이 길고 소통·수정 리소스가 가장 많이 소요.' },
  { grade: 'A', desc: '기존 키비주얼·기획안을 바탕으로 고도의 디자인 기량이 필요한 변형 작업. 레이아웃을 크게 변형하거나 복잡한 2D/3D 요소 재배치, 맞춤형 그래픽 제작.' },
  { grade: 'B', desc: '정립된 가이드라인·템플릿에 맞춰 표준적으로 진행되는 실무 작업. 기존 레이아웃 유지, 텍스트·제품 컷·배경 정도를 정돈·배치. 리소스 예측 가능·작업 속도 빠름.' },
  { grade: 'C', desc: '디자인적 재창작 없이 규격 변경·오타·텍스트 단순 수정. 원본 파일에서 레이아웃·사이즈 단순 변경만. 베리에이션 50% 단가 적용의 기본 기준(최저 난이도).' },
] as const;

export const DESIGN_ITEMS: DesignItem[] = [
  { id: "item_001", masterRow: 2, pool: "A", track: "모션", name: "SNS 피드 + 모션", resourcePerUnit: 0.08659, internalPrice: 620000, externalPrice: 870000, defaultQty: 1, note: "단건 피드에 2D 모션 효과 적용", grade: "M3", sampleLink: "" },
  { id: "item_002", masterRow: 3, pool: "A", track: "모션", name: "모션 기본 씬 (씬당)", resourcePerUnit: 0.02095, internalPrice: 150000, externalPrice: 200000, defaultQty: 1, note: "2D 그래픽 기반 씬당 단가", grade: "M2", sampleLink: "" },
  { id: "item_003", masterRow: 4, pool: "A", track: "모션", name: "모션 배경 메인 모델링 (배경당)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 700000, defaultQty: 1, note: "메인 3D 배경 에셋 모델링 (배경당)", grade: "M3", sampleLink: "" },
  { id: "item_004", masterRow: 5, pool: "A", track: "모션", name: "모션 배경 모델링 씬 (씬당)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 700000, defaultQty: 1, note: "3D 배경 공간 모델링이 포함된 씬당 단가", grade: "M3", sampleLink: "" },
  { id: "item_005", masterRow: 6, pool: "A", track: "모션", name: "모션 제품 3D 모델링 (제품당)", resourcePerUnit: 0.0419, internalPrice: 300000, externalPrice: 420000, defaultQty: 1, note: "3D 제품 에셋 모델링 및 텍스처링 (제품당)", grade: "M3", sampleLink: "" },
  { id: "item_006", masterRow: 7, pool: "A", track: "사진 촬영", name: "인물 사진 촬영 (반일)", resourcePerUnit: 0.09218, internalPrice: 660000, externalPrice: 860000, defaultQty: 1, note: "4시간·인원 1명·A컷 5장 보정 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_007", masterRow: 8, pool: "A", track: "사진 촬영", name: "인물 사진 촬영 (종일)", resourcePerUnit: 0.13966, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1, note: "8시간·인원 1명·A컷 10장 보정 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_008", masterRow: 9, pool: "A", track: "사진 촬영", name: "제품 사진 촬영 (반일)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 650000, defaultQty: 1, note: "4시간·기본 연출·인원 1명·A컷 3장 보정 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_009", masterRow: 10, pool: "A", track: "사진 촬영", name: "제품 사진 촬영 (종일)", resourcePerUnit: 0.0838, internalPrice: 600000, externalPrice: 780000, defaultQty: 1, note: "8시간·기본 연출·인원 1명·A컷 3장 보정 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_010", masterRow: 11, pool: "A", track: "사진 촬영", name: "제품 사진 추가 A컷", resourcePerUnit: 0.02793, internalPrice: 200000, externalPrice: 260000, defaultQty: 1, note: "정밀 보정 포함 장당 단가", grade: "M2", sampleLink: "" },
  { id: "item_011", masterRow: 12, pool: "A", track: "사진 촬영", name: "제품 사진 추가 B컷", resourcePerUnit: 0.01397, internalPrice: 100000, externalPrice: 130000, defaultQty: 1, note: "기본 톤보정 장당 단가", grade: "M2", sampleLink: "" },
  { id: "item_012", masterRow: 13, pool: "A", track: "사진 촬영", name: "행사 스케치 사진 (반일)", resourcePerUnit: 0.0838, internalPrice: 600000, externalPrice: 780000, defaultQty: 1, note: "4시간·인원 1명·베스트컷 30장 톤보정 · 서울권 현장 기준. 지방·해외는 [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_013", masterRow: 14, pool: "A", track: "사진 촬영", name: "행사 스케치 사진 (종일)", resourcePerUnit: 0.1676, internalPrice: 1200000, externalPrice: 1600000, defaultQty: 1, note: "8시간·인원 1명·베스트컷 60장 톤보정 · 서울권 현장 기준. 지방·해외는 [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_014", masterRow: 15, pool: "A", track: "영상 촬영", name: "영상 촬영 (상)", resourcePerUnit: 0.19553, internalPrice: 1400000, externalPrice: 1800000, defaultQty: 1, note: "카메라 3대+·인원 3명(감독·촬영·조명)·조명 2대+ · 종일 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_015", masterRow: 16, pool: "A", track: "영상 촬영", name: "영상 촬영 (중)", resourcePerUnit: 0.11173, internalPrice: 800000, externalPrice: 1000000, defaultQty: 1, note: "카메라 2대·인원 2명(촬영·조명)·조명 2대 · 반일~종일 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_016", masterRow: 17, pool: "A", track: "영상 촬영", name: "영상 촬영 (하)", resourcePerUnit: 0.06704, internalPrice: 480000, externalPrice: 620000, defaultQty: 1, note: "카메라 1대·인원 1명·5시간 이하 · 자사 스튜디오/실내 기준(이동 미포함). [출장비] 별도", grade: "M2", sampleLink: "" },
  { id: "item_017", masterRow: 18, pool: "A", track: "영상 촬영", name: "드론 촬영", resourcePerUnit: 0.09777, internalPrice: 700000, externalPrice: 910000, defaultQty: 1, note: "8시간·인원 1명· 서울권 현장 기준", grade: "M2", sampleLink: "" },
  { id: "item_018", masterRow: 19, pool: "A", track: "영상 촬영", name: "촬영 스탭 1인 추가", resourcePerUnit: 0.05587, internalPrice: 400000, externalPrice: 520000, defaultQty: 1, note: "촬영 보조 스탭 1인 1일 기준 · 영상 촬영 기본 인원 초과 시 가산", grade: "M2", sampleLink: "" },
  { id: "item_019", masterRow: 20, pool: "A", track: "영상 편집 (롱폼)", name: "가로형 영상 편집 (1~3분)", resourcePerUnit: 0.14804, internalPrice: 1060000, externalPrice: 1400000, defaultQty: 1, note: "1~3분 러닝타임 기준 편집", grade: "M2", sampleLink: "" },
  { id: "item_020", masterRow: 21, pool: "A", track: "영상 편집 (롱폼)", name: "가로형 영상 편집 (3~5분)", resourcePerUnit: 0.29469, internalPrice: 2110000, externalPrice: 3000000, defaultQty: 1, note: "3~5분 러닝타임 기준 편집", grade: "M3", sampleLink: "" },
  { id: "item_021", masterRow: 22, pool: "A", track: "영상 편집 (롱폼)", name: "가로형 영상 편집 (5~10분)", resourcePerUnit: 0.44134, internalPrice: 3160000, externalPrice: 4400000, defaultQty: 1, note: "5~10분 러닝타임 기준 편집 (10분 이상 별도 협의)", grade: "M3", sampleLink: "" },
  { id: "item_022", masterRow: 23, pool: "A", track: "영상 편집 (숏폼)", name: "세로형 영상 편집 (1분)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 650000, defaultQty: 1, note: "약 60초 기준 세로형 숏폼 편집", grade: "M2", sampleLink: "" },
  { id: "item_023", masterRow: 24, pool: "A", track: "영상 편집 (숏폼)", name: "세로형 영상 편집 (2분)", resourcePerUnit: 0.09777, internalPrice: 700000, externalPrice: 910000, defaultQty: 1, note: "2분 분량 기준 세로형 숏폼 편집", grade: "M2", sampleLink: "" },
  { id: "item_024", masterRow: 25, pool: "A", track: "영상 편집 (숏폼)", name: "세로형 영상 편집 (3분)", resourcePerUnit: 0.13966, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1, note: "3분 분량 기준 세로형 숏폼 편집", grade: "M2", sampleLink: "" },
  { id: "item_025", masterRow: 26, pool: "A", track: "자막", name: "자막 (1분 이내)", resourcePerUnit: 0.02793, internalPrice: 200000, externalPrice: 260000, defaultQty: 1, note: "1분 이내 모션 타이틀 및 기본 자막 디자인 (말자막 기준)", grade: "M2", sampleLink: "" },
  { id: "item_026", masterRow: 27, pool: "A", track: "자막", name: "자막 (3~5분)", resourcePerUnit: 0.09777, internalPrice: 700000, externalPrice: 910000, defaultQty: 1, note: "3~5분 모션 타이틀 및 전체 자막 디자인 (말자막 기준)", grade: "M2", sampleLink: "" },
  { id: "item_027", masterRow: 28, pool: "A", track: "재편집", name: "가로형 → 세로형 단순 재편집", resourcePerUnit: 0.02793, internalPrice: 200000, externalPrice: 260000, defaultQty: 1, note: "기존 완성본 가로 영상을 세로 비율로 상하단 여백 편집 (그외는 기본가 카운팅)", grade: "M2", sampleLink: "" },
  { id: "item_028", masterRow: 29, pool: "A", track: "행사 스케치 영상 편집", name: "행사 스케치 영상 편집 (1분 이내)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 650000, defaultQty: 1, note: "1~2분 분량 기준 행사 스케치 영상 편집 (카메라 1대 앵글, 단순 편집 기준)", grade: "M2", sampleLink: "" },
  { id: "item_029", masterRow: 30, pool: "A", track: "행사 스케치 영상 편집", name: "행사 스케치 영상 편집 (2분 이내)", resourcePerUnit: 0.09777, internalPrice: 700000, externalPrice: 910000, defaultQty: 1, note: "2~3분 분량 기준 행사 스케치 영상 편집 (카메라 1대 앵글, 단순 편집 기준)", grade: "M2", sampleLink: "" },
  { id: "item_030", masterRow: 31, pool: "A", track: "행사 스케치 영상 편집", name: "행사 스케치 영상 편집 (5분 이내)", resourcePerUnit: 0.13966, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1, note: "3~4분 분량 기준 행사 스케치 영상 편집 (카메라 1대 앵글, 단순 편집 기준, 4분 이상 별도 협의)", grade: "M2", sampleLink: "" },
  { id: "item_031", masterRow: 32, pool: "A", track: "AI 영상", name: "AI 영상 (S) 1분 인물·상품 합성", resourcePerUnit: 0.50279, internalPrice: 3600000, externalPrice: 5000000, defaultQty: 1, note: "컷 3개 이상", difficulty: "S", grade: "M3", sampleLink: "" },
  { id: "item_032", masterRow: 33, pool: "A", track: "AI 영상", name: "AI 영상 (A) 30초~1분 단일 소재", resourcePerUnit: 0.1257, internalPrice: 900000, externalPrice: 1200000, defaultQty: 1, note: "30초~1분 단일 소재 기반 생성. 프롬프트 엔지니어링 + 편집 + 음악 포함 / SNS 릴스 활용시 동일", difficulty: "A", grade: "M2", sampleLink: "" },
  { id: "item_033", masterRow: 34, pool: "A", track: "AI 영상", name: "AI 영상 (B) 15~30초 단순 무빙", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 650000, defaultQty: 1, note: "15초~30초 단일 소재 기반 생성. 프롬프트 엔지니어링 + 편집 + 음악 포함 / SNS 릴스 활용시 동일", difficulty: "B", grade: "M2", sampleLink: "" },
  { id: "item_034", masterRow: 35, pool: "A", track: "AI 영상", name: "AI 영상 (C) 15초 단순 무빙", resourcePerUnit: 0.05028, internalPrice: 360000, externalPrice: 470000, defaultQty: 1, note: "단일 컷 팬·줌·패럴랙스 등 기본 무빙. 소스 이미지 기반 1회 생성 / SNS 릴스 활용시 동일", difficulty: "C", grade: "M2", sampleLink: "" },
  { id: "item_035", masterRow: 36, pool: "B", track: "재편집", name: "심화 보정 (포토샵/일러스트)", resourcePerUnit: 0.0148, internalPrice: 106000, externalPrice: 130000, defaultQty: 1, note: "CR파트 제작 시안 한정 반영 (그외는 기본가 카운팅)", grade: "M1", sampleLink: "" },
  { id: "item_036", masterRow: 37, pool: "B", track: "브랜딩", name: "BI 가이드라인 개발(A급)", resourcePerUnit: 0.90782, internalPrice: 6500000, externalPrice: 9100000, defaultQty: 1, note: "보유 BI 기반 로고 사용 규정, 컬러, 서체, 그래픽 모티프, 이미지 스타일, 레이아웃 원칙, 금지 규정 및 기본 적용 예시 ", grade: "M3", sampleLink: "" },
  { id: "item_037", masterRow: 38, pool: "B", track: "브랜딩", name: "브랜드 플레이북 개발(S급)", resourcePerUnit: 2.93296, internalPrice: 21000000, externalPrice: 29400000, defaultQty: 1, note: "브랜드 철학·핵심 가치, 타깃, 메시지 체계, Tone of Voice, 콘텐츠 원칙, 채널별 활용 가이드 및 적용 사례", grade: "M3", sampleLink: "" },
  { id: "item_038", masterRow: 39, pool: "B", track: "브랜딩", name: "브랜드 베이직시스템 개발", resourcePerUnit: 2.7933, internalPrice: 20000000, externalPrice: 26000000, defaultQty: 1, note: "전략 + BI개발 (메인1종 + 응용 3종) +필요 어플리케이션 5종", grade: "M2", sampleLink: "" },
  { id: "item_039", masterRow: 40, pool: "B", track: "브랜딩", name: "브랜드 확장 어플리케이션", resourcePerUnit: 0.69832, internalPrice: 5000000, externalPrice: 7000000, defaultQty: 1, note: "사이니지·차량·유니폼,명함·봉투·레터헤드·PPT·SNS 템플릿 등 (택 5종)", grade: "M3", sampleLink: "" },
  { id: "item_040", masterRow: 41, pool: "B", track: "브랜딩", name: "브랜드 네이밍 (기업)", resourcePerUnit: 2.93296, internalPrice: 21000000, externalPrice: 29400000, defaultQty: 1, note: "기업 네이밍 1종  (네이밍 후보군 5종 기획, 제안, kipris 등록 가능 여부 확인)", grade: "M3", sampleLink: "" },
  { id: "item_041", masterRow: 42, pool: "B", track: "브랜딩", name: "브랜드 네이밍 (브랜드)", resourcePerUnit: 1.95531, internalPrice: 14000000, externalPrice: 19600000, defaultQty: 1, note: "브랜드 네이밍 1종 (네이밍 후보군 5종 기획, 제안, kipris 등록 가능 여부 확인)", grade: "M3", sampleLink: "" },
  { id: "item_042", masterRow: 43, pool: "B", track: "웹·디지털", name: "상품상세페이지", resourcePerUnit: 0.06006, internalPrice: 430000, externalPrice: 560000, defaultQty: 1, note: "상품 소개 및 상세 구성 디자인", grade: "M2", sampleLink: "" },
  { id: "item_043", masterRow: 44, pool: "B", track: "웹·디지털", name: "온라인 포스터", resourcePerUnit: 0.05168, internalPrice: 370000, externalPrice: 480000, defaultQty: 1, note: "웹·디지털 게시용 포스터 디자인", grade: "M2", sampleLink: "" },
  { id: "item_044", masterRow: 45, pool: "B", track: "웹·디지털", name: "웹페이지 디자인 (페이지당)", resourcePerUnit: 0.06844, internalPrice: 490000, externalPrice: 690000, defaultQty: 1, note: "퍼블리싱·개발 별도", grade: "M3", sampleLink: "" },
  { id: "item_045", masterRow: 46, pool: "B", track: "웹·디지털", name: "이메일 디자인", resourcePerUnit: 0.03631, internalPrice: 260000, externalPrice: 310000, defaultQty: 1, note: "뉴스레터· 메일 템플릿 및 레이아웃 디자인", grade: "M1", sampleLink: "" },
  { id: "item_046", masterRow: 47, pool: "B", track: "인쇄·편집", name: "배너·현수막", resourcePerUnit: 0.0148, internalPrice: 106000, externalPrice: 130000, defaultQty: 1, note: "X배너·현수막 규격 편집 디자인", grade: "M1", sampleLink: "" },
  { id: "item_047", masterRow: 48, pool: "B", track: "인쇄·편집", name: "책자 디자인 (표지)", resourcePerUnit: 0.03771, internalPrice: 270000, externalPrice: 320000, defaultQty: 1, note: "인쇄용 표지 디자인 (A4 이상)", grade: "M1", sampleLink: "" },
  { id: "item_048", masterRow: 49, pool: "B", track: "인쇄·편집", name: "책자 디자인 (장당)", resourcePerUnit: 0.02095, internalPrice: 150000, externalPrice: 200000, defaultQty: 1, note: "인쇄용 내지 레이아웃 (A4 이상, 표지 별도)", grade: "M2", sampleLink: "" },
  { id: "item_049", masterRow: 50, pool: "B", track: "인쇄·편집", name: "초청장", resourcePerUnit: 0.03771, internalPrice: 270000, externalPrice: 320000, defaultQty: 1, note: "온/오프라인 초청장 디자인", grade: "M1", sampleLink: "" },
  { id: "item_050", masterRow: 51, pool: "B", track: "인쇄·편집", name: "리플렛 디자인 (장당)", resourcePerUnit: 0.01397, internalPrice: 100000, externalPrice: 120000, defaultQty: 1, note: "2단/3단 리플렛·팜플렛 디자인", grade: "M1", sampleLink: "" },
  { id: "item_051", masterRow: 52, pool: "B", track: "인포그래픽", name: "인포그래픽 (B · 단순, 1장)", resourcePerUnit: 0.02654, internalPrice: 190000, externalPrice: 250000, defaultQty: 1, note: "반영 원고 제공, 차트·도표 3개 이하, 기본 아이콘 활용 1페이지 완결형", difficulty: "B", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_052", masterRow: 53, pool: "B", track: "인포그래픽", name: "인포그래픽 (A · 복잡)", resourcePerUnit: 0.05307, internalPrice: 380000, externalPrice: 490000, defaultQty: 1, note: "원문 요약/기획 포함 OR 차트·도표 4개 이상 OR 커스텀 일러스트·지도·3D 그래픽 포함", difficulty: "A", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_053", masterRow: 54, pool: "B", track: "일러스트", name: "일러스트 (B · 단순 드로잉)", resourcePerUnit: 0.02654, internalPrice: 190000, externalPrice: 250000, defaultQty: 1, note: "2D 라인·플랫 일러스트 1컷", difficulty: "B", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_054", masterRow: 55, pool: "B", track: "일러스트", name: "일러스트 (A · 캐릭터 드로잉)", resourcePerUnit: 0.05307, internalPrice: 380000, externalPrice: 490000, defaultQty: 1, note: "캐릭터 맞춤 연출 일러스트 1컷", difficulty: "A", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_055", masterRow: 56, pool: "B", track: "캐릭터", name: "캐릭터 3D 모델링·렌더링", resourcePerUnit: 0.55866, internalPrice: 4000000, externalPrice: 5600000, defaultQty: 1, note: "2D 기반 3D 턴어라운드, 텍스처링, 3D 포즈 렌더링, 리깅 포함 · 애니메이션·시네마틱 활용 스펙", grade: "M3", sampleLink: "" },
  { id: "item_056", masterRow: 57, pool: "B", track: "캐릭터", name: "캐릭터 리뉴얼·디벨롭", resourcePerUnit: 0.48883, internalPrice: 3500000, externalPrice: 4900000, defaultQty: 1, note: "턴어라운드(전·측·후) 정립, 비율·스타일 최신화, 시안 2종 · 기존 캐릭터 가이드 교체 기준", grade: "M3", sampleLink: "" },
  { id: "item_057", masterRow: 58, pool: "B", track: "캐릭터", name: "캐릭터 브랜드 가이드북", resourcePerUnit: 0.2095, internalPrice: 1500000, externalPrice: 2100000, defaultQty: 1, note: "규격, 컬러 스펙(CMYK/RGB/PANTONE), 최소 크기, 금기사항, 조합 규정 (PDF)", grade: "M3", sampleLink: "" },
  { id: "item_058", masterRow: 59, pool: "B", track: "캐릭터", name: "캐릭터 신규 개발 (기본 패키지)", resourcePerUnit: 0.69832, internalPrice: 5000000, externalPrice: 7000000, defaultQty: 1, note: "컨셉 리포트, 세계관·스토리, 메인 시안 3종, 턴어라운드 1종, 저작재산권 양도 포함", grade: "M3", sampleLink: "" },
  { id: "item_059", masterRow: 60, pool: "B", track: "캐릭터", name: "캐릭터 응용 베리에이션 (2D, 5종)", resourcePerUnit: 0.2095, internalPrice: 1500000, externalPrice: 2000000, defaultQty: 1, note: "포즈·의상·소품·표정 연출 5종 패키지 · 건당 30만원 기준", grade: "M2", sampleLink: "" },
  { id: "item_060", masterRow: 61, pool: "B", track: "캐릭터", name: "캐릭터 응용 베리에이션 (2D, 건당)", resourcePerUnit: 0.0419, internalPrice: 300000, externalPrice: 390000, defaultQty: 1, note: "5종 미만 개별 발주 시 적용", grade: "M2", sampleLink: "" },
  { id: "item_061", masterRow: 62, pool: "B", track: "패키지", name: "패키지 디자인 (B · 템플릿 변형)", resourcePerUnit: 0.13966, internalPrice: 1000000, externalPrice: 1300000, defaultQty: 1, note: "템플릿 변형: 확정 레이아웃 내 텍스트·컬러 변경·단순 재배치만 (시안1·수정1, 신규 디자인 불가)", difficulty: "B", grade: "M2", sampleLink: "" },
  { id: "item_062", masterRow: 63, pool: "B", track: "패키지", name: "패키지 디자인 (A · 기존 브랜드)", resourcePerUnit: 0.41899, internalPrice: 3000000, externalPrice: 4200000, defaultQty: 1, note: "기존 브랜드: 기존 BI 준수, 신규 제품군 레이아웃 설계 (시안2·수정2)", difficulty: "A", grade: "M3", sampleLink: "" },
  { id: "item_063", masterRow: 64, pool: "B", track: "패키지", name: "패키지 디자인 (S · 신규 브랜드)", resourcePerUnit: 0.69832, internalPrice: 5000000, externalPrice: 7000000, defaultQty: 1, note: "신규 브랜드: 컨셉 기획 + 신규 레이아웃 설계 + 타이포·컬러 개발 (시안3·수정3)", difficulty: "S", grade: "M3", sampleLink: "" },
  { id: "item_064", masterRow: 65, pool: "B", track: "패키지", name: "패키지 추가 SKU (단순)", resourcePerUnit: 0.02793, internalPrice: 200000, externalPrice: 260000, defaultQty: 1, note: "동일 레이아웃, 제품명·용량·컬러칩 교체", grade: "M2", sampleLink: "" },
  { id: "item_065", masterRow: 66, pool: "B", track: "패키지", name: "패키지 추가 SKU (복합)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 650000, defaultQty: 1, note: "요소 일부 재배치 또는 규격 변경 동반  (50% 규칙 미적용, 단가 유지)", grade: "M2", sampleLink: "" },
  { id: "item_066", masterRow: 67, pool: "B", track: "패키지", name: "패키지 칼선·지기구 개발", resourcePerUnit: 0.0419, internalPrice: 300000, externalPrice: 390000, defaultQty: 1, note: "구조 복잡도에 따라 30만~80만 · 기존 칼선 활용 시 미청구 (50% 규칙 미적용, 단가 유지)", grade: "M2", sampleLink: "" },
  { id: "item_067", masterRow: 68, pool: "B", track: "행사·오프라인", name: "단면 랩핑", resourcePerUnit: 0.0148, internalPrice: 106000, externalPrice: 130000, defaultQty: 1, note: "강연대·포디움 랩핑 그래픽 디자인 (단순 로고 베리에이션)", grade: "M1", variationAllowed: true, sampleLink: "" },
  { id: "item_068", masterRow: 69, pool: "B", track: "행사·오프라인", name: "연출물 랩핑 (B · 가이드 기반)", resourcePerUnit: 0.0419, internalPrice: 300000, externalPrice: 360000, defaultQty: 1, note: "가이드 기반 신규 제작", difficulty: "B", grade: "M1", sampleLink: "" },
  { id: "item_069", masterRow: 70, pool: "B", track: "행사·오프라인", name: "연출물 랩핑 (A · 신규 컨셉)", resourcePerUnit: 0.06006, internalPrice: 430000, externalPrice: 560000, defaultQty: 1, note: "신규 컨셉 기반 제작", difficulty: "A", grade: "M2", sampleLink: "" },
  { id: "item_070", masterRow: 71, pool: "B", track: "행사·오프라인", name: "포스터 (시안 1종)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 650000, defaultQty: 1, note: "인쇄용 단일 포스터 디자인", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_071", masterRow: 72, pool: "B", track: "행사·오프라인", name: "포스터·광고 (기획+시안 3종)", resourcePerUnit: 0.14385, internalPrice: 1030000, externalPrice: 1300000, defaultQty: 1, note: "기획 + 시안 3종 + 카피 배치", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_072", masterRow: 73, pool: "B", track: "행사·오프라인", name: "행사 키비주얼 (S · Global Master)", resourcePerUnit: 1.95531, internalPrice: 14000000, externalPrice: 19600000, defaultQty: 1, note: "글로벌·대형 브랜드 행사, 온·오프라인 전방위. 고도화 그래픽 + 메인 아트워크 + 어플리케이션 가이드북. ※1,960만원~부터, 규모별 협의", difficulty: "S", grade: "M3", sampleLink: "" },
  { id: "item_073", masterRow: 74, pool: "B", track: "행사·오프라인", name: "행사 키비주얼 (A · Public External)", resourcePerUnit: 0.27933, internalPrice: 2000000, externalPrice: 2800000, defaultQty: 1, note: "대중·외부 노출 행사, 미디어·현장 5~10종 확장. 정교한 2D/3D + 메인 아트워크 + 주요 제작물 변형 2~3종", difficulty: "A", grade: "M3", sampleLink: "" },
  { id: "item_074", masterRow: 75, pool: "B", track: "행사·오프라인", name: "행사 키비주얼 (B · Internal Private)", resourcePerUnit: 0.09916, internalPrice: 710000, externalPrice: 990000, defaultQty: 1, note: "기업 내부·B2B·학회 행사, 무대·배너 기본 확장. 스탁 그래픽 재가공 + 메인 아트워크 1종(단순 포맷 변형)", difficulty: "B", grade: "M3", sampleLink: "" },
  { id: "item_075", masterRow: 76, pool: "B", track: "행사·오프라인", name: "행사·영상 타이틀", resourcePerUnit: 0.04888, internalPrice: 350000, externalPrice: 460000, defaultQty: 1, note: "행사/영상 타이틀 로고 및 그래픽 디자인", grade: "M2", variationAllowed: true, sampleLink: "" },
  { id: "item_076", masterRow: 77, pool: "B", track: "행사·오프라인", name: "부스 디자인 (1ea)", resourcePerUnit: 0.2095, internalPrice: 1500000, externalPrice: 2100000, defaultQty: 1, note: "[신규] 맞춤 부스 개발 / [변형] 배치·비율 재조정시 50% 가산", grade: "M3", variationAllowed: true, sampleLink: "" },
  { id: "item_077", masterRow: 78, pool: "B", track: "행사·오프라인", name: "부스 디자인 (2ea)", resourcePerUnit: 0.27933, internalPrice: 2000000, externalPrice: 2800000, defaultQty: 1, note: "[신규] 맞춤 부스 개발 / [변형] 배치·비율 재조정시 50% 가산", grade: "M3", variationAllowed: true, sampleLink: "" },
  { id: "item_078", masterRow: 79, pool: "B", track: "행사·오프라인", name: "부스 디자인 (4ea)", resourcePerUnit: 0.50279, internalPrice: 3600000, externalPrice: 5000000, defaultQty: 1, note: "[신규] 맞춤 부스 개발 / [변형] 배치·비율 재조정시 50% 가산", grade: "M3", variationAllowed: true, sampleLink: "" },
  { id: "item_079", masterRow: 80, pool: "B", track: "AI 이미지", name: "AI 이미지 (생성+편집, 1컷)", resourcePerUnit: 0.04609, internalPrice: 330000, externalPrice: 460000, defaultQty: 1, note: "AI 생성 후 포토샵 합성·리터칭·보정 포함. 상업용 고화질 1컷", grade: "M3", sampleLink: "" },
  { id: "item_080", masterRow: 81, pool: "B", track: "AI 이미지", name: "AI 이미지 (생성만, 1컷)", resourcePerUnit: 0.02011, internalPrice: 144000, externalPrice: 200000, defaultQty: 1, note: "프롬프트 엔지니어링 기반 생성 이미지 원본 납품 (추가 편집 없음)", grade: "M3", sampleLink: "" },
  { id: "item_081", masterRow: 82, pool: "B", track: "PPT", name: "PPT 본문 (그래프, 장당)", resourcePerUnit: 0.01816, internalPrice: 130000, externalPrice: 160000, defaultQty: 1, note: "기존 PPT 템플릿 내 데이터를 차트·다이어그램으로 시각화 (기본 디자인 적용, 장당).", grade: "M1", sampleLink: "" },
  { id: "item_082", masterRow: 83, pool: "B", track: "PPT", name: "PPT 본문 (인포그래픽, 장당)", resourcePerUnit: 0.02095, internalPrice: 150000, externalPrice: 200000, defaultQty: 1, note: "기존 PPT 템플릿 내 텍스트·표를 다이어그램·인포그래픽으로 시각화 (기본 디자인 적용, 장당).", grade: "M2", sampleLink: "" },
  { id: "item_083", masterRow: 84, pool: "B", track: "PPT", name: "PPT 본문 (텍스트, 장당)", resourcePerUnit: 0.01397, internalPrice: 100000, externalPrice: 120000, defaultQty: 1, note: "기존 PPT 템플릿 내 텍스트·표 정돈 및 기본 레이아웃 (다이어그램화 미포함).", grade: "M1", sampleLink: "" },
  { id: "item_084", masterRow: 85, pool: "B", track: "PPT", name: "PPT 템플릿 디자인", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 700000, defaultQty: 1, note: "신규 컨셉·시스템 개발 (마스터 슬라이드, 컬러·타이포 시스템, 레이아웃 5종 내외)", grade: "M3", sampleLink: "" },
  { id: "item_085", masterRow: 86, pool: "B", track: "SNS", name: "SNS 피드 이미지 (C)", resourcePerUnit: 0.02793, internalPrice: 200000, externalPrice: 260000, defaultQty: 1, note: "보유 템플릿·기존 포맷에 텍스트·이미지 교체 (단순)", difficulty: "C", grade: "M2", sampleLink: "" },
  { id: "item_086", masterRow: 87, pool: "B", track: "SNS", name: "SNS 피드 이미지 (B)", resourcePerUnit: 0.04888, internalPrice: 350000, externalPrice: 460000, defaultQty: 1, note: "표준 피드 (SNS 앵커). 일반 이미지 구성, 3in1 가로형 포함 (각 이미지 다를 경우, 캐러셀 B급 카운팅)", difficulty: "B", grade: "M2", sampleLink: "" },
  { id: "item_087", masterRow: 88, pool: "B", track: "SNS", name: "SNS 피드 이미지 (A)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 700000, defaultQty: 1, note: "정보 구조 설계 + 커스텀 그래픽 (고퀄)", difficulty: "A", grade: "M3", sampleLink: "" },
  { id: "item_088", masterRow: 89, pool: "B", track: "SNS", name: "SNS 캐러셀 5p (C · 반복·정기물)", resourcePerUnit: 0.06983, internalPrice: 500000, externalPrice: 600000, defaultQty: 1, note: "확정 템플릿·기존 포맷에 텍스트·이미지만 교체하는 정기·대량 물량 (신규 기획·커스텀 그래픽 없음). Cover 1p+본문 4p 총 5p 완결형 / 추가 본문 1p=기본가 5%", difficulty: "C", grade: "M1", isCarousel: true, sampleLink: "" },
  { id: "item_089", masterRow: 90, pool: "B", track: "SNS", name: "SNS 캐러셀 5p (B · 표준 카드뉴스)", resourcePerUnit: 0.11173, internalPrice: 800000, externalPrice: 1000000, defaultQty: 1, note: "보유 템플릿·기존 포맷에 텍스트·이미지 구성, 피드 C급 Cover 1p+본문 4p 총 5p 완결형 /추가 본문 1p=기본가 5% ", difficulty: "B", grade: "M2", isCarousel: true, sampleLink: "" },
  { id: "item_090", masterRow: 91, pool: "B", track: "SNS", name: "SNS 캐러셀 5p (A · 정보설계·커스텀)", resourcePerUnit: 0.15363, internalPrice: 1100000, externalPrice: 1500000, defaultQty: 1, note: "정보량 많음, 페이지별 구조 설계, 커스텀 그래픽. 피드 B급 Cover 1p+본문 4p / 추가 본문 1p=기본가 5%", difficulty: "A", grade: "M3", isCarousel: true, sampleLink: "" },
  { id: "item_091", masterRow: 92, pool: "B", track: "SNS", name: "SNS 캐러셀 5p (S · 고난도 인포·일러)", resourcePerUnit: 0.2095, internalPrice: 1500000, externalPrice: 2100000, defaultQty: 1, note: "고난도 정보 설계 + 인포그래픽·일러스트·비주얼 개발. 피드 A급 Cover 1p+본문 4p /추가 본문 1p=기본가 5%", difficulty: "S", grade: "M3", isCarousel: true, sampleLink: "" },
];

export const RESOURCE_MASTER: ResourceMaster = {
  pools: [
    { pool: 'A', name: '프로덕션', summaryLabel: 'A · 프로덕션 (촬영·편집·모션·AI영상)', checkLabel: 'A · 프로덕션', headcount: 10 },
    { pool: 'B', name: '디자인',   summaryLabel: 'B · 디자인 (정적·브랜딩·패키지·캐릭터·AI이미지)', checkLabel: 'B · 디자인',   headcount: 14 },
  ],
  subConstraints: [
    { label: '사진', track: '사진 촬영', headcount: 3 },
    { label: '모션', track: '모션',      headcount: 3 },
  ],
  constants: {
    sharedRatioToA: 0.3,
    workingDaysPerMonth: 22,
    shortageThreshold: 1,
    saturationThreshold: 0.85,
  },
};

export const SHARED_SUMMARY_LABEL = '공용';

export const MASTER_DATA: MasterData = {
  designItems: DESIGN_ITEMS,
  resource: RESOURCE_MASTER,
};

export const TRACKS_BY_POOL = DESIGN_ITEMS.reduce<Record<string, string[]>>((acc, it) => {
  const list = (acc[it.pool] ??= []);
  if (!list.includes(it.track)) list.push(it.track);
  return acc;
}, {});

export const CALC_NOTES: string[] = [
  '리소스 1.0 M/M = 1인이 한 달(22영업일)간 전담 투입되는 양입니다.',
  '리소스(M/M)는 정가 대비 10% 할인가를 기준으로 산출됩니다. 표시 금액(내부·외부)은 정가입니다.',
  '베리에이션(반복 디자인 추가안) = 단가 × 50% × 추가안 수량.',
  '캐러셀 추가 본문 1p = 해당 등급 기본가 × 5% × 페이지 수.',
  '난이도(S/A/B/C)는 고객 표시용이며, 외부 단가는 등급(M1~M3) 배율(×1.2/×1.3/×1.4)로 산정됩니다.',
];

export const SIMULATOR_NOTES: string[] = [
  '※ 본 단가는 CR팀 단가체계 2026-09-10 최종 기준입니다.',
  '※ 촬영은 자사 스튜디오/실내 기준이며, 출장·야외는 출장비 기준을 따릅니다.',
];

/** 견적 조건 · 특약 (PDF/Excel 하단 출력) */
export const QUOTE_CONDITIONS: string[] = [
  '리소스(M/M) 산출은 정가 대비 10% 할인가를 기준으로 합니다. 견적 금액은 정가입니다.',
  '촬영 단가는 자사 스튜디오/실내 기준(이동 미포함)이며, 출장·야외 촬영은 출장비가 별도 가산됩니다.',
  'AI 이미지·크레딧, 유료 폰트·이미지·BGM 라이선스, 외부 장비 대여는 실비(×1.1)로 별도 청구합니다.',
  '패키지: 시안 추가는 내부가의 30%, 수정 초과는 15%로 산정합니다.',
  '수주 후 미진행(발주처 사유) 시 사전 제작된 CR 콘텐츠는 정가의 50% 수준에서 조율 청구합니다.',
];
