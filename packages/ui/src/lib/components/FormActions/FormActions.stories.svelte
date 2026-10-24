<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from '../Button/Button.svelte';
	import FormActions from './FormActions.svelte';

	const { Story } = defineMeta({
		title: 'Components/FormActions',
		component: FormActions,
		tags: ['autodocs'],
		argTypes: { children: { control: false } }
	});
</script>

<Story name="Cancel and save">
	{#snippet template()}
		<FormActions>
			<Button href="#cancel">Cancel</Button>
			<Button type="submit" variant="primary">Save</Button>
		</FormActions>
	{/snippet}
</Story>

<Story name="Three actions">
	{#snippet template()}
		<FormActions>
			<Button href="#cancel">Cancel</Button>
			<Button>Save and add another</Button>
			<Button type="submit" variant="primary">Save</Button>
		</FormActions>
	{/snippet}
</Story>
