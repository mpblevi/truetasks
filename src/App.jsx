import { useState, useEffect, useMemo } from "react"; 
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://womtpzhfbtqijqcqxujb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbXRwemhmYnRxaWpxY3F4dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTQ3MzUsImV4cCI6MjA5MDg5MDczNX0.ec3mqjxpBRltT9N_MRguO9Xt-YDSHTz66lBayT1ElPE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DOMAIN = "@truetasks.app";
const TIPOS = ["IRPF", "SPED", "PGDAS", "ECF", "ECD", "DCTF", "REINF", "FOLHA", "BPO", "OUTROS"];
const STATUS_LIST = ["A Fazer", "Em Andamento", "Concluído", "Atrasado"];

const STATUS_STYLE = {
  "A Fazer":      { bg: "#1e2a3a", border: "#3b82f6", text: "#93c5fd", dot: "#3b82f6" },
  "Em Andamento": { bg: "#1e2a1e", border: "#22c55e", text: "#86efac", dot: "#22c55e" },
  "Concluído":    { bg: "#1a2a1a", border: "#16a34a", text: "#4ade80", dot: "#16a34a" },
  "Atrasado":     { bg: "#2a1e1e", border: "#ef4444", text: "#fca5a5", dot: "#ef4444" },
};
const PRIORIDADE_STYLE = {
  "Alta":  { color: "#f87171" },
  "Média": { color: "#fbbf24" },
  "Baixa": { color: "#6ee7b7" },
};

function today() { return new Date().toISOString().split("T")[0]; }
function toEmail(usuario) { return usuario.toLowerCase().trim() + DOMAIN; }
function formatDate(d) { return d ? d.split("-").reverse().join("/") : "—"; }
function isAtrasado(prazo_interno, prazo_legal, status) {
  if (status === "Concluído") return false;
  const ref = prazo_interno || prazo_legal;
  if (!ref) return false;
  return ref < today();
}
function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}

const inputStyle = {
  background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 8,
  color: "#e2e8f0", padding: "10px 14px", fontSize: 14, width: "100%",
  outline: "none", fontFamily: "'Lato', sans-serif", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 1,
  textTransform: "uppercase", marginBottom: 6, display: "block",
};
const btnPrimary = {
  background: "linear-gradient(135deg, #0ea5e9, #0284c7)", border: "none",
  borderRadius: 9, color: "#fff", padding: "10px 28px", fontSize: 14,
  fontWeight: 700, cursor: "pointer", fontFamily: "'Lato', sans-serif", width: "100%",
};

function Logo({ size = 24 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size + 8, height: size + 8, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.7 }}>✓</div>
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.5 }}>
        True<span style={{ color: "#0ea5e9" }}>Tasks</span>
      </span>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin() {
    if (!usuario.trim() || !senha.trim()) { setErro("Preencha usuário e senha."); return; }
    setLoading(true); setErro("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(usuario), password: senha });
    if (error) { setErro("Usuário ou senha incorretos."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onLogin(data.user, profile);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080f18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 18, padding: 40, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36, gap: 10 }}>
          <Logo size={26} />
          <div style={{ fontSize: 13, color: "#475569" }}>Gestão de Obrigações Fiscais</div>
        </div>
        {erro && <div style={{ background: "#2a1e1e", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 20 }}>⚠️ {erro}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={labelStyle}>Usuário</label><input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="ex: 001 ou ana" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
          <div><label style={labelStyle}>Senha</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
          <button onClick={handleLogin} disabled={loading} style={{ ...btnPrimary, marginTop: 8, opacity: loading ? 0.7 : 1 }}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#334155" }}>Não tem acesso? Solicite ao administrador.</div>
      </div>
    </div>
  );
}

function PainelUsuarios({ profiles, onAtualizar, onFechar }) {
  const [modalNovo, setModalNovo] = useState(false);
  const [form, setForm] = useState({ nome: "", usuario: "", senha: "", cargo: "colaborador" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  async function criarUsuario() {
    if (!form.nome.trim() || !form.usuario.trim() || !form.senha.trim()) { setErro("Preencha todos os campos."); return; }
    if (form.senha.length < 6) { setErro("Senha precisa ter pelo menos 6 caracteres."); return; }
    setLoading(true); setErro("");
    const { data, error } = await supabase.auth.signUp({ email: toEmail(form.usuario), password: form.senha });
    if (error) { setErro("Erro: " + (error.message.includes("already") ? "Usuário já existe." : error.message)); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, nome: form.nome, cargo: form.cargo, usuario: form.usuario });
      setMsg(`Usuário "${form.usuario}" criado!`);
      setForm({ nome: "", usuario: "", senha: "", cargo: "colaborador" });
      setModalNovo(false);
      onAtualizar();
    }
    setLoading(false);
  }

  async function excluirUsuario(id, nome) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    await supabase.from("profiles").delete().eq("id", id);
    onAtualizar();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#0ea5e9" }}>👥 Gerenciar Usuários</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {msg && <div style={{ background: "#1a3a2a", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", color: "#86efac", fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ background: "#0a1220", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#cbd5e1", fontSize: 14 }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>
                  usuário: <span style={{ color: "#60a5fa" }}>{p.usuario || "—"}</span>
                  <span style={{ marginLeft: 12, color: p.cargo === "admin" ? "#fbbf24" : "#475569", textTransform: "uppercase", letterSpacing: 1 }}>{p.cargo === "admin" ? "👑 Admin" : "👤 Colaborador"}</span>
                </div>
              </div>
              {p.cargo !== "admin" && <button onClick={() => excluirUsuario(p.id, p.nome)} style={{ background: "#2a1e1e", border: "none", borderRadius: 8, color: "#f87171", padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Remover</button>}
            </div>
          ))}
        </div>
        <button onClick={() => { setModalNovo(true); setErro(""); setMsg(""); }} style={{ ...btnPrimary }}>+ Adicionar Novo Usuário</button>
        {modalNovo && (
          <div style={{ marginTop: 24, background: "#0a1220", border: "1px solid #1e3a5f", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: "#0ea5e9", marginBottom: 16, fontSize: 15 }}>Novo Usuário</div>
            {erro && <div style={{ background: "#2a1e1e", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{erro}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={labelStyle}>Nome completo</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Ana Lima" style={inputStyle} /></div>
              <div><label style={labelStyle}>Usuário (para login)</label><input value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value.replace(/\s/g, "") }))} placeholder="Ex: 001 ou ana" style={inputStyle} /><div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Sem espaços. Ex: 001, ana, carlos</div></div>
              <div><label style={labelStyle}>Senha inicial</label><input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputStyle} /></div>
              <div><label style={labelStyle}>Cargo</label><select value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} style={inputStyle}><option value="colaborador">Colaborador</option><option value="admin">Administrador</option></select></div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setModalNovo(false)} style={{ flex: 1, background: "transparent", border: "1px solid #1e3a5f", borderRadius: 9, color: "#64748b", padding: "10px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                <button onClick={criarUsuario} disabled={loading} style={{ ...btnPrimary, flex: 2, width: "auto", opacity: loading ? 0.7 : 1 }}>{loading ? "Criando..." : "Criar Usuário"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tarefas, setTarefas] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [painelUsuarios, setPainelUsuarios] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [gerandoRecorrentes, setGerandoRecorrentes] = useState(false);
  const [msgRecorrente, setMsgRecorrente] = useState("");

  const formInicial = { cliente: "", tipo: "IRPF", prazo_interno: today(), prazo_legal: today(), responsavel_id: "", status: "A Fazer", prioridade: "Média", obs: "", recorrente: false };
  const [form, setForm] = useState(formInicial);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser(session.user); setProfile(prof);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    carregarTarefas();
    carregarProfiles();
  }, [user, profile]);

  async function carregarTarefas() {
    let query = supabase.from("tarefas").select("*").order("prazo_interno");
    if (profile?.cargo !== "admin") query = query.eq("responsavel_id", user.id);
    const { data } = await query;
    setTarefas(data || []);
  }

  async function carregarProfiles() {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setTarefas([]);
  }

  function abrirNova() {
    setEditando(null);
    setForm({ ...formInicial, responsavel_id: user.id });
    setModal(true);
  }

  function abrirEditar(t) {
    setEditando(t.id);
    setForm({ cliente: t.cliente, tipo: t.tipo, prazo_interno: t.prazo_interno || today(), prazo_legal: t.prazo_legal || today(), responsavel_id: t.responsavel_id, status: t.status, prioridade: t.prioridade, obs: t.obs || "", recorrente: t.recorrente || false });
    setModal(true); setDetalhes(null);
  }

  async function salvar() {
    if (!form.cliente.trim()) return;
    setFormLoading(true);
    const respNome = profiles.find(p => p.id === form.responsavel_id)?.nome || "";
    const payload = { cliente: form.cliente, tipo: form.tipo, prazo_interno: form.prazo_interno, prazo_legal: form.prazo_legal, prazo: form.prazo_interno, responsavel_id: form.responsavel_id, responsavel_nome: respNome, status: form.status, prioridade: form.prioridade, obs: form.obs, recorrente: form.recorrente, criado_por: user.id };
    if (editando) {
      await supabase.from("tarefas").update(payload).eq("id", editando);
    } else {
      await supabase.from("tarefas").insert(payload);
    }
    await carregarTarefas();
    setModal(false); setFormLoading(false);
  }

  async function excluir(id) {
    await supabase.from("tarefas").delete().eq("id", id);
    await carregarTarefas(); setDetalhes(null);
  }

  async function alterarStatus(id, status) {
    await supabase.from("tarefas").update({ status }).eq("id", id);
    await carregarTarefas();
  }

  async function gerarProximoMes() {
    setGerandoRecorrentes(true); setMsgRecorrente("");
    const recorrentes = tarefas.filter(t => t.recorrente);
    if (recorrentes.length === 0) { setMsgRecorrente("Nenhuma tarefa marcada como recorrente."); setGerandoRecorrentes(false); return; }
    const novas = recorrentes.map(t => ({
      cliente: t.cliente, tipo: t.tipo,
      prazo_interno: addMonths(t.prazo_interno, 1),
      prazo_legal: addMonths(t.prazo_legal, 1),
      prazo: addMonths(t.prazo_interno, 1),
      responsavel_id: t.responsavel_id, responsavel_nome: t.responsavel_nome,
      status: "A Fazer", prioridade: t.prioridade, obs: t.obs,
      recorrente: true, criado_por: t.criado_por,
    }));
    await supabase.from("tarefas").insert(novas);
    await carregarTarefas();
    setMsgRecorrente(`✅ ${novas.length} tarefa(s) gerada(s) para o próximo mês!`);
    setGerandoRecorrentes(false);
  }

function exportarExcel() {
    const headers = ["Cliente", "Tipo", "Prazo Interno", "Prazo Legal", "Responsável", "Status"];
    const rows = filtradas.map(t => [
      t.cliente, t.tipo,
      formatDate(t.prazo_interno),
      formatDate(t.prazo_legal),
      t.responsavel_nome,
      t.status
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "0D1B2A" } } };
    headers.forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cell]) ws[cell].s = headerStyle;
    });
    ws["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, "Tarefas");
    XLSX.writeFile(wb, "truetasks_relatorio.xlsx");
  }
  const isAdmin = profile?.cargo === "admin";
  const tarefasComStatus = tarefas.map(t => ({
    ...t, status: isAtrasado(t.prazo_interno, t.prazo_legal, t.status) ? "Atrasado" : t.status
  }));

  const filtradas = useMemo(() => tarefasComStatus.filter(t => {
    const matchStatus = filtroStatus === "Todos" || t.status === filtroStatus;
    const matchTipo = filtroTipo === "Todos" || t.tipo === filtroTipo;
    const matchBusca = t.cliente.toLowerCase().includes(busca.toLowerCase()) || t.tipo.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchTipo && matchBusca;
  }), [tarefasComStatus, filtroStatus, filtroTipo, busca]);

  const stats = useMemo(() => {
    const s = { "A Fazer": 0, "Em Andamento": 0, "Concluído": 0, "Atrasado": 0 };
    tarefasComStatus.forEach(t => s[t.status] = (s[t.status] || 0) + 1);
    return s;
  }, [tarefasComStatus]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080f18", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
      Carregando...
    </div>
  );

  if (!user || !profile) return <LoginScreen onLogin={(u, p) => { setUser(u); setProfile(p); }} />;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#080f18", fontFamily: "'Lato', sans-serif", color: "#e2e8f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;700&display=swap" rel="stylesheet" />

      {painelUsuarios && <PainelUsuarios profiles={profiles} onAtualizar={carregarProfiles} onFechar={() => setPainelUsuarios(false)} />}

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #0d1b2a, #0a1628)", borderBottom: "1px solid #1e3a5f", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Logo size={20} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>{profile.nome}</div>
            <div style={{ fontSize: 11, color: profile.cargo === "admin" ? "#fbbf24" : "#475569", textTransform: "uppercase", letterSpacing: 1 }}>{profile.cargo === "admin" ? "👑 Admin" : "👤 Colaborador"}</div>
          </div>
          {isAdmin && (
            <>
              <button onClick={() => setPainelUsuarios(true)} style={{ background: "#1e3a5f", border: "1px solid #2a4a7f", borderRadius: 9, color: "#93c5fd", padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>👥 Usuários</button>
              <button onClick={gerarProximoMes} disabled={gerandoRecorrentes} style={{ background: "#1a2a1e", border: "1px solid #22c55e", borderRadius: 9, color: "#86efac", padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600, opacity: gerandoRecorrentes ? 0.7 : 1 }}>🔄 Gerar Próximo Mês</button>
              <button onClick={abrirNova} style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", border: "none", borderRadius: 9, color: "#fff", padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nova Tarefa</button>
            </>
          )}
          <button onClick={handleLogout} style={{ background: "#1e2a3a", border: "1px solid #1e3a5f", borderRadius: 9, color: "#64748b", padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "28px 20px", boxSizing: "border-box", width: "100%", overflowX: "hidden" }}>

        {msgRecorrente && (
          <div style={{ background: "#1a3a2a", border: "1px solid #22c55e", borderRadius: 10, padding: "12px 20px", color: "#86efac", fontSize: 14, marginBottom: 20 }}>{msgRecorrente}</div>
        )}

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {Object.entries(stats).map(([s, n]) => {
            const st = STATUS_STYLE[s];
            return (
              <div key={s} onClick={() => setFiltroStatus(filtroStatus === s ? "Todos" : s)}
                style={{ background: filtroStatus === s ? st.bg : "#0d1b2a", border: `1px solid ${filtroStatus === s ? st.border : "#1e3a5f"}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "all .2s" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: st.border, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{n}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>{s.toUpperCase()}</div>
              </div>
            );
          })}
        </div>

        {/* FILTROS */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍  Buscar cliente ou tipo..." style={{ ...inputStyle, maxWidth: 280, flex: 1 }} />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="Todos">Todos os status</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="Todos">Todos os tipos</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={exportarExcel} style={{ background: "#1a3a2a", border: "1px solid #22c55e", borderRadius: 9, color: "#86efac", padding: "9px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            📥 Exportar Excel
          </button>
        </div>

        {/* TABELA */}
        <div style={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 14, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#0a1628", borderBottom: "1px solid #1e3a5f" }}>
                {["Cliente", "Tipo", "Prazo Interno", "Prazo Legal", "Responsável", "Status", "Ações"].map(h => (
                  <th key={h} style={{ padding: "13px 12px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#334155" }}>Nenhuma tarefa encontrada.</td></tr>
              )}
              {filtradas.map((t, i) => {
                const st = STATUS_STYLE[t.status];
                const pr = PRIORIDADE_STYLE[t.prioridade];
                const internoAtrasado = t.prazo_interno && t.prazo_interno < today() && t.status !== "Concluído";
                const legalAtrasado = t.prazo_legal && t.prazo_legal < today() && t.status !== "Concluído";
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #111f30", background: i % 2 === 0 ? "transparent" : "#0a1220" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0f1f33"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#0a1220"}>
                    <td style={{ padding: "12px", fontWeight: 600, fontSize: 13, color: "#cbd5e1" }}>{t.cliente}</td>
                    <td style={{ padding: "12px" }}><span style={{ background: "#0f2a4a", border: "1px solid #1e3a5f", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>{t.tipo}</span></td>
                    <td style={{ padding: "12px", fontSize: 12, color: internoAtrasado ? "#f87171" : "#94a3b8", fontWeight: internoAtrasado ? 700 : 400 }}>{formatDate(t.prazo_interno)}</td>
                    <td style={{ padding: "12px", fontSize: 12, color: legalAtrasado ? "#f87171" : "#64748b", fontWeight: legalAtrasado ? 700 : 400 }}>{formatDate(t.prazo_legal)}</td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#94a3b8" }}>{t.responsavel_nome}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: st.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />{t.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setDetalhes(t)} style={{ background: "#1e3a5f", border: "none", borderRadius: 7, color: "#93c5fd", padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Ver</button>
                        {(isAdmin || t.responsavel_id === user.id) && <button onClick={() => abrirEditar(t)} style={{ background: "#1a3a2a", border: "none", borderRadius: 7, color: "#86efac", padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Editar</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#334155" }}>{filtradas.length} tarefa(s) — {isAdmin ? "visão admin (todas)" : "suas tarefas"}</div>
      </div>

      {/* MODAL NOVA/EDITAR */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#0ea5e9", marginBottom: 24 }}>{editando ? "✏️ Editar Tarefa" : "➕ Nova Tarefa"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Cliente *</label><input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Nome do cliente ou empresa" style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipo de Obrigação</label><select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={labelStyle}>Responsável</label><select value={form.responsavel_id} onChange={e => setForm(f => ({ ...f, responsavel_id: e.target.value }))} style={inputStyle}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div>
                <label style={labelStyle}> Prazo Interno</label>
                <input type="date" value={form.prazo_interno} onChange={e => setForm(f => ({ ...f, prazo_interno: e.target.value }))} style={inputStyle} />
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Prazo do escritório</div>
              </div>
              <div>
                <label style={labelStyle}> Prazo Legal</label>
                <input type="date" value={form.prazo_legal} onChange={e => setForm(f => ({ ...f, prazo_legal: e.target.value }))} style={inputStyle} />
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Prazo oficial de entrega</div>
              </div>
              <div><label style={labelStyle}>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>{STATUS_LIST.filter(s => s !== "Atrasado").map(s => <option key={s}>{s}</option>)}</select></div>
              <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Observações</label><textarea value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} placeholder="Anotações adicionais..." style={{ ...inputStyle, height: 70, resize: "vertical" }} /></div>
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12, background: "#0a1220", borderRadius: 10, padding: "14px 16px" }}>
                <input type="checkbox" id="recorrente" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <div>
                  <label htmlFor="recorrente" style={{ color: "#cbd5e1", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>🔄 Tarefa Recorrente</label>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Gerada automaticamente todo mês ao clicar em "Gerar Próximo Mês"</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #1e3a5f", borderRadius: 9, color: "#64748b", padding: "10px 22px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvar} disabled={formLoading} style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", border: "none", borderRadius: 9, color: "#fff", padding: "10px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: formLoading ? 0.7 : 1 }}>{formLoading ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Tarefa"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES */}
      {detalhes && (() => {
        const t = tarefasComStatus.find(x => x.id === detalhes.id) || detalhes;
        const st = STATUS_STYLE[t.status];
        const pr = PRIORIDADE_STYLE[t.prioridade];
        const podeEditar = isAdmin || t.responsavel_id === user.id;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
            <div style={{ background: "#0d1b2a", border: `1px solid ${st.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>{t.cliente}</div>
                <button onClick={() => setDetalhes(null)} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["Tipo", t.tipo],
                  ["Responsável", t.responsavel_nome],
                  [" Prazo Interno", <span style={{ color: t.prazo_interno < today() && t.status !== "Concluído" ? "#f87171" : "#cbd5e1" }}>{formatDate(t.prazo_interno)}</span>],
                  [" Prazo Legal", <span style={{ color: t.prazo_legal < today() && t.status !== "Concluído" ? "#f87171" : "#cbd5e1" }}>{formatDate(t.prazo_legal)}</span>],
                  ["Prioridade", <span style={{ color: pr.color }}>{t.prioridade}</span>],
                  ["Recorrente", t.recorrente ? "🔄 Sim" : "Não"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#0a1220", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              {podeEditar && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Alterar Status</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STATUS_LIST.filter(s => s !== "Atrasado").map(s => {
                      const ss = STATUS_STYLE[s];
                      return (
                        <button key={s} onClick={() => { alterarStatus(t.id, s); setDetalhes({ ...t, status: s }); }}
                          style={{ background: t.status === s ? ss.bg : "transparent", border: `1px solid ${t.status === s ? ss.border : "#1e3a5f"}`, borderRadius: 20, color: t.status === s ? ss.text : "#475569", padding: "5px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              {t.obs && (
                <div style={{ marginTop: 14, background: "#0a1220", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Observações</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{t.obs}</div>
                </div>
              )}
              {podeEditar && (
                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                  <button onClick={() => abrirEditar(t)} style={{ flex: 1, background: "#1a3a2a", border: "none", borderRadius: 9, color: "#86efac", padding: "10px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>✏️ Editar</button>
                  {isAdmin && <button onClick={() => excluir(t.id)} style={{ background: "#2a1e1e", border: "none", borderRadius: 9, color: "#f87171", padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>🗑️</button>}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
