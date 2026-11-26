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

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function problem(status: number, code: string) {
  return json(status, { title: 'Error', detail: 'Backend detail', code }, 'application/problem+json')
}

/** Responde la lista en cada GET y delega las escrituras en `onWrite`. */
function mockApi(onWrite: () => Response) {
  fetchMock.mockImplementation(async (_url, init) => ((init?.method ?? 'GET') === 'GET' ? json(200, [ana]) : onWrite()))
}

function writeRequest() {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method !== 'GET')
  return call && { url: call[0], method: call[1]?.method, body: JSON.parse(String(call[1]?.body)) }
}

async function openCreateDialog(user: UserEvent) {
  renderRoute('/clients')
  await screen.findByRole('table', { name: 'Clientes' })
  await user.click(screen.getByRole('button', { name: 'Nuevo cliente' }))
  return screen.getByRole('dialog', { name: 'Nuevo cliente' })
}

async function fillNewClient(user: UserEvent, dialog: HTMLElement) {
  const form = within(dialog)
  await user.click(form.getByRole('combobox', { name: 'Tipo de identificación' }))
  await user.click(screen.getByRole('option', { name: 'Pasaporte' }))
  await user.type(form.getByLabelText(/Número de identificación/), 'AB123')
  await user.type(form.getByLabelText(/Nombres/), 'Luis')
  await user.type(form.getByLabelText(/Apellidos/), 'Gómez')
  await user.type(form.getByLabelText(/Correo electrónico/), 'luis@mail.com')
  await user.type(form.getByLabelText(/Fecha de nacimiento/), '1985-01-20')
}

describe('ClientFormDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('creates a client, closes the dialog and reloads the list', async () => {
    const user = userEvent.setup()
    mockApi(() => json(201, { ...ana, id: 2 }))
    const dialog = await openCreateDialog(user)

    await fillNewClient(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(writeRequest()).toEqual({
      url: '/api/clients',
      method: 'POST',
      body: {
        identificationType: 'PA',
        identificationNumber: 'AB123',
        firstName: 'Luis',
        lastName: 'Gómez',
        email: 'luis@mail.com',
        birthDate: '1985-01-20',
      },
    })
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'GET')).toHaveLength(2)
  })

  it('shows the validation errors and does not call the API', async () => {
    const user = userEvent.setup()
    mockApi(() => json(201, ana))
    const dialog = await openCreateDialog(user)

    await user.type(within(dialog).getByLabelText(/Correo electrónico/), 'ana')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(await within(dialog).findByText('El número de identificación es obligatorio')).toBeInTheDocument()
    expect(within(dialog).getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument()
    expect(within(dialog).getByText('El correo debe tener el formato usuario@dominio.com')).toBeInTheDocument()
    expect(within(dialog).getByText('La fecha de nacimiento es obligatoria')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Número de identificación/)).toHaveFocus()
    expect(writeRequest()).toBeUndefined()
  })

  it('shows a duplicated identification under its field and keeps the dialog open', async () => {
    const user = userEvent.setup()
    mockApi(() => problem(409, 'CLIENT_ALREADY_EXISTS'))
    const dialog = await openCreateDialog(user)

    await fillNewClient(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(
      await within(dialog).findByText('Ya existe un cliente con este tipo y número de identificación.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Número de identificación/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows an error that does not belong to a field in an alert', async () => {
    const user = userEvent.setup()
    mockApi(() => problem(409, 'DATA_INTEGRITY_VIOLATION'))
    const dialog = await openCreateDialog(user)

    await fillNewClient(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'La operación entra en conflicto con los datos actuales.',
    )
  })

  it('edits only the personal data of a client', async () => {
    const user = userEvent.setup()
    mockApi(() => json(200, { ...ana, firstName: 'Ana María' }))
    renderRoute('/clients')

    await user.click(await screen.findByRole('button', { name: 'Editar a Ana Ruiz' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar cliente' })
    const form = within(dialog)

    expect(form.getByLabelText(/Número de identificación/)).toHaveValue('100')
    expect(form.getByLabelText(/Número de identificación/)).toBeDisabled()
    expect(form.getByLabelText(/Fecha de nacimiento/)).toHaveValue('1990-05-10')

    await user.clear(form.getByLabelText(/Nombres/))
    await user.type(form.getByLabelText(/Nombres/), 'Ana María')
    await user.click(form.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(writeRequest()).toEqual({
      url: '/api/clients/1',
      method: 'PUT',
      body: { firstName: 'Ana María', lastName: 'Ruiz', email: 'ana@mail.com', birthDate: '1990-05-10' },
    })
  })

  it('closes without saving when cancelling', async () => {
    const user = userEvent.setup()
    mockApi(() => json(201, ana))
    const dialog = await openCreateDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(writeRequest()).toBeUndefined()
  })
})
