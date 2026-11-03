import { noteWrite } from '#lib/shared/data/writes/writes.ts';

const CHANNEL = 'study-atelier:data-cache';
const FORGET_AFTER_HIDDEN_MS = 10 * 60 * 1000;

export const cacheKeys = {
	atelier: 'atelier',
	cardIndex: 'card-index',
	categoryValues: 'category-values',
	valueLinks: 'value-links',
	glossary: 'glossary',
	ownFields: 'own-fields',
	eraSummaries: 'era-summaries',
	museums: 'museums'
} as const;

export type CacheKey = (typeof cacheKeys)[keyof typeof cacheKeys];

type ForgetMessage = { keys?: readonly CacheKey[] };

const entries = new Map<string, Promise<unknown>>();
let learner: string | undefined;
let channel: BroadcastChannel | undefined;

export function cached<T extends { error?: unknown }>(
	key: CacheKey | `${CacheKey}:${string}`,
	load: () => Promise<T>
): Promise<T> {
	const entry = `${learner ?? ''}:${key}`;
	const kept = entries.get(entry);
	if (kept) return kept as Promise<T>;
	const loading: Promise<T> = load().then(
		(result) => {
			if (result.error !== undefined) evict(loading);
			return result;
		},
		(error: unknown) => {
			evict(loading);
			throw error;
		}
	);
	entries.set(entry, loading);
	return loading;
}

function evict(loading: Promise<unknown>): void {
	for (const [entry, kept] of entries) if (kept === loading) entries.delete(entry);
}

function keyOf(entry: string): string {
	return entry.slice(entry.indexOf(':') + 1);
}

function forget(keys: readonly CacheKey[] | undefined): void {
	if (keys === undefined) {
		entries.clear();
		return;
	}
	for (const entry of [...entries.keys()]) {
		const key = keyOf(entry);
		if (keys.some((forgotten) => key === forgotten || key.startsWith(`${forgotten}:`))) {
			entries.delete(entry);
		}
	}
}

export function forgetCached(keys?: readonly CacheKey[]): void {
	forget(keys);
	channel?.postMessage({ keys } satisfies ForgetMessage);
	noteWrite();
}

export function cacheForLearner(id: string | undefined): void {
	if (id === learner) return;
	const switched = learner !== undefined;
	learner = id;
	if (switched) {
		entries.clear();
		return;
	}
	for (const [entry, loading] of [...entries]) {
		if (!entry.startsWith(':')) continue;
		entries.delete(entry);
		entries.set(`${id ?? ''}${entry}`, loading);
	}
}

export function watchCache(now: () => number = Date.now): () => void {
	let hiddenAt: number | undefined;
	channel = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(CHANNEL);
	if (channel) {
		channel.onmessage = (event: MessageEvent<unknown>) => {
			const message = event.data;
			forget(
				typeof message === 'object' && message !== null
					? (message as ForgetMessage).keys
					: undefined
			);
			noteWrite();
		};
	}

	const visibility = (): void => {
		if (document.visibilityState === 'hidden') {
			hiddenAt = now();
			return;
		}
		if (hiddenAt !== undefined && now() - hiddenAt > FORGET_AFTER_HIDDEN_MS) entries.clear();
		hiddenAt = undefined;
	};
	document.addEventListener('visibilitychange', visibility);

	return () => {
		document.removeEventListener('visibilitychange', visibility);
		channel?.close();
		channel = undefined;
	};
}
