import { deleteFlag, deleteItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import { flagCount } from '#lib/backroom/flag-count/flag-count.svelte.ts';
import type { FixEntry } from '#lib/backroom/types/fix-entry.ts';
import type { FixStep } from '#lib/backroom/types/fix-step.ts';
import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';

const KEY = 'study-atelier:backroom-fix';

type Stored = {
	entries: FixEntry[];
	position: number;
	fixed: number;
	queue: boolean;
};

function isStored(value: unknown): value is Stored {
	if (typeof value !== 'object' || value === null) return false;
	const stored = value as Partial<Stored>;
	return (
		Array.isArray(stored.entries) &&
		typeof stored.position === 'number' &&
		typeof stored.fixed === 'number' &&
		typeof stored.queue === 'boolean'
	);
}

export class FixSession {
	#stored = $state<Stored>();

	constructor() {
		const read = readStoredJson('session', KEY);
		this.#stored = isStored(read) ? read : undefined;
	}

	start(entries: readonly FixEntry[], position: number, queue: boolean): string | undefined {
		const entry = entries[position];
		if (!entry) return undefined;
		this.#save({ entries: [...entries], position, fixed: 0, queue });
		return entry.path;
	}

	entryFor(path: string): FixEntry | undefined {
		const stored = this.#stored;
		const entry = stored?.entries[stored.position];
		return entry?.path === path ? entry : undefined;
	}

	progressFor(path: string): { position: number; total: number } | undefined {
		const stored = this.#stored;
		if (!stored?.queue || !this.entryFor(path)) return undefined;
		return { position: stored.position + 1, total: stored.entries.length };
	}

	async saved(path: string): Promise<FixStep | undefined> {
		const entry = this.entryFor(path);
		const stored = this.#stored;
		if (!entry || !stored) return undefined;
		const results = entry.target
			? [await deleteItemFlags(entry.target)]
			: await Promise.all((entry.flagIds ?? []).map((id) => deleteFlag(id)));
		if (results.some((result) => result.error)) return undefined;
		if (results.length > 0) void flagCount.refresh();
		this.#save({ ...stored, fixed: stored.fixed + 1 });
		return this.#advance();
	}

	nextStep(path: string): FixStep | undefined {
		const stored = this.#stored;
		if (!stored || !this.entryFor(path)) return undefined;
		const next = stored.entries[stored.position + 1];
		return stored.queue && next
			? { path: next.path }
			: { done: true, fixed: stored.fixed, queue: stored.queue };
	}

	skip(path: string): FixStep | undefined {
		return this.entryFor(path) ? this.#advance() : undefined;
	}

	leave(path: string): void {
		const stored = this.#stored;
		if (!stored) return;
		const here = stored.entries[stored.position]?.path;
		const next = stored.queue ? stored.entries[stored.position + 1]?.path : undefined;
		if (path !== here && path !== next) this.clear();
	}

	clear(): void {
		this.#save(undefined);
	}

	#advance(): FixStep {
		const stored = this.#stored as Stored;
		const next = stored.position + 1;
		if (stored.queue && next < stored.entries.length) {
			this.#save({ ...stored, position: next });
			return { path: stored.entries[next].path };
		}
		this.clear();
		return { done: true, fixed: stored.fixed, queue: stored.queue };
	}

	#save(stored: Stored | undefined): void {
		this.#stored = stored;
		writeStored('session', KEY, stored ? JSON.stringify(stored) : null);
	}
}

export const fixSession = new FixSession();
