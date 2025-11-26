import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verificarEmailRequest } from '../services/auth.services.js';

export default function VerificarEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verificando'); // verificando | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    verificarEmail();
  }, [token]);

  const verificarEmail = async () => {
    try {
      const response = await verificarEmailRequest(token);
      setStatus('success');
      setMessage(response.message);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Error al verificar el email. El enlace puede haber expirado.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verificando' && (
          <>
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Verificando...</h2>
            <p className="text-gray-600">Por favor espera un momento</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              ¡Email Verificado!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-400">
              Redirigiendo al login en 3 segundos...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ir al Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Error de Verificación
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}