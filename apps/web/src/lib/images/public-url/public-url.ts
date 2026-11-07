const BLOCKED_SUFFIXES = ['.local', '.localhost', '.internal', '.lan', '.home', '.arpa', '.corp'];

export function publicHttpsUrl(text: string | null | undefined): URL | undefined {
	if (!text) return undefined;
	let url: URL;
	try {
		url = new URL(text);
	} catch {
		return undefined;
	}
	if (url.protocol !== 'https:') return undefined;
	if (url.username !== '' || url.password !== '') return undefined;
	if (url.port !== '' && url.port !== '443') return undefined;
	const host = url.hostname.toLowerCase();
	if (host === '' || host.startsWith('[') || !host.includes('.')) return undefined;
	if (/^[\d.]+$/.test(host)) return undefined;
	if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return undefined;
	return url;
}
