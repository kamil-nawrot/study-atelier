<script lang="ts" module>
	import Search from '@lucide/svelte/icons/search';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StageButton from './StageButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/StageButton',
		component: StageButton,
		tags: ['autodocs'],
		args: { icon: Search, label: 'Loupe' }
	});
</script>

<Story name="Resting" />

<Story name="Active" args={{ active: true }} />

<Story name="Unavailable" args={{ unavailable: true, tooltip: 'The image is too small' }} />
