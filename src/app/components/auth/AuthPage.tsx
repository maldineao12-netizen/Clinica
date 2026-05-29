import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'login' | 'signup' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            HealthCare CRM
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de Gestão de Pacientes
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {mode === 'login' && (
            <LoginForm
              key="login"
              onToggleMode={() => setMode('signup')}
              onForgotPassword={() => setMode('forgot')}
            />
          )}
          {mode === 'signup' && (
            <SignupForm
              key="signup"
              onToggleMode={() => setMode('login')}
            />
          )}
          {mode === 'forgot' && (
            <ForgotPasswordForm
              key="forgot"
              onBack={() => setMode('login')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
