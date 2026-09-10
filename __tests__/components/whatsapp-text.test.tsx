import React from 'react'
import { render, screen } from '@testing-library/react'
import { WhatsAppText } from '@/components/ui/WhatsAppText'

describe('UI Atoms — WhatsAppText', () => {
  it('successfully renders *asterisks* as bold instead of showing the raw characters', () => {
    const { container } = render(<WhatsAppText>{'Es el *sábado 12* a las 12:00'}</WhatsAppText>)

    const bold = container.querySelector('strong')
    expect(bold).toHaveTextContent('sábado 12')
    expect(container.textContent).not.toContain('*')
  })

  it('successfully renders _underscores_ as italic and ~tildes~ as strikethrough', () => {
    const { container } = render(<WhatsAppText>{'_opcional_ y ~10:00~'}</WhatsAppText>)

    expect(container.querySelector('em')).toHaveTextContent('opcional')
    expect(container.querySelector('s')).toHaveTextContent('10:00')
  })

  it('successfully preserves line breaks so grouped schedules stay readable', () => {
    const { container } = render(<WhatsAppText>{'*Mañana*\n- 09:00\n- 11:30'}</WhatsAppText>)

    expect(container.textContent).toBe('Mañana\n- 09:00\n- 11:30')
    expect(container.firstElementChild).toHaveClass('whitespace-pre-wrap')
  })

  it('successfully leaves bullet dashes untouched so they are not confused with bold', () => {
    const { container } = render(<WhatsAppText>{'- 09:00'}</WhatsAppText>)

    expect(container.textContent).toBe('- 09:00')
    expect(container.querySelector('strong')).toBeNull()
  })

  it('successfully ignores unbalanced or space-padded delimiters, matching WhatsApp', () => {
    const { container } = render(<WhatsAppText>{'2 * 3 * 4 y un suelto *'}</WhatsAppText>)

    expect(container.querySelector('strong')).toBeNull()
    expect(container.textContent).toBe('2 * 3 * 4 y un suelto *')
  })

  it('successfully renders patient text as plain text and never as markup', () => {
    render(<WhatsAppText>{'<img src=x onerror=alert(1)>'}</WhatsAppText>)

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })

  it('successfully handles empty and nullish content without crashing', () => {
    const { container: empty } = render(<WhatsAppText>{''}</WhatsAppText>)
    expect(empty.textContent).toBe('')

    const { container: nullish } = render(<WhatsAppText>{null}</WhatsAppText>)
    expect(nullish.textContent).toBe('')
  })
})
