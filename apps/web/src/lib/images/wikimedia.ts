export const API_USER_AGENT = 'study-atelier (https://github.com/kamil-nawrot/study-atelier)';

const MAX_RETRY_SECONDS = 5;

export class WikimediaError extends Error {
	readonly status: number | null;

	constructor(status: number | null) {
		super(status === null ? 'Wikimedia did not answer' : `Wikimedia answered ${status}`);
		this.status = status;
	}
}

function retryDelaySeconds(response: Response | undefined): number {
	const seconds = Number(response?.headers.get('Retry-After'));
	return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAX_RETRY_SECONDS) : 1;
}

export async function fetchWithRetry(
	url: string,
	headers: Record<string, string> = {}
): Promise<Response> {
	const init = { headers: { ...headers, 'Api-User-Agent': API_USER_AGENT } };
	const response = await fetch(url, init).catch(() => undefined);
	if (response && response.status !== 429) return response;
	await new Promise((resolve) => setTimeout(resolve, retryDelaySeconds(response) * 1000));
	return fetch(url, init);
}

export async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
	const response = await fetchWithRetry(url, headers).catch(() => {
		throw new WikimediaError(null);
	});
	if (!response.ok) throw new WikimediaError(response.status);
	return response.json();
}
