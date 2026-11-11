import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { OrderItem } from '#lib/review/types/order-item.ts';
import type { SessionRow } from '#lib/review/types/session-row.ts';
import { yearsOf, type Years } from '#lib/review/year-guess/year-guess.ts';

export const ORDER_SIZE = 4;

export type OrderPlace = {
	artwork: WallArtwork;
	right: boolean;
	place: number;
};

function firstYear(artwork: WallArtwork): number {
	return yearsOf(artwork)?.[0] ?? 0;
}

export function chronological(artworks: WallArtwork[]): WallArtwork[] {
	return [...artworks].sort((a, b) => firstYear(a) - firstYear(b));
}

export function moved<T>(values: T[], from: number, to: number): T[] {
	const next = [...values];
	const [value] = next.splice(from, 1);
	next.splice(Math.max(0, Math.min(values.length - 1, to)), 0, value);
	return next;
}

export function tapped(picked: readonly string[], id: string): string[] {
	return picked.includes(id) ? picked.filter((one) => one !== id) : [...picked, id];
}

export function orderPlaces(placed: WallArtwork[]): OrderPlace[] {
	const right = chronological(placed);
	return placed.map((artwork, index) => {
		const place = right.indexOf(artwork);
		return { artwork, right: place === index, place };
	});
}

export function placedRight(placed: WallArtwork[]): number {
	return orderPlaces(placed).filter((entry) => entry.right).length;
}

export function dropIndex(point: number, centres: number[], from: number): number {
	return centres.filter((centre, index) => index !== from && centre < point).length;
}

export function orderBounds(artworks: WallArtwork[]): Years {
	const years = artworks.flatMap((artwork) => yearsOf(artwork) ?? []);
	return [Math.min(...years), Math.max(...years)];
}

export function orderItems(rows: SessionRow[], artworks: Map<string, WallArtwork>): OrderItem[] {
	return rows.flatMap((row): OrderItem[] => {
		if (row.mode !== 'order' || row.artwork_ids.length !== ORDER_SIZE) return [];
		const shown = row.artwork_ids.flatMap((id) => artworks.get(id) ?? []);
		if (shown.length !== ORDER_SIZE || shown.some((artwork) => !yearsOf(artwork))) return [];
		return [{ mode: 'order', artworks: shown }];
	});
}
