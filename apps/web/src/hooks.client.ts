import '@study-atelier/ui/styles.css';
import '#lib/startup/loading-screen.css';
import type { ClientInit } from '@sveltejs/kit/hooks';
import { takeOverLoadingScreen } from '#lib/startup/loading-screen.ts';

export const init: ClientInit = () => {
	takeOverLoadingScreen();
};
