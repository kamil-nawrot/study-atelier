module.exports = {
	forbidden: [
		{
			name: 'no-circular',
			severity: 'error',
			from: {},
			to: { circular: true }
		},
		{
			name: 'lib-not-to-routes',
			severity: 'error',
			from: { path: '^src/lib/' },
			to: { path: '^src/routes/' }
		},
		{
			name: 'shared-only-to-i18n',
			severity: 'error',
			from: { path: '^src/lib/shared/' },
			to: { path: '^src/lib/', pathNot: '^src/lib/(shared|i18n)/' }
		},
		{
			name: 'catalogue-only-to-shared-and-i18n',
			severity: 'error',
			from: { path: '^src/lib/catalogue/' },
			to: { path: '^src/lib/', pathNot: '^src/lib/(catalogue|shared|i18n)/' }
		},
		{
			name: 'shell-only-from-routes',
			severity: 'error',
			from: { pathNot: '^src/(routes|lib/shell)/' },
			to: { path: '^src/lib/shell/' }
		}
	],
	options: {
		includeOnly: '^src/',
		tsConfig: { fileName: 'tsconfig.json' },
		tsPreCompilationDeps: true
	}
};
