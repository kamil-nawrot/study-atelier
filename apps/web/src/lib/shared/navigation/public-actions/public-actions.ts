import { resolve } from '$app/paths';

export type PublicActions = 'none' | 'atelier' | 'signIn' | 'account';

const FORM_PAGES: ReadonlySet<string> = new Set([
	resolve('/(auth)/sign-in'),
	resolve('/(auth)/sign-up'),
	resolve('/(auth)/forgot-password'),
	resolve('/update-password')
]);

export function publicActions(path: string, signedIn: boolean): PublicActions {
	const page = path.length > 1 ? path.replace(/\/$/, '') : path;
	if (FORM_PAGES.has(page)) return 'none';
	if (signedIn) return 'atelier';
	return page === resolve('/(auth)') ? 'signIn' : 'account';
}
