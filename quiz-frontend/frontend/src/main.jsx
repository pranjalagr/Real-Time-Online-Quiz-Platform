import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter,Routes,Route,Navigate,useNavigate } from "react-router-dom";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
)
