import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serverUrl } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PatientForm } from './PatientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Search, Plus, Edit, Trash2, Eye, Users, Download, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MedicalRecordForm } from '../records/MedicalRecordForm';

export interface Patient {
  id: string;
  userId: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  medicalHistory: string;
  created_at: string;
  updated_at: string;
}

export function PatientList() {
  const { session } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordPatient, setRecordPatient] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${serverUrl}/patients`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch patients');

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;

    try {
      const response = await fetch(`${serverUrl}/patients/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete patient');

      toast.success('Paciente excluído com sucesso');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao excluir paciente');
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowForm(true);
  };

  const handleView = (patient: Patient) => {
    setViewPatient(patient);
  };

  const handleCreateRecord = (patient: Patient) => {
    setRecordPatient({ id: patient.id, name: patient.name });
    setShowRecordForm(true);
  };

  const handleRecordFormClose = () => {
    setShowRecordForm(false);
    setRecordPatient(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedPatient(null);
    fetchPatients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">
            Gerencie todos os pacientes cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportToCSV(patients, 'pacientes')}>
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToJSON(patients, 'pacientes')}>
                Exportar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, Bilhete de Identidade, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? 'Nenhum paciente encontrado'
                : 'Nenhum paciente cadastrado ainda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-lg">{patient.name}</span>
                    <Badge variant="outline">
                      {new Date().getFullYear() -
                        new Date(patient.birthDate || '2000-01-01').getFullYear()}{' '}
                      anos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">BI:</span>{' '}
                    {patient.cpf}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Telefone:</span>{' '}
                    {patient.phone || 'N/A'}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {patient.email || 'N/A'}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(patient)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateRecord(patient)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Prontuário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(patient)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(patient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedPatient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
            <DialogDescription>
              {selectedPatient ? 'Edite as informações do paciente' : 'Adicione um novo paciente ao sistema'}
            </DialogDescription>
          </DialogHeader>
          <PatientForm patient={selectedPatient} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPatient} onOpenChange={() => setViewPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewPatient?.name}</DialogTitle>
            <DialogDescription>Detalhes completos do paciente</DialogDescription>
          </DialogHeader>
          {viewPatient && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <span className="font-semibold">BI:</span> {viewPatient.cpf}
                </div>
                <div>
                  <span className="font-semibold">Data de Nascimento:</span>{' '}
                  {viewPatient.birthDate
                    ? new Date(viewPatient.birthDate).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Telefone:</span>{' '}
                  {viewPatient.phone || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Email:</span>{' '}
                  {viewPatient.email || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Endereço:</span>{' '}
                  {viewPatient.address || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Histórico Médico:</span>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {viewPatient.medicalHistory || 'Nenhum histórico registrado'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    handleCreateRecord(viewPatient);
                    setViewPatient(null);
                  }}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Criar Prontuário para este Paciente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRecordForm} onOpenChange={setShowRecordForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Novo Prontuário</DialogTitle>
            <DialogDescription>Criar prontuário médico</DialogDescription>
          </DialogHeader>
          {recordPatient && (
            <MedicalRecordForm
              patientId={recordPatient.id}
              patientName={recordPatient.name}
              onClose={handleRecordFormClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
