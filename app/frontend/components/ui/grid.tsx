import * as React from "react"
import { cn } from "@/lib/utils"

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    initial?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    "2xl"?: string
  }
  gap?: string
  children?: React.ReactNode
}

export function Grid({
  columns = {
    initial: "1",
    sm: "2",
    md: "3",
    lg: "4",
  },
  gap = "4",
  className,
  children,
  ...props
}: GridProps) {
  const gridClasses = cn(
    "grid",
    columns.initial && `grid-cols-${columns.initial}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    columns["2xl"] && `2xl:grid-cols-${columns["2xl"]}`,
    gap && `gap-${gap}`,
    className
  )

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  )
}