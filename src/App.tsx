import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { ScrollToHash } from './components/ScrollToHash';
import { Home } from './pages/Home';
import { Roster } from './pages/Roster';
import { Events } from './pages/Events';
import { Training } from './pages/Training';
import { Gallery } from './pages/Gallery';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { JoinTeam } from './pages/JoinTeam';

const Admin = lazy(() => import('./pages/Admin'));
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then((m) => ({ default: m.Cart })));
const MyOrders = lazy(() => import('./pages/MyOrders').then((m) => ({ default: m.MyOrders })));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
        <BrowserRouter>
          <ScrollToHash />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/roster" element={<Roster />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/shop" element={<Suspense fallback={null}><Shop /></Suspense>} />
              <Route path="/shop/:slug" element={<Suspense fallback={null}><ProductDetail /></Suspense>} />
              <Route path="/cart" element={<Suspense fallback={null}><Cart /></Suspense>} />
              <Route path="/join-team" element={<JoinTeam />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              {/* Login-only pages */}
              <Route element={<RequireAuth />}>
                <Route path="/training" element={<Training />} />
                <Route path="/orders" element={<Suspense fallback={null}><MyOrders /></Suspense>} />
              </Route>
            </Route>
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <Admin />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
