import { FADE, TAG_COUNT } from '../config'
import { clamp } from '../core/shapes'
import { SPOTS } from '../places/lobby'

// 3D 위에 올리는 것들: 이름표, 말풍선, 로비의 버튼, 하얗게 덮는 막
export function createOverlay(root, { size, toScreen, labels, onSpot }) {
  function make(tag, className, parent = root) {
    const e = document.createElement(tag)
    e.className = className
    parent.append(e)
    return e
  }
  function put(element, x, y) {
    element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
  }
  function setText(element, text) {
    if (element.textContent !== text) element.textContent = text // textContent: 글자를 그대로만 넣음 (악성 코드 방지)
  }

  const tags = Array.from({ length: TAG_COUNT }, () => make('div', 'hall-tag'))
  const meTag = make('div', 'hall-tag me') // 내 자리 표시
  meTag.textContent = '나'
  const spots = Object.entries(SPOTS).map(([name, spot]) => {
    const button = make('button', 'hall-spot')
    button.type = 'button'
    button.onclick = () => onSpot(name)
    make('span', '', button).textContent = labels[name]
    return { name, spot, button, half: 0 }
  })
  const bubble = make('div', 'hall-bubble')
  const bubbleName = make('div', 'hall-bubble-name', bubble)
  const bubbleText = make('div', '', bubble)
  const fade = make('div', 'hall-fade')
  fade.style.transitionDuration = `${FADE}ms`

  let shown = null // 말풍선에 들어 있는 하객
  let bubbleSize = null // 크기를 재는 일은 느려서 한 번만 재고 기억함

  function drawSpots(next) {
    for (const s of spots) {
      s.button.hidden = !next
      if (!next) continue
      s.half ||= s.button.offsetWidth / 2 + 8
      const { label, hideAtEdge } = s.spot
      const [x, y] = toScreen(label.x, label.y, label.z)
      s.button.hidden = Boolean(hideAtEdge) && x < s.half * 0.6
      put(s.button, clamp(x, s.half, size.width - s.half), Math.max(y, Math.min(120, size.height * 0.2)))
      s.button.classList.toggle('next', s.name === next)
    }
  }
  function drawTags(near) {
    tags.forEach((tag, i) => {
      const g = near[i]
      tag.hidden = !g
      if (!g) return
      setText(tag, g.message.name)
      put(tag, ...toScreen(g.x, 1.72, g.z))
    })
  }
  function drawBubble(guest) {
    bubble.hidden = !guest
    if (!guest) return
    if (shown !== guest) {
      shown = guest
      setText(bubbleName, guest.message.name)
      setText(bubbleText, guest.message.text)
      bubbleSize = null
    }
    bubbleSize ??= { half: bubble.offsetWidth / 2 + 12, height: bubble.offsetHeight }
    const [x, y] = toScreen(guest.x, 1.9, guest.z)
    put(bubble, clamp(x, bubbleSize.half, size.width - bubbleSize.half), Math.max(y, bubbleSize.height + 70)) // 화면 밖으로 나가지 않게
  }

  return {
    fade(on) { fade.style.opacity = on ? 1 : 0 },
    // 화면 크기가 바뀌면 다시 잼
    resize() {
      bubbleSize = null
      for (const s of spots) s.half = 0
    },
    // next: 로비에서 강조할 버튼 (null이면 버튼을 모두 숨김), near: 이름표를 띄울 하객,
    // mySeat: '나'를 띄울 자리, selected: 말풍선을 띄울 하객
    draw({ next, near, mySeat, selected }) {
      drawSpots(next)
      drawTags(near)
      meTag.hidden = !mySeat
      if (mySeat) put(meTag, ...toScreen(mySeat.x, 1.75, mySeat.z))
      drawBubble(selected)
    },
    dispose() { root.replaceChildren() },
  }
}
