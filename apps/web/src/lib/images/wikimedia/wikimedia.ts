export const API_USER_AGENT = 'study-atelier (https://github.com/kamil-nawrot/study-atelier)';

const MAX_RETRY_SECONDS = 5;
const TIMEOUT_SECONDS = 10;
export const SPARQL_TIMEOUT_SECONDS = 15;
export const SEARCH_DEADLINE_SECONDS = 20;
const GATEWAY_TIMEOUT = 504;

export class WikimediaError extends Error {
	readonly status: number | null;

	constructor(status: number | null) {
		super(status === null ? 'Wikimedia did not answer' : `Wikimedia answered ${status}`);
		this.status = status;
	}
}

function isTimeout(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'TimeoutError';
}

function retryDelaySeconds(response: Response | undefined): number {
	const seconds = Number(response?.headers.get('Retry-After'));
	return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAX_RETRY_SECONDS) : 1;
}

export async function fetchWithRetry(
	url: string,
	headers: Record<string, string> = {},
	timeoutSeconds: number = TIMEOUT_SECONDS
): Promise<Response> {
	const init = (): RequestInit => ({
		headers: { ...headers, 'Api-User-Agent': API_USER_AGENT },
		signal: AbortSignal.timeout(timeoutSeconds * 1000)
	});
	const response = await fetch(url, init()).catch((error: unknown) => {
		if (isTimeout(error)) throw error;
		return undefined;
	});
	if (response && response.status !== 429) return response;
	await new Promise((resolve) => setTimeout(resolve, retryDelaySeconds(response) * 1000));
	return fetch(url, init());
}

export async function fetchJson<T>(
	url: string,
	headers: Record<string, string> = {},
	timeoutSeconds: number = TIMEOUT_SECONDS
): Promise<T> {
	const response = await fetchWithRetry(url, headers, timeoutSeconds).catch((error: unknown) => {
		throw new WikimediaError(isTimeout(error) ? GATEWAY_TIMEOUT : null);
	});
	if (!response.ok) throw new WikimediaError(response.status);
	return response.json();
}

export function withDeadline<T>(
	work: Promise<T>,
	seconds: number = SEARCH_DEADLINE_SECONDS
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new WikimediaError(GATEWAY_TIMEOUT)), seconds * 1000);
	});
	return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}
