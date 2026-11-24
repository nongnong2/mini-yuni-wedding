# 모바일 청첩장 사이트

React + Vite 정적 사이트. GitHub Pages로 배포하고 링크/QR로 공유한다.

## 규칙
- 청첩장 내용(이름, 날짜, 장소, 계좌, 사진 목록)은 `src/data/wedding.js`에만 둔다. 컴포넌트에 하드코딩 금지.
- 사진은 `public/images/`에 두고 경로는 `images/파일명` 형식(앞에 `/` 없이 — base가 `./`라서).
- 색상은 `src/styles/global.css`의 `:root` 변수로만 관리.
- 온라인 하객석: 3D는 `src/hall/`(조립은 `index.js`, 숫자 설정은 `config.js`), 화면은 `src/components/hall/`, 화면 상태·동작은 `src/hooks/`, 글 저장은 `src/utils/guestbook.js`(Firestore). 3D 색도 `--hall-*` 변수만 사용. 새 기능은 파일을 나눠 만들고 `index.js`·`HallScreen.jsx`에서 연결.
- 휴대폰이 기본 화면. 온라인 하객석을 고칠 때는 폭 320px부터, 세로·가로 모두 버튼이 겹치거나 잘리지 않는지 확인.
- 방명록 규칙은 `firestore.rules`. 파일을 고쳐도 자동 적용되지 않으므로 Firebase 콘솔의 규칙 탭에 붙여넣고 게시해야 함.
- 방명록 글은 React 출력이나 `textContent`로만 표시 (`dangerouslySetInnerHTML`·`innerHTML` 금지).
- 사용자는 코딩 입문자: 변경 시 이유와 핵심 라인을 짧게 설명.

## 명령어
- `npm run dev` — 개발 서버
- `npm run build` / `npm run preview` — 배포 결과 확인
- `npm run qr -- <배포URL>` — qr.png 생성
- main에 push → `.github/workflows/deploy.yml`이 자동 배포
