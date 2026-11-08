import { describe, expect, it } from 'vitest';
import { publicHttpsUrl } from './public-url.ts';

describe('publicHttpsUrl', () => {
	it('accepts an https address of a public host', () => {
		expect(publicHttpsUrl('https://images.example.test/a.jpg?x=1')?.href).toBe(
			'https://images.example.test/a.jpg?x=1'
		);
		expect(publicHttpsUrl('https://images.example.test:443/a.jpg')).toBeDefined();
	});

	it.each([
		undefined,
		null,
		'',
		'not a url',
		'http://images.example.test/a.jpg',
		'ftp://images.example.test/a.jpg',
		'https://images.example.test:8443/a.jpg',
		'https://localhost/a.jpg',
		'https://intranet/a.jpg',
		'https://127.0.0.1/a.jpg',
		'https://10.0.0.5/a.jpg',
		'https://169.254.169.254/latest',
		'https://2130706433/a.jpg',
		'https://[::1]/a.jpg',
		'https://printer.local/a.jpg',
		'https://service.internal/a.jpg',
		'https://router.home.arpa/a.jpg'
	])('rejects %s', (text) => {
		expect(publicHttpsUrl(text)).toBeUndefined();
	});

	it('rejects an address with credentials', () => {
		const address = new URL('https://images.example.test/a.jpg');
		address.username = 'user';
		address.password = 'secret';

		expect(publicHttpsUrl(address.href)).toBeUndefined();
	});
});
