import * as THREE from 'three'
import { colors } from '../core/shapes'
import { makeWalker } from './avatars'

// 캐릭터 고르기 화면에 쓸 그림
export function makePortraits(renderer) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(colors('white'))
  const light = new THREE.DirectionalLight(colors('light-sun'), 1.5)
  light.position.set(-2, 3, 4)
  scene.add(light, new THREE.HemisphereLight(colors('white'), colors('light-ground'), 2.1))
  const camera = new THREE.PerspectiveCamera(22, 184 / 208, 0.1, 30)
  camera.position.set(0, 1.15, 4.7)
  camera.lookAt(0, 0.76, 0)
  renderer.setPixelRatio(1)
  renderer.setSize(276, 312, false)

  function draw(kind, rotation) {
    const { group, dispose } = makeWalker(kind)
    group.rotation.y = rotation
    scene.add(group)
    renderer.render(scene, camera)
    scene.remove(group)
    dispose()
    return renderer.domElement.toDataURL()
  }
  return { woman: draw('woman', -0.28), man: draw('man', 0.28) }
}
