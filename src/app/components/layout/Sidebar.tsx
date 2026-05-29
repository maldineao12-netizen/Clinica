import { motion } from 'motion/react';
import { LayoutDashboard, Users, Calendar, LogOut, Menu, X, UserCog, Shield, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { signOut, user, userRole, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor'] },
    { id: 'patients', label: 'Pacientes', icon: Users, roles: ['admin', 'doctor'] },
    { id: 'appointments', label: 'Agendamentos', icon: Calendar, roles: ['admin', 'doctor'] },
    { id: 'records', label: 'Consultas', icon: FileText, roles: ['admin', 'doctor'] },
    { id: 'users', label: 'Usuários', icon: UserCog, roles: ['admin'] },
  ].filter(item => !item.roles || item.roles.includes(userRole || ''));

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        className="fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-40 w-64 bg-card border-r flex flex-col"
      >
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">HealthCare CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.email || 'Sistema de Gestão'}
          </p>
          {userRole && (
            <div className="mt-2">
              <Badge variant={isAdmin() ? 'default' : 'secondary'} className="text-xs">
                {isAdmin() ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Administrador
                  </>
                ) : (
                  'Médico'
                )}
              </Badge>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleNavigate(item.id)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </motion.div>
    </>
  );
}
