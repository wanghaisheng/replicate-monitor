import { Dashboard } from './components/Dashboard'

function App(): JSX.Element {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Replicate Monitor</h1>
      <Dashboard />
    </div>
  )
}

export default App
