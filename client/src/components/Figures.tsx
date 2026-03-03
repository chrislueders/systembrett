import { useBoardStore } from '../store/boardStore'
import { Figure } from './Figure'
import { SPLIT_OFFSET, GAP_CLOSED } from '../types'

export function Figures() {
  const figures = useBoardStore((s) => s.figures)
  const isSplit = useBoardStore((s) => s.isSplit)

  return (
    <group>
      {figures.map((fig) => {
        let offsetX = 0
        if (isSplit) {
          offsetX = fig.boardHalf === 'left' ? -SPLIT_OFFSET : SPLIT_OFFSET
        } else {
          offsetX = fig.boardHalf === 'left' ? -GAP_CLOSED / 2 : GAP_CLOSED / 2
        }
        const pos: [number, number, number] = [
          fig.position[0] + offsetX,
          fig.position[1],
          fig.position[2],
        ]
        return <Figure key={fig.id} data={{ ...fig, position: pos }} />
      })}
    </group>
  )
}
