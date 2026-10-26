const allowedComment =
	/^\s*(eslint[- ]|@ts-|global\s|prettier-ignore|svelte-ignore|@vite-ignore|\/ <reference )/;
const wikiHost = /\b(wikimedia|wikipedia|wiktionary|wikidata)\.org\b/;

const noComments = {
	meta: {
		type: 'suggestion',
		docs: { description: 'Code carries no comments, only tool directives' },
		schema: []
	},
	create(context) {
		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (allowedComment.test(comment.value)) continue;
					context.report({
						loc: comment.loc,
						message: 'No comments in code; only eslint, @ts and svelte-ignore directives'
					});
				}
			}
		};
	}
};

function importProblem(source) {
	if (source.startsWith('../')) {
		return 'A relative import stays in its own folder; import from another folder through #lib/…';
	}
	if (source === '$lib' || source.startsWith('$lib/')) return 'Import through #lib/…, not $lib';
	if (source.startsWith('#lib/') && !/\.[a-z]+(\?[a-z]+)?$/.test(source)) {
		return 'An import through #lib/… names the file with its extension';
	}
	return null;
}

const importPaths = {
	meta: {
		type: 'suggestion',
		docs: { description: 'Imports go through #lib/… with the extension, ../ is not used' },
		schema: []
	},
	create(context) {
		function check(node) {
			const source = node.source;
			if (!source || source.type !== 'Literal' || typeof source.value !== 'string') return;
			const message = importProblem(source.value);
			if (message) context.report({ node: source, message });
		}
		return {
			ImportDeclaration: check,
			ExportNamedDeclaration: check,
			ExportAllDeclaration: check,
			ImportExpression: check
		};
	}
};

const noWikiHosts = {
	meta: {
		type: 'suggestion',
		docs: { description: 'Wikimedia addresses live only in the modules that talk to Wikimedia' },
		schema: []
	},
	create(context) {
		function check(node, text) {
			if (typeof text !== 'string' || !wikiHost.test(text)) return;
			context.report({
				node,
				message:
					'Wikimedia, Wikipedia, Wiktionary and Wikidata addresses belong in lib/images or the glossary wiki files'
			});
		}
		return {
			Literal: (node) => check(node, node.value),
			TemplateElement: (node) => check(node, node.value.cooked)
		};
	}
};

export default {
	meta: { name: 'study-atelier' },
	rules: {
		'no-comments': noComments,
		'import-paths': importPaths,
		'no-wiki-hosts': noWikiHosts
	}
};
