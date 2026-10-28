import { describe, expect, it } from 'vitest';
import { publicActions } from './public-actions.ts';

describe('publicActions', () => {
	it('offers only signing in on the start page, whose content offers signing up', () => {
		expect(publicActions('/', false)).toBe('signIn');
	});

	it('leaves the forms alone, as each links to the other pages itself', () => {
		for (const path of [
			'/sign-in',
			'/sign-up',
			'/sign-up/check-email',
			'/forgot-password',
			'/sign-in/'
		]) {
			expect(publicActions(path, false)).toBe('none');
		}
	});

	it('keeps the new password page free of a way around setting the password', () => {
		expect(publicActions('/update-password', true)).toBe('none');
	});

	it('offers both account actions on the pages with no other way on', () => {
		expect(publicActions('/terms', false)).toBe('account');
		expect(publicActions('/privacy', false)).toBe('account');
	});

	it('takes a signed-in learner back to the atelier', () => {
		expect(publicActions('/', true)).toBe('atelier');
		expect(publicActions('/terms', true)).toBe('atelier');
	});
});
