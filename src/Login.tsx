import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { SamuLogo } from './components/SamuLogo';
import { useAuth } from './AuthContext';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = window.location; // To check for state/message

  const handleLocalLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const success = login(email, password);
    
    if (success) {
      setLoading(false);
      navigate('/');
    } else {
      setLoading(false);
      setError('E-mail ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="bg-white p-2 rounded-full shadow-md mb-4">
            <SamuLogo className="h-32 w-32 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-samu-blue">SAMU 192</h1>
          <h2 className="text-sm font-bold text-samu-orange tracking-widest uppercase">Base Serra Talhada</h2>
        </div>
        <h3 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          Acesso ao Sistema
        </h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLocalLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-black text-samu-blue uppercase tracking-widest mb-2">
                E-mail / Login
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/20 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-black text-samu-blue uppercase tracking-widest mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-samu-blue focus:ring-2 focus:ring-samu-blue/20 outline-none transition-all font-medium"
              />
              {error && (
                <p className="mt-2 text-xs font-bold text-samu-red uppercase tracking-tight">
                  {error}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-xl text-sm font-black uppercase tracking-widest text-white bg-samu-blue hover:bg-samu-blue-hover focus:outline-none disabled:opacity-50 transition-all transform active:scale-95"
              >
                {loading ? 'Validando...' : 'Entrar no Sistema'}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-black text-samu-blue hover:text-samu-blue-hover uppercase text-xs tracking-widest"
                >
                  Cadastre-se aqui
                </button>
              </p>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-400 font-bold uppercase tracking-tighter text-[10px]">SAMU 192 - Serra Talhada/PE</span>
                </div>
              </div>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};
