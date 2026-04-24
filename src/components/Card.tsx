import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../lib/utils'

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

function Card({ children, className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-slate-200/80 bg-white shadow-card',
        padded && 'p-6 sm:p-7',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
