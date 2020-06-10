import { Camera, Vector3, Sphere, Scene } from './types'
import { render } from './raytracer'

const camera: Camera = {
  position: { x: 0, y: 1.8, z: 10 },
  fov: 45,
  direction: { x: 0, y: 3, z: 0 },
}

const lights: Vector3[] = [{ x: -30, y: -10, z: 20 }]

const spheres: Sphere[] = [
  {
    position: { x: 0, y: 3.5, z: -3 },
    radius: 3,
    color: { r: 155, g: 200, b: 155 },
    specular: 0.2,
    lambert: 0.7,
    ambient: 0.1,
  },
  {
    position: { x: -4, y: 2, z: -1 },
    radius: 0.2,
    color: { r: 155, g: 155, b: 155 },
    specular: 0.2,
    lambert: 0.9,
    ambient: 0.0,
  },
  {
    position: { x: -4, y: 3, z: -1 },
    radius: 0.1,
    color: { r: 255, g: 255, b: 255 },
    specular: 0.2,
    lambert: 0.7,
    ambient: 0.1,
  },
]

const init = (): void => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    return
  }
  const width = 640 * 0.5
  const height = 480 * 0.5
  canvas.style.display = 'block'
  canvas.style.margin = '0 auto'
  canvas.style.width = `${width * 2}px`
  canvas.style.height = `${height * 2}px`
  canvas.style.imageRendering = 'crisp-edges'
  document.body.appendChild(canvas)
  canvas.width = width
  canvas.height = height
  const data = context.getImageData(0, 0, width, height)
  const scene: Scene = {
    camera,
    lights,
    spheres,
  }
  let planet1 = 0
  let planet2 = 0
  const tick = (): void => {
    planet1 += 0.1
    planet2 += 0.2
    scene.spheres[1].position.x = Math.sin(planet1) * 3.5
    scene.spheres[1].position.z = -3 + Math.cos(planet1) * 3.5
    scene.spheres[2].position.x = Math.sin(planet2) * 4
    scene.spheres[2].position.z = -3 + Math.cos(planet2) * 4
    render(scene, width, height, data, context)
    requestAnimationFrame(tick)
  }
  tick()
}

window.onload = init
