import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBoardStore } from '../store/boardStore'
import { BOARD_SIZE, BOARD_HEIGHT, SPLIT_OFFSET, GAP_CLOSED, INSET_MARGIN } from '../types'

const INSET_COLOR = '#96731e'
const STRIP_WIDTH = 0.04
const GROOVE_DEPTH = 0.02 // sichtbare Vertiefung (echte Kerbe, ~2 cm)

function getCurvePoints(): THREE.Vector2[] {
  const h = BOARD_SIZE / 2
  const path = new THREE.CurvePath<THREE.Vector2>()
  path.add(
    new THREE.CubicBezierCurve(
      new THREE.Vector2(0, -h - 0.01),
      new THREE.Vector2(1.0, -h * 0.5),
      new THREE.Vector2(-0.8, -h * 0.1),
      new THREE.Vector2(0.6, h * 0.25)
    )
  )
  path.add(
    new THREE.CubicBezierCurve(
      new THREE.Vector2(0.6, h * 0.25),
      new THREE.Vector2(1.2, h * 0.4),
      new THREE.Vector2(-0.5, h * 0.6),
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

/** Geschlossene Pfade für die Nut-Löcher (je Brett-Hälfte 3 Streifen). Loch-Windung gegenüber dem Außen-Shape. */
function createGrooveHoles(side: 'left' | 'right'): THREE.Path[] {
  const h = BOARD_SIZE / 2
  const m = INSET_MARGIN
  const w = STRIP_WIDTH / 2
  const holes: THREE.Path[] = []

  // Holes müssen entgegengesetzte Windung zur Außenkontur haben (für ExtrudeGeometry).
  if (side === 'left') {
    const leftX = -h + m
    const innerW = h - m
    const leftHole = new THREE.Path()
    leftHole.moveTo(leftX - w, -h + m)
    leftHole.lineTo(leftX + w, -h + m)
    leftHole.lineTo(leftX + w, h - m)
    leftHole.lineTo(leftX - w, h - m)
    leftHole.closePath()
    holes.push(leftHole)
    const topHole = new THREE.Path()
    topHole.moveTo(leftX, h - m - w)
    topHole.lineTo(leftX + innerW, h - m - w)
    topHole.lineTo(leftX + innerW, h - m + w)
    topHole.lineTo(leftX, h - m + w)
    topHole.closePath()
    holes.push(topHole)
    const botHole = new THREE.Path()
    botHole.moveTo(leftX, -h + m - w)
    botHole.lineTo(leftX, -h + m + w)
    botHole.lineTo(leftX + innerW, -h + m + w)
    botHole.lineTo(leftX + innerW, -h + m - w)
    botHole.closePath()
    holes.push(botHole)
  } else {
    const rightX = h - m
    const innerW = h - m
    const rightHole = new THREE.Path()
    rightHole.moveTo(rightX - w, -h + m)
    rightHole.lineTo(rightX - w, h - m)
    rightHole.lineTo(rightX + w, h - m)
    rightHole.lineTo(rightX + w, -h + m)
    rightHole.closePath()
    holes.push(rightHole)
    const topHole = new THREE.Path()
    topHole.moveTo(rightX - innerW, h - m - w)
    topHole.lineTo(rightX, h - m - w)
    topHole.lineTo(rightX, h - m + w)
    topHole.lineTo(rightX - innerW, h - m + w)
    topHole.closePath()
    holes.push(topHole)
    const botHole = new THREE.Path()
    botHole.moveTo(rightX - innerW, -h + m - w)
    botHole.lineTo(rightX - innerW, -h + m + w)
    botHole.lineTo(rightX, -h + m + w)
    botHole.lineTo(rightX, -h + m - w)
    botHole.closePath()
    holes.push(botHole)
  }
  return holes
}

/** Boden der Nut (Kerbe) – dunkle Fläche auf Höhe der Kerbensohle. */
const GROOVE_FLOOR_Y = BOARD_HEIGHT - GROOVE_DEPTH
const FLOOR_THICKNESS = 0.001

function GrooveBottoms({ side }: { side: 'left' | 'right' }) {
  const h = BOARD_SIZE / 2
  const m = INSET_MARGIN
  const innerW = h - m
  const verticalLen = (h - m) * 2
  const mat = useMemo(
    () => <meshStandardMaterial color={INSET_COLOR} roughness={0.75} />,
    []
  )

  if (side === 'left') {
    const leftX = -h + m
    return (
      <group>
        <mesh position={[leftX, GROOVE_FLOOR_Y, 0]}>
          <boxGeometry args={[STRIP_WIDTH, FLOOR_THICKNESS, verticalLen]} />
          {mat}
        </mesh>
        <mesh position={[leftX + innerW / 2, GROOVE_FLOOR_Y, -h + m]}>
          <boxGeometry args={[innerW, FLOOR_THICKNESS, STRIP_WIDTH]} />
          {mat}
        </mesh>
        <mesh position={[leftX + innerW / 2, GROOVE_FLOOR_Y, h - m]}>
          <boxGeometry args={[innerW, FLOOR_THICKNESS, STRIP_WIDTH]} />
          {mat}
        </mesh>
      </group>
    )
  }
  const rightX = h - m
  return (
    <group>
      <mesh position={[rightX, GROOVE_FLOOR_Y, 0]}>
        <boxGeometry args={[STRIP_WIDTH, FLOOR_THICKNESS, verticalLen]} />
        {mat}
      </mesh>
      <mesh position={[rightX - innerW / 2, GROOVE_FLOOR_Y, -h + m]}>
        <boxGeometry args={[innerW, FLOOR_THICKNESS, STRIP_WIDTH]} />
        {mat}
      </mesh>
      <mesh position={[rightX - innerW / 2, GROOVE_FLOOR_Y, h - m]}>
        <boxGeometry args={[innerW, FLOOR_THICKNESS, STRIP_WIDTH]} />
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
      ...extrudeSettings,
      depth: BOARD_HEIGHT - GROOVE_DEPTH,
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
