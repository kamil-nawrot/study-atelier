import { m } from '#lib/i18n/index.ts';

type ErrorLike = {
	code?: string;
	message?: string;
	status?: number;
};

export function profileErrorMessage(error: ErrorLike): string {
	if (error.status === undefined && !error.code) return m.settings.profile.network;
	return m.settings.profile.failed;
}
