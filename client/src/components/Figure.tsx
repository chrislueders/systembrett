import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { FigureData } from '../types'
import { useBoardStore } from '../store/boardStore'
import { BOARD_SURFACE_Y } from '../types'

const WOOD_COLOR = '#c4923a'
const COLOR_MAP: Record<string, string> = {
  wood: WOOD_COLOR,
  red: '#cc2936',
  blue: '#2660a4',
  green: '#2d6a4f',
  black: '#2b2b2b',
  white: '#f0ece2',
}

export const FIGURE_DIMENSIONS: Record<string, { height: number; radius: number }> = {
  'peg-large': { height: 1.3, radius: 0.22 },
  'peg-medium': { height: 1.0, radius: 0.18 },
  'peg-small': { height: 0.6, radius: 0.13 },
  'cone-large': { height: 1.2, radius: 0.22 },
  'cone-medium': { height: 0.9, radius: 0.18 },
  'cone-small': { height: 0.55, radius: 0.13 },
  'cylinder-large': { height: 0.9, radius: 0.25 },
  'cylinder-medium': { height: 0.65, radius: 0.2 },
  'cylinder-small': { height: 0.4, radius: 0.16 },
  'stick': { height: 0.8, radius: 0.04 },
}

function PegHead({
  headR,
  centerY,
  material,
  color,
}: {
  headR: number
  centerY: number
  material: THREE.Material
  color: string
}) {
  const eyeR = headR * 0.13
  const eyeSpread = headR * 0.38
  const eyeForwardDist = headR * 0.96
  const dotColor = color === 'black' ? '#555' : '#222'

  return (
    <group position={[0, centerY, 0]}>
      <mesh castShadow material={material}>
        <sphereGeometry args={[headR, 16, 12]} />
      </mesh>
      <mesh position={[-eyeSpread, headR * 0.2, eyeForwardDist]}>
        <sphereGeometry args={[eyeR, 8, 6]} />
        <meshStandardMaterial color={dotColor} />
      </mesh>
      <mesh position={[eyeSpread, headR * 0.2, eyeForwardDist]}>
        <sphereGeometry args={[eyeR, 8, 6]} />
        <meshStandardMaterial color={dotColor} />
      </mesh>
    </group>
  )
}

export function Figure({ data }: { data: FigureData }) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const selectedFigureId = useBoardStore((s) => s.selectedFigureId)
  const draggingFigureId = useBoardStore((s) => s.draggingFigureId)
  const isSelected = selectedFigureId === data.id
  const isDragging = draggingFigureId === data.id

  const materialColor = COLOR_MAP[data.color] ?? WOOD_COLOR
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: materialColor,
        roughness: 0.6,
        metalness: 0.05,
        emissive: isSelected ? '#ffaa00' : isDragging ? '#886600' : hovered ? '#664400' : '#000000',
        emissiveIntensity: isSelected ? 0.4 : isDragging ? 0.3 : hovered ? 0.15 : 0,
      }),
    [materialColor, isSelected, isDragging, hovered]
  )

  // onClick is the key event -- it fires on pointerUp and we stopPropagation
  // so the BoardClickHandler behind us does NOT receive it and deselect.
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!isSelected) {
      useBoardStore.getState().selectFigure(data.id)
    }
  }

  // Also stop propagation on pointerDown so the drag handler doesn't interfere
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
  }

  const dim = FIGURE_DIMENSIONS[data.type] ?? { height: 0.8, radius: 0.2 }
  const hasFace = data.type.startsWith('peg') || data.type.startsWith('cone')

  return (
    <group
      ref={groupRef}
      position={[data.position[0], BOARD_SURFACE_Y, data.position[2]]}
      rotation={[0, data.rotation, 0]}
      userData={{ isFigure: true }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = isSelected ? 'grab' : 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        if (!useBoardStore.getState().draggingFigureId) {
          document.body.style.cursor = 'default'
        }
      }}
    >
      {data.type.startsWith('peg') &&
        (() => {
          const headR = dim.radius * 0.85
          const bodyH = dim.height - headR * 2
          const headCenterY = bodyH + headR * 0.7
          return (
            <>
              <mesh position={[0, bodyH / 2, 0]} castShadow material={material}>
                <cylinderGeometry args={[dim.radius * 0.7, dim.radius, bodyH, 16]} />
              </mesh>
              {hasFace ? (
                <PegHead headR={headR} centerY={headCenterY} material={material} color={data.color} />
              ) : (
                <mesh position={[0, headCenterY, 0]} castShadow material={material}>
                  <sphereGeometry args={[headR, 16, 12]} />
                </mesh>
              )}
            </>
          )
        })()}

      {data.type.startsWith('cone') &&
        (() => {
          const headR = dim.radius * 0.6
          const bodyH = dim.height - headR * 2
          const headCenterY = bodyH + headR * 0.5
          return (
            <>
              <mesh position={[0, bodyH / 2, 0]} castShadow material={material}>
                <coneGeometry args={[dim.radius, bodyH, 16]} />
              </mesh>
              {hasFace ? (
                <PegHead headR={headR} centerY={headCenterY} material={material} color={data.color} />
              ) : (
                <mesh position={[0, headCenterY, 0]} castShadow material={material}>
                  <sphereGeometry args={[headR, 16, 12]} />
                </mesh>
              )}
            </>
          )
        })()}

      {data.type.startsWith('cylinder') && (
        <mesh position={[0, dim.height / 2, 0]} castShadow material={material}>
          <cylinderGeometry args={[dim.radius, dim.radius, dim.height, 16]} />
        </mesh>
      )}

      {data.type === 'stick' && (
        <mesh position={[0, 0.4, 0]} castShadow material={material}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        </mesh>
      )}
    </group>
  )
}
