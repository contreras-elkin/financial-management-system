import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  balance: 2450000,
  overdraftLimit: 0,
  availableBalance: 2450000,
  gmfExempt: true,
  clientId: 1,
  createdAt: '2026-11-25T09:00:00',
  updatedAt: '2026-11-26T14:20:00',
}

const checking: Account = {
  ...savings,
  id: 11,
  type: 'CHECKING',
  number: '3300000001',
  status: 'INACTIVE',
  balance: -300000,
  overdraftLimit: 1000000,
  availableBalance: 700000,
  gmfExempt: false,
  clientId: 2,
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function mockApi(accountsByUrl: Record<string, Account[]>) {
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/clients') return json(200, [ana, luis])
    const accounts = accountsByUrl[String(url)]
    return accounts ? json(200, accounts) : json(404, {})
  })
}

function accountRequests() {
  return fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => url.startsWith('/api/accounts'))
}

describe('AccountsPage', () => {
  beforeAll(() => Promise.all([import('./AccountsPage'), import('../transactions/TransactionsPage')]))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('shows the accounts with their client, balances, status and GMF exemption', async () => {
    mockApi({ '/api/accounts': [savings, checking] })

    await renderRoute('/accounts')

    expect(screen.getByRole('heading', { name: 'Cuentas' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Cuentas' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)

    expect(within(rows[1]).getByText('5300000001')).toBeInTheDocument()
    expect(within(rows[1]).getByRole('img', { name: 'Exenta de GMF' })).toBeInTheDocument()
    expect(within(rows[1]).getByText('Ahorros')).toBeInTheDocument()
    expect(await within(rows[1]).findByText('Ana Ruiz')).toBeInTheDocument()
    expect(within(rows[1]).getAllByText('$ 2.450.000,00')).toHaveLength(2)
    expect(within(rows[1]).queryByText(/^Cupo/)).not.toBeInTheDocument()
    expect(within(rows[1]).getByText('Activa')).toBeInTheDocument()
    expect(within(rows[1]).getByText('26/11/2026 14:20')).toBeInTheDocument()

    expect(within(rows[2]).getByText('Corriente')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Luis Gómez')).toBeInTheDocument()
    expect(within(rows[2]).getByText('-$ 300.000,00')).toBeInTheDocument()
    expect(within(rows[2]).getByText('$ 700.000,00')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Cupo $ 1.000.000,00')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Inactiva')).toBeInTheDocument()
    expect(within(rows[2]).queryByRole('img', { name: 'Exenta de GMF' })).not.toBeInTheDocument()
  })

  it('filters the accounts by client', async () => {
    const user = userEvent.setup()
    mockApi({ '/api/accounts': [savings, checking], '/api/accounts?clientId=2': [checking] })
    await renderRoute('/accounts')
    await screen.findByRole('table', { name: 'Cuentas' })

    await user.click(screen.getByRole('combobox', { name: 'Cliente' }))
    await user.click(await screen.findByRole('option', { name: 'Luis Gómez' }))

    const table = await screen.findByRole('table', { name: 'Cuentas' })
    await vi.waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2))
    expect(within(table).getByText('3300000001')).toBeInTheDocument()
    expect(accountRequests()).toEqual(['/api/accounts', '/api/accounts?clientId=2'])
  })

  it('reads the client filter from the URL', async () => {
    mockApi({ '/api/accounts?clientId=1': [] })

    await renderRoute('/accounts?clientId=1')

    expect(await screen.findByText('Este cliente no tiene cuentas.')).toBeInTheDocument()
    expect(accountRequests()).toEqual(['/api/accounts?clientId=1'])
  })

  it('shows a message when there are no accounts', async () => {
    mockApi({ '/api/accounts': [] })

    await renderRoute('/accounts')

    expect(await screen.findByText('No hay cuentas registradas.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows an error and loads the accounts again when retrying', async () => {
    const user = userEvent.setup()
    mockApi({})

    await renderRoute('/accounts')

    expect(await screen.findByText('No fue posible cargar las cuentas.')).toBeInTheDocument()
    mockApi({ '/api/accounts': [savings] })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('table', { name: 'Cuentas' })).toBeInTheDocument()
  })

  it('is reachable from the main navigation', async () => {
    const user = userEvent.setup()
    mockApi({ '/api/accounts': [] })
    await renderRoute('/')

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    await user.click(within(nav).getByRole('link', { name: 'Cuentas' }))

    expect(await screen.findByRole('heading', { name: 'Cuentas' })).toBeInTheDocument()
  })

  it('opens the statement of an account', async () => {
    const user = userEvent.setup()
    mockApi({ '/api/accounts': [savings, checking], '/api/accounts/10/transactions': [] })
    await renderRoute('/accounts')
    await screen.findByRole('table', { name: 'Cuentas' })

    await user.click(screen.getByRole('link', { name: 'Ver movimientos de la cuenta 5300000001' }))

    expect(await screen.findByRole('heading', { name: 'Movimientos' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '5300000001' })).toBeInTheDocument()
    expect(await screen.findByText('Esta cuenta no tiene movimientos.')).toBeInTheDocument()
  })
})
