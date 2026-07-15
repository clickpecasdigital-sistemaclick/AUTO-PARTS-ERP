# AutoCore ERP — Plano de Disaster Recovery (Sprint 14)

## Objetivos de Recuperação

| Métrica | Meta | Descrição |
|---|---|---|
| **RPO** (Recovery Point Objective) | < 1 hora | Máximo de dados perdidos em caso de falha |
| **RTO** (Recovery Time Objective) | < 4 horas | Tempo máximo para restaurar operação |
| **MTTR** (Mean Time to Recover) | < 2 horas | Tempo médio histórico de recuperação |

Ambos os valores são configuráveis via variáveis de ambiente
(`BACKUP_SCHEDULE_INCREMENTAL` para RPO, procedimentos documentados
abaixo para RTO).

---

## Classificação de Incidentes

| Nível | Descrição | Exemplo | RTO alvo |
|---|---|---|---|
| P0 — Crítico | Serviço 100% indisponível | Banco inacessível, API down | < 1h |
| P1 — Alto | Funcionalidade crítica indisponível | PDV, NF-e, Financeiro | < 2h |
| P2 — Médio | Degradação de performance | BI lento, cache miss | < 8h |
| P3 — Baixo | Funcionalidade não-crítica | Relatórios, exportações | < 24h |

---

## Procedimento P0 — Banco de Dados Inacessível

```
1. DETECTAR (< 5 min)
   - Alerta automático: /health/liveness retorna 503
   - Monitor verifica a cada 30s

2. DIAGNOSTICAR (< 10 min)
   - curl https://api.dominio.com/health
   - Verificar painel Supabase → Project → Database
   - Verificar logs: docker logs autocore-api --tail 100

3. RECUPERAR — Opção A: Supabase Recovery (< 30 min)
   - Acessar painel Supabase → Database → Backups
   - Selecionar point-in-time mais próximo
   - Confirmar restauração (painel executa automaticamente)
   - Validar: curl https://api.dominio.com/health → status: ok

4. RECUPERAR — Opção B: Backup Local (< 4h)
   - Baixar último backup válido do Supabase Storage:
     GET /storage/v1/object/backups/full/[timestamp].enc
   - Descriptografar: node scripts/decrypt-backup.js [file]
   - Restaurar: psql $DATABASE_URL < backup.sql
   - Executar migrations: npx prisma migrate deploy
   - Reiniciar API: docker compose restart api
   - Validar: curl https://api.dominio.com/health

5. PÓS-INCIDENTE (< 24h)
   - Documentar causa raiz (5 Whys)
   - Atualizar runbook
   - Verificar dados perdidos (gap entre RPO e momento da falha)
   - Comunicar clientes afetados (LGPD + contratual)
```

---

## Procedimento P1 — API Indisponível (sem falha de banco)

```
1. Verificar health: curl https://api.dominio.com/health/liveness
2. Verificar logs: docker logs autocore-api --tail 200
3. Reiniciar container: docker compose restart api
4. Se persistir: docker compose pull api && docker compose up -d api
5. Rollback: docker compose up -d --image autocore-api:[versão-anterior]
```

---

## Procedimento — Falha de Storage (Supabase)

```
1. Verificar: curl https://[project].supabase.co/storage/v1/bucket
2. Certificados fiscais: NF-e continua funcionando (cert em memória)
3. Backups: redirecionar para storage alternativo (S3/GCS)
   - Setar BACKUP_STORAGE_URL=s3://bucket-alternativo
   - Reiniciar worker: docker compose restart worker
4. Uploads: desabilitar temporariamente na interface
```

---

## Failover — Múltiplas Regiões (Escalabilidade Futura)

```
Arquitetura atual:  Single-region (Supabase sa-east-1)
Próximo passo:      Read replica em segunda região
Failover manual:    Atualizar DATABASE_URL + DIRECT_URL para réplica
                    Reiniciar API: docker compose restart api
                    DNS switch: < 5 min TTL em produção
```

---

## Scripts de Recuperação

### Validar integridade do backup
```bash
node -e "
  const crypto = require('crypto');
  const fs = require('fs');
  const file = process.argv[1];
  const data = fs.readFileSync(file);
  const checksum = crypto.createHash('sha256').update(data).digest('hex');
  console.log('SHA-256:', checksum);
" backup.enc
```

### Testar conexão com banco
```bash
curl -X POST https://api.dominio.com/health \
  -H "Content-Type: application/json" | jq .services.database
```

### Forçar backup manual
```bash
curl -X POST https://api.dominio.com/backup/run \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

---

## Contatos de Emergência

| Papel | Contato | Disponibilidade |
|---|---|---|
| Tech Lead | [email] | 24/7 para P0/P1 |
| DBA | [email] | 24/7 para P0 |
| DevOps | [email] | 24/7 para P0/P1 |
| Supabase Support | support@supabase.com | Conforme plano contratado |

---

## Teste do Plano de DR

Executar simulação completa a cada **3 meses**:
1. Restaurar backup full em ambiente de homologação
2. Validar todas as rotas críticas (PDV, NF-e, Financeiro)
3. Documentar tempo de recuperação real vs RTO meta
4. Atualizar este documento se necessário
