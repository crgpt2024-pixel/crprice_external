# 디자인 견적 및 리소스 산출 — 외부용 (고객 공개용)

> 내부용과 동일하되, 풀별 가동률·하위 제약·인력 배분 설정 패널이 제거된 버전입니다.
> 접근 암호: prain2610!  (내부용과 다릅니다)

# 디자인 견적 및 리소스 산출 (Vite + React + RxJS)

## 실행

```bash
npm install
npm run dev        # http://localhost:5173  (개발 서버, 저장 즉시 반영)
npm run build      # dist/ 정적 파일 생성
npm run preview    # 빌드 결과 미리보기
npm run verify     # 계산 엔진 == 원본 엑셀 값 검증
```

## 배포
`dist/` 폴더는 순수 정적 파일이라 어디든 올릴 수 있습니다.
- Vercel / Netlify: 저장소 연결 → Build `npm run build`, Output `dist`
- GitHub Pages: `npm run build` 후 `dist`를 `gh-pages` 브랜치로 (vite.config의 `base: './'` 덕분에 하위 경로도 동작)
- 사내 서버: `dist`를 nginx/Apache 정적 디렉터리에 복사

## 반응형
- ≥ 981px: 좌측 입력 폼 + 우측 고정 요약 패널
- ≤ 980px: 요약 패널이 아래로 내려가고, 화면 하단에 합계·판정 고정 바 + "요약 보기" 버튼
- ≤ 640px: 항목 행이 산출물 / 월 건수 / 소모 M/M 3열로 축소

## 구조
```
src/
  main.tsx                 진입점
  EstimateApp.tsx          화면
  useEstimateCalculator.ts RxJS 계산 훅 (150ms 디바운스)
  calcEngine.ts            엑셀 수식 1:1 계산 함수
  exportUtils.tsx          PDF / Excel 내보내기
  masterData.ts            단가·인력 마스터 (엑셀에서 추출)
  types.ts
```

## 단가 변경
`src/masterData.ts`의 `DESIGN_ITEMS` / `RESOURCE_MASTER` 만 고치면 화면·PDF·Excel 전부 반영됩니다.
PDF 한글 폰트를 사내 파일로 바꾸려면 `public/fonts/`에 TTF를 두고
`registerKoreanFont({ regular: '/fonts/NanumGothic.ttf', bold: '/fonts/NanumGothicBold.ttf' })` 를 `main.tsx`에서 호출하세요.
