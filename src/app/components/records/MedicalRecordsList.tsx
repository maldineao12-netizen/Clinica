import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serverUrl } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MedicalRecordForm } from './MedicalRecordForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { FileText, Plus, Edit, Trash2, Eye, Activity, Pill, FlaskConical } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  chiefComplaint: string;
  diagnosis: string;
  prescriptions: any[];
  exams: any[];
  vitalSigns: any;
}

export function MedicalRecordsList() {
  const { session } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    try {
      const response = await fetch(`${serverUrl}/records`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch records');

      const data = await response.json();
      const allRecords = data.records || [];

      // Sort by date descending
      allRecords.sort((a: MedicalRecord, b: MedicalRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(allRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Erro ao carregar prontuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este prontuário?')) return;

    try {
      const response = await fetch(`${serverUrl}/records/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete record');

      toast.success('Prontuário excluído com sucesso');
      fetchAllRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Erro ao excluir prontuário');
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedRecord(null);
    fetchAllRecords();
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
          <h2 className="text-3xl font-bold tracking-tight">Consultas & Prontuários</h2>
          <p className="text-muted-foreground">
            Histórico completo de consultas e prontuários médicos
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum prontuário registrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Acesse a página de pacientes para criar prontuários
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-lg">{record.patientName}</div>
                        <p className="text-sm font-normal text-muted-foreground">
                          {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {record.prescriptions?.length > 0 && (
                        <Badge variant="secondary">
                          <Pill className="w-3 h-3 mr-1" />
                          {record.prescriptions.length} Rx
                        </Badge>
                      )}
                      {record.exams?.length > 0 && (
                        <Badge variant="secondary">
                          <FlaskConical className="w-3 h-3 mr-1" />
                          {record.exams.length} Exames
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {record.chiefComplaint && (
                      <div>
                        <span className="text-sm font-semibold">Queixa: </span>
                        <span className="text-sm">{record.chiefComplaint}</span>
                      </div>
                    )}
                    {record.diagnosis && (
                      <div>
                        <span className="text-sm font-semibold">Diagnóstico: </span>
                        <span className="text-sm">{record.diagnosis}</span>
                      </div>
                    )}
                    {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span>Sinais vitais registrados</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewRecord(record)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Completo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedRecord ? 'Editar Prontuário' : 'Novo Prontuário'}
            </DialogTitle>
            <DialogDescription>
              Formulário de prontuário médico
            </DialogDescription>
          </DialogHeader>
          <MedicalRecordForm
            record={selectedRecord}
            patientId={selectedRecord?.patientId || ''}
            patientName={selectedRecord?.patientName || ''}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prontuário Completo</DialogTitle>
            <DialogDescription>
              {viewRecord?.patientName} -{' '}
              {viewRecord && format(new Date(viewRecord.date), "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Queixa Principal</h4>
                <p className="text-sm">{viewRecord.chiefComplaint || 'Não registrado'}</p>
              </div>

              {viewRecord.vitalSigns && Object.keys(viewRecord.vitalSigns).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Sinais Vitais</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewRecord.vitalSigns.temperature && (
                      <div>Temperatura: {viewRecord.vitalSigns.temperature}°C</div>
                    )}
                    {viewRecord.vitalSigns.bloodPressure && (
                      <div>Pressão: {viewRecord.vitalSigns.bloodPressure}</div>
                    )}
                    {viewRecord.vitalSigns.heartRate && (
                      <div>FC: {viewRecord.vitalSigns.heartRate} bpm</div>
                    )}
                    {viewRecord.vitalSigns.weight && (
                      <div>Peso: {viewRecord.vitalSigns.weight} kg</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Diagnóstico</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {viewRecord.diagnosis || 'Não registrado'}
                </p>
              </div>

              {viewRecord.prescriptions && viewRecord.prescriptions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Prescrições</h4>
                  <div className="space-y-2">
                    {viewRecord.prescriptions.map((rx: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="text-sm">
                            <div className="font-medium">{rx.medication}</div>
                            <div className="text-muted-foreground">
                              {rx.dosage} - {rx.frequency} - {rx.duration}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {viewRecord.exams && viewRecord.exams.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Exames Solicitados</h4>
                  <div className="space-y-2">
                    {viewRecord.exams.map((exam: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="text-sm">
                            <div className="font-medium">{exam.name}</div>
                            <div className="text-muted-foreground">
                              Tipo: {exam.type}
                            </div>
                            {exam.notes && (
                              <div className="text-muted-foreground mt-1">
                                {exam.notes}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
