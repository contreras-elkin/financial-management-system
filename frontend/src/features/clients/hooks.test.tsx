import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/ApiError'
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from './hooks'
import type { Client, CreateClientInput } from './types'

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

const newClient: CreateClientInput = {
  identificationType: 'CC',
  identificationNumber: '200',
  firstName: 'Luis',
  lastName: 'Gómez',
  email: 'luis@mail.com',
  birthDate: '1985-01-20',
}

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

/** Responde la lista en cada GET y delega el resto de peticiones en `onMutation`. */
function mockApi(onMutation: (method: string) => Response) {
  fetchMock.mockImplementation(async (_url, init) => {
    const method = init?.method ?? 'GET'
    return method === 'GET' ? json(200, [ana]) : onMutation(method)
  })
}

function listRequests() {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'GET')
}

/** Monta la lista junto con las mutaciones para comprobar que estas la invalidan. */
function renderClientHooks() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(
    () => ({
      list: useClients(),
      create: useCreateClient(),
      update: useUpdateClient(),
      remove: useDeleteClient(),
    }),
    { wrapper },
  )
}

async function renderWithLoadedList() {
  const hook = renderClientHooks()
  await waitFor(() => expect(hook.result.current.list.isSuccess).toBe(true))
  return hook
}

describe('client hooks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads the client list', async () => {
    mockApi(() => json(500, {}))

    const { result } = await renderWithLoadedList()

    expect(result.current.list.data).toEqual([ana])
    expect(fetchMock).toHaveBeenCalledWith('/api/clients', expect.objectContaining({ method: 'GET' }))
  })

  it('creates a client and reloads the list', async () => {
    mockApi(() => json(201, { ...ana, id: 2 }))
    const { result } = await renderWithLoadedList()

    await act(() => result.current.create.mutateAsync(newClient))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/clients',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(newClient) }),
    )
    expect(listRequests()).toHaveLength(2)
  })

  it('updates a client without sending its identification and reloads the list', async () => {
    mockApi(() => json(200, ana))
    const { result } = await renderWithLoadedList()
    const input = { firstName: 'Ana María', lastName: 'Ruiz', email: 'ana@mail.com', birthDate: '1990-05-10' }

    await act(() => result.current.update.mutateAsync({ id: 1, input }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/clients/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(input) }),
    )
    expect(listRequests()).toHaveLength(2)
  })

  it('deletes a client and reloads the list', async () => {
    mockApi(() => new Response(null, { status: 204 }))
    const { result } = await renderWithLoadedList()

    await act(() => result.current.remove.mutateAsync(1))

    expect(fetchMock).toHaveBeenCalledWith('/api/clients/1', expect.objectContaining({ method: 'DELETE' }))
    expect(listRequests()).toHaveLength(2)
  })

  it('exposes the API error and keeps the list when a mutation fails', async () => {
    mockApi(() =>
      json(
        409,
        { title: 'Duplicate resource', detail: 'Already exists', code: 'CLIENT_ALREADY_EXISTS' },
        'application/problem+json',
      ),
    )
    const { result } = await renderWithLoadedList()

    await act(async () => {
      await expect(result.current.create.mutateAsync(newClient)).rejects.toBeInstanceOf(ApiError)
    })

    await waitFor(() => expect(result.current.create.error?.code).toBe('CLIENT_ALREADY_EXISTS'))
    expect(listRequests()).toHaveLength(1)
  })
})
