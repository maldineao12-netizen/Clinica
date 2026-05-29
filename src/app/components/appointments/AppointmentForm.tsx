import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serverUrl } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Appointment } from './AppointmentList';
import { Patient } from '../patients/PatientList';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onClose: () => void;
}

export function AppointmentForm({ appointment, onClose }: AppointmentFormProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    date: '',
    time: '',
    duration: '60',
    type: 'consulta',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  });

  useEffect(() => {
    fetchPatients();
    if (appointment) {
      setFormData({
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        date: appointment.date,
        time: appointment.time,
        duration: String(appointment.duration),
        type: appointment.type,
        notes: appointment.notes || '',
        status: appointment.status,
      });
    }
  }, [appointment]);

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
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientChange = (value: string) => {
    const patient = patients.find((p) => p.id === value);
    setFormData((prev) => ({
      ...prev,
      patientId: value,
      patientName: patient?.name || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = appointment
        ? `${serverUrl}/appointments/${appointment.id}`
        : `${serverUrl}/appointments`;
      const method = appointment ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        duration: parseInt(formData.duration),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save appointment');
      }

      toast.success(
        appointment
          ? 'Agendamento atualizado com sucesso'
          : 'Agendamento criado com sucesso'
      );
      onClose();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.error(error.message || 'Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">
          {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h3>
        <p className="text-muted-foreground">
          Preencha os dados do agendamento abaixo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="patientId">Paciente *</Label>
          <Select
            value={formData.patientId}
            onValueChange={handlePatientChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Horário *</Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duração (min) *</Label>
          <Input
            id="duration"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            required
            disabled={loading}
            min="15"
            step="15"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, type: value }))
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consulta">Consulta</SelectItem>
              <SelectItem value="retorno">Retorno</SelectItem>
              <SelectItem value="exame">Exame</SelectItem>
              <SelectItem value="procedimento">Procedimento</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
            placeholder="Notas adicionais sobre o agendamento..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : appointment ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
