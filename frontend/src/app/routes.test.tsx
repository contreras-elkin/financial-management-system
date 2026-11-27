import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/renderRoute'

describe('routes', () => {
  it('renders the home page inside the layout', async () => {
    await renderRoute('/')

    expect(screen.getByText('Financial Management')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument()
  })

  it('renders the not found page for an unknown path', async () => {
    await renderRoute('/unknown')

    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
  })

  it('navigates back home from the not found page', async () => {
    const user = userEvent.setup()
    await renderRoute('/unknown')

    await user.click(screen.getByRole('link', { name: 'Volver al inicio' }))

    expect(screen.getByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument()
  })
})
