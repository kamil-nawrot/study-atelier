<script lang="ts" module>
	import type { ValueOption } from '../../types/value-option';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ValueSuggestions from './ValueSuggestions.svelte';

	const options: ValueOption[] = [
		{ kind: 'similar', name: 'Baroque' },
		{ kind: 'existing', name: 'baroque' },
		{ kind: 'existing', name: 'gothic' },
		{ kind: 'starter', name: 'Prado', note: 'Spain' },
		{ kind: 'new', name: 'barock' }
	];

	const { Story } = defineMeta({
		title: 'Components/ValueSuggestions',
		component: ValueSuggestions,
		tags: ['autodocs'],
		args: {
			listId: 'style-list',
			label: 'Style',
			options,
			activeIndex: 0,
			expanded: true,
			optionId: (option: ValueOption) => `style-${option.kind}-${option.name}`,
			onpick: () => {}
		},
		argTypes: { options: { control: false } }
	});
</script>

<Story name="Default" />
