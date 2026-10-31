import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const SlotContext = createContext<HTMLElement | null>(null)
const SetSlotContext = createContext<(node: HTMLElement | null) => void>(() => {})
const CountContext = createContext(0)
const ChangeCountContext = createContext<(delta: number) => void>(() => {})

export function NavActionsProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [count, setCount] = useState(0)
  const change = useCallback((delta: number) => {
    setCount((current) => current + delta)
  }, [])

  return (
    <SetSlotContext.Provider value={setSlot}>
      <SlotContext.Provider value={slot}>
        <ChangeCountContext.Provider value={change}>
          <CountContext.Provider value={count}>{children}</CountContext.Provider>
        </ChangeCountContext.Provider>
      </SlotContext.Provider>
    </SetSlotContext.Provider>
  )
}

export function NavActionSlot({ className }: { className?: string }) {
  const setSlot = useContext(SetSlotContext)
  return <div ref={setSlot} className={className} />
}

export function useHasNavActions() {
  return useContext(CountContext) > 0
}

/** Portal page-specific controls into the nav's right side. */
export function NavActions({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext)
  const change = useContext(ChangeCountContext)

  useEffect(() => {
    change(1)
    return () => change(-1)
  }, [change])

  if (!slot) return null
  return createPortal(children, slot)
}
