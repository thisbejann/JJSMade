import { BrowserRouter, Routes, Route } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import OrdersList from "./pages/OrdersList";
import OrderForm from "./pages/OrderForm";
import OrderDetail from "./pages/OrderDetail";
import SellersList from "./pages/SellersList";
import SellerDetail from "./pages/SellerDetail";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/:id/edit" element={<OrderForm />} />
            <Route path="/sellers" element={<SellersList />} />
            <Route path="/sellers/:id" element={<SellerDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
