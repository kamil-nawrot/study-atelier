import { describe, expect, it } from 'vitest';
import {
	buildCss,
	convertValue,
	flattenTokens,
	variableName,
	type TokenDocument
} from './tokens.ts';

describe('variableName', () => {
	it('joins the token path with dashes', () => {
		expect(variableName(['color', 'neutral', '100'])).toBe('--color-neutral-100');
	});
});

describe('convertValue', () => {
	it('turns references into CSS variables', () => {
		expect(convertValue('color', '{color.neutral.950}')).toBe('var(--color-neutral-950)');
	});

	it('quotes font families', () => {
		expect(convertValue('fontFamilies', 'Schibsted Grotesk')).toBe("'Schibsted Grotesk'");
	});

	it('turns percentage line heights into unitless numbers', () => {
		expect(convertValue('lineHeights', '140%')).toBe('1.4');
	});

	it('turns percentage letter spacing into em', () => {
		expect(convertValue('letterSpacing', '-2%')).toBe('-0.02em');
		expect(convertValue('letterSpacing', '0%')).toBe('0');
	});

	it('keeps other values as they are', () => {
		expect(convertValue('spacing', '16px')).toBe('16px');
		expect(convertValue('fontWeights', 500)).toBe('500');
	});
});

describe('flattenTokens', () => {
	it('lists nested tokens with their paths and skips metadata', () => {
		const set = {
			$description: 'ignored',
			color: { bg: { $type: 'color', $value: '#000' } }
		};
		expect(flattenTokens(set)).toEqual([{ path: ['color', 'bg'], type: 'color', value: '#000' }]);
	});
});

describe('buildCss', () => {
	const document: TokenDocument = {
		core: { color: { ink: { $type: 'color', $value: '#1C1A18' } } },
		dark: { color: { bg: { $type: 'color', $value: '{color.ink}' } } },
		light: { color: { bg: { $type: 'color', $value: '#E2DFD7' } } },
		$themes: [
			{ id: 'dark', selectedTokenSets: { core: 'source', dark: 'enabled' } },
			{ id: 'light', selectedTokenSets: { core: 'source', light: 'enabled' } }
		]
	};

	it('puts source sets and the first theme on :root and other themes under data-theme', () => {
		expect(buildCss(document)).toBe(
			[
				':root {',
				'\t--color-ink: #1C1A18;',
				'\t--color-bg: var(--color-ink);',
				'\tcolor-scheme: dark;',
				'}',
				'',
				"[data-theme='light'] {",
				'\t--color-bg: #E2DFD7;',
				'\tcolor-scheme: light;',
				'}',
				''
			].join('\n')
		);
	});

	it('fails when a theme names a missing set', () => {
		const broken = { ...document, $themes: [{ id: 'x', selectedTokenSets: { nope: 'enabled' } }] };
		expect(() => buildCss(broken)).toThrow('Token set "nope" is missing');
	});
});
