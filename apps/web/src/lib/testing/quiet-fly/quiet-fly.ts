import { vi } from 'vitest';

vi.mock('#lib/career/giotto-fly/giotto-fly.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/career/giotto-fly/giotto-fly.ts')>()),
	landFly: () => undefined
}));
