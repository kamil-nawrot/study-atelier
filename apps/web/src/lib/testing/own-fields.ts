import type { OwnField } from '#lib/collection/types.ts';

export function testOwnFields(): OwnField[] {
	return [
		{
			id: 'lecture',
			name: 'Lecture',
			description: null,
			kind: 'list',
			multiple: false,
			count: 3,
			values: [
				{ id: 'baroque-class', fieldId: 'lecture', name: 'Baroque class', count: 2 },
				{ id: 'renaissance-class', fieldId: 'lecture', name: 'Renaissance class', count: 1 }
			]
		},
		{
			id: 'motifs',
			name: 'Motifs',
			description: 'What the artwork shows',
			kind: 'list',
			multiple: true,
			count: 3,
			values: [
				{ id: 'angel', fieldId: 'motifs', name: 'Angel', count: 2 },
				{ id: 'angle', fieldId: 'motifs', name: 'Angle', count: 1 }
			]
		},
		{
			id: 'seen',
			name: 'Seen in person',
			description: null,
			kind: 'flag',
			multiple: false,
			count: 0,
			values: []
		}
	];
}
