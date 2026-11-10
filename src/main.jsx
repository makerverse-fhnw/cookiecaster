import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.jsx'
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import './main.css'
import {ServicesProvider} from "./business-logic/services/ServicesProvider.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ServicesProvider>
            <App/>
        </ServicesProvider>
    </StrictMode>,
)
