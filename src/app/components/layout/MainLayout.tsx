import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Dashboard } from '../dashboard/Dashboard';
import { PatientList } from '../patients/PatientList';
import { AppointmentList } from '../appointments/AppointmentList';
import { MedicalRecordsList } from '../records/MedicalRecordsList';
import { UserManagement } from '../users/UserManagement';
import { GlobalSearch } from '../search/GlobalSearch';
import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
    }
  };

  // Initialize dark mode on mount
  if (typeof window !== 'undefined' && darkMode) {
    document.documentElement.classList.add('dark');
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <PatientList />;
      case 'appointments':
        return <AppointmentList />;
      case 'records':
        return <MedicalRecordsList />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-end px-6 gap-4">
          <div className="w-full max-w-xl">
            <GlobalSearch />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
