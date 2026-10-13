import type { Handle } from '@sveltejs/kit/hooks';
import { render } from 'svelte/server';
import { LoadingScreen } from '@study-atelier/ui';
import { LOADING_SCREEN_SLOT, loadingScreenProps } from '#lib/startup/loading-screen.ts';

const loadingScreen = render(LoadingScreen, { props: loadingScreenProps }).body;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => html.replace(LOADING_SCREEN_SLOT, loadingScreen)
	});
