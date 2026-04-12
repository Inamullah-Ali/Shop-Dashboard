import { Routes, Route, Navigate } from 'react-router'
import { TooltipProvider } from './components/ui/tooltip'
import Feature from './feature/feature'
import Dashboard from './page/dashboard'
import Setting from './page/setting'
import Shop from './page/shop'
import Products from './page/products'
import Payment from './page/payment'
import Plans from './page/plans'
import Reports from './page/reports'

function App() {

  return (
    <TooltipProvider>
    <Routes>
      <Route path="/" element={<Feature/>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="shop" element={<Shop />} />
        <Route path="setting" element={<Setting />} />
        <Route path="products" element={<Products />} />
        <Route path="payment" element={<Payment />} />
        <Route path="plans" element={<Plans />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
    </TooltipProvider>
  )
}

export default App
