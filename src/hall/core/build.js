import * as THREE from 'three'
import { ball, clamp, colors, makeRandom, makeShadow, merge, mix, place } from './shapes'

// 로비와 홀을 만들 때 함께 쓰는 도구

export const standard = (options) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...options })

// group(물건을 담는 묶음)에 도형과 꽃을 더하는 함수들
export function makeBuilder(group, seed) {
  const random = makeRandom(seed)
  const flowerShape = makeFlowerShape(colors('white'))
  const flowerColors = ['white', 'cream', 'white', 'pink-soft', 'leaf', 'leaf-soft'].map(colors)
  let flowers = []

  function add(geometry, material, x = 0, y = 0, z = 0, shadow = true) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = shadow
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }
  function addMany(geometry, material, matrices, tints) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    tints?.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.castShadow = mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }
  // 작은 알갱이가 모인 수국 모양 꽃다발을 모아 두었다가 plant로 한 번에 심음
  function bunch(x, y, z, r, count, flat = 0.7) {
    for (let i = 0; i < count * 1.7; i++) {
      const a = random(0, Math.PI * 2)
      const d = Math.sqrt(random()) * r
      flowers.push({
        matrix: place(x + Math.cos(a) * d, y + random(0, 0.5) * r * flat + (r - d) * 0.5, z + Math.sin(a) * d,
          random(0, 6), random(0, 6), 0, random(0.1, 0.17) * Math.min(1.25, r + 0.6)),
        color: new THREE.Color(flowerColors[random() < 0.24 ? 4 + Math.floor(random(0, 2)) : Math.floor(random(0, 4))]),
      })
    }
  }
  function plant() {
    const mesh = addMany(flowerShape, standard({ vertexColors: true, roughness: 0.95 }), flowers.map((f) => f.matrix), flowers.map((f) => f.color))
    const shadow = makeShadow(mesh, new THREE.IcosahedronGeometry(1, 0))
    flowers = []
    return [mesh, shadow]
  }
  return { add, addMany, bunch, plant, random }
}

// 벽. holes는 창문이나 문 자리의 구멍(THREE.Path)
export function wall(length, height, holes) {
  const s = new THREE.Shape()
  s.moveTo(-length / 2, 0)
  s.lineTo(-length / 2, height)
  s.lineTo(length / 2, height)
  s.lineTo(length / 2, 0)
  s.holes.push(...holes)
  return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelSize: 0.04, bevelThickness: 0.04, bevelOffset: -0.04, bevelSegments: 2, curveSegments: 24 })
}

// 위가 둥근 구멍 (r: 폭의 절반, bottom~top: 곧은 부분의 높이)
export function archHole(cx, r, bottom, top) {
  const p = new THREE.Path()
  p.moveTo(cx - r, bottom)
  p.lineTo(cx - r, top)
  p.absarc(cx, top, r, Math.PI, 0, true)
  p.lineTo(cx + r, bottom)
  p.lineTo(cx - r, bottom)
  return p
}

export function makeTree() {
  const leaf = colors('leaf')
  return merge([
    [new THREE.CylinderGeometry(0.3, 0.24, 0.5, 20), colors('white'), place(0, 0.25, 0)],
    [new THREE.CylinderGeometry(0.05, 0.06, 1, 8), colors('wood'), place(0, 0.9, 0)],
    [ball(0.55, 20, 16), leaf, place(0, 1.75, 0)],
    [ball(0.4, 18, 14), colors('leaf-soft'), place(0.28, 2.1, 0.1)],
    [ball(0.36, 18, 14), leaf, place(-0.3, 1.98, -0.1)],
  ])
}

function makeFlowerShape(white) {
  const parts = []
  const n = 13
  for (let i = 0; i < n; i++) { // 공 표면에 고르게 알갱이를 놓음
    const y = 1 - ((i + 0.5) / n) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * 2.39996
    parts.push([new THREE.IcosahedronGeometry(0.44, 0), white, place(Math.cos(a) * r * 0.74, y * 0.74, Math.sin(a) * r * 0.74, a, i, 0)])
  }
  const g = merge(parts)
  const { position, normal, color } = g.attributes
  const p = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i)
    const shade = mix(0.82, 1, clamp(p.length() * 1.6 - 0.9, 0, 1)) // 안쪽은 조금 어둡게
    v.fromBufferAttribute(normal, i).multiplyScalar(0.55).add(p.normalize()).normalize()
    normal.setXYZ(i, v.x, v.y, v.z)
    color.setXYZ(i, shade, shade, shade)
  }
  return g
}

// 사진과 글씨를 그린 그림판. draw(붓, 사진 넣는 함수)는 사진과 글꼴이 준비되면 다시 불림
export function makePicture(width, height, photo, sample, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const pen = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const serif = getComputedStyle(document.documentElement).getPropertyValue('--serif')
  const image = new Image()

  // 사진을 칸에 꽉 차게 잘라서 넣음
  function putPhoto(x, y, w, h) {
    if (!image.naturalWidth) return
    const k = Math.max(w / image.naturalWidth, h / image.naturalHeight)
    pen.drawImage(image, (image.naturalWidth - w / k) / 2, (image.naturalHeight - h / k) / 2, w / k, h / k, x, y, w, h)
  }
  function redraw() {
    const g = pen.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, colors('pink-soft'))
    g.addColorStop(0.4, colors('cream'))
    g.addColorStop(1, colors('white'))
    pen.fillStyle = g
    pen.fillRect(0, 0, width, height)
    pen.textAlign = 'center'
    draw(pen, putPhoto, serif)
    texture.needsUpdate = true
  }
  redraw()
  image.onload = redraw
  image.src = photo
  document.fonts?.load(`600 68px ${serif}`, sample).then(redraw).catch(() => {})
  return texture
}
