# 모바일 청첩장

하객에게 링크와 QR 코드로 공유하는 모바일 청첩장 사이트 (React + Vite, GitHub Pages 배포).

**섹션**: 메인 사진 · 인사말/혼주 · 달력과 D-day · 갤러리(확대·스와이프) · 오시는 길(지도 앱 링크) · 마음 전하실 곳(계좌 복사)

## 내 정보로 바꾸기

### 1. 글 내용 — `src/data/wedding.js` 하나만 수정
이름, 혼주, 예식 일시, 장소, 교통, 계좌가 모두 이 파일에 있습니다.

### 2. 사진 — `public/images/`
1. 사진을 `public/images/`에 복사 (예: `cover.jpg`, `01.jpg`, `02.jpg` …)
2. `wedding.js`의 `cover`, `gallery` 경로를 파일 이름에 맞게 수정
   ```js
   cover: 'images/cover.jpg',
   gallery: ['images/01.jpg', 'images/02.jpg'],  // 개수 자유
   ```
3. 기존 `.svg` 임시 이미지는 삭제해도 됩니다.
- 팁: 휴대폰 사진은 용량이 커서 느려집니다. 가로 1200px 정도로 줄여서 넣으세요.

### 3. 카카오톡 링크 미리보기 — `index.html`
`<title>`, `og:title`, `og:description`을 수정하고, `og:image`에 **전체 주소**를 넣습니다.
(jpg/png만 가능, 예: `https://아이디.github.io/저장소이름/images/cover.jpg`)

### 4. 색상
`src/styles/global.css` 맨 위 `:root`의 색상 변수만 바꾸면 전체 톤이 바뀝니다.

## 실행

```bash
npm install      # 처음 한 번
npm run dev      # 개발 서버 → 터미널에 나오는 주소로 접속
npm run build    # 배포용 빌드 (dist 폴더)
npm run preview  # 빌드 결과 미리보기
```

## 배포 & QR 코드
1. GitHub 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정
2. `main` 브랜치에 push하면 자동 배포 → `https://아이디.github.io/저장소이름/`
3. QR 생성: `npm run qr -- https://아이디.github.io/저장소이름/` → 프로젝트 폴더에 `qr.png`

## 참고
- 티맵 버튼은 티맵 앱이 설치된 휴대폰에서만 열립니다.
- 복사 기능은 https 주소(GitHub Pages)에서 동작합니다.
- 공개 저장소이므로 계좌번호 등 내용이 코드에서도 보입니다 (사이트 자체도 공개).
