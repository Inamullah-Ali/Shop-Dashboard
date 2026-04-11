import { Routes, Route, Navigate } from 'react-router'
import { TooltipProvider } from './components/ui/tooltip'
import Feature from './feature/feature'
import Dashboard from './page/dashboard'
import Setting from './page/setting'
import Shop from './page/shop'
import Products from './page/products'

function App() {

  return (
    <TooltipProvider>
    <Routes>
      <Route path="/" element={<Feature/>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="Dashboard" element={<Dashboard />} />
        <Route path="shop" element={<Shop />} />
        <Route path="setting" element={<Setting />} />
        <Route path="products" element={<Products />} />
      </Route>
    </Routes>
    </TooltipProvider>
  )
}

export default App
