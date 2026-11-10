// ★ 청첩장의 모든 내용은 이 파일에서만 수정하면 됩니다.
// 사진은 public/images/ 폴더에 넣고, 아래 경로(파일 이름)만 바꿔주세요.

export const wedding = {
  groom: { name: '김신랑', father: '김아버지', mother: '이어머니', relation: '장남' },
  bride: { name: '이신부', father: '이아버지', mother: '박어머니', relation: '장녀' },

  // 예식 일시 (형식: 연-월-일T시:분:초)
  date: '2027-05-15T12:30:00',

  venue: {
    name: '더채플 웨딩홀',
    hall: '3층 그랜드홀',
    address: '서울특별시 강남구 테헤란로 123',
    tel: '02-123-4567',
  },

  greeting: `서로가 마주보며 다져온 사랑을
이제 함께 한 곳을 바라보며
걸어갈 수 있는 큰 사랑으로 키우고자 합니다.

저희 두 사람이 사랑의 이름으로
지켜나갈 수 있게 앞날을
축복해 주시면 감사하겠습니다.`,

  transport: [
    { title: '지하철', desc: '2호선 강남역 3번 출구 도보 5분' },
    { title: '버스', desc: '강남역 정류장 하차 (간선 140, 144 / 지선 4412)' },
    { title: '주차', desc: '건물 지하 주차장 2시간 무료' },
  ],

  cover: 'images/cover.svg',
  gallery: [
    'images/gallery-1.svg', 'images/gallery-2.svg', 'images/gallery-3.svg',
    'images/gallery-4.svg', 'images/gallery-5.svg', 'images/gallery-6.svg',
    'images/gallery-7.svg', 'images/gallery-8.svg', 'images/gallery-9.svg',
  ],

  accounts: {
    groom: [
      { role: '신랑', name: '김신랑', bank: '국민은행', number: '123-456-789012' },
      { role: '아버지', name: '김아버지', bank: '신한은행', number: '110-123-456789' },
      { role: '어머니', name: '이어머니', bank: '우리은행', number: '1002-123-456789' },
    ],
    bride: [
      { role: '신부', name: '이신부', bank: '카카오뱅크', number: '3333-01-1234567' },
      { role: '아버지', name: '이아버지', bank: '하나은행', number: '123-456789-01234' },
      { role: '어머니', name: '박어머니', bank: '농협', number: '302-1234-5678-91' },
    ],
  },
}
