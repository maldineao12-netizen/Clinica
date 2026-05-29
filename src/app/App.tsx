import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return user ? <MainLayout /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="size-full">
        <AppContent />
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}