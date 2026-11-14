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
	bullseye: [
		'https://www.sammlung.pinakothek.de/en/artwork/Qlx2QpQ4Xq',
		'https://www.finestresullarte.info/arte-e-artisti/paesaggio-leonardo-da-vinci-analisi-scientifiche',
		'https://blog.nationalmuseum.ch/en/2026/03/the-swiss-alchemist-who-invented-a-new-shade-of-blue/',
		'https://www.thenationalnews.com/not-picture-perfect-1.433913',
		'https://news.yale.edu/2021/09/01/analysis-unlocks-secret-vinland-map-its-fake',
		'https://www.sciencedaily.com/releases/2019/06/190604131221.htm'
	],
	regular: [
		'https://dzieje.pl/dziedzictwo-kulturowe/symboliczne-przekazanie-nagrody-europa-nostra-za-konserwacje-oltarza-wita',
		'https://mini-site.louvre.fr/ingres/1.4.6_en.html',
		'https://nelson-atkins.org/gates/about.html',
		'https://www.phillipscollection.org/blog/2019-01-29-rodins-gates-hell',
		'https://www.wattstowers.org/about-us',
		'https://www.facteurcheval.com/en/history/',
		'https://sagradafamilia.org/en/history-of-the-temple',
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
	laurel_skull: [
		'https://collections.vam.ac.uk/item/O127482/children-blowing-bubbles-oil-painting-unknown/',
		'https://www.emblems.arts.gla.ac.uk/alciato/books.php?id=A31a',
		'https://www.rct.uk/collection/exhibitions/the-art-of-italy-in-the-royal-collection/the-queens-gallery-buckingham/self-portrait-as-the-allegory-of-painting-la-pittura',
		'https://digitalcommons.lmu.edu/mobydick-asc-galleryexhibit/20/',
		'https://essentiels.bnf.fr/fr/article/1fa13963-21a8-4e08-950a-05f6515b7d34-1822-champollion-perce-secret-hieroglyphes',
		'https://arthistorians.info/panofskye/'
	],
	own_eye: [
		'https://collections.whipplemuseum.cam.ac.uk/objects/12563/',
		'https://theartsdesk.com/visual-arts/canaletto-art-venice-queens-gallery-preview',
		'https://www.vam.ac.uk/articles/william-henry-fox-talbot-an-introduction',
		'https://www.hrc.utexas.edu/niepce-heliograph/',
		'https://www.guinnessworldrecords.com/world-records/107088-first-photograph-of-a-human'
	],
	night_watch: ['https://www.rijksmuseum.nl/en/collection/SK-C-5'],
	marathon: ['https://collections.tepapa.govt.nz/object/41358'],
	mouth_of_truth: ['https://lucascranach.org/en/DE_BStGS-GNMN_Gm1108/'],
	prehistory: [
		'https://archeologie.culture.gouv.fr/lascaux/en/techniques',
		'https://www.cultura.gob.es/mnaltamira/en/cueva-altamira/arte.html',
		'https://archeologie.culture.gouv.fr/lascaux/en/lighting',
		'https://www.uib.no/en/sapience/139003/origins-early-sapiens-behaviour',
		'https://collections.louvre.fr/en/ark:/53355/cl010149557',
		'https://archaeology.org/issues/january-february-2023/collection/austria-willendorf-venus-figurine/top-10-discoveries-of-2022'
	],
	antiquity: [
		'https://archaeology.org/issues/march-april-2024/digs-discoveries/the-parthenons-paint-job/',
		'https://edu.rsc.org/resources/roman-art-wall-painting-techniques/1960.article',
		'https://www.colorado.edu/classics/2018/06/15/athenian-red-figure-technique',
		'https://archaeology.org/issues/online/collection/egypt-mummy-portraits/',
		'https://archaeology.org/news/2025/01/22/restoration-of-the-alexander-mosaic-reveals-tile-sources/',
		'https://deutsche-digitale-bibliothek.de/content/blog/objekt-des-monats-die-modellbueste-der-koenigin-nofretete'
	],
	middle_ages: [
		'https://www.nationalgallery.org.uk/podcast/colour-stories-blue',
		'https://onprem.tcd.ie/library/research-collections/book-of-kells.php',
		'https://www.bayeuxmuseum.com/en/the-bayeux-tapestry/discover-the-bayeux-tapestry/tapestry-or-embroidery/',
		'https://collections.vam.ac.uk/item/O85634',
		'https://learning.canterbury-cathedral.org/how-did-they-build-that/stone',
		'https://www.seh.ox.ac.uk/blog/a-medieval-ink-recipe'
	],
	early_modern: [
		'https://www.getty.edu/art/exhibitions/michelangelo_drawings/explore.html',
		'https://www.vam.ac.uk/content/articles/t/raphael-cartoons/',
		'https://www.nationalgallery.org.uk/artists/peter-paul-rubens',
		'https://collections.vam.ac.uk/item/O153416/',
		'https://www.clevelandart.org/art/157205',
		'https://sammlung.staedelmuseum.de/en/person/hopfer-d-ae-daniel'
	],
	modern: [
		'https://www.lindahall.org/about/news/scientist-of-the-day/john-goffe-rand',
		'https://musee-rodin.fr/en/museum/institution/original-bronze-casts',
		'https://content.time.com/time/quotes/0,26174,691044,00.html',
		'https://collections.vam.ac.uk/item/O35228/poster-cheret-jules/',
		'https://www.tate.org.uk/art/art-terms/p/papier-colle',
		'https://www.tate.org.uk/art/art-terms/r/readymade'
	],
	contemporary: [
		'https://whitney.org/collection/works/2634',
		'https://www.warhol.org/?p=4860',
		'https://www.centrepompidou.fr/en/pompidou-plus/magazine/article/the-untold-story-of-the-international-klein-blue-ikb-of-yves-klein',
		'https://www.tate.org.uk/tate-etc/issue-51-spring-2021/yayoi-kusama-infinity-mirror-rooms-from-here-to-infinity',
		'https://www.theartnewspaper.com/2006/07/01/damien-hirst-in-talks-to-replace-rotting-shark',
		'https://collection.sciencemuseumgroup.org.uk/objects/co8647838/six-silver-fabric-samples-from-wrapped-reichstag-by-christo-and-jeanne-claude'
	],
	pinacotheca: ['https://marquandrarebooks.princeton.edu/?p=245'],
	vasari_lives: [
		'https://www.uffizi.it/en/artworks/vasari-giunti-en',
		'https://www.rembrandthuis.nl/en/kronieken/rembrandts-etchings-for-menasseh-ben-israels-piedra-gloriosa-a-mystery-solved/',
		'https://www.rijksmuseum.nl/en/press/press-releases/rijksmuseum-announces-list-of-vermeer-paintings',
		'https://www.vam.ac.uk/articles/leonardo-da-vincis-notebooks',
		'https://www.guinnessworldrecords.com/world-records/most-prolific-painter'
	],
	boncompagni_academy: [
		'https://www.nationalgallery.org.uk/paintings/bronzino-the-madonna-and-child-with-saints',
		'https://www.aadfi.it/accademia/',
		'https://www.royalacademy.org.uk/art-artists/name/francesco-bartolozzi-ra',
		'https://www.olympics.com/en/news/look-to-the-past-when-olympic-medals-were-awarded-for-architecture-music-and-lit',
		'https://www.vam.ac.uk/articles/building-the-museum',
		'https://www.vam.ac.uk/collections/photographs'
	],
	vault_cobweb: [
		'https://www.uffizi.it/en/artworks/verrocchio-leonardo-baptism-of-christ',
		'https://www.nationalgallery.org.uk/artists/peter-paul-rubens',
		'https://www.rijksmuseum.nl/en/press/press-releases/rembrandts-marten-and-oopjen-naar-het-louvre',
		'https://www.louvre.fr/expositions-et-evenements/expositions/copistes',
		'https://www.nationalgallery.org.uk/paintings/leonardo-da-vinci-the-virgin-of-the-rocks',
		'https://www.vangoghmuseum.nl/assets/b023267d-2d87-43a6-88bf-956d4213f2cc?c=52f4bba580232396dbe6bf84801c5783b3e42cd25daff1bd91fef735c9d7bc52',
		'https://www.museodelprado.es/en/the-collection/art-work/the-sense-of-smell/adff981e-a317-4152-9e04-05ada13be226'
	],
	van_eyck_easel: ['https://www.mpiwg-berlin.mpg.de/news/features/features-feature22'],
	hortus_cliffortianus: [
		'https://news.artnet.com/art-world/art-bites-first-museum-labels-2467975',
		'https://www.musee-orsay.fr/en/artworks/arrangement-en-gris-et-noir-ndeg1-974',
		'http://media.vam.ac.uk/media/documents/gallery_text_writing_guide_updated.pdf',
		'https://iconclass.org/',
		'https://blogs.loc.gov/manuscripts/2026/04/of-note-registering-the-dewey-decimal-system-at-the-library-of-congress/',
		'https://presse.louvre.fr/le-musee-du-louvre-met-en-ligne-ses-collections-et-devoile-son-nouveau-site-internet-3/?lang=en'
	],
	trevi_fountain: [
		'https://www.sovraintendenzaroma.it/i_luoghi/roma_antica/monumenti/acquedotto_vergine'
	],
	seven_league_boots: [
		'https://essentiels.bnf.fr/fr/extrait/a4e7265f-26a5-43ff-9fb2-924a75411cd5-bottes-sept-lieues-tresor-petit-poucet'
	],
	pilgrim_shell: [
		'https://www.londonmuseum.org.uk/collections/v/object-37427/st-james-of-santiago-de-compostela/'
	],
	crystal_palace: [
		'https://www.royalparks.org.uk/read-watch-listen/great-exhibition-1851-hyde-park',
		'https://www.getty.edu/education/for_teachers/curricula/impressionism/background1.html',
		'https://www.tate.org.uk/art/art-terms/w/white-cube',
		'https://www.fondazioneprada.org/project/when-attitudes-become-form/?lang=en',
		'https://passerelles.essentiels.bnf.fr/fr/chronologie/construction/86975eb3-9f28-4e1a-bc88-e28bbfab0a26-tour-eiffel'
	],
	lenoir_chapel: [
		'https://www.louvre.fr/en/exhibitions-and-events/exhibitions/a-revolutionary-museum'
	],
	figure_alphabet: ['https://www.metmuseum.org/art/collection/search/428829'],
	candle_moths: ['https://www.rijksmuseum.nl/en/collection/RP-P-OB-62.370'],
	amateur_magnifier: ['https://www.clevelandart.org/art/1927.208']
};

export function curiosityOf(exhibit: string, tier: number): Curiosity | undefined {
	const texts = (m.career.curiosities as Record<string, readonly string[]>)[exhibit] ?? [];
	const text = texts[tier - 1];
	const source = SOURCES[exhibit]?.[tier - 1];
	return text && source ? { text, source } : undefined;
}
