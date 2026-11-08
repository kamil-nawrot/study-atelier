import { hasNewTier, isHidden, metalOf, reachedTier } from '#lib/career/exhibits/exhibits.ts';
import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import type { Metal } from '#lib/career/types/metal.ts';

const FOLDED_KEY = 'study-atelier:display-case-rooms';
const FILTERS_KEY = 'study-atelier:display-case-filters';

export type Room = { code: string; exhibits: Exhibit[] };

export type CaseFilters = { finished: boolean; locked: boolean };

export function intoRooms(exhibits: readonly Exhibit[]): Room[] {
	const rooms: Room[] = [];
	for (const exhibit of exhibits) {
		const last = rooms.at(-1);
		if (last?.code === exhibit.room) last.exhibits.push(exhibit);
		else rooms.push({ code: exhibit.room, exhibits: [exhibit] });
	}
	return rooms;
}

export function isFinished(exhibit: Exhibit): boolean {
	return reachedTier(exhibit) === exhibit.thresholds.length;
}

export function isLocked(exhibit: Exhibit): boolean {
	return reachedTier(exhibit) === 0;
}

export function isShown(exhibit: Exhibit, filters: CaseFilters): boolean {
	if (!filters.finished && isFinished(exhibit)) return false;
	return filters.locked || !isLocked(exhibit);
}

export function squareOf(exhibit: Exhibit): Metal {
	return isHidden(exhibit) ? 'none' : metalOf(reachedTier(exhibit), exhibit.thresholds.length);
}

export function hasNewInRoom(room: Room): boolean {
	return room.exhibits.some(hasNewTier);
}

export function rememberedFolded(): string[] {
	const stored = readStoredJson('local', FOLDED_KEY);
	return Array.isArray(stored) ? stored.filter((code) => typeof code === 'string') : [];
}

export function rememberFolded(codes: readonly string[]): void {
	writeStored('local', FOLDED_KEY, JSON.stringify(codes));
}

export function rememberedFilters(): CaseFilters {
	const stored = readStoredJson('local', FILTERS_KEY);
	const read = (key: keyof CaseFilters): boolean =>
		typeof stored === 'object' && stored !== null && key in stored
			? (stored as Record<string, unknown>)[key] !== false
			: true;
	return { finished: read('finished'), locked: read('locked') };
}

export function rememberFilters(filters: CaseFilters): void {
	writeStored('local', FILTERS_KEY, JSON.stringify(filters));
}
