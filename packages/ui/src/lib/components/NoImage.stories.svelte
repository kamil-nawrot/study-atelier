<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NoImage from './NoImage.svelte';

	const { Story } = defineMeta({
		title: 'Components/NoImage',
		component: NoImage,
		tags: ['autodocs'],
		parameters: { layout: 'padded' }
	});
</script>

<Story name="Default">
	{#snippet template(args)}
		<div style="max-width: 280px; padding: var(--spacing-2); background: var(--color-mat-bg)">
			<NoImage {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Unavailable" args={{ unavailable: true, label: 'The image did not load' }}>
	{#snippet template(args)}
		<div style="max-width: 280px; padding: var(--spacing-2); background: var(--color-mat-bg)">
			<NoImage {...args} />
		</div>
	{/snippet}
</Story>
