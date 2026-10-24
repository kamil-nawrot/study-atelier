<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProgressLine from './ProgressLine.svelte';

	const { Story } = defineMeta({
		title: 'Components/ProgressLine',
		component: ProgressLine,
		tags: ['autodocs']
	});
</script>

<Story name="Under a top bar">
	{#snippet template(args)}
		<div
			style="position: relative; height: 64px; padding: var(--spacing-3); border-bottom: var(--border-width-hairline) solid var(--color-tag); background: var(--color-bg); color: var(--color-fg)"
		>
			Atelier
			<ProgressLine {...args} />
		</div>
	{/snippet}
</Story>
