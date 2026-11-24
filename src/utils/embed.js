// 하객석의 「모바일 청첩장」 창(iframe: 페이지 안에 다른 페이지를 띄우는 칸) 안에서 열렸는지
export const isEmbedded = window.self !== window.top

const CLOSE = 'close-invitation'

// 창 안에서: 하객석으로 돌려보내 달라고 바깥에 알림
export function askToClose() {
  window.parent.postMessage(CLOSE, window.location.origin)
}

// 바깥(하객석)에서: 위의 알림을 기다림
export function onAskToClose(callback) {
  const receive = (e) => {
    if (e.origin === window.location.origin && e.data === CLOSE) callback() // 같은 사이트가 보낸 것만
  }
  window.addEventListener('message', receive)
  return () => window.removeEventListener('message', receive)
}
