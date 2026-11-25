import { KNOWN_CLASS_GROUPS } from '#lib/images/art-classes/art-classes.ts';
import type { ClassGroup } from '#lib/images/types/class-group.ts';
import { fetchClassGroups } from '#lib/images/wikidata/wikidata.ts';

const CLASS_BATCH = 30;

const resolved = new Map<string, ClassGroup | null>(KNOWN_CLASS_GROUPS);

function batches(ids: string[]): string[][] {
	return Array.from({ length: Math.ceil(ids.length / CLASS_BATCH) }, (_, index) =>
		ids.slice(index * CLASS_BATCH, (index + 1) * CLASS_BATCH)
	);
}

export async function resolveClassGroups(
	classIds: string[]
): Promise<ReadonlyMap<string, ClassGroup | null>> {
	const unknown = [...new Set(classIds)].filter((id) => !resolved.has(id));
	await Promise.all(
		batches(unknown).map(async (batch) => {
			const found = await fetchClassGroups(batch).catch(() => null);
			for (const [id, group] of found ?? []) resolved.set(id, group);
		})
	);
	return resolved;
}

export function forgetClassGroups(): void {
	resolved.clear();
	for (const [id, group] of KNOWN_CLASS_GROUPS) resolved.set(id, group);
}
