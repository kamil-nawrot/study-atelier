<script lang="ts" module>
	import Pencil from '@lucide/svelte/icons/pencil';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IconButton from './IconButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/IconButton',
		component: IconButton,
		tags: ['autodocs'],
		args: { icon: Pencil, label: 'Change photo' }
	});
</script>

<Story name="Secondary" />

<Story name="Danger" args={{ variant: 'danger' }} />

<Story name="Disabled" args={{ disabled: true }} />
