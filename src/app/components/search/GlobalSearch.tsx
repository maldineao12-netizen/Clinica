import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serverUrl } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchResult {
  type: 'patient' | 'appointment';
  id: string;
  title: string;
  subtitle: string;
  data: any;
}

export function GlobalSearch() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        fetch(`${serverUrl}/patients`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        fetch(`${serverUrl}/appointments`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
      ]);

      const patientsData = await patientsRes.json();
      const appointmentsData = await appointmentsRes.json();

      const patients = patientsData.patients || [];
      const appointments = appointmentsData.appointments || [];

      const searchLower = query.toLowerCase();

      const patientResults: SearchResult[] = patients
        .filter(
          (p: any) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.cpf.includes(query) ||
            p.email?.toLowerCase().includes(searchLower) ||
            p.phone?.includes(query)
        )
        .map((p: any) => ({
          type: 'patient' as const,
          id: p.id,
          title: p.name,
          subtitle: `BI: ${p.cpf} | Tel: ${p.phone || 'N/A'}`,
          data: p,
        }));

      const appointmentResults: SearchResult[] = appointments
        .filter(
          (a: any) =>
            a.patientName.toLowerCase().includes(searchLower) ||
            a.type.toLowerCase().includes(searchLower) ||
            a.notes?.toLowerCase().includes(searchLower)
        )
        .map((a: any) => ({
          type: 'appointment' as const,
          id: a.id,
          title: a.patientName,
          subtitle: `${a.date} às ${a.time} - ${a.type}`,
          data: a,
        }));

      setResults([...patientResults, ...appointmentResults]);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar pacientes ou agendamentos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10"
        />
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2"
          >
            <Card className="max-h-96 overflow-y-auto shadow-lg">
              <CardContent className="p-0">
                {results.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {result.type === 'patient' ? (
                          <User className="w-5 h-5 text-primary" />
                        ) : (
                          <Calendar className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.type === 'patient' ? 'Paciente' : 'Agendamento'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2"
        >
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              Nenhum resultado encontrado
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
