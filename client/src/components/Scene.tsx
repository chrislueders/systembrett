import { useRef, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Board } from './Board'
import { Figures } from './Figures'
import { RotationRing } from './RotationRing'
import { useBoardStore } from '../store/boardStore'
import { generateId } from '../store/boardStore'
import { BOARD_SURFACE_Y, SPLIT_OFFSET, GAP_CLOSED } from '../types'
import type { FigureType } from '../types'

const _lookTarget = new THREE.Vector3()

function CameraController() {
  const angle = useBoardStore((s) => s.cameraAngle)
  const pitch = useBoardStore((s) => s.cameraPitch)
  const zoom = useBoardStore((s) => s.cameraZoom)
  const panX = useBoardStore((s) => s.cameraPanX)
  const panZ = useBoardStore((s) => s.cameraPanZ)
  const { camera } = useThree()

  useFrame(() => {
    const a = (angle * Math.PI) / 180
    const p = (pitch * Math.PI) / 180
    _lookTarget.set(panX, 0, panZ)
    camera.position.lerp(
      new THREE.Vector3(
        panX + zoom * Math.sin(a) * Math.cos(p),
        zoom * Math.sin(p),
        panZ + zoom * Math.cos(a) * Math.cos(p)
      ),
      0.1
    )
    camera.lookAt(_lookTarget)
  })

  return null
}

const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOARD_SURFACE_Y)
const _hit = new THREE.Vector3()

/**
 * Drag handler that works with the "select first, then drag" model.
 * The Figure component handles selection via onClick.
 * This handler listens to DOM pointer events to detect drags on already-selected figures.
 * It uses Three.js raycasting against the figures in the scene to verify the pointer is on the figure.
 */
function FigureDragHandler() {
  const { camera, gl, scene } = useThree()
  const rc = useRef(new THREE.Raycaster())
  const dragActive = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const pendingDrag = useRef(false)

  const getWorldPos = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      rc.current.setFromCamera(mouse, camera)
      return rc.current.ray.intersectPlane(_plane, _hit) ? _hit.clone() : null
    },
    [camera, gl]
  )

  const isPointerOnFigure = useCallback(
    (clientX: number, clientY: number): boolean => {
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      rc.current.setFromCamera(mouse, camera)
      const hits = rc.current.intersectObjects(scene.children, true)
      // Check if any hit object belongs to a figure group (not the board plane or ground)
      for (const h of hits) {
        let obj: THREE.Object3D | null = h.object
        while (obj) {
          if (obj.userData?.isFigure) return true
          obj = obj.parent
        }
      }
      return false
    },
    [camera, gl, scene]
  )

  useEffect(() => {
    const el = gl.domElement

    const onDown = (e: PointerEvent) => {
      const state = useBoardStore.getState()
      if (!state.selectedFigureId) return

      if (isPointerOnFigure(e.clientX, e.clientY)) {
        pendingDrag.current = true
        startPos.current = { x: e.clientX, y: e.clientY }
        dragActive.current = false
      }
    }

    const onMove = (e: PointerEvent) => {
      if (!pendingDrag.current) return

      const state = useBoardStore.getState()
      if (!state.selectedFigureId) {
        pendingDrag.current = false
        return
      }

      const dx = e.clientX - startPos.current.x
      const dy = e.clientY - startPos.current.y
      if (!dragActive.current && Math.sqrt(dx * dx + dy * dy) < 5) return

      if (!dragActive.current) {
        dragActive.current = true
        state.setDraggingFigure(state.selectedFigureId)
      }

      const figId = state.draggingFigureId
      if (!figId) return

      const pos = getWorldPos(e.clientX, e.clientY)
      if (!pos) return

      const isSplit = state.isSplit
      const boardHalf: 'left' | 'right' = pos.x < 0 ? 'left' : 'right'
      let localX = pos.x
      if (isSplit) {
        localX += boardHalf === 'left' ? SPLIT_OFFSET : -SPLIT_OFFSET
      } else {
        localX += boardHalf === 'left' ? GAP_CLOSED / 2 : -GAP_CLOSED / 2
      }

      state.moveFigure(figId, [localX, BOARD_SURFACE_Y, pos.z], boardHalf)
      document.body.style.cursor = 'grabbing'
    }

    const onUp = () => {
      if (dragActive.current) {
        useBoardStore.getState().setDraggingFigure(null)
        document.body.style.cursor = 'default'
      }
      pendingDrag.current = false
      dragActive.current = false
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
  }, [gl, getWorldPos, isPointerOnFigure])

  return null
}

function BoardClickHandler() {
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    const state = useBoardStore.getState()
    const point = e.point

    const isSplit = state.isSplit
    const boardHalf: 'left' | 'right' = point.x < 0 ? 'left' : 'right'
    let localX = point.x
    if (isSplit) {
      localX += boardHalf === 'left' ? SPLIT_OFFSET : -SPLIT_OFFSET
    } else {
      localX += boardHalf === 'left' ? GAP_CLOSED / 2 : -GAP_CLOSED / 2
    }

    if (state.placingFigure) {
      const id = generateId()
      state.addFigure({
        id,
        type: state.placingFigure,
        color: 'wood',
        position: [localX, BOARD_SURFACE_Y, point.z],
        rotation: 0,
        boardHalf,
      })
      state.setPlacingFigure(null)
      state.selectFigure(id)
      return
    }

    state.selectFigure(null)
  }, [])

  return (
    <mesh
      position={[0, BOARD_SURFACE_Y - 0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
      visible={false}
    >
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 8, -6]} intensity={0.3} />
    </>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#e8e0d4" roughness={0.9} />
    </mesh>
  )
}

function ZoomHandler() {
  const setCameraZoom = useBoardStore((s) => s.setCameraZoom)
  const { gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setCameraZoom(useBoardStore.getState().cameraZoom + e.deltaY * 0.01)
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [gl, setCameraZoom])

  return null
}

function SidebarDropHandler() {
  const { camera, gl } = useThree()
  const rc = useRef(new THREE.Raycaster())

  const getWorldPos = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      rc.current.setFromCamera(mouse, camera)
      return rc.current.ray.intersectPlane(_plane, _hit) ? _hit.clone() : null
    },
    [camera, gl]
  )

  useEffect(() => {
    const el = gl.domElement

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('application/x-systembrett-figure-type')) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const onDrop = (e: DragEvent) => {
      const type = e.dataTransfer?.getData('application/x-systembrett-figure-type') as FigureType | ''
      if (!type) return
      e.preventDefault()

      const pos = getWorldPos(e.clientX, e.clientY)
      if (!pos) return

      const state = useBoardStore.getState()
      const isSplit = state.isSplit
      const boardHalf: 'left' | 'right' = pos.x < 0 ? 'left' : 'right'
      let localX = pos.x
      if (isSplit) {
        localX += boardHalf === 'left' ? SPLIT_OFFSET : -SPLIT_OFFSET
      } else {
        localX += boardHalf === 'left' ? GAP_CLOSED / 2 : -GAP_CLOSED / 2
      }

      const id = generateId()
      state.addFigure({
        id,
        type,
        color: 'wood',
        position: [localX, BOARD_SURFACE_Y, pos.z],
        rotation: 0,
        boardHalf,
      })
      state.selectFigure(id)
    }

    el.addEventListener('dragover', onDragOver)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('drop', onDrop)
    }
  }, [gl, getWorldPos])

  return null
}

function RightMouseRotateHandler() {
  const { gl, camera, scene } = useThree()
  const rc = useRef(new THREE.Raycaster())

  useEffect(() => {
    const el = gl.domElement
    let rotating = false
    let startY = 0
    let startRotation = 0

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 2) return
      const state = useBoardStore.getState()
      if (!state.selectedFigureId) return

      const rect = el.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      rc.current.setFromCamera(mouse, camera)
      const hits = rc.current.intersectObjects(scene.children, true)

      let hitFigureId: string | null = null
      for (const h of hits) {
        let obj: THREE.Object3D | null = h.object
        while (obj) {
          if (obj.userData?.isFigure && obj.userData.figureId) {
            hitFigureId = obj.userData.figureId as string
            break
          }
          obj = obj.parent
        }
        if (hitFigureId) break
      }

      if (!hitFigureId || hitFigureId !== state.selectedFigureId) return

      const fig = state.figures.find((f) => f.id === state.selectedFigureId)
      if (!fig) return

      rotating = true
      startY = e.clientY
      startRotation = fig.rotation
      document.body.style.cursor = 'crosshair'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!rotating) return
      const dy = e.clientY - startY
      const factor = -0.01
      const newRot = startRotation + dy * factor
      const { selectedFigureId } = useBoardStore.getState()
      if (!selectedFigureId) return
      useBoardStore.getState().rotateFigure(selectedFigureId, newRot)
    }

    const onPointerUp = () => {
      if (rotating) {
        rotating = false
        document.body.style.cursor = 'default'
      }
    }

    el.addEventListener('contextmenu', onContextMenu)
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      el.removeEventListener('contextmenu', onContextMenu)
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, camera, scene])

  return null
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 14, 0], fov: 45, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <CameraController />
      <ZoomHandler />
      <FigureDragHandler />
      <RightMouseRotateHandler />
      <Lights />
      <Ground />
      <Board />
      <Figures />
      <RotationRing />
      <BoardClickHandler />
      <SidebarDropHandler />
    </Canvas>
  )
}
