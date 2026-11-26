import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import type { Client } from './types'

const ana: Client = {
  id: 1,
  identificationType: 'CC',
  identificationNumber: '100',
  firstName: 'Ana',
  lastName: 'Ruiz',
  email: 'ana@mail.com',
  birthDate: '1990-05-10',
  createdAt: '2026-11-24T10:00:00',
  updatedAt: '2026-11-25T15:30:00',
}

const luis: Client = { ...ana, id: 2, identificationType: 'CE', identificationNumber: '200', firstName: 'Luis' }

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('shows a loading indicator and then the clients in a table', async () => {
    fetchMock.mockResolvedValue(json(200, [ana, luis]))

    renderRoute('/clients')

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Cargando clientes' })).toBeInTheDocument()

    const table = await screen.findByRole('table', { name: 'Clientes' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]).getByText('CC 100')).toBeInTheDocument()
    expect(within(rows[1]).getByText('ana@mail.com')).toBeInTheDocument()
    expect(within(rows[1]).getByText('10/05/1990')).toBeInTheDocument()
    expect(within(rows[1]).getByText('24/11/2026 10:00')).toBeInTheDocument()
    expect(within(rows[1]).getByText('25/11/2026 15:30')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Luis')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/clients', expect.objectContaining({ method: 'GET' }))
  })

  it('shows a message when there are no clients', async () => {
    fetchMock.mockResolvedValue(json(200, []))

    renderRoute('/clients')

    expect(await screen.findByText('No hay clientes registrados.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows an error and loads the clients again when retrying', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(json(200, [ana]))

    renderRoute('/clients')

    expect(await screen.findByText('No fue posible cargar los clientes.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('table', { name: 'Clientes' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('is reachable from the main navigation', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(json(200, []))
    renderRoute('/')

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    await user.click(within(nav).getByRole('link', { name: 'Clientes' }))

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  })
})
