import { Vector3 } from './types'

export const UP: Vector3 = { x: 0, y: 1, z: 0 }

export const ZERO: Vector3 = { x: 0, y: 0, z: 0 }

export const dotProduct = (a: Vector3, b: Vector3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z

export const crossProduct = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

export const scale = (a: Vector3, t: number): Vector3 => ({
  x: a.x * t,
  y: a.y * t,
  z: a.z * t,
})

export const length = (a: Vector3): number => Math.sqrt(dotProduct(a, a))

export const unitVector = (a: Vector3): Vector3 => scale(a, 1 / length(a))

export const add = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
})

export const add3 = (a: Vector3, b: Vector3, c: Vector3): Vector3 => ({
  x: a.x + b.x + c.x,
  y: a.y + b.y + c.y,
  z: a.z + b.z + c.z,
})

export const subtract = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})

export const reflect = (a: Vector3, normal: Vector3): Vector3 => {
  const d = scale(normal, dotProduct(a, normal))
  return subtract(scale(d, 2), a)
}
