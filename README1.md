# 📦 Estoque Shopee

> **Status do Projeto:** 🚀 Concluído / Em ambiente de produção

Um aplicativo web interativo focado no controle de estoque simplificado, integrado nativamente com a leitura de NF-e (XML) exportadas do **Upseller**. Ideal para quem precisa gerenciar saídas de forma automatizada e rápida.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando a stack clássica da web, sem frameworks pesados, garantindo leveza e excelente desempenho:

*   **HTML5:** Estruturação semântica da página.
*   **CSS3:** Estilização moderna e layout responsivo.
*   **JavaScript (ES6+):** Manipulação da DOM, persistência de dados e lógica de parsing dos arquivos XML.

---

## 📂 Estrutura do Projeto

A arquitetura do código foi desenhada de forma modular para facilitar o entendimento de estudantes e novos desenvolvedores:

```text
shopee-estoque/
├── index.html   # Estrutura e marcação da página web
├── style.css    # Identidade visual e estilização das telas
├── data.js      # Catálogo estático de SKUs e gerenciamento do localStorage
└── app.js       # Core técnico: lógica de negócios e importação de XML
```

---

## 🚀 Como Usar o Sistema

Siga o fluxo abaixo para operar o ecossistema do app:

1. **Acesse o Sistema:** Abra o aplicativo através do link público gerado no seu deploy da Vercel.
2. **Configuração Inicial:** Vá até a aba **Estoque** e defina as quantidades iniciais disponíveis para cada produto do seu catálogo.
3. **Fluxo de Vendas:** No painel do *Upseller*, exporte os arquivos XML das suas Notas Fiscais Eletrônicas (NF-e).
4. **Baixa Automática:** Acesse a aba **Importar XML** no app e faça o upload dos arquivos. O sistema fará a leitura dos SKUs dinamicamente e deduzirá o saldo do seu estoque na hora.

---

## ⚙️ Adicionar Novos SKUs (Guia do Desenvolvedor)

O catálogo é centralizado. Para adicionar novos produtos ou novos SKUs, basta abrir o arquivo `data.js` e atualizar o array `CATALOG` mantendo a estrutura de objetos JavaScript:

```javascript
{ 
  nome: 'Nome do Produto', 
  skus: [
    { sku: 'MEU-SKU-BR', cor: 'Branco' },
    { sku: 'MEU-SKU-PT', cor: 'Preto'  }
  ]
}
```

> 💡 **Nota de Desenvolvimento:** O motor do `app.js` possui uma regra que detecta automaticamente as cores finais baseadas no sufixo do SKU (ex: finais `-BR` são mapeados como *Branco* e `-PT` como *Preto*).

---

## 🌐 Deploy na Vercel (Hospedagem)

Para colocar a aplicação online e gerar um link público utilizando a Vercel, o processo é direto:

1. Certifique-se de que esta pasta já foi enviada para um repositório no seu **GitHub**.
2. Acesse o painel em [vercel.com](https://vercel.com) e conecte a sua conta do GitHub.
3. Clique em **Add New Project** e selecione o repositório `shopee-estoque`.
4. Clique no botão **Deploy**. *Não é necessário configurar nenhuma variável de ambiente ou comando de build.*
5. Pronto! A Vercel fornecerá um domínio público e seguro (`https`) automaticamente.

---

## 📝 Observações Técnicas Importantes

* **Persistência Local:** Os dados atuais de estoque e o histórico de movimentações ficam armazenados diretamente no `localStorage` do navegador do usuário.
* **Limitação:** Como os dados ficam salvos localmente no browser, eles não são compartilhados entre múltiplos dispositivos (computadores ou celulares diferentes).
* **Próximos Passos:** Para permitir a sincronização multi-dispositivo em tempo real, a próxima etapa planejada para o projeto envolve a integração com um banco de dados em nuvem (Database Cloud).
