<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StageBackdrop from './StageBackdrop.svelte';

	const { Story } = defineMeta({
		title: 'Components/StageBackdrop',
		component: StageBackdrop,
		tags: ['autodocs']
	});

	const src =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="50"%3E%3Crect width="40" height="50" fill="%23a0522d"/%3E%3Ccircle cx="25" cy="19" r="9" fill="%23f5deb3"/%3E%3C/svg%3E';
</script>

<Story name="Behind a stage">
	{#snippet template()}
		<div style="position: relative; height: 240px; background: var(--color-stage-bg)">
			<StageBackdrop {src} />
		</div>
	{/snippet}
</Story>
