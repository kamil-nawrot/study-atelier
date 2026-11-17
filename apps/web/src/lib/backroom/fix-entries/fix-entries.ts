import type { FixEntry } from '#lib/backroom/types/fix-entry.ts';

export function itemEntries(entries: readonly FixEntry[]): FixEntry[] {
	const byPath = new Map<string, FixEntry>();
	for (const entry of entries) {
		const first = byPath.get(entry.path);
		byPath.set(
			entry.path,
			first
				? {
						...first,
						target: first.target ?? entry.target,
						flagIds: [...(first.flagIds ?? []), ...(entry.flagIds ?? [])]
					}
				: { ...entry }
		);
	}
	return [...byPath.values()];
}

export function fixStart(
	entries: readonly FixEntry[],
	index: number
): { entries: FixEntry[]; position: number } {
	const grouped = itemEntries(entries);
	const path = entries[index]?.path;
	return {
		entries: grouped,
		position: Math.max(
			0,
			grouped.findIndex((entry) => entry.path === path)
		)
	};
}
