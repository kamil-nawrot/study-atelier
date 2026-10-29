import type { ValueLinks } from '#lib/card-index/types/value-links.ts';

export function emptyValueLinks(): ValueLinks {
	return {
		periodsByEra: {
			prehistory: [],
			antiquity: [],
			middle_ages: [],
			early_modern: [],
			modern: [],
			contemporary: []
		},
		stylesByPeriod: {}
	};
}
