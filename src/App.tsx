import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToHash />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/roster" element={<Roster />} />
              <Route path="/events" element={<Events />} />
              <Route path="/training" element={<Training />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/join-team" element={<JoinTeam />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
