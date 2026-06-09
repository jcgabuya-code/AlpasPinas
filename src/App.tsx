import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ScrollToHash } from './components/ScrollToHash';
import { Home } from './pages/Home';
import { Roster } from './pages/Roster';
import { Events } from './pages/Events';
import { Training } from './pages/Training';
import { Gallery } from './pages/Gallery';

const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/events" element={<Events />} />
            <Route path="/training" element={<Training />} />
            <Route path="/gallery" element={<Gallery />} />
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
    </ThemeProvider>
  );
}

export default App;
