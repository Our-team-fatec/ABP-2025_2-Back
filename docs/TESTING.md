# Pipeline de CI/CD e Testes

Este documento explica como usar o pipeline de CI/CD e os testes de integração implementados no projeto.

## Arquivos Criados

### 1. `docker-compose.test.yml`

Arquivo para configuração do ambiente de teste com MongoDB.

### 2. `__tests__/integration.test.ts`

Testes de integração que verificam:

- Conectividade com o banco de dados
- Funcionalidade da API
- Saúde dos endpoints
- Operações CRUD básicas

### 3. `.github/workflows/ci.yml`

Pipeline de CI/CD com 4 jobs:

- **code-quality**: Análise de qualidade do código (ESLint)
- **tests**: Execução de testes unitários e de integração
- **build**: Build da aplicação TypeScript
- **docker-build**: Build e teste da imagem Docker

### 4. `.env.test`

Variáveis de ambiente específicas para testes.

## Como Usar

### Executar Testes Localmente

1. **Iniciar serviços de teste:**

```bash
docker-compose -f docker-compose.test.yml up -d
```

2. **Executar testes unitários:**

```bash
npm run test:unit
```

3. **Executar testes de integração:**

```bash
TEST_MONGODB_URI=mongodb://test:test123@localhost:27018/test_db?authSource=admin npm run test:integration
```

4. **Executar todos os testes:**

```bash
npm run test:ci
```

5. **Parar serviços de teste:**

```bash
docker-compose -f docker-compose.test.yml down
```

### Scripts Disponíveis

- `npm run test:unit` - Executa apenas testes unitários
- `npm run test:integration` - Executa apenas testes de integração
- `npm run test:ci` - Executa todos os testes com coverage
- `npm run lint` - Verifica qualidade do código
- `npm run lint:fix` - Corrige problemas de formatação automaticamente
- `npm run build` - Compila o projeto TypeScript

### Pipeline CI/CD

O pipeline é executado automaticamente quando:

- Há push para as branches `main` ou `develop`
- Há pull request para a branch `main`

#### Fluxo do Pipeline:

1. **Análise de Qualidade** (`code-quality`)
   - Instala dependências
   - Executa ESLint para verificar qualidade do código

2. **Testes** (`tests`)
   - Inicializa MongoDB de teste
   - Executa testes unitários
   - Executa testes de integração
   - Para serviços de teste

3. **Build** (`build`)
   - Compila aplicação TypeScript
   - Verifica se arquivos foram gerados corretamente

4. **Docker Build** (`docker-build`)
   - Cria imagem Docker
   - Testa se a imagem funciona corretamente

## Configuração do Banco de Testes

O MongoDB de teste roda na porta `27018` para não conflitar com instâncias locais.

**Credenciais de teste:**

- Usuário: `test`
- Senha: `test123`
- Database: `test_db`
- URI: `mongodb://test:test123@localhost:27018/test_db?authSource=admin`

## Estrutura dos Testes

### Testes de Integração

Os testes de integração verificam:

- Conectividade com MongoDB
- Funcionamento dos endpoints da API
- Operações de criação e busca no banco
- Configuração do ambiente de teste

### Cobertura de Código

O pipeline gera relatórios de cobertura automaticamente. Para ver localmente:

```bash
npm run test:ci
```

## Troubleshooting

### Erro: Container já em uso

Se houver conflito com containers existentes:

```bash
docker rm -f mongodb-test
docker-compose -f docker-compose.test.yml down --remove-orphans
```

### Erro: Porta já em uso

Verifique se não há outros serviços MongoDB rodando na porta 27018:

```bash
lsof -i :27018
```

### Erro: MongoDB não conecta

Aguarde o container ficar pronto:

```bash
docker exec mongodb-test mongosh --eval "db.adminCommand('ping')" --quiet
```
