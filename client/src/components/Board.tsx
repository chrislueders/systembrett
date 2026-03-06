import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBoardStore } from '../store/boardStore'
import { BOARD_SIZE, BOARD_HEIGHT, SPLIT_OFFSET, GAP_CLOSED, INSET_MARGIN } from '../types'

const INSET_COLOR = '#96731e'
const STRIP_WIDTH = 0.12
const GROOVE_DEPTH = 0.05 // sichtbare Vertiefung (echte Kerbe)

function getCurvePoints(): THREE.Vector2[] {
  const h = BOARD_SIZE / 2
  const path = new THREE.CurvePath<THREE.Vector2>()
  path.add(
    new THREE.CubicBezierCurve(
      new THREE.Vector2(0, -h - 0.01),
      new THREE.Vector2(0.5, -h * 0.5),
      new THREE.Vector2(-0.4, -h * 0.1),
      new THREE.Vector2(0.3, h * 0.25)
    )
  )
  path.add(
    new THREE.CubicBezierCurve(
      new THREE.Vector2(0.3, h * 0.25),
      new THREE.Vector2(0.6, h * 0.4),
      new THREE.Vector2(-0.25, h * 0.6),
      new THREE.Vector2(0, h + 0.01)
    )
  )
  return path.getPoints(80)
}

let _cached: THREE.Vector2[] | null = null
function curvePoints() {
  if (!_cached) _cached = getCurvePoints()
  return _cached
}

function createHalfShape(side: 'left' | 'right'): THREE.Shape {
  const h = BOARD_SIZE / 2
  const r = 0.3
  const pts = curvePoints()
  const s = new THREE.Shape()

  if (side === 'left') {
    s.moveTo(-h + r, -h)
    s.lineTo(pts[0].x, -h)
    for (const p of pts) s.lineTo(p.x, p.y)
    s.lineTo(-h + r, h)
    s.quadraticCurveTo(-h, h, -h, h - r)
    s.lineTo(-h, -h + r)
    s.quadraticCurveTo(-h, -h, -h + r, -h)
  } else {
    s.moveTo(pts[0].x, -h)
    s.lineTo(h - r, -h)
    s.quadraticCurveTo(h, -h, h, -h + r)
    s.lineTo(h, h - r)
    s.quadraticCurveTo(h, h, h - r, h)
    s.lineTo(pts[pts.length - 1].x, h)
    for (let i = pts.length - 1; i >= 0; i--) s.lineTo(pts[i].x, pts[i].y)
  }
  return s
}

/** Interpoliert den x-Wert der Trennkurve bei gegebenem y. */
function curveXAtY(y: number): number {
  const pts = curvePoints()
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1]
    if ((p0.y <= y && p1.y >= y) || (p0.y >= y && p1.y <= y)) {
      const t = (y - p0.y) / (p1.y - p0.y)
      return p0.x + t * (p1.x - p0.x)
    }
  }
  return 0
}

const CURVE_INSET = 0.1 // Sicherheitsabstand vom Kurvenrand

/** Ein zusammenhängender U-förmiger Pfad als Nut-Loch pro Brett-Hälfte (CW-Windung). */
function createGrooveHoles(side: 'left' | 'right'): THREE.Path[] {
  const h = BOARD_SIZE / 2
  const m = INSET_MARGIN
  const w = STRIP_WIDTH / 2

  // Äußere und innere Nut-Grenzen (y-Richtung)
  const top_o = h - m + w
  const top_i = h - m - w
  const bot_o = -h + m - w
  const bot_i = -h + m + w

  const hole = new THREE.Path()

  if (side === 'left') {
    const xo = -h + m - w
    const xi = -h + m + w
    // Nut-Enden an der Kurve (mit Sicherheitsabstand nach innen)
    const xr_bo = curveXAtY(bot_o) - CURVE_INSET
    const xr_bi = curveXAtY(bot_i) - CURVE_INSET
    const xr_ti = curveXAtY(top_i) - CURVE_INSET
    const xr_to = curveXAtY(top_o) - CURVE_INSET
    // CW: Außenkante des U entlang → Innenkante zurück
    hole.moveTo(xr_bo, bot_o)
    hole.lineTo(xo, bot_o)
    hole.lineTo(xo, top_o)
    hole.lineTo(xr_to, top_o)
    hole.lineTo(xr_ti, top_i)
    hole.lineTo(xi, top_i)
    hole.lineTo(xi, bot_i)
    hole.lineTo(xr_bi, bot_i)
    hole.closePath()
  } else {
    const xo = h - m + w
    const xi = h - m - w
    // Nut-Enden an der Kurve (mit Sicherheitsabstand nach innen)
    const xl_bo = curveXAtY(bot_o) + CURVE_INSET
    const xl_bi = curveXAtY(bot_i) + CURVE_INSET
    const xl_ti = curveXAtY(top_i) + CURVE_INSET
    const xl_to = curveXAtY(top_o) + CURVE_INSET
    // CW: Innenkante des U entlang → Außenkante zurück
    hole.moveTo(xl_bo, bot_o)
    hole.lineTo(xl_bi, bot_i)
    hole.lineTo(xi, bot_i)
    hole.lineTo(xi, top_i)
    hole.lineTo(xl_ti, top_i)
    hole.lineTo(xl_to, top_o)
    hole.lineTo(xo, top_o)
    hole.lineTo(xo, bot_o)
    hole.closePath()
  }

  return [hole]
}

/** Boden der Nut (Kerbe) – dunkle Fläche auf Höhe der Kerbensohle. */
const GROOVE_FLOOR_Y = BOARD_HEIGHT - GROOVE_DEPTH + 0.005
const FLOOR_THICKNESS = 0.001

function GrooveBottoms({ side }: { side: 'left' | 'right' }) {
  const h = BOARD_SIZE / 2
  const m = INSET_MARGIN
  const verticalLen = (h - m) * 2 + STRIP_WIDTH // Ecken abdecken
  const mat = useMemo(
    () => <meshStandardMaterial color={INSET_COLOR} roughness={0.75} />,
    []
  )

  // Kurve-x an den horizontalen Nut-Positionen (z = ±(h-m))
  // Konservativstes Sample über die gesamte Strip-Breite verwenden
  const topZ = h - m
  const botZ = -(h - m)
  const sw = STRIP_WIDTH / 2

  if (side === 'left') {
    const leftX = -h + m
    // Konservativ: Min-x über die Streifenbreite (am nächsten zur Mitte)
    const topRight = Math.min(curveXAtY(topZ - sw), curveXAtY(topZ), curveXAtY(topZ + sw)) - CURVE_INSET
    const topW = Math.max(0.01, topRight - leftX)
    const topCX = leftX + topW / 2
    const botRight = Math.min(curveXAtY(botZ - sw), curveXAtY(botZ), curveXAtY(botZ + sw)) - CURVE_INSET
    const botW = Math.max(0.01, botRight - leftX)
    const botCX = leftX + botW / 2
    return (
      <group>
        <mesh position={[leftX, GROOVE_FLOOR_Y, 0]}>
          <boxGeometry args={[STRIP_WIDTH, FLOOR_THICKNESS, verticalLen]} />
          {mat}
        </mesh>
        <mesh position={[topCX, GROOVE_FLOOR_Y, topZ]}>
          <boxGeometry args={[topW, FLOOR_THICKNESS, STRIP_WIDTH]} />
          {mat}
        </mesh>
        <mesh position={[botCX, GROOVE_FLOOR_Y, botZ]}>
          <boxGeometry args={[botW, FLOOR_THICKNESS, STRIP_WIDTH]} />
          {mat}
        </mesh>
      </group>
    )
  }
  const rightX = h - m
  // Konservativ: Max-x über die Streifenbreite (am nächsten zur Mitte)
  const topLeft = Math.max(curveXAtY(topZ - sw), curveXAtY(topZ), curveXAtY(topZ + sw)) + CURVE_INSET
  const topW = Math.max(0.01, rightX - topLeft)
  const topCX = topLeft + topW / 2
  const botLeft = Math.max(curveXAtY(botZ - sw), curveXAtY(botZ), curveXAtY(botZ + sw)) + CURVE_INSET
  const botW = Math.max(0.01, rightX - botLeft)
  const botCX = botLeft + botW / 2
  return (
    <group>
      <mesh position={[rightX, GROOVE_FLOOR_Y, 0]}>
        <boxGeometry args={[STRIP_WIDTH, FLOOR_THICKNESS, verticalLen]} />
        {mat}
      </mesh>
      <mesh position={[topCX, GROOVE_FLOOR_Y, topZ]}>
        <boxGeometry args={[topW, FLOOR_THICKNESS, STRIP_WIDTH]} />
        {mat}
      </mesh>
      <mesh position={[botCX, GROOVE_FLOOR_Y, botZ]}>
        <boxGeometry args={[botW, FLOOR_THICKNESS, STRIP_WIDTH]} />
        {mat}
      </mesh>
    </group>
  )
}

const extrudeSettings: THREE.ExtrudeGeometryOptions = {
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.04,
  bevelSegments: 3,
}

function BoardHalf({ side }: { side: 'left' | 'right' }) {
  const groupRef = useRef<THREE.Group>(null)
  const isSplit = useBoardStore((s) => s.isSplit)

  const { baseGeo, topGeo } = useMemo(() => {
    const baseShape = createHalfShape(side)
    const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
      depth: BOARD_HEIGHT - GROOVE_DEPTH,
      bevelEnabled: false, // Kein Bevel – sonst ragt Base in die Nut-Schicht
    })
    baseGeo.rotateX(-Math.PI / 2)

    const topShape = createHalfShape(side)
    for (const hole of createGrooveHoles(side)) topShape.holes.push(hole)
    const topGeo = new THREE.ExtrudeGeometry(topShape, {
      ...extrudeSettings,
      depth: GROOVE_DEPTH,
      bevelEnabled: false, // Bevel kann Löcher stören; Nutkanten bleiben scharf
    })
    topGeo.rotateX(-Math.PI / 2)
    topGeo.translate(0, BOARD_HEIGHT - GROOVE_DEPTH, 0)

    return { baseGeo, topGeo }
  }, [side])

  useFrame(() => {
    if (!groupRef.current) return
    const closedOffset = side === 'left' ? -GAP_CLOSED / 2 : GAP_CLOSED / 2
    const splitTarget = side === 'left' ? -SPLIT_OFFSET : SPLIT_OFFSET
    const target = isSplit ? splitTarget : closedOffset
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      target,
      0.08
    )
  })

  const boardMat = (
    <meshStandardMaterial color="#d4a456" roughness={0.65} metalness={0.0} />
  )
  return (
    <group ref={groupRef}>
      <mesh geometry={baseGeo} receiveShadow castShadow>
        {boardMat}
      </mesh>
      <mesh geometry={topGeo} receiveShadow castShadow>
        {boardMat}
      </mesh>
      <GrooveBottoms side={side} />
    </group>
  )
}

export function Board() {
  return (
    <group>
      <BoardHalf side="left" />
      <BoardHalf side="right" />
    </group>
  )
}
