export type AuthArtwork = {
	title: string;
	artist: string;
	date: string;
	file: string;
};

export const authArtworks: AuthArtwork[] = [
	{
		title: 'Dziewczyna z perłą',
		artist: 'Johannes Vermeer',
		date: 'ok. 1665',
		file: '1665_Girl_with_a_Pearl_Earring.jpg'
	},
	{
		title: 'Wielka fala w Kanagawie',
		artist: 'Katsushika Hokusai',
		date: 'ok. 1831',
		file: 'Tsunami_by_hokusai_19th_century.jpg'
	},
	{
		title: 'Wędrowiec nad morzem mgły',
		artist: 'Caspar David Friedrich',
		date: 'ok. 1818',
		file: 'Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg'
	},
	{
		title: 'Gwiaździsta noc',
		artist: 'Vincent van Gogh',
		date: '1889',
		file: 'Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'
	}
];

export function commonsImageUrl(file: string, width: number): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function pickArtwork(random: () => number = Math.random): AuthArtwork {
	return authArtworks[Math.floor(random() * authArtworks.length)];
}
