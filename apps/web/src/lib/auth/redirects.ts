export function authRedirectUrl(path: string): string {
	return new URL(path, window.location.origin).toString();
}
