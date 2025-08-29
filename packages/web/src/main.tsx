import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import Home from './pages/Home';
import Stats from './pages/Stats';
import ImportPage from './pages/Import';
import Login from './pages/Login';
import ItemDetail from './pages/ItemDetail';
import WikiIndex from './pages/WikiIndex';
import WikiPage from './pages/WikiPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'stats', element: <Stats /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'login', element: <Login /> },
      { path: 'item/:slug', element: <ItemDetail /> },
      { path: 'wiki', element: <WikiIndex /> },
      { path: 'wiki/:slug', element: <WikiPage /> }
    ]
  }
]);

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
