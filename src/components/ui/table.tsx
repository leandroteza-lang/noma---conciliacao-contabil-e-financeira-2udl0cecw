/* Table Component primitives - A component that displays a table - from shadcn/ui (exposes Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption) */
import * as React from 'react'

import { cn } from '@/lib/utils'

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    wrapperClassName?: string
    showGridlines?: boolean
    gridlineWidth?: number
    gridlineColor?: string
    rowHeight?: 'compact' | 'standard' | 'comfortable' | number
  }
>(
  (
    {
      className,
      wrapperClassName,
      showGridlines,
      gridlineWidth,
      gridlineColor,
      rowHeight = 'standard',
      style,
      ...props
    },
    ref,
  ) => {
    let paddingY = '0.375rem'
    if (rowHeight === 'compact') paddingY = '0.1rem'
    else if (rowHeight === 'comfortable') paddingY = '0.75rem'

    return (
      <div
        className={cn('relative w-full overflow-auto', wrapperClassName)}
        style={
          {
            '--table-padding-y': paddingY,
            ...(showGridlines
              ? {
                  '--grid-width': `${gridlineWidth || 1}px`,
                  '--grid-color': gridlineColor || '#cbd5e1',
                }
              : {}),
            ...style,
          } as React.CSSProperties
        }
      >
        <style>{`
          .table-custom-density th, .table-custom-density td {
            padding-top: var(--table-padding-y) !important;
            padding-bottom: var(--table-padding-y) !important;
            height: auto !important;
          }
        `}</style>
        {showGridlines && (
          <style>{`
          .table-gridlines th, .table-gridlines td {
            border: var(--grid-width) solid var(--grid-color) !important;
          }
          .table-gridlines {
            border-collapse: collapse;
          }
        `}</style>
        )}
        <table
          ref={ref}
          className={cn(
            'w-full caption-bottom text-sm table-custom-density',
            showGridlines && 'table-gridlines',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { disableZebra?: boolean; customZebraColor?: string }
>(({ className, disableZebra, customZebraColor, ...props }, ref) => {
  const applyDeepSkyBlue = customZebraColor === '#00BFFF'
  const applyMidnightBlue = customZebraColor === '#191970'

  return (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        !disableZebra &&
          !applyDeepSkyBlue &&
          !applyMidnightBlue && [
            'odd:bg-transparent odd:text-black dark:odd:text-white hover:odd:bg-slate-50 dark:hover:odd:bg-slate-800/50',
            'even:bg-[#bfdbfe] even:text-black hover:even:bg-[#93c5fd]',
          ],
        !disableZebra &&
          applyDeepSkyBlue && [
            'odd:bg-white dark:odd:bg-transparent',
            'even:bg-[#00BFFF] even:text-white even:font-bold hover:even:bg-[#00BFFF]/90',
            '[&:nth-child(even)>td]:text-white [&:nth-child(even)>td]:font-bold',
            '[&:nth-child(even)>td_.text-muted-foreground]:text-white/90',
            '[&:nth-child(even)>td_.bg-background]:bg-transparent [&:nth-child(even)>td_.border-input]:border-white/30',
            '[&:nth-child(even)>td_button:hover]:bg-white/20 [&:nth-child(even)>td_button:hover_svg]:text-white',
            '[&:nth-child(even)>td_span.bg-primary\\/10]:bg-white/20 [&:nth-child(even)>td_span.bg-primary\\/10]:text-white',
            '[&:nth-child(even)>td_span.bg-secondary]:bg-white/20 [&:nth-child(even)>td_span.bg-secondary]:text-white',
          ],
        !disableZebra &&
          applyMidnightBlue && [
            'odd:bg-white odd:text-black odd:font-bold dark:odd:bg-transparent hover:odd:bg-slate-50',
            '[&:nth-child(odd)>td]:text-black [&:nth-child(odd)>td]:font-bold',
            '[&:nth-child(odd)>td_.text-slate-600]:text-black [&:nth-child(odd)>td_.text-slate-700]:text-black [&:nth-child(odd)>td_.text-slate-800]:text-black',
            'even:bg-[#191970] even:text-white even:font-bold hover:even:bg-[#191970]/90',
            '[&:nth-child(even)>td]:text-white [&:nth-child(even)>td]:font-bold',
            '[&:nth-child(even)>td_.text-slate-600]:text-white/90 [&:nth-child(even)>td_.text-slate-700]:text-white/90 [&:nth-child(even)>td_.text-slate-800]:text-white',
            '[&:nth-child(even)>td_.text-emerald-600]:text-emerald-400 [&:nth-child(even)>td_.text-rose-600]:text-rose-400',
            '[&:nth-child(even)>td_.bg-background]:bg-transparent [&:nth-child(even)>td_.border-input]:border-white/30',
            '[&:nth-child(even)>td_button:hover]:bg-white/20 [&:nth-child(even)>td_button:hover_svg]:text-white',
            '[&:nth-child(even)>td_span.bg-primary\\/10]:bg-white/20 [&:nth-child(even)>td_span.bg-primary\\/10]:text-white',
            '[&:nth-child(even)>td_span.bg-secondary]:bg-white/20 [&:nth-child(even)>td_span.bg-secondary]:text-white',
          ],
        className,
      )}
      {...props}
    />
  )
})
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-8 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-2 py-1.5 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
