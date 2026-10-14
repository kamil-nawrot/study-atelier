<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './Button.svelte';
	import Tooltip from './Tooltip.svelte';

	const { Story } = defineMeta({
		title: 'Components/Tooltip',
		component: Tooltip,
		tags: ['autodocs'],
		args: { text: 'Two artworks still use this style, so it cannot be deleted.' },
		argTypes: { children: { control: false } }
	});
</script>

<Story name="Disabled button">
	{#snippet template(args)}
		<div style="padding-top: var(--spacing-16)">
			<Tooltip text={args.text}>
				{#snippet children(describedby)}
					<Button aria-describedby={describedby} aria-disabled="true" variant="danger"
						>Delete</Button
					>
				{/snippet}
			</Tooltip>
		</div>
	{/snippet}
</Story>
