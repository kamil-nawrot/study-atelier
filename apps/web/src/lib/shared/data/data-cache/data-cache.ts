const CHANNEL = 'study-atelier:data-cache';
const FORGET_AFTER_HIDDEN_MS = 10 * 60 * 1000;

const entries = new Map<string, Promise<unknown>>();
let learner: string | undefined;
let channel: BroadcastChannel | undefined;

export function cached<T extends { error?: unknown }>(
	key: string,
	load: () => Promise<T>
): Promise<T> {
	const kept = entries.get(key);
	if (kept) return kept as Promise<T>;
	const loading = load().then((result) => {
		if (result.error !== undefined && entries.get(key) === loading) entries.delete(key);
		return result;
	});
	entries.set(key, loading);
	return loading;
}

export function forgetCached(): void {
	entries.clear();
	channel?.postMessage('forget');
}

export function cacheForLearner(id: string | undefined): void {
	if (id === learner) return;
	learner = id;
	entries.clear();
}

export function watchCache(now: () => number = Date.now): () => void {
	let hiddenAt: number | undefined;
	channel = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(CHANNEL);
	if (channel) channel.onmessage = () => entries.clear();

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
