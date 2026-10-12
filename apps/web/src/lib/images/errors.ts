import { m } from '#lib/i18n/index.ts';
import { WikimediaError } from './wikimedia.ts';

export function imageSearchErrorMessage(error: unknown): string {
	if (!(error instanceof WikimediaError)) return m.imageSearchErrors.failed;
	if (error.status === 429) return m.imageSearchErrors.rateLimited;
	if (error.status === null) return m.imageSearchErrors.network;
	return m.imageSearchErrors.failed;
}
