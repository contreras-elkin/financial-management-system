import type { RouteObject } from 'react-router'
import { ClientsPage } from '../features/clients/ClientsPage'
import { Layout } from '../shared/components/Layout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
