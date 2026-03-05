import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBoardStore } from '../store/boardStore'
import { BOARD_SIZE, BOARD_HEIGHT, BOARD_SURFACE_Y, SPLIT_OFFSET, GAP_CLOSED, INSET_MARGIN } from '../types'

const INSET_COLOR = '#96731e'
const STRIP_HEIGHT = 0.015
const STRIP_WIDTH = 0.04

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

function InsetBorder({ side }: { side: 'left' | 'right' }) {
  const h = BOARD_SIZE / 2
  const m = INSET_MARGIN
  // leicht in die Brettoberflaeche eingeschnitten (Kerbe)
  const y = BOARD_SURFACE_Y - STRIP_HEIGHT / 2 - 0.002
  const cornerAdjust = 0.04

  const mat = useMemo(
    () => <meshStandardMaterial color={INSET_COLOR} roughness={0.75} />,
    []
  )

  if (side === 'left') {
    const leftX = -h + m
    const innerW = h - m
    const verticalLen = (h - m) * 2 - cornerAdjust * 2
    const horizontalLen = innerW + cornerAdjust * 2
    return (
      <group>
        {/* Left vertical edge */}
        <mesh position={[leftX, y, 0]}>
          <boxGeometry args={[STRIP_WIDTH, STRIP_HEIGHT, verticalLen]} />
          {mat}
        </mesh>
        {/* Bottom horizontal edge */}
        <mesh position={[leftX + horizontalLen / 2, y, -h + m]}>
          <boxGeometry args={[horizontalLen, STRIP_HEIGHT, STRIP_WIDTH]} />
          {mat}
        </mesh>
        {/* Top horizontal edge */}
        <mesh position={[leftX + horizontalLen / 2, y, h - m]}>
          <boxGeometry args={[horizontalLen, STRIP_HEIGHT, STRIP_WIDTH]} />
          {mat}
        </mesh>
      </group>
    )
  } else {
    const rightX = h - m
    const innerW = h - m
    const verticalLen = (h - m) * 2 - cornerAdjust * 2
    const horizontalLen = innerW + cornerAdjust * 2
    return (
      <group>
        {/* Right vertical edge */}
        <mesh position={[rightX, y, 0]}>
          <boxGeometry args={[STRIP_WIDTH, STRIP_HEIGHT, verticalLen]} />
          {mat}
        </mesh>
        {/* Bottom horizontal edge */}
        <mesh position={[rightX - horizontalLen / 2, y, -h + m]}>
          <boxGeometry args={[horizontalLen, STRIP_HEIGHT, STRIP_WIDTH]} />
          {mat}
        </mesh>
        {/* Top horizontal edge */}
        <mesh position={[rightX - horizontalLen / 2, y, h - m]}>
          <boxGeometry args={[horizontalLen, STRIP_HEIGHT, STRIP_WIDTH]} />
          {mat}
        </mesh>
      </group>
    )
  }
}

function BoardHalf({ side }: { side: 'left' | 'right' }) {
  const groupRef = useRef<THREE.Group>(null)
  const isSplit = useBoardStore((s) => s.isSplit)

  const geometry = useMemo(() => {
    const shape = createHalfShape(side)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BOARD_HEIGHT,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    })
    geo.rotateX(-Math.PI / 2)
    return geo
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

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial color="#d4a456" roughness={0.65} metalness={0.0} />
      </mesh>
      <InsetBorder side={side} />
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
