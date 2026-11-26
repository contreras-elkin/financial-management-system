import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
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
  updatedAt: '2026-11-24T10:00:00',
}

const fetchMock = vi.fn<typeof fetch>()

/** Responde la lista en cada GET y delega el DELETE en `onDelete`. */
function mockApi(onDelete: () => Response) {
  fetchMock.mockImplementation(async (_url, init) =>
    (init?.method ?? 'GET') === 'GET'
      ? new Response(JSON.stringify([ana]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      : onDelete(),
  )
}

function deleteRequests() {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')
}

async function openDeleteDialog(user: UserEvent) {
  renderRoute('/clients')
  await user.click(await screen.findByRole('button', { name: 'Eliminar a Ana Ruiz' }))
  return screen.getByRole('dialog', { name: 'Eliminar cliente' })
}

describe('DeleteClientDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('asks for confirmation naming the client', async () => {
    const user = userEvent.setup()
    mockApi(() => new Response(null, { status: 204 }))

    const dialog = await openDeleteDialog(user)

    expect(dialog).toHaveTextContent('¿Eliminar a Ana Ruiz (CC 100)? Esta acción no se puede deshacer.')
    expect(deleteRequests()).toHaveLength(0)
  })

  it('deletes the client, closes the dialog and reloads the list', async () => {
    const user = userEvent.setup()
    mockApi(() => new Response(null, { status: 204 }))
    const dialog = await openDeleteDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteRequests()).toEqual([['/api/clients/1', expect.objectContaining({ method: 'DELETE' })]])
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'GET')).toHaveLength(2)
  })

  it('does not delete when cancelling', async () => {
    const user = userEvent.setup()
    mockApi(() => new Response(null, { status: 204 }))
    const dialog = await openDeleteDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteRequests()).toHaveLength(0)
  })

  it('shows the error of the backend and keeps the dialog open', async () => {
    const user = userEvent.setup()
    mockApi(
      () =>
        new Response(JSON.stringify({ title: 'Resource not found', detail: 'Not found', code: 'CLIENT_NOT_FOUND' }), {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
    )
    const dialog = await openDeleteDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('El cliente ya no existe. Actualiza la lista.')
    expect(screen.getByRole('dialog', { name: 'Eliminar cliente' })).toBeInTheDocument()
  })
})
