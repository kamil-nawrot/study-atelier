import { authArtworks, type AuthArtwork } from '#lib/auth/auth-artworks/auth-artworks.ts';

export const SALON_SIZE = 28;

export const MODULE_FILES = [
	'Van_Gogh_-_Terrace_of_a_Café_at_Night_(Place_du_Forum)_1888.jpg',
	'Las_Meninas,_by_Diego_Velázquez,_from_Prado_in_Google_Earth.jpg',
	'1665_Girl_with_a_Pearl_Earring.jpg',
	'Pieter_Bruegel_the_Elder_-_Hunters_in_the_Snow_(Winter)_-_Google_Art_Project.jpg',
	'Caravaggio_—_The_Calling_of_Saint_Matthew.jpg',
	'Katsushika_Hokusai_-_The_Great_Wave_off_the_Coast_of_Kanagawa_LCCN2008660568.jpg'
] as const;

const paintings = authArtworks.filter(
	(artwork) => artwork.publicDomain && artwork.kind === 'painting'
);

export function salonArtworks(random: () => number = Math.random): AuthArtwork[] {
	const shuffled = [...paintings];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const other = Math.floor(random() * (index + 1));
		[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
	}
	return shuffled.slice(0, SALON_SIZE);
}

export function moduleArtworks(): AuthArtwork[] {
	return MODULE_FILES.map((file) => {
		const artwork = authArtworks.find((candidate) => candidate.file === file);
		if (!artwork) throw new Error(`No start page artwork ${file}`);
		return artwork;
	});
}
