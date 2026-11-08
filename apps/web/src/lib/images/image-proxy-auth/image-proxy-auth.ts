type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export function bearerToken(header: string | null): string | undefined {
	const match = /^Bearer\s+(\S+)$/i.exec(header ?? '');
	return match?.[1];
}

export async function isSignedIn(
	token: string | undefined,
	supabaseUrl: string,
	publishableKey: string,
	fetcher: Fetcher = fetch
): Promise<boolean> {
	if (!token) return false;
	try {
		const response = await fetcher(`${supabaseUrl}/auth/v1/user`, {
			headers: { apikey: publishableKey, authorization: `Bearer ${token}` }
		});
		return response.ok;
	} catch {
		return false;
	}
}
