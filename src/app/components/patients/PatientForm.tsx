import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serverUrl } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { Patient } from './PatientList';

interface PatientFormProps {
  patient?: Patient | null;
  onClose: () => void;
}

export function PatientForm({ patient, onClose }: PatientFormProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    address: '',
    birthDate: '',
    medicalHistory: '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        cpf: patient.cpf,
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        birthDate: patient.birthDate || '',
        medicalHistory: patient.medicalHistory || '',
      });
    }
  }, [patient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = patient
        ? `${serverUrl}/patients/${patient.id}`
        : `${serverUrl}/patients`;
      const method = patient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save patient');
      }

      toast.success(
        patient ? 'Paciente atualizado com sucesso' : 'Paciente criado com sucesso'
      );
      onClose();
    } catch (error: any) {
      console.error('Error saving patient:', error);
      toast.error(error.message || 'Erro ao salvar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">
          {patient ? 'Editar Paciente' : 'Novo Paciente'}
        </h3>
        <p className="text-muted-foreground">
          Preencha os dados do paciente abaixo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">Bilhete de Identidade *</Label>
          <Input
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="000000000AA000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            placeholder="paciente@email.com"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={loading}
            placeholder="Rua, número, bairro, cidade - UF"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="medicalHistory">Histórico Médico</Label>
          <Textarea
            id="medicalHistory"
            name="medicalHistory"
            value={formData.medicalHistory}
            onChange={handleChange}
            disabled={loading}
            placeholder="Anamnese, condições pré-existentes, alergias, medicações..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : patient ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
