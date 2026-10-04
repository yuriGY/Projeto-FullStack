# ValidaFone - Central de Validação de Contatos

Projeto 1 da disciplina **Programação Web Fullstack**. SPA em React.js que consome a API JSON pública
[Numverify](https://numverify.com) para validar números de telefone e enriquecê-los com operadora, tipo
de linha, país e localidade.

Toda a aplicação vive em uma única página HTML, sem redirecionamento entre telas.

---

## Como executar

### 1. Pré-requisitos

- **Node.js 20 ou superior** (testado na 22.14). Confira com `node --version`.
  Se não tiver, baixe em [nodejs.org](https://nodejs.org).
- **Git**, para clonar o repositório.

### 2. Clonar o repositório

```bash
git clone https://github.com/yuriGY/Projeto-FullStack.git
cd Projeto-FullStack
```

### 3. Instalar as dependências

As dependências ficam dentro de `frontend/`, **não na raiz**. Entre na pasta antes de instalar:

```bash
cd frontend
npm install
```

A instalação baixa cerca de 260 pacotes e leva menos de um minuto.

### 4. Configurar a chave da API

A aplicação **não funciona sem uma chave** da Numverify. Crie o arquivo de configuração local copiando
o modelo:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# Linux / macOS
cp .env.example .env.local
```

Abra o `frontend/.env.local` e confirme que a linha `VITE_NUMVERIFY_KEY` tem um valor:

```
VITE_NUMVERIFY_KEY=sua_chave_aqui
VITE_QUOTA_LIMIT=100
```

- Se a chave **já vier preenchida**, está tudo certo.
- Se vier **vazia** crie uma sua gratuitamente em
  [numverify.com/product](https://numverify.com/product) (plano Free, 100 consultas/mês).

> `.env.local` nunca vai para o Git, o `.gitignore` cobre `*.local`. Cada pessoa configura o seu.

### 5. Rodar

```bash
npm run dev
```

Abra **http://localhost:5173** no navegador.

### 6. Usar

1. Escolha o país no seletor (ou digite o número no formato internacional, começando com `+`).
2. Digite o número, máscaras como `(11) 98765-4321` funcionam, os caracteres extras são ignorados.
3. Clique em **Validar**.

O resultado aparece no cartão abaixo do formulário, com validade, formato internacional, país,
localidade, operadora e tipo de linha. O histórico fica salvo no navegador e sobrevive a um recarregamento.

**O que mais a aplicação faz:**

| Recurso | Onde |
|---|---|
| **Validar em lote** | Botão no formulário. Cole uma lista de números; a tela informa quantas consultas o lote vai gastar antes de disparar |
| **Filtrar e buscar** | Aba Histórico. Busca por número, operadora, país ou localidade, mais filtros por situação, país, operadora e tipo de linha |
| **Ordenar** | Clique no cabeçalho de qualquer coluna da tabela |
| **Ver detalhes** | Clique em qualquer linha da tabela; o painel lateral abre com todos os campos (fecha com `Esc`) |
| **Revalidar / remover** | Ícones à direita de cada linha. Revalidar ignora o cache e gasta 1 consulta |
| **Análise** | Aba Análise. Indicadores e distribuições por país, operadora e tipo de linha. Respeita os filtros ativos na aba Histórico |
| **Exportar CSV** | Botão na aba Histórico. Exporta a lista **filtrada no momento**, pronta para abrir no Excel |
| **Tema claro/escuro** | Ícone no canto superior direito; a escolha fica salva |

---

## ⚠️ Três avisos importantes

**1. Só funciona em `http://localhost`.**
O plano gratuito da Numverify não aceita HTTPS. Se a página for servida por `https`, o navegador bloqueia
a chamada por *mixed content* e nada funciona. Por isso a aplicação é apresentada pelo servidor de
desenvolvimento, e **não deve ser publicada** em Vercel, Netlify ou GitHub Pages.

**2. Cada número novo gasta 1 das 100 consultas do mês.**
A cota é mensal e compartilhada por quem usa a mesma chave, e o contador no topo da tela mostra o saldo.
**Teste com parcimônia.** Três coisas *não* consomem cota: repetir um número já consultado (resolve pelo
cache, e a linha é marcada como "em cache"), entradas inválidas (vazia, curta demais, acima de 15 dígitos),
e o botão de revalidar é a única ação que força uma consulta nova de propósito.

**3. Não publique o conteúdo de `dist/`.**
Variáveis `VITE_*` são embutidas no código gerado, ou seja, a chave fica legível para qualquer pessoa que
abra a aplicação publicada.

---

## Scripts disponíveis

Todos são executados de dentro de `frontend/`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento em http://localhost:5173 |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run lint` | Verifica o código com ESLint |
| `npm run preview` | Serve localmente o resultado do `build` |

---

## Se algo der errado

| O que aparece na tela | Causa e solução |
|---|---|
| "Nenhuma chave configurada" | Falta o `.env.local` ou a chave está vazia. Volte ao passo 4 e **reinicie o servidor**, o Vite só lê os arquivos `.env` ao iniciar |
| "Chave de acesso inválida" (101) | A chave está errada ou a conta na apilayer ainda não foi ativada |
| "Cota mensal esgotada" (104) | As 100 consultas do mês acabaram. Use outra chave ou aguarde a virada do mês |
| "O plano gratuito não permite HTTPS" (105) | A página foi aberta por `https`. Use `http://localhost:5173` |
| "Não foi possível alcançar a API" | Sem internet, ou a apilayer está fora do ar |
| "A API demorou demais para responder" | Timeout de 10 segundos. Tente novamente |
| Porta 5173 ocupada | O Vite sobe em outra porta e informa no terminal. Use a porta que ele indicar |
| Erro no `npm install` | Apague `node_modules` e `package-lock.json` e rode `npm install` de novo |

Para **apagar o histórico** salvo no navegador: abra o DevTools (F12) → Console → execute
`localStorage.removeItem('validafone:state:v1')` → recarregue a página.

---

## Estrutura do projeto

```
frontend/src/
  services/     Comunicação com a API, normalização e validação local
  state/        Reducer, contextos e persistência (fonte única de verdade)
  hooks/        Orquestração das consultas
  components/   Layout, formulário e exibição do resultado
```

Nenhum componente guarda cópia do histórico: tudo é derivado do estado central em
`state/validationReducer.js`. É isso que mantém as áreas da aplicação integradas.

---

## Divisão da equipe

| Parte | Escopo | Situação |
|---|---|---|
| 1 | Fundação, cliente HTTP, estado central, formulário e resultado | ✔ concluída |
| 2 | Histórico em tabela, filtros, busca, cache de cota e validação em lote | ✔ concluída |
| 3 | Painel analítico, detalhamento, exportação CSV e documentação | ✔ concluída |

---

## Stack

Vite 6 · React 19 · MUI 9 (Material UI) · `fetch` nativo com `AbortController` · `localStorage`

Hooks e funcionalidades do React utilizados: `useReducer`, `useRef`, `forwardRef` (Parte 1);
`useMemo`, `memo` (Parte 2); `lazy`, `createPortal` (Parte 3).
