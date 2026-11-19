export default async function (page) {
	await page.getByRole('button', { name: /^Girl with a Pearl Earring/ }).hover();
	await page.getByRole('link', { name: 'Otwórz w atelier' }).waitFor();
}
