export type WallOrder = 'recent' | 'period';

export const DEFAULT_WALL_ORDER: WallOrder = 'recent';

const ORDER_KEY = 'study-atelier:wall-order';

export function isWallOrder(value: unknown): value is WallOrder {
	return value === 'recent' || value === 'period';
}

export function rememberedWallOrder(): WallOrder {
	try {
		const stored = localStorage.getItem(ORDER_KEY);
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
