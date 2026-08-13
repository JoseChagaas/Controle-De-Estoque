// ── Estado global ──
let produtos     = [];
let filtroCor    = 'todos';
let filtroBusca  = '';
let notificacoes = JSON.parse(localStorage.getItem('hl_notif') || '[]');

const normSku   = sku => sku.replace(/-/g, '').toUpperCase();
const brl       = v   => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const isWebhook = h   => h.nf && (h.nf.startsWith('ML-') || h.nf.startsWith('SHOPEE-'));

// ── Loading ──
function showLoading(msg = 'Carregando...') {
  document.getElementById('loading-msg').textContent = msg;
  document.getElementById('loading-overlay').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// ── Toast ──
function showToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${tipo}`;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}

// ── Data ──
function setDataHoje() {
  const el = document.getElementById('data-hoje');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Navegação ──
function switchTab(t) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.nav-item[data-tab="${t}"]`)?.classList.add('active');
  document.querySelectorAll('.mobile-nav button').forEach(el => el.classList.remove('active'));
  document.querySelector(`.mobile-nav button[data-tab="${t}"]`)?.classList.add('active');
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${t}`).classList.add('active');
  if (t === 'dashboard')    renderDash();
  if (t === 'estoque')      renderEstoque('');
  if (t === 'notificacoes') renderNotificacoes();
}

// ── Helpers visuais ──
function corCell(cor) {
  if (cor === 'Branco') return `<div class="cor-cell"><span class="dot dot-br"></span>Branco</div>`;
  if (cor === 'Preto')  return `<div class="cor-cell"><span class="dot dot-pt"></span>Preto</div>`;
  return `<div class="cor-cell">${cor}</div>`;
}

function statusBadge(p) {
  if (p.qtd === 0)    return '<span class="badge out">Zerado</span>';
  if (p.qtd <= p.min) return '<span class="badge low">⚠ Baixo</span>';
  return '<span class="badge ok">✓ OK</span>';
}

function produtoCell(nome, sku) {
  return `<div class="nome-produto">${nome}</div><div class="sku-code">${sku}</div>`;
}

function tempoRelativo(dataStr) {
  try {
    const diff = Math.floor((new Date() - new Date(dataStr)) / 1000);
    if (diff < 60)    return 'agora';
    if (diff < 3600)  return `${Math.floor(diff/60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
    return `${Math.floor(diff/86400)}d atrás`;
  } catch { return ''; }
}

// ── Dashboard ──
function setFiltroCor(cor) {
  filtroCor = cor;
  document.querySelectorAll('.cor-btn').forEach(b => b.classList.toggle('active', b.dataset.cor === cor));
  renderDash();
}

function setFiltroBusca(v) {
  filtroBusca = v;
  renderDash();
}

function renderDash() {
  const low = produtos.filter(p => p.qtd <= p.min).length;
  document.getElementById('m-total').textContent = produtos.length;
  document.getElementById('m-low').textContent   = low;
  document.getElementById('alert-low').style.display = low > 0 ? 'flex' : 'none';

  const f = filtroBusca.toLowerCase();
  const lista = [...produtos]
    .filter(p => {
      const corOk   = filtroCor === 'todos' || p.cor === filtroCor;
      const buscaOk = !f || p.nome.toLowerCase().includes(f) || p.sku.toLowerCase().includes(f);
      return corOk && buscaOk;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  document.getElementById('dash-table').innerHTML = lista.length
    ? lista.map(p => `
      <tr>
        <td>${produtoCell(p.nome, p.sku)}</td>
        <td>${corCell(p.cor)}</td>
        <td style="font-weight:600;color:${p.qtd === 0 ? 'var(--red)' : p.qtd <= p.min ? 'var(--amber)' : 'var(--text)'}">${p.qtd}</td>
        <td>${statusBadge(p)}</td>
        <td class="chevron-cell"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="empty-state">Nenhum produto encontrado</td></tr>';
}

// ── Estoque ──
const edicoesPendentes = {};

function renderEstoque(filtro) {
  const f = (filtro || '').toLowerCase();
  const lista = [...produtos]
    .filter(p => p.sku.toLowerCase().includes(f) || p.nome.toLowerCase().includes(f) || p.cor.toLowerCase().includes(f))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  document.getElementById('count-label').textContent =
    `${lista.length} produto${lista.length !== 1 ? 's' : ''}${f ? ' encontrado' + (lista.length !== 1 ? 's' : '') : ''}`;

  document.getElementById('est-table').innerHTML = lista.length
    ? lista.map(p => {
        const sid = p.sku.replace(/[^a-zA-Z0-9]/g, '-');
        return `
        <tr>
          <td>${produtoCell(p.nome, p.sku)}</td>
          <td>${corCell(p.cor)}</td>
          <td><input type="number" value="${p.qtd}" min="0" style="width:64px" oninput="marcarPendente('${p.sku}','qtd',this.value,this)"/></td>
          <td><input type="number" value="${p.min}" min="1" style="width:56px" oninput="marcarPendente('${p.sku}','min',this.value,this)"/></td>
          <td>${statusBadge(p)}</td>
          <td>
            <button class="btn-confirmar" id="confirmar-${sid}" onclick="confirmarEdicao('${p.sku}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Salvar
            </button>
          </td>
          <td>
            <button class="btn icon-btn" onclick="removerProduto('${p.sku}')" title="Remover">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" class="empty-state">Nenhum produto encontrado</td></tr>';
}

function marcarPendente(sku, campo, valor, input) {
  if (!edicoesPendentes[sku]) edicoesPendentes[sku] = {};
  edicoesPendentes[sku][campo] = valor;
  const btn = document.getElementById('confirmar-' + sku.replace(/[^a-zA-Z0-9]/g, '-'));
  if (btn) btn.style.display = 'inline-flex';
  input.classList.add('input-pendente');
}

async function confirmarEdicao(sku) {
  const edits = edicoesPendentes[sku];
  if (!edits) return;
  const idx = produtos.findIndex(p => p.sku === sku);
  if (idx < 0) return;
  try {
    showLoading('Salvando...');
    if (edits.qtd !== undefined) { const qtd = Math.max(0, parseInt(edits.qtd)||0); produtos[idx].qtd = qtd; await dbAtualizarQtd(sku, qtd); }
    if (edits.min !== undefined) { const min = Math.max(1, parseInt(edits.min)||1); produtos[idx].min = min; await dbAtualizarMin(sku, min); }
    delete edicoesPendentes[sku];
    renderEstoque(document.querySelector('.search')?.value || '');
    showToast('Alteração salva');
  } catch { showToast('Erro ao salvar', 'err'); }
  finally { hideLoading(); }
}

async function removerProduto(sku) {
  if (!confirm(`Remover ${sku} do estoque?`)) return;
  try {
    showLoading('Removendo...');
    await dbRemoverProduto(sku);
    produtos = produtos.filter(p => p.sku !== sku);
    renderEstoque(document.querySelector('.search')?.value || '');
    showToast('Produto removido');
  } catch { showToast('Erro ao remover', 'err'); }
  finally { hideLoading(); }
}

async function adicionarProduto() {
  const nome = document.getElementById('p-nome').value.trim();
  const sku  = document.getElementById('p-sku').value.trim().toUpperCase();
  const qtd  = parseInt(document.getElementById('p-qtd').value) || 0;
  const min  = parseInt(document.getElementById('p-min').value) || 5;
  if (!nome || !sku) { showToast('Preencha nome e SKU', 'err'); return; }
  const cor = sku.endsWith('-BR') ? 'Branco' : sku.endsWith('-PT') ? 'Preto' : '—';
  try {
    showLoading('Salvando produto...');
    await dbUpsertProduto([{ nome, sku, cor, qtd, min }]);
    const idx = produtos.findIndex(p => p.sku === sku);
    if (idx >= 0) produtos[idx] = { ...produtos[idx], nome, sku, cor, qtd, min };
    else          produtos.push({ nome, sku, cor, qtd, min });
    document.getElementById('p-nome').value = '';
    document.getElementById('p-sku').value  = '';
    document.getElementById('p-qtd').value  = 0;
    document.getElementById('p-min').value  = 5;
    renderEstoque('');
    showToast('Produto salvo');
  } catch { showToast('Erro ao salvar', 'err'); }
  finally { hideLoading(); }
}

// ── Notificações ──

function adicionarNotificacao(tipo, titulo, sub, criado_em) {
  const jaExiste = notificacoes.some(n => n.titulo === titulo && n.sub === sub);
  if (jaExiste) return;
  const n = { id: Date.now(), tipo, titulo, sub, criado_em: criado_em || new Date().toISOString(), lida: false };
  notificacoes.unshift(n);
  if (notificacoes.length > 100) notificacoes = notificacoes.slice(0, 100);
  localStorage.setItem('hl_notif', JSON.stringify(notificacoes));
  atualizarBadge();
}

function atualizarBadge() {
  const n = notificacoes.filter(n => !n.lida).length;
  ['notif-count', 'notif-count-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = n; el.style.display = n > 0 ? 'inline-block' : 'none'; }
  });
}

function renderNotificacoes() {
  notificacoes.forEach(n => n.lida = true);
  localStorage.setItem('hl_notif', JSON.stringify(notificacoes));
  atualizarBadge();
  const el = document.getElementById('notif-list');
  if (!el) return;
  el.innerHTML = notificacoes.length
    ? notificacoes.map(n => `
      <div class="notif-item">
        <div class="notif-icon ${n.tipo === 'venda' ? 'venda' : 'cancel'}">
          ${n.tipo === 'venda'
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
          }
        </div>
        <div style="flex:1">
          <div class="notif-titulo">${n.titulo}</div>
          <div class="notif-sub">${n.sub}</div>
        </div>
        <div class="notif-tempo">${tempoRelativo(n.criado_em)}</div>
      </div>`).join('')
    : '<p class="empty-state">Nenhuma notificação</p>';
}

function limparNotificacoes() {
  notificacoes = [];
  localStorage.setItem('hl_notif', JSON.stringify(notificacoes));
  atualizarBadge();
  renderNotificacoes();
}

// ── Polling ──
function getUltimaVerificacao() {
  return localStorage.getItem('hl_ultima_verificacao') ||
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function setUltimaVerificacao(iso) {
  localStorage.setItem('hl_ultima_verificacao', iso);
}

async function verificarNovasVendas() {
  try {
    const desde = getUltimaVerificacao();
    const novas = await dbGetHistoricoApos(desde);
    if (!novas.length) return;

    setUltimaVerificacao(new Date().toISOString());

    let temNova = false;
    novas.forEach(h => {
      if (!isWebhook(h)) return;
      const tipo   = h.qtd > 0 ? 'venda' : 'cancelamento';
      const titulo = h.qtd > 0 ? `Venda — ${h.nf}` : `Cancelamento — ${h.nf}`;
      const sub    = `${h.nome} · ${h.cor} · ${Math.abs(h.qtd)} unid.`;
      adicionarNotificacao(tipo, titulo, sub, h.criado_em);
      temNova = true;
    });

    if (temNova) {
      produtos = await dbGetProdutos();
      renderDash();
    }
  } catch { /* silencioso */ }
}

// ── Init ──
async function init() {
  try {
    showLoading('Conectando ao banco de dados...');
    setDataHoje();
    await seedProdutosSeVazio();
    produtos = await dbGetProdutos();
    renderDash();
    await verificarNovasVendas();
    atualizarBadge();
    setInterval(verificarNovasVendas, 60000);
  } catch(e) {
    showToast('Erro ao conectar ao banco.', 'err');
    console.error(e);
  } finally { hideLoading(); }
}

init();
