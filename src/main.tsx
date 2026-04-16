import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from './components/theme-provider.tsx'
import { AuthProvider } from './components/login/authContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
