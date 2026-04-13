import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
function parseDate(str) {
  if (!str || str.length !== 10) return "";
  const [dd, mm, yyyy] = str.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm}-${dd}`;
}
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

// ─── GERENCIAR AÇÕES EM LOTE ───────────────────────────────────────────────
function GerenciarAcoes({ selecionados, tarefas, profiles, onAtualizar, onLimpar }) {
  const [aberto, setAberto] = useState(false);
  const [modalAcao, setModalAcao] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function fechar(e) { if (ref.current && !ref.current.contains(e.target)) setAberto(false); }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const tarefasSel = tarefas.filter(t => selecionados.includes(t.id));

  const opcoes = [
    { label: "Adicionar Participantes", key: "add_participantes" },
    { label: "Remover Participantes", key: "rem_participantes" },
    { label: "Editar Responsável", key: "responsavel" },
    { label: "Editar Revisor", key: "revisor" },
    { label: "Editar Status", key: "status" },
    { label: "Editar Vencimento", key: "vencimento" },
    { label: "Excluir", key: "excluir", danger: true },
  ];

  async function executarAcao(tipo, valor, valor2) {
    if (tipo === "excluir") {
      if (!window.confirm(`Excluir ${selecionados.length} tarefa(s)?`)) return;
      await supabase.from("tarefas").delete().in("id", selecionados);
      onAtualizar(); onLimpar(); return;
    }
    const updates = [];
    for (const t of tarefasSel) {
      let u = {};
      if (tipo === "add_participantes") {
        const atual = t.participantes ? t.participantes.split(",").map(p => p.trim()) : [];
        const novos = valor.split(",").map(p => p.trim()).filter(p => p && !atual.includes(p));
        u = { participantes: [...atual, ...novos].join(", ") };
      } else if (tipo === "rem_participantes") {
        const remover = valor.split(",").map(p => p.trim().toLowerCase());
        const atual = t.participantes ? t.participantes.split(",").map(p => p.trim()) : [];
        u = { participantes: atual.filter(p => !remover.includes(p.toLowerCase())).join(", ") };
      } else if (tipo === "responsavel") { u = { responsavel_id: valor, responsavel_nome: profiles.find(p => p.id === valor)?.nome || "" }; }
      else if (tipo === "revisor") { u = { revisor_id: valor, revisor_nome: profiles.find(p => p.id === valor)?.nome || "" }; }
      else if (tipo === "status") { u = { status: valor }; }
      else if (tipo === "vencimento") { u = { prazo_interno: valor || t.prazo_interno, prazo_legal: valor2 || t.prazo_legal }; }
      updates.push(supabase.from("tarefas").update(u).eq("id", t.id));
    }
    await Promise.all(updates);
    onAtualizar(); onLimpar();
  }

  if (selecionados.length === 0) return null;

  return (
    <>
      <div ref={ref} style={{ position: "relative" }}>
        <button onClick={() => setAberto(!aberto)}
          style={{ background: "#1a56db", border: "none", borderRadius: 8, color: "white", padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          Gerenciar Ações ({selecionados.length}) <span style={{ fontSize: 10 }}>{aberto ? "▲" : "▼"}</span>
        </button>
        {aberto && (
          <div style={{ position: "absolute", left: 0, top: "calc(100% + 4px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 500, minWidth: 200, overflow: "hidden" }}>
            {opcoes.map((o, i) => (
              <button key={i} onClick={() => { setAberto(false); setModalAcao(o.key); }}
                style={{ display: "block", width: "100%", padding: "10px 16px", fontSize: 13, color: o.danger ? "#dc2626" : "#1e293b", background: "white", border: "none", textAlign: "left", cursor: "pointer", borderBottom: i < opcoes.length - 1 ? "1px solid #f1f5f9" : "none", fontFamily: "'Lato', sans-serif", fontWeight: o.danger ? 600 : 400 }}
                onMouseEnter={e => e.currentTarget.style.background = o.danger ? "#fee2e2" : "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {modalAcao && modalAcao !== "excluir" && (
        <ModalAcaoLote tipo={modalAcao} count={selecionados.length} profiles={profiles}
          onFechar={() => setModalAcao(null)}
          onSalvar={(v, v2) => { setModalAcao(null); executarAcao(modalAcao, v, v2); }} />
      )}
      {modalAcao === "excluir" && (executarAcao("excluir"), setModalAcao(null), null)}
    </>
  );
}

function ModalAcaoLote({ tipo, count, profiles, onFechar, onSalvar }) {
  const [valor, setValor] = useState("");
  const [valor2, setValor2] = useState("");
  const configs = {
    add_participantes: { titulo: "Adicionar Participantes em Lote", tipo: "textarea", placeholder: "Ex: Ana Lima, Carlos Souza" },
    rem_participantes: { titulo: "Remover Participantes em Lote", tipo: "textarea", placeholder: "Ex: Ana Lima, Carlos Souza" },
    responsavel: { titulo: "Editar Responsável em Lote", tipo: "select_profile" },
    revisor: { titulo: "Editar Revisor em Lote", tipo: "select_profile" },
    status: { titulo: "Editar Status em Lote", tipo: "select_status" },
    vencimento: { titulo: "Editar Vencimento em Lote", tipo: "date_duplo" },
  };
  const cfg = configs[tipo];
  if (!cfg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, padding: 20 }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a56db" }}>{cfg.titulo}</div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Aplicar para <strong style={{ color: "#1a56db" }}>{count} tarefa(s)</strong></div>
        {cfg.tipo === "select_profile" && <div><label style={LABEL}>Selecione</label><select value={valor} onChange={e => setValor(e.target.value)} style={INPUT}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>}
        {cfg.tipo === "select_status" && <div><label style={LABEL}>Novo Status</label><select value={valor} onChange={e => setValor(e.target.value)} style={INPUT}><option value="">Selecione...</option>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select></div>}
        {cfg.tipo === "date_duplo" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><div><label style={LABEL}>Prazo Interno</label><input type="date" value={valor} onChange={e => setValor(e.target.value)} style={INPUT} /></div><div><label style={LABEL}>Prazo Legal</label><input type="date" value={valor2} onChange={e => setValor2(e.target.value)} style={INPUT} /></div></div>}
        {cfg.tipo === "textarea" && <div><label style={LABEL}>{cfg.titulo.includes("Participantes") ? "Participantes (separados por vírgula)" : "Motivo"}</label><textarea value={valor} onChange={e => setValor(e.target.value)} placeholder={cfg.placeholder || "Descreva o motivo..."} style={{ ...INPUT, height: 100, resize: "vertical" }} /></div>}
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onFechar} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onSalvar(valor, valor2)} style={{ ...BTN_PRIMARY, width: "auto" }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─── DROPDOWN OPÇÕES INDIVIDUAL ────────────────────────────────────────────
function OpcoesTarefa({ tarefa, onEditar, onReplicar, onAcao, onExcluir, isAdmin, podeEditar }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function fechar(e) {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  function toggleAberto() {
    if (!aberto && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 190 });
    }
    setAberto(a => !a);
  }

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
    <>
      <button ref={btnRef} onClick={toggleAberto} style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: 7, color: "#475569", padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
        Opções <span style={{ fontSize: 9 }}>{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left, background: "white", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, minWidth: 190, overflow: "hidden" }}>
          {opcoes.map((o, i) => (
            <button key={i} onClick={o.action} style={{ display: "block", width: "100%", padding: "9px 16px", fontSize: 13, color: o.danger ? "#dc2626" : "#1e293b", background: "white", border: "none", textAlign: "left", cursor: "pointer", borderBottom: i < opcoes.length - 1 ? "1px solid #f1f5f9" : "none", fontFamily: "'Lato', sans-serif", fontWeight: o.danger ? 600 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = o.danger ? "#fee2e2" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── MODAL AÇÃO INDIVIDUAL ─────────────────────────────────────────────────
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
    if (tipo === "responsavel") updates = { responsavel_id: valor, responsavel_nome: profiles.find(p => p.id === valor)?.nome || "" };
    else if (tipo === "revisor") updates = { revisor_id: valor, revisor_nome: profiles.find(p => p.id === valor)?.nome || "" };
    else if (tipo === "status") updates = { status: valor };
    else if (tipo === "vencimento") updates = { prazo_interno: valor, prazo_legal: valor2 };
    else if (tipo === "complementar" || tipo === "reabrir") updates = { status: "Pendente", obs: (tarefa.obs ? tarefa.obs + "\n" : "") + `[${tipo === "complementar" ? "Complementar" : "Reaberto"}]: ${valor}` };
    else if (tipo === "retificar") { await supabase.from("tarefas").insert({ ...tarefa, id: undefined, status: "Pendente", obs: `[Retificação de #${tarefa.id}]: ${valor}`, criado_por: tarefa.criado_por }); setLoading(false); onSalvar(); return; }
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
        {cfg.tipo === "select_profile" && <select value={valor} onChange={e => setValor(e.target.value)} style={INPUT}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>}
        {cfg.tipo === "select_status" && <select value={valor} onChange={e => setValor(e.target.value)} style={INPUT}><option value="">Selecione...</option>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select>}
        {cfg.tipo === "date_duplo" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><div><label style={LABEL}>Prazo Interno</label><input type="date" value={valor} onChange={e => setValor(e.target.value)} style={INPUT} /></div><div><label style={LABEL}>Prazo Legal</label><input type="date" value={valor2} onChange={e => setValor2(e.target.value)} style={INPUT} /></div></div>}
        {cfg.tipo === "textarea" && <textarea value={valor} onChange={e => setValor(e.target.value)} placeholder="Descreva o motivo..." style={{ ...INPUT, height: 100, resize: "vertical" }} />}
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
  const [usuario, setUsuario] = useState(""); const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false); const [erro, setErro] = useState("");
  async function handleLogin() {
    if (!usuario.trim() || !senha.trim()) { setErro("Preencha usuário e senha."); return; }
    setLoading(true); setErro("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(usuario), password: senha });
    if (error) { setErro("Usuário ou senha incorretos."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onLogin(data.user, profile); setLoading(false);
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
  const [form, setForm] = useState({ nome: "", cnpj: "", codigo: "", responsavel_id: "" });
  const [loading, setLoading] = useState(false); const [erro, setErro] = useState(""); const [msg, setMsg] = useState(""); const [busca, setBusca] = useState("");
  async function criarCliente() {
    if (!form.nome.trim()) { setErro("Informe o nome."); return; }
    setLoading(true);
    await supabase.from("clientes").insert({ nome: form.nome.trim(), cnpj: form.cnpj.trim(), codigo: form.codigo.trim(), responsavel_id: form.responsavel_id || null });
    setMsg(`Cliente "${form.nome}" criado!`); setForm({ nome: "", cnpj: "", codigo: "", responsavel_id: "" }); setModalNovo(false); onAtualizar(); setLoading(false);
  }
  async function excluirCliente(id, nome) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    await supabase.from("clientes").delete().eq("id", id); onAtualizar();
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
          {filtrados.map(c => { const resp = profiles.find(p => p.id === c.responsavel_id); return (
            <div key={c.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{c.nome}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", gap: 12 }}>{c.codigo && <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>#{c.codigo}</span>}{c.cnpj && <span style={{ fontFamily: "monospace" }}>{c.cnpj}</span>}{resp && <span>Resp: {resp.nome}</span>}</div></div>
              <button onClick={() => excluirCliente(c.id, c.nome)} style={{ background: "#fee2e2", border: "none", borderRadius: 8, color: "#dc2626", padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Remover</button>
            </div>
          ); })}
        </div>
        <button onClick={() => { setModalNovo(true); setErro(""); setMsg(""); }} style={{ ...BTN_PRIMARY }}>+ Adicionar Novo Cliente</button>
        {modalNovo && (
          <div style={{ marginTop: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: "#1a56db", marginBottom: 16 }}>Novo Cliente</div>
            {erro && <div style={{ background: "#fee2e2", borderRadius: 8, padding: "8px 12px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{erro}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={LABEL}>Nome *</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do cliente" style={INPUT} /></div>
              <div><label style={LABEL}>CNPJ</label><input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" style={INPUT} /></div>
              <div><label style={LABEL}>Código Interno</label><input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ex: 2764" style={INPUT} /></div>
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
  const [loading, setLoading] = useState(false); const [erro, setErro] = useState(""); const [msg, setMsg] = useState("");
  async function criarUsuario() {
    if (!form.nome.trim() || !form.usuario.trim() || !form.senha.trim()) { setErro("Preencha todos os campos."); return; }
    if (form.senha.length < 6) { setErro("Senha precisa ter pelo menos 6 caracteres."); return; }
    setLoading(true); setErro("");
    const { data, error } = await supabase.auth.signUp({ email: toEmail(form.usuario), password: form.senha });
    if (error) { setErro("Erro: " + (error.message.includes("already") ? "Usuário já existe." : error.message)); setLoading(false); return; }
    if (data.user) { await supabase.from("profiles").insert({ id: data.user.id, nome: form.nome, cargo: form.cargo, usuario: form.usuario }); setMsg(`Usuário "${form.usuario}" criado!`); setForm({ nome: "", usuario: "", senha: "", cargo: "colaborador" }); setModalNovo(false); onAtualizar(); }
    setLoading(false);
  }
  async function excluirUsuario(id, nome) { if (!window.confirm(`Remover "${nome}"?`)) return; await supabase.from("profiles").delete().eq("id", id); onAtualizar(); }
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
              <div><div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{p.nome}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>usuário: <span style={{ color: "#1a56db" }}>{p.usuario || "—"}</span><span style={{ marginLeft: 12, color: p.cargo === "admin" ? "#d97706" : "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{p.cargo === "admin" ? "Admin" : "Colaborador"}</span></div></div>
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
  const [selecionados, setSelecionados] = useState([]); const [responsavelPadrao, setResponsavelPadrao] = useState(""); const [loading, setLoading] = useState(false); const [busca, setBusca] = useState("");
  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) && c.nome !== tarefa.cliente);
  function toggleCliente(id) { setSelecionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  async function replicar() {
    if (selecionados.length === 0) return; setLoading(true);
    const novas = selecionados.map(clienteId => { const cliente = clientes.find(c => c.id === clienteId); const respId = responsavelPadrao || cliente.responsavel_id || tarefa.responsavel_id; const respNome = profiles.find(p => p.id === respId)?.nome || tarefa.responsavel_nome; return { cliente: cliente.nome, cnpj_cliente: cliente.cnpj || "", tipo: tarefa.tipo, competencia: tarefa.competencia, prazo_interno: tarefa.prazo_interno, prazo_legal: tarefa.prazo_legal, prazo: tarefa.prazo_interno, responsavel_id: respId, responsavel_nome: respNome, revisor_id: tarefa.revisor_id, revisor_nome: tarefa.revisor_nome, participantes: tarefa.participantes, status: "Pendente", obs: tarefa.obs, recorrente: tarefa.recorrente, criado_por: tarefa.criado_por }; });
    await supabase.from("tarefas").insert(novas); setLoading(false); onConcluir(novas.length);
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1a56db" }}>Replicar Tarefa</div><button onClick={onFechar} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button></div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Replicando: <strong style={{ color: "#1e293b" }}>{tarefa.tipo}</strong> — <strong style={{ color: "#1e293b" }}>{tarefa.competencia || "—"}</strong></div>
        <div style={{ marginBottom: 16 }}><label style={LABEL}>Responsável (opcional)</label><select value={responsavelPadrao} onChange={e => setResponsavelPadrao(e.target.value)} style={INPUT}><option value="">Usar padrão de cada cliente</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ ...INPUT, flex: 1 }} /><button onClick={() => setSelecionados(clientesFiltrados.map(c => c.id))} style={{ background: "#dbeafe", border: "none", borderRadius: 8, color: "#1d4ed8", padding: "10px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>Selecionar todos</button></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", marginBottom: 20 }}>
          {clientesFiltrados.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Nenhum outro cliente cadastrado.</div>}
          {clientesFiltrados.map(c => { const sel = selecionados.includes(c.id); const resp = profiles.find(p => p.id === c.responsavel_id); return (
            <div key={c.id} onClick={() => toggleCliente(c.id)} style={{ background: sel ? "#dbeafe" : "#f8fafc", border: `1px solid ${sel ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? "#1d4ed8" : "#cbd5e1"}`, background: sel ? "#1d4ed8" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{sel && <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>✓</span>}</div>
              <div><div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{c.nome}</div><div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 10 }}>{c.codigo && <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>#{c.codigo}</span>}{c.cnpj && <span style={{ fontFamily: "monospace" }}>{c.cnpj}</span>}{resp && <span>Resp: {resp.nome}</span>}</div></div>
            </div>
          ); })}
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
  const [user, setUser] = useState(null); const [profile, setProfile] = useState(null);
  const [tarefas, setTarefas] = useState([]); const [profiles, setProfiles] = useState([]); const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState([]);
  const [esconderFinalizados, setEsconderFinalizados] = useState(false);

  // Filtros por coluna
  const [fCliente, setFCliente] = useState("Todos"); const [fCodigo, setFCodigo] = useState("Todos"); const [fCnpj, setFCnpj] = useState("Todos");
  const [fComp, setFComp] = useState("Todos"); const [fTipo, setFTipo] = useState("Todos");
  const [fPrazoInt, setFPrazoInt] = useState(""); const [fPrazoLeg, setFPrazoLeg] = useState("");
  const [fResp, setFResp] = useState("Todos"); const [fRevisor, setFRevisor] = useState("Todos");
  const [fPart, setFPart] = useState(""); const [fStatus, setFStatus] = useState("Todos");
  const [fSituacao, setFSituacao] = useState("Todos");

  // Colunas: ordem e largura
  const COL_DEFS = [
    { key: "cliente", label: "Cliente", w: 160 },
    { key: "codigo", label: "Código", w: 80 },
    { key: "cnpj", label: "CNPJ", w: 130 },
    { key: "competencia", label: "Competência", w: 110 },
    { key: "tipo", label: "Tipo", w: 110 },
    { key: "prazo_interno", label: "Prazo Interno", w: 120 },
    { key: "prazo_legal", label: "Prazo Legal", w: 120 },
    { key: "responsavel", label: "Responsável", w: 130 },
    { key: "revisor", label: "Revisor", w: 120 },
    { key: "participantes", label: "Participantes", w: 130 },
    { key: "status", label: "Status", w: 130 },
    { key: "situacao", label: "Situação", w: 160 },
    { key: "acoes", label: "Ações", w: 100 },
  ];
  const [colOrder, setColOrder] = useState(COL_DEFS.map(c => c.key));
  const [colWidths, setColWidths] = useState(Object.fromEntries(COL_DEFS.map(c => [c.key, c.w])));

  const [relatorio, setRelatorio] = useState(false); const [modal, setModal] = useState(false); const [editando, setEditando] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [painelUsuarios, setPainelUsuarios] = useState(false); const [painelClientes, setPainelClientes] = useState(false);
  const [modalReplicar, setModalReplicar] = useState(null); const [modalAcao, setModalAcao] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [gerandoRecorrentes, setGerandoRecorrentes] = useState(false);
  const [msgRecorrente, setMsgRecorrente] = useState(""); const [msgReplicar, setMsgReplicar] = useState("");

  const formInicial = { cliente_id: "", tipo: "IRPF", competencia: competenciaAtual(), prazo_interno: today(), prazo_legal: today(), responsavel_id: "", revisor_id: "", participantes: "", status: "Pendente", obs: "", recorrente: false };
  const [form, setForm] = useState(formInicial);

  // Drag para reordenar colunas
  const dragCol = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  function onDragStart(key) { dragCol.current = key; }
  function onDragOverCol(key) { if (dragCol.current && dragCol.current !== key) setDragOver(key); }
  function onDrop(key) {
    if (!dragCol.current || dragCol.current === key) { dragCol.current = null; setDragOver(null); return; }
    const newOrder = [...colOrder];
    const fromIdx = newOrder.indexOf(dragCol.current);
    const toIdx = newOrder.indexOf(key);
    newOrder.splice(fromIdx, 1); newOrder.splice(toIdx, 0, dragCol.current);
    setColOrder(newOrder); dragCol.current = null; setDragOver(null);
  }

  // Resize de colunas
  const resizing = useRef(null);
  function onResizeStart(e, key) {
    e.preventDefault(); e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startW: colWidths[key] };
    function onMove(ev) {
      if (!resizing.current) return;
      const delta = ev.clientX - resizing.current.startX;
      setColWidths(w => ({ ...w, [resizing.current.key]: Math.max(60, resizing.current.startW + delta) }));
    }
    function onUp() { resizing.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) { const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single(); setUser(session.user); setProfile(prof); }
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (!user || !profile) return; carregarTarefas(); carregarProfiles(); carregarClientes(); }, [user, profile]);

  async function carregarTarefas() { let q = supabase.from("tarefas").select("*").order("prazo_interno"); if (profile?.cargo !== "admin") q = q.eq("responsavel_id", user.id); const { data } = await q; setTarefas(data || []); }
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
    if (!form.cliente_id) return; setFormLoading(true);
    const clienteObj = clientes.find(c => c.id === parseInt(form.cliente_id));
    const respNome = profiles.find(p => p.id === form.responsavel_id)?.nome || "";
    const revNome = profiles.find(p => p.id === form.revisor_id)?.nome || "";
    const payload = { cliente: clienteObj?.nome || "", cnpj_cliente: clienteObj?.cnpj || "", codigo_cliente: clienteObj?.codigo || "", tipo: form.tipo, competencia: form.competencia, prazo_interno: form.prazo_interno, prazo_legal: form.prazo_legal, prazo: form.prazo_interno, responsavel_id: form.responsavel_id, responsavel_nome: respNome, revisor_id: form.revisor_id || null, revisor_nome: revNome, participantes: form.participantes, status: editando ? form.status : "Pendente", obs: form.obs, recorrente: form.recorrente, criado_por: user.id };
    if (editando) { await supabase.from("tarefas").update(payload).eq("id", editando); } else { await supabase.from("tarefas").insert(payload); }
    await carregarTarefas(); setModal(false); setFormLoading(false);
  }
  async function excluir(id) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    await supabase.from("tarefas").delete().eq("id", id);
    await carregarTarefas(); setDetalhes(null); setSelecionados(s => s.filter(x => x !== id));
  }
  async function gerarProximoMes() {
    setGerandoRecorrentes(true); setMsgRecorrente("");
    const todasRecorrentes = tarefas.filter(t => t.recorrente);
    if (todasRecorrentes.length === 0) { setMsgRecorrente("Nenhuma tarefa recorrente."); setGerandoRecorrentes(false); return; }
    // Encontra o prazo_interno mais recente entre as recorrentes para evitar duplicatas
    const maxPrazo = todasRecorrentes.map(t => t.prazo_interno).filter(Boolean).sort().reverse()[0];
    // Agrupa por chave única (cliente+tipo) e pega só a mais recente de cada
    const porChave = {};
    todasRecorrentes.forEach(t => {
      const chave = t.cliente + "||" + t.tipo;
      if (!porChave[chave] || t.prazo_interno > porChave[chave].prazo_interno) porChave[chave] = t;
    });
    const recorrentes = Object.values(porChave);
    const proximoMes = addMonths(maxPrazo, 1);
    // Verifica se já existem tarefas geradas para esse próximo mês
    const jaExiste = tarefas.some(t => t.recorrente && t.prazo_interno && t.prazo_interno.startsWith(proximoMes.substring(0, 7)));
    if (jaExiste) { setMsgRecorrente("Tarefas do próximo mês já foram geradas!"); setGerandoRecorrentes(false); return; }
    const novas = recorrentes.map(t => ({ cliente: t.cliente, cnpj_cliente: t.cnpj_cliente, codigo_cliente: t.codigo_cliente, tipo: t.tipo, competencia: addMonthsComp(t.competencia, 1), prazo_interno: addMonths(t.prazo_interno, 1), prazo_legal: addMonths(t.prazo_legal, 1), prazo: addMonths(t.prazo_interno, 1), responsavel_id: t.responsavel_id, responsavel_nome: t.responsavel_nome, revisor_id: t.revisor_id, revisor_nome: t.revisor_nome, participantes: t.participantes, status: "Pendente", obs: t.obs, recorrente: true, criado_por: t.criado_por }));
    await supabase.from("tarefas").insert(novas); await carregarTarefas();
    setMsgRecorrente(`${novas.length} tarefa(s) gerada(s)!`); setGerandoRecorrentes(false);
  }
  function exportarExcel() {
    const headers = ["Cliente", "CNPJ", "Competência", "Tipo", "Prazo Interno", "Prazo Legal", "Responsável", "Revisor", "Participantes", "Status", "Situação"];
    const rows = filtradas.map(t => [t.cliente, t.cnpj_cliente || "", t.competencia || "", t.tipo, formatDate(t.prazo_interno), formatDate(t.prazo_legal), t.responsavel_nome, t.revisor_nome || "", t.participantes || "", t.status, t.situacaoCalc]);
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 20 })); XLSX.utils.book_append_sheet(wb, ws, "Tarefas"); XLSX.writeFile(wb, "truetasks_relatorio.xlsx");
  }

  const isAdmin = profile?.cargo === "admin";
  const tarefasEnriquecidas = tarefas.map(t => ({ ...t, situacaoCalc: calcSituacaoAuto(t.prazo_interno, t.prazo_legal, t.status) }));
  const uniq = (arr) => ["Todos", ...Array.from(new Set(arr.filter(Boolean))).sort()];

  const filtradas = useMemo(() => tarefasEnriquecidas.filter(t => {
    if (fCliente !== "Todos" && t.cliente !== fCliente) return false;
    if (fCodigo !== "Todos" && t.codigo_cliente !== fCodigo) return false;
    if (fCnpj !== "Todos" && t.cnpj_cliente !== fCnpj) return false;
    if (fComp !== "Todos" && t.competencia !== fComp) return false;
    if (fTipo !== "Todos" && t.tipo !== fTipo) return false;
    if (fPrazoInt) { const d = parseDate(fPrazoInt); if (d && t.prazo_interno !== d) return false; }
    if (fPrazoLeg) { const d = parseDate(fPrazoLeg); if (d && t.prazo_legal !== d) return false; }
    if (fResp !== "Todos" && t.responsavel_nome !== fResp) return false;
    if (fRevisor !== "Todos" && t.revisor_nome !== fRevisor) return false;
    if (fPart && !(t.participantes || "").toLowerCase().includes(fPart.toLowerCase())) return false;
    if (fStatus !== "Todos" && t.status !== fStatus) return false;
    if (fSituacao !== "Todos" && t.situacaoCalc !== fSituacao) return false;
    if (esconderFinalizados && t.status === "Finalizado") return false;
    return true;
  }), [tarefasEnriquecidas, fCliente, fCnpj, fComp, fTipo, fPrazoInt, fPrazoLeg, fResp, fRevisor, fPart, fStatus, fSituacao, esconderFinalizados]);

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

  // Renderizar célula por chave
  function renderCell(key, t) {
    const stStyle = STATUS_STYLE[t.status] || { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" };
    const sitStyle = SITUACAO_STYLE[t.situacaoCalc] || { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
    const iAtrasado = t.prazo_interno && t.prazo_interno < today() && t.status !== "Finalizado";
    const lAtrasado = t.prazo_legal && t.prazo_legal < today() && t.status !== "Finalizado";
    const podeEditar = isAdmin || t.responsavel_id === user.id;
    switch (key) {
      case "cliente": return <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{t.cliente}</span>;
      case "codigo": return <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>{t.codigo_cliente || "—"}</span>;
      case "cnpj": return <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{t.cnpj_cliente || "—"}</span>;
      case "competencia": return t.competencia ? <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#475569", fontWeight: 600 }}>{t.competencia}</span> : <span style={{ color: "#94a3b8" }}>—</span>;
      case "tipo": return <span style={{ background: "#dbeafe", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>{t.tipo}</span>;
      case "prazo_interno": return <span style={{ fontSize: 12, color: iAtrasado ? "#dc2626" : "#475569", fontWeight: iAtrasado ? 700 : 400 }}>{formatDate(t.prazo_interno)}</span>;
      case "prazo_legal": return <span style={{ fontSize: 12, color: lAtrasado ? "#dc2626" : "#94a3b8" }}>{formatDate(t.prazo_legal)}</span>;
      case "responsavel": return <span style={{ fontSize: 12, color: "#64748b" }}>{t.responsavel_nome}</span>;
      case "revisor": return <span style={{ fontSize: 12, color: "#64748b" }}>{t.revisor_nome || "—"}</span>;
      case "participantes": return <span title={t.participantes} style={{ fontSize: 11, color: "#94a3b8", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: colWidths["participantes"] - 24 }}>{t.participantes || "—"}</span>;
      case "status": return <span style={{ background: stStyle.bg, border: `1px solid ${stStyle.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: stStyle.text, fontWeight: 600, whiteSpace: "nowrap" }}>{t.status}</span>;
      case "situacao": return <span style={{ background: sitStyle.bg, border: `1px solid ${sitStyle.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: sitStyle.color, fontWeight: 600, whiteSpace: "nowrap" }}>{t.situacaoCalc}</span>;
      case "acoes": return <OpcoesTarefa tarefa={t} isAdmin={isAdmin} podeEditar={podeEditar} onEditar={abrirEditar} onReplicar={setModalReplicar} onAcao={(tipo, tarefa) => setModalAcao({ tipo, tarefa })} onExcluir={excluir} />;
      default: return null;
    }
  }

  // Renderizar filtro por chave
  function renderFiltro(key) {
    const smStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: 5, color: "#475569", padding: "4px 6px", fontSize: 11, width: "100%", outline: "none", fontFamily: "'Lato', sans-serif", cursor: "pointer" };
    const inputSmStyle = { ...smStyle, cursor: "text" };
    const uniqOpts = (arr) => arr;
    switch (key) {
      case "cliente": return <select value={fCliente} onChange={e => setFCliente(e.target.value)} style={{ ...smStyle, color: fCliente !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{uniq(tarefasEnriquecidas.map(t => t.cliente)).slice(1).map(o => <option key={o}>{o}</option>)}</select>;
      case "codigo": return <select value={fCodigo} onChange={e => setFCodigo(e.target.value)} style={{ ...smStyle, color: fCodigo !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{uniq(tarefasEnriquecidas.map(t => t.codigo_cliente)).slice(1).map(o => <option key={o}>{o}</option>)}</select>;
      case "cnpj": return <select value={fCnpj} onChange={e => setFCnpj(e.target.value)} style={{ ...smStyle, color: fCnpj !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{uniq(tarefasEnriquecidas.map(t => t.cnpj_cliente)).slice(1).map(o => <option key={o}>{o}</option>)}</select>;
      case "competencia": return <select value={fComp} onChange={e => setFComp(e.target.value)} style={{ ...smStyle, color: fComp !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{uniq(tarefasEnriquecidas.map(t => t.competencia)).slice(1).map(o => <option key={o}>{o}</option>)}</select>;
      case "tipo": return <select value={fTipo} onChange={e => setFTipo(e.target.value)} style={{ ...smStyle, color: fTipo !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{TIPOS.map(o => <option key={o}>{o}</option>)}</select>;
      case "prazo_interno": return <input value={fPrazoInt} onChange={e => setFPrazoInt(e.target.value)} placeholder="dd/mm/aaaa" maxLength={10} style={{ ...inputSmStyle, color: fPrazoInt ? "#1a56db" : "#94a3b8" }} />;
      case "prazo_legal": return <input value={fPrazoLeg} onChange={e => setFPrazoLeg(e.target.value)} placeholder="dd/mm/aaaa" maxLength={10} style={{ ...inputSmStyle, color: fPrazoLeg ? "#1a56db" : "#94a3b8" }} />;
      case "responsavel": return <select value={fResp} onChange={e => setFResp(e.target.value)} style={{ ...smStyle, color: fResp !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{uniq(tarefasEnriquecidas.map(t => t.responsavel_nome)).slice(1).map(o => <option key={o}>{o}</option>)}</select>;
      case "revisor": return <select value={fRevisor} onChange={e => setFRevisor(e.target.value)} style={{ ...smStyle, color: fRevisor !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{uniq(tarefasEnriquecidas.map(t => t.revisor_nome)).slice(1).map(o => <option key={o}>{o}</option>)}</select>;
      case "participantes": return <input value={fPart} onChange={e => setFPart(e.target.value)} placeholder="Buscar..." style={{ ...inputSmStyle, color: fPart ? "#1a56db" : "#94a3b8" }} />;
      case "status": return <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ ...smStyle, color: fStatus !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{STATUS_LIST.map(o => <option key={o}>{o}</option>)}</select>;
      case "situacao": return <select value={fSituacao} onChange={e => setFSituacao(e.target.value)} style={{ ...smStyle, color: fSituacao !== "Todos" ? "#1a56db" : "#94a3b8" }}><option value="Todos">(Todos)</option>{SITUACAO_LIST.map(o => <option key={o}>{o}</option>)}</select>;
      default: return null;
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;600;700&display=swap" rel="stylesheet" />
      Carregando...
    </div>
  );

  if (!user || !profile) return <LoginScreen onLogin={(u, p) => { setUser(u); setProfile(p); }} />;

  const cols = colOrder.map(key => COL_DEFS.find(c => c.key === key)).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#f0f4f8", fontFamily: "'Lato', sans-serif", color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Lato:wght@400;600;700&display=swap" rel="stylesheet" />

      {painelUsuarios && <PainelUsuarios profiles={profiles} onAtualizar={carregarProfiles} onFechar={() => setPainelUsuarios(false)} />}
      {painelClientes && <PainelClientes clientes={clientes} profiles={profiles} onAtualizar={carregarClientes} onFechar={() => setPainelClientes(false)} />}
      {modalReplicar && <ModalReplicar tarefa={modalReplicar} clientes={clientes} profiles={profiles} onFechar={() => setModalReplicar(null)} onConcluir={async (n) => { setModalReplicar(null); await carregarTarefas(); setMsgReplicar(`${n} tarefa(s) replicada(s)!`); setTimeout(() => setMsgReplicar(""), 4000); }} />}
      {modalAcao && <ModalAcao tipo={modalAcao.tipo} tarefa={modalAcao.tarefa} profiles={profiles} onFechar={() => setModalAcao(null)} onSalvar={async () => { setModalAcao(null); await carregarTarefas(); }} />}

      {/* MODAL RELATÓRIO */}
      {relatorio && (() => {
        const total = tarefasEnriquecidas.length;
        const porStatus = STATUS_LIST.reduce((acc, s) => { acc[s] = tarefasEnriquecidas.filter(t => t.status === s).length; return acc; }, {});
        const porSituacao = SITUACAO_LIST.reduce((acc, s) => { acc[s] = tarefasEnriquecidas.filter(t => t.situacaoCalc === s).length; return acc; }, {});
        const porResp = profiles.map(p => ({ nome: p.nome, total: tarefasEnriquecidas.filter(t => t.responsavel_nome === p.nome).length, fin: tarefasEnriquecidas.filter(t => t.responsavel_nome === p.nome && t.status === "Finalizado").length })).filter(p => p.total > 0).sort((a,b) => b.total - a.total);
        const porComp = [...new Set(tarefasEnriquecidas.map(t => t.competencia).filter(Boolean))].sort().reverse().slice(0,6).map(c => ({ comp: c, total: tarefasEnriquecidas.filter(t => t.competencia === c).length, fin: tarefasEnriquecidas.filter(t => t.competencia === c && t.status === "Finalizado").length }));
        const fin = tarefasEnriquecidas.filter(t => t.status === "Finalizado").length;
        const pct = total > 0 ? Math.round((fin/total)*100) : 0;
        const BAR = { "Aguardando Cliente":"#f97316","Em Elaboração":"#3b82f6","Enviado por Email":"#22c55e","Finalizado":"#16a34a","Pendente":"#eab308","Revisão":"#a855f7" };
        const SIT = { "No Prazo":"#22c55e","A Vencer":"#eab308","Vencido Internamente":"#f97316","Vencido Legalmente":"#ef4444","Finalizado no Prazo":"#16a34a","Finalizado no Vencimento Legal":"#ca8a04","Finalizado em Atraso":"#dc2626" };
        function Bars({ items, colors, tot }) { return <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{items.filter(([,v])=>v>0).map(([lb,v])=><div key={lb}><div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}><span style={{ color:"#475569" }}>{lb}</span><span style={{ fontWeight:700 }}>{v} <span style={{ color:"#94a3b8",fontWeight:400 }}>({tot>0?Math.round(v/tot*100):0}%)</span></span></div><div style={{ background:"#f1f5f9",borderRadius:4,height:8,overflow:"hidden" }}><div style={{ background:colors[lb]||"#3b82f6",width:`${tot>0?(v/tot*100):0}%`,height:"100%",borderRadius:4 }} /></div></div>)}</div>; }
        return <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20 }}><div style={{ background:"white",borderRadius:16,padding:32,width:"100%",maxWidth:780,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.15)" }}><div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}><div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:20,fontWeight:800,color:"#1a56db" }}>📊 Relatório de Progresso</div><button onClick={()=>setRelatorio(false)} style={{ background:"none",border:"none",color:"#94a3b8",fontSize:24,cursor:"pointer" }}>×</button></div><div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24 }}>{[{l:"Total",v:total,c:"#1a56db"},{l:"Finalizadas",v:fin,c:"#16a34a"},{l:"Em Aberto",v:total-fin,c:"#f97316"},{l:"% Concluído",v:pct+"%",c:"#a855f7"}].map(x=><div key={x.l} style={{ background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 20px",textAlign:"center" }}><div style={{ fontSize:26,fontWeight:800,color:x.c,fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{x.v}</div><div style={{ fontSize:11,color:"#94a3b8",marginTop:4,fontWeight:600 }}>{x.l.toUpperCase()}</div></div>)}</div><div style={{ background:"#f8fafc",borderRadius:12,padding:"14px 20px",marginBottom:20,border:"1px solid #e2e8f0" }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,fontWeight:600,color:"#475569" }}>Progresso Geral</span><span style={{ fontSize:13,fontWeight:700,color:"#1a56db" }}>{pct}%</span></div><div style={{ background:"#e2e8f0",borderRadius:6,height:12,overflow:"hidden" }}><div style={{ background:"linear-gradient(90deg,#1a56db,#0ea5e9)",width:`${pct}%`,height:"100%",borderRadius:6 }} /></div></div><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}><div style={{ background:"#f8fafc",borderRadius:12,padding:"16px 20px",border:"1px solid #e2e8f0" }}><div style={{ fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14 }}>Por Status</div><Bars items={Object.entries(porStatus)} colors={BAR} tot={total} /></div><div style={{ background:"#f8fafc",borderRadius:12,padding:"16px 20px",border:"1px solid #e2e8f0" }}><div style={{ fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14 }}>Por Situação</div><Bars items={Object.entries(porSituacao)} colors={SIT} tot={total} /></div><div style={{ background:"#f8fafc",borderRadius:12,padding:"16px 20px",border:"1px solid #e2e8f0" }}><div style={{ fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14 }}>Por Responsável</div><div style={{ display:"flex",flexDirection:"column",gap:8 }}>{porResp.map(p=><div key={p.nome}><div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}><span style={{ color:"#475569" }}>{p.nome}</span><span style={{ fontWeight:700 }}>{p.fin}/{p.total}</span></div><div style={{ background:"#e2e8f0",borderRadius:4,height:8,overflow:"hidden" }}><div style={{ background:"#1a56db",width:`${p.total>0?(p.fin/p.total*100):0}%`,height:"100%",borderRadius:4 }} /></div></div>)}{porResp.length===0&&<div style={{ color:"#94a3b8",fontSize:13 }}>Nenhum dado.</div>}</div></div><div style={{ background:"#f8fafc",borderRadius:12,padding:"16px 20px",border:"1px solid #e2e8f0" }}><div style={{ fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:14 }}>Por Competência (últimas 6)</div><div style={{ display:"flex",flexDirection:"column",gap:8 }}>{porComp.map(c=><div key={c.comp}><div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}><span style={{ color:"#475569",fontWeight:600 }}>{c.comp}</span><span style={{ fontWeight:700 }}>{c.fin}/{c.total}</span></div><div style={{ background:"#e2e8f0",borderRadius:4,height:8,overflow:"hidden" }}><div style={{ background:"#0ea5e9",width:`${c.total>0?(c.fin/c.total*100):0}%`,height:"100%",borderRadius:4 }} /></div></div>)}{porComp.length===0&&<div style={{ color:"#94a3b8",fontSize:13 }}>Nenhum dado.</div>}</div></div></div></div></div>;
      })()}

      {/* HEADER */}
      <div style={{ background: "#1a56db", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Logo size={20} dark={false} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{profile.nome}</div><div style={{ fontSize: 11, color: isAdmin ? "#fde68a" : "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>{isAdmin ? "Admin" : "Colaborador"}</div></div>
          {isAdmin && (<>
            <button onClick={() => setPainelClientes(true)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Clientes</button>
            <button onClick={() => setPainelUsuarios(true)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Usuários</button>
            <button onClick={gerarProximoMes} disabled={gerandoRecorrentes} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, opacity: gerandoRecorrentes ? 0.7 : 1 }}>Gerar Próximo Mês</button>
            <button onClick={abrirNova} style={{ background: "white", border: "none", borderRadius: 8, color: "#1a56db", padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nova Tarefa</button>
          </>)}
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "rgba(255,255,255,0.8)", padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        {msgRecorrente && <div style={{ background: "#dcfce7", border: "1px solid #22c55e", borderRadius: 10, padding: "10px 20px", color: "#15803d", fontSize: 14, marginBottom: 12 }}>{msgRecorrente}</div>}
        {msgReplicar && <div style={{ background: "#dbeafe", border: "1px solid #3b82f6", borderRadius: 10, padding: "10px 20px", color: "#1d4ed8", fontSize: 14, marginBottom: 12 }}>{msgReplicar}</div>}

        {/* BARRA SUPERIOR */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {(() => { const n = [fCliente,fCodigo,fCnpj,fComp,fTipo,fResp,fRevisor,fStatus,fSituacao].filter(f=>f!=="Todos").length + (fPrazoInt?1:0) + (fPrazoLeg?1:0) + (fPart?1:0); return n > 0 ? <button onClick={() => { setFCliente("Todos"); setFCodigo("Todos"); setFCnpj("Todos"); setFComp("Todos"); setFTipo("Todos"); setFPrazoInt(""); setFPrazoLeg(""); setFResp("Todos"); setFRevisor("Todos"); setFPart(""); setFStatus("Todos"); setFSituacao("Todos"); }} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, color: "#dc2626", padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>✕ {n} filtro(s) ativo(s)</button> : null; })()}
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" checked={esconderFinalizados} onChange={e => setEsconderFinalizados(e.target.checked)} style={{ width: 15, height: 15 }} />
              Esconder finalizados
            </label>
            {isAdmin && <button onClick={() => setRelatorio(true)} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, color: "#1d4ed8", padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>📊 Relatório</button>}
            {isAdmin && <GerenciarAcoes selecionados={selecionados} tarefas={tarefasEnriquecidas} profiles={profiles} onAtualizar={carregarTarefas} onLimpar={() => setSelecionados([])} />}
            <button onClick={exportarExcel} style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 8, color: "#15803d", padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Exportar Excel</button>
          </div>
        </div>

        {/* TABELA */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: colOrder.reduce((sum, k) => sum + (colWidths[k] || 120), 40) + "px" }}>
            <colgroup>
              <col style={{ width: 40 }} />
              {cols.map(c => <col key={c.key} style={{ width: colWidths[c.key] || c.w }} />)}
            </colgroup>
            <thead>
              {/* Linha de rótulos */}
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "10px 12px", width: 40, textAlign: "center" }}>
                  <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos} style={{ width: 15, height: 15, cursor: "pointer" }} />
                </th>
                {cols.map(c => (
                  <th key={c.key} draggable onDragStart={() => onDragStart(c.key)} onDragOver={e => { e.preventDefault(); onDragOverCol(c.key); }} onDrop={() => onDrop(c.key)}
                    style={{ padding: "8px 12px 4px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", position: "relative", cursor: "grab", background: dragOver === c.key ? "#dbeafe" : "transparent", userSelect: "none" }}>
                    {c.label}
                    {c.key !== "acoes" && (
                      <div onMouseDown={e => onResizeStart(e, c.key)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, cursor: "col-resize", background: "transparent", zIndex: 10 }}
                        onMouseEnter={e => e.currentTarget.style.background = "#bfdbfe"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"} />
                    )}
                  </th>
                ))}
              </tr>
              {/* Linha de filtros */}
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "4px 8px" }}></th>
                {cols.map(c => (
                  <th key={c.key} style={{ padding: "4px 8px" }}>
                    {renderFiltro(c.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={cols.length + 1} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Nenhuma tarefa encontrada.</td></tr>
              )}
              {filtradas.map((t, i) => {
                const sel = selecionados.includes(t.id);
                return (
                  <tr key={t.id}
                    style={{ borderBottom: "1px solid #f1f5f9", background: sel ? "#eff6ff" : i % 2 === 0 ? "white" : "#f8fafc" }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#f1f5f9"; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = i % 2 === 0 ? "white" : "#f8fafc"; }}>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleSel(t.id)} style={{ width: 15, height: 15, cursor: "pointer" }} />
                    </td>
                    {cols.map(c => (
                      <td key={c.key} style={{ padding: "10px 12px", overflow: "hidden" }}>
                        {renderCell(c.key, t)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>{filtradas.length} tarefa(s) {selecionados.length > 0 ? `— ${selecionados.length} selecionada(s)` : ""}</div>
      </div>

      {/* MODAL NOVA/EDITAR */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#1a56db", marginBottom: 24 }}>{editando ? "Editar Tarefa" : "Nova Tarefa"}</div>
            {clientes.length === 0 && <div style={{ background: "#fef9c3", border: "1px solid #eab308", borderRadius: 8, padding: "10px 14px", color: "#854d0e", fontSize: 13, marginBottom: 16 }}>Nenhum cliente cadastrado. Cadastre clientes antes.</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Cliente *</label><select value={form.cliente_id} onChange={e => { const c = clientes.find(c => c.id === parseInt(e.target.value)); setForm(f => ({ ...f, cliente_id: e.target.value, responsavel_id: c?.responsavel_id || f.responsavel_id })); }} style={INPUT}><option value="">Selecione o cliente...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.cnpj ? ` — ${c.cnpj}` : ""}</option>)}</select></div>
              <div><label style={LABEL}>Tipo</label><select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={INPUT}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={LABEL}>Competência</label><select value={form.competencia} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))} style={INPUT}>{COMPETENCIAS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label style={LABEL}>Responsável</label><select value={form.responsavel_id} onChange={e => setForm(f => ({ ...f, responsavel_id: e.target.value }))} style={INPUT}><option value="">Selecione...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div><label style={LABEL}>Revisor</label><select value={form.revisor_id} onChange={e => setForm(f => ({ ...f, revisor_id: e.target.value }))} style={INPUT}><option value="">Sem revisor</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={LABEL}>Participantes</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: (form.participantes || "").split(",").map(x=>x.trim()).filter(Boolean).length > 0 ? 8 : 0 }}>
                  {(form.participantes || "").split(",").map(x => x.trim()).filter(Boolean).map(nome => (
                    <span key={nome} style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {nome}
                      <span onClick={() => { const atual = (form.participantes || "").split(",").map(x => x.trim()).filter(Boolean); setForm(f => ({ ...f, participantes: atual.filter(n => n !== nome).join(", ") })); }} style={{ cursor: "pointer", fontWeight: 700, fontSize: 13, lineHeight: 1, color: "#1d4ed8" }}>×</span>
                    </span>
                  ))}
                </div>
                <select value="" onChange={e => {
                  if (!e.target.value) return;
                  const atual = (form.participantes || "").split(",").map(x => x.trim()).filter(Boolean);
                  if (!atual.includes(e.target.value)) setForm(f => ({ ...f, participantes: [...atual, e.target.value].join(", ") }));
                }} style={INPUT}>
                  <option value="">Adicionar participante...</option>
                  {profiles.filter(p => !(form.participantes || "").split(",").map(x => x.trim()).includes(p.nome)).map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
              <div><label style={LABEL}>Prazo Interno</label><input type="date" value={form.prazo_interno} onChange={e => setForm(f => ({ ...f, prazo_interno: e.target.value }))} style={INPUT} /></div>
              <div><label style={LABEL}>Prazo Legal</label><input type="date" value={form.prazo_legal} onChange={e => setForm(f => ({ ...f, prazo_legal: e.target.value }))} style={INPUT} /></div>
              {editando && <div><label style={LABEL}>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={INPUT}>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select></div>}
              <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Observações</label><textarea value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} placeholder="Anotações adicionais..." style={{ ...INPUT, height: 70, resize: "vertical" }} /></div>
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                <input type="checkbox" id="recorrente" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <div><label htmlFor="recorrente" style={{ color: "#1e293b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Tarefa Recorrente</label><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Gerada automaticamente todo mês</div></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 9, color: "#64748b", padding: "10px 22px", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvar} disabled={formLoading || !form.cliente_id} style={{ ...BTN_PRIMARY, width: "auto", opacity: formLoading || !form.cliente_id ? 0.5 : 1 }}>{formLoading ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Tarefa"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
