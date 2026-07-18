# Estoque Shopee

App de controle de estoque integrado com NF-e do Upseller.

## Estrutura

```
shopee-estoque/
├── index.html   # estrutura da página
├── style.css    # estilos
├── data.js      # catálogo de SKUs e persistência (localStorage)
└── app.js       # toda a lógica do app
```

## Como usar

1. Abra o app pelo link do Vercel
2. Vá em **Estoque** e defina as quantidades iniciais de cada produto
3. Para registrar vendas: exporte os XMLs de NF-e do Upseller e importe em **Importar XML**
4. O app lê os SKUs automaticamente e deduz as quantidades do estoque

## Deploy no Vercel

1. Faça upload desta pasta como repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) e conecte sua conta GitHub
3. Clique em **Add New Project** → selecione este repositório
4. Clique em **Deploy** — nenhuma configuração extra é necessária
5. O Vercel gera um link público automaticamente

## Adicionar novos SKUs

Edite o array `CATALOG` em `data.js` seguindo o padrão existente:

```js
{ nome: 'Nome do Produto', skus: [
  { sku: 'MEU-SKU-BR', cor: 'Branco' },
  { sku: 'MEU-SKU-PT', cor: 'Preto'  },
]},
```

## Observações

- Os dados de estoque e histórico ficam salvos no `localStorage` do browser
- Para sincronizar entre dispositivos, será necessário adicionar um banco de dados (próxima etapa)
- O sufixo `-BR` no SKU é detectado automaticamente como Branco, `-PT` como Preto
