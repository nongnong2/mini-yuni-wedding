# 모바일 청첩장 사이트

React + Vite 정적 사이트. GitHub Pages로 배포하고 링크/QR로 공유한다.

## 규칙
- 청첩장 내용(이름, 날짜, 장소, 계좌, 사진 목록)은 `src/data/wedding.js`에만 둔다. 컴포넌트에 하드코딩 금지.
- 사진은 `public/images/`에 두고 경로는 `images/파일명` 형식(앞에 `/` 없이 — base가 `./`라서).
- 색상은 `src/styles/global.css`의 `:root` 변수로만 관리.
- 사용자는 코딩 입문자: 변경 시 이유와 핵심 라인을 짧게 설명.

## 명령어
- `npm run dev` — 개발 서버
- `npm run build` / `npm run preview` — 배포 결과 확인
- `npm run qr -- <배포URL>` — qr.png 생성
- main에 push → `.github/workflows/deploy.yml`이 자동 배포
