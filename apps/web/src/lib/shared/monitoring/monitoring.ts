import * as Sentry from '@sentry/svelte';
import { asError, scrubBreadcrumb, scrubEvent } from '#lib/shared/monitoring/scrub.ts';

type MonitoringOptions = {
	dsn: string | undefined;
	environment: string | undefined;
	release: string;
};

let started = false;

export function startMonitoring({ dsn, environment, release }: MonitoringOptions): void {
	if (!dsn || started) return;
	started = true;
	Sentry.init({
		dsn,
		environment,
		release,
		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false
		},
		tracesSampleRate: 0,
		maxBreadcrumbs: 30,
		beforeBreadcrumb: scrubBreadcrumb,
		beforeSend: scrubEvent
	});
}

export function identifyLearner(id: string | undefined): void {
	if (started) Sentry.setUser(id ? { id } : null);
}

export function reportError(error: unknown): void {
	if (started) Sentry.captureException(asError(error));
}
