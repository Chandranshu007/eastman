import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Toast from "./components/Toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import OrderConfirmation from "./pages/OrderConfirmation";
import Payment from "./pages/Payment";
import ProductDetails from "./pages/ProductDetails";
import Register from "./pages/Register";
import Home from "./pages/Home";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-loading">
          <div className="auth-brand">
            <span className="brand-mark auth-brand-mark">E</span>
            <span>Eastman <strong>Store</strong></span>
          </div>
          <p>Checking your session...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}

function AppShell() {
  const { toastMessage, dismissToast } = useCart();
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/product/:productId" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes>
      <Footer />
      <Toast message={toastMessage} onDismiss={dismissToast} />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </AuthProvider>
  );
}
