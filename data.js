// Catálogo de produtos — edite aqui para adicionar ou alterar produtos
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

// Inicializa lista de produtos a partir do catálogo
function initProdutos() {
  const saved = localStorage.getItem('shopee_produtos');
  if (saved) return JSON.parse(saved);
  const lista = [];
  CATALOG.forEach(cat => {
    cat.skus.forEach(s => {
      lista.push({ sku: s.sku, nome: cat.nome, cor: s.cor, qtd: 0, min: 5 });
    });
  });
  return lista;
}

function initHistorico() {
  const saved = localStorage.getItem('shopee_historico');
  return saved ? JSON.parse(saved) : [];
}

function salvarProdutos(lista) {
  localStorage.setItem('shopee_produtos', JSON.stringify(lista));
}

function salvarHistorico(lista) {
  localStorage.setItem('shopee_historico', JSON.stringify(lista));
}
