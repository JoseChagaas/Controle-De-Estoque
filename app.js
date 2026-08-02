// ── Estado global ──
let produtos  = [];
let historico = [];
let xmlItens  = [];
let filtroCor = 'todos';

const hoje = () => new Date().toLocaleDateString('pt-BR');
const normSku = sku => sku.replace(/-/g, '').toUpperCase();
const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ── Loading overlay ──
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

// ── Navegação ──
function switchTab(t) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-tab="${t}"]`).classList.add('active');
  document.getElementById(`tab-${t}`).classList.add('active');
  if (t === 'dashboard') renderDash();
  if (t === 'estoque')   renderEstoque('');
  if (t === 'historico') carregarHistorico();
}

// ── Helpers visuais ──
function corCell(cor) {
  if (cor === 'Branco') return `<div class="cor-cell"><span class="dot dot-br"></span>Branco</div>`;
  if (cor === 'Preto')  return `<div class="cor-cell"><span class="dot dot-pt"></span>Preto</div>`;
  return `<div class="cor-cell">${cor}</div>`;
}

function statusBadge(p) {
  if (p.qtd === 0)    return '<span class="badge out">Zerado</span>';
  if (p.qtd <= p.min) return '<span class="badge low">Baixo</span>';
  return '<span class="badge ok">OK</span>';
}

function produtoCell(nome, sku) {
  return `<div class="nome-produto">${nome}</div><div class="sku-code">${sku}</div>`;
}

// ── Dashboard ──
function setFiltroCor(cor) {
  filtroCor = cor;
  document.querySelectorAll('.cor-btn').forEach(b => b.classList.toggle('active', b.dataset.cor === cor));
  renderDash();
}

function renderDash() {
  const low = produtos.filter(p => p.qtd <= p.min).length;
  document.getElementById('m-total').textContent = produtos.length;
  document.getElementById('m-low').textContent   = low;
  document.getElementById('alert-low').style.display = low > 0 ? 'flex' : 'none';

  // Ordena: produtos com estoque > 0 primeiro (alfabético), depois zerados (alfabético)
  const ordenados = [...produtos]
    .filter(p => filtroCor === 'todos' || p.cor === filtroCor)
    .sort((a, b) => {
      if (a.qtd > 0 && b.qtd === 0) return -1;
      if (a.qtd === 0 && b.qtd > 0) return 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

  document.getElementById('dash-table').innerHTML = ordenados.map(p => `
    <tr>
      <td>${produtoCell(p.nome, p.sku)}</td>
      <td>${corCell(p.cor)}</td>
      <td><strong>${p.qtd}</strong></td>
      <td>${statusBadge(p)}</td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty-state">Nenhum produto encontrado</td></tr>';
}

// ── Estoque ──
// Guarda edições pendentes: { sku -> { qtd?, min? } }
const edicoesPendentes = {};

function renderEstoque(filtro) {
  const f = (filtro || '').toLowerCase();
  const lista = [...produtos]
    .filter(p =>
      p.sku.toLowerCase().includes(f) ||
      p.nome.toLowerCase().includes(f) ||
      p.cor.toLowerCase().includes(f)
    )
    .sort((a, b) => {
      if (a.qtd > 0 && b.qtd === 0) return -1;
      if (a.qtd === 0 && b.qtd > 0) return 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

  document.getElementById('count-label').textContent =
    `${lista.length} produto${lista.length !== 1 ? 's' : ''}${f ? ' encontrado' + (lista.length !== 1 ? 's' : '') : ''}`;

  document.getElementById('est-table').innerHTML = lista.length
    ? lista.map(p => `
      <tr id="row-${p.sku.replace(/[^a-zA-Z0-9]/g,'-')}">
        <td>${produtoCell(p.nome, p.sku)}</td>
        <td>${corCell(p.cor)}</td>
        <td>
          <input type="number" value="${p.qtd}" min="0" style="width:64px"
            oninput="marcarPendente('${p.sku}', 'qtd', this.value, this)"/>
        </td>
        <td>
          <input type="number" value="${p.min}" min="1" style="width:56px"
            oninput="marcarPendente('${p.sku}', 'min', this.value, this)"/>
        </td>
        <td>${statusBadge(p)}</td>
        <td>
          <button class="btn-confirmar" id="confirmar-${p.sku.replace(/[^a-zA-Z0-9]/g,'-')}"
            style="display:none" onclick="confirmarEdicao('${p.sku}')" title="Confirmar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Salvar
          </button>
        </td>
        <td>
          <button class="btn icon-btn" onclick="removerProduto('${p.sku}')" title="Remover">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="8" class="empty-state">Nenhum produto encontrado</td></tr>';
}

function marcarPendente(sku, campo, valor, input) {
  if (!edicoesPendentes[sku]) edicoesPendentes[sku] = {};
  edicoesPendentes[sku][campo] = valor;
  const btnId = 'confirmar-' + sku.replace(/[^a-zA-Z0-9]/g, '-');
  const btn = document.getElementById(btnId);
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
    if (edits.qtd !== undefined) {
      const qtd = Math.max(0, parseInt(edits.qtd) || 0);
      produtos[idx].qtd = qtd;
      await dbAtualizarQtd(sku, qtd);
    }
    if (edits.min !== undefined) {
      const min = Math.max(1, parseInt(edits.min) || 1);
      produtos[idx].min = min;
      await dbAtualizarMin(sku, min);
    }
    delete edicoesPendentes[sku];
    renderEstoque(document.querySelector('.search')?.value || '');
    showToast('Alteração salva');
  } catch(e) {
    showToast('Erro ao salvar alteração', 'err');
  } finally { hideLoading(); }
}

async function removerProduto(sku) {
  if (!confirm(`Remover ${sku} do estoque?`)) return;
  try {
    showLoading('Removendo produto...');
    await dbRemoverProduto(sku);
    produtos = produtos.filter(p => p.sku !== sku);
    renderEstoque(document.querySelector('.search')?.value || '');
    showToast('Produto removido');
  } catch(e) {
    showToast('Erro ao remover produto', 'err');
  } finally { hideLoading(); }
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
    showToast('Produto salvo com sucesso');
  } catch(e) {
    showToast('Erro ao salvar produto', 'err');
  } finally { hideLoading(); }
}

// ── Histórico ──
async function carregarHistorico() {
  try {
    showLoading('Carregando histórico...');
    historico = await dbGetHistorico();
    renderHistorico();
  } catch(e) {
    showToast('Erro ao carregar histórico', 'err');
  } finally { hideLoading(); }
}

function renderHistorico() {
  const el = document.getElementById('historico-list');
  if (!historico.length) {
    el.innerHTML = '<p class="empty-state">Sem movimentações registradas</p>';
    return;
  }

  // Agrupa por data de importação (campo data) e número de NF
  const porData = {};
  historico.forEach(h => {
    if (!porData[h.data]) porData[h.data] = {};
    if (!porData[h.data][h.nf]) porData[h.data][h.nf] = { itens: [], totalPecas: 0, totalValor: 0 };
    porData[h.data][h.nf].itens.push(h);
    porData[h.data][h.nf].totalPecas += h.qtd;
    porData[h.data][h.nf].totalValor += parseFloat(h.valor || 0);
  });

  let html = '';
  Object.entries(porData).forEach(([data, nfs]) => {
    const totalNFs    = Object.keys(nfs).length;
    const totalPecas  = Object.values(nfs).reduce((s, n) => s + n.totalPecas, 0);
    const totalValor  = Object.values(nfs).reduce((s, n) => s + n.totalValor, 0);

    html += `
      <div class="hist-dia">
        <div class="hist-dia-header">
          <div>
            <span class="hist-data">${data}</span>
          </div>
          <div class="hist-dia-stats">
            <span class="hist-stat"><strong>${totalNFs}</strong> NF${totalNFs !== 1 ? 's' : ''}</span>
            <span class="hist-stat"><strong>${totalPecas}</strong> peça${totalPecas !== 1 ? 's' : ''}</span>
            ${totalValor > 0 ? `<span class="hist-stat valor"><strong>${brl(totalValor)}</strong></span>` : ''}
          </div>
        </div>
      </div>`;
  });

  el.innerHTML = html;
}

// ── Importar XML ──
const dz = document.getElementById('drop-zone');
dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('drag');
  handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
  if (!files || !files.length) return;
  xmlItens = [];
  const chips = document.getElementById('file-chips');
  chips.innerHTML = '';
  let pending = files.length;

  Array.from(files).forEach(file => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ${file.name}`;
    chips.appendChild(chip);

    const r = new FileReader();
    r.onload = e => {
      parseXML(file.name, e.target.result);
      pending--;
      if (pending === 0) mostrarPreview();
    };
    r.readAsText(file);
  });
}

function parseXML(filename, content) {
  try {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(content, 'text/xml');
    const ns     = 'http://www.portalfiscal.inf.br/nfe';

    const getNS = (parent, tag) =>
      parent.getElementsByTagNameNS(ns, tag)[0] ||
      parent.getElementsByTagName(tag)[0];

    const infNFe = getNS(doc, 'infNFe');
    const ide    = infNFe ? getNS(infNFe, 'ide') : null;
    const nNF    = ide ? (getNS(ide, 'nNF') || { textContent: '' }).textContent : filename;

    const dets = Array.from(
      doc.getElementsByTagNameNS(ns, 'det').length
        ? doc.getElementsByTagNameNS(ns, 'det')
        : doc.getElementsByTagName('det')
    );

    dets.forEach(det => {
      const prod   = getNS(det, 'prod');
      if (!prod) return;
      const cProd  = (getNS(prod, 'cProd')  || { textContent: '' }).textContent.trim().toUpperCase();
      const xProd  = (getNS(prod, 'xProd')  || { textContent: '—' }).textContent.trim();
      const qCom   = parseFloat((getNS(prod, 'qCom')  || { textContent: '0' }).textContent) || 0;
      const vProd  = parseFloat((getNS(prod, 'vProd') || { textContent: '0' }).textContent) || 0;
      if (cProd && qCom > 0) xmlItens.push({ nf: nNF || filename, sku: cProd, produto: xProd, qtd: Math.round(qCom), valor: vProd });
    });
  } catch(e) {
    console.warn('Erro ao parsear XML:', filename, e);
  }
}

function mostrarPreview() {
  const pb = document.getElementById('preview-body');
  if (!xmlItens.length) {
    showToast('Nenhum item encontrado nos XMLs.', 'err');
    return;
  }

  pb.innerHTML = xmlItens.map(item => {
    const idx  = produtos.findIndex(p => normSku(p.sku) === normSku(item.sku));
    const vinc = idx >= 0
      ? `<span class="badge ok">&#10003; ${produtos[idx].nome} · ${produtos[idx].cor}</span>`
      : `<span class="badge low">&#9651; SKU não cadastrado</span>`;
    return `
      <tr>
        <td style="font-size:12px;color:var(--text-3)">${item.nf}</td>
        <td>${produtoCell(item.sku, item.produto)}</td>
        <td>${item.qtd}</td>
        <td>${brl(item.valor)}</td>
        <td>${vinc}</td>
      </tr>`;
  }).join('');

  document.getElementById('preview-area').style.display = 'block';
  document.getElementById('result-box').style.display   = 'none';
}

async function aplicarXML() {
  if (!xmlItens.length) return;

  try {
    showLoading('Verificando NFs já importadas...');

    const nfsNoLote       = [...new Set(xmlItens.map(i => i.nf))];
    const nfsJaImportadas = await dbGetNFsJaImportadas(nfsNoLote);

    const itensDuplicados = xmlItens.filter(i =>  nfsJaImportadas.includes(i.nf));
    const itensNovos      = xmlItens.filter(i => !nfsJaImportadas.includes(i.nf));

    const resultados = [];

    itensDuplicados.forEach(item => {
      resultados.push({ ok: false, duplicada: true, msg: `NF ${item.nf} (${item.sku}): já importada — ignorada` });
    });

    if (!itensNovos.length) {
      document.getElementById('result-rows').innerHTML = resultados.map(r =>
        `<div class="result-row"><span>${r.msg}</span><span class="err">Duplicada</span></div>`
      ).join('');
      document.getElementById('preview-area').style.display = 'none';
      document.getElementById('result-box').style.display   = 'block';
      xmlItens = [];
      showToast('Todas as NFs deste lote já foram importadas anteriormente.', 'err');
      return;
    }

    const deducoesPorSku = {};
    itensNovos.forEach(item => {
      const idx = produtos.findIndex(p => normSku(p.sku) === normSku(item.sku));
      if (idx >= 0) {
        const skuReal = produtos[idx].sku;
        if (!deducoesPorSku[skuReal]) deducoesPorSku[skuReal] = { total: 0, produto: produtos[idx] };
        deducoesPorSku[skuReal].total += item.qtd;
        resultados.push({ ok: true, nf: item.nf, sku: skuReal, nome: produtos[idx].nome, cor: produtos[idx].cor, qtdDeduzida: item.qtd });
      } else {
        resultados.push({ ok: false, msg: `${item.sku}: SKU não encontrado no estoque` });
      }
    });

    showLoading('Atualizando estoque...');
    const atualizacoes = [];
    Object.entries(deducoesPorSku).forEach(([sku, { total }]) => {
      const idx  = produtos.findIndex(p => p.sku === sku);
      const nova = Math.max(0, produtos[idx].qtd - total);
      produtos[idx].qtd = nova;
      atualizacoes.push({ sku, qtd: nova });
    });

    const novosHistorico = itensNovos
      .filter(item => produtos.findIndex(p => normSku(p.sku) === normSku(item.sku)) >= 0)
      .map(item => {
        const p = produtos.find(p => normSku(p.sku) === normSku(item.sku));
        return { nome: p.nome, cor: p.cor, sku: p.sku, qtd: item.qtd, nf: item.nf, data: hoje(), valor: item.valor };
      });

    await Promise.all(atualizacoes.map(a => dbAtualizarQtd(a.sku, a.qtd)));
    if (novosHistorico.length) await dbInserirHistorico(novosHistorico);

    const linhasResultado = resultados.map(r => {
      if (r.duplicada) return `<div class="result-row warn"><span>⚠ ${r.msg}</span><span style="color:var(--amber);font-size:12px">Duplicada</span></div>`;
      if (!r.ok)       return `<div class="result-row"><span>${r.msg}</span><span class="err">Ignorado</span></div>`;
      return `<div class="result-row"><span>${r.nome} · ${r.cor} (${r.sku}) — NF ${r.nf}: −${r.qtdDeduzida} unid.</span><span class="ok">Deduzido</span></div>`;
    }).join('');

    document.getElementById('result-rows').innerHTML = linhasResultado;
    document.getElementById('preview-area').style.display = 'none';
    document.getElementById('result-box').style.display   = 'block';
    xmlItens = [];
    renderDash();

    const msg = itensDuplicados.length
      ? `Estoque atualizado. ${itensDuplicados.length} NF(s) duplicada(s) ignorada(s).`
      : 'Estoque atualizado com sucesso!';
    showToast(msg, itensDuplicados.length ? 'err' : 'ok');

  } catch(e) {
    console.error(e);
    showToast('Erro ao atualizar estoque no banco', 'err');
  } finally { hideLoading(); }
}

function limparXML() {
  xmlItens = [];
  document.getElementById('file-chips').innerHTML       = '';
  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('result-box').style.display   = 'none';
  document.getElementById('xml-input').value = '';
}

// ── Init ──
async function init() {
  try {
    showLoading('Conectando ao banco de dados...');
    await seedProdutosSeVazio();
    produtos = await dbGetProdutos();
    renderDash();
  } catch(e) {
    showToast('Erro ao conectar ao banco. Verifique sua conexão.', 'err');
    console.error(e);
  } finally { hideLoading(); }
}

init();
