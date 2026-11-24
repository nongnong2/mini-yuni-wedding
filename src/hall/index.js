import * as THREE from 'three'
import { BUBBLE_SECONDS, FADE, MAX_YAW, MODES, MY_BUBBLE_SECONDS } from './config'
import { createCameraman } from './core/camera'
import { makePathFinder } from './core/path'
import { clamp } from './core/shapes'
import { createStage } from './core/stage'
import { createPetals } from './effects/petals'
import { createCouple } from './people/couple'
import { createGuests } from './people/guests'
import { createPlayer } from './people/player'
import { makePortraits } from './people/portraits'
import { aisleBeside, buildHall, hall } from './places/hall'
import { SPOTS, buildLobby, lobby } from './places/lobby'
import { createControls } from './ui/controls'
import { createOverlay } from './ui/overlay'
import { createPicker } from './ui/picker'

/**
 * 로비(예식장 입구)와 온라인 웨딩홀을 canvas에 그림. 각 부품을 모아 움직이는 곳.
 * overlay: 이름표와 말풍선을 올릴 빈 div, screen: 스크린에 보일 { title, names, date, photo }
 * labels: 로비 버튼의 글자 { book, door, invite }
 * on: 일이 생겼을 때 부를 함수들
 *   book: 방명록 앞에 옴, invite: 안내판 앞에 옴, door: 글을 안 남기고 문 앞에 옴,
 *   where: 로비('lobby')나 홀('hall')에 도착, seat: 앉음(true)·일어남(false), mode: 시점이 바뀜(MODES 중 하나)
 */
export function createHall({ canvas, overlay: overlayRoot, screen, labels, on }) {
  const stage = createStage(canvas)
  const { scene } = stage

  // ---------- 두 공간 (한 번에 하나만 보임) ----------
  const groups = { lobby: new THREE.Group(), hall: new THREE.Group() }
  groups.hall.visible = false
  scene.add(groups.lobby, groups.hall)
  const lobbyParts = buildLobby(groups.lobby, screen)
  const hallParts = buildHall(groups.hall, screen)
  const places = { lobby, hall }
  const findPath = { lobby: makePathFinder(lobby.bounds, lobby.blocked), hall: makePathFinder(hall.bounds, hall.blocked) }

  // ---------- 사람과 효과 ----------
  const couple = createCouple(groups.hall)
  const guests = createGuests(groups.hall)
  const player = createPlayer(scene, lobby.start)
  const petals = createPetals(scene)

  // ---------- 화면과 조작 ----------
  const cameraman = createCameraman(stage)
  const controls = createControls()
  const picker = createPicker(canvas, stage.camera)
  const overlay = createOverlay(overlayRoot, { size: stage.size, toScreen: cameraman.toScreen, labels, onSpot: goSpot })
  const portraits = makePortraits(stage.renderer)

  // ---------- 지금 상태 ----------
  const state = {
    player,
    where: 'lobby',
    mode: 'me', // 시점
    yaw: 0, // 시점 회전
    busy: false, // 문을 지나는 동안에는 조작을 받지 않음
    doorOpen: false,
    mineId: null, // 방금 내가 남긴 글
    selected: null, // 말풍선을 띄운 하객
  }
  let selectedUntil = 0
  let wasAtDoor = false
  let changeTimer = 0
  let frameId = 0
  let time = 0 // 흐른 시간(초)
  let last = performance.now()

  // ---------- 걷기 ----------
  function walkTo(target, then) {
    if (state.mode !== 'me') setMode('me')
    player.follow(findPath[state.where](player, target), then)
  }
  // 로비의 방명록·문·안내판으로 감
  function goSpot(name) {
    if (state.busy) return
    if (name === 'door') {
      wasAtDoor = false // 이미 문 앞이어도 checkDoor가 다시 확인하게
      walkTo(SPOTS.door.stand)
      return
    }
    walkTo(SPOTS[name].stand, () => {
      player.rotation = Math.PI
      on[name]()
    })
  }

  // ---------- 문과 공간 이동 ----------
  function checkDoor() {
    if (state.where !== 'lobby' || state.busy) return
    const here = lobby.atDoor(player.x, player.z)
    if (here && !wasAtDoor) {
      player.stop()
      if (state.doorOpen) passDoor()
      else on.door()
    }
    wasAtDoor = here
  }
  function passDoor() {
    state.doorOpen = state.busy = true
    player.follow(lobby.doorway, () => changePlace('hall', hall.start))
  }
  // 화면을 하얗게 덮은 사이에 로비 ↔ 홀을 바꿈
  function changePlace(next, start) {
    state.busy = true
    player.stop()
    overlay.fade(true)
    changeTimer = setTimeout(() => {
      state.where = next
      for (const name in groups) groups[name].visible = name === next
      Object.assign(player, start, { seat: null })
      state.selected = null
      setMode('me')
      wasAtDoor = false
      cameraman.jump(state, next === 'hall' ? 1.7 : 1) // 홀은 멀리서 시작해 천천히 다가옴
      if (next === 'hall') player.follow([hall.firstStep])
      overlay.fade(false)
      state.busy = false
      on.where(next)
    }, FADE)
  }

  // ---------- 앉기와 시점 ----------
  function select(guest, seconds) {
    state.selected = guest
    guest.hop = 1
    selectedUntil = time + seconds
  }
  function setMode(next) {
    state.mode = next
    state.yaw = 0
    if (player.seat && next === 'me') select(player.seat, MY_BUBBLE_SECONDS) // 내 모습을 볼 때는 내 글도 함께
    else if (player.seat) state.selected = null
    on.mode(next)
  }
  // 내 자리 옆 통로까지 걸어가 앉고 축하 꽃잎을 뿌림
  function sit() {
    const guest = guests.find(state.mineId)
    if (guest && !state.busy) walkTo(aisleBeside(guest), sitDown)
  }
  function sitDown() {
    const guest = guests.find(state.mineId) // 걷는 사이에 글이 지워졌을 수 있음
    if (!guest) return
    player.seat = guest
    on.seat(true)
    petals.scatter(guest)
    setMode('stage') // 앉으면 신랑신부가 보이는 시점으로
  }
  function stand() {
    if (!player.seat || state.busy) return
    Object.assign(player, aisleBeside(player.seat), { seat: null })
    state.selected = null
    on.seat(false)
    setMode('me')
  }

  // ---------- 화면을 톡 누름 ----------
  function tap(clientX, clientY) {
    if (!player.walker || state.busy) return
    picker.aim(clientX, clientY)
    if (state.where === 'lobby') {
      const name = picker.name(lobbyParts.targets)
      if (name) { goSpot(name); return }
    } else {
      const guest = guests.pick(picker.ray)
      if (guest) { select(guest, BUBBLE_SECONDS); return }
    }
    state.selected = null
    if (player.seat) return // 앉아 있을 때 실수로 일어나지 않게
    const point = picker.floor(places[state.where].bounds)
    if (point) walkTo(point)
  }

  // ---------- 매 순간 다시 그리기 ----------
  const still = { x: 0, z: 0 }
  function step(dt) {
    const place = places[state.where]
    if (player.walker) {
      const input = state.busy ? still : controls.direction(cameraman.view.yaw)
      if (input.x || input.z) {
        if (player.seat) stand()
        else if (state.mode !== 'me') setMode('me') // 걸으면 나를 따라오는 시점으로
      }
      player.move(dt, input, place.blocked, state.busy)
      checkDoor()
    }
    player.animate(dt, time, place.floorHeight, !state.busy)
    petals.animate(dt, time)
    if (state.where === 'lobby') lobbyParts.animate(state.doorOpen, dt)
    else {
      guests.animate(dt, time, state)
      couple.animate(time)
      const showEntry = hall.nearEntry(player.z) && state.mode === 'me' && !player.seat // 안에서는 시야를 가려서 숨김
      for (const o of hallParts.entry) o.visible = showEntry
    }
    if (state.selected && time > selectedUntil) state.selected = null
  }
  function draw(dt) {
    cameraman.move(state, 1 - Math.exp(-dt * 4))
    stage.render()
    const inLobby = state.where === 'lobby'
    overlay.draw({
      next: player.walker && inLobby && !state.busy ? (state.doorOpen ? 'door' : 'book') : null, // 다음에 할 일
      near: inLobby || player.seat ? [] : guests.near(state),
      mySeat: state.mode === 'me' ? null : player.seat,
      selected: state.selected,
    })
  }
  function frame() {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    time += dt
    step(dt)
    draw(dt)
    frameId = requestAnimationFrame(frame)
  }
  function resize() {
    if (stage.resize()) overlay.resize()
  }
  resize()
  cameraman.jump(state)
  frame()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas.parentElement)

  return {
    portraits,
    enter: player.enter,
    tap, sit, stand, passDoor,
    toLobby() { if (!state.busy) changePlace('lobby', lobby.back) },
    nextMode() { if (!state.busy) setMode(MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]) },

    setMessages(messages) {
      guests.setMessages(messages)
      if (state.selected) state.selected = guests.find(state.selected.message.id)
      if (player.seat) {
        player.seat = guests.find(state.mineId)
        if (!player.seat) on.seat(false)
      }
    },
    // 글을 남김: 로비의 문이 열리고 꽃잎이 날림
    wrote(id) {
      state.mineId = id
      state.doorOpen = true
      petals.scatter(player)
    },

    setStick: controls.setStick,
    setKey: controls.setKey,
    clearInput: controls.clear,
    get yaw() { return state.yaw },
    setYaw(value) {
      const max = MAX_YAW[state.where === 'lobby' ? 'lobby' : state.mode]
      state.yaw = clamp(value, -max, max)
    },

    // 청첩장을 보는 동안에는 그리기를 멈춤 (배터리 절약)
    pause(stop) {
      cancelAnimationFrame(frameId)
      controls.clear()
      last = performance.now()
      if (!stop) frame()
    },
    dispose() {
      cancelAnimationFrame(frameId)
      clearTimeout(changeTimer)
      observer.disconnect()
      overlay.dispose()
      stage.dispose()
    },
  }
}
