import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Supabase client helper
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
};

// Auth middleware to verify user
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('userId', user.id);
  c.set('user', user);
  await next();
};

// ============= AUTH ROUTES =============

// Sign up
app.post("/make-server-0418aac9/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios' }, 400);
    }

    if (!role || !['admin', 'doctor'].includes(role)) {
      return c.json({ error: 'Tipo de usuário inválido' }, 400);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name: name || '',
        role: role
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name: name || '',
      role: role,
      created_at: new Date().toISOString()
    });

    return c.json({
      user: data.user,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Falha ao criar usuário: ' + error.message }, 500);
  }
});

// ============= USER MANAGEMENT ROUTES (Admin only) =============

// Get all users (admin only)
app.get("/make-server-0418aac9/users", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);

    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Acesso negado. Apenas administradores podem acessar.' }, 403);
    }

    const users = await kv.getByPrefix(`user:`);
    return c.json({ users: users || [] });
  } catch (error) {
    console.log('Error fetching users:', error);
    return c.json({ error: 'Falha ao buscar usuários: ' + error.message }, 500);
  }
});

// Update user role (admin only)
app.put("/make-server-0418aac9/users/:id/role", requireAuth, async (c) => {
  try {
    const currentUserId = c.get('userId');
    const currentUser = await kv.get(`user:${currentUserId}`);

    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Acesso negado. Apenas administradores podem alterar roles.' }, 403);
    }

    const targetUserId = c.req.param('id');
    const { role } = await c.req.json();

    if (!['admin', 'doctor'].includes(role)) {
      return c.json({ error: 'Role inválido' }, 400);
    }

    const user = await kv.get(`user:${targetUserId}`);
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    user.role = role;
    user.updated_at = new Date().toISOString();
    await kv.set(`user:${targetUserId}`, user);

    return c.json({ user, message: 'Role atualizado com sucesso' });
  } catch (error) {
    console.log('Error updating role:', error);
    return c.json({ error: 'Falha ao atualizar role: ' + error.message }, 500);
  }
});

// Delete user (admin only)
app.delete("/make-server-0418aac9/users/:id", requireAuth, async (c) => {
  try {
    const currentUserId = c.get('userId');
    const currentUser = await kv.get(`user:${currentUserId}`);

    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Acesso negado. Apenas administradores podem excluir usuários.' }, 403);
    }

    const targetUserId = c.req.param('id');

    if (targetUserId === currentUserId) {
      return c.json({ error: 'Você não pode excluir sua própria conta' }, 400);
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.admin.deleteUser(targetUserId);

    if (error) {
      console.log('Error deleting user from auth:', error);
    }

    await kv.del(`user:${targetUserId}`);

    return c.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.log('Error deleting user:', error);
    return c.json({ error: 'Falha ao excluir usuário: ' + error.message }, 500);
  }
});

// ============= PATIENT ROUTES =============

// Get all patients for the authenticated user
app.get("/make-server-0418aac9/patients", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patients = await kv.getByPrefix(`patient:${userId}:`);
    return c.json({ patients: patients || [] });
  } catch (error) {
    console.log('Error fetching patients:', error);
    return c.json({ error: 'Failed to fetch patients: ' + error.message }, 500);
  }
});

// Get single patient
app.get("/make-server-0418aac9/patients/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.param('id');
    const patient = await kv.get(`patient:${userId}:${patientId}`);

    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404);
    }

    return c.json({ patient });
  } catch (error) {
    console.log('Error fetching patient:', error);
    return c.json({ error: 'Failed to fetch patient: ' + error.message }, 500);
  }
});

// Create patient
app.post("/make-server-0418aac9/patients", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, cpf, phone, email, address, birthDate, medicalHistory } = body;

    if (!name || !cpf) {
      return c.json({ error: 'Nome e Bilhete de Identidade são obrigatórios' }, 400);
    }

    const patientId = crypto.randomUUID();
    const patient = {
      id: patientId,
      userId,
      name,
      cpf,
      phone: phone || '',
      email: email || '',
      address: address || '',
      birthDate: birthDate || '',
      medicalHistory: medicalHistory || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`patient:${userId}:${patientId}`, patient);

    return c.json({ patient, message: 'Patient created successfully' });
  } catch (error) {
    console.log('Error creating patient:', error);
    return c.json({ error: 'Failed to create patient: ' + error.message }, 500);
  }
});

// Update patient
app.put("/make-server-0418aac9/patients/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.param('id');
    const body = await c.req.json();

    const existingPatient = await kv.get(`patient:${userId}:${patientId}`);
    if (!existingPatient) {
      return c.json({ error: 'Patient not found' }, 404);
    }

    const updatedPatient = {
      ...existingPatient,
      ...body,
      id: patientId,
      userId,
      updated_at: new Date().toISOString()
    };

    await kv.set(`patient:${userId}:${patientId}`, updatedPatient);

    return c.json({ patient: updatedPatient, message: 'Patient updated successfully' });
  } catch (error) {
    console.log('Error updating patient:', error);
    return c.json({ error: 'Failed to update patient: ' + error.message }, 500);
  }
});

// Delete patient
app.delete("/make-server-0418aac9/patients/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.param('id');

    const existingPatient = await kv.get(`patient:${userId}:${patientId}`);
    if (!existingPatient) {
      return c.json({ error: 'Patient not found' }, 404);
    }

    await kv.del(`patient:${userId}:${patientId}`);

    return c.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.log('Error deleting patient:', error);
    return c.json({ error: 'Failed to delete patient: ' + error.message }, 500);
  }
});

// ============= APPOINTMENT ROUTES =============

// Get all appointments for the authenticated user
app.get("/make-server-0418aac9/appointments", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const appointments = await kv.getByPrefix(`appointment:${userId}:`);
    return c.json({ appointments: appointments || [] });
  } catch (error) {
    console.log('Error fetching appointments:', error);
    return c.json({ error: 'Failed to fetch appointments: ' + error.message }, 500);
  }
});

// Create appointment
app.post("/make-server-0418aac9/appointments", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { patientId, patientName, date, time, duration, type, notes, status } = body;

    if (!patientId || !date || !time) {
      return c.json({ error: 'Patient, date, and time are required' }, 400);
    }

    const appointmentId = crypto.randomUUID();
    const appointment = {
      id: appointmentId,
      userId,
      patientId,
      patientName,
      date,
      time,
      duration: duration || 60,
      type: type || 'consulta',
      notes: notes || '',
      status: status || 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`appointment:${userId}:${appointmentId}`, appointment);

    return c.json({ appointment, message: 'Appointment created successfully' });
  } catch (error) {
    console.log('Error creating appointment:', error);
    return c.json({ error: 'Failed to create appointment: ' + error.message }, 500);
  }
});

// Update appointment
app.put("/make-server-0418aac9/appointments/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const appointmentId = c.req.param('id');
    const body = await c.req.json();

    const existingAppointment = await kv.get(`appointment:${userId}:${appointmentId}`);
    if (!existingAppointment) {
      return c.json({ error: 'Appointment not found' }, 404);
    }

    const updatedAppointment = {
      ...existingAppointment,
      ...body,
      id: appointmentId,
      userId,
      updated_at: new Date().toISOString()
    };

    await kv.set(`appointment:${userId}:${appointmentId}`, updatedAppointment);

    return c.json({ appointment: updatedAppointment, message: 'Appointment updated successfully' });
  } catch (error) {
    console.log('Error updating appointment:', error);
    return c.json({ error: 'Failed to update appointment: ' + error.message }, 500);
  }
});

// Delete appointment
app.delete("/make-server-0418aac9/appointments/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const appointmentId = c.req.param('id');

    const existingAppointment = await kv.get(`appointment:${userId}:${appointmentId}`);
    if (!existingAppointment) {
      return c.json({ error: 'Appointment not found' }, 404);
    }

    await kv.del(`appointment:${userId}:${appointmentId}`);

    return c.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.log('Error deleting appointment:', error);
    return c.json({ error: 'Failed to delete appointment: ' + error.message }, 500);
  }
});

// ============= MEDICAL RECORDS / PRONTUÁRIO ROUTES =============

// Get all medical records for the authenticated user
app.get("/make-server-0418aac9/records", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const records = await kv.getByPrefix(`record:${userId}:`);
    return c.json({ records: records || [] });
  } catch (error) {
    console.log('Error fetching medical records:', error);
    return c.json({ error: 'Falha ao buscar prontuários: ' + error.message }, 500);
  }
});

// Get all medical records for a patient
app.get("/make-server-0418aac9/patients/:patientId/records", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.param('patientId');

    const records = await kv.getByPrefix(`record:${userId}:${patientId}:`);
    return c.json({ records: records || [] });
  } catch (error) {
    console.log('Error fetching medical records:', error);
    return c.json({ error: 'Falha ao buscar prontuários: ' + error.message }, 500);
  }
});

// Get single medical record
app.get("/make-server-0418aac9/records/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const recordId = c.req.param('id');

    const records = await kv.getByPrefix(`record:${userId}:`);
    const record = records.find((r: any) => r.id === recordId);

    if (!record) {
      return c.json({ error: 'Prontuário não encontrado' }, 404);
    }

    return c.json({ record });
  } catch (error) {
    console.log('Error fetching record:', error);
    return c.json({ error: 'Falha ao buscar prontuário: ' + error.message }, 500);
  }
});

// Create medical record
app.post("/make-server-0418aac9/records", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const {
      patientId,
      patientName,
      appointmentId,
      date,
      chiefComplaint,
      symptoms,
      diagnosis,
      treatment,
      prescriptions,
      exams,
      notes,
      vitalSigns
    } = body;

    if (!patientId || !date) {
      return c.json({ error: 'Paciente e data são obrigatórios' }, 400);
    }

    const recordId = crypto.randomUUID();
    const record = {
      id: recordId,
      userId,
      patientId,
      patientName,
      appointmentId: appointmentId || null,
      date,
      chiefComplaint: chiefComplaint || '',
      symptoms: symptoms || '',
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      prescriptions: prescriptions || [],
      exams: exams || [],
      notes: notes || '',
      vitalSigns: vitalSigns || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`record:${userId}:${patientId}:${recordId}`, record);

    return c.json({ record, message: 'Prontuário criado com sucesso' });
  } catch (error) {
    console.log('Error creating record:', error);
    return c.json({ error: 'Falha ao criar prontuário: ' + error.message }, 500);
  }
});

// Update medical record
app.put("/make-server-0418aac9/records/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const recordId = c.req.param('id');
    const body = await c.req.json();

    const records = await kv.getByPrefix(`record:${userId}:`);
    const existingRecord = records.find((r: any) => r.id === recordId);

    if (!existingRecord) {
      return c.json({ error: 'Prontuário não encontrado' }, 404);
    }

    const updatedRecord = {
      ...existingRecord,
      ...body,
      id: recordId,
      userId,
      updated_at: new Date().toISOString()
    };

    await kv.set(`record:${userId}:${existingRecord.patientId}:${recordId}`, updatedRecord);

    return c.json({ record: updatedRecord, message: 'Prontuário atualizado com sucesso' });
  } catch (error) {
    console.log('Error updating record:', error);
    return c.json({ error: 'Falha ao atualizar prontuário: ' + error.message }, 500);
  }
});

// Delete medical record
app.delete("/make-server-0418aac9/records/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const recordId = c.req.param('id');

    const records = await kv.getByPrefix(`record:${userId}:`);
    const record = records.find((r: any) => r.id === recordId);

    if (!record) {
      return c.json({ error: 'Prontuário não encontrado' }, 404);
    }

    await kv.del(`record:${userId}:${record.patientId}:${recordId}`);

    return c.json({ message: 'Prontuário excluído com sucesso' });
  } catch (error) {
    console.log('Error deleting record:', error);
    return c.json({ error: 'Falha ao excluir prontuário: ' + error.message }, 500);
  }
});

// ============= STATS ROUTE =============

// Get dashboard statistics
app.get("/make-server-0418aac9/stats", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');

    const patients = await kv.getByPrefix(`patient:${userId}:`);
    const appointments = await kv.getByPrefix(`appointment:${userId}:`);

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled');
    const completedAppointments = appointments.filter(a => a.status === 'completed');

    return c.json({
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      scheduledAppointments: scheduledAppointments.length,
      completedAppointments: completedAppointments.length,
    });
  } catch (error) {
    console.log('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats: ' + error.message }, 500);
  }
});

// Health check endpoint
app.get("/make-server-0418aac9/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);