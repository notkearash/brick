import { Routes, Route } from 'react-router'
import { Layout } from './components/layout/Layout'
import { Setup } from './pages/Setup'
import { TableView } from './pages/TableView'

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="table/:tableName" element={<TableView />} />
      </Route>
    </Routes>
  )
}

function Home() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a table from the sidebar
    </div>
  )
}
