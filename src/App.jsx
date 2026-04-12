import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

const SUPABASE_URL = "https://womtpzhfbtqijqcqxujb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbXRwemhmYnRxaWpxY3F4dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTQ3MzUsImV4cCI6MjA5MDg5MDczNX0.ec3mqjxpBRltT9N_MRguO9Xt-YDSHTz66lBayT1ElPE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DOMAIN = "@truetasks.app";
const TIPOS = ["DCTFWEB", "ECF", "ECD", "EFD CONTRIBUIÇÕES", "EFD FISCAL", "EFD REINF", "ESOCIAL", "FOLHA", "IRPF", "PGDAS"];
const STATUS_LIST = ["Aguardando Cliente", "Em Elaboração", "Enviado por Email", "Finalizado", "Pendente", "Revisão"];
const SITUACAO_LIST = ["No Prazo", "A Vencer", "Vencido Internamente", "Vencido Legalmente", "Finalizado no Prazo", "Finalizado no Vencimento Legal", "Finalizado em Atraso"];

const STATUS_STYLE = {
  "Aguardando Cliente": { bg: "#fff7ed", border: "#f97316", text: "#c2410c" },
  "Em Elaboração":      { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
  "Enviado por Email":  { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
  "Finalizado":         { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
  "Pendente":           { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
  "Revisão":            { bg: "#fae8ff", border: "#a855f7", text: "#6b21a8" },
};
const SITUACAO_STYLE = {
  "No Prazo":                       { bg: "#dcfce7", border: "#22c55e", color: "#15803d" },
  "A Vencer":                       { bg: "#fef9c3", border: "#eab308", color: "#854d0e" },
  "Vencido Internamente":           { bg: "#fff7ed", border: "#f97316", color: "#c2410c" },
  "Vencido Legalmente":             { bg: "#fee2e2", border: "#ef4444", color: "#dc2626" },
  "Finalizado no Prazo":            { bg: "#dcfce7", border: "#16a34a", color: "#14532d" },
  "Finalizado no Vencimento Legal": { bg: "#fef9c3", border: "#ca8a04", color: "#713f12" },
  "Finalizado em Atraso":           { bg: "#fee2e2", border: "#dc2626", color: "#991b1b" },
};

function calcSituacaoAuto(prazo_interno, prazo_legal, status) {
  const finalizado = status === "Finalizado" || status === "Enviado por Email";
  const hoje = today();
  if (finalizado) {
    if (prazo_legal && prazo_legal < hoje) return "Finalizado em Atraso";
    if (prazo_interno && prazo_interno < hoje) return "Finalizado no Vencimento Legal";
    return "Finalizado no Prazo";
  }
  if (prazo_legal && prazo_legal < hoje) return "Vencido Legalmente";
  if (prazo_interno && prazo_interno < hoje) return "Vencido Internamente";
  const ref = prazo_interno || prazo_legal;
  if (!ref) return "No Prazo";
  const diff = Math.ceil((new Date(ref) - new Date(hoje)) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return "A Vencer";
  return "No Prazo";
}

function gerarCompetencias() {
  const lista = [];
  const hoje = new Date();
  for (let i = -12; i <= 3; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    lista.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
  }
  return lista.reverse();
}
const COMPETENCIAS = gerarCompetencias();
function competenciaAtual() {
  const h = new Date();
  return `${String(h.getMonth() + 1).padStart(2, "0")}/${h.getFullYear()}`;
}
function today() { return new Date().toISOString().split("T")[0]; }
function toEmail(u) { return u.toLowerCase().trim() + DOMAIN; }
function formatDate(d) { return d ? d.split("-").reverse().join("/") : "—"; }
function addMonths(dateStr, n) {
  const d = new Date(dateStr); d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}
function addMonthsComp(comp, n) {
  if (!comp) return comp;
  const [mm, yyyy] = comp.split("/");
  const d = new Date(parseInt(yyyy), parseInt(mm) - 1 + n, 1);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const INPUT = {
  background: "white", border: "1px solid #94a3b8", borderRadius: 8,
  color: "#0f172a", padding: "10px 14px", fontSize: 14, width: "100%",
  outline: "none", fontFamily: "'Lato', sans-serif", boxSizing: "border-box",
};
const INPUT_SM = { ...INPUT, padding: "6px 8px", fontSize: 12 };
const LABEL = { fontSize: 12, color: "#475569", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" };
const BTN_PRIMARY = {
  background: "linear-gradient(135deg, #1a56db, #1d4ed8)", border: "none",
  borderRadius: 9, color: "#fff", padding: "10px 28px", fontSize: 14,
  fontWeight: 700, cursor: "pointer", fontFamily: "'Lato', sans-serif", width: "100%",
};

function Logo({ size = 24, dark = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size + 8, height: size + 8, background: "linear-gradient(135deg, #1a56db, #0ea5e9)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.7, color: "white", fontWeight: 900 }}>✓</div>
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: 800, letterSpacing: -0.5 }}>
        <span style={{ color: dark ? "#1a56db" : "white" }}>True</span>
        <span style={{ color: "#0ea5e9" }}>Tasks</span>
      </span>
    </div>
  );
}

// ─── FILTRO DE COLUNA ──────────────────────────────────────────────────────
function FiltroColuna({ opcoes, valor, onChange, placeholder }) {
  return (
    <select value={valor} onChange={e => onChange(e.target.value)}
      style={{ ...INPUT_SM, width: "100%", marginTop: 4, border: "1px solid #e2e8f0", background: "#f8fafc", color: valor !== "Todos" ? "#1a56db" : "#94a3b8", fontWeight: valor !== "Todos" ? 600 : 400 }}>
      <option value="Todos">{placeholder || "(Todos)"}</option>
      {opcoes.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── DROPDOWN OPÇÕES ───────────────────────────────────────────────────────
function OpcoesTarefa({ tarefa, onEditar, onReplicar, onAcao, onExcluir, isAdmin, podeEditar }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function fechar(e) { if (ref.current && !ref.current.contains(e.target)) setAberto(false); }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const opcoes = [
    { label: "Editar", show: podeEditar, action: () => { onEditar(tarefa); setAberto(false); } },
    { label: "Editar Responsável", show: isAdmin, action: () => { onAcao("responsavel", tarefa); setAberto(false); } },
    { label: "Editar Revisor", show: isAdmin, action: () => { onAcao("revisor", tarefa); setAberto(false); } },
    { label: "Editar Status", show: podeEditar, action: () => { onAcao("status", tarefa); setAberto(false); } },
    { label: "Editar Vencimento", show: isAdmin, action: () => { onAcao("vencimento", tarefa); setAberto(false); } },
    { label: "Complementar", show: podeEditar, action: () => { onAcao("complementar", tarefa); setAberto(false); } },
    { label: "Reabrir", show: isAdmin, action: () => { onAcao("reabrir", tarefa); setAberto(false); } },
    { label: "Retificar", show: isAdmin, action: () => { onAcao("retificar", tarefa); setAberto(false); } },
    { label: "Replicar", show: isAdmin, action: () => { onReplicar(tarefa); setAberto(false); } },
    { label: "Excluir", show: isAdmin, action: () => { onExcluir(tarefa.id); setAberto(false); }, danger: true },
  ].filter(o => o.show);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setAberto(!aberto)}
        style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: 7, color: "#475569", padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
        Opções <span style={{ fontSize: 10 }}>{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 500, minWidth: 190, overflow: "hidden" }}>
          {opcoes.map((o, i) => (
            <button key={i} onClick={o.action}
              style={{ display: "block", width: "100%", padding: "9px 16px", fontSize: 13, color: o.danger ? "#dc2626" : "#1e293b", background: "white", border: "none", textAlign: "left", cursor: "pointer", borderBottom: i < opcoes.length - 1 ? "1px solid #f1f5f9" : "none", fontFamily: "'Lato', sans-serif", fontWeight: o.danger ? 600 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = o.danger ? "#fee2e2" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MODAL AÇÃO RÁPIDA ─────────────────────────────────────────────────────
function ModalAcao({ tipo, tarefa, profiles, onFechar, onSalvar }) {
  const [valor, setValor] = useState(tipo === "vencimento" ? tarefa.prazo_interno || "" : "");
  const [valor2, setValor2] = useState(tipo === "vencimento" ? tarefa.prazo_legal || "" : "");
  const [loading, setLoading] = useState(false);

  const configs = {
    responsavel: { titulo: "Editar Responsável", tipo: "select_profile" },
    revisor: { titulo: "Editar Revisor", tipo: "select_profile" },
    status: { titulo: "Editar Status", tipo: "select_status" },
    vencimento: { titulo: "Editar Vencimento", tipo: "date_duplo" },
    complementar: { titulo: "Tarefa Complementar", tipo: "textarea" },
    reabrir: { titulo: "Reabrir Tarefa", tipo: "textarea" },
    retificar: { titulo: "Tarefa Retificadora", tipo: "textarea" },
  };
  const cfg = configs[tipo];
  if (!cfg) return null;

  async function salvar() {
    setLoading(true);
    let updates = {};
    if (tipo === "responsavel") { updates = { responsavel_id: valor, responsavel_nome: profiles.find(p => p.id === valor)?.nome || "" }; }
    else if (tipo === "revisor") { updates = { revisor_id: valor, revisor_nome: profiles.find(p => p.id === valor)?.nome || "" }; }
    else if (tipo === "status") { updates = { status: valor }; }
    else if (tipo === "vencimento") { updates = { prazo_interno: valor, prazo_legal: valor2 }; }
    else if (tipo === "complementar" || tipo === "reabrir") {
      updates = { status: "Pendente", obs: (tarefa.obs ? tarefa.obs + "\n" : "") + `[${tipo === "complementar" ? "Complementar" : "Reaberto"}]: ${valor}` };
    } else if (tipo === "retificar") {
      await supabase.from("tarefas").insert({ ...tarefa, id: undefined, status: "Pendente", obs: `[Retificação de #${tarefa.id}]: ${valor}`, criado_por: tarefa.criado_por });
      setLoading(false); onSalvar(); return;
    }
    await supabase.from("tarefas").update(updates).eq("id", tarefa.id);
    setLoading(false); onSalvar();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 20 }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a56db" }}>{cfg.titulo}</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Tarefa: <strong style={{ color: "#1e293b" }}>{tarefa.cliente} — {tarefa.tipo}</strong></div>
        {cfg.tipo === "select_profile" && <div><label style={LABEL}>Selecione</label><select value={valor} onChange={e => setValor(e.target.value)} style={INPUT}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>}
        {cfg.tipo === "select_status" && <div><label style={LABEL}>Novo Status</label><select value={valor} onChange={e => setValor(e.target.value)} style={INPUT}><option value="">Selecione...</option>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select></div>}
        {cfg.tipo === "date_duplo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={LABEL}>Prazo Interno</label><input type="date" value={valor} onChange={e => setValor(e.target.value)} style={INPUT} /></div>
            <div><label style={LABEL}>Prazo Legal</label><input type="date" value={valor2} onChange={e => setValor2(e.target.value)} style={INPUT} /></div>
          </div>
        )}
        {cfg.tipo === "textarea" && <div><label style={LABEL}>Motivo</label><textarea value={valor} onChange={e => setValor(e.target.value)} placeholder="Descreva o motivo..." style={{ ...INPUT, height: 100, resize: "vertical" }} /></div>}
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onFechar} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
          <button onClick={salvar} disabled={loading} style={{ ...BTN_PRIMARY, width: "auto", opacity: loading ? 0.7 : 1 }}>{loading ? "Salvando..." : "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
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
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 18, padding: 40, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36, gap: 10 }}>
          <Logo size={26} dark={true} />
          <div style={{ fontSize: 13, color: "#64748b" }}>Gestão de Obrigações Fiscais</div>
        </div>
        {erro && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>⚠️ {erro}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={LABEL}>Usuário</label><input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="ex: 001 ou ana" style={INPUT} onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
          <div><label style={LABEL}>Senha</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" style={INPUT} onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
          <button onClick={handleLogin} disabled={loading} style={{ ...BTN_PRIMARY, marginTop: 8, opacity: loading ? 0.7 : 1 }}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8" }}>Não tem acesso? Solicite ao administrador.</div>
      </div>
    </div>
  );
}

// ─── PAINEL CLIENTES ───────────────────────────────────────────────────────
function PainelClientes({ clientes, profiles, onAtualizar, onFechar }) {
  const [modalNovo, setModalNovo] = useState(false);
  const [form, setForm] = useState({ nome: "", cnpj: "", responsavel_id: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [busca, setBusca] = useState("");

  async function criarCliente() {
    if (!form.nome.trim()) { setErro("Informe o nome."); return; }
    setLoading(true);
    await supabase.from("clientes").insert({ nome: form.nome.trim(), cnpj: form.cnpj.trim(), responsavel_id: form.responsavel_id || null });
    setMsg(`Cliente "${form.nome}" criado!`);
    setForm({ nome: "", cnpj: "", responsavel_id: "" });
    setModalNovo(false); onAtualizar(); setLoading(false);
  }

  async function excluirCliente(id, nome) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    await supabase.from("clientes").delete().eq("id", id);
    onAtualizar();
  }

  const filtrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.cnpj || "").includes(busca));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1a56db" }}>Gerenciar Clientes</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {msg && <div style={{ background: "#dcfce7", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", color: "#15803d", fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ..." style={{ ...INPUT, marginBottom: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 300, overflowY: "auto" }}>
          {filtrados.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Nenhum cliente cadastrado.</div>}
          {filtrados.map(c => {
            const resp = profiles.find(p => p.id === c.responsavel_id);
            return (
              <div key={c.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", gap: 12 }}>
                    {c.cnpj && <span style={{ fontFamily: "monospace" }}>{c.cnpj}</span>}
                    {resp && <span>Resp: {resp.nome}</span>}
                  </div>
                </div>
                <button onClick={() => excluirCliente(c.id, c.nome)} style={{ background: "#fee2e2", border: "none", borderRadius: 8, color: "#dc2626", padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Remover</button>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setModalNovo(true); setErro(""); setMsg(""); }} style={{ ...BTN_PRIMARY }}>+ Adicionar Novo Cliente</button>
        {modalNovo && (
          <div style={{ marginTop: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: "#1a56db", marginBottom: 16 }}>Novo Cliente</div>
            {erro && <div style={{ background: "#fee2e2", borderRadius: 8, padding: "8px 12px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{erro}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={LABEL}>Nome *</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do cliente" style={INPUT} /></div>
              <div><label style={LABEL}>CNPJ</label><input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" style={INPUT} /></div>
              <div><label style={LABEL}>Responsável padrão</label><select value={form.responsavel_id} onChange={e => setForm(f => ({ ...f, responsavel_id: e.target.value }))} style={INPUT}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setModalNovo(false)} style={{ flex: 1, background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                <button onClick={criarCliente} disabled={loading} style={{ ...BTN_PRIMARY, flex: 2, width: "auto", opacity: loading ? 0.7 : 1 }}>{loading ? "Salvando..." : "Criar Cliente"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAINEL USUÁRIOS ───────────────────────────────────────────────────────
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
      setModalNovo(false); onAtualizar();
    }
    setLoading(false);
  }

  async function excluirUsuario(id, nome) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    await supabase.from("profiles").delete().eq("id", id);
    onAtualizar();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1a56db" }}>Gerenciar Usuários</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {msg && <div style={{ background: "#dcfce7", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", color: "#15803d", fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  usuário: <span style={{ color: "#1a56db" }}>{p.usuario || "—"}</span>
                  <span style={{ marginLeft: 12, color: p.cargo === "admin" ? "#d97706" : "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{p.cargo === "admin" ? "Admin" : "Colaborador"}</span>
                </div>
              </div>
              {p.cargo !== "admin" && <button onClick={() => excluirUsuario(p.id, p.nome)} style={{ background: "#fee2e2", border: "none", borderRadius: 8, color: "#dc2626", padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Remover</button>}
            </div>
          ))}
        </div>
        <button onClick={() => { setModalNovo(true); setErro(""); setMsg(""); }} style={{ ...BTN_PRIMARY }}>+ Adicionar Novo Usuário</button>
        {modalNovo && (
          <div style={{ marginTop: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: "#1a56db", marginBottom: 16 }}>Novo Usuário</div>
            {erro && <div style={{ background: "#fee2e2", borderRadius: 8, padding: "8px 12px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{erro}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={LABEL}>Nome completo</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Ana Lima" style={INPUT} /></div>
              <div><label style={LABEL}>Usuário</label><input value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value.replace(/\s/g, "") }))} placeholder="Ex: 001 ou ana" style={INPUT} /></div>
              <div><label style={LABEL}>Senha inicial</label><input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" style={INPUT} /></div>
              <div><label style={LABEL}>Cargo</label><select value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} style={INPUT}><option value="colaborador">Colaborador</option><option value="admin">Administrador</option></select></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setModalNovo(false)} style={{ flex: 1, background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                <button onClick={criarUsuario} disabled={loading} style={{ ...BTN_PRIMARY, flex: 2, width: "auto", opacity: loading ? 0.7 : 1 }}>{loading ? "Criando..." : "Criar Usuário"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODAL REPLICAR ────────────────────────────────────────────────────────
function ModalReplicar({ tarefa, clientes, profiles, onFechar, onConcluir }) {
  const [selecionados, setSelecionados] = useState([]);
  const [responsavelPadrao, setResponsavelPadrao] = useState("");
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) && c.nome !== tarefa.cliente);
  function toggleCliente(id) { setSelecionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  async function replicar() {
    if (selecionados.length === 0) return;
    setLoading(true);
    const novas = selecionados.map(clienteId => {
      const cliente = clientes.find(c => c.id === clienteId);
      const respId = responsavelPadrao || cliente.responsavel_id || tarefa.responsavel_id;
      const respNome = profiles.find(p => p.id === respId)?.nome || tarefa.responsavel_nome;
      return { cliente: cliente.nome, cnpj_cliente: cliente.cnpj || "", tipo: tarefa.tipo, competencia: tarefa.competencia, prazo_interno: tarefa.prazo_interno, prazo_legal: tarefa.prazo_legal, prazo: tarefa.prazo_interno, responsavel_id: respId, responsavel_nome: respNome, revisor_id: tarefa.revisor_id, revisor_nome: tarefa.revisor_nome, participantes: tarefa.participantes, status: "Pendente", obs: tarefa.obs, recorrente: tarefa.recorrente, criado_por: tarefa.criado_por };
    });
    await supabase.from("tarefas").insert(novas);
    setLoading(false); onConcluir(novas.length);
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1a56db" }}>Replicar Tarefa</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Replicando: <strong style={{ color: "#1e293b" }}>{tarefa.tipo}</strong> — <strong style={{ color: "#1e293b" }}>{tarefa.competencia || "—"}</strong></div>
        <div style={{ marginBottom: 16 }}><label style={LABEL}>Responsável (opcional)</label><select value={responsavelPadrao} onChange={e => setResponsavelPadrao(e.target.value)} style={INPUT}><option value="">Usar padrão de cada cliente</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ ...INPUT, flex: 1 }} />
          <button onClick={() => setSelecionados(clientesFiltrados.map(c => c.id))} style={{ background: "#dbeafe", border: "none", borderRadius: 8, color: "#1d4ed8", padding: "10px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>Selecionar todos</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", marginBottom: 20 }}>
          {clientesFiltrados.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Nenhum outro cliente cadastrado.</div>}
          {clientesFiltrados.map(c => {
            const sel = selecionados.includes(c.id);
            const resp = profiles.find(p => p.id === c.responsavel_id);
            return (
              <div key={c.id} onClick={() => toggleCliente(c.id)} style={{ background: sel ? "#dbeafe" : "#f8fafc", border: `1px solid ${sel ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? "#1d4ed8" : "#cbd5e1"}`, background: sel ? "#1d4ed8" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{sel && <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>✓</span>}</div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 10 }}>{c.cnpj && <span style={{ fontFamily: "monospace" }}>{c.cnpj}</span>}{resp && <span>Resp: {resp.nome}</span>}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>{selecionados.length} cliente(s) selecionado(s)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onFechar} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
            <button onClick={replicar} disabled={loading || selecionados.length === 0} style={{ ...BTN_PRIMARY, width: "auto", opacity: loading || selecionados.length === 0 ? 0.5 : 1 }}>{loading ? "Replicando..." : `Replicar para ${selecionados.length}`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ──────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tarefas, setTarefas] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState([]);

  // Filtros por coluna
  const [fCliente, setFCliente] = useState("Todos");
  const [fCnpj, setFCnpj] = useState("Todos");
  const [fComp, setFComp] = useState("Todos");
  const [fTipo, setFTipo] = useState("Todos");
  const [fResp, setFResp] = useState("Todos");
  const [fRevisor, setFRevisor] = useState("Todos");
  const [fStatus, setFStatus] = useState("Todos");
  const [fSituacao, setFSituacao] = useState("Todos");
  const [esconderFinalizados, setEsconderFinalizados] = useState(false);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [painelUsuarios, setPainelUsuarios] = useState(false);
  const [painelClientes, setPainelClientes] = useState(false);
  const [modalReplicar, setModalReplicar] = useState(null);
  const [modalAcao, setModalAcao] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [gerandoRecorrentes, setGerandoRecorrentes] = useState(false);
  const [msgRecorrente, setMsgRecorrente] = useState("");
  const [msgReplicar, setMsgReplicar] = useState("");

  const formInicial = { cliente_id: "", tipo: "IRPF", competencia: competenciaAtual(), prazo_interno: today(), prazo_legal: today(), responsavel_id: "", revisor_id: "", participantes: "", status: "Pendente", obs: "", recorrente: false };
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

  useEffect(() => { if (!user || !profile) return; carregarTarefas(); carregarProfiles(); carregarClientes(); }, [user, profile]);

  async function carregarTarefas() {
    let q = supabase.from("tarefas").select("*").order("prazo_interno");
    if (profile?.cargo !== "admin") q = q.eq("responsavel_id", user.id);
    const { data } = await q;
    setTarefas(data || []);
  }
  async function carregarProfiles() { const { data } = await supabase.from("profiles").select("*"); setProfiles(data || []); }
  async function carregarClientes() { const { data } = await supabase.from("clientes").select("*").order("nome"); setClientes(data || []); }
  async function handleLogout() { await supabase.auth.signOut(); setUser(null); setProfile(null); setTarefas([]); }

  function abrirNova() { setEditando(null); setForm({ ...formInicial, responsavel_id: user.id }); setModal(true); }

  function abrirEditar(t) {
    const clienteObj = clientes.find(c => c.nome === t.cliente);
    setEditando(t.id);
    setForm({ cliente_id: clienteObj?.id || "", tipo: t.tipo, competencia: t.competencia || competenciaAtual(), prazo_interno: t.prazo_interno || today(), prazo_legal: t.prazo_legal || today(), responsavel_id: t.responsavel_id, revisor_id: t.revisor_id || "", participantes: t.participantes || "", status: t.status, obs: t.obs || "", recorrente: t.recorrente || false });
    setModal(true); setDetalhes(null);
  }

  async function salvar() {
    if (!form.cliente_id) return;
    setFormLoading(true);
    const clienteObj = clientes.find(c => c.id === parseInt(form.cliente_id));
    const respNome = profiles.find(p => p.id === form.responsavel_id)?.nome || "";
    const revNome = profiles.find(p => p.id === form.revisor_id)?.nome || "";
    const payload = { cliente: clienteObj?.nome || "", cnpj_cliente: clienteObj?.cnpj || "", tipo: form.tipo, competencia: form.competencia, prazo_interno: form.prazo_interno, prazo_legal: form.prazo_legal, prazo: form.prazo_interno, responsavel_id: form.responsavel_id, responsavel_nome: respNome, revisor_id: form.revisor_id || null, revisor_nome: revNome, participantes: form.participantes, status: form.status, obs: form.obs, recorrente: form.recorrente, criado_por: user.id };
    if (editando) { await supabase.from("tarefas").update(payload).eq("id", editando); }
    else { await supabase.from("tarefas").insert(payload); }
    await carregarTarefas(); setModal(false); setFormLoading(false);
  }

  async function excluir(id) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    await supabase.from("tarefas").delete().eq("id", id);
    await carregarTarefas(); setDetalhes(null);
    setSelecionados(s => s.filter(x => x !== id));
  }

  async function excluirSelecionados() {
    if (selecionados.length === 0) return;
    if (!window.confirm(`Excluir ${selecionados.length} tarefa(s)?`)) return;
    await supabase.from("tarefas").delete().in("id", selecionados);
    await carregarTarefas(); setSelecionados([]);
  }

  async function gerarProximoMes() {
    setGerandoRecorrentes(true); setMsgRecorrente("");
    const recorrentes = tarefas.filter(t => t.recorrente);
    if (recorrentes.length === 0) { setMsgRecorrente("Nenhuma tarefa recorrente."); setGerandoRecorrentes(false); return; }
    const novas = recorrentes.map(t => ({ cliente: t.cliente, cnpj_cliente: t.cnpj_cliente, tipo: t.tipo, competencia: addMonthsComp(t.competencia, 1), prazo_interno: addMonths(t.prazo_interno, 1), prazo_legal: addMonths(t.prazo_legal, 1), prazo: addMonths(t.prazo_interno, 1), responsavel_id: t.responsavel_id, responsavel_nome: t.responsavel_nome, revisor_id: t.revisor_id, revisor_nome: t.revisor_nome, participantes: t.participantes, status: "Pendente", obs: t.obs, recorrente: true, criado_por: t.criado_por }));
    await supabase.from("tarefas").insert(novas);
    await carregarTarefas();
    setMsgRecorrente(`${novas.length} tarefa(s) gerada(s)!`);
    setGerandoRecorrentes(false);
  }

  function exportarExcel() {
    const headers = ["Cliente", "CNPJ", "Competência", "Tipo", "Prazo Interno", "Prazo Legal", "Responsável", "Revisor", "Participantes", "Status", "Situação"];
    const rows = filtradas.map(t => [t.cliente, t.cnpj_cliente || "", t.competencia || "", t.tipo, formatDate(t.prazo_interno), formatDate(t.prazo_legal), t.responsavel_nome, t.revisor_nome || "", t.participantes || "", t.status, t.situacaoCalc]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Tarefas");
    XLSX.writeFile(wb, "truetasks_relatorio.xlsx");
  }

  const isAdmin = profile?.cargo === "admin";

  const tarefasEnriquecidas = tarefas.map(t => ({
    ...t, situacaoCalc: calcSituacaoAuto(t.prazo_interno, t.prazo_legal, t.status)
  }));

  // Opções únicas para filtros de coluna
  const uniq = (arr) => ["Todos", ...Array.from(new Set(arr.filter(Boolean))).sort()];
  const optsCliente = uniq(tarefasEnriquecidas.map(t => t.cliente));
  const optsCnpj = uniq(tarefasEnriquecidas.map(t => t.cnpj_cliente));
  const optsComp = uniq(tarefasEnriquecidas.map(t => t.competencia));
  const optsTipo = uniq(tarefasEnriquecidas.map(t => t.tipo));
  const optsResp = uniq(tarefasEnriquecidas.map(t => t.responsavel_nome));
  const optsRevisor = uniq(tarefasEnriquecidas.map(t => t.revisor_nome));

  const filtradas = useMemo(() => tarefasEnriquecidas.filter(t => {
    if (fCliente !== "Todos" && t.cliente !== fCliente) return false;
    if (fCnpj !== "Todos" && t.cnpj_cliente !== fCnpj) return false;
    if (fComp !== "Todos" && t.competencia !== fComp) return false;
    if (fTipo !== "Todos" && t.tipo !== fTipo) return false;
    if (fResp !== "Todos" && t.responsavel_nome !== fResp) return false;
    if (fRevisor !== "Todos" && t.revisor_nome !== fRevisor) return false;
    if (fStatus !== "Todos" && t.status !== fStatus) return false;
    if (fSituacao !== "Todos" && t.situacaoCalc !== fSituacao) return false;
    if (esconderFinalizados && t.status === "Finalizado") return false;
    return true;
  }), [tarefasEnriquecidas, fCliente, fCnpj, fComp, fTipo, fResp, fRevisor, fStatus, fSituacao, esconderFinalizados]);

  const sitStats = useMemo(() => {
    const s = { "Vencendo Hoje": 0, "A Vencer": 0, "Vencido Internamente": 0, "Vencido Legalmente": 0 };
    tarefasEnriquecidas.forEach(t => {
      if (t.situacaoCalc === "A Vencer") s["A Vencer"]++;
      if (t.situacaoCalc === "Vencido Internamente") s["Vencido Internamente"]++;
      if (t.situacaoCalc === "Vencido Legalmente") s["Vencido Legalmente"]++;
      if (t.prazo_interno === today() || t.prazo_legal === today()) s["Vencendo Hoje"]++;
    });
    return s;
  }, [tarefasEnriquecidas]);

  function toggleSel(id) { setSelecionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  function toggleTodos() { setSelecionados(s => s.length === filtradas.length ? [] : filtradas.map(t => t.id)); }
  const todosSelecionados = filtradas.length > 0 && selecionados.length === filtradas.length;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;600;700&display=swap" rel="stylesheet" />
      Carregando...
    </div>
  );

  if (!user || !profile) return <LoginScreen onLogin={(u, p) => { setUser(u); setProfile(p); }} />;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#f0f4f8", fontFamily: "'Lato', sans-serif", color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;600;700&display=swap" rel="stylesheet" />

      {painelUsuarios && <PainelUsuarios profiles={profiles} onAtualizar={carregarProfiles} onFechar={() => setPainelUsuarios(false)} />}
      {painelClientes && <PainelClientes clientes={clientes} profiles={profiles} onAtualizar={carregarClientes} onFechar={() => setPainelClientes(false)} />}
      {modalReplicar && <ModalReplicar tarefa={modalReplicar} clientes={clientes} profiles={profiles} onFechar={() => setModalReplicar(null)} onConcluir={async (n) => { setModalReplicar(null); await carregarTarefas(); setMsgReplicar(`${n} tarefa(s) replicada(s)!`); setTimeout(() => setMsgReplicar(""), 4000); }} />}
      {modalAcao && <ModalAcao tipo={modalAcao.tipo} tarefa={modalAcao.tarefa} profiles={profiles} onFechar={() => setModalAcao(null)} onSalvar={async () => { setModalAcao(null); await carregarTarefas(); }} />}

      {/* HEADER */}
      <div style={{ background: "#1a56db", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Logo size={20} dark={false} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{profile.nome}</div>
            <div style={{ fontSize: 11, color: isAdmin ? "#fde68a" : "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>{isAdmin ? "Admin" : "Colaborador"}</div>
          </div>
          {isAdmin && (
            <>
              <button onClick={() => setPainelClientes(true)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Clientes</button>
              <button onClick={() => setPainelUsuarios(true)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Usuários</button>
              <button onClick={gerarProximoMes} disabled={gerandoRecorrentes} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, opacity: gerandoRecorrentes ? 0.7 : 1 }}>Gerar Próximo Mês</button>
              <button onClick={abrirNova} style={{ background: "white", border: "none", borderRadius: 8, color: "#1a56db", padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nova Tarefa</button>
            </>
          )}
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "rgba(255,255,255,0.8)", padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {msgRecorrente && <div style={{ background: "#dcfce7", border: "1px solid #22c55e", borderRadius: 10, padding: "10px 20px", color: "#15803d", fontSize: 14, marginBottom: 12 }}>{msgRecorrente}</div>}
        {msgReplicar && <div style={{ background: "#dbeafe", border: "1px solid #3b82f6", borderRadius: 10, padding: "10px 20px", color: "#1d4ed8", fontSize: 14, marginBottom: 12 }}>{msgReplicar}</div>}

        {/* BADGES */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { key: "Vencendo Hoje", bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
            { key: "A Vencer", bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
            { key: "Vencido Internamente", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
            { key: "Vencido Legalmente", bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
          ].map(sit => (
            <button key={sit.key} onClick={() => setFSituacao(fSituacao === sit.key ? "Todos" : sit.key)}
              style={{ background: fSituacao === sit.key ? sit.bg : "white", border: `1.5px solid ${fSituacao === sit.key ? sit.border : "#e2e8f0"}`, borderRadius: 20, padding: "5px 14px", fontSize: 13, color: fSituacao === sit.key ? sit.color : "#64748b", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: sit.bg, color: sit.color, border: `1px solid ${sit.border}`, borderRadius: 10, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>{sitStats[sit.key]}</span>
              {sit.key}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" checked={esconderFinalizados} onChange={e => setEsconderFinalizados(e.target.checked)} style={{ width: 15, height: 15 }} />
              Esconder finalizados
            </label>
            {selecionados.length > 0 && isAdmin && (
              <button onClick={excluirSelecionados} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, color: "#dc2626", padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Excluir {selecionados.length} selecionado(s)
              </button>
            )}
            <button onClick={exportarExcel} style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 8, color: "#15803d", padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              Exportar Excel
            </button>
          </div>
        </div>

        {/* TABELA COM FILTROS POR COLUNA */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "11px 12px", width: 40 }}>
                  <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos} style={{ width: 16, height: 16, cursor: "pointer" }} />
                </th>
                {[
                  { label: "Cliente", opts: optsCliente, val: fCliente, set: setFCliente },
                  { label: "CNPJ", opts: optsCnpj, val: fCnpj, set: setFCnpj },
                  { label: "Competência", opts: optsComp, val: fComp, set: setFComp },
                  { label: "Tipo", opts: optsTipo, val: fTipo, set: setFTipo },
                  { label: "Prazo Interno", opts: null, val: null, set: null },
                  { label: "Prazo Legal", opts: null, val: null, set: null },
                  { label: "Responsável", opts: optsResp, val: fResp, set: setFResp },
                  { label: "Revisor", opts: optsRevisor, val: fRevisor, set: setFRevisor },
                  { label: "Participantes", opts: null, val: null, set: null },
                  { label: "Status", opts: STATUS_LIST, val: fStatus, set: setFStatus },
                  { label: "Situação", opts: SITUACAO_LIST, val: fSituacao, set: setFSituacao },
                  { label: "Ações", opts: null, val: null, set: null },
                ].map(col => (
                  <th key={col.label} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", minWidth: col.label === "Cliente" ? 160 : col.label === "Ações" ? 100 : 110 }}>
                    <div>{col.label}</div>
                    {col.opts && col.set && (
                      <FiltroColuna opcoes={col.opts} valor={col.val} onChange={col.set} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={13} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Nenhuma tarefa encontrada.</td></tr>
              )}
              {filtradas.map((t, i) => {
                const stStyle = STATUS_STYLE[t.status] || { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" };
                const sitStyle = SITUACAO_STYLE[t.situacaoCalc] || { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
                const iAtrasado = t.prazo_interno && t.prazo_interno < today() && t.status !== "Finalizado";
                const lAtrasado = t.prazo_legal && t.prazo_legal < today() && t.status !== "Finalizado";
                const podeEditar = isAdmin || t.responsavel_id === user.id;
                const sel = selecionados.includes(t.id);
                return (
                  <tr key={t.id}
                    style={{ borderBottom: "1px solid #f1f5f9", background: sel ? "#eff6ff" : i % 2 === 0 ? "white" : "#f8fafc" }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#f1f5f9"; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = i % 2 === 0 ? "white" : "#f8fafc"; }}>
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleSel(t.id)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "11px 12px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{t.cliente}</td>
                    <td style={{ padding: "11px 12px", fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{t.cnpj_cliente || "—"}</td>
                    <td style={{ padding: "11px 12px" }}>
                      {t.competencia ? <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#475569", fontWeight: 600 }}>{t.competencia}</span> : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ padding: "11px 12px" }}><span style={{ background: "#dbeafe", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>{t.tipo}</span></td>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: iAtrasado ? "#dc2626" : "#475569", fontWeight: iAtrasado ? 700 : 400 }}>{formatDate(t.prazo_interno)}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: lAtrasado ? "#dc2626" : "#94a3b8" }}>{formatDate(t.prazo_legal)}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: "#64748b" }}>{t.responsavel_nome}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: "#64748b" }}>{t.revisor_nome || "—"}</td>
                    <td style={{ padding: "11px 12px", fontSize: 11, color: "#94a3b8", maxWidth: 120 }}>
                      {t.participantes ? <span title={t.participantes} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.participantes}</span> : "—"}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{ background: stStyle.bg, border: `1px solid ${stStyle.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: stStyle.text, fontWeight: 600, whiteSpace: "nowrap" }}>{t.status}</span>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{ background: sitStyle.bg, border: `1px solid ${sitStyle.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: sitStyle.color, fontWeight: 600, whiteSpace: "nowrap" }}>{t.situacaoCalc}</span>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <OpcoesTarefa tarefa={t} isAdmin={isAdmin} podeEditar={podeEditar} onEditar={abrirEditar} onReplicar={setModalReplicar} onAcao={(tipo, tarefa) => setModalAcao({ tipo, tarefa })} onExcluir={excluir} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
          {filtradas.length} tarefa(s) {selecionados.length > 0 ? `— ${selecionados.length} selecionada(s)` : ""} — {isAdmin ? "visão admin (todas)" : "suas tarefas"}
        </div>
      </div>

      {/* MODAL NOVA/EDITAR */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1a56db", marginBottom: 24 }}>{editando ? "Editar Tarefa" : "Nova Tarefa"}</div>
            {clientes.length === 0 && <div style={{ background: "#fef9c3", border: "1px solid #eab308", borderRadius: 8, padding: "10px 14px", color: "#854d0e", fontSize: 13, marginBottom: 16 }}>Nenhum cliente cadastrado. Cadastre clientes antes.</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={LABEL}>Cliente *</label>
                <select value={form.cliente_id} onChange={e => { const c = clientes.find(c => c.id === parseInt(e.target.value)); setForm(f => ({ ...f, cliente_id: e.target.value, responsavel_id: c?.responsavel_id || f.responsavel_id })); }} style={INPUT}>
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.cnpj ? ` — ${c.cnpj}` : ""}</option>)}
                </select>
              </div>
              <div><label style={LABEL}>Tipo</label><select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={INPUT}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={LABEL}>Competência</label><select value={form.competencia} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))} style={INPUT}>{COMPETENCIAS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label style={LABEL}>Responsável</label><select value={form.responsavel_id} onChange={e => setForm(f => ({ ...f, responsavel_id: e.target.value }))} style={INPUT}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div><label style={LABEL}>Revisor</label><select value={form.revisor_id} onChange={e => setForm(f => ({ ...f, revisor_id: e.target.value }))} style={INPUT}><option value="">Sem revisor</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Participantes</label><input value={form.participantes} onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))} placeholder="Ex: Ana Lima, Carlos Souza" style={INPUT} /></div>
              <div><label style={LABEL}>Prazo Interno</label><input type="date" value={form.prazo_interno} onChange={e => setForm(f => ({ ...f, prazo_interno: e.target.value }))} style={INPUT} /></div>
              <div><label style={LABEL}>Prazo Legal</label><input type="date" value={form.prazo_legal} onChange={e => setForm(f => ({ ...f, prazo_legal: e.target.value }))} style={INPUT} /></div>
              <div><label style={LABEL}>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={INPUT}>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select></div>
              <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Observações</label><textarea value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} placeholder="Anotações adicionais..." style={{ ...INPUT, height: 70, resize: "vertical" }} /></div>
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                <input type="checkbox" id="recorrente" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <div>
                  <label htmlFor="recorrente" style={{ color: "#1e293b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Tarefa Recorrente</label>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Gerada automaticamente todo mês</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px 22px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvar} disabled={formLoading || !form.cliente_id} style={{ ...BTN_PRIMARY, width: "auto", opacity: formLoading || !form.cliente_id ? 0.5 : 1 }}>{formLoading ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Tarefa"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES */}
      {detalhes && (() => {
        const t = tarefasEnriquecidas.find(x => x.id === detalhes.id) || detalhes;
        const stStyle = STATUS_STYLE[t.status] || { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" };
        const sitStyle = SITUACAO_STYLE[t.situacaoCalc] || { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
        const podeEditar = isAdmin || t.responsavel_id === user.id;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
            <div style={{ background: "white", border: `2px solid ${stStyle.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{t.cliente}</div>
                  {t.cnpj_cliente && <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>{t.cnpj_cliente}</div>}
                </div>
                <button onClick={() => setDetalhes(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ background: stStyle.bg, border: `1px solid ${stStyle.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: stStyle.text, fontWeight: 600 }}>{t.status}</span>
                <span style={{ background: sitStyle.bg, border: `1px solid ${sitStyle.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: sitStyle.color, fontWeight: 600 }}>{t.situacaoCalc}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Tipo", t.tipo], ["Competência", t.competencia || "—"], ["Prazo Interno", <span style={{ color: t.prazo_interno < today() && t.status !== "Finalizado" ? "#dc2626" : "#1e293b" }}>{formatDate(t.prazo_interno)}</span>], ["Prazo Legal", <span style={{ color: t.prazo_legal < today() && t.status !== "Finalizado" ? "#dc2626" : "#1e293b" }}>{formatDate(t.prazo_legal)}</span>], ["Responsável", t.responsavel_nome], ["Revisor", t.revisor_nome || "—"], ["Participantes", t.participantes || "—"], ["Recorrente", t.recorrente ? "Sim" : "Não"]].map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              {t.obs && <div style={{ marginTop: 14, background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e2e8f0" }}><div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Observações</div><div style={{ fontSize: 13, color: "#475569" }}>{t.obs}</div></div>}
              {podeEditar && (
                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                  <button onClick={() => abrirEditar(t)} style={{ flex: 1, background: "#dcfce7", border: "none", borderRadius: 9, color: "#15803d", padding: "10px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Editar</button>
                  {isAdmin && <button onClick={() => { setDetalhes(null); setModalReplicar(t); }} style={{ flex: 1, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 9, color: "#0284c7", padding: "10px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Replicar</button>}
                  {isAdmin && <button onClick={() => excluir(t.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 9, color: "#dc2626", padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Excluir</button>}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
