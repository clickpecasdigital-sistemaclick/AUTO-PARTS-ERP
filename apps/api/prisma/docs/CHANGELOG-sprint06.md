# Alterações de schema — Sprint 06 (Módulo de Estoque Enterprise)

Aditivas, sem remoção de nenhum campo/tabela existente. 5 modelos novos,
1 enum novo de topo, extensões em 6 modelos existentes.

## Novos modelos
- **`Street`** — nível "Rua" inserido entre `Aisle` (Corredor) e `Shelf`
  (Prateleira), completando a hierarquia WMS de 8 níveis do briefing
  (Empresa → Filial → Depósito → Corredor → Rua → Prateleira → Nível → Posição).
- **`StockByLocation`** — saldo por posição física exata (granularidade
  abaixo de `Stock`, que continua por Depósito).
- **`ProductBatch`** (Lote) e **`ProductSerial`** (Série/IMEI/Patrimônio) —
  estrutura preparada, sem saldo granular por lote/série nesta sprint.
- **`StockReservation`** — reserva de estoque com `sourceType`/`sourceId`
  genéricos, pronta para Pedidos/Orçamentos/OS/Compras (Sprint 07+).

## Extensões
- **`Company.costingMethod`** (`CostingMethod`: fifo/lifo/average/last_cost).
- **`StorageLocation`**: `level`, `position`, `fullAddress` (antes só `code`); agora referenciado por `shelfId` em vez de relação direta com `Aisle`.
- **`StockMovementType`**: + `loss_out`, `breakage_out`, `internal_consumption_out`, `bonus_in`.
- **`StockMovement`**: `locationId`, `batchId`, `serialId`, `totalValue`, `reason`, `ipAddress` — auditoria completa (quem/quando/IP/motivo/valor) em uma única linha.
- **`Inventory`**: `type` (`InventoryType`: general/cycle/by_location/by_group/by_manufacturer), `isBlind`, `parentInventoryId` (recontagem), `groupId`/`manufacturerId`/`locationId`.
- **`InventoryItem`**: `recountedQuantity`.
- **`StockTransfer`**: `reason`. **`StockTransferItem`**: `originLocationId`/`destinationLocationId` (transferência no nível de posição WMS).

Migration a ser gerada via `prisma migrate dev --name sprint06_inventory_enterprise` em ambiente com acesso ao banco.
