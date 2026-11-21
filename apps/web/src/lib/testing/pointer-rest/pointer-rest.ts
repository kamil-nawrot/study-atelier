import { beforeEach } from 'vitest';
import { page } from 'vitest/browser';

beforeEach(async () => {
	await page.elementLocator(document.documentElement).hover({ position: { x: 0, y: 0 } });
});
