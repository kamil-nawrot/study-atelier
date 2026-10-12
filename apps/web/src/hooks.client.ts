import '@study-atelier/ui/styles.css';
import type { ClientInit } from '@sveltejs/kit/hooks';
import { showLoadingScreen } from '#lib/startup/loading-screen.ts';

export const init: ClientInit = () => {
	showLoadingScreen();
};
