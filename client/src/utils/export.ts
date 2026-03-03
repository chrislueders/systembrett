import type { BoardState } from '../types'

export function exportBoard(state: BoardState) {
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `systembrett_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBoard(): Promise<BoardState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      try {
        const text = await file.text()
        const state = JSON.parse(text) as BoardState
        resolve(state)
      } catch (e) {
        reject(e)
      }
    }
    input.click()
  })
}
