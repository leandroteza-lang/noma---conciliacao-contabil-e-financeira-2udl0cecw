import React from 'react'
import { Link } from 'react-router-dom'

export const processInline = (text: string) => {
  const parts = text.split(/(\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      const label = linkMatch[1].replace(/\*\*/g, '').replace(/\*/g, '')
      const url = linkMatch[2]
      if (url.startsWith('/')) {
        return (
          <Link
            key={i}
            to={url}
            className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md no-underline font-medium transition-colors my-1.5 shadow-sm text-sm w-fit"
          >
            {label}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        )
      }
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary hover:text-primary/80 transition-colors"
        >
          {label}
        </a>
      )
    }

    const subParts = part.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return subParts.map((subPart, j) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return (
          <strong key={j} className="font-semibold">
            {subPart.slice(2, -2)}
          </strong>
        )
      }
      if (subPart.startsWith('*') && subPart.endsWith('*')) {
        return <em key={j}>{subPart.slice(1, -1)}</em>
      }
      return <span key={j}>{subPart}</span>
    })
  })
}

export const renderMarkdown = (text: string) => {
  const lines = text.split('\n')
  return (
    <div className="flex flex-col gap-1 text-[13px] leading-relaxed">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-2"></div>
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="font-semibold text-[15px] mt-2 mb-1">
              {processInline(line.slice(4))}
            </h3>
          )
        if (line.startsWith('## '))
          return (
            <h2 key={i} className="font-bold text-base mt-3 mb-1">
              {processInline(line.slice(3))}
            </h2>
          )
        if (line.startsWith('# '))
          return (
            <h1 key={i} className="font-bold text-lg mt-4 mb-2">
              {processInline(line.slice(2))}
            </h1>
          )
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="ml-3 flex gap-2">
              <span className="select-none text-muted-foreground">•</span>
              <span className="flex-1">{processInline(line.slice(2))}</span>
            </div>
          )
        }
        const numberedListMatch = line.match(/^(\d+\.\s)(.*)/)
        if (numberedListMatch) {
          return (
            <div key={i} className="ml-3 flex gap-2">
              <span className="select-none min-w-[1.2rem] text-muted-foreground">
                {numberedListMatch[1].trim()}
              </span>
              <span className="flex-1">{processInline(numberedListMatch[2])}</span>
            </div>
          )
        }
        return (
          <div key={i} className="min-h-[1.25rem]">
            {processInline(line)}
          </div>
        )
      })}
    </div>
  )
}
