<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './Button.svelte';
	import Toast from './Toast.svelte';

	const { Story } = defineMeta({
		title: 'Components/Toast',
		component: Toast,
		tags: ['autodocs'],
		args: { duration: 5000, offset: 0 },
		parameters: { layout: 'fullscreen' }
	});
</script>

<script lang="ts">
	let toast: Toast | undefined = $state();
	let barToast: Toast | undefined = $state();
	let longToast: Toast | undefined = $state();
	let barHeight = $state(0);
	let next = $state(12);

	function save(target: Toast | undefined): void {
		target?.show(`Artwork #${String(next).padStart(4, '0')} saved.`);
		next += 1;
	}
</script>

<Story name="Default">
	{#snippet template(args)}
		<div style="padding: var(--spacing-6)">
			<Button onclick={() => save(toast)}>Save and add another</Button>
		</div>
		<Toast {...args} bind:this={toast} />
	{/snippet}
</Story>

<Story name="Above an action bar">
	{#snippet template(args)}
		<div
			style="position: fixed; right: 0; bottom: 0; left: 0; display: flex; justify-content: flex-end; gap: var(--spacing-3); padding: var(--spacing-3) var(--spacing-4); border-top: var(--border-width-hairline) solid var(--color-tag); background: var(--color-bg)"
			bind:clientHeight={barHeight}
		>
			<Button onclick={() => save(barToast)}>Save and add another</Button>
			<Button variant="primary">Save</Button>
		</div>
		<Toast {...args} bind:this={barToast} offset={barHeight} />
	{/snippet}
</Story>

<Story name="Long message">
	{#snippet template(args)}
		<div style="padding: var(--spacing-6)">
			<Button
				onclick={() =>
					longToast?.show(
						'Artwork #0012 saved. The form is empty again, so you can add the next artwork right away.'
					)}
			>
				Show
			</Button>
		</div>
		<Toast {...args} bind:this={longToast} />
	{/snippet}
</Story>
