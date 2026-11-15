export default async function (page) {
	await page.evaluate(() => {
		Math.random = () => 0.04;
	});
	await page.locator('a[href="/atelier/2"]').first().click();
	await page.getByRole('button', { name: 'Odgoń muchę' }).waitFor();
}
