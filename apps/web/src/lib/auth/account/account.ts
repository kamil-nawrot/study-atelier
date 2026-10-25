import { authRedirectUrl } from '#lib/auth/redirects/redirects.ts';

export const EMAIL_CHANGED_PARAM = 'emailChanged';

export function emailChangeRedirectUrl(): string {
	return authRedirectUrl(`/atelier/settings?tab=account&${EMAIL_CHANGED_PARAM}=1`);
}
