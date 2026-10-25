import motionNeedsNoPreference from './stylelint/motion-needs-no-preference.js';
import visuallyHiddenInBase from './stylelint/visually-hidden-in-base.js';
import { asGlob, noOuterMargin, readAllowlist } from './lint/limits.js';

const literalColor =
	'/(#[0-9a-fA-F]{3,8}\\b|\\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\\()/';
const literalLength = '/(^|[\\s(,*/+-])-?\\d*\\.?\\d+(px|rem|em|ch|vh|vw)\\b/';
const fontFamily = { 'font-family': ['/^(inherit|var\\(--font-family-)/'] };
const fontFamilyMessage = 'Set "font-family" to inherit or a --font-family-* token';
const marginExceptions = (readAllowlist().margin ?? []).map(asGlob);

const config = {
	extends: ['stylelint-config-html/svelte'],
	plugins: ['stylelint-declaration-strict-value', motionNeedsNoPreference, visuallyHiddenInBase],
	rules: {
		'study-atelier/motion-needs-no-preference': true,
		'study-atelier/visually-hidden-in-base': true,
		'declaration-property-value-allowed-list': [
			{ ...fontFamily, '/^margin/': [noOuterMargin] },
			{
				message: (property) =>
					property === 'font-family'
						? fontFamilyMessage
						: 'Elements set no outer margin of their own; space them with the gap of their parent'
			}
		],
		'declaration-no-important': true,
		'declaration-block-no-duplicate-properties': true,
		'no-duplicate-selectors': true,
		'property-no-unknown': true,
		'unit-no-unknown': true,
		'color-no-invalid-hex': true,
		'color-named': 'never',
		'property-disallowed-list': [
			['box-shadow', 'text-shadow'],
			{ message: 'There are no shadows in this design' }
		],
		'media-feature-name-value-allowed-list': [
			{ 'min-width': ['768px'] },
			{ message: 'The only min-width breakpoint is 768px' }
		],
		'scale-unlimited/declaration-strict-value': [
			[
				'/^(?!--).*color$/',
				'fill',
				'stroke',
				'/^(margin|padding)(-.+)?$/',
				'gap',
				'row-gap',
				'column-gap',
				'font-size',
				'font-weight',
				'line-height',
				'letter-spacing',
				'/^border(-.+)?-width$/',
				'border-radius',
				'transition-duration',
				'animation-duration'
			],
			{
				ignoreValues: [
					'transparent',
					'currentColor',
					'inherit',
					'initial',
					'unset',
					'none',
					'auto',
					'normal',
					'0',
					'1',
					'/var\\(--/'
				],
				ignoreFunctions: false,
				disableFix: true,
				message: 'Use a design token (var(--…)) for "${property}", not "${value}"'
			}
		],
		'declaration-property-value-disallowed-list': [
			{
				'/.*/': ['/var\\(--color-(neutral|red|amber|green)-\\d+/'],
				'/^(background|border(-top|-right|-bottom|-left)?|outline|box-shadow)$/': [
					literalColor,
					literalLength
				]
			},
			{
				message: 'Use a semantic design token; palette tokens belong to packages/ui/src/lib/styles'
			}
		]
	},
	overrides: [
		{
			files: ['packages/ui/src/lib/styles/**'],
			rules: { 'declaration-property-value-disallowed-list': null }
		},
		{
			files: ['packages/ui/src/lib/styles/base.css'],
			rules: {
				'study-atelier/visually-hidden-in-base': null,
				'declaration-property-value-allowed-list': null
			}
		},
		...(marginExceptions.length === 0
			? []
			: [
					{
						files: marginExceptions,
						rules: {
							'declaration-property-value-allowed-list': [
								fontFamily,
								{ message: fontFamilyMessage }
							]
						}
					}
				])
	]
};

export default config;
