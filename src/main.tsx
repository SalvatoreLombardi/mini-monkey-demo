import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Scena from './Scena.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode><Scena /></StrictMode>,
)
