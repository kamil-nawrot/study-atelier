import { describe, expect, it } from 'vitest';
import { m } from './i18n.ts';

const SAMPLE_ARGUMENTS: unknown[] = [1, 2, 5, 22, 'Sample', 'Mona Lisa'];
const ADDRESS_IN_LOWER_CASE =
	/(?<!\p{L})(ty|ciebie|cię|tobie|tobą|twój|twoja|twoje|twojego|twojej|twojemu|twoim|twoją|twoich|twoimi)(?!\p{L})/u;

type Text = { key: string; text: string };

function outputs(text: (...values: unknown[]) => unknown): string[] {
	return SAMPLE_ARGUMENTS.flatMap((sample) => {
		try {
			const result = text(...Array.from({ length: Math.max(text.length, 1) }, () => sample));
			return typeof result === 'string' ? [result] : [];
		} catch {
			return [];
		}
	});
}

function texts(value: unknown, key: string): Text[] {
	if (typeof value === 'string') return [{ key, text: value }];
	if (typeof value === 'function') {
		return outputs(value as (...values: unknown[]) => unknown).map((text) => ({ key, text }));
	}
	if (value && typeof value === 'object') {
		return Object.entries(value).flatMap(([name, child]) =>
			texts(child, key ? `${key}.${name}` : name)
		);
	}
	return [];
}

const all = texts(m, '');

describe('the Polish dictionary', () => {
	it('reads every text', () => {
		expect(all.length).toBeGreaterThan(500);
	});

	it('uses no exclamation marks', () => {
		expect(all.filter(({ text }) => text.includes('!')).map(({ key }) => key)).toEqual([]);
	});

	it('uses the single … character instead of three dots', () => {
		expect(all.filter(({ text }) => text.includes('...')).map(({ key }) => key)).toEqual([]);
	});

	it('capitalises Ty and Twój when it addresses the learner', () => {
		expect(
			all.filter(({ text }) => ADDRESS_IN_LOWER_CASE.test(text)).map(({ key }) => key)
		).toEqual([]);
	});
});
