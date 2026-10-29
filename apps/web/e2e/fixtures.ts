import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';
import { m } from '#lib/i18n/i18n.ts';
import { LEGAL_VERSION } from '#lib/legal/version/version.ts';
import { localSupabase } from './local-supabase.ts';

type Learner = { id: string; email: string; password: string };

const supabase = localSupabase();
const EXTERNAL_SOURCES = /wikipedia\.org|wikidata\.org|wikimedia\.org|wiktionary\.org/;

const ADMIN_HEADERS = {
	apikey: supabase.serviceRoleKey,
	Authorization: `Bearer ${supabase.serviceRoleKey}`
};

async function createLearner(request: APIRequestContext): Promise<Learner> {
	const email = `e2e-${crypto.randomUUID()}@example.test`;
	const password = `E2e-${crypto.randomUUID()}`;
	const user = await request.post(`${supabase.url}/auth/v1/admin/users`, {
		headers: ADMIN_HEADERS,
		data: { email, password, email_confirm: true }
	});
	if (!user.ok()) throw new Error(`Creating the test learner failed with ${user.status()}`);
	const { id } = (await user.json()) as { id: string };
	const profile = await request.post(`${supabase.url}/rest/v1/profiles`, {
		headers: ADMIN_HEADERS,
		data: { owner_id: id, legal_version: LEGAL_VERSION }
	});
	if (!profile.ok()) throw new Error(`Creating the test profile failed with ${profile.status()}`);
	return { id, email, password };
}

async function removeLearner(request: APIRequestContext, learner: Learner): Promise<void> {
	await request.delete(`${supabase.url}/auth/v1/admin/users/${learner.id}`, {
		headers: ADMIN_HEADERS
	});
}

export async function signIn(page: Page, learner: Learner): Promise<void> {
	await page.goto('/sign-in');
	await page.getByLabel(m.common.email).fill(learner.email);
	await page.getByLabel(m.common.password).fill(learner.password);
	await page.getByRole('button', { name: m.signIn.submit }).click();
	await page.waitForURL('**/atelier');
}

export const test = base.extend<{ learner: Learner }>({
	learner: async ({ request }, use) => {
		const learner = await createLearner(request);
		await use(learner);
		await removeLearner(request, learner);
	},
	page: async ({ page }, use) => {
		await page.route(EXTERNAL_SOURCES, (route) => route.abort());
		await use(page);
	}
});

export { expect };
