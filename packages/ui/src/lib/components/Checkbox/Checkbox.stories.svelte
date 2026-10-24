<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Checkbox from './Checkbox.svelte';

	const { Story } = defineMeta({
		title: 'Components/Checkbox',
		component: Checkbox,
		tags: ['autodocs'],
		args: { label: 'Keep me signed in', checked: false, disabled: false }
	});
</script>

<Story name="Default" />

<Story name="Checked" args={{ checked: true }} />

<Story name="Disabled" args={{ disabled: true }} />
