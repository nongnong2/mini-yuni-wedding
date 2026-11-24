import * as THREE from 'three'
import { HAIR_COUNT, makeSeatedCrowd, makeWalker } from './avatars'
import { BOOK, BOOK_STAND, DOOR_LABEL, DOOR_STAND, INSIDE, LOBBY, START, atDoor, buildLobby, lobbyBlocked } from './lobby'
import { makePathFinder } from './path'
import { BOUNDS, SEATS, blocked, buildRoom, floorHeight } from './room'
import { clamp, colors, hash, makeRandom, mix, place } from './shapes'

const SPEED = 3.6 // 1초에 걷는 거리(m)
const MAX_GUESTS = SEATS.length
const PETALS = 140

const turn = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from)) // 가까운 쪽으로 도는 각도

const FADE = 450 // 로비 ↔ 홀을 오갈 때 화면이 하얘지는 시간(밀리초)

/**
 * 로비(예식장 입구)와 온라인 웨딩홀을 canvas에 그림.
 * overlay: 이름표와 말풍선을 올릴 빈 div, screen: 스크린에 보일 { title, names, date, photo }
 * labels: 방명록과 문 위에 띄울 글자 { book, door }
 * onBook: 방명록 앞에 왔을 때, onDoor: 글을 안 남기고 문 앞에 왔을 때,
 * onWhere: 로비('lobby')나 홀('hall')에 도착했을 때, onSeat: 앉거나(true) 일어났을 때(false)
 */
export function createHall({ canvas, overlay, screen, labels, onBook, onDoor, onWhere, onSeat }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }) // 3D를 못 쓰는 기기면 여기서 오류가 남
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(colors('background'))
  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 160)

  // ---------- 조명 ----------
  scene.add(new THREE.HemisphereLight(colors('white'), colors('light-ground'), 2.15))
  const sun = new THREE.DirectionalLight(colors('light-sun'), 1.5)
  sun.position.set(-9, 17, 9)
  sun.target.position.set(0, 0, -1)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 45 })
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.03
  scene.add(sun, sun.target)

  // ---------- 두 공간 (한 번에 하나만 보임) ----------
  const lobbyGroup = new THREE.Group()
  const hallGroup = new THREE.Group()
  hallGroup.visible = false
  scene.add(lobbyGroup, hallGroup)
  const lobby = buildLobby(lobbyGroup, screen)
  const { entry } = buildRoom(hallGroup, screen)
  const rooms = {
    lobby: { bounds: LOBBY, blocked: lobbyBlocked, height: () => 0.03, findPath: makePathFinder(LOBBY, lobbyBlocked) },
    hall: { bounds: BOUNDS, blocked, height: floorHeight, findPath: makePathFinder(BOUNDS, blocked) },
  }
  let where = 'lobby'

  // ---------- 신랑신부 ----------
  const groom = makeWalker('groom')
  const bride = makeWalker('bride')
  groom.group.position.set(-0.5, 0.48, -9.5)
  groom.group.rotation.y = 0.22
  bride.group.position.set(0.5, 0.48, -9.5)
  bride.group.rotation.y = -0.22
  bride.armL.rotation.x = bride.armR.rotation.x = -0.7
  groom.armR.rotation.x = -0.35
  for (const c of [groom, bride]) {
    c.group.scale.setScalar(1.12)
    hallGroup.add(c.group)
  }

  // ---------- 앉은 하객 ----------
  const crowds = {} // 예: crowds.man0 = 머리색 1번 남자들
  for (const kind of ['man', 'woman']) {
    for (let h = 0; h < HAIR_COUNT; h++) {
      const mesh = makeSeatedCrowd(kind, h, MAX_GUESTS)
      hallGroup.add(mesh)
      crowds[kind + h] = { mesh, list: [] }
    }
  }
  let guests = []
  let mineId = null // 방금 내가 남긴 글

  // 글 id로 자리를 정하고, 이미 누가 앉았으면 다음 빈자리로
  function setMessages(messages) {
    const before = new Map(guests.map((g) => [g.message.id, g]))
    const taken = new Set()
    for (const c of Object.values(crowds)) c.list = []
    guests = messages.slice(-MAX_GUESTS).map((message) => {
      let seat = hash(`${message.id}seat`) % MAX_GUESTS
      while (taken.has(seat)) seat = (seat + 1) % MAX_GUESTS
      taken.add(seat)
      const guest = { rotation: Math.PI, hop: 0, ...before.get(message.id), message, ...SEATS[seat], phase: seat * 1.7 }
      const kind = message.avatar === 'man' ? 'man' : 'woman'
      crowds[kind + (hash(`${message.id}hair`) % HAIR_COUNT)].list.push(guest)
      return guest
    })
    for (const c of Object.values(crowds)) c.mesh.count = c.list.length
    if (selected) selected = guests.find((g) => g.message.id === selected.message.id) ?? null
    if (me.seat) {
      me.seat = guests.find((g) => g.message.id === mineId) ?? null
      if (!me.seat) onSeat(false)
    }
  }

  // ---------- 나 ----------
  const me = { walker: null, ...START, y: 0, rotation: Math.PI, phase: 0, speed: 0, seat: null }
  const stick = { x: 0, y: 0 }
  const keys = new Set()
  let path = []
  let arrive = null // 걸어가서 도착하면 할 일
  let busy = false // 문을 지나는 동안에는 조작을 받지 않음
  let doorOpen = false
  let wasAtDoor = false
  let yaw = 0 // 시점 회전
  let focus = null // 카메라가 비추는 하객
  let selected = null // 말풍선을 띄운 하객
  let selectedUntil = 0
  let focusTimer = 0

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.28, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: colors('text-accent'), transparent: true, opacity: 0.75, depthWrite: false }),
  )
  scene.add(marker)

  function enter(kind) {
    me.walker = makeWalker(kind)
    scene.add(me.walker.group)
  }
  // (x, z)까지 걸어간 뒤 then을 실행
  function walkTo(target, then = null) {
    path = rooms[where].findPath(me, target)
    arrive = then
  }
  const goBook = () => { if (!busy) walkTo(BOOK_STAND, () => { me.rotation = Math.PI; onBook() }) }
  const goDoor = () => { if (!busy) { wasAtDoor = false; walkTo(DOOR_STAND) } }

  // 문 앞에 옴: 열려 있으면 안으로 걸어 들어감
  function reachDoor() {
    path = []
    arrive = null
    if (doorOpen) passDoor()
    else onDoor()
  }
  function passDoor() {
    doorOpen = busy = true
    path = [{ x: 0, z: DOOR_STAND.z }, INSIDE]
    arrive = () => change('hall')
  }
  // 화면을 하얗게 덮은 사이에 로비 ↔ 홀을 바꿈
  function change(next) {
    busy = true
    path = []
    arrive = null
    fade.style.opacity = 1
    changeTimer = setTimeout(() => {
      where = next
      lobbyGroup.visible = next === 'lobby'
      hallGroup.visible = next === 'hall'
      const inHall = next === 'hall'
      Object.assign(me, inHall ? { x: 0, z: 7.4, rotation: Math.PI, seat: null } : { x: 0, z: -1.4, rotation: 0, seat: null })
      selected = focus = null
      yaw = 0
      wasAtDoor = false
      Object.assign(view, viewGoal())
      if (inHall) {
        view.distance *= 1.7 // 멀리서 시작해 천천히 다가옴
        path = [{ x: 0, z: 5.4 }]
      }
      fade.style.opacity = 0
      busy = false
      onWhere(next)
    }, FADE)
  }
  // 글을 남김: 로비의 문이 열리고 꽃잎이 날림
  function wrote(id) {
    mineId = id
    doorOpen = true
    scatter(me)
  }
  function scatter({ x, z }) {
    for (const p of petals) {
      p.x = x + random(-2.6, 2.6)
      p.z = z + random(-2.6, 2.6)
      p.y = random(3, 7)
    }
  }
  function standUp() {
    onSeat(false)
    me.x = me.seat.x < 0 ? -0.9 : 0.9
    me.z = clamp(me.seat.z, -6.5, 5.9)
    me.seat = null
    selected = null
  }
  function select(guest, seconds) {
    selected = guest
    guest.hop = 1
    selectedUntil = now() + seconds
    bubbleName.textContent = guest.message.name // textContent: 글자를 그대로만 넣음 (악성 코드 방지)
    bubbleText.textContent = guest.message.text
  }
  // 내 자리 옆 통로까지 걸어가 앉고 축하 꽃잎을 뿌림
  function sit() {
    const seat = guests.find((g) => g.message.id === mineId)
    if (seat && !busy) walkTo({ x: seat.x < 0 ? -0.9 : 0.9, z: clamp(seat.z, -6.5, 5.9) }, sitDown)
  }
  function sitDown() {
    const guest = guests.find((g) => g.message.id === mineId) // 걷는 사이에 글이 지워졌을 수 있음
    if (!guest) return
    me.seat = focus = guest
    onSeat(true)
    select(guest, 8)
    scatter(guest)
    clearTimeout(focusTimer)
    focusTimer = setTimeout(() => { focus = null }, 4200)
  }

  function move(dt) {
    if (!me.walker || focus) return
    const { blocked } = rooms[where]
    let ix = stick.x + (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)
    let iy = stick.y + (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)
    const length = Math.hypot(ix, iy)
    if (length > 1) { ix /= length; iy /= length }
    let go = !busy && length > 0.12 ? Math.min(1, length) : 0
    // 화면 기준 방향을 홀 기준 방향으로 바꿈
    const c = Math.cos(view.yaw)
    const s = Math.sin(view.yaw)
    let vx = ix * c + iy * s
    let vz = -ix * s + iy * c

    if (go) {
      path = []
      arrive = null
      if (me.seat) standUp()
    } else if (path.length) { // 누른 곳까지 자동으로 걷기
      const px = path[0].x - me.x
      const pz = path[0].z - me.z
      const distance = Math.hypot(px, pz)
      if (distance < 0.09) path.shift()
      else {
        go = Math.min(1, distance / (SPEED * dt || 1))
        vx = (px / distance) * go
        vz = (pz / distance) * go
      }
    }
    if (!path.length && arrive) { // 도착
      const then = arrive
      arrive = null
      then()
    }
    if (where === 'lobby' && !busy) {
      const here = atDoor(me.x, me.z)
      if (here && !wasAtDoor) reachDoor()
      wasAtDoor = here
    }
    me.speed = mix(me.speed, go * SPEED, Math.min(1, dt * 10))
    if (!go) return
    const nx = me.x + vx * SPEED * dt
    const nz = me.z + vz * SPEED * dt
    if (busy || !blocked(nx, me.z)) me.x = nx // 가로·세로를 따로 검사해서 벽을 따라 미끄러지게
    if (busy || !blocked(me.x, nz)) me.z = nz
    me.rotation += turn(me.rotation, Math.atan2(vx, vz)) * Math.min(1, dt * 12)
  }

  function animatePeople(dt, time) {
    if (me.walker) {
      const w = me.walker
      const k = clamp(me.speed / SPEED, 0, 1)
      me.phase += dt * 11 * k
      me.y = mix(me.y, rooms[where].height(me.x, me.z), Math.min(1, dt * 12))
      w.group.visible = !me.seat
      w.group.position.set(me.x, me.y + Math.abs(Math.sin(me.phase)) * 0.07 * k, me.z)
      w.group.rotation.y = me.rotation
      const swing = Math.sin(me.phase) * 0.75 * k
      w.legL.rotation.x = swing
      w.legR.rotation.x = -swing
      w.armL.rotation.x = -swing * 0.9
      w.armR.rotation.x = swing * 0.9
      w.head.rotation.z = Math.sin(time * 1.5) * 0.03
    }
    if (where !== 'hall') return
    for (const { mesh, list } of Object.values(crowds)) {
      list.forEach((g, i) => {
        const near = me.walker && !me.seat && Math.hypot(g.x - me.x, g.z - me.z) < 2.3
        const want = g === selected ? 0 : near ? Math.atan2(me.x - g.x, me.z - g.z) : Math.PI
        g.rotation += turn(g.rotation, want) * Math.min(1, dt * 7) // 가까이 가거나 누르면 돌아봄
        g.hop = Math.max(0, g.hop - dt * 2)
        const size = g.message.id === mineId && !me.seat ? 0.001 : 1 // 내가 일어나면 자리는 비움
        mesh.setMatrixAt(i, place(
          g.x, 0.4 + Math.sin(time * 1.8 + g.phase) * 0.012 + Math.sin(g.hop * Math.PI) * 0.28, g.z - 0.03,
          0, g.rotation + Math.sin(time * 0.6 + g.phase) * 0.06, Math.sin(time * 1.1 + g.phase) * 0.025, size))
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    for (const [c, offset] of [[groom, 0], [bride, 1.3]]) {
      c.body.rotation.z = Math.sin(time * 1.6 + offset) * 0.03
      c.head.rotation.z = Math.sin(time * 1.6 + offset) * 0.06
    }
    groom.armL.rotation.z = -1.9 + Math.sin(time * 5) * 0.28 * (Math.sin(time * 0.7) > 0 ? 1 : 0) // 손 흔들기
  }

  // ---------- 축하 꽃잎 ----------
  const random = makeRandom(5)
  const petals = Array.from({ length: PETALS }, () => ({ x: 0, y: -9, z: 0, a: random(0, 6) }))
  const petalMesh = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.09, 10).scale(1, 0.65, 1),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }), PETALS)
  const petalColors = ['white', 'cream', 'pink-soft', 'pink'].map(colors)
  petals.forEach((_, i) => petalMesh.setColorAt(i, new THREE.Color(petalColors[i % 4])))
  petalMesh.frustumCulled = false
  scene.add(petalMesh)
  function animatePetals(dt, time) {
    petals.forEach((p, i) => {
      p.y -= dt * 1.5
      petalMesh.setMatrixAt(i, place(p.x + Math.sin(time * 2 + p.a) * 0.25, p.y, p.z, time * 2 + p.a, time + p.a, 0, p.y > 0.05 ? 1 : 0.0001))
    })
    petalMesh.instanceMatrix.needsUpdate = true
  }

  // ---------- 카메라 ----------
  const view = { x: 0, y: 0, z: 0, distance: 60, pitch: 0.7, yaw: 0.5 }
  let width = 1
  let height = 1
  function viewGoal() {
    const t = Math.tan((camera.fov * Math.PI) / 360)
    if (!me.walker) { // 입장 전: 로비 전체가 보이게
      const wide = camera.aspect > 1
      return { x: 0, y: 1, z: wide ? 2 : 2.4, distance: Math.max(11 / (2 * t * camera.aspect), 11 / (2 * t)), pitch: 0.5, yaw: wide ? 0.3 : 0.2 }
    }
    if (where === 'lobby') {
      return { x: me.x * 0.45, y: 1.3, z: me.z * 0.35 - 1.1, distance: clamp(7.4 / (2 * t * Math.min(camera.aspect, 1)), 20, 36), pitch: 0.42, yaw }
    }
    const distance = clamp(6.4 / (2 * t * Math.min(camera.aspect, 1)), 20, 28)
    if (focus) return { x: focus.x, y: 0.9, z: focus.z, distance: distance * 0.7, pitch: 0.86, yaw }
    return { x: me.x * 0.8, y: 0.9, z: me.z - 1.2, distance, pitch: 0.56, yaw }
  }
  function moveCamera(k) {
    const goal = viewGoal()
    for (const name in view) view[name] = mix(view[name], goal[name], k)
    camera.position.set(
      view.x + Math.sin(view.yaw) * Math.cos(view.pitch) * view.distance,
      view.y + Math.sin(view.pitch) * view.distance,
      view.z + Math.cos(view.yaw) * Math.cos(view.pitch) * view.distance)
    camera.lookAt(view.x, view.y, view.z)
    camera.updateMatrixWorld()
  }
  function resize() {
    width = canvas.parentElement.clientWidth
    height = canvas.parentElement.clientHeight
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  // ---------- 이름표와 말풍선 ----------
  function div(className, parent = overlay) {
    const e = document.createElement('div')
    e.className = className
    parent.append(e)
    return e
  }
  const tags = Array.from({ length: 5 }, () => div('hall-tag'))
  function spot(text, onClick) { // 방명록과 문 위에 떠 있는 버튼
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'hall-spot'
    button.append(Object.assign(document.createElement('span'), { textContent: text }))
    button.onclick = onClick
    overlay.append(button)
    return button
  }
  const bookSpot = spot(labels.book, goBook)
  const doorSpot = spot(labels.door, goDoor)
  const bubble = div('hall-bubble')
  const bubbleName = div('hall-bubble-name', bubble)
  const bubbleText = div('', bubble)
  const fade = div('hall-fade')
  fade.style.transitionDuration = `${FADE}ms`
  let changeTimer = 0
  const point = new THREE.Vector3()
  function toScreen(x, y, z) {
    point.set(x, y, z).project(camera)
    return [(point.x * 0.5 + 0.5) * width, (-point.y * 0.5 + 0.5) * height]
  }
  function put(element, x, y) {
    element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
  }
  function drawOverlay(time) {
    const showSpots = Boolean(me.walker) && where === 'lobby' && !busy
    for (const [button, p, lift] of [[bookSpot, BOOK, 0.42], [doorSpot, DOOR_LABEL, 0]]) {
      button.hidden = !showSpots
      if (!showSpots) continue
      const [x, y] = toScreen(p.x, p.y + lift, p.z)
      const half = button.offsetWidth / 2 + 8
      put(button, clamp(x, half, width - half), Math.max(y, 120))
    }
    bookSpot.classList.toggle('next', !doorOpen) // 다음에 할 일을 강조
    doorSpot.classList.toggle('next', doorOpen)
    const near = where !== 'hall' || me.seat ? [] : guests
      .filter((g) => g !== selected && g.message.id !== mineId)
      .map((g) => ({ g, d: Math.hypot(g.x - me.x, g.z - me.z) }))
      .filter((n) => n.d < 2.6)
      .sort((a, b) => a.d - b.d)
    tags.forEach((tag, i) => {
      tag.hidden = !near[i]
      if (!near[i]) return
      const { g } = near[i]
      tag.textContent = g.message.name
      put(tag, ...toScreen(g.x, 1.72, g.z))
    })
    if (selected && time > selectedUntil && !focus) selected = null
    bubble.hidden = !selected
    if (selected) {
      const [x, y] = toScreen(selected.x, 1.9, selected.z)
      const half = bubble.offsetWidth / 2 + 12
      put(bubble, clamp(x, half, width - half), Math.max(y, bubble.offsetHeight + 70)) // 화면 밖으로 나가지 않게
    }
  }

  // 화면을 톡 누름: 하객이면 말풍선, 방명록·문이면 그 일을 하고, 바닥이면 그곳으로 걷기
  const ray = new THREE.Raycaster()
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  function tap(clientX, clientY) {
    if (!me.walker || focus || busy) return
    const { bounds, findPath } = rooms[where]
    const box = canvas.getBoundingClientRect()
    ray.setFromCamera(new THREE.Vector2(((clientX - box.left) / width) * 2 - 1, (-(clientY - box.top) / height) * 2 + 1), camera)
    if (where === 'lobby') {
      const hit = ray.intersectObjects([lobby.door, lobby.book])[0]
      if (hit) { (hit.object === lobby.book ? goBook : goDoor)(); return }
    }
    let best = null
    for (const { mesh, list } of Object.values(crowds)) {
      if (where !== 'hall' || !list.length) continue
      mesh.computeBoundingSphere()
      const hit = ray.intersectObject(mesh)[0]
      if (hit && (!best || hit.distance < best.distance)) best = { distance: hit.distance, guest: list[hit.instanceId] }
    }
    if (best) { select(best.guest, 6); return }
    selected = null
    const p = ray.ray.intersectPlane(ground, new THREE.Vector3())
    if (!p || p.x < bounds.x0 || p.x > bounds.x1 || p.z < bounds.z0 || p.z > bounds.z1) return
    if (me.seat) standUp()
    arrive = null
    path = findPath(me, p)
  }

  // 캐릭터 고르기 화면에 쓸 그림
  function portrait(kind) {
    const s = new THREE.Scene()
    const w = makeWalker(kind)
    w.group.rotation.y = kind === 'man' ? 0.28 : -0.28
    const light = new THREE.DirectionalLight(colors('light-sun'), 1.5)
    light.position.set(-2, 3, 4)
    s.background = new THREE.Color(colors('white'))
    s.add(w.group, light, new THREE.HemisphereLight(colors('white'), colors('light-ground'), 2.1))
    const c = new THREE.PerspectiveCamera(22, 184 / 208, 0.1, 30)
    c.position.set(0, 1.15, 4.7)
    c.lookAt(0, 0.76, 0)
    renderer.setPixelRatio(1)
    renderer.setSize(276, 312, false)
    renderer.render(s, c)
    return canvas.toDataURL()
  }
  const portraits = { woman: portrait('woman'), man: portrait('man') }

  // ---------- 매 순간 다시 그리기 ----------
  const startTime = performance.now()
  const now = () => (performance.now() - startTime) / 1000
  let last = 0
  let frameId = 0
  function frame() {
    const time = now()
    const dt = Math.min(0.05, time - last)
    last = time
    move(dt)
    animatePeople(dt, time)
    animatePetals(dt, time)
    lobby.animate(doorOpen, dt)
    const showEntry = me.z > 6.6 && !focus
    entry.forEach((o) => { o.visible = showEntry })
    marker.visible = path.length > 0 && !busy
    if (path.length) {
      const end = path[path.length - 1]
      marker.position.set(end.x, rooms[where].height(end.x, end.z) + 0.1, end.z)
    }
    moveCamera(1 - Math.exp(-dt * 4))
    renderer.render(scene, camera)
    drawOverlay(time)
    frameId = requestAnimationFrame(frame)
  }
  resize()
  moveCamera(1)
  frame()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas.parentElement)

  return {
    portraits, enter, setMessages, tap, wrote, passDoor, sit,
    toLobby() { if (!busy) change('lobby') },
    setStick(x, y) { stick.x = x; stick.y = y },
    setKey(code, down) { if (down) keys.add(code); else keys.delete(code) },
    clearKeys() { keys.clear() },
    get yaw() { return yaw },
    setYaw(value) { const max = where === 'lobby' ? 0.6 : 1.2; yaw = clamp(value, -max, max) },
    dispose() {
      cancelAnimationFrame(frameId)
      clearTimeout(focusTimer)
      clearTimeout(changeTimer)
      observer.disconnect()
      overlay.replaceChildren()
      scene.traverse((o) => {
        o.geometry?.dispose()
        o.material?.map?.dispose()
        o.material?.dispose()
      })
      renderer.dispose()
    },
  }
}
