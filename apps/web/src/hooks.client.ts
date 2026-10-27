import '@study-atelier/ui/styles.css';
import '#lib/startup/loading-screen/loading-screen.css';
import type { ClientInit, HandleClientError } from '@sveltejs/kit/hooks';
import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '$app/env/public';
import { reportError, startMonitoring } from '#lib/shared/monitoring/monitoring.ts';
import { takeOverLoadingScreen } from '#lib/startup/loading-screen/loading-screen.ts';

export const init: ClientInit = () => {
	startMonitoring({ dsn: SENTRY_DSN, environment: SENTRY_ENVIRONMENT, release: __APP_RELEASE__ });
	takeOverLoadingScreen();
};

export const handleError: HandleClientError = ({ error, kind }) => {
	if (kind === 'unknown') reportError(error);
};
