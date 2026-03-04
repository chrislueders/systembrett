import { useRef, useMemo, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useBoardStore } from '../store/boardStore'
import { BOARD_SURFACE_Y, SPLIT_OFFSET, GAP_CLOSED } from '../types'
import { FIGURE_DIMENSIONS } from './Figure'

export function RotationRing() {
  const selectedFigureId = useBoardStore((s) => s.selectedFigureId)
  const draggingFigureId = useBoardStore((s) => s.draggingFigureId)
  const figures = useBoardStore((s) => s.figures)
  const isSplit = useBoardStore((s) => s.isSplit)
  const rotateFigure = useBoardStore((s) => s.rotateFigure)
  const { camera, gl } = useThree()

  const [isRotating, setIsRotating] = useState(false)
  const ringRef = useRef<THREE.Group>(null)

  const selectedFigure = figures.find((f) => f.id === selectedFigureId)
  const isDragging = draggingFigureId === selectedFigureId

  const ringRadius = useMemo(() => {
    if (!selectedFigure) return 0.6
    const dim = FIGURE_DIMENSIONS[selectedFigure.type]
    return dim ? Math.max(dim.radius * 4, 0.5) : 0.6
  }, [selectedFigure])

  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(ringRadius, 0.04, 8, 48)
  }, [ringRadius])

  const figWorldPos = useMemo(() => {
    if (!selectedFigure) return new THREE.Vector3()
    let offsetX = 0
    if (isSplit) {
      offsetX = selectedFigure.boardHalf === 'left' ? -SPLIT_OFFSET : SPLIT_OFFSET
    } else {
      offsetX = selectedFigure.boardHalf === 'left' ? -GAP_CLOSED / 2 : GAP_CLOSED / 2
    }
    return new THREE.Vector3(
      selectedFigure.position[0] + offsetX,
      BOARD_SURFACE_Y + 0.01,
      selectedFigure.position[2]
    )
  }, [selectedFigure, isSplit])

  const handleRingPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsRotating(true)
    document.body.style.cursor = 'crosshair'
  }

  const handleRingClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
  }

  useEffect(() => {
    if (!isRotating || !selectedFigure) return

    const el = gl.domElement
    const rc = new THREE.Raycaster()
    const hitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOARD_SURFACE_Y)
    const hitPt = new THREE.Vector3()

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      rc.setFromCamera(mouse, camera)
      rc.ray.intersectPlane(hitPlane, hitPt)

      const fig = useBoardStore.getState().figures.find((f) => f.id === selectedFigure.id)
      if (!fig) return

      const state = useBoardStore.getState()
      let figX = fig.position[0]
      if (state.isSplit) {
        figX += fig.boardHalf === 'left' ? -SPLIT_OFFSET : SPLIT_OFFSET
      } else {
        figX += fig.boardHalf === 'left' ? -GAP_CLOSED / 2 : GAP_CLOSED / 2
      }

      const dx = hitPt.x - figX
      const dz = hitPt.z - fig.position[2]
      rotateFigure(selectedFigure.id, Math.atan2(dx, dz))
    }

    const onUp = () => {
      setIsRotating(false)
      document.body.style.cursor = 'default'
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isRotating, selectedFigure, camera, gl, rotateFigure])

  if (!selectedFigure || isDragging) return null

  return (
    <group ref={ringRef} position={figWorldPos}>
      <mesh
        geometry={ringGeometry}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerDown={handleRingPointerDown}
        onClick={handleRingClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'crosshair'
        }}
        onPointerOut={() => {
          if (!isRotating) document.body.style.cursor = 'default'
        }}
      >
        <meshStandardMaterial
          color={isRotating ? '#ffcc00' : '#ff9900'}
          emissive={isRotating ? '#ff9900' : '#663300'}
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
        />
      </mesh>

      <group rotation={[0, selectedFigure.rotation, 0]}>
        <mesh
          position={[0, 0.01, ringRadius + 0.15]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={handleRingPointerDown}
          onClick={handleRingClick}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'crosshair'
          }}
          onPointerOut={() => {
            if (!isRotating) document.body.style.cursor = 'default'
          }}
        >
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}
