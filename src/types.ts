export type Vector3 = { x: number; y: number; z: number }

export type Color = { r: number; g: number; b: number }

export type Ray = {
  position: Vector3
  direction: Vector3
}

export type Camera = Ray & {
  fov: number
}

export type Sphere = {
  position: Vector3
  radius: number
  color: Color
  specular: number
  lambert: number
  ambient: number
}

export type Scene = {
  camera: Camera
  lights: Vector3[]
  spheres: Sphere[]
}

export type Intersection = [number, Sphere | null]
