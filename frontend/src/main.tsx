import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './store'
import { ToastProvider } from './components/Toast'
import { I18nProvider } from './i18n'
import StorePage from './pages/StorePage'
import CheckoutSuccess from './pages/CheckoutSuccess'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import Overview from './pages/admin/Overview'
import Categories from './pages/admin/Categories'
import Products from './pages/admin/Products'
import Promos from './pages/admin/Promos'
import Settings from './pages/admin/Settings'
import Gateways from './pages/admin/Gateways'
import AuditLogs from './pages/admin/AuditLogs'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <StoreProvider>
            <Routes>
              <Route path="/" element={<StorePage />} />
              <Route path="/category/:slug" element={<StorePage />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Overview />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="promos" element={<Promos />} />
                <Route path="settings" element={<Settings />} />
                <Route path="gateways" element={<Gateways />} />
                <Route path="audit" element={<AuditLogs />} />
              </Route>
            </Routes>
          </StoreProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
)
