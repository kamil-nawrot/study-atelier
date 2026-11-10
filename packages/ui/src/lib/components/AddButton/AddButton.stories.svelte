<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AddButton from './AddButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/AddButton',
		component: AddButton,
		tags: ['autodocs'],
		args: { label: 'Dodaj pojęcie', href: '#' }
	});
</script>

<Story name="In a top bar">
	{#snippet template(args)}
		<div style="display: flex; justify-content: flex-end">
			<AddButton {...args} />
		</div>
	{/snippet}
</Story>
