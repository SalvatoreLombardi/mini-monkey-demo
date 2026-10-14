import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Scena from './Scena.tsx'

// la scena nuova e' la pagina d'ingresso; ?vecchio mostra la prima versione del sito
const vecchio = new URLSearchParams(window.location.search).has('vecchio')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{vecchio ? <App /> : <Scena />}</StrictMode>,
)
