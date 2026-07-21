// ── Configuração Supabase ──
const SUPABASE_URL = 'https://mhlgjyrzwsedvbxilitg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obGdqeXJ6d3NlZHZieGlsaXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODU1NjgsImV4cCI6MjEwMDE2MTU2OH0.1gtqWU3LFVxCCIq9RwV3W1GSLxkrQn7aJphtTGg2N6Y';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation'
};

const API = (tabela) => `${SUPABASE_URL}/rest/v1/${tabela}`;

// ── Produtos ──
async function dbGetProdutos() {
  const res = await fetch(`${API('produtos')}?order=nome.asc`, { headers: HEADERS });
  if (!res.ok) throw new Error('Erro ao buscar produtos');
  return res.json();
}

async function dbUpsertProduto(produto) {
  const res = await fetch(`${API('produtos')}?on_conflict=sku`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(produto)
  });
  if (!res.ok) throw new Error('Erro ao salvar produto');
  return res.json();
}

async function dbAtualizarQtd(sku, qtd) {
  const res = await fetch(`${API('produtos')}?sku=eq.${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ qtd })
  });
  if (!res.ok) throw new Error('Erro ao atualizar quantidade');
}

async function dbAtualizarMin(sku, min) {
  const res = await fetch(`${API('produtos')}?sku=eq.${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ min })
  });
  if (!res.ok) throw new Error('Erro ao atualizar mínimo');
}

async function dbRemoverProduto(sku) {
  const res = await fetch(`${API('produtos')}?sku=eq.${encodeURIComponent(sku)}`, {
    method: 'DELETE',
    headers: HEADERS
  });
  if (!res.ok) throw new Error('Erro ao remover produto');
}

// ── Histórico ──
async function dbGetHistorico() {
  const res = await fetch(`${API('historico')}?order=criado_em.desc&limit=200`, { headers: HEADERS });
  if (!res.ok) throw new Error('Erro ao buscar histórico');
  return res.json();
}

async function dbInserirHistorico(registros) {
  const res = await fetch(API('historico'), {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(registros)
  });
  if (!res.ok) throw new Error('Erro ao inserir histórico');
}

// ── Catálogo inicial — usado apenas na primeira carga ──
const CATALOG = [
  { nome: 'Trava de Porta',           skus: [{ sku: 'TRAVA-PT', cor: 'Preto' }, { sku: 'TRAVA-BR', cor: 'Branco' }] },
  { nome: 'Suporte Toalha',           skus: [{ sku: 'SUP-TOALHA-BR', cor: 'Branco' }, { sku: 'SUP-TOALHA-PT', cor: 'Preto' }] },
  { nome: 'Suporte Controle',         skus: [{ sku: 'SUP-CONTROLE-PT', cor: 'Preto' }, { sku: 'SUP-CONTROLE-BR', cor: 'Branco' }] },
  { nome: 'Beija-Flor',               skus: [{ sku: 'BEIJA-FLOR-BR', cor: 'Branco' }, { sku: 'BEIJA-FLOR-PT', cor: 'Preto' }] },
  { nome: 'Ore e Confie',             skus: [{ sku: 'ORE-PT', cor: 'Preto' }, { sku: 'ORE-BR', cor: 'Branco' }] },
  { nome: 'Suporte Filtro Café',      skus: [{ sku: 'SUP-FILTRO-PT', cor: 'Preto' }, { sku: 'SUP-FILTRO-BR', cor: 'Branco' }] },
  { nome: 'Cabideiro',                skus: [{ sku: 'SUP-CABIDEIRO-BR', cor: 'Branco' }, { sku: 'SUP-CABIDEIRO-PT', cor: 'Preto' }] },
  { nome: 'Suporte 3 em 1',           skus: [{ sku: 'SUP-SEC-PT', cor: 'Preto' }, { sku: 'SUP-SEC-BR', cor: 'Branco' }] },
  { nome: 'Suporte de Celular',       skus: [{ sku: 'SUP-CELULAR-PT', cor: 'Preto' }, { sku: 'SUP-CELULAR-BR', cor: 'Branco' }] },
  { nome: 'Suporte Escova de Dente',  skus: [{ sku: 'SUP-ESCOVA-DENTE-BR', cor: 'Branco' }, { sku: 'SUP-ESCOVA-DENTE-PT', cor: 'Preto' }] },
  { nome: 'Suporte Escova Secadora',  skus: [{ sku: 'SUP-ESCOVA-SECADORA-PT', cor: 'Preto' }, { sku: 'SUP-ESCOVA-SECADORA-BR', cor: 'Branco' }] },
  { nome: 'Suporte Duplo',            skus: [{ sku: 'SUP-DUALSENSE-BR', cor: 'Branco' }, { sku: 'SUP-DUALSENSE-PT', cor: 'Preto' }] },
  { nome: 'Pensador',                 skus: [{ sku: 'PENSADOR-PT', cor: 'Preto' }, { sku: 'PENSADOR-BR', cor: 'Branco' }] },
  { nome: 'Suporte Big',              skus: [{ sku: 'SUP-BIG-PT', cor: 'Preto' }, { sku: 'SUP-BIG-BR', cor: 'Branco' }] },
  { nome: 'Suporte Slim',             skus: [{ sku: 'SUP-PS5-SLIM-PT', cor: 'Preto' }, { sku: 'SUP-PS5-SLIM-BR', cor: 'Branco' }] },
  { nome: 'Carimbo',                  skus: [{ sku: 'CARIMBO-HEROI', cor: '—' }] },
  { nome: 'Suporte PS5 Fat',          skus: [{ sku: 'SUP-PS5-FAT-BR', cor: 'Branco' }, { sku: 'SUP-PS5-FAT-PT', cor: 'Preto' }] },
  { nome: 'Prendedor de Cortina',     skus: [{ sku: 'SUP-PRENDEDOR-CORTINA-BR', cor: 'Branco' }, { sku: 'SUP-PRENDEDOR-CORTINA-PT', cor: 'Preto' }] },
  { nome: 'Suporte Projetor',         skus: [{ sku: 'SUP-PROJETOR-PT', cor: 'Preto' }, { sku: 'SUP-PROJETOR-BR', cor: 'Branco' }] },
  { nome: 'Suporte Banco Traseiro',   skus: [{ sku: 'SUP-BANCO-TRASEIRO-PT', cor: 'Preto' }, { sku: 'SUP-BANCO-TRASEIRO-BR', cor: 'Branco' }] },
  { nome: 'Suporte Esponja',          skus: [{ sku: 'SUP-ESPONJA-PT', cor: 'Preto' }, { sku: 'SUP-ESPONJA-BR', cor: 'Branco' }] },
];

async function seedProdutosSeVazio() {
  const existentes = await dbGetProdutos();
  if (existentes.length > 0) return;
  const lista = [];
  CATALOG.forEach(cat => {
    cat.skus.forEach(s => lista.push({ sku: s.sku, nome: cat.nome, cor: s.cor, qtd: 0, min: 5 }));
  });
  await dbUpsertProduto(lista);
}
