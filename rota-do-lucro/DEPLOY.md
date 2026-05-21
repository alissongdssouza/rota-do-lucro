# 🚀 Rota do Lucro v2 — Deploy Gratuito (GitHub Pages)

> Hospedagem 100% gratuita. O app fica online com URL pública,
> funciona como PWA (instalar no celular), e você atualiza
> fazendo upload de arquivo — sem código, sem terminal.

---

## O QUE VOCÊ VAI TER

- URL pública: `https://SEU-USUARIO.github.io/rota-do-lucro/`
- App instalável no celular (PWA) igual a um app nativo
- Atualização automática via `version.json`
- Funciona offline após a primeira visita
- 100% gratuito para sempre

---

## PASSO 1 — Criar conta no GitHub

1. Acesse: https://github.com
2. Clique em **Sign up**
3. Escolha um nome de usuário (ex: `alisson123`)
4. Use seu e-mail e crie uma senha
5. Confirme o e-mail

---

## PASSO 2 — Criar o repositório

1. Após fazer login, clique no **+** no canto superior direito
2. Clique em **New repository**
3. Preencha:
   - **Repository name:** `rota-do-lucro`
   - **Description:** Meu app financeiro pessoal
   - Marque **Public** (obrigatório para GitHub Pages grátis)
   - Marque **Add a README file**
4. Clique em **Create repository**

---

## PASSO 3 — Fazer upload dos arquivos

1. No repositório criado, clique em **Add file → Upload files**
2. Extraia o arquivo `rota-do-lucro-v2.zip` que você baixou
3. **Importante:** você precisa fazer upload da pasta `rota-do-lucro/` 
   com toda a estrutura interna. No GitHub, arraste as pastas assim:

```
Arraste estes itens para o GitHub:
├── index.html
├── manifest.json
├── sw.js
├── version.json
├── css/
│   ├── base.css
│   └── components.css
└── js/
    ├── core.js
    ├── auth.js
    ├── finance.js
    ├── debts.js
    ├── updates.js
    ├── notifications.js
    ├── dashboard.js
    ├── backup.js
    └── ui.js
```

4. Na caixa **Commit changes**, escreva: `Versão inicial`
5. Clique em **Commit changes**

> **Dica:** No GitHub você pode arrastar os arquivos individualmente
> ou criar as pastas clicando em "Create new file" e digitando
> `css/base.css` (o GitHub cria a pasta automaticamente).

---

## PASSO 4 — Ativar o GitHub Pages

1. No seu repositório, clique em **Settings** (⚙️)
2. No menu lateral, clique em **Pages**
3. Em **Branch**, selecione **main** e **/ (root)**
4. Clique em **Save**
5. Aguarde 1-2 minutos
6. Aparecerá a URL: `https://SEU-USUARIO.github.io/rota-do-lucro/`

---

## PASSO 5 — Configurar o sistema de atualização

Agora que o app está online, configure o Live Update:

1. Edite o arquivo `version.json` no GitHub:
   - Clique no arquivo `version.json`
   - Clique no ícone de lápis ✏️ para editar
   - A URL do seu `version.json` é:
     ```
     https://SEU-USUARIO.github.io/rota-do-lucro/version.json
     ```

2. No app (no celular), vá em:
   - **Configurações → Atualizações**
   - Cole a URL: `https://SEU-USUARIO.github.io/rota-do-lucro/version.json`
   - Toque em **Verificar agora**

---

## PASSO 6 — Instalar no celular como PWA

### Android (Chrome)
1. Acesse a URL do app no Chrome
2. Aparecerá um banner: **"Adicionar à tela inicial"**
   - Se não aparecer: menu (⋮) → **Adicionar à tela inicial**
3. Confirme — o app aparece na tela como ícone nativo

### iOS (Safari)
1. Acesse a URL no Safari
2. Toque no botão compartilhar (□↑)
3. Role e toque em **Adicionar à tela de início**
4. Confirme

---

## COMO ATUALIZAR O APP

### Atualização simples (sem forçar)
1. No GitHub, clique em **Add file → Upload files**
2. Faça upload dos arquivos alterados
3. No `version.json`, aumente o `versionCode` (ex: de 200 para 201)
4. Commit — o app notifica os usuários automaticamente

### Atualização obrigatória (força update)
No `version.json`, adicione `"forceUpdate": true`:
```json
{
  "version": "2.1.0",
  "versionCode": 210,
  "forceUpdate": true,
  "url": "https://SEU-USUARIO.github.io/rota-do-lucro/index.html",
  "changelog": "Correção importante de segurança.\nNovos relatórios."
}
```

---

## GERAR APK (opcional)

Com o app hospedado no GitHub Pages, você tem duas opções:

### Opção A — PWA (mais simples, sem loja)
O app instalado via PWA já funciona como nativo no Android.
Sem necessidade de APK.

### Opção B — APK via Capacitor
1. Siga o guia `guia-gerar-apk.md`
2. No `capacitor.config.json`, use a URL do GitHub Pages:
```json
{
  "appId": "com.rotadolucro.app",
  "appName": "Rota do Lucro",
  "server": {
    "url": "https://SEU-USUARIO.github.io/rota-do-lucro/",
    "cleartext": true
  }
}
```
3. Assim o APK sempre carrega a versão mais atual do servidor!

---

## ESTRUTURA DO version.json

```json
{
  "version": "2.0.0",
  "versionCode": 200,
  "forceUpdate": false,
  "url": "https://SEU-USUARIO.github.io/rota-do-lucro/index.html",
  "changelog": "O que há de novo:\n- PIN de segurança\n- Backup automático\n- Metas financeiras\n- Relatórios mensais\n- Filtros e busca"
}
```

| Campo | Descrição |
|-------|-----------|
| `version` | Versão legível (ex: "2.1.0") |
| `versionCode` | Número inteiro, aumenta a cada versão (200, 201, 210...) |
| `forceUpdate` | `true` = bloqueia app e força atualização |
| `url` | URL do novo `index.html` |
| `changelog` | Novidades mostradas ao usuário |

---

## SOLUÇÃO DE PROBLEMAS

**App não abre após instalar como PWA**
→ Limpe o cache do Chrome: Configurações → Apps → Chrome → Armazenamento → Limpar cache

**GitHub Pages não ativou**
→ Aguarde até 5 minutos. Se não funcionar, verifique se o repositório é **Public**

**Arquivos CSS/JS não carregam**
→ Verifique se a estrutura de pastas está correta no GitHub (css/ e js/ na raiz)

**Service Worker desatualizado**
→ No Chrome: DevTools → Application → Service Workers → Unregister, depois recarregue

---

## RESUMO RÁPIDO

```
1. Criar conta GitHub
2. Novo repositório "rota-do-lucro" (público)
3. Upload de todos os arquivos
4. Settings → Pages → main → Save
5. Acessar https://SEU-USUARIO.github.io/rota-do-lucro/
6. Instalar no celular (PWA)
7. Configurar URL do version.json nas configurações do app
```

---

> **Rota do Lucro v2** · Controle · Planeje · Lucre
> Dúvidas em qualquer passo? É só perguntar!
