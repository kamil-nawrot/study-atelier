<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LoadingScreen from './LoadingScreen.svelte';

	const { Story } = defineMeta({
		title: 'Components/LoadingScreen',
		component: LoadingScreen,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Default">
	{#snippet template(args)}
		<div style="position: relative; height: 480px; transform: translateZ(0)">
			<LoadingScreen {...args} />
		</div>
	{/snippet}
</Story>
