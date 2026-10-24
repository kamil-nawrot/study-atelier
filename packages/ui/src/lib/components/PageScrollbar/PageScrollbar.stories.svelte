<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import OverlayScrollArea from '../testing/OverlayScrollArea.svelte';
	import PageScrollbar from './PageScrollbar.svelte';

	const { Story } = defineMeta({
		title: 'Components/PageScrollbar',
		component: PageScrollbar,
		tags: ['autodocs']
	});
</script>

<Story name="Scrolling panel">
	<OverlayScrollArea />
</Story>

<Story name="Panel that fits">
	<OverlayScrollArea rows={3} />
</Story>
