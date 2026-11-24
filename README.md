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

## 온라인 하객석과 방명록

하객이 캐릭터로 예식장 입구(로비)에 들어가 손님맞이대의 방명록을 남기면 문이 열리고, 예식장 안 자기 자리에 앉는 기능입니다. 글을 남기지 않고 「그냥 둘러보기」도 할 수 있습니다. 주소 끝에 `#hall`을 붙이면 바로 입장합니다.

- **문구 수정**: `src/data/wedding.js`의 `onlineHall`
- **색 수정**: `src/styles/global.css`의 `--hall-*` 변수 (캐릭터 옷, 꽃, 벽 등)
- **부적절한 글 삭제**: [Firebase 콘솔](https://console.firebase.google.com/project/mini-yuni-wedding/firestore) → `messages`에서 해당 글의 ⋮ → 문서 삭제
- **비밀번호를 잊은 하객의 글**: 비밀번호는 해시로만 저장되어 알려줄 수 없습니다. 위 방법으로 삭제해 주세요.
- **홀에는 최신 글 100개**만 표시됩니다. 이전 글도 Firebase에는 남아 있습니다.
- **무료 한도**: 하루 읽기 5만 번(글이 100개일 때 입장 약 500회). 넘으면 그날은 방명록만 멈춥니다.

### Firebase를 새로 설정할 때
1. Firebase 콘솔에서 프로젝트 생성 → **Firestore Database** 만들기 (Realtime Database 아님), 위치 `asia-northeast3`, 프로덕션 모드
2. 프로젝트 설정 → 내 앱 → 웹 앱 등록 → 설정값을 `src/data/firebase.js`에 입력
3. Firestore **규칙** 탭에 `firestore.rules` 내용을 붙여넣고 **게시** (적용까지 몇 분 걸릴 수 있음)
