<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Disclosure from './Disclosure.svelte';

	const { Story } = defineMeta({
		title: 'Components/Disclosure',
		component: Disclosure,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	<Disclosure count={12} icon={Landmark} title="Antiquity">
		<p>The artworks of the group.</p>
	</Disclosure>
</Story>

<Story name="Collapsed">
	<Disclosure count={3} level={3} open={false} title="Ancient Greece">
		<p>The artworks of the group.</p>
	</Disclosure>
</Story>

<Story name="Muted">
	<Disclosure count={2} level={4} muted title="Red-figure">
		<p>The artworks of the group.</p>
	</Disclosure>
</Story>
