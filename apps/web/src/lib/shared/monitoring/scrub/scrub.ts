import type { Breadcrumb, ErrorEvent } from '@sentry/svelte';

const EMAIL = /[^\s@"'<>()]+@[^\s@"'<>()]+\.[a-z]{2,}/gi;
const KEPT_BREADCRUMBS = new Set(['navigation', 'fetch', 'xhr']);

export function withoutQuery(url: string): string {
	const end = url.search(/[?#]/);
	return end === -1 ? url : url.slice(0, end);
}

export function asError(error: unknown): Error {
	if (error instanceof Error) return error;
	const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
	const text = typeof message === 'string' ? message.replace(/"[^"]*"/g, '"…"') : String(error);
	const reported = new Error(text);
	if (typeof code === 'string' && code) reported.name = code;
	return reported;
}

export function withoutEmails(text: string): string {
	return text.replace(EMAIL, '[email]');
}

function scrubData(data: Breadcrumb['data']): Breadcrumb['data'] {
	if (!data) return data;
	const kept: Record<string, unknown> = {};
	for (const key of ['method', 'status_code']) if (key in data) kept[key] = data[key];
	for (const key of ['url', 'from', 'to']) {
		if (typeof data[key] === 'string') kept[key] = withoutQuery(data[key]);
	}
	return kept;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
	if (!breadcrumb.category || !KEPT_BREADCRUMBS.has(breadcrumb.category)) return null;
	return { ...breadcrumb, message: undefined, data: scrubData(breadcrumb.data) };
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
	const id = event.user?.id;
	return {
		...event,
		user: id === undefined ? undefined : { id },
		request: event.request?.url ? { url: withoutQuery(event.request.url) } : undefined,
		message: event.message === undefined ? undefined : withoutEmails(event.message),
		exception: event.exception && {
			...event.exception,
			values: event.exception.values?.map((value) => ({
				...value,
				value: value.value === undefined ? undefined : withoutEmails(value.value)
			}))
		},
		breadcrumbs: event.breadcrumbs
			?.map(scrubBreadcrumb)
			.filter((breadcrumb): breadcrumb is Breadcrumb => breadcrumb !== null),
		extra: undefined
	};
}
