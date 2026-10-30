import { noteWrite } from '#lib/shared/data/writes/writes.ts';

const CHANNEL = 'study-atelier:data-cache';
const FORGET_AFTER_HIDDEN_MS = 10 * 60 * 1000;

const entries = new Map<string, Promise<unknown>>();
let learner: string | undefined;
let channel: BroadcastChannel | undefined;

export function cached<T extends { error?: unknown }>(
	key: string,
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

export function forgetCached(): void {
	entries.clear();
	channel?.postMessage('forget');
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
		channel.onmessage = () => {
			entries.clear();
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
