import * as THREE from 'three'
import { FOV } from '../config'
import { colors } from './shapes'

// 그리는 도구(renderer), 장면(scene), 카메라, 조명
export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }) // 3D를 못 쓰는 기기면 여기서 오류가 남
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false // 그림자는 두 번에 한 번만 새로 그림 (render 참고)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(colors('background'))
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 160)

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

  const size = { width: 1, height: 1 }
  let odd = false
  return {
    renderer, scene, camera, size,
    // 화면 크기에 맞춤. 숨어 있을 때(청첩장을 보는 동안)는 크기가 0이라 건너뜀
    resize() {
      const { clientWidth, clientHeight } = canvas.parentElement
      if (!clientWidth || !clientHeight) return false
      size.width = clientWidth
      size.height = clientHeight
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      return true
    },
    render() {
      odd = !odd
      if (odd) renderer.shadowMap.needsUpdate = true
      renderer.render(scene, camera)
    },
    dispose() {
      scene.traverse((o) => {
        o.geometry?.dispose()
        o.material?.map?.dispose()
        o.material?.dispose()
        if (o.isInstancedMesh) o.dispose()
      })
      sun.dispose()
      renderer.dispose()
    },
  }
}
