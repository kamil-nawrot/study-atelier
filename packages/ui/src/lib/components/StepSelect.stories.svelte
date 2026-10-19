<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Layers from '@lucide/svelte/icons/layers';
	import StepSelect, { type StepOption } from './StepSelect.svelte';

	const levels: StepOption[] = [
		{ value: 'none', label: 'No grouping' },
		{ value: 'era', label: 'Era' },
		{ value: 'period', label: 'Period' },
		{ value: 'style', label: 'Style' }
	];

	const { Story } = defineMeta({
		title: 'Components/StepSelect',
		component: StepSelect,
		tags: ['autodocs'],
		args: { label: 'Grouping', options: levels, icon: Layers },
		argTypes: { options: { control: false }, icon: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="Chosen step" args={{ value: 'period', summary: 'Eras › periods' }} />

<Story name="Inline" args={{ value: 'style', inline: true }} />

<Story name="Disabled" args={{ disabled: true }} />
