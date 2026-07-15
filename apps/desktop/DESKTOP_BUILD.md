# AutoCore ERP — Como Gerar o Instalador Windows

## O que será gerado

```
apps/desktop/dist-electron/
├── AutoCore-ERP-Setup-1.0.0.exe      ← instalador principal (NSIS)
├── AutoCore-ERP-1.0.0.msi             ← instalador MSI (empresas/GPO)
├── AutoCore-ERP-1.0.0-portable.exe   ← versão portátil (sem instalar)
└── latest.yml                         ← metadados para auto-update
```

---

## Pré-requisitos

- **Windows** (necessário para compilar o instalador .exe)
- Node.js 20+
- npm 10+

---

## Passo a Passo

### 1. Preparar o ícone (obrigatório)

Coloque em `apps/desktop/assets/`:
- `icon.ico` — 256x256px (ícone do app Windows)
- `icon.png` — 512x512px (ícone genérico)
- `tray-icon.png` — 32x32px (ícone da bandeja do sistema)

> Converter PNG para ICO: https://cloudconvert.com/png-to-ico

### 2. Instalar dependências

```bash
cd apps/desktop
npm install
```

### 3. Build do frontend e API

```bash
# Na raiz do projeto:
cd apps/web && npm run build
cd ../api && npm run build
```

### 4. Gerar o instalador

```bash
cd apps/desktop

# Gerar TODOS os formatos (exe + msi + portable):
npm run dist:win

# Apenas .exe 64-bit (mais comum):
npm run dist:win -- --win nsis --x64

# Apenas portátil:
npm run dist:portable
```

### 5. Resultado

O instalador estará em: `apps/desktop/dist-electron/`

---

## O que o instalador faz

Quando o usuário executa `AutoCore-ERP-Setup-1.0.0.exe`:

1. **Tela de boas-vindas** com logo do AutoCore ERP
2. **Aceitar licença** (arquivo `assets/license.txt`)
3. **Escolher pasta** (padrão: `C:\Program Files\AutoCore ERP`)
4. **Instalação** com barra de progresso
5. **Finalização** com opção de abrir o programa
6. Cria atalho na **Área de Trabalho** e no **Menu Iniciar**
7. Adiciona ao **Adicionar/Remover Programas**
8. Cria regra no **Firewall** para a porta 3333

---

## Estrutura do instalador NSIS

```
C:\Program Files\AutoCore ERP\
├── AutoCore ERP.exe         ← executável principal (Electron)
├── resources/
│   ├── app.asar             ← código do app empacotado
│   ├── api/                 ← servidor NestJS embutido
│   │   ├── main.js
│   │   ├── node_modules/
│   │   └── prisma/
│   └── web/                 ← frontend React buildado
│       ├── index.html
│       └── assets/
├── Uninstall AutoCore ERP.exe
└── LICENSE.txt
```

---

## Banco de Dados na versão Desktop

Por padrão, a versão desktop usa **SQLite local** (sem internet necessária):
```
C:\Users\[usuario]\AppData\Roaming\AutoCore ERP\autocore.db
```

Para usar **Supabase** (nuvem), configurar nas Configurações → Banco de Dados.

---

## Assinatura de Código (opcional mas recomendado)

Sem assinatura, o Windows exibe aviso "Publicador desconhecido". Para assinar:

```bash
# 1. Adquirir certificado EV Code Signing (~$400/ano)
#    Fornecedores: DigiCert, Sectigo, GlobalSign

# 2. Configurar no package.json:
# "win": {
#   "certificateFile": "certificado.pfx",
#   "certificatePassword": "senha",
#   "signingHashAlgorithms": ["sha256"]
# }

# 3. Ou via variáveis de ambiente:
set WIN_CSC_LINK=caminho\para\certificado.pfx
set WIN_CSC_KEY_PASSWORD=sua-senha
npm run dist:win
```

---

## Auto-Update (GitHub Releases)

O app verifica atualizações automaticamente via GitHub Releases:

1. Configure `publish.provider = "github"` no `package.json`
2. Crie um release no GitHub com os arquivos gerados
3. O app verifica a cada inicialização

---

## Distribuição

Opções para distribuir para clientes:

| Opção | Como |
|---|---|
| Download direto | Hospedar o .exe no site |
| E-mail | Enviar o .exe por email |
| Servidor interno | Pasta de rede |
| Loja | Microsoft Store (requer conta de desenvolvedor $19) |
| Software Center | SCCM/Intune com o .msi |
