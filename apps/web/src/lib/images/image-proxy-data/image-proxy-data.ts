import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { IMAGE_PROXY_PATH } from '#lib/images/image-proxy/image-proxy.ts';

export async function fetchImageThroughProxy(url: string): Promise<Blob | undefined> {
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return undefined;
		const response = await fetch(`${IMAGE_PROXY_PATH}?url=${encodeURIComponent(url)}`, {
			headers: { authorization: `Bearer ${token}` }
		});
		return response.ok ? await response.blob() : undefined;
	} catch {
		return undefined;
	}
}
