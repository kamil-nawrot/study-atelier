<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TextArea from './TextArea.svelte';

	const { Story } = defineMeta({
		title: 'Components/TextArea',
		component: TextArea,
		tags: ['autodocs'],
		args: { label: 'Notes' }
	});
</script>

<Story name="Default" args={{ placeholder: 'What to remember about this artwork' }} />

<Story
	name="With value"
	args={{
		value:
			'Seen in Delft in 2024.\nThe light comes from the left window, as in most of his interiors.'
	}}
/>

<Story name="With hint" args={{ hint: 'Only you can see your notes.' }} />

<Story
	name="With error"
	args={{ value: 'Too long', error: 'Notes can be at most 2000 characters.' }}
/>

<Story
	name="With counter"
	args={{
		label: 'Summary',
		counter: true,
		maxlength: 120,
		placeholder: 'A short description shown next to the artwork',
		value: 'The revival of antiquity in Italy: harmony, proportion and perspective.'
	}}
/>

<Story
	name="Counter at the limit"
	args={{ label: 'Summary', counter: true, maxlength: 24, value: 'Exactly twenty-four char' }}
/>

<Story name="Disabled" args={{ value: 'Seen in Delft in 2024.', disabled: true }} />

<Story name="Filling" args={{ filling: true }} />
