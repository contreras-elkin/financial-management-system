import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import type { Account } from '../accounts/types'
import type { Transaction } from './types'

const savings: Account = {
  id: 10,
  type: 'SAVINGS',
  number: '5300000001',
  status: 'ACTIVE',
  balance: 100000,
  overdraftLimit: 0,
  availableBalance: 100000,
  gmfExempt: false,
  clientId: 1,
  createdAt: '2026-11-25T09:00:00',
  updatedAt: '2026-11-25T09:00:00',
}

const deposit: Transaction = {
  id: 1,
  accountId: 10,
  type: 'DEPOSIT',
  direction: 'CREDIT',
  amount: 50000.5,
  balanceAfter: 150000.5,
  counterpartyAccountId: null,
  reference: '7f1c2a3e-0000-4000-8000-000000000001',
  createdAt: '2026-11-27T10:00:00',
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function problem(status: number, code: string) {
  return json(status, { title: 'Error', detail: 'Backend detail', code }, 'application/problem+json')
}

function mockApi(onMovement: () => Response, account: Account = savings) {
  fetchMock.mockImplementation(async (url, init) => {
    if (init?.method === 'POST') return onMovement()
    if (url === '/api/clients') return json(200, [])
    if (url === '/api/accounts') return json(200, [account])
    return json(200, [])
  })
}

function movementRequest() {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
  return call && { url: call[0], body: JSON.parse(String(call[1]?.body)) }
}

function requestsTo(url: string) {
  return fetchMock.mock.calls.filter(([calledUrl, init]) => calledUrl === url && init?.method === 'GET')
}

async function openDialog(user: UserEvent, name: 'Consignar' | 'Retirar') {
  await renderRoute('/transactions?accountId=10')
  await screen.findByText('Esta cuenta no tiene movimientos.')
  await user.click(screen.getByRole('button', { name }))
  return screen.getByRole('dialog', { name })
}

describe('MovementDialog', () => {
  beforeAll(() => import('./TransactionsPage'))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('makes a deposit, closes the dialog and reloads the statement and the accounts', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, deposit))
    const dialog = await openDialog(user, 'Consignar')

    await user.type(within(dialog).getByLabelText(/Monto/), '50000,50')
    await user.click(within(dialog).getByRole('button', { name: 'Consignar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(movementRequest()).toEqual({
      url: '/api/transactions/deposits',
      body: { accountId: 10, amount: 50000.5 },
    })
    expect(requestsTo('/api/accounts/10/transactions')).toHaveLength(2)
    expect(requestsTo('/api/accounts')).toHaveLength(2)
  })

  it('makes a withdrawal through its endpoint and shows the available balance', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, { ...deposit, type: 'WITHDRAWAL', direction: 'DEBIT' }))
    const dialog = await openDialog(user, 'Retirar')

    expect(within(dialog).getByText(/Disponible \$ 100\.000,00/)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/Monto/), '20000')
    await user.click(within(dialog).getByRole('button', { name: 'Retirar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(movementRequest()).toEqual({
      url: '/api/transactions/withdrawals',
      body: { accountId: 10, amount: 20000 },
    })
  })

  it('validates the amount before calling the API', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, deposit))
    const dialog = await openDialog(user, 'Consignar')

    await user.type(within(dialog).getByLabelText(/Monto/), '10,555')
    await user.click(within(dialog).getByRole('button', { name: 'Consignar' }))

    expect(
      await within(dialog).findByText('Ingresa un monto válido, sin puntos de miles y con máximo 2 decimales'),
    ).toBeInTheDocument()
    expect(movementRequest()).toBeUndefined()
  })

  it('shows insufficient funds under the amount and keeps the dialog open', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => problem(409, 'INSUFFICIENT_FUNDS'))
    const dialog = await openDialog(user, 'Retirar')

    await user.type(within(dialog).getByLabelText(/Monto/), '500000')
    await user.click(within(dialog).getByRole('button', { name: 'Retirar' }))

    expect(await within(dialog).findByText('La cuenta no tiene saldo disponible suficiente.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Monto/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows other business errors in an alert', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => problem(409, 'ACCOUNT_NOT_ACTIVE'))
    const dialog = await openDialog(user, 'Consignar')

    await user.type(within(dialog).getByLabelText(/Monto/), '1000')
    await user.click(within(dialog).getByRole('button', { name: 'Consignar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Solo se pueden hacer movimientos en cuentas activas.',
    )
  })

  it('closes without calling the API when cancelling', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, deposit))
    const dialog = await openDialog(user, 'Consignar')

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(movementRequest()).toBeUndefined()
  })

  it('offers no movements on an account that is not active', async () => {
    mockApi(() => json(201, deposit), { ...savings, status: 'INACTIVE' })

    await renderRoute('/transactions?accountId=10')

    expect(await screen.findByText('La cuenta no está activa: no admite movimientos.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Consignar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retirar' })).not.toBeInTheDocument()
  })
})
