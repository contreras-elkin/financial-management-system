import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import type { Client } from '../clients/types'
import type { Account } from './types'

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

const luis: Client = { ...ana, id: 2, identificationNumber: '200', firstName: 'Luis', lastName: 'Gómez' }

const savings: Account = {
  id: 10,
  type: 'SAVINGS',
  number: '5300000001',
  status: 'ACTIVE',
  balance: 0,
  gmfExempt: false,
  clientId: 1,
  createdAt: '2026-11-25T09:00:00',
  updatedAt: '2026-11-25T09:00:00',
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function mockApi(onOpen: () => Response) {
  fetchMock.mockImplementation(async (url, init) => {
    if (init?.method === 'POST') return onOpen()
    return url === '/api/clients' ? json(200, [ana, luis]) : json(200, [savings])
  })
}

function openRequest() {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
  return call && { url: call[0], body: JSON.parse(String(call[1]?.body)) }
}

async function openDialog(user: UserEvent, path = '/accounts') {
  await renderRoute(path)
  await screen.findByRole('table', { name: 'Cuentas' })
  await user.click(screen.getByRole('button', { name: 'Abrir cuenta' }))
  return screen.getByRole('dialog', { name: 'Abrir cuenta' })
}

async function choose(user: UserEvent, dialog: HTMLElement, field: string, option: string) {
  await user.click(within(dialog).getByRole('combobox', { name: field }))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('OpenAccountDialog', () => {
  beforeAll(() => import('./AccountsPage'))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('opens an account, closes the dialog and reloads the list', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, savings))
    const dialog = await openDialog(user)

    await choose(user, dialog, 'Cliente', 'Luis Gómez')
    await choose(user, dialog, 'Tipo de cuenta', 'Corriente')
    await user.click(within(dialog).getByRole('switch', { name: /Exenta de GMF/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Abrir cuenta' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(openRequest()).toEqual({ url: '/api/accounts', body: { clientId: 2, type: 'CHECKING', gmfExempt: true } })
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/accounts')).toHaveLength(3)
  })

  it('preselects the client of the filter and opens a savings account by default', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, savings))
    const dialog = await openDialog(user, '/accounts?clientId=1')

    expect(within(dialog).getByRole('combobox', { name: 'Cliente' })).toHaveTextContent('Ana Ruiz')
    expect(within(dialog).getByRole('combobox', { name: 'Tipo de cuenta' })).toHaveTextContent('Ahorros')
    await user.click(within(dialog).getByRole('button', { name: 'Abrir cuenta' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(openRequest()?.body).toEqual({ clientId: 1, type: 'SAVINGS', gmfExempt: false })
  })

  it('asks for the client before calling the API', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, savings))
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Abrir cuenta' }))

    expect(await within(dialog).findByText('Selecciona el cliente')).toBeInTheDocument()
    expect(openRequest()).toBeUndefined()
  })

  it('shows a business error in an alert and keeps the dialog open', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() =>
      json(
        409,
        { title: 'Conflict with current state', detail: 'Already exempt', code: 'GMF_EXEMPTION_ALREADY_ASSIGNED' },
        'application/problem+json',
      ),
    )
    const dialog = await openDialog(user, '/accounts?clientId=1')

    await user.click(within(dialog).getByRole('switch', { name: /Exenta de GMF/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Abrir cuenta' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('El cliente ya tiene otra cuenta exenta de GMF.')
  })

  it('closes without opening an account when cancelling', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, savings))
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(openRequest()).toBeUndefined()
  })
})
