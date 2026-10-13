import type { CardIndexData } from '#lib/collection/types.ts';

export function testCardIndex(): CardIndexData {
	return {
		values: [
			{ id: 'period-classical', category: 'period', name: 'Classical', count: 3 },
			{ id: 'period-gothic', category: 'period', name: 'Gothic', count: 2 },
			{ id: 'period-orphan', category: 'period', name: 'Orphan', count: 0 },
			{ id: 'style-doric', category: 'style', name: 'Doric', count: 2 },
			{ id: 'style-ionic', category: 'style', name: 'Ionic', count: 1 },
			{ id: 'style-loose', category: 'style', name: 'Loose', count: 0 },
			{ id: 'material-marble', category: 'material', name: 'Marble', count: 3 },
			{ id: 'material-bronze', category: 'material', name: 'Bronze', count: 0 },
			{ id: 'author-phidias', category: 'author', name: 'Phidias', count: 1 },
			{ id: 'location-athens', category: 'location', name: 'Athens', count: 2 }
		],
		periodEras: [
			{ periodId: 'period-classical', eraCode: 'antiquity', count: 2 },
			{ periodId: 'period-classical', eraCode: 'early_modern', count: 1 },
			{ periodId: 'period-gothic', eraCode: 'middle_ages', count: 2 }
		],
		stylePeriods: [
			{ styleId: 'style-doric', periodId: 'period-classical', count: 2 },
			{ styleId: 'style-ionic', periodId: 'period-classical', count: 1 },
			{ styleId: 'style-ionic', periodId: 'period-gothic', count: 0 }
		]
	};
}
