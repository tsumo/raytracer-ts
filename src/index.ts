// -----------
// Vector math
// -----------
const vUP: Vector3 = { x: 0, y: 1, z: 0 }

const vZERO: Vector3 = { x: 0, y: 0, z: 0 }

const vDotProduct = (a: Vector3, b: Vector3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z

const vCrossProduct = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

const vScale = (a: Vector3, t: number): Vector3 => ({
  x: a.x * t,
  y: a.y * t,
  z: a.z * t,
})

const vLength = (a: Vector3): number => Math.sqrt(vDotProduct(a, a))

const vUnitVector = (a: Vector3): Vector3 => vScale(a, 1 / vLength(a))

const vAdd = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
})

const vAdd3 = (a: Vector3, b: Vector3, c: Vector3): Vector3 => ({
  x: a.x + b.x + c.x,
  y: a.y + b.y + c.y,
  z: a.z + b.z + c.z,
})

const vSubtract = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})

const vReflect = (a: Vector3, normal: Vector3): Vector3 => {
  const d = vScale(normal, vDotProduct(a, normal))
  return vSubtract(vScale(d, 2), a)
}

// -----
// Types
// -----
type Vector3 = { x: number; y: number; z: number }

type Color = { r: number; g: number; b: number }

type Ray = {
  position: Vector3
  direction: Vector3
}

type Camera = Ray & {
  fov: number
}

type Sphere = {
  position: Vector3
  radius: number
  color: Color
  specular: number
  lambert: number
  ambient: number
}

type Scene = {
  camera: Camera
  lights: Vector3[]
  spheres: Sphere[]
}

type Intersection = [number, Sphere | null]

// ---------
// Raytracer
// ---------
const init = () => {
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
  const tick = () => {
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

const render = (
  scene: Scene,
  width: number,
  height: number,
  data: ImageData,
  context: CanvasRenderingContext2D,
) => {
  const { camera } = scene
  const eyeVector = vUnitVector(vSubtract(camera.direction, camera.position))
  const vpRight = vUnitVector(vCrossProduct(eyeVector, vUP))
  const vpUp = vUnitVector(vCrossProduct(vpRight, eyeVector))
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
      const xComp = vScale(vpRight, x * pixelWidth - halfWidth)
      const yComp = vScale(vpUp, y * pixelHeight - halfHeight)
      ray.direction = vUnitVector(vAdd3(eyeVector, xComp, yComp))
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
  const pointAtTime = vAdd(ray.position, vScale(ray.direction, dist))
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
  const eyeToCenter = vSubtract(sphere.position, ray.position)
  const v = vDotProduct(eyeToCenter, ray.direction)
  const eoDot = vDotProduct(eyeToCenter, eyeToCenter)
  const discriminant = sphere.radius * sphere.radius - eoDot + v * v
  if (discriminant < 0) {
    return
  } else {
    return v - Math.sqrt(discriminant)
  }
}

const sphereNormal = (sphere: Sphere, position: Vector3): Vector3 =>
  vUnitVector(vSubtract(position, sphere.position))

const surface = (
  ray: Ray,
  scene: Scene,
  sphere: Sphere,
  pointAtTime: Vector3,
  normal: Vector3,
  depth: number,
): Color => {
  const b = colorToVector3(sphere.color)
  let c = vZERO
  let lambertAmount = 0
  if (sphere.lambert) {
    for (let i = 0; i < scene.lights.length; i++) {
      const light = scene.lights[i]
      if (!isLightVisible(pointAtTime, scene, light)) {
        continue
      }
      const contribution = vDotProduct(
        vUnitVector(vSubtract(light, pointAtTime)),
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
      direction: vReflect(ray.direction, normal),
    }
    const reflectedColor: Color = trace(reflectedRay, scene, depth + 1)
    c = vAdd(c, vScale(colorToVector3(reflectedColor), sphere.specular))
  }
  lambertAmount = Math.min(1, lambertAmount)
  return vector3ToColor(
    vAdd3(
      c,
      vScale(b, lambertAmount * sphere.lambert),
      vScale(b, sphere.ambient),
    ),
  )
}

const isLightVisible = (position: Vector3, scene: Scene, light: Vector3) => {
  const intersection = intersectScene(
    { position, direction: vUnitVector(vSubtract(position, light)) },
    scene,
  )
  return intersection[0] > -0.005
}

const colorToVector3 = (c: Color): Vector3 => ({ x: c.r, y: c.g, z: c.b })

const vector3ToColor = (v: Vector3): Color => ({ r: v.x, g: v.y, b: v.z })

init()
