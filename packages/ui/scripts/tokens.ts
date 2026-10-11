export type Token = {
	path: string[];
	type: string;
	value: unknown;
};

type TokenNode = { [key: string]: unknown };

export type TokenTheme = {
	id: string;
	selectedTokenSets: Record<string, string>;
};

export type TokenDocument = {
	[set: string]: unknown;
	$themes?: TokenTheme[];
};

const referencePattern = /^\{([^}]+)\}$/;

export function variableName(path: string[]): string {
	return `--${path.join('-')}`;
}

export function convertValue(type: string, value: unknown): string {
	if (typeof value === 'string') {
		const reference = value.match(referencePattern);
		if (reference) return `var(${variableName(reference[1].split('.'))})`;
	}
	switch (type) {
		case 'fontFamilies':
		case 'fontFamily':
			return `'${value}'`;
		case 'lineHeights':
			return percentToNumber(value);
		case 'letterSpacing':
			return percentToEm(value);
		default:
			return String(value);
	}
}

function percentToNumber(value: unknown): string {
	if (typeof value !== 'string' || !value.endsWith('%')) return String(value);
	return String(Number(value.slice(0, -1)) / 100);
}

function percentToEm(value: unknown): string {
	if (typeof value !== 'string' || !value.endsWith('%')) return String(value);
	const em = Number(value.slice(0, -1)) / 100;
	return em === 0 ? '0' : `${em}em`;
}

function isNode(value: unknown): value is TokenNode {
	return typeof value === 'object' && value !== null;
}

export function flattenTokens(set: TokenNode, path: string[] = []): Token[] {
	return Object.entries(set).flatMap(([key, node]): Token[] => {
		if (key.startsWith('$') || !isNode(node)) return [];
		if ('$value' in node) {
			return [{ path: [...path, key], type: String(node.$type), value: node.$value }];
		}
		return flattenTokens(node, [...path, key]);
	});
}

function declarations(tokens: Token[]): string[] {
	return tokens.map(
		(token) => `\t${variableName(token.path)}: ${convertValue(token.type, token.value)};`
	);
}

function themeSets(theme: TokenTheme, status: string): string[] {
	return Object.entries(theme.selectedTokenSets)
		.filter(([, value]) => value === status)
		.map(([name]) => name);
}

export function buildCss(document: TokenDocument): string {
	const themes = document.$themes ?? [];
	if (themes.length === 0) throw new Error('tokens.json defines no $themes');

	const sourceSets = [...new Set(themes.flatMap((theme) => themeSets(theme, 'source')))];
	const [defaultTheme, ...otherThemes] = themes;

	const tokensOf = (setNames: string[]): Token[] =>
		setNames.flatMap((name) => {
			const set = document[name];
			if (!isNode(set)) throw new Error(`Token set "${name}" is missing`);
			return flattenTokens(set);
		});

	const blocks = [
		[
			':root {',
			...declarations(tokensOf(sourceSets)),
			...declarations(tokensOf(themeSets(defaultTheme, 'enabled'))),
			`\tcolor-scheme: ${defaultTheme.id};`,
			'}'
		],
		...otherThemes.map((theme) => [
			`[data-theme='${theme.id}'] {`,
			...declarations(tokensOf(themeSets(theme, 'enabled'))),
			`\tcolor-scheme: ${theme.id};`,
			'}'
		])
	];

	return blocks.map((block) => block.join('\n')).join('\n\n') + '\n';
}
