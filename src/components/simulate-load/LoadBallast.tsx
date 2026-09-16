'use client'

import { useAppSelector } from '@/store/hooks'

/**
 * The DOM half of a load simulation: thousands of extra nodes mounted into the
 * page while a run is active, so the browser is paying real layout and paint
 * costs rather than only spinning the CPU.
 *
 * It is kept visually out of the way (fixed, behind the page, barely visible)
 * because the point is to weigh the page down, not to cover it up — the header
 * panel reports how many rows are mounted so nothing is hidden.
 */
export function LoadBallast() {
  const domRows = useAppSelector((state) => state.load.domRows)

  if (domRows === 0) return null

  return (
    <div className="load-ballast" aria-hidden>
      {Array.from({ length: domRows }, (_, index) => (
        <div className="load-ballast-row" key={index}>
          <span>synthetic row {index + 1}</span>
          <span>{(index * 2654435761) % 1_000_003}</span>
          <span>{new Date(index * 1000).toISOString()}</span>
        </div>
      ))}
    </div>
  )
}
