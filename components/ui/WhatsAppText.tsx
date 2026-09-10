import { Fragment, type ReactNode } from 'react'

/**
 * Renderiza texto con la sintaxis de formato de WhatsApp.
 *
 * WhatsApp NO usa Markdown: los delimitadores son simples (*negrita*, _cursiva_,
 * ~tachado~), van pegados al texto y no cruzan saltos de línea. El agente emite
 * esa sintaxis para el paciente, así que el dashboard debe interpretarla igual
 * en vez de mostrar los asteriscos crudos.
 *
 * El contenido puede venir escrito por un paciente, por eso se parsea a nodos de
 * React en lugar de inyectar HTML.
 */

// El cierre debe ir pegado a un carácter que no sea espacio, igual que WhatsApp.
const TOKEN =
  /\*(?=\S)([^*\n]*[^*\s])\*|_(?=\S)([^_\n]*[^_\s])_|~(?=\S)([^~\n]*[^~\s])~/g

function formatLine(line: string, lineKey: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  TOKEN.lastIndex = 0
  while ((match = TOKEN.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index))
    }

    const key = `${lineKey}-${match.index}`
    if (match[1] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold">{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      nodes.push(<em key={key}>{match[2]}</em>)
    } else {
      nodes.push(<s key={key}>{match[3]}</s>)
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex))
  }

  return nodes
}

export function WhatsAppText({ children }: { children?: string | null }) {
  const text = children ?? ''
  const lines = text.split('\n')

  return (
    <span className="whitespace-pre-wrap break-words">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && '\n'}
          {formatLine(line, i)}
        </Fragment>
      ))}
    </span>
  )
}
