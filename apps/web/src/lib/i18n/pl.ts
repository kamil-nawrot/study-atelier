const appName = 'Study Atelier';

export const pl = {
	app: {
		name: appName,
		pageTitle: (title: string): string => `${title} · ${appName}`
	},
	ui: {
		alert: {
			danger: 'Błąd',
			warning: 'Uwaga',
			success: 'Gotowe'
		},
		showPassword: 'Pokaż',
		hidePassword: 'Ukryj',
		removeTag: 'Usuń tag',
		unknownAuthor: 'Autor nieznany',
		noImage: 'Brak obrazu',
		imageFailed: 'Nie udało się wczytać obrazu',
		loading: 'Wczytywanie',
		clearSearch: 'Wyczyść wyszukiwanie',
		closeDialog: 'Zamknij',
		notesEditor: {
			toolbar: 'Formatowanie',
			bold: 'Pogrubienie',
			italic: 'Kursywa',
			heading: 'Nagłówek',
			bulletedList: 'Lista punktowana',
			numberedList: 'Lista numerowana',
			linkValue: 'Dodaj odnośnik do autora, epoki, miejsca…',
			linkArtwork: 'Dodaj odnośnik do dzieła',
			linkSuggestions: 'Podpowiedzi odnośników',
			noValueFound: 'Nie masz jeszcze takiej wartości w Kartotece.',
			noArtworkFound: 'Nie masz w kolekcji dzieła o takim numerze ani tytule.'
		},
		valueField: {
			existing: 'Już używane',
			starter: 'Z listy startowej',
			similar: (name: string): string => `Masz już „${name}”`,
			useSimilar: 'Użyj tej wartości',
			add: (name: string): string => `+ Dodaj „${name}”`,
			addAnyway: (name: string): string => `+ Dodaj „${name}” mimo to`,
			remove: (name: string): string => `Usuń ${name}`
		},
		searchSelect: {
			empty: 'Brak pasujących wartości',
			clear: (label: string): string => `Wyczyść: ${label}`
		}
	},
	common: {
		email: 'E-mail',
		password: 'Hasło',
		stopFetch: 'Przerwij',
		name: 'Nazwa',
		notes: 'Notatki',
		add: 'Dodaj',
		edit: 'Edytuj',
		save: 'Zapisz',
		saving: 'Zapisywanie…',
		delete: 'Usuń',
		deleting: 'Usuwanie…',
		replace: 'Zastąp',
		merge: 'Połącz',
		cancel: 'Anuluj',
		back: 'Wróć',
		sending: 'Wysyłanie…',
		backToSignIn: 'Wróć do logowania',
		wikipediaSource: 'Na podstawie: Wikipedia, ',
		discardDescription: 'Masz niezapisane zmiany. Jeśli wyjdziesz, znikną.',
		network:
			'Nie udało się połączyć z serwerem. Sprawdź swoje połączenie z internetem i spróbuj jeszcze raz.',
		unexpectedError: 'Coś poszło nie tak. Spróbuj jeszcze raz za chwilę.'
	},
	validation: {
		emailRequired: 'Wpisz adres e-mail.',
		emailInvalid: 'To nie wygląda na pełny adres e-mail. Przykład: vincent@przyklad.pl.',
		passwordRequired: 'Wpisz hasło.',
		passwordTooShort: (min: number): string =>
			`Twoje hasło musi mieć co najmniej ${min} ${plural(min, { one: 'znak', few: 'znaki', many: 'znaków' })}.`,
		passwordHint: (min: number): string =>
			`Co najmniej ${min} ${plural(min, { one: 'znak', few: 'znaki', many: 'znaków' })}.`
	},
	authErrors: {
		sessionEnded: 'Twoja sesja wygasła. Zaloguj się jeszcze raz.',
		invalidCredentials:
			'E-mail albo hasło się nie zgadzają. Sprawdź oba pola albo ustaw nowe hasło.',
		emailNotConfirmed:
			'Ten adres nie jest jeszcze potwierdzony. Kliknij link z wiadomości, którą wysłaliśmy po rejestracji.',
		weakPassword: 'To hasło łatwo odgadnąć. Wybierz dłuższe, najlepiej z cyframi i znakami.',
		samePassword: 'Nowe hasło musi być inne niż obecne.',
		emailTaken: 'Ten adres jest już przypisany do innego konta.',
		rateLimited: 'Sporo prób w krótkim czasie. Odczekaj chwilę i spróbuj jeszcze raz.',
		emailRateLimited:
			'Kilka wiadomości jest już w drodze. Daj im chwilę, zanim poprosisz o kolejną.',
		captchaFailed: 'Nie udało się potwierdzić, że to Ty, a nie automat. Spróbuj jeszcze raz.'
	},
	artwork: {
		credit: 'Wikimedia Commons, domena publiczna',
		photoCredit: (photographer: string, license: string): string =>
			`Wikimedia Commons, zdjęcie: ${photographer}, ${license}`,
		licenceCredit: (license: string): string => `Wikimedia Commons, ${license}`,
		unknownArtist: 'autor nieznany',
		yearBce: (year: number): string => `${year} p.n.e.`
	},
	signIn: {
		title: 'Zaloguj się',
		lead: 'Witaj ponownie. Twoje atelier czeka.',
		forgotPassword: 'Nie pamiętasz hasła?',
		submit: 'Zaloguj się',
		submitting: 'Logowanie…',
		errorTitle: 'Nie udało się zalogować',
		noAccount: 'Nie masz jeszcze konta?',
		toSignUp: 'Załóż konto'
	},
	signUp: {
		title: 'Załóż konto',
		lead: 'Załóż konto i buduj swoją prywatną kolekcję dzieł sztuki we własnym atelier.',
		submit: 'Załóż konto',
		submitting: 'Zakładanie konta…',
		errorTitle: 'Nie udało się założyć konta',
		accountExists: 'Konto z tym adresem już istnieje. Zaloguj się albo ustaw nowe hasło.',
		forgotPassword: 'Ustaw nowe hasło',
		haveAccount: 'Masz już konto?',
		toSignIn: 'Zaloguj się'
	},
	checkEmail: {
		title: 'Sprawdź skrzynkę',
		lead: 'Jeszcze tylko potwierdzenie adresu i możemy zaczynać.',
		sentTitle: 'Wysłaliśmy link',
		sent: (email: string): string => `Na adres ${email}. Kliknij go, żeby potwierdzić konto.`,
		sentNoEmail: 'Kliknij link z wiadomości, żeby potwierdzić konto.',
		notReceived: 'Nic nie dotarło? Zajrzyj do spamu albo poproś o nowy link.',
		resend: 'Wyślij link ponownie',
		resent: 'Wysłaliśmy nowy link.'
	},
	forgotPassword: {
		title: 'Nie pamiętasz hasła?',
		lead: 'Zdarza się. Podaj e-mail konta, a wyślemy link do ustawienia nowego hasła.',
		submit: 'Wyślij link',
		sentTitle: 'Sprawdź skrzynkę',
		sent: (email: string): string =>
			`Jeśli konto ${email} istnieje, wysłaliśmy na nie link do ustawienia nowego hasła.`,
		errorTitle: 'Nie udało się wysłać linku'
	},
	updatePassword: {
		title: 'Ustaw nowe hasło',
		lead: 'Wybierz nowe hasło do swojego konta.',
		newPassword: 'Nowe hasło',
		submit: 'Zapisz hasło',
		errorTitle: 'Nie udało się zapisać hasła',
		expiredTitle: 'Link wygasł',
		expired: 'Ten link już nie działa: wygasł albo został użyty. Poproś o nowy.',
		requestNew: 'Wyślij nowy link'
	},
	publicHeader: {
		label: 'Konto',
		toAtelier: 'Przejdź do atelier'
	},
	landing: {
		pageTitle: 'Study Atelier – atelier do nauki historii sztuki',
		metaDescription:
			'Study Atelier to miejsce, w którym uczysz się historii sztuki, budując własną kolekcję dzieł.',
		accountLabel: 'Konto',
		title: 'Atelier do nauki',
		titleAccent: 'historii sztuki',
		text: 'Study Atelier to miejsce, w którym uczysz się historii sztuki, budując własną kolekcję dzieł. Zapisujesz dzieła, które poznajesz w muzeum, na wykładzie albo w książce, opisujesz je po swojemu i łączysz ze sobą. Z czasem powstaje z tego osobista baza wiedzy, do której zawsze możesz wrócić, a krótkie codzienne powtórki pomagają zapamiętać to, czego się uczysz.',
		signIn: 'Zaloguj się',
		signUp: 'Załóż konto',
		modulesTitle: 'Co znajdziesz w atelier',
		modules: [
			{
				title: 'Atelier',
				text: 'Wszystkie zebrane przez Ciebie dzieła prezentowane w formie estetycznej kolekcji. Możesz je dowolnie filtrować, a także grupować według epok i stylów, dzięki czemu Twoja kolekcja może stać się wygodnym źródłem wiedzy o sztuce.'
			},
			{
				title: 'Kartoteka',
				text: 'Gromadzi wszystkie wartości, których używasz do opisywania dzieł: epoki, style, autorów i miejsca. Pozwala nimi zarządzać i wprowadzać dodatkowe szczegóły, aby łatwo poszerzać swoją wiedzę o dodatkowe konteksty.'
			},
			{
				title: 'Słowniczek',
				text: 'Wszystkie pojęcia i postaci, które warto zapamiętać, możesz dodać do swojego osobistego słownika wraz z definicją. Dzięki temu będziesz w stanie lepiej je zapamiętać, a Twoje notatki o dziełach sztuki wzbogacą się o dodatkowe informacje.'
			},
			{
				title: 'Kalendarium',
				text: 'Jeśli chcesz zrozumieć sztukę w kontekście historycznym, możesz skorzystać z własnego kalendarium i nakładać na interaktywną oś czasu dzieła oraz wydarzenia i okresy historyczne, by badać wpływ dziejów świata na sztukę i odwrotnie.'
			},
			{
				title: 'Kronika',
				text: 'Twoje atelier może też posłużyć jako dziennik Twoich spotkań ze sztuką – możesz skorzystać z kroniki i zapisywać w niej swoje wizyty w muzeach czy galeriach. Dzięki temu Twoja kolekcja zyska dodatkowy, osobisty wymiar.'
			},
			{
				title: 'Powtórki',
				text: 'Jeśli chcesz efektywnie utrwalać swoją wiedzę o sztuce, możesz zmierzyć się z codziennymi wyzwaniami powtórkowymi, w których klasyczne fiszki i różnorodne quizy przeplatają się tak, by każde dzieło wracało do Ciebie wtedy, gdy zaczynasz je zapominać.'
			}
		],
		closingTitle: 'Chcesz zbudować własną kolekcję sztuki?',
		closingText:
			'Otwórz atelier już teraz i daj swojej wiedzy o sztuce miejsce, w którym będzie mogła rosnąć.',
		contact: 'kontakt@studyatelier.art'
	},
	menu: {
		label: 'Menu',
		open: 'Otwórz menu',
		close: 'Zamknij menu',
		expand: 'Rozwiń menu',
		collapse: 'Zwiń menu',
		atelier: 'Atelier',
		cardIndex: 'Kartoteka',
		glossary: 'Słowniczek',
		timeline: 'Kalendarium',
		chronicle: 'Kronika',
		review: 'Powtórki',
		displayCase: 'Gablota',
		displayCaseNew: 'Gablota, nowe',
		reviewWaiting: (count: number): string => `${workCount(count)} na dziś`,
		trash: 'Archiwum',
		settings: 'Ustawienia',
		settingsLink: (name: string, email: string): string =>
			name === email ? `Ustawienia, ${email}` : `Ustawienia, ${name}, ${email}`,
		feedback: 'Zgłoś uwagę',
		lightTheme: 'Jasny motyw',
		darkTheme: 'Ciemny motyw',
		signOut: 'Wyloguj się'
	},
	settings: {
		title: 'Ustawienia',
		lead: 'Tutaj możesz zmienić swoje dane oraz zarządzać preferencjami dotyczącymi funkcjonowania Twojego atelier.',
		tabsLabel: 'Części ustawień',
		tabs: {
			profile: 'Profil',
			account: 'Konto',
			review: 'Powtórki',
			view: 'Widok dzieła',
			sources: 'Źródła',
			data: 'Dane'
		},
		loadErrorTitle: 'Nie udało się wczytać ustawień',
		profile: {
			avatarAlt: 'Twoje zdjęcie',
			addPhoto: 'Dodaj zdjęcie',
			changePhoto: 'Zmień zdjęcie',
			photoHint: 'Zdjęcie zostanie automatycznie dopasowane do rozmiaru awatara',
			removePhoto: 'Usuń zdjęcie',
			name: 'Imię',
			rankForm: 'Forma stopni',
			rankFormMasculine: 'Kustosz',
			rankFormFeminine: 'Kustoszka',
			email: 'Adres e-mail',
			emailHint: 'Adres podany przy rejestracji. Zmienisz go w zakładce „Konto”.',
			nameTooLong: (max: number): string => `Imię może mieć najwyżej ${max} znaków.`,
			save: 'Zapisz profil',
			saved: 'Zapisano profil.',
			errorTitle: 'Nie udało się zapisać profilu',
			failed: 'Nie udało się zapisać profilu. Spróbuj jeszcze raz.',
			avatarQuotaFull:
				'Brakuje miejsca na zdjęcia, więc awatara nie da się teraz zapisać. Usuń niepotrzebne zdjęcia dzieł. Miejsce zwolni się w ciągu doby.'
		},
		account: {
			emailTitle: 'Adres e-mail',
			currentEmail: (email: string): string => `Obecny adres: ${email}`,
			newEmail: 'Nowy adres e-mail',
			emailSubmit: 'Zmień adres',
			sameEmail: 'To jest Twój obecny adres.',
			emailSentTitle: 'Link wysłany',
			emailSent: 'Wysłałem link na stary i na nowy adres. Kliknij oba, a zmiana wejdzie w życie.',
			emailPending: (email: string): string =>
				`Czeka na potwierdzenie zmiany na ${email}. Kliknij w linki, które zostały wysłane na stary i na nowy adres, aby dokończyć procedurę.`,
			emailChanged: 'Adres e-mail został pomyślnie zmieniony.',
			emailErrorTitle: 'Nie udało się zmienić adresu',
			passwordTitle: 'Zmiana hasła',
			currentPassword: 'Obecne hasło',
			newPassword: 'Nowe hasło',
			signOutOthers: 'Wyloguj mnie na innych urządzeniach',
			submit: 'Zmień hasło',
			submitting: 'Zmienianie…',
			wrongCurrent: 'To nie jest Twoje obecne hasło.',
			sameAsCurrent: 'Nowe hasło musi być inne niż obecne.',
			changed: 'Hasło zostało pomyślnie zmienione.',
			errorTitle: 'Nie udało się zmienić hasła',
			othersFailedTitle: 'Hasło zostało pomyślnie zmienione',
			othersFailed:
				'Nie udało się wylogować Cię na innych urządzeniach. Wyloguj się tam ręcznie albo zmień hasło jeszcze raz.',
			deleteTitle: 'Usuń konto',
			deleteDescription:
				'Usunięcie konta usuwa na zawsze całe atelier: dzieła, zdjęcia, notatki, Słowniczek, Kalendarium, Kronikę i historię powtórek.',
			deleteOpen: 'Usuń konto…',
			deleteConfirmTitle: 'Usunąć konto na zawsze?',
			deleteConfirmDescription:
				'Konto i całe atelier znikną bezpowrotnie. Jeśli chcesz coś zachować, najpierw pobierz kopię w zakładce Dane.',
			deleteToData: 'Przejdź do zakładki Dane',
			deletePassword: 'Hasło',
			deleteSubmit: 'Usuń konto',
			deleting: 'Usuwanie konta…',
			deleteFailed: 'Nie udało się usunąć konta. Nic nie zostało usunięte, spróbuj jeszcze raz.',
			deleted: 'Konto zostało usunięte razem z całym atelier.'
		},
		preferences: {
			sessionSize: 'Z ilu dzieł powinna składać się pojedyncza sesja?',
			newPerDay: 'Ile nowych dzieł powinno codziennie dołączać do puli powtórek?',
			form: 'Jaka powinna być domyślna forma powtórek?',
			formHint: 'Zmienisz ją też na starcie powtórki.',
			kinds: 'Jakich elementów mogą dotyczyć quizy powtórkowe?',
			kindLabels: {
				quiz_image: 'Dopasowywanie dzieła do tytułu',
				quiz_title: 'Dopasowywanie tytułu do dzieła',
				quiz_author: 'Dopasowywanie autora do dzieła',
				quiz_style: 'Dopasowywanie stylu do dzieła',
				quiz_pin: 'Dopasowywanie detalu do definicji'
			},
			kindsHint: 'Zostaw zaznaczony przynajmniej jeden rodzaj.',
			glossaryQuestions: 'Ile pytań dodatkowych ze Słowniczka dołączać do sesji?',
			free: 'Proponuj powtórkę swobodną po skończonym dniu',
			careerShown: 'Pokazuj stopień i Gablotę',
			careerShownHint: 'Punkty i eksponaty liczą się dalej, także gdy są ukryte.',
			showPins: 'Pokazuj pinezki od razu po otwarciu dzieła',
			loupe: 'Włączaj lupę od razu po otwarciu dzieła',
			sourcesHint:
				'Jeśli zaznaczysz opcję, materiały dotyczące danej wartości będą pobierać się automatycznie po uzupełnieniu potrzebnych do pobrania szczegółów. ' +
				'Po wyłączeniu nadal możesz korzystać z podpowiedzi, używając odpowiedniego przycisku w formularzu.',
			fetchImage: 'Automatycznie szukaj zdjęcia nowego dzieła w Wikidata i Commons',
			fetchDefinition: 'Automatycznie uzupełniaj definicję hasła ze Słowniczka z Wikipedii',
			fetchForms: 'Automatycznie podpowiadaj odmianę wyrazu z Wikisłownika dla hasła ze Słowniczka',
			fetchEvent: 'Automatycznie uzupełniaj opis i daty wydarzenia z Wikipedii',
			save: 'Zapisz ustawienia',
			saved: 'Zapisano ustawienia.',
			errorTitle: 'Nie udało się zapisać ustawień'
		},
		data: {
			exportTitle: 'Eksport',
			exportDescription:
				'Pobierz całe atelier w jednym pliku ZIP: dzieła z notatkami, własne zdjęcia, pinezki, Słowniczek, Kalendarium, a także Archiwum i historię powtórek.',
			exportHint:
				'Zdjęcia z Wikimedia Commons i z linków pozostaną odnośnikami. Duże atelier lepiej wyeksportować na komputerze.',
			exportButton: 'Pobierz atelier',
			reading: 'Zbieranie dzieł…',
			images: (done: number, total: number): string => `Zdjęcia: ${done} z ${total}`,
			packing: 'Pakowanie pliku…',
			exported: 'Plik z atelier został pomyślnie pobrany.',
			importTitle: 'Import',
			importDescription:
				'Wczytaj plik z eksportu do pustego atelier. Dzieła, a także harmonogram powtórek zostaną takie same jak w kopii.',
			importHint:
				'Import niczego nie łączy ani nie nadpisuje, dlatego działa tylko w pustym atelier.',
			importButton: 'Wybierz plik ZIP',
			importFilled: 'W tym atelier już coś jest, więc nie można wczytać kopii.',
			importReading: 'Odczytywanie pliku…',
			importSaving: 'Zapisywanie atelier…',
			imported: 'Atelier zostało pomyślnie wczytane.',
			importErrorTitle: 'Nie udało się wczytać pliku',
			importNotZip: 'To nie jest plik ZIP.',
			importNoData: 'W tym pliku nie ma atelier.json, więc to nie wygląda na eksport z Atelier.',
			importNotAtelier: 'Ten plik nie pochodzi z eksportu Atelier.',
			importNewer:
				'Ten plik pochodzi z nowszej wersji Atelier. Odśwież aplikację i spróbuj jeszcze raz.',
			importBroken: 'Nie udało się odczytać tego pliku. Jest uszkodzony albo niepełny.',
			importFailed:
				'Nie udało się wczytać atelier. Nic nie zostało zmienione, spróbuj jeszcze raz.',
			importNotEmpty: 'Atelier nie jest już puste, więc nic nie zostało wczytane.',
			importLimit:
				'Ta kopia nie mieści się w limitach jednego atelier, więc nic nie zostało wczytane.',
			importTooMany: (what: string, limit: number): string =>
				`Ta kopia ma więcej ${what}, niż zmieści jedno atelier (${limit}), więc nic nie zostało wczytane.`,
			importTables: {
				artworks: 'dzieł',
				category_values: 'wartości w Kartotece',
				glossary_entries: 'pojęć w Słowniczku',
				timeline_events: 'wydarzeń w Kalendarium',
				visits: 'wizyt w Kronice',
				artwork_fields: 'własnych pól',
				artwork_values: 'wartości przypisanych do dzieł',
				visit_artworks: 'dzieł przypisanych do wizyt',
				artwork_field_entries: 'wpisów we własnych polach',
				review_log: 'odpowiedzi w powtórkach',
				feedback: 'zgłoszeń'
			},
			storageTitle: 'Miejsce na zdjęcia',
			storageUsage: (usedMegabytes: string, quotaMegabytes: string): string =>
				`Twoje zdjęcia zajmują ${usedMegabytes} MB z ${quotaMegabytes} MB.`,
			errorTitle: 'Nie udało się wyeksportować atelier',
			failed:
				'Spróbuj jeszcze raz. Jeśli problem się powtarza, spróbuj wykonać eksport na innym urządzeniu.',
			imageFailed:
				'Nie udało się pobrać jednego z Twoich zdjęć, a bez niego kopia byłaby niepełna. Spróbuj jeszcze raz.'
		}
	},
	atelier: {
		title: 'Atelier',
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`,
		filteredCount: (shown: number, total: number): string =>
			`${shown} z ${total} ${plural(total, { one: 'dzieła', few: 'dzieł', many: 'dzieł' })}`,
		search: 'Szukaj po tytule lub autorze',
		sort: {
			label: 'Kolejność',
			recent: 'Ostatnio dodane',
			year: 'Według daty powstania',
			author: 'Według autorów'
		},
		grouping: {
			label: 'Grupuj',
			button: (levels: string): string => `Grupowanie: ${levels}`,
			off: 'wyłączone',
			hint: 'Kliknij jeszcze raz na najniższy zaznaczony poziom, żeby go wyłączyć.',
			steps: {
				era: 'Epoka',
				period: 'Okres',
				style: 'Styl'
			},
			noEra: 'Bez epoki',
			noPeriod: 'Bez okresu',
			noStyle: 'Bez stylu',
			collapseAll: 'Zwiń wszystkie',
			expandAll: 'Rozwiń wszystkie'
		},
		periods: {
			label: 'Epoki'
		},
		authors: {
			label: 'Autorzy'
		},
		add: 'Dodaj dzieło',
		welcome: {
			title: 'Twoje atelier jest jeszcze puste',
			text: 'Atelier to Twoja prywatna kolekcja dzieł, które poznajesz. Mogą to być obrazy zobaczone w muzeum, budowle z podróży albo rzeźby omawiane na wykładzie. Każde dzieło zapisujesz i opisujesz po swojemu. Z czasem z tych opisów powstaje mapa historii sztuki, którą tworzysz krok po kroku.',
			howTitle: 'Jak to działa?',
			steps: [
				{
					title: 'Dodaj dzieło',
					text: 'Zacznij od tytułu i autora, czyli od tego, co zwykle zapamiętujesz najpierw. Obraz dzieła możesz wyszukać w Wikimedia Commons albo dodać własne zdjęcie, na przykład zrobione w muzeum. Datę powstania, epokę, styl czy technikę uzupełnisz od razu albo wtedy, gdy dowiesz się o dziele więcej.'
				},
				{
					title: 'Opisuj i łącz',
					text: 'Wszystko, co wpisujesz przy dziełach, trafia do Kartoteki. Tam widzisz, które dzieła łączy ten sam autor, styl, epoka albo miejsce. Nowe pojęcia możesz zapisać w Słowniczku, a w notatkach odsyłać do innych dzieł i do wartości z Kartoteki.'
				},
				{
					title: 'Powtarzaj',
					text: 'Kiedy w atelier zbierze się dwadzieścia dzieł z obrazami, możesz zacząć powtórki. To krótkie codzienne sesje: widzisz dzieło i sprawdzasz, czy pamiętasz, co to jest. Dzieła, które rozpoznajesz bez trudu, wracają rzadziej, a te sprawiające kłopot częściej. Dzięki temu nauka zajmuje kilka minut dziennie.'
				}
			]
		},
		addFirst: 'Dodaj pierwsze dzieło',
		noResultsTitle: 'Nie udało się znaleźć żadnego pasującego dzieła',
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment tytułu lub nazwiska.`,
		clearSearch: 'Wyczyść wyszukiwanie',
		loadErrorTitle: 'Nie udało się wczytać atelier',
		imagesUnavailableTitle: 'Nie wszystkie obrazy wczytały się poprawnie',
		imagesUnavailable: 'Część zdjęć nie jest teraz dostępna. Spróbuj jeszcze raz za chwilę.',
		retryImages: 'Spróbuj ponownie',
		year: (year: number, approximate: boolean): string =>
			`${approximate ? 'ok. ' : ''}${year < 0 ? `${-year} p.n.e.` : year}`,
		yearRange: (from: string, to: string): string => `${from} – ${to}`,
		span: (from: number, to: number, approximate: boolean): string => {
			const prefix = approximate ? 'ok. ' : '';
			if (from < 0 && to < 0) return `${prefix}${-from}–${-to} p.n.e.`;
			if (from > 0 && to > 0) return `${prefix}${from}–${to}`;
			const year = (value: number): string => (value < 0 ? `${-value} p.n.e.` : `${value} n.e.`);
			return `${prefix}${year(from)} – ${year(to)}`;
		},
		filters: {
			title: 'Filtry',
			button: 'Filtry',
			buttonWithCount: (count: number): string => `Filtry (${count})`,
			viewButton: 'Widok',
			viewTitle: 'Widok',
			closePanel: 'Zamknij filtry',
			activeLabel: 'Aktywne filtry',
			clear: 'Wyczyść filtry',
			removeTag: (label: string): string => `Usuń filtr: ${label}`,
			noResultsTitle: 'Nie udało się znaleźć żadnego pasującego dzieła',
			noResults:
				'Żadne dzieło nie pasuje do wybranych przez Ciebie filtrów. Spróbuj zmienić kryteria filtrowania i wyszukać jeszcze raz.',
			noFavourites: 'Nie masz jeszcze żadnych ulubionych dzieł.',
			showResults: (count: number): string =>
				`Pokaż ${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`,
			fields: {
				eras: 'Epoka',
				types: 'Typ',
				years: 'Rok powstania',
				authors: 'Autorzy',
				periods: 'Okres',
				styles: 'Styl',
				materials: 'Materiał',
				locations: 'Miejsce',
				missing: 'Do uzupełnienia',
				favourites: 'Ulubione',
				seen: 'Widziane na żywo',
				ticked: 'Zaznaczone'
			},
			ownField: 'Własne pole',
			tagFields: {
				eras: 'Epoka',
				types: 'Typ',
				years: 'Rok',
				authors: 'Autor',
				periods: 'Okres',
				styles: 'Styl',
				materials: 'Materiał',
				locations: 'Miejsce',
				missing: 'Do uzupełnienia',
				favourites: 'Ulubione',
				seen: 'Widziane na żywo'
			},
			tag: (field: string, value: string): string => `${field} ${value}`,
			unknownAuthor: 'Autor nieznany',
			missing: {
				image: 'bez obrazu',
				year: 'bez roku',
				era: 'bez epoki',
				period: 'bez okresu',
				type: 'bez typu'
			},
			yearFrom: 'Od',
			yearTo: 'Do',
			beforeCommonEra: 'p.n.e.',
			yearsBetween: (from: number, to: number): string =>
				`${from < 0 ? `${-from} p.n.e.` : from}–${to < 0 ? `${-to} p.n.e.` : to}`,
			yearsFrom: (from: number): string => `od ${from < 0 ? `${-from} p.n.e.` : from}`,
			yearsTo: (to: number): string => `do ${to < 0 ? `${-to} p.n.e.` : to}`,
			searchValues: (field: string): string => `Szukaj: ${field.toLocaleLowerCase('pl')}`,
			showMore: 'Pokaż więcej',
			showLess: 'Pokaż mniej',
			valueCount: (name: string, count: number): string => `${name}, ${count}`
		}
	},
	artworkForm: {
		newTitle: 'Nowe dzieło',
		editTitle: (number: string): string => `Edytuj dzieło ${number}`,
		back: 'Wróć do atelier',
		notFoundTitle: (number: string): string => `Nie ma dzieła ${number}`,
		loadErrorTitle: 'Nie udało się wczytać dzieła',
		image: 'Obraz',
		addImage: 'Dodaj kolejny obraz',
		mainImage: 'Główne',
		setMainImage: 'Ustaw jako główne',
		imageSlot: (number: number, count: number): string => `Obraz ${number} z ${count}`,
		findImage: 'Znajdź obraz',
		ownImage: 'Dodaj własny',
		changeOwnImage: 'Zmień własny',
		ownImageTitle: 'Dodaj własny obraz',
		changeOwnImageTitle: 'Zmień własny obraz',
		removeImage: 'Usuń obraz',
		chooseFile: 'Wybierz plik z dysku',
		fileHint: (formats: string, maxMegabytes: number): string =>
			`Akceptowalne formaty zdjęć to: ${formats}. Pliki większe niż ${maxMegabytes} MB zostaną automatycznie zmniejszone.`,
		pasteFromClipboard: 'Wklej ze schowka',
		pasteHintLead: 'Masz obraz w schowku? Po prostu naciśnij',
		pasteHintForm: 'Obraz ze schowka możesz też wkleić tutaj:',
		replaceImageTitle: 'Zastąpić obecny obraz?',
		replaceImageDescription: 'Wklejony obraz zajmie jego miejsce.',
		keepImage: 'Zostaw obecny',
		removeImageTitle: 'Usunąć obraz?',
		imageUrl: 'Jeśli wolisz, podaj po prostu adres obrazka',
		imageUrlPlaceholder: 'https://…',
		useImageUrl: 'Użyj',
		usingImageUrl: 'Wczytywanie…',
		ownImageCredit: 'Twój obraz, widoczny tylko dla Ciebie.',
		ownImageUrlCredit: (host: string): string =>
			`Twój obraz z adresu ${host}, widoczny tylko dla Ciebie.`,
		findImageHint: 'Wpisz tytuł i autora, żeby znaleźć obraz.',
		chooseOtherImage: 'Wybierz inny',
		matchSearching: 'Wyszukiwanie obrazu w Wikidata…',
		matchFound: (details: string): string => `Z Wikidata: ${details}`,
		matchNone:
			'Nie udało się odnaleźć tego dzieła w Wikidata. Dodaj własny obraz z linku lub bezpośrednio z komputera.',
		title: 'Tytuł',
		authors: 'Autorzy',
		authorUnknown: 'Autor nieznany',
		year: 'Rok powstania',
		spanTitle: 'Lata powstania',
		spanSwitch: 'Od – do',
		spanFrom: 'Od',
		spanTo: 'Do',
		beforeCommonEraFrom: 'p.n.e. (od)',
		beforeCommonEraTo: 'p.n.e. (do)',
		beforeCommonEra: 'p.n.e.',
		yearApproximate: 'ok.',
		type: 'Typ',
		era: 'Epoka',
		period: 'Okres',
		periodLocked: 'Najpierw wybierz epokę.',
		style: 'Styl',
		styleLocked: 'Najpierw wybierz okres.',
		material: 'Materiał',
		location: 'Miejsce',
		locationHint: 'Gdzie dzieło znajduje się teraz?',
		notesPlaceholder: 'Co warto zapamiętać? Skąd znasz to dzieło?',
		notesLinkHint:
			'Wpisz @, żeby dodać odnośnik do autora, epoki albo miejsca, albo #, żeby dodać odnośnik do dzieła.',
		saveAndNext: 'Zapisz i dodaj kolejne',
		errorTitle: 'Nie udało się zapisać dzieła',
		saved: (number: string): string => `Zapisano dzieło ${number}.`,
		changesSaved: (number: string): string => `Zapisano zmiany w ${number}.`,
		discardTitle: 'Odrzucić zmiany?',
		keepEditing: 'Wróć do formularza',
		discard: 'Odrzuć'
	},
	duplicateDialog: {
		title: 'Masz już takie dzieło',
		description: (numbers: string, count: number, advice: string): string =>
			`W atelier ${count === 1 ? 'jest' : 'są'} już ${numbers} o tym samym tytule i autorach. ${advice}`,
		save: {
			advice: 'Jeśli to inne dzieło, po prostu je zapisz.',
			back: 'Wróć do formularza',
			confirm: 'Zapisz mimo to'
		},
		restore: {
			advice: 'Jeśli to inne dzieło, po prostu je przywróć.',
			back: 'Zostaw w Archiwum',
			confirm: 'Przywróć mimo to'
		}
	},
	artworkView: {
		previousImage: 'Poprzedni obraz',
		nextImage: 'Następny obraz',
		back: 'Atelier',
		addImage: 'Dodaj obraz',
		information: 'Informacje',
		showInformation: 'Pokaż informacje',
		hideInformation: 'Zamknij informacje',
		openImage: 'Powiększ obraz',
		closeImage: 'Zamknij powiększenie',
		empty: 'Nie wpisano',
		previous: 'Poprzednie dzieło',
		next: 'Następne dzieło'
	},
	loupe: {
		label: 'Lupa',
		leave: 'Wyłącz lupę: Esc, prawy przycisk albo kliknięcie obok',
		unavailable: 'Rozdzielczość tego obrazu jest zbyt mała, żeby można było skorzystać z lupy.',
		tooLarge: 'Ten obraz z adresu jest zbyt duży, żeby można było skorzystać z lupy.',
		level: (level: number): string => `${level.toLocaleString('pl', { maximumFractionDigits: 1 })}×`
	},
	favourite: {
		add: 'Dodaj do ulubionych',
		remove: 'Usuń z ulubionych',
		added: 'Dodano do ulubionych.',
		removed: 'Usunięto z ulubionych.',
		failed: 'Nie udało się zapisać zmiany. Spróbuj jeszcze raz.'
	},
	review: {
		title: 'Powtórki',
		loadErrorTitle: 'Nie udało się wczytać powtórek',
		startErrorTitle: 'Nie udało się rozpocząć sesji powtórkowej',
		waiting: (count: number): string => `Na dziś do powtórki zaplanowane masz ${workCount(count)}`,
		plan: (known: number, fresh: number): string =>
			[
				known > 0
					? `${known} ${plural(known, { one: 'powracające', few: 'powracające', many: 'powracających' })}`
					: '',
				fresh > 0 ? `${fresh} ${plural(fresh, { one: 'nowe', few: 'nowe', many: 'nowych' })}` : ''
			]
				.filter(Boolean)
				.join(' i '),
		streak: (days: number): string =>
			`Seria: ${days} ${plural(days, { one: 'dzień', few: 'dni', many: 'dni' })} z powtórkami z rzędu`,
		allDoneTitle: 'Nic nowego do powtórki',
		allDone: (when: string): string => `Kolejne dzieła będą na Ciebie czekać ${when}.`,
		tooFewTitle: (minimum: number): string =>
			`Powtórki staną się dostępne przy ${minimum} dziełach`,
		tooFew: (minimum: number, missing: number): string =>
			`Sesje powtórkowe potrzebują co najmniej ${minimum} dzieł z obrazami w Twoim atelier. Obecnie brakuje ich jeszcze ${missing}.`,
		options: 'Zmień zakres lub formę',
		scope: 'Co powtarzamy?',
		scopes: {
			all: 'Cała kolekcja'
		},
		form: 'W jakiej formie?',
		forms: {
			mixed: 'Mieszane',
			flashcards: 'Fiszki',
			quizzes: 'Quizy'
		},
		formHints: {
			mixed:
				'Domyślny tryb łączący quizy dla dzieł, które dopiero zaczynasz powtarzać, i fiszki dla takich, które możesz pamiętać już całkiem dobrze.',
			flashcards:
				'Wyłącznie fiszki, w których samodzielnie przypominasz sobie informacje o dziele, a następnie odkrywasz kartę i oceniasz, jak Ci poszło.',
			quizzes: 'Wyłącznie pytania, w których wybierasz poprawną spośród czterech odpowiedzi.'
		},
		definitions: 'Dołącz definicje ze Słowniczka',
		definitionsHint: (count: number): string =>
			`Pytania dodatkowe: ${count} ${plural(count, { one: 'losowa definicja', few: 'losowe definicje', many: 'losowych definicji' })}. Nie zmieniają planu powtórek.`,
		start: 'Zacznij powtórkę',
		free: 'Powtórka swobodna',
		freeHint:
			'Dodatkowa runda losowo wybranych dzieł, które już powtarzasz. Nie zmienia planu powtórek ani nie wpływa na obecną serię.',
		freeTag: 'Tryb swobodny',
		howTitle: 'Jak działają powtórki?',
		how: 'Do puli codziennie dobierane są nowe dzieła, które dodasz do atelier, a także takie, które wymagają powtórki. Im lepiej pamiętasz dzieło, tym rzadziej będzie pojawiać się w kolejnych dniach.',
		knowledge: 'Jak dobrze znasz swoje atelier?',
		knowledgeGroups: {
			settled: { label: 'Utrwalone', hint: 'Pamiętasz je dłużej niż tydzień.' },
			learning: {
				label: 'W trakcie nauki',
				hint: 'Powtórki rozpoczęte, ale jeszcze się utrwalają.'
			},
			fresh: { label: 'Nowe', hint: 'Czekają na pierwszą powtórkę.' }
		},
		troubles: 'Ostatnio sprawiały kłopot',
		stop: 'Przerwij',
		stopTitle: 'Przerwać teraz?',
		stopDescription: 'Twoje odpowiedzi do tej pory są już zapisane.',
		freeStopDescription: 'Odpowiedzi w powtórce swobodnej nie są zapisywane.',
		keepGoing: 'Powtarzaj dalej',
		progress: (position: number, total: number): string => `${position} z ${total}`,
		progressLabel: 'Postęp powtórki',
		flashcard: {
			question: 'Czy poznajesz to dzieło?',
			hint: 'Spróbuj przypomnieć sobie jak najwięcej szczegółów dotyczących tego dzieła sztuki: tytuł, autora, czas i styl, w którym powstało. Następnie odkryj kartę z informacjami i oceń, jak dobrze je pamiętasz.',
			imageAlt: 'Dzieło do rozpoznania',
			reveal: 'Odkryj kartę',
			rate: 'Jak dobrze pamiętasz to dzieło?',
			notes: 'Twoja notatka'
		},
		quiz: {
			imageQuestion: { start: 'Gdzie znajduje się', end: '?' },
			imageHint: 'Wybierz właściwe dzieło.',
			imageAlt: (position: number): string => `Obraz ${position}`,
			openImage: (position: number): string => `Powiększ obraz ${position}`,
			titleQuestion: 'Jaki tytuł nosi to dzieło sztuki?',
			authorQuestion: 'Kto jest autorem tego dzieła?',
			styleQuestion: 'W jakim stylu powstało to dzieło?',
			styleHint: 'Zwróć uwagę na formę, materiał i kompozycję.',
			pinQuestion: 'Co to jest?',
			definitionTag: 'Pytanie dodatkowe ze Słowniczka',
			definitionQuestion: 'Jakie pojęcie opisuje ta definicja?',
			maskedTerm: 'ukryte pojęcie',
			definitionRetry: 'Wrócimy do niej za chwilę.',
			pinHint: 'Wybierz pojęcie, które pasuje do zaznaczonego na zdjęciu miejsca.',
			options: 'Odpowiedzi',
			right: 'Tak, to',
			wrong: 'Nie, to',
			retry: 'Wrócimy do niego za chwilę.',
			rightOption: 'dobra odpowiedź',
			chosenOption: 'Twój wybór',
			next: 'Następne',
			reasons: {
				author: 'ten sam autor',
				style: 'ten sam styl',
				period: 'ten sam okres'
			},
			reasonLabels: {
				author: 'Ten sam autor',
				style: 'Ten sam styl',
				period: 'Ten sam okres'
			}
		},
		ratings: {
			1: 'Nie wiem',
			2: 'Prawie',
			3: 'Wiem'
		},
		saveErrorTitle: 'Nie udało się zapisać odpowiedzi',
		saveFailed: 'Nie udało się zapisać odpowiedzi. Spróbuj jeszcze raz.',
		done: 'Gotowe',
		summary: (count: number, minutes: number, tomorrow: number): string =>
			reviewedToday(count, minutes) +
			(tomorrow > 0
				? ` Jutro ${plural(tomorrow, { one: 'będzie', few: 'będą', many: 'będzie' })} na Ciebie czekać ${workCount(tomorrow)}.`
				: ''),
		groups: {
			1: 'Do poprawki',
			2: 'Prawie',
			3: 'Opanowane'
		},
		freeSummary: (count: number, minutes: number): string =>
			`${reviewedToday(count, minutes)} Plan powtórek się nie zmienił.`,
		nextRound: (count: number): string => `Następna runda (${count})`,
		freeNextRound: 'Kolejna runda swobodna'
	},
	imageSearch: {
		title: 'Które to dzieło?',
		description: (title: string, authors: string): string =>
			`Wyniki z Wikidata dla „${title}”${authors ? `, ${authors}` : ''}. Kliknij ten, który pasuje do dodawanego przez Ciebie dzieła.`,
		searching: 'Wyszukiwanie w Wikidata…',
		empty:
			'Nie udało się odnaleźć w Wikidata dzieła o takim tytule. Sprawdź pisownię albo dodaj własny obraz.',
		none: 'Żadne z tych',
		errorTitle: 'Nie udało się przeszukać Wikidata',
		retry: 'Wyszukaj jeszcze raz',
		century: (century: string, beforeCommonEra: boolean): string =>
			`${century} w.${beforeCommonEra ? ' p.n.e.' : ''}`,
		personTitle: 'Który to autor?',
		personDescription: (name: string): string =>
			`Wyniki z Wikidata dla „${name}”. Kliknij portret, który chcesz dodać.`,
		personEmpty:
			'Nie udało się odnaleźć w Wikidata portretu takiej osoby. Sprawdź pisownię albo dodaj własny portret.',
		personNone: 'Żaden z tych'
	},
	imageSearchErrors: {
		rateLimited: 'Wikidata dostaje teraz sporo zapytań. Odczekaj chwilę i spróbuj jeszcze raz.',
		network: 'Nie udało się połączyć z Wikidata. Sprawdź internet i spróbuj jeszcze raz.',
		failed: 'Wikidata nie odpowiedziała poprawnie. Spróbuj jeszcze raz za chwilę.'
	},
	artworkTypes: {
		architecture: 'Architektura',
		painting: 'Malarstwo',
		sculpture: 'Rzeźba',
		drawing: 'Rysunek',
		printmaking: 'Grafika',
		applied_arts: 'Sztuka użytkowa',
		photography: 'Fotografia',
		other: 'Inne'
	},
	eras: {
		prehistory: { name: 'prehistoria', years: 'do 3000 p.n.e.' },
		antiquity: { name: 'starożytność', years: 'do 476' },
		middle_ages: { name: 'średniowiecze', years: '476–1492' },
		early_modern: { name: 'nowożytność', years: '1492–1789' },
		modern: { name: 'nowoczesność', years: '1789–1945' },
		contemporary: { name: 'współczesność', years: 'od 1945' }
	},
	collectionErrors: {
		network:
			'Nie udało się połączyć z serwerem. Sprawdź swoje połączenie z internetem i odśwież stronę.'
	},
	artworkErrors: {
		titleRequired: 'Wpisz tytuł dzieła.',
		authorRequired: 'Dodaj autora albo zaznacz opcję „Autor nieznany”.',
		yearRequired: 'Wpisz rok, żeby zaznaczyć „p.n.e.” albo „ok.”.',
		spanEndRequired: 'Wpisz rok końcowy.',
		spanOrder: 'Rok końcowy nie może być wcześniejszy niż początkowy.',
		yearInvalid: 'Rok to liczba całkowita od 1 w górę. Dla lat przed naszą erą zaznacz „p.n.e.”.',
		yearTooEarly: 'Rok przed naszą erą może sięgać najwyżej 3 000 000 p.n.e.',
		yearTooLate: 'Rok nie może być późniejszy niż 2500.',
		invalid: 'Niektóre pola się nie zgadzają. Sprawdź je i zapisz jeszcze raz.',
		conflict:
			'Nie udało się zapisać, bo dane zmieniły się w międzyczasie. Odśwież stronę i spróbuj jeszcze raz.',
		notFound: 'Nie ma takiego dzieła w Twoim atelier. Mogło trafić do Archiwum.'
	},
	ownImageErrors: {
		fileType: (formats: string): string =>
			`Tego pliku nie da się dodać jako obrazu. Wybierz zdjęcie w jednym z akceptowanych formatów: ${formats}.`,
		fileTooLarge: (maxMegabytes: number): string =>
			`Ten plik ma więcej niż ${maxMegabytes} MB. Wybierz mniejszy.`,
		shrinkFailed: 'Nie udało się zmniejszyć tego obrazu. Wybierz mniejszy.',
		fileUnreadable: 'Nie udało się otworzyć tego obrazu. Wybierz inny plik.',
		clipboardEmpty:
			'W schowku nie ma teraz obrazu. Skopiuj go albo zrób zrzut ekranu i spróbuj jeszcze raz.',
		clipboardDenied:
			'Przeglądarka nie pozwoliła zajrzeć do schowka. Naciśnij Ctrl+V albo wybierz plik z dysku.',
		urlRequired: 'Wklej adres obrazka.',
		urlInvalid: 'Wklej pełny adres obrazka, zaczynający się od https://.',
		urlUnreadable:
			'Nie udało się wczytać obrazka z tego adresu. Sprawdź, czy prowadzi wprost do obrazka.',
		uploadNetwork: 'Nie udało się wysłać obrazu. Sprawdź internet i spróbuj jeszcze raz.',
		uploadFailed: 'Nie udało się wysłać obrazu. Spróbuj jeszcze raz za chwilę.',
		quotaFull: (quotaMegabytes: string): string =>
			`Ten plik nie zmieści się w ${quotaMegabytes} MB na Twoje zdjęcia. Dodaj obraz z linku albo usuń niepotrzebne zdjęcia. Miejsce zwolni się w ciągu doby.`
	},
	announcements: {
		label: 'Komunikat',
		dismiss: 'Zamknij',
		dismissLabel: 'Zamknij komunikat'
	},
	newVersion: {
		message: 'Pojawiła się nowa wersja aplikacji. Odśwież stronę, żeby z niej skorzystać.',
		reload: 'Odśwież'
	},
	legal: {
		terms: 'Regulamin',
		privacy: 'Polityka prywatności',
		linksLabel: 'Dokumenty',
		version: (date: string): string => `Obowiązuje od ${date}.`,
		consentAccept: 'Akceptuję',
		consentTerms: 'Regulamin',
		consentDeclare: 'i oświadczam, że zapoznałem(-am) się z',
		consentPrivacy: 'Polityką prywatności',
		consentRequired: 'Zaakceptuj Regulamin, żeby założyć konto.',
		updateTitle: 'Regulamin i Polityka prywatności zostały zmienione',
		updateDescription: (date: string): string =>
			`Nowa wersja obowiązuje od ${date}. Przeczytaj zmiany i zaakceptuj Regulamin, żeby dalej korzystać z atelier. Jeśli nie akceptujesz zmian, możesz pobrać kopię atelier i usunąć konto w ustawieniach.`,
		updateAccept: 'Akceptuję',
		updateSettings: 'Przejdź do ustawień',
		accepted: (date: string): string => `Zaakceptowana wersja Regulaminu: ${date}`,
		acceptFailed: 'Nie udało się zapisać akceptacji. Spróbuj jeszcze raz.'
	},
	limits: {
		artworks: (limit: number): string =>
			`W atelier zmieści się ${limit} dzieł, razem z tymi w Archiwum. Usuń z Archiwum te, których już nie potrzebujesz, żeby dodać nowe.`,
		categoryValues: (limit: number): string =>
			`W Kartotece zmieści się ${limit} wartości. Usuń te, których nie ma przy żadnym dziele, żeby dodać nowe.`,
		glossaryEntries: (limit: number): string =>
			`W Słowniczku zmieści się ${limit} pojęć. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		timelineEvents: (limit: number): string =>
			`W Kalendarium zmieści się ${limit} wydarzeń. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		visits: (limit: number): string =>
			`W Kronice zmieści się ${limit} wizyt. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		artworkFields: (limit: number): string =>
			`W atelier zmieści się ${limit} własnych pól. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		artworkValues: (limit: number): string =>
			`Dzieła w atelier mogą mieć razem ${limit} wartości z Kartoteki. Usuń z dzieł te, których już nie potrzebujesz, żeby dodać nowe.`,
		visitArtworks: (limit: number): string =>
			`Wizyty w Kronice mogą mieć razem ${limit} obejrzanych dzieł. Usuń z wizyt te, których już nie potrzebujesz, żeby dodać nowe.`,
		artworkFieldEntries: (limit: number): string =>
			`Dzieła w atelier mogą mieć razem ${limit} wpisów we własnych polach. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		reviewAnswers: (limit: number): string =>
			`W ciągu doby zmieści się ${limit} odpowiedzi w powtórkach. Zrób przerwę i wróć później.`,
		feedback: (limit: number): string =>
			`W ciągu doby można wysłać ${limit} zgłoszeń. Wróć z kolejnym później.`
	},
	cardIndex: {
		title: 'Kartoteka',
		lead: 'Tu opisujesz i porządkujesz swoje epoki, okresy, style, autorów, miejsca i wydarzenia. Możesz tutaj także utworzyć własne pola, które pozwolą dokładniej opisywać dzieła. Kliknij nazwę, która Cię interesuje, żeby zobaczyć szczegóły.',
		loadErrorTitle: 'Nie udało się wczytać Kartoteki',
		tabsLabel: 'Rodzaje wartości',
		tabs: {
			timeline: 'Okresy i style',
			material: 'Materiały',
			author: 'Autorzy',
			location: 'Miejsca',
			events: 'Wydarzenia',
			own: 'Własne pola'
		},
		emptyEra: 'W tej epoce nie ma jeszcze okresów.',
		periodsWithoutEra: 'Okresy bez epoki',
		stylesWithoutPeriod: 'Style bez okresu',
		emptyTimeline:
			'Nie ma tu jeszcze okresów ani stylów. Dodaj pierwszy tutaj albo wpisz go przy dziele.',
		emptyList: {
			material: 'Nie ma tu jeszcze materiałów. Dodaj pierwszy tutaj albo wpisz go przy dziele.',
			author: 'Nie ma tu jeszcze autorów. Dodaj pierwszego tutaj albo wpisz go przy dziele.',
			location: 'Nie ma tu jeszcze miejsc. Dodaj pierwsze tutaj albo wpisz je przy dziele.'
		},
		emptyEvents: 'Nie ma tu jeszcze wydarzeń. Dodaj pierwsze, a pojawi się też w Kalendarium.',
		eventsAdd: 'Dodaj wydarzenie',
		search: {
			material: 'Szukaj materiału',
			author: 'Szukaj autora',
			location: 'Szukaj miejsca',
			events: 'Szukaj wydarzenia',
			timeline: 'Szukaj okresu lub stylu'
		},
		sortLabel: 'Sortuj',
		add: {
			material: 'Dodaj materiał',
			author: 'Dodaj autora',
			location: 'Dodaj miejsce',
			period: 'Dodaj okres',
			style: 'Dodaj styl'
		},
		sorts: {
			name: 'Według nazwy',
			count: 'Według liczby dzieł',
			life: 'Według lat życia',
			country: 'Według kraju',
			date: 'Według daty'
		},
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment nazwy.`,
		openValue: (name: string, count: string): string => `${name}, ${count}`,
		kinds: {
			period: {
				name: 'Okres',
				accusative: 'okres',
				genitive: 'okresu',
				demonstrative: 'Ten okres',
				other: 'innym okresem'
			},
			style: {
				name: 'Styl',
				accusative: 'styl',
				genitive: 'stylu',
				demonstrative: 'Ten styl',
				other: 'innym stylem'
			},
			material: {
				name: 'Materiał',
				accusative: 'materiał',
				genitive: 'materiału',
				demonstrative: 'Ten materiał',
				other: 'innym materiałem'
			},
			author: {
				name: 'Autor',
				accusative: 'autora',
				genitive: 'autora',
				demonstrative: 'Ten autor',
				other: 'innym autorem'
			},
			location: {
				name: 'Miejsce',
				accusative: 'miejsce',
				genitive: 'miejsca',
				demonstrative: 'To miejsce',
				other: 'innym miejscem'
			}
		},
		mergeConfirm: {
			title: (merged: string, kept: string): string => `Połączyć „${merged}” z „${kept}”?`,
			unused: (merged: string): string =>
				`Żadne dzieło nie ma teraz przypisanej wartości „${merged}”, więc zmieni się tylko Kartoteka: „${merged}” z niej zniknie.`,
			assigned: (merged: string, kept: string, count: number, kind: string): string =>
				`Wszystkie dzieła z wartością „${merged}” (${count}) przypiszą się do ${kind} „${kept}”.`,
			periodAssigned: (merged: string, kept: string, count: number): string =>
				`${workCount(count)} z „${merged}” ${count === 1 ? 'przypisze' : 'przypiszą'} się do „${kept}”, a „${merged}” zniknie z Kartoteki.`,
			visits: (merged: string, kept: string, count: number): string =>
				`Wizyty w „${merged}” (${count}) przeniosą się do „${kept}”.`,
			periodLinks: (merged: string, kept: string): string =>
				`Epoki i style okresu „${merged}” dołączą do „${kept}”.`,
			pageContent: (merged: string): string =>
				`Podsumowanie, notatki i pozostałe informacje o „${merged}” zostaną usunięte.`,
			irreversible: 'Tej akcji nie będzie można cofnąć.',
			merging: 'Łączenie…'
		},
		moveConfirm: {
			title: 'Przenieść dzieła do innej epoki?',
			toEra: (period: string, from: string, count: number, to: string): string =>
				`${workCount(count)} z okresem „${period}” ${count === 1 ? 'jest' : 'są'} teraz w epoce ${from}. Po zapisie ${count === 1 ? 'przeniesie się' : 'przeniosą się'} do epoki ${to}.`,
			toNone: (period: string, from: string, count: number): string =>
				`${workCount(count)} z okresem „${period}” ${count === 1 ? 'jest' : 'są'} teraz w epoce ${from}. Po zapisie ${count === 1 ? 'zostanie' : 'zostaną'} bez epoki. Okres i style się nie zmienią.`,
			toPicked: (period: string, from: string, count: number): string =>
				`${workCount(count)} z okresem „${period}” ${count === 1 ? 'jest' : 'są'} teraz w epoce ${from}. Wybierz epokę, do której ${count === 1 ? 'ma' : 'mają'} trafić po zapisie.`,
			pick: 'Do której epoki mają trafić?',
			pickRequired: 'Wybierz epokę.',
			confirm: 'Zapisz i przenieś'
		},
		deleteConfirm: {
			title: (kind: string, name: string): string => `Usunąć ${kind} „${name}”?`,
			description: 'Żadne dzieło go nie używa, więc zniknie z Kartoteki razem z powiązaniami.'
		},
		merged: (name: string): string => `Połączono z „${name}”.`,
		deleted: (name: string): string => `Usunięto „${name}”.`,
		errors: {
			notFound: 'Nie ma już takiej wartości. Odśwież stronę.',
			changed: 'Coś zmieniło się w międzyczasie. Odśwież stronę i spróbuj jeszcze raz.'
		}
	},
	ownFields: {
		empty:
			'Nie masz jeszcze żadnych własnych pól. Dodaj pole, aby zobaczyć je przy wszystkich swoich dziełach.',
		intro:
			'Własne pola to dodatkowe informacje, które będzie można uzupełniać przy dziełach. Każde z nich pojawi się przy edycji istniejących dzieł oraz przy dodawaniu nowych. Ich wypełnianie zawsze będzie opcjonalne.',
		add: 'Dodaj pole',
		kinds: {
			text: 'Tekst',
			list: 'Lista',
			flag: 'Zaznaczenie'
		},
		kindNotes: {
			text: 'dowolna treść',
			list: 'jedna lub wiele wartości',
			flag: 'pole do zaznaczania'
		},
		oneValue: 'jedna wartość',
		manyValues: 'kilka wartości',
		summary: (parts: string[]): string => parts.join(' · '),
		noValues: 'Nie ma tu jeszcze wartości. Dodaj pierwszą tutaj albo wpisz ją przy dziele.',
		addValue: 'Dodaj wartość',
		newValueTitle: (field: string): string => `Nowa wartość pola „${field}”`,
		added: (name: string): string => `Dodano wartość „${name}”.`,
		valueExists: (name: string): string => `Masz już wartość „${name}”.`,
		values: 'Wartości',
		search: (name: string): string => `Szukaj w polu „${name}”`,
		ticked: 'Tak',
		menu: (name: string): string => `Działania pola „${name}”`,
		moveUp: 'Przesuń wyżej',
		moveDown: 'Przesuń niżej',
		form: {
			newTitle: 'Nowe pole',
			description: 'Opis (opcjonalnie)',
			descriptionHint:
				'Wyjaśnienie, które może w przyszłości pomóc zdecydować, co wpisywać w tym polu.',
			kind: 'Rodzaj',
			kindFixed: 'Wybranego rodzaju nie będzie można zmienić po utworzeniu pola.',
			multiple: 'Dzieło może mieć kilka wartości',
			creating: 'Dodawanie…',
			errorTitle: 'Nie udało się zapisać pola'
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć pole „${name}”?`,
			description: (count: number): string =>
				count === 0
					? 'Pole zniknie z formularza. Usunięcia nie będzie można cofnąć.'
					: `Pole zniknie z formularza i z ${count} ${plural(count, { one: 'dzieła', few: 'dzieł', many: 'dzieł' })}, ${plural(count, { one: 'które ma', few: 'które mają', many: 'które mają' })} je uzupełnione. Usunięcia nie będzie można cofnąć.`,
			confirm: 'Usuń pole'
		},
		value: {
			description: (field: string, count: string): string => `${field} · ${count}`,
			mergeHint: (name: string, count: string): string =>
				`Masz już „${name}” (${count}). Zapisz, a połączę je w jeden.`,
			kind: 'wartości',
			errorTitle: 'Nie udało się zapisać wartości'
		},
		errorTitle: 'Nie udało się zmienić pola',
		loadErrorTitle: 'Nie udało się wczytać własnych pól',
		created: (name: string): string => `Dodano pole „${name}”.`,
		saved: (name: string): string => `Zapisano „${name}”.`,
		deleted: (name: string): string => `Usunięto pole „${name}”.`,
		errors: {
			nameRequired: 'Wpisz nazwę.',
			builtInName: (name: string): string =>
				`Dzieło ma już wbudowane pole „${name}”. Wybierz inną nazwę.`,
			ownName: (name: string): string => `Masz już pole „${name}”.`
		}
	},
	mentions: {
		heading: 'Wspominasz o tym w notatkach',
		artwork: 'Dzieło',
		visit: 'Wizyta'
	},
	feedback: {
		title: 'Zgłoś uwagę',
		description: 'Coś nie działa albo brakuje Ci jakiejś funkcji? Daj znać.',
		kind: 'Co zgłaszasz?',
		bug: 'Błąd',
		idea: 'Pomysł',
		titleLabel: 'Tytuł',
		titleHint: 'Jedno zdanie o tym, czego dotyczy zgłoszenie.',
		descriptionLabel: 'Opis',
		descriptionHint: 'Co się stało albo jak miałoby to działać? Nieobowiązkowe.',
		send: 'Wyślij',
		sent: 'Zgłoszenie wysłane.',
		errorTitle: 'Nie udało się wysłać zgłoszenia',
		errors: {
			kindRequired: 'Wybierz, czy to błąd, czy pomysł.',
			titleRequired: 'Wpisz tytuł zgłoszenia.',
			invalid: 'Zgłoszenie jest niepoprawne. Sprawdź tytuł i opis.'
		}
	},
	pins: {
		switchLabel: (count: number): string => `Pinezki (${count})`,
		editorNote: 'Pinezki zapisują się od razu, niezależnie od przycisku „Zapisz”.',
		editHint:
			'Wskaż miejsce na obrazie, żeby dodać pinezkę. Przeciągnij pinezkę, żeby ją przesunąć.',
		imagePins: (count: number): string => `Jego pinezki (${count}) usuną się po zapisaniu.`,
		placeHere: 'Dodaj pinezkę w tym miejscu',
		marker: (number: number, name?: string, view = false): string =>
			`${name ? `Pinezka ${number}: ${name}` : `Pinezka ${number}`}${view ? ', widok lupy' : ''}`,
		view: (level?: string): string => (level ? `Widok lupy (${level})` : 'Widok lupy'),
		removeView: 'Usuń widok',
		newTitle: 'Nowa pinezka',
		title: 'Pinezka',
		term: 'Pojęcie ze Słowniczka (opcjonalnie)',
		termPlaceholder: 'Szukaj pojęcia',
		text: 'Opis (opcjonalnie)',
		loadFailed: 'Nie udało się wczytać pinezek.',
		errorTitle: 'Nie udało się zapisać pinezki',
		deleteErrorTitle: 'Nie udało się usunąć pinezki',
		errors: {
			empty: 'Wybierz pojęcie albo wpisz opis.',
			tooLong: (limit: number): string => `Opis może mieć najwyżej ${limit} znaków.`,
			tooMany: (limit: number): string => `Na jednym obrazie zmieści się ${limit} pinezek.`,
			notFound: 'Nie znaleziono tej pinezki. Odśwież stronę i spróbuj jeszcze raz.'
		}
	},
	glossary: {
		letters: 'Litery',
		title: 'Słowniczek',
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'pojęcie', few: 'pojęcia', many: 'pojęć' })}`,
		lead: 'Pojęcia i postaci, które chcesz zapamiętać. Ich definicje pojawią się w Twoich notatkach.',
		back: 'Słowniczek',
		add: 'Dodaj pojęcie',
		emptyTitle: 'Słowniczek jest jeszcze pusty',
		empty:
			'Gdy trafisz na słowo, którego chcesz się nauczyć, zapisz je tutaj razem z definicją. Definicję możesz wpisać samodzielnie albo uzupełnić z Wikipedii. Kiedy to słowo pojawi się w notatkach przy dziełach, zobaczysz tam jego definicję.',
		addFirst: 'Dodaj pierwsze pojęcie',
		search: 'Szukaj pojęcia',
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment.`,
		categories: 'Kategorie',
		loadErrorTitle: 'Nie udało się wczytać słowniczka',
		categoryNames: {
			person: 'Osoba',
			architecture: 'Architektura',
			painting: 'Malarstwo',
			sculpture: 'Rzeźba',
			technique: 'Technika i materiał',
			general: 'Pojęcie ogólne'
		},
		card: {
			source: 'Na podstawie Wikipedii, CC BY-SA 4.0',
			open: 'Otwórz w Słowniczku'
		},
		view: {
			also: (forms: string): string => `też: ${forms}`,
			noDefinition: 'Nie dodano jeszcze definicji.',
			mentionsHeading: 'Pojawia się w notatkach',
			onArtworks: 'Na dziełach',
			licenceLink: 'CC BY-SA 4.0',
			notFoundTitle: 'Nie ma takiego pojęcia',
			notFound: 'Nie ma takiego pojęcia w słowniczku. Może zostało usunięte.',
			loadErrorTitle: 'Nie udało się wczytać tego pojęcia',
			saved: (name: string): string => `Zapisano „${name}”.`,
			deleted: (name: string): string => `Usunięto „${name}”.`
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć „${name}” ze słowniczka?`,
			description:
				'Definicji tego słowa nie będzie się dało podejrzeć w notatkach. Tej akcji nie będzie można cofnąć.'
		},
		form: {
			newTitle: 'Nowe pojęcie',
			editTitle: 'Edycja pojęcia',
			namePlaceholder: 'Np. tympanon, sfumato, Lorenzo Medici',
			nameTaken: (name: string): string => `Masz już w Słowniczku pojęcie „${name}”.`,
			category: 'Kategoria',
			categoryRequired: 'Wybierz kategorię.',
			definition: 'Definicja',
			definitionPending:
				'Wpisz nazwę i wybierz kategorię, aby spróbować wyszukać definicję w Wikipedii.',
			definitionSearching: 'Wyszukiwanie w Wikipedii…',
			definitionNone: 'Wikipedia nie zna tego słowa. Napisz definicję własnymi słowami.',
			definitionFailed:
				'Nie udało się połączyć z Wikipedią. Możesz napisać definicję własnymi słowami albo spróbować jeszcze raz.',
			searchAgain: 'Szukaj jeszcze raz',
			searchDefinition: 'Szukaj w Wikipedii',
			definitionManual: 'Napisz definicję własnymi słowami albo poszukaj jej w Wikipedii.',
			definitionTooLong: (max: number): string => `Definicja może mieć najwyżej ${max} znaków.`,
			pickArticle: 'Wybierz inny artykuł',
			removeSource: 'Usuń źródło',
			sortByOther: 'Sortuj inaczej niż po nazwie',
			sortName: 'Sortuj jako',
			sortNamePlaceholder: 'np. Medici, Lorenzo',
			sortNameHint: 'Według tej wartości pojęcie trafi pod właściwą literę.',
			synonyms: 'Synonimy',
			synonymsHint:
				'Inne nazwy tego pojęcia, będą używane przy wyszukiwaniu wystąpień w notatkach.',
			synonymsFull: 'Możesz dodać najwyżej 3 synonimy.',
			forms: 'Odmiana',
			formsCount: (count: number): string =>
				`${count} ${plural(count, { one: 'forma', few: 'formy', many: 'form' })}`,
			showForms: 'Pokaż formy',
			hideForms: 'Zwiń',
			formsSearching: 'Wyszukiwanie odmiany w Wikisłowniku…',
			synonymFormsSearching: (word: string): string =>
				`Wyszukiwanie odmiany „${word}” w Wikisłowniku…`,
			synonymFormsNone: (word: string): string =>
				`Nie udało się odszukać „${word}” w słowniku. Możesz dopisać formy samodzielnie.`,
			formsSkipped: 'Odmianę tego pojęcia musisz dopisać samodzielnie.',
			formsNone:
				'Nie udało się odszukać tego hasła w słowniku. Możesz dopisać jego formy samodzielnie.',
			formsFailed:
				'Nie udało się połączyć z Wikisłownikiem. Spróbuj jeszcze raz albo dopisz formy samodzielnie.',
			formsFetch: 'Pobierz z Wikisłownika',
			formsRefetch: 'Pobierz ponownie',
			formsHint:
				'Formy nie pokazują się pod nazwą. Dzięki nim pojęcie znajdzie się w notatkach także odmienione.',
			authorWarningSuffix:
				' jest już w Kartotece jako autor. Możesz dodać tę osobę także tutaj albo opisać na stronie autora.',
			errorTitle: 'Nie udało się zapisać pojęcia'
		},
		articles: {
			title: 'Który to artykuł?',
			description: (name: string, category: string): string =>
				`Wyniki z Wikipedii dla „${name}” w kategorii ${category}. Wybierz ten, o który ci chodzi.`,
			listLabel: 'Artykuły z Wikipedii',
			searching: 'Wyszukiwanie w Wikipedii…',
			use: 'Użyj tego artykułu'
		},
		replaceConfirm: {
			title: 'Zastąpić Twoją definicję?',
			description: 'Definicja ma już Twoje zmiany. Tekst z nowego artykułu je zastąpi.',
			keep: 'Zostaw moją'
		},
		errors: {
			notFound: 'Nie ma takiego pojęcia w słowniczku. Może zostało usunięte.',
			invalid: 'Nie udało się zapisać pojęcia. Sprawdź nazwę i definicję.'
		}
	},
	career: {
		title: 'Gablota',
		lead: 'Sala z eksponatami, które udało Ci się zgromadzić, rozwijając swoje atelier. Każdy eksponat pokazuje Twoje postępy w innej dziedzinie nauki i kolekcjonowania. Niektóre są ukryte i odsłonią się dopiero wtedy, gdy spełnisz warunek ukryty w zagadce.',
		loadErrorTitle: 'Nie udało się wczytać Gabloty',
		tier: (tier: string, total: string): string => `Poziom ${tier} z ${total}`,
		new: 'Nowe',
		tierDate: (tier: string, date: string): string => `Poziom ${tier} · ${date}`,
		hiddenName: 'Ukryty eksponat',
		exhibitsHeading: 'Eksponaty',
		newRank: 'nowy stopień',
		newCuriosity: 'nowa ciekawostka',
		source: 'Źródło',
		curiosities: {
			collection: [
				'Ashmolean w Oksfordzie otworzył się w 1683 roku i od początku wpuszczał zwiedzających z zewnątrz uniwersytetu. Uchodzi za jedno z pierwszych publicznych muzeów na świecie.',
				'„Raj” Tintoretta w Pałacu Dożów w Wenecji ma około 24,5 na 7,6 metra i uważa się go za jeden z największych obrazów na płótnie. Tintoretto malował go w latach 1588–1592 razem z synem Domenikiem i warsztatem.',
				'Anna Maria Luisa, ostatnia z Medyceuszy, w „Pakcie rodzinnym” z 1737 roku zapisała zbiory rodu miastu Florencji. W 1769 roku Galerię Uffizi otwarto dla publiczności jako muzeum.',
				'Hans Sloane zapisał swoją ogromną kolekcję osobliwości narodowi brytyjskiemu w zamian za 20 000 funtów dla spadkobierców. W tym samym 1753 roku założono British Museum, częściowo po to, żeby ją pomieścić.',
				'Muzea Kapitolińskie w Rzymie liczą swoje dzieje od 1471 roku, gdy papież Sykstus IV podarował mieszkańcom miasta grupę posągów z brązu. To jedne z najstarszych publicznych muzeów na świecie.',
				'Prado otwarto w Madrycie 19 listopada 1819 roku jako Królewskie Muzeum Malarstwa i Rzeźby, z 311 obrazami. Dziś ma około 8000 obrazów, z których 1700 wisi w budynku Villanuevy.',
				'Panel „Sprawiedliwi sędziowie” z Ołtarza Gandawskiego skradziono z katedry św. Bawona w nocy 10 kwietnia 1934 roku i nigdy go nie odnaleziono. W ołtarzu jest dziś kopia, a śledztwo wciąż trwa.',
				"„Salvator Mundi” przypisywany Leonardowi da Vinci sprzedano w 1958 roku za 45 funtów jako kopię. W 2017 roku w domu aukcyjnym Christie's w Nowym Jorku osiągnął 450,3 miliona dolarów, najwyższą cenę zapłaconą za obraz.",
				'18 marca 1990 roku dwaj mężczyźni przebrani za policjantów wynieśli z Muzeum Isabelli Stewart Gardner w Bostonie 13 dzieł, wartych dziś ponad 500 milionów dolarów. To największa kradzież dzieł sztuki w historii, a puste ramy wciąż wiszą w muzeum.'
			],
			eras: [
				'Herkulanum zaczęto systematycznie badać w 1738 roku na polecenie króla Neapolu Karola Burbona. Kopano szyby i tunele, żeby przebić się przez około 20 metrów zastygłego materiału wulkanicznego do ulic antycznego miasta.',
				'Gdy w styczniu 1506 roku w winnicy na rzymskim Eskwilinie odkopano grupę marmurowych rzeźb, papież Juliusz II wysłał tam Michała Anioła i Giuliana da Sangallo. Sangallo miał od razu rozpoznać „Laokoona”, którego opisał Pliniusz.',
				'Jaskinię Lascaux odkrył w 1940 roku 18-letni Marcel Ravidat, którego pies Robot natrafił na dziurę pod wywróconym drzewem. Po latach udostępniania dwutlenek węgla, ciepło i wilgoć od zwiedzających uszkodziły malowidła i w 1963 roku jaskinię zamknięto.',
				'Malowane bizony na sklepieniu jaskini Altamira zauważyła w 1879 roku córka badacza Marcelina Sanza de Sautuoli. Większość uczonych odrzuciła ich prehistoryczny wiek, który uznano dopiero w 1902 roku.',
				"Terakotową armię odkryto w 1974 roku pod Xi'an. Wojownicy byli pierwotnie malowani, ale po wydobyciu z ziemi farba potrafi zniknąć w ciągu kilku minut."
			],
			memory: [
				'Według antycznej opowieści sala bankietowa zawaliła się na gości tuż po wyjściu poety Symonidesa z Keos. Ciał nie dało się rozpoznać, ale Symonides odtworzył w pamięci, kto przy którym miejscu stołu siedział.',
				'Jezuita Matteo Ricci napisał w 1596 roku po chińsku „Zachodnią metodę pamięci” dla kandydatów do egzaminów urzędniczych. Jako obrazy do rozmieszczania w wyobrażonych budowlach wybrał chińskie znaki.',
				'Whistler przyglądał się nocą Tamizie, a potem odwracał się plecami i recytował szczegóły widoku towarzyszowi, który poprawiał jego pomyłki. Swoje „Nokturny” malował później w pracowni z tego, co zostało w pamięci.',
				'Aby Warburg od 1924 roku przypinał na 63 tablicach obciągniętych czarnym płótnem 971 reprodukcji dzieł i nazwał ten atlas „Mnemosyne”. Nie skończył go przed śmiercią w 1929 roku, a z oryginalnych tablic zostały tylko fotografie.',
				'Franco Magnani wyjechał z toskańskiego Pontito w 1958 roku, mając 24 lata. Później namalował ponad 100 widoków rodzinnej wsi, wszystkie wyłącznie z pamięci.',
				'Stephen Wiltshire po 20 minutach lotu helikopterem nad Nowym Jorkiem narysował panoramę miasta na płótnie długim na około 6 metrów. Nie korzystał przy tym ze zdjęć, tylko z pamięci.',
				'Widoki Warszawy Bernarda Bellotta posłużyły po 1945 roku do odbudowy miasta, także z jego zmyśleniami. Jaszczurki i goryl jedzący banana na dachu Pałacu Branickich nigdy go nie zdobiły, a stoją tam dziś, bo namalował je Bellotto.'
			],
			regular: [
				'Wit Stwosz pracował nad ołtarzem dla kościoła Mariackiego w Krakowie od 1477 do 1489 roku. Ponad 200 figur wyrzeźbił w drewnie lipowym, konstrukcję zrobiono z dębu, a tło z modrzewia.',
				"„Źródło” Ingres zaczął malować w 1820 roku, a skończył dopiero w 1856, 36 lat później. Dziś obraz wisi w Musée d'Orsay.",
				'Ghiberti robił pierwsze brązowe drzwi florenckiego baptysterium ponad 20 lat, a kolejne 27 lat. Te drugie Michał Anioł uznał za godne, by być bramą raju, i tak się je dziś nazywa.',
				'„Bramę piekieł” państwo francuskie zamówiło u Rodina w 1880 roku do muzeum, które nigdy nie powstało, bo w jego miejscu zaplanowano dworzec. Rodin pracował nad nią latami, ale w brązie odlano ją dopiero po jego śmierci.',
				'Simon Rodia budował Wieże Watts w Los Angeles przez 33 lata, od 1921 do 1954 roku. Uchodzą za największą budowlę wzniesioną przez jedną osobę, a stalowe pręty łączył drutem i zaprawą, bez spawania.',
				'Listonosz Ferdinand Cheval potknął się w 1879 roku o kamień dziwnego kształtu i zaczął zbierać kamienie na trasie z listami. Przez 33 lata zbudował z nich Pałac Idealny, a sam doliczył się 93 000 godzin pracy.',
				'Budowę katedry w Mediolanie zaczęto w 1386 roku. Jej fasadę dopełniły dopiero brązowe drzwi, które powstawały między 1909 a 1965 rokiem.',
				'Kamień węgielny pod katedrę w Kolonii położono w 1248 roku, a po 1520 roku budowa stanęła na ponad 300 lat. Gdy ją wznowiono, bardzo dokładnie trzymano się średniowiecznego planu fasady.'
			],
			back_from_storage: [
				'Po kradzieży „Mony Lisy” w 1911 roku poeta Guillaume Apollinaire spędził tydzień w areszcie, bo powiązano go z figurkami skradzionymi wcześniej z Luwru. Wskazał wtedy na swojego przyjaciela, Pabla Picassa.'
			],
			chronicle: [
				'Paryskie wystawy żyjących artystów nazwano Salonami od sali Luwru, w której je urządzano, czyli Salon Carré. Mimo nazwy sala jest prostokątna, a „carré” oznacza tu tylko, że ma proste kąty.',
				'Luwr otwarto jako muzeum 10 sierpnia 1793 roku. W tygodniu wpuszczano do niego artystów, którzy przychodzili tam się uczyć, a zwykła publiczność mogła wejść tylko w niedzielę.',
				'Wystawa Vermeera w Rijksmuseum w 2023 roku zebrała 28 z 37 jego dzieł. Przez 16 tygodni obejrzało ją 650 000 osób ze 113 krajów, choć muzeum celowo ograniczało liczbę wejść.',
				'Wystawę skarbów Tutanchamona w British Museum w 1972 roku obejrzało 1 694 117 osób. Kolejka ciągnęła się codziennie od sali na pierwszym piętrze przez całe muzeum aż na chodnik przed budynkiem.',
				'Na wystawę Walentina Sierowa w moskiewskiej Galerii Tretiakowskiej w 2016 roku ludzie stali godzinami w kolejce na mrozie. Muzeum wydłużyło godziny otwarcia, a w namiotach przy kolejce rozdawano kaszę gryczaną i herbatę.',
				'Po kradzieży „Mony Lisy” w 1911 roku Luwr zostawił po niej puste miejsce na ścianie. Tłumy przychodziły oglądać samą pustą ścianę, a wśród nich był Franz Kafka ze swoim przyjacielem Maxem Brodem.'
			],
			grand_tour: [
				'Muzeum Chichu na japońskiej wyspie Naoshima zbudowano niemal w całości pod ziemią. Pięć „Nenufarów” Moneta ogląda się tam wyłącznie w świetle dziennym.',
				'Inhotim w brazylijskim stanie Minas Gerais to jedno z największych muzeów sztuki współczesnej pod gołym niebem. Pawilony i rzeźby stoją w ogrodzie botanicznym, a zwiedzający mogą chodzić po około 140 hektarach.',
				'Muzeum Zeitz MOCAA w Kapsztadzie urządzono w silosie zbożowym z lat 20. XX wieku. Wycięte w jego środku atrium ma kształt wzorowany na pojedynczym ziarnie kukurydzy, a światło wpada przez rury o średnicy 5,5 metra.',
				'Cisternerne we Frederiksbergu w Kopenhadze to podziemny zbiornik wody pitnej z lat 1856–1859, dziś przestrzeń sztuki. Co roku wystawę tworzy tam inny artysta albo architekt, a wilgotność wynosi stale prawie 100%.',
				'Muzeum MONA w Hobart na Tasmanii wykuto w piaskowcowym klifie na nadrzecznej posiadłości Moorilla. Założył je kolekcjoner David Walsh, który majątek zbił na hazardzie.',
				'Podwodne muzeum MUSA u wybrzeży Cancún i Isla Mujeres w Meksyku to ponad 500 rzeźb naturalnej wielkości na głębokości od 4 do 8 metrów. Rzeźby są sztuczną rafą i odciągają nurków od przeciążonej rafy naturalnej.'
			],
			seen_live: [
				'Do „Mony Lisy” Leonardo wybrał dużą deskę, około 79 na 53 cm, żeby przedstawić modelkę w naturalnej wielkości. W 1956 roku rzucony w dzieło kamień rozbił chroniącą je szybę i lekko uszkodził lewy łokieć.',
				'„Mleczarka” Vermeera z Rijksmuseum ma tylko 45,5 na 41 cm.',
				'Tkanina z Bayeux ma prawie 70 metrów długości i tylko 50 cm wysokości. W muzeum w Bayeux ogląda się ją w zaciemnionej sali, w której oświetlone jest wyłącznie samo dzieło.',
				'„Straż nocną” Rembrandta obcięto w 1715 roku przy przenosinach do amsterdamskiego ratusza, z trzech stron, najbardziej z lewej. Odcięte pasy płótna się nie zachowały, a pełną kompozycję znamy z kopii przypisywanej Gerritowi Lundensowi.',
				'Wersje „Krzyku” w muzeum MUNCH w Oslo powstały na papierze i tekturze, więc żadna nie może wisieć na stałe. Pokazuje się je na zmianę w ciągu dnia, a dwie pozostałe odpoczywają w tym czasie w ciemności.',
				'Art Institute of Chicago ma 3 odbitki „Wielkiej fali w Kanagawie” Hokusaia, ale zwykle pokazuje ją tylko przez 3 miesiące co 4 lata. Przez resztę czasu drzeworyt odpoczywa w magazynie.'
			],
			timeline: [
				'Nad lustrem w „Portrecie małżonków Arnolfinich” Jan van Eyck wypisał ozdobnym pismem „Johannes de eyck fuit hic 1434”, czyli „Jan van Eyck był tutaj. 1434”.',
				'Badanie drewna 294 obrazów na desce Jordaensa, van Dycka i ich kręgu pokazało, że ponad 71% desek pochodziło z handlu drewnem bałtyckim. Dąb o prostych włóknach sprowadzano wtedy z Polski i innych krajów nad Bałtykiem.',
				'W ostatnim wersie czterowiersza na ramie „Ołtarza gandawskiego” wyróżniono kilka liter. Suma ich wartości jako cyfr rzymskich daje 1432, rok, w którym 6 maja ołtarz ustawiono w katedrze św. Bawona.',
				'Trzech „etruskich” wojowników z terakoty Metropolitan Museum przestało uważać za starożytnych, gdy jeden z twórców, Fioravanti, przyniósł kciuk z wypalonej gliny, który latami trzymał u siebie. Pasował idealnie do dłoni jednej z figur.',
				'Malowidło w jaskini Leang Karampuang na Sulawesi ma co najmniej 51 200 lat i przedstawia postaci podobne do ludzi obok świni. Wiek ustalono laserem, badając kryształy węglanu wapnia, które narosły na nim później.'
			],
			glossary: [
				'Nazwa impresjonizmu pochodzi od „Impresji, wschodu słońca” Moneta. Krytycy wyśmiali to dzieło na pierwszej wystawie grupy w Paryżu w 1874 roku, a jego tytuł zrobili obelgą dla całego ruchu.',
				'Słowo „barok” było początkowo pogardliwe. Może pochodzić od portugalskiego „barroco”, czyli perły o nieregularnym kształcie.',
				'Sfumato to „przydymiona” jakość malarstwa, która rozmywa kontury, tak że postaci wyłaniają się z ciemnego tła. Leonardo da Vinci radził w niedokończonym traktacie o malarstwie malować „bez linii”.',
				'Nazwa kubizmu wzięła się najpewniej z uwagi krytyka Louisa Vauxcellesa. W 1908 roku napisał o dziełach Braque’a wystawionych w Paryżu, że sprowadzają wszystko do geometrycznych zarysów, do sześcianów.',
				'Słowo „gotycki” ukuli włoscy pisarze późnego renesansu jako synonim „barbarzyńskiego”. Przypisywali ten styl Gotom, którzy zniszczyli Cesarstwo Rzymskie.',
				'Groteska wzięła nazwę od włoskiego „grottesco”. Jej wzory podpatrzono w starożytnych dekoracjach odkrytych pod koniec XV wieku w podziemnych salach, czyli grotach, Złotego Domu Nerona w Rzymie.',
				'Secesję Włosi nazywali między innymi „Stile Liberty”, od londyńskiego domu towarowego Liberty & Co. Niemcy mówili „Jugendstil”, od monachijskiego pisma „Die Jugend”.'
			],
			own_eye: [
				'Camera lucida pozwalała rysownikowi widzieć jednocześnie widok i kartkę, na której rysował. Opatentował ją w 1807 roku William Hyde Wollaston.',
				'Canaletto długo uchodził za malarza, który rysował Wenecję w plenerze z camera obscura. Badanie jego dopracowanych rysunków w podczerwieni wskazuje jednak, że powstawały w pracowni na podstawie szkiców z natury.',
				'William Henry Fox Talbot w podróży poślubnej próbował narysować jezioro Como za pomocą camera lucida. Twierdził później, że fotografię wynalazł, bo słabo rysował i go to frustrowało.',
				'Najstarsza zachowana fotografia wykonana camera obscura to heliografia Niépce’a z 1827 roku. Powstała na cynowej płycie pokrytej światłoczułym bitumem i naświetlała się przez kilka dni.',
				'Na zdjęciu paryskiego bulwaru, które Daguerre zrobił około 1838 roku, ruchliwa ulica wygląda na pustą, bo naświetlanie trwało 10 minut. Został na nim tylko mężczyzna, który stał w miejscu, bo czyszczono mu buty.'
			],
			night_watch: [
				'Właściwy tytuł „Straży nocnej” to „Kompania strzelców dzielnicy II pod dowództwem kapitana Fransa Banninck Cocqa”. Nazwą „Nachtwacht” określa się to dzieło dopiero od końca XVIII wieku.'
			],
			marathon: [
				'Pejzaż w dolnej części „Nemezis” Dürera rozpoznano jako miasteczko Klausen (Chiusa) w Tyrolu. Samą boginię Dürer zbudował według kanonu proporcji Witruwiusza.'
			]
		},
		ranks: {
			masculine: [
				'Zwiedzający',
				'Bywalec',
				'Miłośnik sztuki',
				'Kolekcjoner',
				'Znawca',
				'Asystent muzealny',
				'Adiunkt',
				'Kustosz',
				'Starszy kustosz',
				'Główny kurator',
				'Wicedyrektor',
				'Dyrektor muzeum'
			],
			feminine: [
				'Zwiedzająca',
				'Bywalczyni',
				'Miłośniczka sztuki',
				'Kolekcjonerka',
				'Znawczyni',
				'Asystentka muzealna',
				'Adiunktka',
				'Kustoszka',
				'Starsza kustoszka',
				'Główna kuratorka',
				'Wicedyrektorka',
				'Dyrektorka muzeum'
			]
		},
		rankLabel: (rank: string, points: number): string => `Stopień: ${rank}, ${pointCount(points)}`,
		rankProgress: (points: number, next: number): string => `${points} z ${pointCount(next)}`,
		rankTop: (points: number): string => `${pointCount(points)} · najwyższy stopień`,
		about: 'O eksponacie',
		aboutOf: (exhibit: string): string => `O eksponacie: ${exhibit}`,
		tierOf: (tier: string, exhibit: string): string => `Poziom ${tier}: ${exhibit}`,
		rankTip: (points: number, next: string, missing: number): string =>
			`${pointCount(points)} · do stopnia ${next} brakuje ${missing}`,
		roundPlan: (points: number, streak: number, bonus: number): string =>
			`Za dzisiejszy plan: ${pointCount(points)}${
				streak > 1
					? ` (seria ${streak} ${plural(streak, { one: 'dzień', few: 'dni', many: 'dni' })}${bonus > 0 ? `, premia ${bonus}%` : ''})`
					: ''
			}.`,
		roundTier: (tier: string, exhibit: string): string =>
			`W Gablocie zapalił się poziom ${tier}: ${exhibit}.`,
		roundRank: (rank: string): string => `Nowy stopień: ${rank}.`,
		credits: 'Ryciny',
		recoloured: 'kolory zmienione',
		exhibits: {
			collection: {
				name: 'Gabinet Olego Worma',
				about:
					'Kopenhaski gabinet osobliwości Olego Worma, znany z ryciny z 1655 roku, był jednym z pierwowzorów muzeum.',
				count: counter('dzieł w atelier')
			},
			eras: {
				name: 'Świątynia della Tosse',
				about: 'Piranesi utrwalał na rycinach ruiny starożytnego Rzymu.',
				count: counter('epok w Twoich dziełach')
			},
			memory: {
				name: 'Święty Hieronim w pracowni',
				about:
					'Dürer wyrył uczonego pogrążonego w lekturze w 1514 roku, w tym samym roku co „Melancholię I”.',
				count: counter('dzieł utrwalonych w pamięci')
			},
			regular: {
				name: 'Klepsydra z „Melancholii I”',
				about:
					'Klepsydra wisi na ścianie w miedziorycie Dürera z 1514 roku. Dzień, w którym nic nie czekało na powtórkę, nie przerywa serii.',
				count: counter('dni', 'najdłuższa seria: ')
			},
			back_from_storage: {
				name: 'Mona Lisa po powrocie',
				about: 'Mona Lisa zniknęła z Luwru w 1911 roku i wróciła tam po ponad dwóch latach.',
				hint: 'Zdarza się, że dzieło wypada z pamięci, a potem do niej wraca.',
				awarded: 'Za dzieło zapomniane i utrwalone na nowo.'
			},
			chronicle: {
				name: 'Salon w Luwrze',
				about:
					'Rycina Pietra Antonia Martiniego pokazuje paryski Salon w Luwrze w 1787 roku, gdzie obrazy wisiały od podłogi aż po sufit.',
				count: counter('odwiedzonych miejsc')
			},
			grand_tour: {
				name: 'Globus podróżnika',
				about:
					'W XVIII wieku młodzi Europejczycy odbywali Grand Tour, podróż po zabytkach i kolekcjach kontynentu.',
				count: counter('krajów z odwiedzonymi miejscami')
			},
			seen_live: {
				name: 'Teleskop Mathieu Laensbergha',
				about:
					'Od XVII wieku w Liège wydawano almanach z przepowiedniami, podpisany imieniem zmyślonego astrologa, „mistrza Mathieu Laensbergha”.',
				count: counter('dzieł zobaczonych na żywo')
			},
			timeline: {
				name: 'Praski orloj',
				about: 'Zegar astronomiczny na praskim rynku odmierza czas od 1410 roku.',
				count: counter('wydarzeń w Kalendarium')
			},
			glossary: {
				name: 'Biblioteka w Lejdzie',
				about:
					'Rycina z 1610 roku pokazuje bibliotekę uniwersytetu w Lejdzie, w której księgi przykuwano łańcuchami do pulpitów.',
				count: counter('pojęć w Słowniczku')
			},
			own_eye: {
				name: 'Camera obscura z Encyklopedii',
				about:
					'Plansza z Encyklopedii Diderota pokazuje ciemnię optyczną, w której na długo przed fotografią odrysowywano widoki.',
				count: counter('własnych zdjęć dzieł')
			},
			night_watch: {
				name: 'Straż nocna',
				about: 'Rembrandt namalował „Straż nocną” w 1642 roku.',
				hint: 'Niektórzy uczą się wtedy, gdy muzea są od dawna zamknięte.',
				awarded: 'Za powtórkę między północą a czwartą rano.'
			},
			marathon: {
				name: 'Puchar Nemezis',
				about: 'Na miedziorycie Dürera bogini Nemezis szybuje nad światem z pucharem w dłoni.',
				hint: 'Bogowie przyglądają się tym, którzy nie wiedzą, kiedy przestać.',
				awarded: 'Za tysiąc dzieł w powtórkach swobodnych jednego dnia.'
			}
		}
	},
	chronicle: {
		title: 'Kronika',
		lead: 'Dziennik Twoich wizyt w muzeach i innych spotkań ze sztuką. Możesz tutaj zapisać, gdzie i kiedy udało Ci się zobaczyć dzieła z Twojej kolekcji na żywo.',
		count: (visits: number, seen: number): string =>
			`${visitCount(visits)} · ${workCount(seen)} na żywo`,
		add: 'Dodaj wizytę',
		emptyTitle: 'Kronika jest jeszcze pusta',
		empty:
			'Zapisuj tu swoje wizyty w muzeach, galeriach i innych miejscach, gdzie spotykasz się ze sztuką. Przy każdej wizycie możesz zaznaczyć dzieła, które udało Ci się zobaczyć na żywo, i dodać notatkę z wrażeniami.',
		addFirst: 'Dodaj pierwszą wizytę',
		loadErrorTitle: 'Nie udało się wczytać kroniki',
		back: 'Kronika',
		seen: (count: number): string => `${workCount(count)} na żywo`,
		seenCount: (count: number): string =>
			`${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })} na żywo`,
		kind: 'Wizyta',
		artworkVisits: (count: number): string => `Widziane na żywo · ${visitCount(count)}`,
		placeVisits: (count: number): string => `Z Twojej kroniki · ${visitCount(count)}`,
		inYear: (year: number): string => `${year} roku`,
		saved: (place: string, date: string): string => `Zapisano wizytę: ${place}, ${date}.`,
		view: {
			seenTitle: 'Widziane na żywo',
			noArtworks: 'Do tej wizyty nie ma jeszcze dzieł. Kliknij „Edytuj”, żeby je zaznaczyć.',
			deleted: (date: string): string => `Usunięto wizytę z ${date}.`,
			notFoundTitle: 'Nie ma takiej wizyty',
			loadErrorTitle: 'Nie udało się wczytać wizyty'
		},
		deleteConfirm: {
			title: (date: string): string => `Usunąć wizytę z ${date}?`,
			description: 'Zniknie wizyta i jej notatka. Dzieła zostaną w kolekcji.'
		},
		form: {
			newTitle: 'Nowa wizyta',
			editTitle: 'Edycja wizyty',
			place: 'Miejsce',
			placeHint: 'Muzeum, galeria albo kościół. Dzieła, które tam są, zaznaczymy od razu.',
			placeRequired: 'Wybierz, gdzie była wizyta.',
			date: 'Data',
			dateHint: 'Wystarczy sam rok, jeśli dokładniej nie pamiętasz.',
			day: 'Dzień',
			month: 'Miesiąc',
			year: 'Rok',
			yearRequired: 'Wpisz, w którym roku była wizyta.',
			yearInvalid: 'Wpisz rok czterema cyframi, na przykład 2026.',
			monthRequired: 'Do dnia wybierz miesiąc albo usuń dzień.',
			dayInvalid: 'Taki dzień nie istnieje w tym miesiącu.',
			notesPlaceholder: 'Jak było? Co Cię zaskoczyło? Co warto zapamiętać?',
			artworks: 'Dzieła',
			ticked: 'Zaznaczyliśmy wszystko z tego miejsca. Odznacz to, czego tym razem nie było.',
			search: 'Udało się zobaczyć coś jeszcze? Szukaj w całej kolekcji',
			noMatch: 'W kolekcji nie ma takiego dzieła.',
			addArtwork: (title: string): string => `Dodaj „${title}”`,
			fromPlace: 'Z tego miejsca',
			fromElsewhere: 'Z innych miejsc',
			noPlace: 'Wybierz miejsce, a pokażemy jego dzieła.',
			placeEmpty:
				'W kolekcji nie ma jeszcze dzieł z tego miejsca. Te zobaczone dodasz przez wyszukiwarkę.',
			errorTitle: 'Nie udało się zapisać wizyty',
			notFoundTitle: 'Nie ma takiej wizyty',
			loadErrorTitle: 'Nie udało się wczytać wizyty'
		},
		errors: {
			notFound: 'Nie ma takiej wizyty w kronice. Może została usunięta.',
			invalid: 'Nie udało się zapisać wizyty. Sprawdź miejsce, datę i dzieła.'
		}
	},
	timeline: {
		title: 'Kalendarium',
		lead: 'Twoje dzieła i wydarzenia w prawdziwej skali czasu, epoka po epoce.',
		emptyTitle: 'Kalendarium jest jeszcze puste',
		empty:
			'Tutaj zobaczysz swoje dzieła na osi czasu, każde w roku swojego powstania. Dzieła pojawią się same, gdy wpiszesz im datę. Możesz też dodać wydarzenia i okresy historyczne, a ich opis i daty uzupełnić z Wikipedii, żeby widzieć, co działo się w tym samym czasie.',
		addFirst: 'Dodaj pierwsze wydarzenie',
		add: 'Dodaj wydarzenie',
		saved: (name: string): string => `Zapisano wydarzenie „${name}”.`,
		form: {
			newTitle: 'Nowe wydarzenie',
			editTitle: 'Edycja wydarzenia',
			namePlaceholder: 'Np. wojny napoleońskie, chrzest Polski',
			nameRequired: 'Wpisz nazwę wydarzenia.',
			year: 'Rok',
			spanTitle: 'Lata',
			yearRequired: 'Wpisz rok wydarzenia.',
			description: 'Opis',
			descriptionPlaceholder: 'Co warto o nim pamiętać',
			errorTitle: 'Nie udało się zapisać wydarzenia',
			notFoundTitle: 'Nie ma takiego wydarzenia',
			loadErrorTitle: 'Nie udało się wczytać wydarzenia',
			pickArticle: 'Wybierz inny artykuł',
			searchArticles: 'Szukaj w Wikipedii',
			removeSource: 'Usuń źródło'
		},
		articles: {
			description: (name: string): string =>
				`Wyniki z Wikipedii dla „${name}”. Wybierz ten, o który ci chodzi.`,
			none: 'Wikipedia nie zna tego wydarzenia. Wpisz daty sam.',
			failed:
				'Nie udało się połączyć z Wikipedią. Możesz wpisać daty sam albo spróbować jeszcze raz.'
		},
		replaceConfirm: {
			title: 'Zastąpić Twoje daty i opis?',
			description: 'Daty albo opis mają już Twoje zmiany. Dane z nowego artykułu je zastąpią.',
			keep: 'Zostaw moje'
		},
		loadErrorTitle: 'Nie udało się wczytać kalendarium',
		strip: 'Pasek epok',
		previous: (era: string): string => `Poprzednia epoka: ${era}`,
		next: (era: string): string => `Następna epoka: ${era}`,
		steps: {
			label: 'Skala',
			era: 'Epoka',
			'10000': '10 tysiącleci',
			'1000': 'Tysiąclecie',
			'300': 'Trzy wieki',
			'100': 'Stulecie',
			'30': 'Pokolenie'
		},
		zoomIn: 'Przybliż o krok',
		zoomOut: 'Oddal o krok',
		stage: 'Oś czasu. Strzałki przesuwają czas, plus i minus zmieniają skalę o krok.',
		stageGroup: 'Oś czasu',
		card: {
			event: 'Wydarzenie',
			period: 'Okres',
			length: (years: number): string =>
				`${years} ${plural(years, { one: 'rok', few: 'lata', many: 'lat' })}`,
			artworksOfTime: 'Dzieła z tego czasu',
			noArtworks: 'W tym czasie nie powstało żadne dzieło z Twojej kolekcji.',
			showWhole: 'Pokaż cały okres na osi'
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć wydarzenie „${name}”?`,
			description: 'Zniknie z Kalendarium. Żadne dzieło się nie zmieni.'
		},
		deleted: (name: string): string => `Usunięto wydarzenie „${name}”.`,
		noEvents: 'Nie ma tu jeszcze wydarzeń.',
		hiddenEvents: (count: number): string =>
			`${count} ${plural(count, { one: 'wydarzenie', few: 'wydarzenia', many: 'wydarzeń' })} poza widokiem. Przybliż, żeby je zobaczyć.`,
		now: (year: string, parts: string[]): string => [year, ...parts].join(' · '),
		nowEvents: (events: string): string => `w tym czasie: ${events}`,
		nowArtworks: (titles: string, more: number): string =>
			`dzieła: ${titles}${more > 0 ? ` (+${more})` : ''}`,
		readingArtworks: 'W linii czytania:',
		readingArtworksNone: 'W linii czytania nie ma dzieł.',
		readingMore: (count: number): string => `(+${count})`,
		lane: (name: string, count: number): string => `${name} · ${count}`,
		filters: {
			lanes: 'Okresy i style',
			lanesHint: (era: string): string => `Wybierz maksymalnie 5 z epoki ${era}.`,
			lanesFull: 'Wybrano maksymalną liczbę okresów i stylów. Odznacz któryś, żeby wybrać inny.',
			periods: 'Okresy',
			styles: 'Style',
			types: 'Typ dzieła',
			authors: 'Autor',
			searchAuthors: 'Szukaj autora',
			view: 'Widok',
			events: 'Wydarzenia',
			readingArtworks: 'Dzieła w linii czytania',
			empty: 'W tej epoce nie ma dzieł, które pasują do filtrów.'
		},
		zones: {
			events: 'Wydarzenia',
			artworks: 'Dzieła'
		},
		century: (numeral: string, beforeCommonEra: boolean): string =>
			`${numeral} w.${beforeCommonEra ? ' p.n.e.' : ''}`,
		millennium: (numeral: string, beforeCommonEra: boolean): string =>
			`${numeral} tysiąclecie${beforeCommonEra ? ' p.n.e.' : ''}`,
		errors: {
			notFound: 'Nie ma takiego wydarzenia w Kalendarium. Może zostało usunięte.',
			invalid: 'Nie udało się zapisać wydarzenia. Sprawdź nazwę i datę.'
		}
	},
	valuePage: {
		back: 'Kartoteka',
		deleteBlocked: (demonstrative: string, count: string, other: string): string =>
			`${demonstrative} ma jeszcze ${count}, więc nie da się go usunąć. Możesz go połączyć z ${other}.`,
		header: (kind: string, count: string): string => `${kind} · ${count}`,
		born: (year: string): string => `ur. ${year}`,
		died: (year: string): string => `zm. ${year}`,
		eraKind: 'Epoka',
		notFoundTitle: 'Nie ma takiej wartości',
		notFound: 'Nie ma takiej wartości w Kartotece. Może została usunięta albo połączona z inną.',
		loadErrorTitle: 'Nie udało się wczytać tej strony',
		saved: 'Zapisano zmiany.',
		kinds: {
			era: {
				artworks: 'Dzieła z tej epoki',
				noNotes: 'Nie masz jeszcze notatek o tej epoce.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tej epoki.'
			},
			period: {
				artworks: 'Dzieła z tego okresu',
				noNotes: 'Nie masz jeszcze notatek o tym okresie.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tego okresu.'
			},
			style: {
				artworks: 'Dzieła w tym stylu',
				noNotes: 'Nie masz jeszcze notatek o tym stylu.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła w tym stylu.'
			},
			material: {
				artworks: 'Dzieła z tego materiału',
				noNotes: 'Nie masz jeszcze notatek o tym materiale.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tego materiału.'
			},
			author: {
				artworks: 'Dzieła tego autora',
				noNotes: 'Nie masz jeszcze notatek o tym autorze.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła tego autora.'
			},
			location: {
				artworks: 'Dzieła z tego miejsca',
				noNotes: 'Nie masz jeszcze notatek o tym miejscu.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tego miejsca.'
			}
		}
	},
	valueForm: {
		nameRequired: 'Wpisz nazwę.',
		mergeHint: (kind: string, name: string, count: string): string =>
			`Masz już ${kind} „${name}” (${count}). Zapisz, a połączę je w jeden.`,
		eras: 'Epoki',
		periods: 'Okresy',
		noEras: 'Ten okres nie ma jeszcze epoki.',
		noPeriods: 'Ten styl nie ma jeszcze okresu.',
		addEra: 'Dodaj epokę',
		addPeriod: 'Dodaj okres',
		chooseEra: 'Wybierz epokę',
		choosePeriod: 'Wybierz okres',
		removeEra: (name: string): string => `Usuń epokę ${name}`,
		removePeriod: (name: string): string => `Usuń okres ${name}`,
		periodLocked: (period: string, count: number): string =>
			`Nie uda się odpiąć okresu „${period}” od tego stylu, bo ${workCount(count)} w tym stylu ${count === 1 ? 'ma' : 'mają'} przypisany taki okres.`,
		editTitle: (kind: string, name: string): string => `Edytuj ${kind} „${name}”`,
		newTitles: {
			material: 'Nowy materiał',
			author: 'Nowy autor',
			location: 'Nowe miejsce',
			period: 'Nowy okres',
			style: 'Nowy styl'
		},
		exists: (kind: string, name: string): string => `Masz już ${kind} „${name}”.`,
		created: (kind: string, name: string): string => `Dodano ${kind} „${name}”.`,
		eraAccusative: 'epokę',
		summary: 'Podsumowanie',
		summaryPlaceholder: 'Krótki opis do szybkiego podejrzenia przy oglądaniu dzieła.',
		notesPlaceholder: 'Wszystko, co warto zapamiętać',
		notesLinkHint:
			'Wpisz @, żeby dodać odnośnik do autora, epoki albo miejsca, albo #, żeby dodać odnośnik do dzieła.',
		errorTitle: 'Nie udało się zapisać zmian',
		portrait: {
			label: 'Portret',
			find: 'Znajdź portret',
			findOther: 'Wybierz inny',
			findHint: 'Wpisz nazwę, żeby znaleźć portret.',
			own: 'Własny portret',
			changeOwn: 'Zmień własny',
			ownTitle: 'Dodaj własny portret',
			changeOwnTitle: 'Zmień własny portret',
			remove: 'Usuń portret'
		},
		lifeYears: 'Lata życia',
		birthYear: 'Rok urodzenia',
		deathYear: 'Rok śmierci',
		birthBeforeCommonEra: 'p.n.e. (urodzenie)',
		deathBeforeCommonEra: 'p.n.e. (śmierć)',
		lifeYearsOrder: 'Rok śmierci nie może być wcześniejszy niż rok urodzenia.',
		sortByOther: 'Sortuj inaczej niż po nazwie',
		sortName: 'Sortuj jako',
		sortNamePlaceholder: 'np. Vinci, Leonardo da',
		sortNameHint: 'Po tej wartości będą sortowani autorzy.',
		country: 'Kraj',
		countryPlaceholder: 'Zacznij pisać nazwę kraju',
		countryHint: 'Wybierz kraj z listy.',
		placeType: 'Typ miejsca',
		placeTypes: {
			museum: 'Muzeum',
			gallery: 'Galeria',
			private_collection: 'Kolekcja prywatna',
			on_site: 'Na miejscu'
		}
	},
	trash: {
		title: 'Archiwum',
		emptyTitle: 'Archiwum jest puste',
		empty:
			'Trafiają tu dzieła, które usuniesz z atelier. Stąd możesz je przywrócić albo usunąć na zawsze.',
		loadErrorTitle: 'Nie udało się wczytać Archiwum',
		actionErrorTitle: 'Nie udało się zmienić Archiwum',
		deletedOn: (date: string): string => `w Archiwum od ${date}`,
		today: 'dziś',
		restore: 'Przywróć',
		restoring: 'Przywracanie…',
		deleteForever: 'Usuń na zawsze',
		moveTitle: (number: string): string => `Przenieść ${number} do Archiwum?`,
		moveDescription: 'Dzieło zniknie z atelier. Przywrócisz je z Archiwum.',
		move: 'Przenieś do Archiwum',
		moving: 'Przenoszenie…',
		moved: (number: string): string => `Przeniesiono ${number} do Archiwum.`,
		restored: (number: string): string => `Przywrócono ${number}.`,
		deleteTitle: (number: string): string => `Usunąć ${number} na zawsze?`,
		deleteDescription: (number: string): string =>
			`Dzieło ${number} i Twój obraz znikną bezpowrotnie.`,
		deleted: (number: string): string => `Usunięto ${number} na zawsze.`
	}
};

type PluralForms = Record<'one' | 'few' | 'many', string>;

const pluralRules = new Intl.PluralRules('pl');

function reviewedToday(count: number, minutes: number): string {
	return `Dziś udało się powtórzyć ${workCount(count)}. Zajęło Ci to ${minuteCount(minutes)}.`;
}

function minuteCount(count: number): string {
	return `${count} ${plural(count, { one: 'minutę', few: 'minuty', many: 'minut' })}`;
}

function counter(unit: string, before = ''): (value: number, next?: number) => string {
	return (value, next) =>
		next === undefined
			? `${before}${value} ${unit} · najwyższy poziom`
			: `${before}${value} z ${next} ${unit}`;
}

function pointCount(count: number): string {
	return `${count} ${plural(count, { one: 'punkt', few: 'punkty', many: 'punktów' })}`;
}

function visitCount(count: number): string {
	return `${count} ${plural(count, { one: 'wizyta', few: 'wizyty', many: 'wizyt' })}`;
}

function workCount(count: number): string {
	return `${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`;
}

function plural(count: number, forms: PluralForms): string {
	const category = pluralRules.select(count);
	return category === 'one' || category === 'few' ? forms[category] : forms.many;
}
