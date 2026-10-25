import { m } from '#lib/i18n/i18n.ts';
import data from './auth-artworks.json';

const publicDomainLicenses = ['Public domain', 'CC0'];

type AuthArtwork = {
	title: string;
	artist: string;
	date: string;
	file: string;
	credit: string;
};

type ArtworkEntry = (typeof data)[number];

function formatYear(year: number): string {
	return year < 0 ? m.artwork.yearBce(-year) : String(year);
}

function toAuthArtwork(entry: ArtworkEntry): AuthArtwork {
	const photographer = 'photographer' in entry ? String(entry.photographer) : null;
	const isPublicDomain = publicDomainLicenses.includes(entry.license);
	return {
		title: entry.title,
		artist: entry.artist ?? m.artwork.unknownArtist,
		date: formatYear(entry.year),
		file: entry.file,
		credit:
			photographer && !isPublicDomain
				? m.artwork.photoCredit(photographer, entry.license)
				: m.artwork.credit
	};
}

export const authArtworks: AuthArtwork[] = data.map(toAuthArtwork);

export function pickArtwork(random: () => number = Math.random): AuthArtwork {
	return authArtworks[Math.floor(random() * authArtworks.length)];
}
