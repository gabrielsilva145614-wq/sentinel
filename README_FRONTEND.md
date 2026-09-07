# Sentinel 2.1 — Front-end melhorado

Esta versão reorganiza a interface do projeto Sentinel com um fluxo visual mais próximo de plataformas reais de monitoramento e segurança.

## O que foi adicionado no front-end

- Tela de login (`frontend/login.html`)
- Tela de cadastro (`frontend/cadastro.html`)
- Sessão de demonstração usando `localStorage`
- Proteção da página principal: sem sessão, o usuário volta para o login
- Botão para encerrar sessão
- Painel principal redesenhado com sidebar, cabeçalho, métricas, mapa, sensores, eventos e assistente
- Layout responsivo
- Indicador visual de conexão com o back-end
- Contador de eventos recebidos do back-end
- Sincronização dos logs do back-end com o histórico visual
- Eventos de porta, janela, fumaça, gás e reconhecimento facial enviados ao back-end

## Acesso de demonstração

E-mail: `operador@sentinel.com`

Senha: `Sentinel123`

Também é possível criar uma nova conta pela página de cadastro.

## Como executar

### 1. Back-end

No terminal:

```bash
cd backend
npm install
npm start
```

O servidor deve iniciar na porta `3001`.

### 2. Front-end

Abra `frontend/login.html` usando a extensão Live Server do VS Code.

Exemplo de endereço:

`http://127.0.0.1:5500/frontend/login.html`

## Importante sobre o login

O login/cadastro desta versão é uma **demonstração de front-end** para o trabalho acadêmico. Os usuários e a sessão ficam armazenados no navegador (`localStorage`) e não constituem autenticação segura para um sistema real.

Em produção, o correto seria criar rotas de autenticação no back-end, armazenar senhas com hash e utilizar sessão/token seguro.
