import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import {
  FiLogOut, FiFilter, FiPlus, FiDownload, FiSearch, FiEdit, FiTrash2, FiEye, FiMoreVertical,
  FiCheckSquare, FiSquare, FiChevronUp, FiChevronDown, FiX, FiAlertCircle, FiCheckCircle, FiClock, FiCalendar
} from 'react-icons/fi';

// --- Supabase Configuration ---
// Certifique-se de que estas variáveis de ambiente estão configuradas no seu projeto Vite
// Ex: VITE_SUPABASE_URL=https://your-project-id.supabase.co VITE_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser definidas.');
  // Fallback para evitar crash, mas o app não funcionará sem as chaves
  // Em produção, você deve ter um tratamento de erro mais robusto
  alert('Erro: Chaves Supabase não configuradas. Verifique suas variáveis de ambiente.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Context for User Session ---
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      setUserProfile(null);
    } else {
      setUserProfile(data);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, userProfile, loading, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// --- Login/Signup Component ---
function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Verifique seu e-mail para confirmar o cadastro.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}><br/>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' }}><br/>
        <h2 style={{ color: '#1a1a1a', marginBottom: '20px' }}>{isLogin ? 'Login' : 'Cadastro'} TrueTasks</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px',<br/>
              fontSize: '16px', cursor: 'pointer', transition: 'background-color 0.3s ease',<br/>
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        {error && <p style={{ color: '#dc3545', marginTop: '15px' }}>{error}</p>}<br/>
        {message && <p style={{ color: '#28a745', marginTop: '15px' }}>{message}</p>}<br/>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}><br/>
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </span>
        </p>
      </div>
    </div>
  );
}

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const calculateSituacao = (task) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prazoInterno = task.prazo_interno ? new Date(task.prazo_interno) : null;
  if (prazoInterno) prazoInterno.setHours(0, 0, 0, 0);

  const prazoLegal = task.prazo_legal ? new Date(task.prazo_legal) : null;
  if (prazoLegal) prazoLegal.setHours(0, 0, 0, 0);

  if (task.status === 'Concluído' || task.is_finalizado) return 'Concluído';

  if (prazoLegal && prazoLegal < today) return 'Vencido Legalmente';
  if (prazoInterno && prazoInterno < today) return 'Vencido Internamente';

  const diffInterno = prazoInterno ? Math.ceil((prazoInterno.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;<br/>
  const diffLegal = prazoLegal ? Math.ceil((prazoLegal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;

  if (diffInterno === 0 || diffLegal === 0) return 'Vencendo Hoje';
  if (diffInterno > 0 && diffInterno <= 7) return 'A Vencer (Interno)';
  if (diffLegal > 0 && diffLegal <= 7) return 'A Vencer (Legal)';

  if (prazoInterno && prazoInterno > today) return 'No Prazo (Interno)';
  if (prazoLegal && prazoLegal > today) return 'No Prazo (Legal)';

  return 'Sem Prazo Definido';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Concluído': return '#28a745'; // Green<br/>
    case 'Pendente': return '#ffc107'; // Yellow<br/>
    case 'Atrasado': return '#dc3545'; // Red<br/>
    default: return '#6c757d'; // Gray
  }
};

const getSituacaoColor = (situacao) => {
  switch (situacao) {
    case 'Vencido Legalmente': return '#dc3545'; // Red<br/>
    case 'Vencido Internamente': return '#ffc107'; // Yellow-Orange<br/>
    case 'Vencendo Hoje': return '#fd7e14'; // Orange<br/>
    case 'A Vencer (Legal)': return '#17a2b8'; // Cyan<br/>
    case 'A Vencer (Interno)': return '#ffc107'; // Yellow<br/>
    case 'No Prazo (Legal)': return '#28a745'; // Green<br/>
    case 'No Prazo (Interno)': return '#17a2b8'; // Cyan<br/>
    case 'Concluído': return '#28a745'; // Green<br/>
    default: return '#6c757d'; // Gray
  }
};

// --- Modals ---
const Modal = ({ isOpen, onClose, title, children, width = '600px' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,<br/>
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',<br/>
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '25px', borderRadius: '8px',<br/>
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)', width: width, maxWidth: '90%',<br/>
        maxHeight: '90vh', overflowY: 'auto', position: 'relative'
      }}>
        <h3 style={{ color: '#1a1a1a', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{title}</h3>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '15px', right: '15px', background: 'none',<br/>
            border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666'
          }}
        >
          <FiX />
        </button>
        {children}
      </div>
    </div>
  );
};

const TaskFormModal = ({ isOpen, onClose, task, onSave, users, isNew }) => {
  const [formData, setFormData] = useState({
    client: '', cnpj: '', competencia: '', type: '',<br/>
    prazo_interno: null, prazo_legal: null,<br/>
    responsavel_id: null, revisor_id: null, participantes_ids: [],<br/>
    status: 'Pendente', obs: '', recorrente: false, is_finalizado: false,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        prazo_interno: task.prazo_interno ? new Date(task.prazo_interno) : null,<br/>
        prazo_legal: task.prazo_legal ? new Date(task.prazo_legal) : null,
        // Ensure participants_ids is an array of objects for react-select
        participantes_ids: task.participantes_ids ? task.participantes_ids.map(id => users.find(u => u.id === id)).filter(Boolean) : [],
      });
    } else {
      setFormData({
        client: '', cnpj: '', competencia: '', type: '',<br/>
        prazo_interno: null, prazo_legal: null,<br/>
        responsavel_id: null, revisor_id: null, participantes_ids: [],<br/>
        status: 'Pendente', obs: '', recorrente: false, is_finalizado: false,
      });
    }
  }, [task, isOpen, users]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : null
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      prazo_interno: formData.prazo_interno ? formData.prazo_interno.toISOString() : null,<br/>
      prazo_legal: formData.prazo_legal ? formData.prazo_legal.toISOString() : null,
    });
    onClose();
  };

  const userOptions = users.map(u => ({ value: u.id, label: u.name }));<br/>
  const statusOptions = ['Pendente', 'Concluído', 'Atrasado'].map(s => ({ value: s, label: s }));<br/>
  const typeOptions = ['IRPF', 'SPED', 'PGDAS', 'ECD', 'ESOCIAL', 'Outro'].map(t => ({ value: t, label: t }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNew ? 'Nova Tarefa' : 'Editar Tarefa'} width="700px"><br/>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Cliente:</label>
          <input type="text" name="client" value={formData.client} onChange={handleChange} required
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>CNPJ:</label>
          <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Competência (MM/AAAA):</label>
          <input type="text" name="competencia" value={formData.competencia} onChange={handleChange} placeholder="MM/AAAA"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Tipo:</label>
          <Select
            name="type"
            options={typeOptions}
            value={typeOptions.find(opt => opt.value === formData.type)}
            onChange={(opt) => handleSelectChange('type', opt)}
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Prazo Interno:</label>
          <DatePicker
            selected={formData.prazo_interno}
            onChange={(date) => setFormData(prev => ({ ...prev, prazo_interno: date }))}
            dateFormat="dd/MM/yyyy"
            className="react-datepicker-custom-input"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Prazo Legal:</label>
          <DatePicker
            selected={formData.prazo_legal}
            onChange={(date) => setFormData(prev => ({ ...prev, prazo_legal: date }))}
            dateFormat="dd/MM/yyyy"
            className="react-datepicker-custom-input"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Responsável:</label>
          <Select
            name="responsavel_id"
            options={userOptions}
            value={userOptions.find(opt => opt.value === formData.responsavel_id)}
            onChange={(opt) => handleSelectChange('responsavel_id', opt)}
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Revisor:</label>
          <Select
            name="revisor_id"
            options={userOptions}
            value={userOptions.find(opt => opt.value === formData.revisor_id)}
            onChange={(opt) => handleSelectChange('revisor_id', opt)}
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
        <div style={{ gridColumn: '1 / 3' }}><br/>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Participantes:</label>
          <Select
            name="participantes_ids"
            isMulti
            options={userOptions}
            value={formData.participantes_ids} // This should be an array of {value, label}
            onChange={(opts) => handleMultiSelectChange('participantes_ids', opts)}
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Status:</label>
          <Select
            name="status"
            options={statusOptions}
            value={statusOptions.find(opt => opt.value === formData.status)}
            onChange={(opt) => handleSelectChange('status', opt)}
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <input type="checkbox" name="recorrente" checked={formData.recorrente} onChange={handleChange} id="recorrente" />
          <label htmlFor="recorrente" style={{ fontWeight: 'bold', fontSize: '14px' }}>Tarefa Recorrente</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <input type="checkbox" name="is_finalizado" checked={formData.is_finalizado} onChange={handleChange} id="is_finalizado" />
          <label htmlFor="is_finalizado" style={{ fontWeight: 'bold', fontSize: '14px' }}>Finalizada</label>
        </div>
        <div style={{ gridColumn: '1 / 3', textAlign: 'right', marginTop: '20px' }}><br/>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button><br/>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar Tarefa</button>
        </div>
      </form>
    </Modal>
  );
};

const TaskDetailsModal = ({ isOpen, onClose, task, users, onEdit, onDelete, onReplicate }) => {
  if (!task) return null;

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'N/A';
  const getParticipantNames = (ids) => ids?.map(id => getUserName(id)).join(', ') || 'N/A';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Tarefa" width="600px">
      <div style={{ lineHeight: '1.8' }}><br/>
        <p><strong>Cliente:</strong> {task.client}</p><br/>
        <p><strong>CNPJ:</strong> {task.cnpj}</p><br/>
        <p><strong>Competência:</strong> {task.competencia}</p><br/>
        <p><strong>Tipo:</strong> {task.type}</p><br/>
        <p><strong>Prazo Interno:</strong> {formatDate(task.prazo_interno)}</p><br/>
        <p><strong>Prazo Legal:</strong> {formatDate(task.prazo_legal)}</p><br/>
        <p><strong>Status:</strong> <span style={{ backgroundColor: getStatusColor(task.status), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>{task.status}</span></p><br/>
        <p><strong>Situação:</strong> <span style={{ backgroundColor: getSituacaoColor(task.situacao), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>{task.situacao}</span></p><br/>
        <p><strong>Responsável:</strong> {getUserName(task.responsavel_id)}</p><br/>
        <p><strong>Revisor:</strong> {getUserName(task.revisor_id)}</p><br/>
        <p><strong>Participantes:</strong> {getParticipantNames(task.participantes_ids)}</p><br/>
        <p><strong>Recorrente:</strong> {task.recorrente ? 'Sim' : 'Não'}</p><br/>
        <p><strong>Finalizada:</strong> {task.is_finalizado ? 'Sim' : 'Não'}</p><br/>
        <p><strong>Observações:</strong> {task.obs || 'Nenhuma'}</p>
      </div>
      <div style={{ marginTop: '20px', textAlign: 'right' }}><br/>
        <button onClick={() => { onReplicate(task); onClose(); }} style={{ padding: '8px 15px', marginRight: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Replicar</button><br/>
        <button onClick={() => { onEdit(task); onClose(); }} style={{ padding: '8px 15px', marginRight: '10px', backgroundColor: '#ffc107', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button><br/>
        <button onClick={() => { if (window.confirm('Tem certeza que deseja deletar esta tarefa?')) { onDelete(task.id); onClose(); } }} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Deletar</button>
      </div>
    </Modal>
  );
};

const BatchActionsModal = ({ isOpen, onClose, selectedTaskIds, onApplyBatchAction, users }) => {
  const [actionType, setActionType] = useState('');
  const [newValue, setNewValue] = useState('');

  const userOptions = users.map(u => ({ value: u.id, label: u.name }));<br/>
  const statusOptions = ['Pendente', 'Concluído', 'Atrasado'].map(s => ({ value: s, label: s }));

  const handleSubmit = () => {
    if (actionType && (newValue || actionType === 'is_finalizado' || actionType === 'is_not_finalizado' || actionType === 'delete_selected')) {
      onApplyBatchAction(actionType, newValue);
      onClose();
    } else {
      alert('Selecione uma ação e um novo valor.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ações em Lote (${selectedTaskIds.length} tarefas)`} width="500px">
      <div style={{ marginBottom: '15px' }}><br/>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Tipo de Ação:</label>
        <Select
          options={[
            { value: 'status', label: 'Mudar Status' },<br/>
            { value: 'responsavel_id', label: 'Mudar Responsável' },<br/>
            { value: 'revisor_id', label: 'Mudar Revisor' },<br/>
            { value: 'is_finalizado', label: 'Marcar como Finalizado' },<br/>
            { value: 'is_not_finalizado', label: 'Marcar como Não Finalizado' },
            { value: 'delete_selected', label: 'Excluir Selecionadas' },
          ]}
          onChange={(opt) => {
            setActionType(opt ? opt.value : '');
            setNewValue(''); // Reset new value when action type changes
          }}
          styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
        />
      </div>
      {actionType === 'status' && (
        <div style={{ marginBottom: '15px' }}><br/>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Novo Status:</label>
          <Select
            options={statusOptions}
            onChange={(opt) => setNewValue(opt ? opt.value : '')}<br/>
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
      )}
      {(actionType === 'responsavel_id' || actionType === 'revisor_id') && (
        <div style={{ marginBottom: '15px' }}><br/>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Novo {actionType === 'responsavel_id' ? 'Responsável' : 'Revisor'}:</label>
          <Select
            options={userOptions}
            onChange={(opt) => setNewValue(opt ? opt.value : '')}<br/>
            styles={{ control: (base) => ({ ...base, minHeight: '38px' }) }}
          />
        </div>
      )}
      <div style={{ textAlign: 'right', marginTop: '20px' }}><br/>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button><br/>
        <button type="button" onClick={handleSubmit} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Aplicar</button>
      </div>
    </Modal>
  );
};

// --- Main App Component ---
function AppContent() {
  const { session, userProfile, signOut, supabase } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // All users for dropdowns
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBatchActionsModalOpen, setIsBatchActionsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  // Table state
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [hideFinalizados, setHideFinalizados] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({}); // { column: value }<br/>
  const [sortConfig, setSortConfig] = useState({ key: 'prazo_interno', direction: 'ascending' });

  // Fetch data
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    let query = supabase.from('tasks').select(`
      id, created_at, client, cnpj, competencia, type, prazo_interno, prazo_legal, status, obs, recorrente, is_finalizado, user_id,
      responsavel:profiles!responsavel_id(id, name),<br/>
      revisor:profiles!revisor_id(id, name),<br/>
      participantes:profiles!participantes_ids(id, name)
    `);

    if (userProfile && userProfile.role === 'colaborador') {
      query = query.or(`responsavel_id.eq.${session.user.id},revisor_id.eq.${session.user.id},participantes_ids.cs.{${session.user.id}}`);
    }

    const { data, error } = await query.order('prazo_interno', { ascending: true });

    if (error) {
      console.error('Erro ao carregar tarefas:', error);
      setError('Erro ao carregar tarefas.');
      setTasks([]);
    } else {
      const tasksWithSituacao = data.map(task => ({
        ...task,
        situacao: calculateSituacao(task),<br/>
        responsavel_id: task.responsavel?.id || null,<br/>
        responsavel_name: task.responsavel?.name || 'N/A',<br/>
        revisor_id: task.revisor?.id || null,<br/>
        revisor_name: task.revisor?.name || 'N/A',<br/>
        participantes_ids: task.participantes.map(p => p.id),<br/>
        participantes_names: task.participantes.map(p => p.name).join(', ')
      }));
      setTasks(tasksWithSituacao);
    }
    setLoading(false);
  }, [session, userProfile, supabase]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id, name, role');
    if (error) {
      console.error('Erro ao buscar usuários:', error);
    } else {
      setUsers(data);
    }
  }, [supabase]);

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchUsers();
    }
  }, [session, fetchTasks, fetchUsers]);

  // --- CRUD Operations ---
  const handleSaveTask = async (taskData) => {
    setLoading(true);
    setError('');
    const { id, ...rest } = taskData;
    let error;
    if (id) { // Update existing task
      const { error: updateError } = await supabase.from('tasks').update(rest).eq('id', id);
      error = updateError;
    } else { // Create new task
      const { error: insertError } = await supabase.from('tasks').insert({ ...rest, user_id: session.user.id });
      error = insertError;
    }

    if (error) {
      console.error('Erro ao salvar tarefa:', error);
      setError('Erro ao salvar tarefa.');
    } else {
      fetchTasks();
    }
    setLoading(false);
  };

  const handleDeleteTask = async (taskId) => {
    setLoading(true);
    setError('');
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      setError('Erro ao deletar tarefa.');
    } else {
      fetchTasks();
    }
    setLoading(false);
  };

  const handleReplicateTask = (task) => {
    const { id, created_at, ...rest } = task;
    setCurrentTask({
      ...rest,
      status: 'Pendente', // Replicated tasks start as pending<br/>
      is_finalizado: false,
      // Optionally adjust competence for next month/year
    });
    setIsNewTaskModalOpen(true);
  };

  const handleGenerateRecurringTask = async (taskId) => {
    const taskToReplicate = tasks.find(t => t.id === taskId);
    if (!taskToReplicate) return;

    const { id, created_at, ...rest } = taskToReplicate;

    // Calculate next competence
    let [monthStr, yearStr] = rest.competencia.split('/');
    let month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    const nextCompetencia = `${String(month).padStart(2, '0')}/${year}`;

    // Adjust deadlines for next month (simple approach: add 1 month)
    const adjustDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      date.setMonth(date.getMonth() + 1);
      return date.toISOString();
    };

    const newTaskData = {
      ...rest,
      competencia: nextCompetencia,<br/>
      prazo_interno: adjustDate(rest.prazo_interno),<br/>
      prazo_legal: adjustDate(rest.prazo_legal),<br/>
      status: 'Pendente',<br/>
      is_finalizado: false,<br/>
      user_id: session.user.id, // Assign to current user or original creator
    };

    setLoading(true);
    const { error } = await supabase.from('tasks').insert(newTaskData);
    if (error) {
      console.error('Erro ao gerar tarefa recorrente:', error);
      setError('Erro ao gerar tarefa recorrente.');
    } else {
      fetchTasks();
    }
    setLoading(false);
  };

  const handleApplyBatchAction = async (actionType, newValue) => {
    setLoading(true);
    setError('');
    let error;

    if (actionType === 'delete_selected') {
      if (window.confirm(`Tem certeza que deseja deletar ${selectedTaskIds.length} tarefas? Esta ação é irreversível.`)) {
        const { error: deleteError } = await supabase.from('tasks').delete().in('id', selectedTaskIds);
        error = deleteError;
      } else {
        setLoading(false);
        return; // User cancelled deletion
      }
    } else {
      let updateData = {};
      if (actionType === 'status') {
        updateData = { status: newValue };
      } else if (actionType === 'responsavel_id' || actionType === 'revisor_id') {
        updateData = { [actionType]: newValue };
      } else if (actionType === 'is_finalizado') {
        updateData = { is_finalizado: true };
      } else if (actionType === 'is_not_finalizado') {
        updateData = { is_finalizado: false };
      }

      const { error: updateError } = await supabase.from('tasks')
        .update(updateData)
        .in('id', selectedTaskIds);
      error = updateError;
    }

    if (error) {
      console.error('Erro ao aplicar ação em lote:', error);
      setError('Erro ao aplicar ação em lote.');
    } else {
      setSelectedTaskIds([]);
      fetchTasks();
    }
    setLoading(false);
  };

  // --- Filtering and Sorting ---
  const filteredTasks = tasks.filter(task => {
    if (hideFinalizados && task.is_finalizado) return false;

    // Search term filter
    const searchMatch = searchTerm
      ? Object.values(task).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;

    // Column filters (simplified for this example, would need specific UI per column)
    const columnFiltersMatch = Object.keys(filters).every(key => {
      const filterValue = filters[key];
      if (!filterValue) return true;

      const taskValue = task[key];

      if (key === 'prazo_interno' || key === 'prazo_legal') {
        const taskDate = taskValue ? new Date(taskValue).setHours(0,0,0,0) : null;<br/>
        const filterDate = filterValue ? new Date(filterValue).setHours(0,0,0,0) : null;
        return taskDate === filterDate;
      }

      if (Array.isArray(taskValue)) { // For participants_ids
        return filterValue.some(fVal => taskValue.includes(fVal));
      }

      return String(taskValue).toLowerCase().includes(String(filterValue).toLowerCase());
    });

    return searchMatch && columnFiltersMatch;
  });

  const sortedTasks = React.useMemo(() => {
    let sortableItems = [...filteredTasks];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;<br/>
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;

        if (sortConfig.key.includes('prazo')) { // Date comparison
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === 'ascending' ? aValue - bValue : bV
          alue - aValue;
      });
    }
    return sortableItems;
  }, [filteredTasks, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  // --- Badge Calculations ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTasksByBadgeType = (badgeType) => {
    return tasks.filter(task => {
      if (task.is_finalizado) return false; // Don't count finalizados in badges

      const prazoInterno = task.prazo_interno ? new Date(task.prazo_interno) : null;
      if (prazoInterno) prazoInterno.setHours(0, 0, 0, 0);
      const prazoLegal = task.prazo_legal ? new Date(task.prazo_legal) : null;
      if (prazoLegal) prazoLegal.setHours(0, 0, 0, 0);

      switch (badgeType) {
        case 'vencendoHoje':
          return (prazoInterno && prazoInterno.getTime() === today.getTime()) ||
                 (prazoLegal && prazoLegal.getTime() === today.getTime());
        case 'aVencer':
          // Tasks that are not due today, but are due in the future (e.g., next 7 days)
          const isFutureInternal = prazoInterno && prazoInterno > today;
          const isFutureLegal = prazoLegal && prazoLegal > today;
          return (isFutureInternal || isFutureLegal) && !getTasksByBadgeType('vencendoHoje');
        case 'vencidoInternamente':
          return (prazoInterno && prazoInterno < today) && (!prazoLegal || prazoLegal >= today);
        case 'vencidoLegalmente':
          return prazoLegal && prazoLegal < today;
        default:
          return false;
      }
    }).length;
  };

  const badgeCounts = {
    vencendoHoje: getTasksByBadgeType('vencendoHoje'),<br/>
    aVencer: getTasksByBadgeType('aVencer'),<br/>
    vencidoInternamente: getTasksByBadgeType('vencidoInternamente'),<br/>
    vencidoLegalmente: getTasksByBadgeType('vencidoLegalmente'),
  };

  const handleBadgeClick = (filterType) => {
    clearFilters(); // Clear existing filters first
    const newFilters = {};
    const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD

    switch (filterType) {
      case 'vencendoHoje':
        // Filter by tasks where 'situacao' is 'Vencendo Hoje'
        newFilters.situacao = 'Vencendo Hoje';
        break;
      case 'aVencer':
        // Filter by tasks where 'situacao' is 'A Vencer (Interno)' or 'A Vencer (Legal)'
        // This would ideally be a multi-select filter for 'situacao'
        newFilters.situacao = 'A Vencer'; // Simplified: will match any situacao containing "A Vencer"
        break;
      case 'vencidoInternamente':
        newFilters.situacao = 'Vencido Internamente';
        break;
      case 'vencidoLegalmente':
        newFilters.situacao = 'Vencido Legalmente';
        break;
      default:
        break;
    }
    setFilters(newFilters);
  };

  // --- Table Checkbox Logic ---
  const handleSelectAllClick = (e) => {
    if (e.target.checked) {
      const allTaskIds = sortedTasks.map((task) => task.id);
      setSelectedTaskIds(allTaskIds);
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleTaskCheckboxClick = (taskId) => {
    setSelectedTaskIds((prevSelected) =>
      prevSelected.includes(taskId)
        ? prevSelected.filter((id) => id !== taskId)
        : [...prevSelected, taskId]
    );
  };

  const isAllSelected = selectedTaskIds.length === sortedTasks.length && sortedTasks.length > 0;

  // --- Excel Export ---
  const exportToExcel = () => {
    const dataToExport = sortedTasks.map(task => ({
      Cliente: task.client,<br/>
      CNPJ: task.cnpj,<br/>
      Competência: task.competencia,<br/>
      Tipo: task.type,<br/>
      'Prazo Interno': formatDate(task.prazo_interno),<br/>
      'Prazo Legal': formatDate(task.prazo_legal),<br/>
      Status: task.status,<br/>
      Situação: task.situacao,<br/>
      Responsável: task.responsavel_name,<br/>
      Revisor: task.revisor_name,<br/>
      Participantes: task.participantes_names,<br/>
      Observações: task.obs,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarefas TrueTasks');
    XLSX.writeFile(wb, 'TrueTasks_Tarefas.xlsx');
  };

  if (loading && !session) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '24px' }}>Carregando...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#007bff', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><br/>
        <h1 style={{ margin: 0, fontSize: '24px' }}>TrueTasks</h1><br/>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}><br/>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hideFinalizados}
              onChange={() => setHideFinalizados(!hideFinalizados)}
              style={{ marginRight: '8px' }}
            />
            Esconder Finalizados
          </label>
          <button onClick={signOut} style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FiLogOut /> Sair
          </button>
        </div>
      </header>

      <main style={{ padding: '20px 30px', flexGrow: 1 }}><br/>
        {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

        {/* Badges de Resumo */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}><br/>
          <div onClick={() => handleBadgeClick('vencendoHoje')} style={{ cursor: 'pointer', backgroundColor: '#fd7e14', color: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flex: '1', minWidth: '200px' }}><br/>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Vencendo Hoje</h4><br/>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{badgeCounts.vencendoHoje}</p>
          </div>
          <div onClick={() => handleBadgeClick('aVencer')} style={{ cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flex: '1', minWidth: '200px' }}><br/>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>A Vencer</h4><br/>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{badgeCounts.aVencer}</p>
          </div>
          <div onClick={() => handleBadgeClick('vencidoInternamente')} style={{ cursor: 'pointer', backgroundColor: '#ffc107', color: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flex: '1', minWidth: '200px' }}><br/>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Vencido Internamente</h4><br/>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{badgeCounts.vencidoInternamente}</p>
          </div>
          <div onClick={() => handleBadgeClick('vencidoLegalmente')} style={{ cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flex: '1', minWidth: '200px' }}><br/>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Vencido Legalmente</h4><br/>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{badgeCounts.vencidoLegalmente}</p>
          </div>
        </div>

        {/* Barra de Ações */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}><br/>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setCurrentTask(null); setIsNewTaskModalOpen(true); }}
              style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <FiPlus /> Nova Tarefa
            </button>
            <button
              onClick={() => setIsBatchActionsModalOpen(true)}
              disabled={selectedTaskIds.length === 0}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: selectedTaskIds.length === 0 ? 0.6 : 1 }}
            >
              Ações em Lote ({selectedTaskIds.length})
            </button>
            <button
              onClick={exportToExcel}
              style={{ padding: '10px 20px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <FiDownload /> Exportar Excel
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}><br/>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px 15px 10px 40px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px', width: '250px' }}
              />
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
            </div>
            <button
              onClick={clearFilters}
              style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <FiX /> Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabela Inteligente */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}><br/>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef', borderBottom: '2px solid #dee2e6' }}><br/>
                <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '14px', color: '#495057', width: '30px' }}>
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllClick} />
                </th>
                {['Cliente', 'CNPJ', 'Competência', 'Tipo', 'Prazo Interno', 'Prazo Legal', 'Status', 'Situação', 'Responsável', 'Revisor', 'Participantes', 'Ações'].map((header) => (
                  <th key={header} style={{ padding: '12px 15px', textAlign: 'left', fontSize: '14px', color: '#495057', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort(header.toLowerCase().replace(/ /g, '_').replace('í', 'i').replace('ç', 'c').replace('ã', 'a'))}><br/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {header}
                      {sortConfig.key === header.toLowerCase().replace(/ /g, '_').replace('í', 'i').replace('ç', 'c').replace('ã', 'a') ? (
                        sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown /><br/>
                      ) : null}
                      {/* Filter Icon - Placeholder for actual filter modal */}
                      <FiFilter style={{ marginLeft: '5px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); alert(`Abrir filtro para ${header}`); /* Implement ColumnFilterModal here */ }} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>Carregando tarefas...</td>
                </tr>
              ) : sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>Nenhuma tarefa encontrada.</td>
                </tr>
              ) : (
                sortedTasks.map((task, index) => (
                  <tr key={task.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}><br/>
                    <td style={{ padding: '10px 15px' }}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleTaskCheckboxClick(task.id)}
                      />
                    </td>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.client}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.cnpj}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.competencia}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.type}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{formatDate(task.prazo_interno)}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{formatDate(task.prazo_legal)}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px' }}><br/>
                      <span style={{ backgroundColor: getStatusColor(task.status), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px', fontSize: '14px' }}><br/>
                      <span style={{ backgroundColor: getSituacaoColor(task.situacao), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>
                        {task.situacao}
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.responsavel_name}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.revisor_name}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}>{task.participantes_names}</td><br/>
                    <td style={{ padding: '10px 15px', fontSize: '14px', color: '#343a40' }}><br/>
                      <div style={{ display: 'flex', gap: '8px' }}><br/>
                        <button onClick={() => { setCurrentTask(task); setIsDetailsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '16px' }} title="Ver Detalhes"><FiEye /></button><br/>
                        <button onClick={() => { setCurrentTask(task); setIsEditTaskModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer', fontSize: '16px' }} title="Editar"><FiEdit /></button><br/>
                        <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }} title="Deletar"><FiTrash2 /></button>
                        {task.recorrente && (
                          <button onClick={() => handleGenerateRecurringTask(task.id)} style={{ background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', fontSize: '16px' }} title="Gerar Próximo Mês"><FiCalendar /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modals */}
      <TaskFormModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        task={currentTask}
        onSave={handleSaveTask}
        users={users}
        isNew={!currentTask?.id}
      />
      <TaskFormModal
        isOpen={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        task={currentTask}
        onSave={handleSaveTask}
        users={users}
        isNew={false}
      />
      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={currentTask}
        users={users}
        onEdit={(task) => { setCurrentTask(task); setIsEditTaskModalOpen(true); }}
        onDelete={handleDeleteTask}
        onReplicate={handleReplicateTask}
      />
      <BatchActionsModal
        isOpen={isBatchActionsModalOpen}
        onClose={() => setIsBatchActionsModalOpen(false)}
        selectedTaskIds={selectedTaskIds}
        onApplyBatchAction={handleApplyBatchAction}
        users={users}
      />
      {/* ColumnFilterModal would be implemented similarly, possibly as a dropdown/popover */}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppContent />} />
          {/* Adicione outras rotas se necessário, por exemplo, para perfis de usuário, configurações */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}


