import * as v from './vectors'
import { Vector3, Sphere, Ray, Scene, Color, Intersection } from './types'
import { colorToVector3, vector3ToColor } from './utils'

export const render = (
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
  const ray: Ray = {
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

export const trace = (ray: Ray, scene: Scene, depth: number): Color => {
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

export const intersectScene = (ray: Ray, scene: Scene): Intersection => {
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

export const sphereIntersection = (
  sphere: Sphere,
  ray: Ray,
): number | undefined => {
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

export const sphereNormal = (sphere: Sphere, position: Vector3): Vector3 =>
  v.unitVector(v.subtract(position, sphere.position))

export const surface = (
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

export const isLightVisible = (
  position: Vector3,
  scene: Scene,
  light: Vector3,
): boolean => {
  const intersection = intersectScene(
    { position, direction: v.unitVector(v.subtract(position, light)) },
    scene,
  )
  return intersection[0] > -0.005
}
