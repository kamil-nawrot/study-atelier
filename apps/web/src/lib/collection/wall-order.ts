import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { WallOrder } from './types.ts';

export const DEFAULT_WALL_ORDER: WallOrder = 'recent';

const ORDER_KEY = 'study-atelier:wall-order';

const FORMER_ERA_ORDER = 'period';

export function isWallOrder(value: unknown): value is WallOrder {
	return value === 'recent' || value === 'year' || value === 'author';
}

export function rememberedWallOrder(): WallOrder {
	const stored = readStored('local', ORDER_KEY);
	if (stored === FORMER_ERA_ORDER) return 'year';
	return isWallOrder(stored) ? stored : DEFAULT_WALL_ORDER;
}

export function rememberWallOrder(order: WallOrder): void {
	writeStored('local', ORDER_KEY, order === DEFAULT_WALL_ORDER ? null : order);
}
