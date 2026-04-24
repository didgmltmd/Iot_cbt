import { useEffect, useMemo, useState } from 'react'
import { cn } from '../lib/utils'

interface CodeBlockProps {
  code: string
  className?: string
  expandable?: boolean
}

function CodeBlock({ code, className, expandable = true }: CodeBlockProps) {
  const [isOpen, setIsOpen] = useState(false)
  const lines = useMemo(() => code.replace(/\r\n/g, '\n').split('\n'), [code])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-slate-700 bg-[#0f172a] text-slate-100',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-900/90 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs font-medium text-slate-400">code</span>
          </div>
          {expandable ? (
            <button
              className="inline-flex h-8 items-center justify-center rounded-lg bg-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/20"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              크게보기
            </button>
          ) : null}
        </div>
        <CodeBody code={code} lines={lines} />
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-sm font-medium text-slate-300">
                  code
                </span>
              </div>
              <ButtonLike onClick={() => setIsOpen(false)}>닫기</ButtonLike>
            </div>
            <div className="max-h-[calc(92vh-72px)] overflow-auto bg-[#020617]">
              <CodeBody code={code} lines={lines} large />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function CodeBody({
  code,
  lines,
  large = false,
}: {
  code: string
  lines: string[]
  large?: boolean
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] bg-[#020617] text-slate-100">
      <div
        className={cn(
          'select-none border-r border-white/10 bg-black/10 text-right text-slate-400',
          large ? 'px-5 py-6 text-sm leading-8' : 'px-3 py-4 text-xs leading-7',
        )}
      >
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      <pre
        className={cn(
          'overflow-x-auto text-slate-100',
          large ? 'px-6 py-6 text-base leading-8' : 'px-4 py-4 text-sm leading-7',
        )}
      >
        <code className="font-mono text-slate-100">{code}</code>
      </pre>
    </div>
  )
}

function ButtonLike({
  children,
  onClick,
}: {
  children: string
  onClick: () => void
}) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

export default CodeBlock
