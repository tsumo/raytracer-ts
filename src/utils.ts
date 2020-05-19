import { Color, Vector3 } from './types'

export const colorToVector3 = (c: Color): Vector3 => ({
  x: c.r,
  y: c.g,
  z: c.b,
})

export const vector3ToColor = (v: Vector3): Color => ({
  r: v.x,
  g: v.y,
  b: v.z,
})
