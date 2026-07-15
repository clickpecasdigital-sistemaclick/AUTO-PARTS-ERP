import type { StockMovementType } from '../types/inventory.types';

/** Espelha `REASON_REQUIRED_TYPES` do backend (`dto/stock-movement.dto.ts`) — validação client-side antecipa o erro 400 da API. */
export const REASON_REQUIRED_MOVEMENT_TYPES: StockMovementType[] = [
  'loss_out',
  'breakage_out',
  'adjustment_in',
  'adjustment_out',
  'internal_consumption_out',
];
