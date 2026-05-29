import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serverUrl } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Exam {
  name: string;
  type: string;
  notes: string;
}

interface VitalSigns {
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
  height?: string;
}

interface MedicalRecord {
  id?: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  date: string;
  chiefComplaint: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescriptions: Prescription[];
  exams: Exam[];
  notes: string;
  vitalSigns: VitalSigns;
}

interface MedicalRecordFormProps {
  record?: MedicalRecord | null;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  onClose: () => void;
}

export function MedicalRecordForm({ record, patientId, patientName, appointmentId, onClose }: MedicalRecordFormProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicalRecord>({
    patientId,
    patientName,
    appointmentId,
    date: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescriptions: [],
    exams: [],
    notes: '',
    vitalSigns: {},
  });

  useEffect(() => {
    if (record) {
      setFormData(record);
    }
  }, [record]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVitalSignChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [field]: value },
    }));
  };

  const addPrescription = () => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }],
    }));
  };

  const removePrescription = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index),
    }));
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const addExam = () => {
    setFormData((prev) => ({
      ...prev,
      exams: [...prev.exams, { name: '', type: '', notes: '' }],
    }));
  };

  const removeExam = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      exams: prev.exams.filter((_, i) => i !== index),
    }));
  };

  const updateExam = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      exams: prev.exams.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = record
        ? `${serverUrl}/records/${record.id}`
        : `${serverUrl}/records`;
      const method = record ? 'PUT' : 'POST';

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
        throw new Error(error.error || 'Falha ao salvar prontuário');
      }

      toast.success(
        record ? 'Prontuário atualizado com sucesso' : 'Prontuário criado com sucesso'
      );
      onClose();
    } catch (error: any) {
      console.error('Error saving record:', error);
      toast.error(error.message || 'Erro ao salvar prontuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">
          {record ? 'Editar Prontuário' : 'Novo Prontuário'}
        </h3>
        <p className="text-muted-foreground">Paciente: {patientName}</p>
      </div>

      <Tabs defaultValue="anamnese" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
          <TabsTrigger value="vitais">Sinais Vitais</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="prescricoes">Prescrições</TabsTrigger>
          <TabsTrigger value="exames">Exames</TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data da Consulta *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">Queixa Principal</Label>
            <Textarea
              id="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={(e) => handleChange('chiefComplaint', e.target.value)}
              disabled={loading}
              placeholder="Motivo da consulta..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Sintomas</Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={(e) => handleChange('symptoms', e.target.value)}
              disabled={loading}
              placeholder="Descrição detalhada dos sintomas..."
              rows={4}
            />
          </div>
        </TabsContent>

        <TabsContent value="vitais" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura (°C)</Label>
              <Input
                id="temperature"
                value={formData.vitalSigns.temperature || ''}
                onChange={(e) => handleVitalSignChange('temperature', e.target.value)}
                disabled={loading}
                placeholder="36.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodPressure">Pressão Arterial</Label>
              <Input
                id="bloodPressure"
                value={formData.vitalSigns.bloodPressure || ''}
                onChange={(e) => handleVitalSignChange('bloodPressure', e.target.value)}
                disabled={loading}
                placeholder="120/80"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartRate">Frequência Cardíaca (bpm)</Label>
              <Input
                id="heartRate"
                value={formData.vitalSigns.heartRate || ''}
                onChange={(e) => handleVitalSignChange('heartRate', e.target.value)}
                disabled={loading}
                placeholder="75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="respiratoryRate">Frequência Respiratória (rpm)</Label>
              <Input
                id="respiratoryRate"
                value={formData.vitalSigns.respiratoryRate || ''}
                onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value)}
                disabled={loading}
                placeholder="16"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                value={formData.vitalSigns.weight || ''}
                onChange={(e) => handleVitalSignChange('weight', e.target.value)}
                disabled={loading}
                placeholder="70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                value={formData.vitalSigns.height || ''}
                onChange={(e) => handleVitalSignChange('height', e.target.value)}
                disabled={loading}
                placeholder="170"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnostico" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleChange('diagnosis', e.target.value)}
              disabled={loading}
              placeholder="Diagnóstico clínico..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment">Tratamento</Label>
            <Textarea
              id="treatment"
              value={formData.treatment}
              onChange={(e) => handleChange('treatment', e.target.value)}
              disabled={loading}
              placeholder="Plano de tratamento..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={loading}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="prescricoes" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Prescrições Médicas</Label>
            <Button type="button" onClick={addPrescription} size="sm" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {formData.prescriptions.map((prescription, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Medicamento {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrescription(index)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Medicamento</Label>
                        <Input
                          value={prescription.medication}
                          onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                          placeholder="Nome do medicamento"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dosagem</Label>
                        <Input
                          value={prescription.dosage}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          placeholder="Ex: 500mg"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Input
                          value={prescription.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                          placeholder="Ex: 3x ao dia"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração</Label>
                        <Input
                          value={prescription.duration}
                          onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                          placeholder="Ex: 7 dias"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {formData.prescriptions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma prescrição adicionada
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="exames" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Exames Solicitados</Label>
            <Button type="button" onClick={addExam} size="sm" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {formData.exams.map((exam, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Exame {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExam(index)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Exame</Label>
                        <Input
                          value={exam.name}
                          onChange={(e) => updateExam(index, 'name', e.target.value)}
                          placeholder="Ex: Hemograma completo"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Input
                          value={exam.type}
                          onChange={(e) => updateExam(index, 'type', e.target.value)}
                          placeholder="Ex: Laboratório, Imagem"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={exam.notes}
                          onChange={(e) => updateExam(index, 'notes', e.target.value)}
                          placeholder="Instruções ou observações..."
                          disabled={loading}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {formData.exams.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum exame solicitado
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : record ? 'Atualizar' : 'Criar Prontuário'}
        </Button>
      </div>
    </form>
  );
}
