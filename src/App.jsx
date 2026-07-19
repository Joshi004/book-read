import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import ChapterPage from './pages/ChapterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HighlightsPage from './pages/HighlightsPage.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="chapter/:number" element={<ChapterPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="highlights" element={<HighlightsPage />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
