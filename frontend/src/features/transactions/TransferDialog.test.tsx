import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
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

const source: Account = {
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

const target: Account = {
  ...source,
  id: 11,
  type: 'CHECKING',
  number: '3300000001',
  overdraftLimit: 1000000,
  availableBalance: 1100000,
}

const inactive: Account = { ...source, id: 12, number: '5300000002', status: 'INACTIVE' }

const debit: Transaction = {
  id: 1,
  accountId: 10,
  type: 'TRANSFER',
  direction: 'DEBIT',
  amount: 30000,
  balanceAfter: 70000,
  counterpartyAccountId: 11,
  reference: '7f1c2a3e-0000-4000-8000-000000000001',
  createdAt: '2026-11-27T10:00:00',
}

const credit: Transaction = { ...debit, id: 2, accountId: 11, direction: 'CREDIT', counterpartyAccountId: 10 }

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function problem(status: number, code: string) {
  return json(status, { title: 'Error', detail: 'Backend detail', code }, 'application/problem+json')
}

function mockApi(onTransfer: () => Response, accounts: Account[] = [source, target, inactive]) {
  fetchMock.mockImplementation(async (url, init) => {
    if (init?.method === 'POST') return onTransfer()
    if (url === '/api/clients') return json(200, [ana])
    if (url === '/api/accounts') return json(200, accounts)
    return json(200, [])
  })
}

function transferRequest() {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
  return call && { url: call[0], body: JSON.parse(String(call[1]?.body)) }
}

function requestsTo(url: string) {
  return fetchMock.mock.calls.filter(([calledUrl, init]) => calledUrl === url && init?.method === 'GET')
}

async function openDialog(user: UserEvent) {
  await renderRoute('/transactions?accountId=10')
  await screen.findByText('Esta cuenta no tiene movimientos.')
  await user.click(screen.getByRole('button', { name: 'Transferir' }))
  return screen.getByRole('dialog', { name: 'Transferir' })
}

async function fillTransfer(user: UserEvent, dialog: HTMLElement, amount: string) {
  await user.click(within(dialog).getByRole('combobox', { name: /Cuenta destino/ }))
  await user.click(await screen.findByRole('option', { name: '3300000001 · Corriente · Ana Ruiz' }))
  await user.type(within(dialog).getByLabelText(/Monto/), amount)
}

describe('TransferDialog', () => {
  beforeAll(() => import('./TransactionsPage'))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('transfers to another account, closes the dialog and reloads the statement and the accounts', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, [debit, credit]))
    const dialog = await openDialog(user)

    await fillTransfer(user, dialog, '30000')
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(transferRequest()).toEqual({
      url: '/api/transactions/transfers',
      body: { sourceAccountId: 10, targetAccountId: 11, amount: 30000 },
    })
    expect(requestsTo('/api/accounts/10/transactions')).toHaveLength(2)
    expect(requestsTo('/api/accounts')).toHaveLength(2)
  })

  it('offers only the other active accounts as destination', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, [debit, credit]))
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('combobox', { name: /Cuenta destino/ }))

    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['3300000001 · Corriente · Ana Ruiz'])
  })

  it('asks for the destination and the amount before calling the API', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, [debit, credit]))
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }))

    expect(await within(dialog).findByText('Selecciona la cuenta destino')).toBeInTheDocument()
    expect(within(dialog).getByText('Ingresa el monto')).toBeInTheDocument()
    expect(transferRequest()).toBeUndefined()
  })

  it('shows insufficient funds under the amount and keeps the dialog open', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => problem(409, 'INSUFFICIENT_FUNDS'))
    const dialog = await openDialog(user)

    await fillTransfer(user, dialog, '500000')
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }))

    expect(await within(dialog).findByText('La cuenta no tiene saldo disponible suficiente.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Monto/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows other business errors in an alert', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => problem(409, 'ACCOUNT_NOT_ACTIVE'))
    const dialog = await openDialog(user)

    await fillTransfer(user, dialog, '1000')
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Solo se pueden hacer movimientos en cuentas activas.',
    )
  })

  it('explains when there is no account to receive the transfer', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi(() => json(201, [debit, credit]), [source, inactive])
    const dialog = await openDialog(user)

    expect(
      within(dialog).getByText('No hay otras cuentas activas que puedan recibir la transferencia.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Transferir' })).toBeDisabled()
  })
})
