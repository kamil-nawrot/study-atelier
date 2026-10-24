<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StepSelect, { type StepOption } from './StepSelect.svelte';

	const levels: StepOption[] = [
		{ value: 'era', label: 'Era' },
		{ value: 'period', label: 'Period' },
		{ value: 'style', label: 'Style' }
	];

	const { Story } = defineMeta({
		title: 'Components/StepSelect',
		component: StepSelect,
		tags: ['autodocs'],
		args: { label: 'Group by', steps: levels },
		argTypes: { steps: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="Chosen step" args={{ value: 'period' }} />

<Story name="Disabled" args={{ disabled: true }} />
