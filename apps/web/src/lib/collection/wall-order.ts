import type { WallOrder } from './types.ts';

export const DEFAULT_WALL_ORDER: WallOrder = 'recent';

const ORDER_KEY = 'study-atelier:wall-order';

const FORMER_ERA_ORDER = 'period';

export function isWallOrder(value: unknown): value is WallOrder {
	return value === 'recent' || value === 'year' || value === 'author';
}

export function rememberedWallOrder(): WallOrder {
	try {
		const stored = localStorage.getItem(ORDER_KEY);
		if (stored === FORMER_ERA_ORDER) return 'year';
		return isWallOrder(stored) ? stored : DEFAULT_WALL_ORDER;
	} catch {
		return DEFAULT_WALL_ORDER;
	}
}

export function rememberWallOrder(order: WallOrder): void {
	try {
		if (order === DEFAULT_WALL_ORDER) localStorage.removeItem(ORDER_KEY);
		else localStorage.setItem(ORDER_KEY, order);
	} catch {
		return;
	}
}
