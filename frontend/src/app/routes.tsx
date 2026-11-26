import LinearProgress from '@mui/material/LinearProgress'
import type { RouteObject } from 'react-router'
import { Layout } from '../shared/components/Layout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * Las páginas de cada dominio se cargan bajo demanda (lazy): su código, con los formularios,
 * tablas y validaciones, va en un archivo aparte que solo se descarga al visitar la ruta.
 * Inicio y 404 son livianas y se quedan en el paquete principal.
 */
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    // Se muestra solo en la primera carga si la URL inicial es de una página diferida.
    hydrateFallbackElement: <LinearProgress aria-label="Cargando página" />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'clients',
        lazy: async () => {
          const { ClientsPage } = await import('../features/clients/ClientsPage')
          return { Component: ClientsPage }
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
