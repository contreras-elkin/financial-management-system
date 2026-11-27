import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/ApiError'
import { useAccounts } from '../accounts/hooks'
import { useAccountTransactions, useDeposit, useTransfer, useWithdraw } from './hooks'
import type { DepositInput, Transaction, TransferInput } from './types'

const deposit: Transaction = {
  id: 1,
  accountId: 10,
  type: 'DEPOSIT',
  direction: 'CREDIT',
  amount: 50000,
  balanceAfter: 50000,
  counterpartyAccountId: null,
  reference: '7f1c2a3e-0000-4000-8000-000000000001',
  createdAt: '2026-11-27T10:00:00',
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function mockApi(onMutation: () => Response) {
  fetchMock.mockImplementation(async (url, init) => {
    if ((init?.method ?? 'GET') !== 'GET') return onMutation()
    return url === '/api/accounts' ? json(200, []) : json(200, [deposit])
  })
}

function requestsTo(url: string) {
  return fetchMock.mock.calls.filter(([calledUrl, init]) => calledUrl === url && init?.method === 'GET')
}

// Monta también la lista de cuentas para comprobar que un movimiento refresca los saldos.
function renderTransactionHooks(accountId?: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(
    () => ({
      accounts: useAccounts(),
      statement: useAccountTransactions(accountId),
      deposit: useDeposit(),
      withdraw: useWithdraw(),
      transfer: useTransfer(),
    }),
    { wrapper },
  )
}

async function renderWithLoadedStatement() {
  const hook = renderTransactionHooks(10)
  await waitFor(() => {
    expect(hook.result.current.accounts.isSuccess).toBe(true)
    expect(hook.result.current.statement.isSuccess).toBe(true)
  })
  return hook
}

describe('transaction hooks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads the statement of an account', async () => {
    mockApi(() => json(500, {}))

    const { result } = await renderWithLoadedStatement()

    expect(result.current.statement.data).toEqual([deposit])
    expect(requestsTo('/api/accounts/10/transactions')).toHaveLength(1)
  })

  it('does not request a statement without an account', async () => {
    mockApi(() => json(500, {}))

    const { result } = renderTransactionHooks()
    await waitFor(() => expect(result.current.accounts.isSuccess).toBe(true))

    expect(result.current.statement.fetchStatus).toBe('idle')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/accounts'])
  })

  it('makes a deposit and reloads the statement and the accounts', async () => {
    mockApi(() => json(201, deposit))
    const { result } = await renderWithLoadedStatement()
    const input: DepositInput = { accountId: 10, amount: 50000 }

    await act(() => result.current.deposit.mutateAsync(input))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transactions/deposits',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    )
    expect(requestsTo('/api/accounts/10/transactions')).toHaveLength(2)
    expect(requestsTo('/api/accounts')).toHaveLength(2)
  })

  it('makes a withdrawal through its endpoint', async () => {
    mockApi(() => json(201, { ...deposit, type: 'WITHDRAWAL', direction: 'DEBIT' }))
    const { result } = await renderWithLoadedStatement()

    await act(() => result.current.withdraw.mutateAsync({ accountId: 10, amount: 20000 }))

    expect(fetchMock).toHaveBeenCalledWith('/api/transactions/withdrawals', expect.objectContaining({ method: 'POST' }))
    expect(requestsTo('/api/accounts')).toHaveLength(2)
  })

  it('makes a transfer and reloads the statement and the accounts', async () => {
    mockApi(() => json(201, [deposit, deposit]))
    const { result } = await renderWithLoadedStatement()
    const input: TransferInput = { sourceAccountId: 10, targetAccountId: 11, amount: 30000 }

    await act(() => result.current.transfer.mutateAsync(input))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transactions/transfers',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    )
    expect(requestsTo('/api/accounts/10/transactions')).toHaveLength(2)
    expect(requestsTo('/api/accounts')).toHaveLength(2)
  })

  it('exposes the API error and keeps the data when a movement fails', async () => {
    mockApi(() =>
      json(
        409,
        { title: 'Conflict with current state', detail: 'Insufficient funds', code: 'INSUFFICIENT_FUNDS' },
        'application/problem+json',
      ),
    )
    const { result } = await renderWithLoadedStatement()

    await act(async () => {
      await expect(result.current.withdraw.mutateAsync({ accountId: 10, amount: 999999 })).rejects.toBeInstanceOf(
        ApiError,
      )
    })

    await waitFor(() => expect(result.current.withdraw.error?.code).toBe('INSUFFICIENT_FUNDS'))
    expect(requestsTo('/api/accounts/10/transactions')).toHaveLength(1)
    expect(requestsTo('/api/accounts')).toHaveLength(1)
  })
})
