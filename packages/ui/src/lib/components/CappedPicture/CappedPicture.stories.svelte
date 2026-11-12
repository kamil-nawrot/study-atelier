<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CappedPicture from './CappedPicture.svelte';

	const { Story } = defineMeta({
		title: 'Components/CappedPicture',
		component: CappedPicture,
		tags: ['autodocs'],
		argTypes: { children: { control: false } }
	});

	const tall =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="100"%3E%3Crect width="20" height="100" fill="%23a0522d"/%3E%3C/svg%3E';
</script>

<Story name="A tall image capped at 300 px">
	{#snippet template()}
		<div style="width: 320px; --picture-max-height: 300px">
			<CappedPicture backdrop={tall} ratio={0.2}>
				<img alt="" height="100" src={tall} width="20" />
			</CappedPicture>
		</div>
	{/snippet}
</Story>
