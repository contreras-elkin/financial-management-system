import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import type { Account } from '../accounts/types'
import type { Client } from '../clients/types'
import type { Transaction } from './types'

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

const checking: Account = {
  id: 10,
  type: 'CHECKING',
  number: '3300000001',
  status: 'ACTIVE',
  balance: -300000,
  overdraftLimit: 1000000,
  availableBalance: 700000,
  gmfExempt: false,
  clientId: 1,
  createdAt: '2026-11-25T09:00:00',
  updatedAt: '2026-11-27T10:00:00',
}

const savings: Account = {
  ...checking,
  id: 11,
  type: 'SAVINGS',
  number: '5300000001',
  balance: 50000,
  overdraftLimit: 0,
  availableBalance: 50000,
}

const deposit: Transaction = {
  id: 1,
  accountId: 10,
  type: 'DEPOSIT',
  direction: 'CREDIT',
  amount: 200000,
  balanceAfter: 200000,
  counterpartyAccountId: null,
  reference: '7f1c2a3e-0000-4000-8000-000000000001',
  createdAt: '2026-11-26T09:15:00',
}

const transferSent: Transaction = {
  ...deposit,
  id: 2,
  type: 'TRANSFER',
  direction: 'DEBIT',
  amount: 500000,
  balanceAfter: -300000,
  counterpartyAccountId: 11,
  reference: '7f1c2a3e-0000-4000-8000-000000000002',
  createdAt: '2026-11-27T10:00:00',
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function mockApi(transactionsByUrl: Record<string, Transaction[]> = {}) {
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/clients') return json(200, [ana])
    if (url === '/api/accounts') return json(200, [checking, savings])
    const transactions = transactionsByUrl[String(url)]
    return transactions ? json(200, transactions) : json(500, {})
  })
}

function statementRequests() {
  return fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => url.endsWith('/transactions'))
}

describe('TransactionsPage', () => {
  beforeAll(() => import('./TransactionsPage'))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('asks for an account and does not load any statement without one', async () => {
    mockApi()

    await renderRoute('/transactions')

    expect(screen.getByRole('heading', { name: 'Movimientos' })).toBeInTheDocument()
    expect(await screen.findByText('Selecciona una cuenta para ver sus movimientos.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Resumen de la cuenta' })).not.toBeInTheDocument()
    expect(statementRequests()).toEqual([])
  })

  it('shows the summary and the statement of the account in the URL', async () => {
    mockApi({ '/api/accounts/10/transactions': [transferSent, deposit] })

    await renderRoute('/transactions?accountId=10')

    const summary = await screen.findByRole('region', { name: 'Resumen de la cuenta' })
    expect(within(summary).getByRole('heading', { name: '3300000001' })).toBeInTheDocument()
    expect(within(summary).getByText('-$ 300.000,00')).toBeInTheDocument()
    expect(within(summary).getByText('$ 700.000,00')).toBeInTheDocument()
    expect(within(summary).getByText('Cupo $ 1.000.000,00')).toBeInTheDocument()
    expect(within(summary).getByText('Corriente')).toBeInTheDocument()
    expect(within(summary).getByText('Activa')).toBeInTheDocument()
    expect(await within(summary).findByText('Ana Ruiz')).toBeInTheDocument()

    const table = await screen.findByRole('table', { name: 'Movimientos' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)

    expect(within(rows[1]).getByText('27/11/2026 10:00')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Transferencia enviada')).toBeInTheDocument()
    expect(within(rows[1]).getByText('5300000001')).toBeInTheDocument()
    expect(within(rows[1]).getByText('-$ 500.000,00')).toBeInTheDocument()
    expect(within(rows[1]).getByText('-$ 300.000,00')).toBeInTheDocument()

    expect(within(rows[2]).getByText('Consignación')).toBeInTheDocument()
    expect(within(rows[2]).getByText('—')).toBeInTheDocument()
    expect(within(rows[2]).getByText('+$ 200.000,00')).toBeInTheDocument()
  })

  it('loads the statement of the account chosen in the selector', async () => {
    const user = userEvent.setup()
    mockApi({ '/api/accounts/11/transactions': [] })
    await renderRoute('/transactions')

    await user.click(await screen.findByRole('combobox', { name: 'Cuenta' }))
    await user.click(await screen.findByRole('option', { name: '5300000001 · Ahorros · Ana Ruiz' }))

    expect(await screen.findByText('Esta cuenta no tiene movimientos.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '5300000001' })).toBeInTheDocument()
    expect(statementRequests()).toEqual(['/api/accounts/11/transactions'])
  })

  it('tells that the account in the URL does not exist', async () => {
    mockApi()

    await renderRoute('/transactions?accountId=99')

    expect(await screen.findByText('La cuenta seleccionada no existe.')).toBeInTheDocument()
    expect(statementRequests()).toEqual([])
  })

  it('offers to retry when the statement cannot be loaded', async () => {
    mockApi()

    await renderRoute('/transactions?accountId=10')

    expect(await screen.findByText('No fue posible cargar los movimientos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
