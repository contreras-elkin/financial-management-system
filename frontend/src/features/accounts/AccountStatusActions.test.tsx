import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import type { Account } from './types'

const active: Account = {
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

const inactive: Account = { ...active, id: 11, number: '3300000001', type: 'CHECKING', status: 'INACTIVE' }
const cancelled: Account = { ...active, id: 12, number: '5300000002', status: 'CANCELLED' }

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

function problem(code: string) {
  return json(409, { title: 'Conflict with current state', detail: 'Backend detail', code }, 'application/problem+json')
}

function mockApi(onPatch: () => Response) {
  fetchMock.mockImplementation(async (url, init) => {
    if (init?.method === 'PATCH') return onPatch()
    return url === '/api/clients' ? json(200, []) : json(200, [active, inactive, cancelled])
  })
}

function patchUrls() {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH').map(([url]) => url)
}

function accountListRequests() {
  return fetchMock.mock.calls.filter(([url]) => url === '/api/accounts')
}

async function renderAccounts() {
  await renderRoute('/accounts')
  return screen.findByRole('table', { name: 'Cuentas' })
}

describe('account status actions', () => {
  beforeAll(() => import('./AccountsPage'))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('offers only the transitions allowed by each status', async () => {
    mockApi(() => json(200, active))
    const table = await renderAccounts()
    const [, activeRow, inactiveRow, cancelledRow] = within(table).getAllByRole('row')

    expect(within(activeRow).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Inactivar la cuenta 5300000001',
      'Cancelar la cuenta 5300000001',
    ])
    expect(within(inactiveRow).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Activar la cuenta 3300000001',
      'Cancelar la cuenta 3300000001',
    ])
    expect(within(cancelledRow).queryAllByRole('button')).toHaveLength(0)
  })

  it('inactivates an account without confirmation and reloads the list', async () => {
    const user = userEvent.setup()
    mockApi(() => json(200, { ...active, status: 'INACTIVE' }))
    await renderAccounts()

    await user.click(screen.getByRole('button', { name: 'Inactivar la cuenta 5300000001' }))

    await waitFor(() => expect(accountListRequests()).toHaveLength(2))
    expect(patchUrls()).toEqual(['/api/accounts/10/inactivate'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a rejected status change in a notification', async () => {
    const user = userEvent.setup()
    mockApi(() => problem('INVALID_ACCOUNT_STATUS_TRANSITION'))
    await renderAccounts()

    await user.click(screen.getByRole('button', { name: 'Activar la cuenta 3300000001' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La cuenta no admite ese cambio de estado.')
    expect(patchUrls()).toEqual(['/api/accounts/11/activate'])
  })

  it('cancels an account after confirming', async () => {
    const user = userEvent.setup()
    mockApi(() => json(200, { ...active, status: 'CANCELLED' }))
    await renderAccounts()

    await user.click(screen.getByRole('button', { name: 'Cancelar la cuenta 5300000001' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancelar cuenta' })
    expect(dialog).toHaveTextContent('¿Cancelar la cuenta 5300000001?')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar cuenta' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(patchUrls()).toEqual(['/api/accounts/10/cancel'])
  })

  it('keeps the account when going back from the confirmation', async () => {
    const user = userEvent.setup()
    mockApi(() => json(200, active))
    await renderAccounts()

    await user.click(screen.getByRole('button', { name: 'Cancelar la cuenta 5300000001' }))
    await user.click(screen.getByRole('button', { name: 'Volver' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(patchUrls()).toEqual([])
  })

  it('explains why an account with balance cannot be cancelled', async () => {
    const user = userEvent.setup()
    mockApi(() => problem('ACCOUNT_BALANCE_NOT_ZERO'))
    await renderAccounts()

    await user.click(screen.getByRole('button', { name: 'Cancelar la cuenta 5300000001' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancelar cuenta' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar cuenta' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Solo se puede cancelar una cuenta con saldo $ 0.')
  })
})
