import type { RequestHandler } from '@sveltejs/kit';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$app/env/public';
import { bearerToken, isSignedIn } from '#lib/images/image-proxy-auth/image-proxy-auth.ts';
import { fetchPublicImage } from '#lib/images/image-proxy/image-proxy.ts';

export const GET: RequestHandler = async ({ request, url }) => {
	const token = bearerToken(request.headers.get('authorization'));
	if (!(await isSignedIn(token, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY))) {
		return new Response(null, { status: 401 });
	}
	const image = await fetchPublicImage(url.searchParams.get('url'));
	if (!image.ok) return new Response(null, { status: image.status });
	return new Response(image.body, {
		headers: {
			'content-type': image.contentType,
			'cache-control': 'private, max-age=3600',
			'x-content-type-options': 'nosniff'
		}
	});
};
