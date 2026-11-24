// 온라인 하객석에서 자주 바꿀 만한 숫자를 모은 곳

export const WALK_SPEED = 3.6 // 1초에 걷는 거리(m)
export const PETALS = 140 // 축하 꽃잎 개수
export const FADE = 450 // 로비 ↔ 홀을 오갈 때 화면이 하얘지는 시간(밀리초)

export const BUBBLE_SECONDS = 6 // 하객을 눌렀을 때 말풍선이 떠 있는 시간
export const MY_BUBBLE_SECONDS = 8 // 내 모습을 볼 때
export const TAG_DISTANCE = 2.6 // 이만큼 가까우면 이름표가 보임(m)
export const TAG_COUNT = 5 // 한 번에 보이는 이름표 수
export const LOOK_DISTANCE = 2.3 // 이만큼 가까우면 하객이 돌아봄(m)

// 시점: 신랑신부, 나, 홀 전체 (시점 전환 버튼을 누르는 순서)
export const MODES = ['stage', 'me', 'whole']
export const MAX_YAW = { lobby: 0.6, stage: 0.6, me: 1.2, whole: 1.2 } // 좌우로 돌려 볼 수 있는 각도(라디안)
export const FOV = 26 // 카메라가 보는 각도
