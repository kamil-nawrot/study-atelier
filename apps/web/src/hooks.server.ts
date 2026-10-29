import type { Handle } from '@sveltejs/kit/hooks';
import { render } from 'svelte/server';
import { LoadingScreen } from '@study-atelier/ui';
import {
	LOADING_SCREEN_SLOT,
	loadingScreenProps
} from '#lib/startup/loading-screen/loading-screen.ts';
import { THEME_SLOT, themeScript } from '#lib/shell/theme/theme.svelte.ts';
import { SHARE_SLOT, shareTags } from '#lib/start/share/share.ts';

const loadingScreen = render(LoadingScreen, { props: loadingScreenProps }).body;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace(THEME_SLOT, themeScript)
				.replace(SHARE_SLOT, shareTags(event.url.origin))
				.replace(LOADING_SCREEN_SLOT, loadingScreen)
	});
