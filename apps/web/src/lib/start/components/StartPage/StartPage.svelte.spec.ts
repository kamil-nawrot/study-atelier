import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import StartPage from './StartPage.svelte';

describe('StartPage', () => {
	it('says what the app is and leads to signing up and signing in', async () => {
		render(StartPage);

		await expect
			.element(
				page.getByRole('heading', { level: 1, name: `${m.landing.title} ${m.landing.titleAccent}` })
			)
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.landing.signUp }).first())
			.toHaveAttribute('href', '/sign-up');
		await expect
			.element(page.getByRole('link', { name: m.landing.signIn }))
			.not.toBeInTheDocument();
	});

	it('describes every module of the atelier', async () => {
		render(StartPage);

		await expect
			.element(page.getByRole('heading', { level: 2, name: m.landing.modulesTitle }))
			.toBeVisible();
		for (const module of m.landing.modules) {
			await expect
				.element(page.getByRole('heading', { level: 3, name: module.title }))
				.toBeInTheDocument();
		}
	});

	it('shows each module with an artwork and ends with an invitation to sign up', async () => {
		render(StartPage);

		await expect
			.element(page.getByRole('img', { name: /Taras kawiarni w nocy/ }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { level: 2, name: m.landing.closingTitle }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.landing.closingText)).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.landing.signUp }).last())
			.toHaveAttribute('href', '/sign-up');
	});

	it('links the terms, the privacy policy and the contact address', async () => {
		render(StartPage);

		await expect
			.element(page.getByRole('link', { name: m.legal.terms }))
			.toHaveAttribute('href', '/terms');
		await expect
			.element(page.getByRole('link', { name: m.legal.privacy }))
			.toHaveAttribute('href', '/privacy');
		await expect
			.element(page.getByRole('link', { name: m.landing.contact }))
			.toHaveAttribute('href', `mailto:${m.landing.contact}`);
	});
});
