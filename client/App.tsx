import { Routes, Route } from 'react-router'
import { Layout } from './components/layout/Layout'
import { Setup } from './pages/Setup'
import { TableView } from './pages/TableView'
import { CalendarView } from './pages/CalendarView'
import { DocumentView } from './pages/DocumentView'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="table/:tableName" element={<TableView />} />
        <Route path="calendar/:tableName" element={<CalendarView />} />
        <Route path="document/:tableName" element={<DocumentView />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function Home() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select an item from the sidebar
    </div>
  )
}
