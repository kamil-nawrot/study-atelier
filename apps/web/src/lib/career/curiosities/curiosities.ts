import { m } from '#lib/i18n/i18n.ts';
import type { Curiosity } from '#lib/career/types/curiosity.ts';

const SOURCES: Readonly<Record<string, readonly string[]>> = {
	collection: [
		'https://www.britannica.com/topic/Ashmolean-Museum',
		'https://www.visitmuve.it/en/galleria-delle-opere/tintoretto-paradise/',
		'https://www.uffizi.it/en/pages/about-us',
		'https://www.nhm.ac.uk/our-science/services/library/collections/sloane.html',
		'https://www.museiincomuneroma.it/en/museo/133',
		'https://www.fpa.es/files/interactives/the-prado-museum',
		'https://www.vrt.be/vrtnws/en/2024/04/10/the-mystery-of-the-disappearance-of-the-just-judges-90-years-on/',
		'https://www.guinnessworldrecords.com/world-records/84713-most-expensive-painting',
		'https://www.pbs.org/newshour/arts/what-to-know-about-the-worlds-largest-art-heist-from-a-boston-museum'
	],
	eras: [
		'https://ercolano.cultura.gov.it/from-discovery-to-archeological-park/?lang=en',
		'https://www.nationalgeographic.com/history/history-magazine/article/laocoon-and-his-sons-michelangelo',
		'https://www.euronews.com/culture/2023/09/12/culture-re-view-a-dog-called-robot-discovers-one-of-the-most-impressive-examples-of-prehis',
		'https://grupos.unican.es/arte/Ingles/prehist/paleo/b/',
		'https://www.sciencenews.org/article/march-history-terra-cotta-warriors-show-their-true-colors'
	],
	memory: [
		'https://www.scientificamerican.com/article/your-own-hall-of-memories',
		'https://jesuitonlinebibliography.bc.edu/catalog/14785',
		'https://whistlerwritings.gla.ac.uk/the-painters-poetry.html',
		'https://warburg.library.cornell.edu/about',
		'https://annex.exploratorium.edu/learning_studio/news/april97.html',
		'https://www.cbsnews.com/news/wiltshires-new-york-memory-revealed/',
		'https://notesfrompoland.com/2022/09/21/bellotto-the-18th-century-artist-who-helped-warsaw-rise-from-the-ashes-of-wwii/'
	],
	regular: [
		'https://dzieje.pl/dziedzictwo-kulturowe/symboliczne-przekazanie-nagrody-europa-nostra-za-konserwacje-oltarza-wita',
		'https://mini-site.louvre.fr/ingres/1.4.6_en.html',
		'https://nelson-atkins.org/gates/about.html',
		'https://www.phillipscollection.org/blog/2019-01-29-rodins-gates-hell',
		'https://www.wattstowers.org/about-us',
		'https://www.facteurcheval.com/en/history/',
		'https://www.duomomilano.it/en/art-and-culture/the-cathedral/',
		'https://www.koelner-dom.de/erleben/geschichte'
	],
	back_from_storage: [
		'https://www.euronews.com/2023/08/21/culture-re-view-how-the-theft-of-the-mona-lisa-made-it-a-superstar'
	],
	chronicle: [
		'https://www.louvre.fr/en/explore/the-palace/the-salon-carre',
		'https://parcoursrevolution.paris.fr/en/points-of-interest/64-from-the-palace-of-the-kings-to-the-national-museum-the-louvre-museum',
		'https://www.rijksmuseum.nl/en/press/rijksmuseum-s-vermeer-exhibition-most-successful-in-its-history',
		'https://londonmuseum.org.uk/collections/v/object-800442/family-queing-for-the-tutankhamun-exhibition-at-the-british-museum',
		'https://www.theartnewspaper.com/2016/01/28/record-crowds-brave-moscow-cold-for-blockbuster-show',
		'https://www.spokesman.com/stories/2019/oct/20/how-the-1911-theft-of-the-mona-lisa-made-it-the-wo'
	],
	grand_tour: [
		'https://www.benesse-artsite.jp/en/art/chichu.html',
		'https://www.inhotim.org.br/en/institucional/sobre-o-inhotim/',
		'https://zeitzmocaa.museum/about/',
		'https://frederiksbergmuseerne.dk/en/cisternerne/om-cisternerne/',
		'https://www.theartnewspaper.com/2023/08/31/collector-david-walshs-subterranean-mona-museum-expanding-to-house-dream-library',
		'https://www.underwatersculpture.com/projects/musa-mexico/'
	],
	seen_live: [
		'https://collections.louvre.fr/en/ark:/53355/cl010062370',
		'https://www.rijksmuseum.nl/en/collection/SK-A-2344',
		'https://www.bayeuxmuseum.com/en/the-bayeux-tapestry/discover-the-bayeux-tapestry/',
		'https://www.rijksmuseum.nl/en/collection/SK-C-1453',
		'https://munch.no/en/The-Scream/where-can-i-see-the-scream',
		'https://www.cbsnews.com/amp/chicago/news/the-great-wave-returns-art-institute-of-chicago'
	],
	timeline: [
		'https://www.nationalgallery.org.uk/paintings/jan-van-eyck-the-arnolfini-portrait',
		'https://pmc.ncbi.nlm.nih.gov/articles/PMC11303553/',
		'https://visit.gent.be/en/symbolism-behind-ghent-altarpiece',
		'https://archive.archaeology.org/online/features/hoaxes/warriors.html',
		'https://www.theartnewspaper.com/2024/07/04/oldest-example-of-figurative-art-found-in-indonesian-cave'
	],
	glossary: [
		'https://www.tate.org.uk/art/art-terms/i/impressionism',
		'https://www.nationalgallery.org.uk/paintings/glossary/baroque',
		'https://www.nationalgallery.org.uk/paintings/glossary/sfumato',
		'https://www.tate.org.uk/art/art-terms/c/cubism',
		'https://www.vam.ac.uk/articles/the-gothic-style-an-introduction',
		'https://collections.vam.ac.uk/item/O112433/detail-of-the-decoration-of-print-ottaviani-giovanni/',
		'https://www.vam.ac.uk/articles/art-nouveau-an-international-style'
	],
	own_eye: [
		'https://collections.whipplemuseum.cam.ac.uk/objects/12563/',
		'https://theartsdesk.com/visual-arts/canaletto-art-venice-queens-gallery-preview',
		'https://www.vam.ac.uk/articles/william-henry-fox-talbot-an-introduction',
		'https://www.hrc.utexas.edu/niepce-heliograph/',
		'https://www.guinnessworldrecords.com/world-records/107088-first-photograph-of-a-human'
	],
	night_watch: ['https://www.rijksmuseum.nl/en/collection/SK-C-5'],
	marathon: ['https://collections.tepapa.govt.nz/object/41358']
};

export function curiosityOf(exhibit: string, tier: number): Curiosity | undefined {
	const texts = (m.career.curiosities as Record<string, readonly string[]>)[exhibit] ?? [];
	const text = texts[tier - 1];
	const source = SOURCES[exhibit]?.[tier - 1];
	return text && source ? { text, source } : undefined;
}
