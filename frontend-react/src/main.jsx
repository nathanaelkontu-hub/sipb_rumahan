import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

// Render aplikasi React ke dalam elemen HTML dengan id 'root'
createRoot(document.getElementById('root')).render(
  // StrictMode digunakan saat development untuk mendeteksi potensi masalah di React
  <StrictMode>
    {/* Membungkus aplikasi dengan GoogleOAuthProvider agar fitur Login with Google berfungsi */}
    <GoogleOAuthProvider 
      clientId="452196391590-6j7ult3ersp1pchutf0gib7qt7qq4cbd.apps.googleusercontent.com"
      locale="id"
    >
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)