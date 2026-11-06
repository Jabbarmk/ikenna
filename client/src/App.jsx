import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Stock from './pages/Stock';
import Quotations from './pages/Quotations';
import QuotationForm from './pages/QuotationForm';
import Purchases from './pages/Purchases';
import PurchaseForm from './pages/PurchaseForm';
import Sales from './pages/Sales';
import SalesForm from './pages/SalesForm';
import Returns from './pages/Returns';
import ReturnForm from './pages/ReturnForm';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/quotations/:id" element={<QuotationForm />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/purchases/:id" element={<PurchaseForm />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sales/:id" element={<SalesForm />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/returns/:id" element={<ReturnForm />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
