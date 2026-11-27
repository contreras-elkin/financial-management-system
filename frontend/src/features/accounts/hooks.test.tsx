import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/ApiError'
import { useAccounts, useChangeAccountStatus, useOpenAccount } from './hooks'
import type { Account, OpenAccountInput } from './types'

const savings: Account = {
  id: 1,
  type: 'SAVINGS',
  number: '5300000001',
  status: 'ACTIVE',
  balance: 0,
  overdraftLimit: 0,
  availableBalance: 0,
  gmfExempt: true,
  clientId: 7,
  createdAt: '2026-11-26T10:00:00',
  updatedAt: '2026-11-26T10:00:00',
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function mockApi(onMutation: (method: string) => Response) {
  fetchMock.mockImplementation(async (_url, init) => {
    const method = init?.method ?? 'GET'
    return method === 'GET' ? json(200, [savings]) : onMutation(method)
  })
}

function requestsTo(url: string) {
  return fetchMock.mock.calls.filter(([calledUrl, init]) => calledUrl === url && init?.method === 'GET')
}

// Monta a la vez la lista completa y la filtrada para comprobar que una mutación refresca las dos.
function renderAccountHooks() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(
    () => ({
      all: useAccounts(),
      byClient: useAccounts(7),
      open: useOpenAccount(),
      changeStatus: useChangeAccountStatus(),
    }),
    { wrapper },
  )
}

async function renderWithLoadedLists() {
  const hook = renderAccountHooks()
  await waitFor(() => {
    expect(hook.result.current.all.isSuccess).toBe(true)
    expect(hook.result.current.byClient.isSuccess).toBe(true)
  })
  return hook
}

describe('account hooks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads all accounts and the accounts of a client', async () => {
    mockApi(() => json(500, {}))

    const { result } = await renderWithLoadedLists()

    expect(result.current.all.data).toEqual([savings])
    expect(requestsTo('/api/accounts')).toHaveLength(1)
    expect(requestsTo('/api/accounts?clientId=7')).toHaveLength(1)
  })

  it('opens an account and reloads every list', async () => {
    mockApi(() => json(201, savings))
    const { result } = await renderWithLoadedLists()
    const input: OpenAccountInput = { clientId: 7, type: 'SAVINGS', gmfExempt: true }

    await act(() => result.current.open.mutateAsync(input))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/accounts',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    )
    expect(requestsTo('/api/accounts')).toHaveLength(2)
    expect(requestsTo('/api/accounts?clientId=7')).toHaveLength(2)
  })

  it('changes the status through its action endpoint and reloads every list', async () => {
    mockApi(() => json(200, { ...savings, status: 'INACTIVE' }))
    const { result } = await renderWithLoadedLists()

    await act(() => result.current.changeStatus.mutateAsync({ id: 1, action: 'inactivate' }))

    expect(fetchMock).toHaveBeenCalledWith('/api/accounts/1/inactivate', expect.objectContaining({ method: 'PATCH' }))
    expect(requestsTo('/api/accounts')).toHaveLength(2)
    expect(requestsTo('/api/accounts?clientId=7')).toHaveLength(2)
  })

  it('exposes the API error and keeps the lists when a status change fails', async () => {
    mockApi(() =>
      json(
        409,
        { title: 'Conflict with current state', detail: 'Balance must be zero', code: 'ACCOUNT_BALANCE_NOT_ZERO' },
        'application/problem+json',
      ),
    )
    const { result } = await renderWithLoadedLists()

    await act(async () => {
      await expect(result.current.changeStatus.mutateAsync({ id: 1, action: 'cancel' })).rejects.toBeInstanceOf(
        ApiError,
      )
    })

    await waitFor(() => expect(result.current.changeStatus.error?.code).toBe('ACCOUNT_BALANCE_NOT_ZERO'))
    expect(requestsTo('/api/accounts')).toHaveLength(1)
  })
})
