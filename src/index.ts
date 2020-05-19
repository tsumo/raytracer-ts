import {
  Camera,
  Vector3,
  Sphere,
  Scene,
  Color,
  Ray,
  Intersection,
} from './types'
import * as v from './vectors'
import { colorToVector3, vector3ToColor } from './utils'

const render = (
  scene: Scene,
  width: number,
  height: number,
  data: ImageData,
  context: CanvasRenderingContext2D,
): void => {
  const { camera } = scene
  const eyeVector = v.unitVector(v.subtract(camera.direction, camera.position))
  const vpRight = v.unitVector(v.crossProduct(eyeVector, v.UP))
  const vpUp = v.unitVector(v.crossProduct(vpRight, eyeVector))
  const fovRadians = (Math.PI * (camera.fov / 2)) / 180
  const ratio = height / width
  const halfWidth = Math.tan(fovRadians)
  const halfHeight = ratio * halfWidth
  const cameraWidth = halfWidth * 2
  const cameraHeight = halfHeight * 2
  const pixelWidth = cameraWidth / (width - 1)
  const pixelHeight = cameraHeight / (height - 1)
  let index = 0
  let color: Color = { r: 0, g: 0, b: 0 }
  let ray: Ray = {
    position: camera.position,
    direction: { x: 0, y: 0, z: 0 },
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const xComp = v.scale(vpRight, x * pixelWidth - halfWidth)
      const yComp = v.scale(vpUp, y * pixelHeight - halfHeight)
      ray.direction = v.unitVector(v.add3(eyeVector, xComp, yComp))
      color = trace(ray, scene, 0)
      index = x * 4 + y * width * 4
      data.data[index + 0] = color.r
      data.data[index + 1] = color.g
      data.data[index + 2] = color.b
      data.data[index + 3] = 255
    }
  }
  context.putImageData(data, 0, 0)
}

const trace = (ray: Ray, scene: Scene, depth: number): Color => {
  if (depth > 3) {
    return { r: 0, g: 0, b: 0 }
  }
  const intersection = intersectScene(ray, scene)
  const [dist, sphere] = intersection
  if (dist === Infinity || sphere === null) {
    return { r: 255, g: 255, b: 255 }
  }
  const pointAtTime = v.add(ray.position, v.scale(ray.direction, dist))
  return surface(
    ray,
    scene,
    sphere,
    pointAtTime,
    sphereNormal(sphere, pointAtTime),
    depth,
  )
}

const intersectScene = (ray: Ray, scene: Scene): Intersection => {
  const closest: Intersection = [Infinity, null]
  for (let i = 0; i < scene.spheres.length; i++) {
    const sphere = scene.spheres[i]
    const dist = sphereIntersection(sphere, ray)
    if (dist != undefined && dist < closest[0]) {
      closest[0] = dist
      closest[1] = sphere
    }
  }
  return closest
}

const sphereIntersection = (sphere: Sphere, ray: Ray): number | undefined => {
  const eyeToCenter = v.subtract(sphere.position, ray.position)
  const vv = v.dotProduct(eyeToCenter, ray.direction)
  const eoDot = v.dotProduct(eyeToCenter, eyeToCenter)
  const discriminant = sphere.radius * sphere.radius - eoDot + vv * vv
  if (discriminant < 0) {
    return
  } else {
    return vv - Math.sqrt(discriminant)
  }
}

const sphereNormal = (sphere: Sphere, position: Vector3): Vector3 =>
  v.unitVector(v.subtract(position, sphere.position))

const surface = (
  ray: Ray,
  scene: Scene,
  sphere: Sphere,
  pointAtTime: Vector3,
  normal: Vector3,
  depth: number,
): Color => {
  const b = colorToVector3(sphere.color)
  let c = v.ZERO
  let lambertAmount = 0
  if (sphere.lambert) {
    for (let i = 0; i < scene.lights.length; i++) {
      const light = scene.lights[i]
      if (!isLightVisible(pointAtTime, scene, light)) {
        continue
      }
      const contribution = v.dotProduct(
        v.unitVector(v.subtract(light, pointAtTime)),
        normal,
      )
      if (contribution > 0) {
        lambertAmount += contribution
      }
    }
  }
  if (sphere.specular) {
    const reflectedRay: Ray = {
      position: pointAtTime,
      direction: v.reflect(ray.direction, normal),
    }
    const reflectedColor: Color = trace(reflectedRay, scene, depth + 1)
    c = v.add(c, v.scale(colorToVector3(reflectedColor), sphere.specular))
  }
  lambertAmount = Math.min(1, lambertAmount)
  return vector3ToColor(
    v.add3(
      c,
      v.scale(b, lambertAmount * sphere.lambert),
      v.scale(b, sphere.ambient),
    ),
  )
}

const isLightVisible = (position: Vector3, scene: Scene, light: Vector3) => {
  const intersection = intersectScene(
    { position, direction: v.unitVector(v.subtract(position, light)) },
    scene,
  )
  return intersection[0] > -0.005
}

const init = (): void => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    return
  }
  document.body.appendChild(canvas)
  const width = 640 * 0.5
  const height = 480 * 0.5
  canvas.width = width
  canvas.height = height
  const data = context.getImageData(0, 0, width, height)
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
