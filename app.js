// ── Estado global ──
let produtos  = initProdutos();
let historico = initHistorico();
let xmlItens  = [];
let xmlHoje   = parseInt(sessionStorage.getItem('xmlHoje') || '0');

const hoje = () => new Date().toLocaleDateString('pt-BR');

// Remove hífens e converte para maiúsculo — usado para comparar SKUs do XML com o cadastro
// Ex: "SUPTOALHABR" e "SUP-TOALHA-BR" são tratados como iguais
const normSku = sku => sku.replace(/-/g, '').toUpperCase();

// ── Navegação ──
function switchTab(t) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-tab="${t}"]`).classList.add('active');
  document.getElementById(`tab-${t}`).classList.add('active');
  if (t === 'dashboard') renderDash();
  if (t === 'estoque')   renderEstoque('');
  if (t === 'historico') renderHistorico();
}

// ── Helpers visuais ──
function corCell(cor) {
  if (cor === 'Branco') return `<div class="cor-cell"><span class="dot dot-br"></span>Branco</div>`;
  if (cor === 'Preto')  return `<div class="cor-cell"><span class="dot dot-pt"></span>Preto</div>`;
  return `<div class="cor-cell">${cor}</div>`;
}

function statusBadge(p) {
  if (p.qtd === 0)      return '<span class="badge out">Zerado</span>';
  if (p.qtd <= p.min)   return '<span class="badge low">Baixo</span>';
  return '<span class="badge ok">OK</span>';
}

function produtoCell(nome, sku) {
  return `<div class="nome-produto">${nome}</div><div class="sku-code">${sku}</div>`;
}

// ── Dashboard ──
function renderDash() {
  const low = produtos.filter(p => p.qtd <= p.min).length;
  document.getElementById('m-total').textContent = produtos.length;
  document.getElementById('m-low').textContent   = low;
  document.getElementById('m-xml').textContent   = xmlHoje;
  document.getElementById('alert-low').style.display = low > 0 ? 'flex' : 'none';

  document.getElementById('dash-table').innerHTML = produtos.map(p => `
    <tr>
      <td>${produtoCell(p.nome, p.sku)}</td>
      <td>${corCell(p.cor)}</td>
      <td><code style="font-family:var(--mono);font-size:12px">${p.sku}</code></td>
      <td><strong>${p.qtd}</strong></td>
      <td>${statusBadge(p)}</td>
    </tr>`).join('');
}

// ── Estoque ──
function renderEstoque(filtro) {
  const f = (filtro || '').toLowerCase();
  const lista = produtos.filter(p =>
    p.sku.toLowerCase().includes(f) ||
    p.nome.toLowerCase().includes(f) ||
    p.cor.toLowerCase().includes(f)
  );

  document.getElementById('count-label').textContent =
    `${lista.length} produto${lista.length !== 1 ? 's' : ''}${f ? ` encontrado${lista.length !== 1 ? 's' : ''}` : ''}`;

  document.getElementById('est-table').innerHTML = lista.length
    ? lista.map(p => `
      <tr>
        <td>${produtoCell(p.nome, p.sku)}</td>
        <td>${corCell(p.cor)}</td>
        <td><code style="font-family:var(--mono);font-size:12px">${p.sku}</code></td>
        <td><input type="number" value="${p.qtd}" min="0" style="width:64px" onchange="atualizarQtd('${p.sku}',this.value)"/></td>
        <td><input type="number" value="${p.min}" min="1" style="width:56px" onchange="atualizarMin('${p.sku}',this.value)"/></td>
        <td>${statusBadge(p)}</td>
        <td>
          <button class="btn icon-btn" onclick="removerProduto('${p.sku}')" title="Remover">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="7" class="empty-state">Nenhum produto encontrado</td></tr>';
}

function atualizarQtd(sku, val) {
  const idx = produtos.findIndex(p => p.sku === sku);
  if (idx >= 0) { produtos[idx].qtd = Math.max(0, parseInt(val) || 0); salvarProdutos(produtos); }
}

function atualizarMin(sku, val) {
  const idx = produtos.findIndex(p => p.sku === sku);
  if (idx >= 0) { produtos[idx].min = Math.max(1, parseInt(val) || 1); salvarProdutos(produtos); }
}

function removerProduto(sku) {
  if (!confirm(`Remover ${sku} do estoque?`)) return;
  produtos = produtos.filter(p => p.sku !== sku);
  salvarProdutos(produtos);
  renderEstoque(document.querySelector('.search')?.value || '');
}

function adicionarProduto() {
  const nome = document.getElementById('p-nome').value.trim();
  const sku  = document.getElementById('p-sku').value.trim().toUpperCase();
  const qtd  = parseInt(document.getElementById('p-qtd').value) || 0;
  const min  = parseInt(document.getElementById('p-min').value) || 5;

  if (!nome || !sku) { alert('Preencha nome e SKU.'); return; }

  const cor = sku.endsWith('-BR') ? 'Branco' : sku.endsWith('-PT') ? 'Preto' : '—';
  const idx = produtos.findIndex(p => p.sku === sku);

  if (idx >= 0) { produtos[idx] = { nome, sku, cor, qtd, min }; }
  else          { produtos.push({ nome, sku, cor, qtd, min }); }

  salvarProdutos(produtos);
  document.getElementById('p-nome').value = '';
  document.getElementById('p-sku').value  = '';
  document.getElementById('p-qtd').value  = 0;
  document.getElementById('p-min').value  = 5;
  renderEstoque('');
}

// ── Histórico ──
function renderHistorico() {
  const el = document.getElementById('historico-list');
  if (!historico.length) {
    el.innerHTML = '<p class="empty-state">Sem movimentações registradas</p>';
    return;
  }
  el.innerHTML = historico.map(h => `
    <div class="history-item">
      <div>
        <div class="nome-produto">${h.nome} <span style="font-weight:400;color:var(--text-3)">· ${h.cor}</span> &mdash; ${h.qtd} unid.</div>
        <div class="history-meta">${h.sku} &nbsp;·&nbsp; NF: ${h.nf} &nbsp;·&nbsp; ${h.data}</div>
      </div>
      <span class="badge out">Saída</span>
    </div>`).join('');
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

    const getNS = (parent, tag) => {
      return parent.getElementsByTagNameNS(ns, tag)[0]
          || parent.getElementsByTagName(tag)[0];
    };

    const infNFe = getNS(doc, 'infNFe');
    const ide    = infNFe ? getNS(infNFe, 'ide') : null;
    const nNF    = ide ? (getNS(ide, 'nNF') || { textContent: '' }).textContent : filename;

    const dets = Array.from(
      doc.getElementsByTagNameNS(ns, 'det').length
        ? doc.getElementsByTagNameNS(ns, 'det')
        : doc.getElementsByTagName('det')
    );

    dets.forEach(det => {
      const prod  = getNS(det, 'prod');
      if (!prod) return;
      const cProd = (getNS(prod, 'cProd') || { textContent: '' }).textContent.trim().toUpperCase();
      const xProd = (getNS(prod, 'xProd') || { textContent: '—' }).textContent.trim();
      const qCom  = parseFloat((getNS(prod, 'qCom') || { textContent: '0' }).textContent) || 0;
      if (cProd && qCom > 0) xmlItens.push({ nf: nNF || filename, sku: cProd, produto: xProd, qtd: Math.round(qCom) });
    });
  } catch (e) {
    console.warn('Erro ao parsear XML:', filename, e);
  }
}

function mostrarPreview() {
  const pb = document.getElementById('preview-body');
  if (!xmlItens.length) {
    alert('Nenhum item encontrado nos XMLs. Verifique se são NF-e válidas.');
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
        <td>${vinc}</td>
      </tr>`;
  }).join('');

  document.getElementById('preview-area').style.display = 'block';
  document.getElementById('result-box').style.display   = 'none';
}

function aplicarXML() {
  if (!xmlItens.length) return;
  const resultados = [];

  xmlItens.forEach(item => {
    const idx = produtos.findIndex(p => normSku(p.sku) === normSku(item.sku));
    if (idx >= 0) {
      const antes = produtos[idx].qtd;
      produtos[idx].qtd = Math.max(0, antes - item.qtd);
      historico.unshift({
        nome: produtos[idx].nome,
        cor:  produtos[idx].cor,
        sku:  item.sku,
        qtd:  item.qtd,
        nf:   item.nf,
        data: hoje()
      });
      resultados.push({ ok: true, msg: `${produtos[idx].nome} · ${produtos[idx].cor} (${item.sku}): ${antes} → ${produtos[idx].qtd} unid.` });
    } else {
      resultados.push({ ok: false, msg: `${item.sku}: SKU não encontrado no estoque` });
    }
  });

  xmlHoje += xmlItens.length;
  sessionStorage.setItem('xmlHoje', xmlHoje);
  salvarProdutos(produtos);
  salvarHistorico(historico);

  document.getElementById('result-rows').innerHTML = resultados.map(r =>
    `<div class="result-row"><span>${r.msg}</span><span class="${r.ok ? 'ok' : 'err'}">${r.ok ? 'Deduzido' : 'Ignorado'}</span></div>`
  ).join('');

  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('result-box').style.display   = 'block';
  xmlItens = [];
}

function limparXML() {
  xmlItens = [];
  document.getElementById('file-chips').innerHTML      = '';
  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('result-box').style.display   = 'none';
  document.getElementById('xml-input').value = '';
}

// ── Init ──
renderDash();
