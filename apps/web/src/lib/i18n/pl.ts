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
		moreActions: 'Więcej działań',
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
		creditLabel: 'Źródło obrazu',
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
		bar: 'Nawigacja',
		open: 'Otwórz menu',
		close: 'Zamknij menu',
		expand: 'Rozwiń menu',
		collapse: 'Zwiń menu',
		atelier: 'Atelier',
		cardIndex: 'Kartoteka',
		glossary: 'Słowniczek',
		timeline: 'Kalendarium',
		chronicle: 'Kronika',
		exhibitions: 'Wystawy',
		review: 'Powtórki',
		displayCase: 'Ekspozycja',
		displayCaseNew: 'Ekspozycja, nowe',
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
	addSheet: {
		title: 'Dodaj',
		close: 'Zamknij',
		artwork: 'Dzieło',
		term: 'Pojęcie',
		visit: 'Wizyta',
		event: 'Wydarzenie'
	},
	settings: {
		title: 'Ustawienia',
		back: 'Atelier',
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
			removePhoto: 'Usuń zdjęcie',
			name: 'Imię',
			rankForm: 'Forma stopni',
			rankFormMasculine: 'Kustosz',
			rankFormFeminine: 'Kustoszka',
			careerShown: 'Pokazuj stopień i Ekspozycję',
			careerShownHint:
				'Po wyłączeniu ani postęp, ani eksponaty nie będą widoczne w atelier, ale nadal będą zliczane, więc w każdej chwili możesz je ponownie włączyć.',
			nameTooLong: (max: number): string => `Imię może mieć najwyżej ${max} znaków.`,
			nameSaved: 'Zapisano imię.',
			photoSaved: 'Zapisano zdjęcie.',
			photoRemoved: 'Usunięto zdjęcie.',
			errorTitle: 'Nie udało się zapisać profilu',
			failed: 'Nie udało się zapisać profilu. Spróbuj jeszcze raz.',
			avatarQuotaFull:
				'Brakuje miejsca na zdjęcia, więc awatara nie da się teraz zapisać. Usuń niepotrzebne zdjęcia dzieł. Miejsce zwolni się w ciągu doby.'
		},
		account: {
			emailTitle: 'Zmiana adresu e-mail',
			currentEmail: 'Obecny adres:',
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
			legalTitle: 'Regulamin i Polityka prywatności',
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
			sessionTitle: 'Sesja',
			sessionSize: 'Dzieła w jednej sesji',
			newPerDay: 'Nowe dzieła dziennie',
			form: 'Domyślna forma',
			formHint: 'Zmienisz ją też na starcie powtórki.',
			free: 'Powtórka swobodna',
			freeHint: 'Gdy skończysz powtórki na dziś, pojawi się propozycja kolejnej rundy.',
			quizzesTitle: 'Quizy',
			kindLabels: {
				quiz_image: 'Dopasowywanie dzieła do tytułu',
				quiz_title: 'Dopasowywanie tytułu do dzieła',
				quiz_author: 'Dopasowywanie autora do dzieła',
				quiz_style: 'Dopasowywanie stylu do dzieła',
				quiz_pin: 'Dopasowywanie detalu do definicji',
				quiz_typed: 'Wpisywanie tytułu dzieła z pamięci'
			},
			kindsHint: 'Zostaw zaznaczony przynajmniej jeden rodzaj dopasowywania.',
			extraTitle: 'Pytania dodatkowe',
			glossaryOn: 'Pytania ze Słowniczka',
			glossaryQuestions: 'Liczba pytań w sesji',
			noteQuestions: 'Luka w Twoich notatkach',
			timeQuestions: 'Rok powstania i kolejność dzieł',
			viewHint:
				'Ustaw, co powinno być widoczne w widoku dzieła zaraz po otwarciu. Pinezki i lupę możesz też zawsze włączyć, korzystając z przycisków w prawym górnym rogu głównego panelu dzieła.',
			showPins: 'Pokazuj pinezki od razu po otwarciu dzieła',
			loupe: 'Włączaj lupę od razu po otwarciu dzieła',
			sourcesHint:
				'Jeśli zaznaczysz opcję, materiały dotyczące danej wartości będą pobierać się automatycznie po uzupełnieniu potrzebnych do pobrania szczegółów. ' +
				'Po wyłączeniu nadal możesz korzystać z podpowiedzi, używając odpowiedniego przycisku w formularzu.',
			fetchImage: 'Automatycznie szukaj obrazu nowego dzieła w Wikidata i Commons',
			fetchDefinition: 'Automatycznie uzupełniaj definicję hasła ze Słowniczka z Wikipedii',
			fetchForms: 'Automatycznie podpowiadaj odmianę wyrazu z Wikisłownika dla hasła ze Słowniczka',
			fetchEvent: 'Automatycznie uzupełniaj opis i daty wydarzenia z Wikipedii',
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
				symbols: 'symboli w atlasie symboli',
				timeline_events: 'wydarzeń w Kalendarium',
				visits: 'wizyt w Kronice',
				exhibitions: 'wystaw',
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
			storageUsageStart: 'Twoje zdjęcia zajmują',
			storageUsed: (usedMegabytes: string): string => `${usedMegabytes} MB`,
			storageUsageEnd: (quotaMegabytes: string): string => `z ${quotaMegabytes} MB.`,
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
		searchShort: 'Szukaj',
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
		eraSpan: (from: number, to: number): string => {
			if (from < 0 && to < 0) return `${-from} – ${-to} p.n.e.`;
			const year = (value: number): string => (value < 0 ? `${-value} p.n.e.` : `${value}`);
			return `${year(from)} – ${year(to)}`;
		},
		filters: {
			title: 'Filtry',
			button: 'Filtry',
			buttonWithCount: (count: number): string => `Filtry (${count})`,
			viewButton: 'Widok',
			viewTitle: 'Widok',
			layout: 'Układ ściany na telefonie',
			layoutOne: 'Jedna kolumna',
			layoutTwo: 'Dwie kolumny',
			closePanel: 'Zwiń filtry',
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
				wantToSee: 'Chcę zobaczyć',
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
				seen: 'Widziane na żywo',
				wantToSee: 'Chcę zobaczyć'
			},
			tag: (field: string, value: string): string => `${field} ${value}`,
			unknownAuthor: 'Autor nieznany',
			missing: {
				image: 'bez obrazu',
				year: 'bez roku',
				era: 'bez epoki',
				period: 'bez okresu',
				type: 'bez typu',
				outsideEra: 'rok poza epoką'
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
		takePhoto: 'Zrób zdjęcie',
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
	eraDialog: {
		title: 'Rok nie pasuje do epoki',
		description: (date: string, range: boolean, era: string, years: string): string =>
			`${range ? 'Lata powstania' : 'Rok powstania'} ${date} ${range ? 'nie mieszczą' : 'nie mieści'} się w epoce „${era}” (${years}). Jeśli tak ma być, po prostu zapisz dzieło.`,
		back: 'Wróć do formularza',
		confirm: 'Zapisz mimo to'
	},
	fieldTypeDialog: {
		title: (count: number): string =>
			count === 1 ? 'Usunąć wartość pola?' : 'Usunąć wartości pól?',
		description: (names: string[], type: string | null): string => {
			const target = type ? `typu „${type}”` : 'dzieł bez typu';
			const listed = names.map((name) => `„${name}”`).join(', ');
			return names.length === 1
				? `Pole ${listed} nie dotyczy ${target}, więc jego wartość zostanie usunięta z tego dzieła.`
				: `Pola ${listed} nie dotyczą ${target}, więc ich wartości zostaną usunięte z tego dzieła.`;
		},
		back: 'Wróć do formularza',
		confirm: 'Usuń i zapisz'
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
		hideInformation: 'Zwiń informacje',
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
	compare: {
		label: 'Porównaj',
		title: 'Porównanie',
		unavailable: 'Do porównania potrzebne są co najmniej dwa dzieła.',
		questionLead: 'Z czym porównać',
		questionEmpty: 'Które dzieła chcesz porównać?',
		search: 'Szukaj po tytule, autorze lub numerze',
		change: 'Zmień dzieło',
		swap: 'Zamień strony',
		loupeBoth: 'Lupa pokazuje to samo miejsce na obu obrazach',
		loadFailedTitle: 'Nie udało się wczytać porównania',
		loadingAtelier: 'Wczytywanie atelier…'
	},
	palette: {
		label: 'Paleta barw',
		hide: 'Ukryj paletę barw',
		unreadable: 'Ten obraz nie pozwala odczytać swoich kolorów.',
		collecting: 'Zbieranie kolorów…',
		colour: (hex: string, percent: number): string => `${hex}, ${percent}%`
	},
	favourite: {
		add: 'Dodaj do ulubionych',
		remove: 'Usuń z ulubionych',
		added: 'Dodano do ulubionych.',
		removed: 'Usunięto z ulubionych.',
		failed: 'Nie udało się zapisać zmiany. Spróbuj jeszcze raz.'
	},
	wantToSee: {
		add: 'Chcę zobaczyć na żywo',
		remove: 'Usuń z „Chcę zobaczyć”',
		added: 'Dodano do dzieł, które chcesz zobaczyć.',
		removed: 'Usunięto z dzieł, które chcesz zobaczyć.'
	},
	review: {
		title: 'Powtórki',
		lead: 'Codziennie trafiają tu dzieła do powtórki: nowe z Twojego atelier i te, które warto sobie przypomnieć. Im lepiej pamiętasz dzieło, tym rzadziej wraca.',
		loadErrorTitle: 'Nie udało się wczytać powtórek',
		startErrorTitle: 'Nie udało się rozpocząć sesji powtórkowej',
		waiting: (count: number): string => `Na dziś do powtórki zaplanowane masz ${workCount(count)}`,
		planKnown: (count: number): string =>
			`${count} ${plural(count, { one: 'powracające', few: 'powracające', many: 'powracających' })}`,
		planFresh: (count: number): string =>
			`${count} ${plural(count, { one: 'nowe', few: 'nowe', many: 'nowych' })}`,
		streakCaption: 'Twoja seria powtórek',
		streakDays: (days: number): string =>
			plural(days, { one: 'dzień z rzędu', few: 'dni z rzędu', many: 'dni z rzędu' }),
		weekdays: ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'],
		today: 'dziś',
		streakWeek: (days: number, today: boolean): string =>
			`Ostatni tydzień: powtórki przez ${days} ${plural(days, { one: 'dzień', few: 'dni', many: 'dni' })} z rzędu, ${today ? 'także dziś' : 'dziś jeszcze bez powtórki'}.`,
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
		start: 'Zacznij powtórkę',
		preparing: 'Przygotowywanie rundy…',
		free: 'Powtórka swobodna',
		freeHint:
			'Dodatkowa runda losowo wybranych dzieł, które już powtarzasz. Nie zmienia planu powtórek ani nie wpływa na obecną serię.',
		freeTag: 'Tryb swobodny',
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
			typedQuestion: 'Jak nazywa się to dzieło?',
			typedHint: 'Zacznij wpisywać tytuł, a następnie wybierz pasującą podpowiedź z listy.',
			typedLabel: 'Tytuł dzieła',
			typedEmpty: 'Żadne dzieło w atelier nie ma takiego tytułu.',
			typedCheck: 'Sprawdź tytuł',
			definitionTag: 'Pytanie dodatkowe ze Słowniczka',
			noteTag: 'Pytanie dodatkowe z notatek',
			noteQuestion: 'Jakiego pojęcia brakuje w Twojej notatce?',
			noteSource: 'Z notatki do dzieła',
			showArtwork: 'Pokaż dzieło',
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
		year: {
			tag: 'Odgadnij datę powstania',
			question: 'Kiedy powstało to dzieło?',
			hint: (era: string, years: string): string =>
				`Dzieło pochodzi z ${era} (${years}). Gdzie je umieścisz?`,
			eras: {
				prehistory: 'prehistorii',
				antiquity: 'starożytności',
				middle_ages: 'średniowiecza',
				early_modern: 'nowożytności',
				modern: 'nowoczesności',
				contemporary: 'współczesności'
			},
			slider: 'Rok powstania dzieła',
			earlier: 'Rok wcześniej',
			later: 'Rok później',
			check: 'Sprawdź rok',
			results: {
				3: 'Świetne wyczucie.',
				2: 'Blisko.',
				1: 'Tym razem daleko.'
			},
			made: (when: string): string => `Dzieło powstało ${when}.`,
			when: (years: string, span: boolean): string =>
				span ? `w latach ${years}` : `w roku ${years}`,
			miss: (guess: string, years: number, late: boolean): string =>
				`Strzał w rok ${guess} to o ${years} ${plural(years, { one: 'rok', few: 'lata', many: 'lat' })} za ${late ? 'późno' : 'wcześnie'}.`,
			inside: (guess: string, span: boolean): string =>
				span
					? `Twój rok ${guess} mieści się w latach powstania.`
					: `Strzał w rok ${guess} to dokładnie ten rok.`,
			guessMark: (guess: string): string => `Twój strzał: ${guess}`,
			axis: 'Oś epoki z prawdziwymi latami dzieła i Twoim strzałem'
		},
		order: {
			tag: 'Ułóż chronologicznie',
			question: 'W jakiej kolejności powstały te dzieła?',
			hint: 'Przeciągaj obrazy tak, aby ułożyć je w kolejności od najstarszego do najnowszego',
			hintTap:
				'Zaznacz dzieła po kolei, od najstarszego do najnowszego. Ponowne kliknięcie wycofa zaznaczenie.',
			keyboardHint:
				'Z klawiatury: wybierz obraz Tabem, chwyć Spacją, przesuń strzałkami i puść Spacją.',
			oldest: 'Najstarsze',
			newest: 'Najnowsze',
			imageAlt: 'Dzieło do ułożenia',
			place: (place: number, of: number): string => `Dzieło na miejscu ${place} z ${of}`,
			lifted: 'Chwycone. Strzałki przesuwają, Spacja puszcza, Escape przerywa.',
			moved: (place: number, of: number): string => `Miejsce ${place} z ${of}.`,
			dropped: (place: number): string => `Odłożone na miejscu ${place}.`,
			check: 'Sprawdź kolejność',
			shouldBe: (place: number): string => `powinno być ${place}`,
			right: 'Świetnie, kolejność się zgadza.',
			some: (right: number, of: number): string =>
				`Prawie: ${right} z ${of} dzieł ${right === 1 ? 'trafiło' : 'trafiły'} na swoje miejsce.`,
			none: 'Tym razem żadne dzieło nie trafiło na swoje miejsce.',
			trueOrder: 'Prawdziwa kolejność',
			axis: 'Oś z czterema dziełami w ich prawdziwych odstępach'
		},
		roundTitle: (count: number, minutes: number): string =>
			`${count} ${plural(count, { one: 'dzieło powtórzone', few: 'dzieła powtórzone', many: 'dzieł powtórzonych' })} w ${minuteCount(minutes)}`,
		roundLines: {
			years: 'Trafiony rok powstania:',
			orders: 'Poprawnie chronologicznie ułożone dzieła:',
			definitions: 'Poprawnie odgadnięte pojęcia:',
			notes: 'Poprawnie uzupełnione luki w notatkach:'
		},
		roundScore: (right: number, asked: number): string => `${right}/${asked}`,
		tomorrowStart: (count: number): string =>
			`Jutro ${plural(count, { one: 'będzie', few: 'będą', many: 'będzie' })} czekać na Ciebie`,
		tomorrowEnd: (count: number): string =>
			`${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })} do powtórki`,
		freePlan: 'Plan powtórek się nie zmienił.',
		ratings: {
			1: 'Nie wiem',
			2: 'Prawie',
			3: 'Wiem'
		},
		saveErrorTitle: 'Nie udało się zapisać odpowiedzi',
		saveFailed: 'Nie udało się zapisać odpowiedzi. Spróbuj jeszcze raz.',
		done: 'Gotowe',
		groups: {
			1: 'Do poprawki',
			2: 'Prawie',
			3: 'Opanowane'
		},
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
	eraBounds: {
		open: 'Dostosuj granice epoki',
		title: 'Ramy czasowe epoki',
		hint: 'Atelier przyjmuje standardowe ramy epok, ale to nie jedyne słuszne podejście. Jeśli chcesz, możesz je dostosować. Pamiętaj, że może to wpłynąć na zakres powtórek, a epoka przypisana już do dzieła nie zmieni się. Żeby zapewnić ciągłość biegu historii, sąsiednie epoki automatycznie dopasują się do nowych granic.',
		start: 'Początek',
		end: 'Koniec',
		startBeforeCommonEra: 'Początek p.n.e.',
		endBeforeCommonEra: 'Koniec p.n.e.',
		restore: 'Przywróć domyślne',
		yearRequired: 'Wpisz rok.',
		after: (year: string): string => `Rok musi być późniejszy niż ${year}.`,
		before: (year: string): string => `Rok musi być wcześniejszy niż ${year}.`,
		afterStart: 'Koniec musi być później niż początek.',
		previousMoves: (era: string, year: string): string =>
			`Po tej zmianie ${era} będzie się kończyć w ${year}.`,
		nextMoves: (era: string, year: string): string =>
			`Po tej zmianie ${era} będzie się zaczynać w ${year}.`,
		confirm: {
			title: 'Zapisać nowe ramy epoki?',
			description: (count: number): string =>
				`Po zmianie ${plural(count, { one: 'jedno dzieło wyjdzie', few: `${count} dzieła wyjdą`, many: `${count} dzieł wyjdzie` })} poza ramy swojej epoki. Nadal ${count === 1 ? 'będzie' : 'będą'} do niej przypisane i wpłynie to jedynie na zakres powtórek. Przypisanie dzieła do epoki możesz zmienić jedynie ręcznie.`,
			save: 'Zapisz'
		},
		outside: (count: number): string =>
			`${plural(count, { one: 'Jedno dzieło wychodzi', few: `${count} dzieła wychodzą`, many: `${count} dzieł wychodzi` })} poza ramy swojej epoki. Kliknij, aby przyjrzeć się im bliżej.`
	},
	eraYears: {
		until: (year: string): string => `do ${year}`,
		from: (year: string): string => `od ${year}`
	},
	eras: {
		prehistory: { name: 'prehistoria' },
		antiquity: { name: 'starożytność' },
		middle_ages: { name: 'średniowiecze' },
		early_modern: { name: 'nowożytność' },
		modern: { name: 'nowoczesność' },
		contemporary: { name: 'współczesność' }
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
		symbols: (limit: number): string =>
			`W atlasie symboli zmieści się ${limit} symboli. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		timelineEvents: (limit: number): string =>
			`W Kalendarium zmieści się ${limit} wydarzeń. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		visits: (limit: number): string =>
			`W Kronice zmieści się ${limit} wizyt. Usuń te, których już nie potrzebujesz, żeby dodać nowe.`,
		exhibitions: (limit: number): string =>
			`W atelier zmieści się ${limit} wystaw, razem z tymi w Archiwum. Usuń z Archiwum te, których już nie potrzebujesz.`,
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
		lead: 'Tu porządkujesz swoje epoki, okresy, style, autorów, miejsca i wydarzenia. Możesz też dodać własne pola, żeby dokładniej opisywać dzieła.',
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
		eventKinds: { single: 'Wydarzenie', span: 'Okres' },
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
			'Własne pola to dodatkowe informacje przy dziełach. Każde pole może dotyczyć wszystkich typów dzieł albo tylko wybranych.',
		reorder: 'Zmień kolejność',
		reorderDone: 'Gotowe',
		reorderHint: 'W tej kolejności pola stoją w formularzu dzieła.',
		moveFieldUp: (name: string): string => `Przesuń „${name}” wyżej`,
		moveFieldDown: (name: string): string => `Przesuń „${name}” niżej`,
		page: {
			kind: 'Własne pole',
			appliesTo: 'Dotyczy dzieł typu',
			allTypes: 'Wszystkie typy',
			noList: 'To pole nie ma listy wartości, wpisujesz je przy dziele.',
			valueCount: (count: number): string =>
				`${count} ${plural(count, { one: 'wartość', few: 'wartości', many: 'wartości' })}`,
			notFoundTitle: 'Nie ma takiego pola',
			notFound: 'Nie ma takiego pola ani wartości. Może zostały usunięte albo połączone z inną.',
			valueKind: (field: string): string => `Wartość pola „${field}”`,
			artworks: 'Dzieła z tą wartością',
			noArtworks: 'Żadne dzieło nie ma jeszcze tej wartości.'
		},
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
		form: {
			newTitle: 'Nowe pole',
			description: 'Opis (opcjonalnie)',
			descriptionHint:
				'Wyjaśnienie, które może w przyszłości pomóc zdecydować, co wpisywać w tym polu.',
			kind: 'Rodzaj',
			kindFixed: 'Wybranego rodzaju nie będzie można zmienić po utworzeniu pola.',
			multiple: 'Dzieło może mieć kilka wartości',
			limited: 'Tylko dla wybranych typów dzieł',
			types: 'Typy dzieł',
			typesHint: 'Pole pojawi się tylko przy dziełach tych typów.',
			typesRequired: 'Wybierz co najmniej jeden typ dzieł.',
			narrowTitle: 'Część wartości zniknie',
			narrowDescription: (count: number): string =>
				`Pole jest uzupełnione w ${count} ${plural(count, { one: 'dziele, które nie ma', few: 'dziełach, które nie mają', many: 'dziełach, które nie mają' })} żadnego z wybranych typów. Po zapisaniu te wartości zostaną usunięte.`,
			narrowConfirm: 'Usuń wartości i zapisz',
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
		lead: 'Postaci ważne dla sztuki, pojęcia które warto znać by lepiej ją rozumieć, a także Twój własny atlas symboli powracających w wielu różnych dziełach i epokach.',
		tabsLabel: 'Słowniczek',
		tabs: {
			terms: 'Pojęcia',
			symbols: 'Symbole'
		},
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
		sortLabel: 'Sortuj',
		sorts: {
			name: 'Alfabetycznie',
			recent: 'Ostatnio dodane'
		},
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
			open: 'Otwórz w Słowniczku',
			loading: 'Wczytuję definicję…',
			failed: 'Nie udało się wczytać definicji. Spróbuj otworzyć ją jeszcze raz.',
			deleted: 'Tego hasła nie ma już w Słowniczku.'
		},
		view: {
			also: (forms: string): string => `też: ${forms}`,
			noDefinition: 'Nie dodano jeszcze definicji.',
			mentionsHeading: 'Pojawia się w notatkach',
			onArtworks: 'Na dziełach',
			fragments: 'Detale',
			fragmentsBack: 'Przewiń detale wstecz',
			fragmentsForward: 'Przewiń detale dalej',
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
			synonymsHint: 'Inne nazwy tego pojęcia będą używane przy wyszukiwaniu wystąpień w notatkach.',
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
	symbols: {
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'symbol', few: 'symbole', many: 'symboli' })}`,
		add: 'Dodaj symbol',
		emptyTitle: 'Atlas symboli jest jeszcze pusty',
		empty:
			'Gdy zauważysz motyw, który wraca na wielu dziełach, zapisz go tutaj razem z jego znaczeniami. Potem wskaż go w pinezce na dziele, a jego detale zbiorą się na stronie symbolu.',
		addFirst: 'Dodaj pierwszy symbol',
		search: 'Szukaj symbolu',
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment.`,
		sortLabel: 'Sortuj',
		sorts: {
			name: 'Alfabetycznie',
			recent: 'Ostatnio dodane',
			details: 'Najwięcej detali'
		},
		details: (count: number): string =>
			`${count} ${plural(count, { one: 'detal', few: 'detale', many: 'detali' })}`,
		meanings: (count: number): string =>
			`${count} ${plural(count, { one: 'znaczenie', few: 'znaczenia', many: 'znaczeń' })}`,
		loadErrorTitle: 'Nie udało się wczytać atlasu symboli',
		contextKinds: {
			author: 'autor',
			period: 'okres',
			style: 'styl',
			material: 'materiał',
			location: 'miejsce',
			era: 'epoka',
			artwork: 'dzieło',
			person: 'postać'
		},
		view: {
			overline: 'Symbol',
			general: 'znaczenie ogólne',
			summary: (text: string): string => `Na Twoich dziełach: ${text}`,
			noDetails: 'Żaden detal nie ma jeszcze tego znaczenia.',
			detailsBack: 'Przewiń detale wstecz',
			detailsForward: 'Przewiń detale dalej',
			withoutMeaning: 'Bez wskazanego znaczenia',
			axis: 'Przez wieki',
			axisLabel: 'Detale tego symbolu na osi lat powstania dzieł',
			notFoundTitle: 'Nie ma takiego symbolu',
			notFound: 'Nie ma takiego symbolu w atlasie. Może został usunięty.',
			loadErrorTitle: 'Nie udało się wczytać tego symbolu',
			saved: (name: string): string => `Zapisano „${name}”.`,
			deleted: (name: string): string => `Usunięto „${name}”.`
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć „${name}” z atlasu symboli?`,
			description:
				'Pinezki na dziełach zostaną, ale nie będą już wskazywać tego symbolu. Tej akcji nie będzie można cofnąć.'
		},
		form: {
			newTitle: 'Nowy symbol',
			editTitle: 'Edycja symbolu',
			nameTaken: (name: string): string => `Masz już w atlasie symbol „${name}”.`,
			meaningsLabel: 'Znaczenia',
			meaningHeading: (number: number): string => `Znaczenie ${number}`,
			meaning: 'Co oznacza?',
			meaningRequired: 'Wpisz, co oznacza ten symbol, albo usuń to znaczenie.',
			meaningTooLong: (max: number): string => `Znaczenie może mieć najwyżej ${max} znaków.`,
			context: 'W jakim kontekście?',
			contextHint:
				'Wybierz wartość z Kartoteki, postać ze Słowniczka, lub wpisz własny opis. Puste pole będzie traktowane jako znaczenie ogólne.',
			addMeaning: 'Dodaj znaczenie',
			removeMeaning: (number: number): string => `Usuń znaczenie ${number}`,
			moveUp: (number: number): string => `Przesuń znaczenie ${number} wyżej`,
			moveDown: (number: number): string => `Przesuń znaczenie ${number} niżej`,
			errorTitle: 'Nie udało się zapisać symbolu'
		},
		errors: {
			notFound: 'Nie ma takiego symbolu w atlasie. Może został usunięty.',
			invalid: 'Nie udało się zapisać symbolu. Sprawdź nazwę i znaczenia.'
		}
	},
	career: {
		title: 'Ekspozycja',
		lead: 'Sale z eksponatami, które udało Ci się zgromadzić, rozwijając swoje atelier. Każdy eksponat pokazuje Twoje postępy w innej dziedzinie nauki i kolekcjonowania. Niektóre są ukryte i odsłonią się dopiero wtedy, gdy spełnisz warunek ukryty w zagadce.',
		loadErrorTitle: 'Nie udało się wczytać Ekspozycji',
		tier: (tier: string, total: string): string => `Poziom ${tier} z ${total}`,
		new: 'Nowe',
		tierDate: (tier: string, date: string): string => `Poziom ${tier} · ${date}`,
		hiddenName: 'Ukryty eksponat',
		roomNumber: (number: string): string => `Sala ${number}`,
		roomFinished: (finished: number, total: number): string => `Ukończone: ${finished} z ${total}`,
		roomEmpty: 'Wszystkie eksponaty tej sali są teraz schowane.',
		showFinished: 'Pokaż ukończone',
		showLocked: 'Pokaż nieodblokowane',
		rooms: {
			main_hall: 'Sala główna',
			era_enfilade: 'Amfilada epok',
			reading_room: 'Czytelnia',
			scriptorium: 'Skryptorium',
			map_room: 'Sala map',
			pavilion: 'Pawilon',
			crypt: 'Krypta'
		},
		newRank: 'nowy stopień',
		newCuriosity: 'nowa ciekawostka',
		source: 'Źródło',
		curiosities: {
			collection: [
				'Muzeum Ashmolean w Oksfordzie otworzyło się w 1683 roku i od początku wpuszczało zwiedzających spoza uniwersytetu. Uchodzi za jedno z pierwszych publicznych muzeów na świecie.',
				'„Raj” Tintoretta w Pałacu Dożów w Wenecji ma około 24,5 na 7,6 metra i uważa się go za jeden z największych obrazów na płótnie. Tintoretto malował go w latach 1588–1592 razem z synem Domenikiem i warsztatem.',
				'Anna Maria Luisa, ostatnia z Medyceuszy, rodu wielkich książąt Toskanii, w „Pakcie rodzinnym” z 1737 roku zapisała zbiory rodu Florencji – pod warunkiem, że nigdy jej nie opuszczą i będą służyć publiczności. W 1769 roku Galerię Uffizi otwarto jako muzeum w dzisiejszym rozumieniu.',
				'Londyński lekarz Hans Sloane zgromadził jedną z największych prywatnych kolekcji roślin, zwierząt, starożytności i monet, którą zapisał narodowi brytyjskiemu w zamian za 20 000 funtów dla spadkobierców. W roku jego śmierci, 1753, założono British Museum, częściowo po to, żeby ją pomieścić.',
				'Muzea Kapitolińskie w Rzymie liczą swoje dzieje od 1471 roku, gdy papież Sykstus IV podarował mieszkańcom miasta grupę posągów z brązu. To jedne z najstarszych publicznych muzeów na świecie.',
				'Prado otwarto w Madrycie 19 listopada 1819 roku jako Królewskie Muzeum Malarstwa i Rzeźby, z 311 obrazami. Dziś ma około 8000 obrazów, z których 1700 wisi w budynku Villanuevy.',
				'Panel „Sprawiedliwi sędziowie” z XV-wiecznego Ołtarza Gandawskiego braci van Eyck skradziono z katedry św. Bawona w nocy 10 kwietnia 1934 roku i nigdy go nie odnaleziono. W ołtarzu jest dziś kopia, a śledztwo wciąż trwa.',
				"„Salvator Mundi” przypisywany Leonardowi da Vinci sprzedano w 1958 roku za 45 funtów jako kopię. W 2017 roku w domu aukcyjnym Christie's w Nowym Jorku osiągnął 450,3 miliona dolarów, najwyższą cenę zapłaconą za obraz.",
				'Największą kradzież dzieł sztuki w historii popełniono 18 marca 1990 roku w Muzeum Isabelli Stewart Gardner w Bostonie: dwaj mężczyźni przebrani za policjantów wynieśli 13 dzieł, wartych dziś ponad 500 milionów dolarów. Puste ramy wciąż wiszą w muzeum.'
			],
			eras: [
				'Antyczne miasto Herkulanum, ukryte pod około 20 metrami materiału wulkanicznego, zaczęto systematycznie badać w 1738 roku na polecenie króla Neapolu Karola Burbona. Żeby dotrzeć do jego ulic, kopano szyby i tunele.',
				'Gdy w styczniu 1506 roku w winnicy na rzymskim Eskwilinie odkopano marmurową grupę – mężczyznę z dwoma synami w splotach węży morskich – papież Juliusz II wysłał tam Michała Anioła i Giuliana da Sangallo. Sangallo miał od razu rozpoznać „Laokoona”, znanego dotąd tylko z opisu Pliniusza Starszego w I-wiecznej „Historii naturalnej”.',
				'Jaskinię Lascaux w Dordonii, z około 600 prehistorycznymi malowidłami, odkrył w 1940 roku 18-letni Marcel Ravidat, którego pies Robot natrafił na dziurę pod wywróconym drzewem. Dwutlenek węgla, ciepło i wilgoć od zwiedzających uszkodziły malowidła, więc w 1963 roku jaskinię zamknięto, a od lat 80. ogląda się jej repliki.',
				'Malowane bizony na sklepieniu jaskini Altamira zauważyła w 1879 roku córka badacza Marcelina Sanza de Sautuoli. Większość uczonych odrzuciła ich prehistoryczny wiek, który uznano dopiero w 1902 roku.',
				"Terakotową armię, pochowaną przy grobowcu pierwszego cesarza Chin, odkryto w 1974 roku pod Xi'an i odkopano z niej już ponad 1500 figur naturalnej wielkości. Wojownicy byli pierwotnie malowani, ale po wydobyciu z ziemi farba znikała nieraz w ciągu kilku minut."
			],
			memory: [
				'Cyceron opisał legendę o greckim poecie Symonidesie, który wyszedł z sali bankietowej tuż przed zawaleniem się stropu. Ciał gości nie dało się rozpoznać, ale Symonides, idąc w myślach wzdłuż stołu, przypomniał sobie, kto gdzie siedział. Tak miała powstać metoda loci: zapamiętywanie rzeczy przez rozmieszczanie ich obrazów w wyobrażonych miejscach.',
				'Włoski jezuita Matteo Ricci, słynący z niezwykłej pamięci, napisał w 1596 roku „Zachodnią metodę pamięci”, żeby pomóc Chińczykom w nauce do egzaminów urzędniczych. Metoda polegała na rozmieszczaniu obrazów w wyobrażonych budowlach, a jako obrazy Ricci wybrał chińskie znaki.',
				'Malarz James Whistler długo przyglądał się nocą Tamizie w Londynie, a potem odwracał się plecami i recytował szczegóły widoku towarzyszowi, który poprawiał jego pomyłki. Swoje „Nokturny”, prawie abstrakcyjne obrazy nocnej rzeki, malował dopiero następnego dnia w pracowni z tego, co zostało mu w pamięci.',
				'Uczony Aby Warburg od 1924 roku rozkładał na 63 drewnianych tablicach obciągniętych czarnym płótnem 971 reprodukcji dzieł, zestawiając obok siebie obrazy z różnych epok. Chciał pokazać, jak motywy ze starożytności powracają w późniejszej sztuce. Atlasu „Mnemosyne” nie skończył przed śmiercią w 1929 roku, a z tablic zostały tylko czarno-białe fotografie.',
				'Malarz samouk Franco Magnani wyjechał z toskańskiego Pontito w 1958 roku, mając 24 lata. Później namalował ponad 100 widoków rodzinnej wsi, wszystkie wyłącznie z pamięci.',
				'Artysta Stephen Wiltshire, u którego w dzieciństwie zdiagnozowano autyzm, po 20 minutach lotu helikopterem nad Nowym Jorkiem narysował panoramę miasta na płótnie długim na około 6 metrów. Nie korzystał przy tym ze zdjęć, tylko z pamięci.',
				'Wenecki malarz Bernardo Bellotto, zwany Canalettem, namalował dla króla Stanisława Augusta widoki Warszawy, które po 1945 roku posłużyły do odbudowy miasta – razem z tym, co dodał od siebie. Jaszczurki i goryl jedzący banana na dachu Pałacu Branickich nigdy go nie zdobiły, a stoją tam dziś, bo namalował je Bellotto.'
			],
			bullseye: [
				'Na autoportrecie z 1500 roku, który wisi w monachijskiej Alte Pinakothek, Albrecht Dürer umieścił łaciński napis: „Ja, Albrecht Dürer z Norymbergi, przedstawiłem się we właściwych barwach w wieku 28 lat”.',
				'„Pejzaż” z Gabinetu Rysunków i Rycin Galerii Uffizi, datowany na 5 sierpnia 1473 roku, to pierwsze pewnie datowane dzieło Leonarda da Vinci. Artysta, urodzony w 1452 roku w Vinci, miał wtedy niewiele ponad 20 lat.',
				'Szwajcarski specjalista od barw Johann Jacob Diesbach uzyskał w Berlinie błękit pruski przypadkiem: próbował zrobić czerwony lak, a wyszedł mu głęboki błękit. Kronika z epoki podaje 1706 jako rok wynalezienia barwnika, a już w 1709 roku Pieter van der Werff użył go w obrazie „Złożenie do grobu”.',
				'Wolfgang Beltracchi przez 14 lat sprzedawał własne obrazy jako dzieła znanych artystów. Zdradził go „Czerwony obraz z końmi”, rzekomo Heinricha Campendonka z 1914 roku: biel tytanowa w jego farbie w 1914 roku jeszcze nie istniała.',
				'Mapa Winlandii, którą Uniwersytet Yale ogłosił w 1965 roku jako XV-wieczną, miała dowodzić, że wikingowie dotarli do Ameryki Północnej przed Kolumbem, ale okazała się fałszerstwem z XX wieku. Jej linie i napisy wykonano tuszem z anatazem, formą dwutlenku tytanu stosowaną dopiero od lat 20. XX wieku, choć pergamin pochodzi z lat około 1400–1460.',
				'Obraz w stylu amerykańskiego malarstwa ludowego, podpisany „Sarah Honn” i datowany „5 maja 1866”, namalowano na XIX-wiecznym płótnie. Zdradził go olej w farbie: nadmiar izotopu węgla powstałego w wyniku prób jądrowych pokazał, że nasiona na ten olej zebrano w latach 1958–1961 albo 1983–1989. Fałszerz Robert Trotter przyznał, że namalował obraz w 1985 roku.'
			],
			regular: [
				'Rzeźbiarz z Norymbergi Wit Stwosz pracował nad ołtarzem dla kościoła Mariackiego w Krakowie, jednym z największych gotyckich ołtarzy na świecie, od 1477 do 1489 roku. Ponad 200 figur wyrzeźbił w drewnie lipowym, konstrukcję zrobiono z dębu, a tło z modrzewia.',
				"Malarz Jean-Auguste-Dominique Ingres pracował nad obrazem „Źródło” od 1820 do 1856 roku, czyli 36 lat, i skończył go, mając 76 lat. Dziś obraz wisi w Musée d'Orsay.",
				'Lorenzo Ghiberti, jeden z najważniejszych artystów wczesnego renesansu, pracował ze swoim warsztatem nad pierwszymi brązowymi drzwiami florenckiego baptysterium ponad 20 lat, a nad kolejnymi 27 lat. Te drugie Michał Anioł uznał za godne, by być bramą raju, i tak się je dziś nazywa.',
				'„Bramę piekieł” państwo francuskie zamówiło u Rodina w 1880 roku do muzeum, które nigdy nie powstało, bo w jego miejscu zaplanowano dworzec. Rodin pracował nad nią latami, ale w brązie odlano ją dopiero po jego śmierci.',
				'Simon Rodia budował Wieże Watts w Los Angeles przez 33 lata, od 1921 do 1954 roku. Uchodzą za największą budowlę wzniesioną przez jedną osobę, a stalowe pręty łączył drutem i zaprawą, bez spawania.',
				'Listonosz Ferdinand Cheval potknął się w 1879 roku o kamień dziwnego kształtu i zaczął zbierać kamienie na trasie z listami. Przez 33 lata zbudował z nich Pałac Idealny, a sam doliczył się 93 000 godzin pracy.',
				'Budowę barcelońskiej Sagrada Família zaczęto w 1882 roku, a rok później przejął ją Antoni Gaudí, który od 1914 roku zajmował się już tylko nią, aż do śmierci w 1926 roku. Za jego życia ukończono jedną wieżę, a zewnętrzną część wieży Jezusa Chrystusa skończono dopiero w lutym 2026 roku.',
				'Kamień węgielny pod katedrę w Kolonii położono w 1248 roku, a po 1520 roku budowa stanęła na ponad 300 lat. Wznowiono ją w XIX wieku i ukończono w 1880 roku, bardzo dokładnie trzymając się średniowiecznego planu fasady.'
			],
			back_from_storage: [
				'Po kradzieży „Mony Lisy” w 1911 roku poeta Guillaume Apollinaire spędził tydzień w areszcie, bo policja powiązała go z egipskimi figurkami skradzionymi wcześniej z Luwru. Wskazał wtedy na swojego przyjaciela, Pabla Picassa, ale obaj byli niewinni: obraz ukradł pracownik Luwru Vincenzo Peruggia.'
			],
			chronicle: [
				'Paryskie wystawy żyjących artystów nazwano Salonami od sali Luwru, w której je urządzano, czyli Salon Carré. Mimo nazwy sala jest prostokątna, a „carré” oznacza tu tylko, że ma proste kąty.',
				'Luwr otwarto jako muzeum 10 sierpnia 1793 roku. W tygodniu wpuszczano do niego artystów, którzy przychodzili tam się uczyć, a zwykła publiczność mogła wejść tylko w niedzielę.',
				'Wystawa Vermeera w Rijksmuseum w 2023 roku zebrała 28 z 37 jego dzieł, więcej niż kiedykolwiek wcześniej. Przez 16 tygodni obejrzało ją 650 000 osób ze 113 krajów, choć muzeum celowo ograniczało liczbę wejść.',
				'Wystawę skarbów Tutanchamona w British Museum w 1972 roku obejrzało 1 694 117 osób. Kolejka ciągnęła się codziennie od sali na pierwszym piętrze przez całe muzeum aż na chodnik przed budynkiem.',
				'W oczekiwaniu na wystawę Walentina Sierowa, rosyjskiego portrecisty artystów, arystokratów i carów, w moskiewskiej Galerii Tretiakowskiej w 2016 roku ludzie stali godzinami w kolejce na mrozie. Muzeum wydłużyło godziny otwarcia, w namiotach przy kolejce rozdawano kaszę gryczaną i herbatę, a wystawę obejrzało 440 000 osób.',
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
				'„Mleczarka” Vermeera z Rijksmuseum, obraz służącej nalewającej mleko, ma tylko 45,5 na 41 cm. Światło na przedmiotach Vermeer oddał na nim setkami drobnych kolorowych kropek.',
				'Tkanina z Bayeux, XI-wieczna opowieść o podboju Anglii przez księcia Normandii w 1066 roku, ma prawie 70 metrów długości i tylko 50 cm wysokości. W muzeum w Bayeux ogląda się ją w zaciemnionej sali, w której oświetlone jest wyłącznie samo dzieło.',
				'„Straż nocną” Rembrandta obcięto w 1715 roku przy przenosinach do amsterdamskiego ratusza, z trzech stron, najbardziej z lewej. Odcięte pasy płótna się nie zachowały, a pełną kompozycję znamy z kopii przypisywanej Gerritowi Lundensowi.',
				'Wersje „Krzyku” w muzeum MUNCH w Oslo powstały na papierze i tekturze, więc żadna nie może wisieć na stałe. Pokazuje się je na zmianę w ciągu dnia, a dwie pozostałe odpoczywają w tym czasie w ciemności.',
				'Art Institute of Chicago ma 3 odbitki „Wielkiej fali w Kanagawie” Hokusaia, ale zwykle pokazuje ją tylko przez 3 miesiące co 4 lata. Przez resztę czasu drzeworyt odpoczywa w magazynie.'
			],
			timeline: [
				'Nad lustrem w „Portrecie małżonków Arnolfinich” Jan van Eyck wypisał ozdobnym pismem „Johannes de eyck fuit hic 1434”, czyli „Jan van Eyck był tutaj. 1434”.',
				'Słoje drewna pozwalają ustalić najwcześniejszy możliwy rok ścięcia drzewa, a więc i powstania deski pod obrazem. Takie badanie 294 obrazów na desce Jordaensa, van Dycka, ich warsztatów i kopistów pokazało, że 71% desek pochodziło z dębu bałtyckiego. Drewno to sprowadzano wtedy z Polski i innych krajów nad Bałtykiem.',
				'W ostatnim wersie czterowiersza na ramie „Ołtarza gandawskiego” wyróżniono kilka liter. Suma ich wartości jako cyfr rzymskich daje 1432, rok, w którym 6 maja ołtarz ustawiono w katedrze św. Bawona.',
				'W 1933 roku Metropolitan Museum wystawiło trzy posągi wojowników z terakoty jako dzieła etruskie. W 1961 roku muzeum przyznało, że nie są starożytne, gdy jeden z ich twórców, Alfredo Fioravanti, przyniósł kciuk z wypalonej gliny, który latami trzymał u siebie. Pasował idealnie do dłoni jednego z posągów.',
				'Malowidło w jaskini Leang Karampuang na Sulawesi ma co najmniej 51 200 lat i przedstawia postaci podobne do ludzi obok świni. Wiek ustalono laserem, badając kryształy węglanu wapnia, które narosły na nim później.'
			],
			glossary: [
				'Nazwa impresjonizmu pochodzi od „Impresji, wschodu słońca” Moneta. Krytycy wyśmiali to dzieło na pierwszej wystawie grupy w Paryżu w 1874 roku, a jego tytuł zrobili obelgą dla całego ruchu.',
				'Słowo „barok”, którym określa się dramatyczną, pełną rozmachu sztukę XVII wieku, było początkowo pogardliwe. Może pochodzić od portugalskiego „barroco”, czyli perły o nieregularnym kształcie.',
				'Sfumato to „przydymiona” jakość malarstwa, która rozmywa kontury, tak że postaci wyłaniają się z ciemnego tła. Leonardo da Vinci radził w niedokończonym traktacie o malarstwie malować „bez linii”.',
				'Nazwa kubizmu wzięła się najpewniej z uwagi krytyka Louisa Vauxcellesa. W 1908 roku napisał o dziełach Braque’a wystawionych w Paryżu, że sprowadzają wszystko do geometrycznych zarysów, do sześcianów.',
				'Słowo „gotycki” ukuli włoscy pisarze późnego renesansu jako synonim „barbarzyńskiego”. Przypisywali ten styl Gotom, którzy zniszczyli Cesarstwo Rzymskie.',
				'Groteska, rodzaj ornamentu, wzięła nazwę od włoskiego „grottesco”. Jej wzory podpatrzono w starożytnych dekoracjach odkrytych pod koniec XV wieku w podziemnych salach, czyli grotach, Złotego Domu Nerona w Rzymie. Pod kierunkiem Rafaela ozdobiono nią potem loggie Pałacu Watykańskiego.',
				'Secesję Włosi nazywali między innymi „Stile Liberty”, od londyńskiego domu towarowego Liberty & Co. Niemcy mówili „Jugendstil”, od monachijskiego pisma „Die Jugend”.'
			],
			laurel_skull: [
				'„Homo bulla”, czyli „człowiek jest bańką”, to starożytne powiedzenie, które w XVI wieku przywrócił Erazm z Rotterdamu w zbiorze przysłów „Adagia”. Bańka jest krucha i piękna tylko przez chwilę, zanim pęknie, dlatego malarze przedstawiali dzieci puszczające bańki, by mówić o kruchości ludzkiego życia.',
				'Pierwszą drukowaną książką uznaną za księgę symboli był „Emblematum liber” Andrei Alciata, wydany w Augsburgu 28 lutego 1531 roku. Miał 104 emblematy, z czego 97 z drzeworytami, które zamówił humanista Conrad Peutinger. Sam Alciato najpewniej nie miał z tym wydaniem nic wspólnego.',
				'„Iconologia” Cesarego Ripy, podręcznik symboli dla artystów, opisuje Malarstwo jako kobietę o rozwichrzonych czarnych włosach, z ustami przewiązanymi chustą, bo malarstwo jest nieme, i z maską na złotym łańcuchu. Artemisia Gentileschi namalowała się jako ta alegoria, pomijając knebel. Jej koledzy mężczyźni nie mogli tak utożsamić się z kobiecą personifikacją Malarstwa.',
				'W XVII wieku jezuitę Athanasiusa Kirchera, jednego z pierwszych badaczy starożytnego Egiptu, uważano za tego, który odczytał hieroglify. W 1650 roku wydał w Rzymie przekład napisów z obelisku, który do dziś stoi na Fontannie Czterech Rzek Berniniego. Przekład był błędny, a hieroglify odczytano naprawdę dopiero 150 lat później.',
				'Grecki autor Horapollon z Aleksandrii objaśniał w V wieku znaczenia hieroglifów, a według jego dzieła czytano je potem jak szyfr-rebus dla wtajemniczonych, który nie zapisuje mowy. Dopiero w 1822 roku Jean-François Champollion pokazał na imionach Ptolemeusza i Kleopatry, że Egipcjanie zapisywali obce imiona znakami oddającymi dźwięki.',
				'Niemiecki historyk sztuki Erwin Panofsky w 1934 roku wyemigrował na stałe do Stanów Zjednoczonych. W książce „Studies in Iconology” z 1939 roku oddzielił ikonologię od ikonografii, czyli odczytywania tematów dzieł przez symbole znane z literatury i innych dzieł sztuki.'
			],
			own_eye: [
				'Camera lucida, przyrząd optyczny opatentowany w 1807 roku przez Williama Hyde’a Wollastona, pozwalała rysownikowi widzieć jednocześnie widok i kartkę. Widok nakładał się na papier, więc wystarczyło go obrysować.',
				'Canaletto długo uchodził za malarza, który rysował Wenecję w plenerze z camera obscura. Badanie jego dopracowanych rysunków w podczerwieni wskazuje jednak, że powstawały w pracowni na podstawie szkiców z natury.',
				'William Henry Fox Talbot w podróży poślubnej próbował narysować jezioro Como za pomocą camera lucida. Twierdził później, że fotografię wynalazł, bo słabo rysował i go to frustrowało.',
				'Najstarsza zachowana fotografia wykonana camera obscura to heliografia Niépce’a z 1827 roku. Powstała na cynowej płycie pokrytej światłoczułym bitumem i naświetlała się przez kilka dni.',
				'Na zdjęciu paryskiego bulwaru, które Daguerre zrobił około 1838 roku, ruchliwa ulica wygląda na pustą, bo naświetlanie trwało 10 minut. Został na nim tylko mężczyzna, który stał w miejscu, bo czyszczono mu buty.'
			],
			night_watch: [
				'„Straż nocna” Rembrandta z 1642 roku pokazuje oddział strzelców, który na rozkaz dowódcy ustawia się do wymarszu. Jej właściwy tytuł to „Kompania strzelców dzielnicy II pod dowództwem kapitana Fransa Banninck Cocqa”, a nazwą „Nachtwacht” określa się ją dopiero od końca XVIII wieku.'
			],
			marathon: [
				'Pejzaż w dolnej części „Nemezis” Dürera rozpoznano jako miasteczko Klausen (Chiusa), które artysta mijał w drodze z Norymbergi do Wenecji. Boginię zbudował według kanonu proporcji Witruwiusza, starożytnego autorytetu, ale celowo nadał jej cięższą i mniej urodziwą sylwetkę.'
			],
			mouth_of_truth: [
				'Pencz pokazał na rycinie legendę o kobiecie oskarżonej o zdradę. Z dłonią w lwiej paszczy przysięgła, że leżała tylko w ramionach męża i błazna. Lew jej nie ugryzł, bo mówiła prawdę, tyle że błazen był jej kochankiem.'
			],
			prehistory: [
				'Do monumentalnych malowideł w jaskini Lascaux wystarczyło kilka krzemieni, bryłki barwnika, kamienie do rozcierania, parę pędzli i tamponów oraz szablony ze skór, choć najczęściej szablonem była ludzka dłoń. Barwnika było w okolicy pod dostatkiem, a rozrabiano go samą wodą.',
				'W hiszpańskiej jaskini Altamira, zamieszkanej między 36 000 a 13 000 lat temu, największe malowane bizony i konie mają od 125 do 170 cm długości. Ich kontury najpierw ryto i rysowano węglem, a potem wypełniano czerwoną albo żółtawą farbą. Brzuch czy sierść niektórych bizonów podkreślano jeszcze czarną farbą albo kawałkami węgla.',
				'Pod koniec XIX wieku wątpiono w prehistoryczny wiek malowideł jaskiniowych, bo ówcześni ludzie rzekomo nie umieliby zrobić przenośnej i dość jasnej lampy. W Lascaux znaleziono ich ponad 100: zwykle wapienne płytki z zagłębieniem na paliwo, a jedną wygładzoną, z czerwonego piaskowca, z uchwytem i rytą ozdobą.',
				'W jaskini Blombos na południowym wybrzeżu RPA znaleziono niemal nienaruszony zestaw do robienia farby sprzed 100 000 lat. Farbę z tartej czerwonej ochry, foczego tłuszczu, mielonej kości, węgla i płynu mieszano i przechowywano w muszlach uchowców, najstarszych znanych pojemnikach.',
				'Neolityczne posągi ludzi z Ain Ghazal w Jordanii, z lat 6900–5300 p.n.e., modelowano ręcznie z gipsu na szkielecie z wiązek trzciny związanych plecionymi sznurami, dzięki któremu stały. Trzcina zniknęła, zostawiając w gipsie odciski. Powierzchnię wygładzano szpachelką i palcami, a czubek głowy zostawiano chropowaty, bo miała go przykryć peruka.',
				'Wenus z Willendorfu, kamienna figurka sprzed 30 000 lat znaleziona nad Dunajem, ma półkoliste dołki po grudkach tlenku żelaza, które prawdopodobnie wypadły przy rzeźbieniu. Jeden jest w miejscu pępka, a ślady narzędzia sugerują, że artysta mógł usunąć tę grudkę celowo, a więc od początku wiedział, jak figurka ma wyglądać.'
			],
			antiquity: [
				'Na marmurowych rzeźbach z Partenonu, świątyni Ateny na ateńskim Akropolu, znaleziono ślady farby. Oświetlone czerwonym lub zielonym światłem ziarenka błękitu egipskiego, barwnika z wapna, miedzi i krzemu, świecą w podczerwieni, nawet te najdrobniejsze. Dzięki temu badacze odkryli, że tym błękitem malowano na rzeźbach wzory wełnianych szat i wodę, z której wyłania się Helios, bóg słońca.',
				'Malowidła ścienne w Pompejach powstawały na mokrym tynku, czyli al fresco. Witruwiusz, żyjący w I wieku p.n.e. autor traktatu „O architekturze”, zalecał wykorzystywanie 6 lub 7 warstw tynku, z mączką marmurową w górnych. Gotowe malowidło pokrywano cienką warstwą wosku, która chroniła kolory, więc można było użyć drogiej czerwieni z cynobru.',
				'W technice czerwonofigurowej, wynalezionej w Atenach około 530 roku p.n.e., postaci na wazie zostawały w kolorze gliny, a tło pokrywano czarnym szlamem. Czerń powstawała w piecu: bez dostępu powietrza, przy 950°C, szlam spiekał się w błyszczącą powłokę, a po wpuszczeniu powietrza glina wracała do czerwieni.',
				'Portrety mumii, znajdowane głównie w okolicach Fajum w Egipcie, malowano w I–III wieku na deskach lub całunach, między innymi enkaustyką, czyli farbą z pigmentów i roztopionego wosku pszczelego. Deski wyginano, żeby przylegały do twarzy mumii, więc potrzebne było giętkie drewno: około 70% desek zbadanych przez badaczkę z British Museum to lipa z Europy.',
				'Mozaikę z Aleksandrem Wielkim, odkrytą w 1831 roku w Domu Fauna w Pompejach, ułożono z ponad 2 milionów tesser, czyli kamyków. Badanie w muzeum w Neapolu wskazuje, że pochodziły z kamieniołomów w Italii, Grecji, Tunezji i na Półwyspie Iberyjskim, w tym kilka odcieni różu prawdopodobnie aż z Portugalii.',
				'Popiersie Nefertiti, żony faraona Echnatona, wykonane około 1340 roku p.n.e. z wapienia i gipsu, prawdopodobnie nigdy nie opuściło pracowni rzeźbiarza Totmesa. Zapewne służyło za wzór przy rzeźbieniu posągów królowej, co może tłumaczyć, dlaczego nigdy nie wstawiono mu drugiego oka.'
			],
			middle_ages: [
				'Ultramarynę, najsłynniejszy błękit w historii sztuki, uzyskiwano z lapis lazuli, półszlachetnego kamienia wydobywanego w Afganistanie. Najlepsze jej gatunki mogły być warte więcej niż złoto, a zleceniodawcy często płacili za dokładną ilość ultramaryny, jakiej chcieli w obrazie. Nazwa pochodzi od średniowiecznego łacińskiego słowa „ultramarinus”, czyli „zza morza”.',
				'Księga z Kells, rękopis czterech Ewangelii po łacinie spisany około 800 roku, ma 340 kart z welinu, czyli wyprawionej skóry cielęcej. Tekst przepisało czterech głównych skrybów, a jaskrawą żółć uzyskano z aurypigmentu, czyli żółtego siarczku arsenu.',
				'Tkanina z Bayeux, opowieść w obrazach i napisach, to w rzeczywistości haft, a nie gobelin: sceny wyszyto wełnianą nicią na 9 zszytych pasach lnianego płótna. Wełnę farbowano roślinami: urzetem na niebiesko, marzanną na czerwono i rezedą na żółto. Część niebieskich motywów wyblakła, bo barwnik nie wniknął w głąb włókien.',
				'Na panelu witrażowym z lat 1320–1324 z kościoła opactwa Saint-Denis obwódki namalowano związkiem srebra, który po wypaleniu w piecu daje żółtopomarańczowy kolor wnikający w bezbarwne szkło. Po angielsku ta technika to „silver stain” i od niej pochodzi angielska nazwa witrażu, „stained glass”.',
				'W średniowieczu przy budowie katedry w Canterbury część kamieniarzy dostawała zapłatę od dnia, a część od wykonanej sztuki. Dlatego każdy, kto ociosał kamień, znaczył go swoim znakiem, żeby móc udowodnić, ile mu się należy.',
				'Atrament żelazowo-galasowy robiono z galasów, czyli narośli na gałązkach i pąkach młodych drzew, w których jaja składa maleńka osa galasówka. Przepis z notatnika z początku XV wieku każe zmieszać z wodą po uncji galasów, gumy i siarczanu żelaza. Świeży atrament jest fioletowoczarny, ale z czasem, gdy żelazo się utlenia, brązowieje jak rdza.'
			],
			early_modern: [
				'Freski na sklepieniu Kaplicy Sykstyńskiej w Rzymie Michał Anioł malował na stojąco, z pędzlem nad głową, a farba i okruchy spadały mu na twarz. Rusztowanie zasłaniało okna, więc pracował przy lampach. Gdy latem 1511 roku zdjęto je z pierwszej połowy i zobaczył ją z dołu, w drugiej namalował większe postaci i czytelniejsze kompozycje.',
				'Papież Leon X zamówił u Rafaela dla Kaplicy Sykstyńskiej kartony, czyli ogromne projekty arrasów w pełnej skali. Arrasy tkano w Brukseli na krosnach, które dają odwrócony obraz projektu. Kartony pocięto na długie pionowe pasy, zapewne przy wysyłce do Brukseli w 1516 roku, żeby łatwiej je było przenosić i przechowywać.',
				'Peter Paul Rubens, malarz XVII wieku o ogromnym powodzeniu, miał o wiele za dużo zamówień, by wykonać je sam, więc zbudował dużą pracownię dla uczniów i asystentów. Wstawał o 4 rano i pracował do 17, a przy malowaniu kazał sobie czytać dzieła literatury klasycznej.',
				'Alchemik Johann Friedrich Böttger był więźniem Augusta Mocnego, elektora Saksonii i króla Polski, który kazał mu najpierw wytworzyć złoto, a potem porcelanę. W 1707 roku Böttger uzyskał czerwoną kamionkę podobną do chińskiej, bardzo poszukiwanej w Europie. Rok później jako pierwszy Europejczyk stworzył twardą porcelanę, taką jak we wschodniej Azji.',
				'„Nosorożca”, drzeworyt z 1515 roku, Albrecht Dürer wykonał, nigdy wcześniej nie widząc zwierzęcia, a jedynie jego opis i szkic przysłane do Norymbergi. Był to pierwszy od starożytności żywy nosorożec w Europie, który w maju 1515 roku dotarł do Lizbony. Król Portugalii wysłał go w darze papieżowi Leonowi X, ale statek zatonął i nosorożec utonął.',
				'Akwaforta, technika grafiki, wywodzi się z trawienia ozdób na metalu. Daniel Hopfer z Augsburga, który ozdabiał trawieniem zbroje cesarza Maksymiliana I, był jednym z pierwszych, którzy przenieśli tę technikę do grafiki. Swoje akwaforty robił na płytach stalowych.'
			],
			modern: [
				'Składaną metalową tubkę na farbę opatentował w 1841 roku John Goffe Rand, amerykański portrecista, który mieszkał wtedy w Anglii. Wcześniej malarze trzymali farby w świńskich pęcherzach, które trzeba było przekłuwać strzykawką, a tubka szybko stała się standardem. Na nagrobku Randa na cmentarzu Woodlawn w Bronksie widnieje tubka w reliefie.',
				'Brązy rzeźbiarza Augusta Rodina wciąż powstają: Muzeum Rodina, które jako jego spadkobierca ma prawa do jego dzieł, nadzoruje odlewy z oryginalnych modeli i form z jego spuścizny. Z jednego dzieła wolno odlać najwyżej 12 brązów, a każdy nowy odlew muszą zatwierdzić dwie komisje ekspertów od rzeźby.',
				'Georges Seurat namalował „Niedzielne popołudnie na wyspie Grande Jatte” kropkami różnych barw, które według teoretyka barw Michela-Eugène’a Chevreula zlewają się w oku widza. Wypróbował przy tym nową wtedy żółcień cynkową, która okazała się bardzo nietrwała i zbrązowiała. W ciągu kilku lat duże partie obrazu pociemniały.',
				'Jules Chéret, nazywany „ojcem plakatu”, był pionierem litografii barwnej w plakatach i wyprowadził tę nową formę sztuki na ulice Paryża. W 1866 roku założył własną drukarnię litograficzną. Jego plakaty kabaretów i music-halli były tak lubiane, że podobno wielbiciele zdejmowali je nocą ze ścian do swoich kolekcji.',
				'Papier collé to odmiana kolażu bliższa rysunkowi niż malarstwu. Pierwszy zastosował ją kubista Georges Braque: rysował na papierze udającym słoje drewna, naklejonym na biały papier. Pablo Picasso brał zamiast niego strony gazety „Le Journal”, a obaj tworzyli tak na przełomie 1912 i 1913 roku.',
				'Readymade to nazwa, którą Marcel Duchamp nadał dziełom z fabrycznych przedmiotów, jak „Koło rowerowe” z 1913 roku: koło zamocowane na drewnianym stołku. Najgłośniejszy z nich, „Fontannę”, stworzył w 1917 roku w Nowym Jorku: to męski pisuar podpisany fałszywym nazwiskiem i położony na plecach. Przedmioty wybierał, jak mówił, z wizualnej obojętności.'
			],
			contemporary: [
				'Jackson Pollock malował „Number 27, 1950” na dużym płótnie bez blejtramu, przybitym do podłogi, na które kapał, lał i rzucał zwykłą farbę do malowania domów. „Na podłodze czuję się swobodniej” – mówił, bo mógł obejść obraz, pracować z czterech stron i „dosłownie być w obrazie”.',
				'Andy Warhol od 1962 roku tworzył prace sitodrukiem fotograficznym: wybrane zdjęcie wysyłał do komercyjnej wytwórni sit, a gotowe sito wracało do Factory, jego pracowni w Nowym Jorku. „Każdy z moich asystentów, a właściwie ktokolwiek, odtworzy ten wzór tak dobrze jak ja” – mówił w 1969 roku.',
				'Malarz Yves Klein szukał spoiwa, czyli substancji wiążącej sproszkowany pigment w farbę, bo tradycyjne przygaszały jego błękit po wyschnięciu. Z paryskim kupcem farb Édouardem Adamem wybrał syntetyczną żywicę Rhodopas M. Przepis na tę farbę, nazwaną International Klein Blue, zarejestrował w 1960 roku, ale samego koloru nie opatentował, bo według francuskiego prawa barwa nie może mieć właściciela.',
				'Yayoi Kusama z japońskiego Matsumoto zbudowała w 1965 roku w Nowym Jorku swój pierwszy „Infinity Mirror Room”: pokój wyłożony lustrami, które odbijały widza w nieskończoność. Na podłodze stało kilkaset fallicznych wypustek z tkaniny w czerwone i białe grochy, wypchanych watą, a Kusama szyła je przez kilka lat.',
				'Rekina w formaldehydzie, „Fizyczną niemożliwość śmierci w umyśle żyjącego”, kolekcjoner Charles Saatchi zamówił u artysty Damiena Hirsta w 1991 roku za 50 000 funtów. Hirst użył 5-procentowego roztworu, a według kuratora zbiorów ryb z Muzeum Historii Naturalnej nie wstrzyknął formaldehydu w głębokie tkanki, przez co rekin nieco zmienił kształt.',
				'W 1995 roku artyści Christo i Jeanne-Claude owinęli berliński Reichstag 100 000 metrami kwadratowymi tkaniny pokrytej aluminium i 15 kilometrami niebieskiej liny. Zasłaniając budynek, chcieli odsłonić to, co w jego architekturze najważniejsze: konstrukcję i proporcje. Zgodę dostali dopiero po zjednoczeniu Niemiec, a dzieło za około 15 milionów dolarów sfinansowali sami.'
			],
			pinacotheca: [
				'Przy szufladach z owadami w gabinecie Levinusa Vincenta, kupca tkanin, pracowała jego żona Joanna van Breda, chwalona za ich artyzm; porównywano je do wzorów haftu. Na rycinie otwierającej katalog ich zbiorów kobieta uosabiająca Haft wyszywa igłą wzór w jednej z szuflad. Naprzeciw niej postać Malarstwa trzyma pędzel, wzór i drugą szufladę.'
			],
			vasari_lives: [
				'„Żywoty najwybitniejszych malarzy, rzeźbiarzy i architektów” Giorgia Vasariego, zbiór biografii artystów, ukazały się po raz pierwszy w 1550 roku. W drugim wydaniu z 1568 roku Vasari dodał portrety artystów, jedne z pierwszych przykładów takich wizerunków. Książka do dziś jest jednym z najważniejszych źródeł do badań nad artystami tamtej epoki.',
				'W katalogu grafik Rembrandta z 1751 roku, opracowanym przez Edme-François Gersainta, jego akwaforta z 1636 roku figuruje jako portret Menasseha ben Izraela, autora książki „Piedra Gloriosa”. Kolejni autorzy katalogów powtarzali to bez sprawdzania, choć badacze od dawna twierdzą, że to wcale nie on.',
				'Johannes Vermeer, nazywany Sfinksem z Delftu, pozostawił po sobie wyjątkowo mało dzieł: Rijksmuseum liczy jego dorobek na 37 obrazów. Na wystawę w 2023 roku muzeum zgromadziło co najmniej 28 z nich, wypożyczonych z Europy, Stanów Zjednoczonych i Japonii.',
				'Muzeum Wiktorii i Alberta w Londynie przechowuje pięć notesów Leonarda da Vinci, oprawionych w trzy tomy nazywane Kodeksem Forstera. Między zapisanymi pismem lustrzanym notatkami o geometrii, ciężarach i hydraulice są w nich szkice końskich nóg i notatki związane zapewne z „Ostatnią Wieczerzą”.',
				'Pablo Picasso to według Księgi rekordów Guinnessa najpłodniejszy malarz w historii. W ciągu 75 lat pracy stworzył około 13 500 obrazów i projektów, 100 000 grafik, 34 000 ilustracji książkowych oraz 300 rzeźb i ceramik.'
			],
			boncompagni_academy: [
				'W 1546 roku florencki uczony Benedetto Varchi zapytał najwybitniejszych artystów, która sztuka jest wyższa: malarstwo czy rzeźba, i ten spór nazwano paragone. Bronzino w niedokończonej odpowiedzi bronił malarstwa: według niego umie ono oddać trójwymiarowość rzeźby, a przy tym naśladować naturę tak, jak rzeźba nie potrafi.',
				'W 1563 roku książę Kosma I Medyceusz zatwierdził statut florenckiej Akademii Sztuki Rysunku, którą wymyślił Giorgio Vasari. Na pierwszym zebraniu 70 osób ogłosiło Michała Anioła „Ojcem i Mistrzem tych trzech sztuk”, a młodsi artyści protestowali, bo nie przyjęto ich do grona pierwszych akademików.',
				'Gdy w 1768 roku powstała londyńska Royal Academy, jej statut wprost wykluczał z członkostwa rytowników. Francesco Bartolozzi, przez blisko 40 lat rytownik króla, był jednak ceniony tak wysoko, że zrobiono dla niego wyjątek i przyjęto go do Akademii jako malarza.',
				'Od 1912 do 1948 roku na igrzyskach olimpijskich przyznawano medale także za architekturę, literaturę, muzykę, malarstwo i rzeźbę, za dzieła poświęcone sportowi. W 1912 roku złoto za rzeźbę zdobył Amerykanin Walter Winans, cztery lata wcześniej mistrz olimpijski w strzelaniu. Brąz w 1932 roku dostał projekt Stadionu Olimpijskiego we Wrocławiu.',
				'Po Wielkiej Wystawie w 1851 roku za 5000 funtów rządowej dotacji kupiono wybór wystawionych przedmiotów. Stały się zaczątkiem otwartego w 1852 roku Muzeum Wyrobów, które miało uczyć projektantów, producentów i publiczność sztuki i wzornictwa. W 1899 roku dostało nazwę Muzeum Wiktorii i Alberta.',
				'W 1852 roku V&A jako jedno z pierwszych muzeów zaczęło kupować do zbiorów fotografie, a w 1858 urządziło swoją pierwszą wystawę fotografii. Dziś ma około 800 000 zdjęć, jedną z najważniejszych kolekcji na świecie.'
			],
			vault_cobweb: [
				'„Chrzest Chrystusa” z Uffizi powstał około 1470–1475 roku w pracowni Andrei del Verrocchia. Według Giorgia Vasariego pomagał mu młody uczeń, Leonardo, który anioła po lewej namalował tak zręcznie, że zdenerwował starszego mistrza. Dziś badacze przypisują Leonardowi także pejzaż, złote światło i postać Chrystusa.',
				'Peter Paul Rubens dostawał o wiele za dużo zamówień, by wykonać je sam, więc zbudował dużą pracownię dla uczniów i pomocników. Jego warsztat wytworzył oszałamiającą liczbę dzieł: w latach 30. XVII wieku sam król Hiszpanii Filip IV zamówił u niego ponad 80 obrazów.',
				'W 1634 roku Rembrandt namalował dla świeżo poślubionych Martena Soolmansa i Oopjen Coppit parę portretów, jedyne pendanty w tak monumentalnym formacie w swoim dorobku. W 2016 roku Holandia i Francja kupiły je wspólnie, a muzea umówiły się, że obrazy zawsze będą pokazywane razem, na zmianę w Rijksmuseum i w Luwrze.',
				'Luwr jest ostatnim muzeum, które ma biuro kopistów; działa ono od otwarcia muzeum w 1793 roku. Kopiowanie dzieł innych było szkołą wielu mistrzów, od Matisse’a po Picassa.',
				'Leonardo namalował „Madonnę w grocie” dwa razy: pierwsza wersja jest w Luwrze, druga w National Gallery. Nie wiadomo na pewno dlaczego. Być może sprzedał pierwszy obraz komuś innemu, gdy mediolańskie bractwo, które go zamówiło, nie chciało dopłacić za droższe materiały.',
				'Vincent van Gogh zebrał razem z bratem Theo setki japońskich drzeworytów. W 1887 roku skopiował z jednego z nich kwitnący sad śliwowy Hiroshigego, ale czarny i szary pień drzewa zamienił na czerwony i niebieski, a pomarańczowe ramki z japońskimi znakami dodał tylko dla ozdoby.',
				'Jan Brueghel starszy i Peter Paul Rubens przyjaźnili się i malowali razem na jednym obrazie: Brueghel pejzaże i dworskie sceny, Rubens postacie. Tak powstał cykl „Pięć zmysłów” w Prado, jedna z ich najbardziej udanych współprac: w dworskie sceny Brueghla Rubens wstawił alegorie zmysłów.'
			],
			hortus_cliffortianus: [
				'Muzeum Ennigaldi, córki babilońskiego króla Nabonida i arcykapłanki boga księżyca, powstało w Ur około 530 roku p.n.e. i uchodzi za najstarsze na świecie. W 1925 roku Leonard Woolley rozpoznał je po etykietach: przy każdym przedmiocie leżał gliniany cylinder z napisami w czterech językach, objaśniającymi przedmiot i jego historię.',
				'Portret matki Jamesa Whistlera, amerykańskiego malarza dzielącego karierę między Londyn i Paryż, ma podwójny tytuł: „Aranżacja w szarości i czerni nr 1” i „Portret matki artysty”. Wkrótce potem Whistler dawał swoim obrazom już tylko muzyczne podtytuły, bo ważniejsza była dla niego harmonia niż temat.',
				'Poradnik pisania tekstów w Muzeum Wiktorii i Alberta zaleca, by zwykła etykieta dzieła miała 50–60 słów, a jej pierwsze zdanie w miarę możliwości mniej niż 16. Powód: według Getty Museum zwiedzający bez przygotowania patrzy na obiekt krócej niż 30 sekund, więc najważniejsza informacja musi paść od razu.',
				'Iconclass, system klasyfikacji tego, co przedstawiają obrazy, wymyślił Henri van de Waal, profesor historii sztuki na uniwersytecie w Lejdzie, który pracował nad nim od lat 40. XX wieku. Dziś wiele muzeów i bibliotek opisuje nim tematy dzieł w swoich zbiorach.',
				'Melvil Dewey od 1873 roku pracował w bibliotece Amherst College nad systemem porządkowania książek i katalogów kartkowych. Pierwsze wydanie jego klasyfikacji z 1876 roku liczyło mniej niż 50 stron, a 23. wydanie z 2011 roku ma cztery tomy. Sama Biblioteka Kongresu z tego systemu nie korzysta.',
				'W marcu 2021 roku Luwr po raz pierwszy udostępnił w sieci całą swoją kolekcję. Jego nowa baza miała na start ponad 482 000 wpisów, również o dziełach z magazynów i tych wypożyczonych na długo innym instytucjom we Francji.'
			],
			trevi_fountain: [
				'Fontanna di Trevi to wylot akweduktu Aqua Virgo, który Agryppa, zięć cesarza Augusta, otworzył w 19 roku p.n.e. Według legendy nazwę dała mu dziewczyna, która wskazała źródła żołnierzom szukającym wody. To jedyny z jedenastu głównych akweduktów starożytnego Rzymu, który działa nieprzerwanie do dziś.'
			],
			seven_league_boots: [
				'W baśni Charles’a Perraulta buty olbrzyma były zaczarowane: rosły i malały, dopasowując się do nóg tego, kto je włożył. Według jednego z dwóch zakończeń Tomcio został w nich królewskim gońcem i jeszcze tego samego wieczoru przyniósł królowi wieści od armii oddalonej o dwieście mil.'
			],
			pilgrim_shell: [
				'Pielgrzymi kupowali w sanktuarium w Composteli prawdziwe muszle przegrzebków i przypinali je do toreb. Gdy chętnych przybyło więcej, niż było muszli, zaczęto sprzedawać metalowe odznaki, a w XIII wieku w Composteli pracowało 100 wytwórców z licencją. Nikt nie wie na pewno, dlaczego muszla stała się znakiem świętego Jakuba.'
			],
			crystal_palace: [
				'Na Wielką Wystawę w 1851 roku 5000 robotników w pięć miesięcy zbudowało w londyńskim Hyde Parku szklany Kryształowy Pałac. Gmach był tak duży, że w środku znalazły się drzewa parku. 14 000 wystawców pokazało w nim 100 000 przedmiotów z całego świata, które obejrzało sześć milionów ludzi.',
				'Udział w paryskim Salonie, wystawie z jury, decydował o karierze artysty. Gdy artyści zarzucili jury, że odrzuca dzieła niezgodne z akademickim wzorem, cesarz Napoleon III zorganizował w 1863 roku pierwszy Salon Odrzuconych dla prac, których jury nie przyjęło. Pokazano tam wiele dzieł artystów, których później łączono z impresjonizmem.',
				'Białe ściany galerii to wynalazek dopiero początku XX wieku, gdy sztuka stawała się coraz bardziej abstrakcyjna. Artyści De Stijl i Bauhausu chcieli, by nic nie odciągało uwagi od dzieł, a gładka biel dodatkowo je obramowywała. Tak powstał „biały sześcian”: prosta sala o białych ścianach, zwykle oświetlona z sufitu.',
				'W 1969 roku Harald Szeemann pokazał w Kunsthalle w Bernie wystawę „When Attitudes Become Form”, która przeszła do historii dzięki jego radykalnemu podejściu: sama wystawa, czyli dobór dzieł i ich zestawienie, była jego wypowiedzią. W 2013 roku Fondazione Prada odtworzyła ją w Wenecji, wstawiając białe sale Kunsthalle w pełnej skali do zdobionych freskami wnętrz zabytkowego pałacu.',
				'Wieża Eiffla miała być w Paryżu tylko gościem: trzystumetrową konstrukcję postawiono na wystawę światową w 1889 roku z myślą, że postoi 20 lat. Zamiast zniknąć razem z wystawą, została na stałe i stała się symbolem Paryża i całej Francji.'
			],
			lenoir_chapel: [
				'Muzeum Zabytków Francuskich Alexandre’a Lenoira, otwarte w Paryżu w 1795 roku, było drugim muzeum narodowym Francji po Luwrze i przyczyniło się do narodzin pojęcia dziedzictwa. Zamknięto je w 1816 roku, a zbiory rozproszyły się: dziś są m.in. w Luwrze, bazylice Saint-Denis i katedrze Notre-Dame, a za granicą najwięcej w Metropolitan Museum.'
			],
			figure_alphabet: [
				'O Mistrzu E.S. wiadomo niewiele, a przydomek zawdzięcza inicjałom, które pojawiają się na jego późniejszych pracach. Na to, że był z wykształcenia złotnikiem, wskazują punce – złotnicze narzędzia wbijane młotkiem w płytę, którymi wybijał wzory drobnych kwiatków i kółek. Jego figuralny alfabet przetrwał w 23 rzadkich, pojedynczych odbitkach.'
			],
			candle_moths: [
				'Rycina Vincenta Laurensza van der Vinne ilustruje „Leerzaame zinnebeelden” Adriaana Spinnikera, zbiór pouczających emblematów wydany w Haarlemie i Amsterdamie w 1714 roku. Owady, które giną od żaru i w wosku świecy, są w nim obrazem ludzi lekceważących ostrzeżenia, którzy przepadają przez marne, ziemskie życie.'
			],
			amateur_magnifier: [
				'Daumier wracał do paryskich znawców sztuki i kilkanaście lat później: w serii akwarel pokazał kolekcjonerów, którzy z bliska studiują dzieła. Akwarele robił głównie dla kolekcjonerów swoich prac, więc te obrazki trafiały, nieco ironicznie, do tych samych ludzi, których przedstawiały.'
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
		roundTier: 'Nowy eksponat na Ekspozycji:',
		roundTierName: (exhibit: string, tier: string): string => `${exhibit} · ${tier}`,
		roundRank: 'Nowy stopień:',
		credits: 'Ryciny',
		recoloured: 'kolory zmienione',
		exhibits: {
			collection: {
				name: 'Gabinet Olego Worma',
				about:
					'Frontyspis księgi „Musei Wormiani Historia” z 1655 roku pokazuje kopenhaski gabinet osobliwości Olego Worma, jeden z pierwowzorów muzeum.',
				count: counter('dzieł w atelier')
			},
			eras: {
				name: 'Świątynia della Tosse',
				about:
					'Giovanni Battista Piranesi wyrył wnętrze ruin świątyni della Tosse pod Tivoli, jednej z wielu starożytnych budowli, które utrwalał na rycinach.',
				count: counter('epok w Twoich dziełach')
			},
			prehistory: {
				name: 'Schronisko w La Madeleine',
				about:
					"Émile Bayard narysował do „L'Homme primitif” Louisa Figuiera z 1870 roku rodzinę z epoki renifera, nazywanej dziś magdalenem od schroniska skalnego La Madeleine w Dordonii.",
				count: counter('dzieł z prehistorii')
			},
			antiquity: {
				name: 'Armarium Rzymianina',
				about:
					"Jules Férat narysował do „Les Merveilles de l'industrie” Louisa Figuiera domową bibliotekę Rzymianina, który czyta zwój przy armarium, szafie na zwoje.",
				count: counter('dzieł ze starożytności')
			},
			middle_ages: {
				name: 'Turniej w Chauvency',
				about:
					'Rycina z książki Paula Lacroix z 1870 roku według miedziorytu z 1573 roku pokazuje alegoryczną walkę rycerzy na koniach, jakie toczono choćby na sześciodniowym turnieju w Chauvency w 1285 roku.',
				count: counter('dzieł ze średniowiecza')
			},
			early_modern: {
				name: 'Drukarnia Gutenberga',
				about:
					'Leo Reiffenstein narysował w 1881 roku dla „Die Gartenlaube” Gutenberga, który pokazuje Johannowi Fustowi pierwsze wydrukowane arkusze.',
				count: counter('dzieł z nowożytności')
			},
			modern: {
				name: 'Parowóz Pacific Railroad',
				about:
					"Alphonse de Neuville i Léon Benett zilustrowali w „W 80 dni dookoła świata” Juliusza Verne'a parowóz Pacific Railroad, który w Nevadzie przez trzy godziny czekał, aż tory przekroczy stado bizonów.",
				count: counter('dzieł z nowoczesności')
			},
			contemporary: {
				name: 'Pocisk z Columbiady',
				about:
					"Henri de Montaut zilustrował w „Z Ziemi na Księżyc” Juliusza Verne'a pocisk przywieziony na Stone's Hill na Florydzie, skąd miała go wystrzelić w stronę Księżyca armata Columbiada.",
				count: counter('dzieł ze współczesności')
			},
			memory: {
				name: 'Pracownia Świętego Hieronima',
				about:
					'Albrecht Dürer wyrył w 1514 roku świętego Hieronima pogrążonego w lekturze w zacisznej pracowni.',
				count: counter('dzieł utrwalonych w pamięci')
			},
			bullseye: {
				name: 'Strzała putta',
				about:
					'Amsterdamski rytownik Reinier Vinkeles wyrył postać putta, który ogląda strzałę wbitą w sam środek tarczy.',
				count: counter('perfekcyjnych datowań dzieł')
			},
			regular: {
				name: 'Klepsydra melancholii',
				about:
					'Klepsydra zdobi ścianę w „Melancholii I”, miedziorycie Albrechta Dürera z 1514 roku.',
				count: counter('dni w najdłuższej serii powtórek')
			},
			back_from_storage: {
				name: 'Uśmiech Mony Lisy',
				about:
					'Luigi Calamatta wyrył w 1857 roku „Mona Lisę” na podstawie dzieła Leonarda – obraz, który zniknął z Luwru w 1911 roku i wrócił tam po ponad dwóch latach.',
				hint: 'Zdarza się, że dzieło wypada z pamięci, a potem do niej wraca.',
				awarded: 'Za dzieło zapomniane i utrwalone na nowo.'
			},
			chronicle: {
				name: 'Salon w Luwrze',
				about:
					'Pietro Antonio Martini wyrył paryski Salon w Luwrze w 1787 roku, gdzie obrazy wisiały od podłogi aż po sufit.',
				count: counter('odwiedzonych miejsc')
			},
			grand_tour: {
				name: 'Globus podróżnika',
				about:
					'Plansza „Sphaerarum artificialium typica repraesentatio” przedstawia globus ziemski, globus nieba i sferę armilarną.',
				count: counter('odwiedzonych krajów')
			},
			seen_live: {
				name: 'Teleskop Mathieu Laensbergha',
				about:
					'Plansza z pisma „L’Artiste” pokazuje przy teleskopie Mathieu Laensbergha, zmyślonego astrologa, którego imieniem podpisywano almanachy z Liège.',
				count: counter('dzieł zobaczonych na żywo')
			},
			timeline: {
				name: 'Praski orloj',
				about:
					'Rycina z 1837 roku pokazuje praski orloj, zegar astronomiczny, który odmierza czas na Starym Mieście od 1410 roku.',
				count: counter('wydarzeń w Kalendarium')
			},
			glossary: {
				name: 'Biblioteka w Lejdzie',
				about:
					'Rycina z 1610 roku pokazuje bibliotekę uniwersytetu w Lejdzie, w której księgi przykuwano łańcuchami do pulpitów.',
				count: counter('pojęć w Słowniczku')
			},
			laurel_skull: {
				name: 'Czaszka zwycięzcy',
				about:
					'Na mezzotincie wydanej przez Gerarda Valcka czaszka w laurowym wieńcu leży na nutach obok zgaszonej świecy, a wiersz pod nią przypomina, że przed Śmiercią ustąpi każdy zwycięzca.',
				count: counter('symboli wskazanych na dziełach')
			},
			own_eye: {
				name: 'Camera obscura z Encyklopedii',
				about:
					'Plansza z „Encyklopedii” Diderota i d’Alemberta pokazuje ciemnię optyczną, dzięki której na długo przed fotografią artyści przenosili na papier krajobrazy i budowle.',
				count: counter('dodanych przez Ciebie zdjęć')
			},
			crystal_palace: {
				name: 'Kryształowy Pałac',
				about:
					'Charles Burton przedstawił w 1851 roku transept Kryształowego Pałacu w londyńskim Hyde Parku, szklanego gmachu zbudowanego na Wielką Wystawę.',
				count: counter('wystaw z co najmniej 5 dziełami')
			},
			lenoir_chapel: {
				name: 'Kaplica Lenoira',
				about:
					'Jean-Baptiste Réville i Jacques Lavallée wyryli w 1816 roku salę wprowadzającą paryskiego Muzeum Zabytków Francuskich, w której Alexandre Lenoir zebrał rzeźby ze wszystkich epok.',
				hint: 'Dobra opowieść nie pomija żadnego rozdziału.',
				awarded: 'Za wystawę z dziełami wszystkich sześciu epok.'
			},
			night_watch: {
				name: 'Straż nocna',
				about:
					'William Unger wyrył w XIX wieku „Straż nocną” na podstawie obrazu Rembrandta z 1642 roku.',
				hint: 'Niektórzy uczą się wtedy, gdy muzea są od dawna zamknięte.',
				awarded: 'Za powtórkę między północą a czwartą rano.'
			},
			marathon: {
				name: 'Puchar Nemezis',
				about:
					'Na miedziorycie Albrechta Dürera z początku XVI wieku bogini Nemezis szybuje nad światem z pucharem w dłoni.',
				hint: 'Bogowie przyglądają się tym, którzy nie wiedzą, kiedy przestać.',
				awarded: 'Za tysiąc dzieł w powtórkach swobodnych jednego dnia.'
			},
			mouth_of_truth: {
				name: 'Paszcza prawdy',
				about:
					'Georg Pencz wyrył w latach 1533–1534 kobietę, która przysięga na swoją niewinność z dłonią w paszczy kamiennego lwa.',
				hint: 'Lew nie gryzie tych, którzy mają coś do powiedzenia.',
				awarded: 'Za pierwszy zgłoszony pomysł.'
			},
			pinacotheca: {
				name: 'Pinakoteka motyli',
				about:
					'Plansza z katalogu Levinusa Vincenta z 1719 roku pokazuje szuflady jego haarlemskiego gabinetu, w których owady przypinano drobnymi szpilkami według wzoru rozrysowanego na siatce.',
				hint: 'Motyle nie odlecą, jeśli tylko dobrze je przyszpilić.',
				awarded: 'Za komplet pinezek na jednym obrazie.'
			},
			vasari_lives: {
				name: 'Księga Vasariego',
				about:
					'Strona tytułowa drugiego wydania „Żywotów” Giorgia Vasariego, wydrukowanego we Florencji w 1568 roku razem z drzeworytowymi portretami artystów.',
				count: counter('autorów z co najmniej 10 dziełami')
			},
			boncompagni_academy: {
				name: 'Akademia Boncompagniego',
				about:
					'Cornelis Cort wyrył w 1578 roku w Rzymie pracownię, w której obok siebie pracują rzeźbiarze, malarze, rysownicy, architekci i rytownicy.',
				count: counter('typów dzieł w atelier')
			},
			vault_cobweb: {
				name: 'Sieć Arachne',
				about:
					'Na drzeworycie według Hansa Weiditza do niemieckiego wydania Cycerona pajęczyna rozpięta pod sklepieniem łowi muchy i większe owady.',
				count: counter('powiązań między dziełami i autorami')
			},
			hortus_cliffortianus: {
				name: 'Ogród Clifforta',
				about:
					'Jan Wandelaar wyrył w 1738 roku frontyspis „Hortus Cliffortianus”, katalogu roślin z ogrodu George’a Clifforta opisanego przez Karola Linneusza.',
				count: counter('opisanych wartości w Kartotece')
			},
			trevi_fountain: {
				name: 'Fontanna di Trevi',
				about:
					'Giovanni Battista Piranesi wyrył Fontannę di Trevi około 1751 roku, jedenaście lat przed jej ukończeniem, z posągiem Oceana w centralnej niszy.',
				hint: 'Prawdziwy wielbiciel zawsze wraca do źródła.',
				awarded: 'Za dzieło zobaczone na żywo podczas dwóch wizyt.'
			},
			seven_league_boots: {
				name: 'Siedmiomilowe buty',
				about:
					'Na drzeworycie według Gustave’a Doré z 1862 roku Tomcio Paluch ściąga śpiącemu olbrzymowi siedmiomilowe buty.',
				hint: 'Olbrzymowi wystarczy jeden krok, sprytnemu – jeden dzień.',
				awarded: 'Za trzy muzea odwiedzone jednego dnia.'
			},
			pilgrim_shell: {
				name: 'Muszla pielgrzyma',
				about:
					'Na kopii akwaforty Jacques’a Callota dwoje pielgrzymów w kapeluszach z muszlą świętego Jakuba stoi w środku rymowanego przewodnika z Paryża do Santiago de Compostela.',
				hint: 'Marzenie, które ma adres, łatwiej spełnić.',
				awarded: 'Za dzieło zobaczone na żywo po tym, jak trafiło na listę do zobaczenia.'
			},
			figure_alphabet: {
				name: 'Alfabet Mistrza E.S.',
				about:
					'Israhel van Meckenem wyrył w ostatniej tercji XV wieku literę A z figuralnego alfabetu Mistrza E.S., ułożoną z lwa, psów, ptaków i człowieka.',
				hint: 'Sztukę warto zgłębiać od A do Z.',
				awarded: 'Za pojęcia w Słowniczku na każdą literę alfabetu.'
			},
			candle_moths: {
				name: 'Nocny lichtarz',
				about:
					'Vincent Laurensz. van der Vinne wytrawił w 1714 roku świecę, do której płomienia zlatują się owady, a te, które zginęły, leżą w wosku i na ziemi.',
				hint: 'Po zmroku światło przyciąga najmocniej.',
				awarded: 'Za zapalenie światła w środku nocy.'
			},
			amateur_magnifier: {
				name: 'Soczewka znawcy',
				about:
					'Honoré Daumier narysował w 1847 roku dla „Le Charivari” znawcę, który ogląda obraz przez lupę, podczas gdy jego towarzysz rozgląda się po sali.',
				hint: 'Kto patrzy z bliska, nie patrzy na zegarek.',
				awarded: 'Za godzinę spędzoną z jednym dziełem.'
			}
		}
	},
	statistics: {
		title: 'Statystyki',
		lead: 'Twoja kolekcja w liczbach. Możesz tutaj ocenić, jak rozkłada się w poszczególnych kategoriach, a także poznać ciekawe fakty na temat obecnego stanu atelier.',
		back: 'Atelier',
		wallLink: (count: string): string => `Statystyki, ${count}`,
		loadError: 'Nie udało się wczytać statystyk. Sprawdź internet i spróbuj jeszcze raz.',
		emptyTitle: 'Statystyki pojawią się wraz z pierwszym dziełem',
		empty:
			'Tutaj zobaczysz swoją kolekcję w liczbach: jak rozkłada się na epoki, typy i style, kto jest na pierwszym planie i jak przybywa nabytków.',
		addArtwork: 'Dodaj dzieło',
		holdings: {
			title: 'Stan zbiorów',
			artworks: (count: number): string =>
				plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' }),
			authors: (count: number): string =>
				plural(count, { one: 'autor', few: 'autorów', many: 'autorów' }),
			places: (count: number): string =>
				plural(count, { one: 'miejsce', few: 'miejsca', many: 'miejsc' }),
			seen: (count: number): string =>
				plural(count, {
					one: 'dzieło widziane na żywo',
					few: 'dzieła widziane na żywo',
					many: 'dzieł widzianych na żywo'
				}),
			terms: (count: number): string =>
				plural(count, {
					one: 'hasło w Słowniczku',
					few: 'hasła w Słowniczku',
					many: 'haseł w Słowniczku'
				}),
			events: (count: number): string =>
				plural(count, {
					one: 'wydarzenie w Kalendarium',
					few: 'wydarzenia w Kalendarium',
					many: 'wydarzeń w Kalendarium'
				}),
			visits: (count: number): string =>
				plural(count, {
					one: 'wizyta w Kronice',
					few: 'wizyty w Kronice',
					many: 'wizyt w Kronice'
				}),
			exhibitions: (count: number): string =>
				plural(count, { one: 'wystawa', few: 'wystawy', many: 'wystaw' })
		},
		composition: {
			title: 'Kompozycja',
			groupBy: 'Grupuj dzieła według',
			secondBy: 'Dodatkowy wymiar grupowania',
			noSecond: 'brak',
			rest: (values: number): string => `pozostałe (${values})`,
			total: 'Razem',
			zero: '·',
			tooEarly: (count: number): string =>
				`Rozkład pojawi się, gdy w atelier znajdzie się przynajmniej 20 dzieł. Obecnie jest ich ${count}.`,
			clipped: (parts: string[]): string =>
				`Tabela pokazuje ${parts.join(' i ')} przypisanych do dzieł.`,
			clippedPart: (shown: number, values: string, all: number): string =>
				`${shown} najczęściej występujących ${values} spośród ${all}`,
			values: {
				eras: 'epok',
				types: 'typów',
				periods: 'okresów',
				styles: 'stylów',
				materials: 'materiałów',
				authors: 'autorów',
				locations: 'miejsc'
			} as Record<string, string>,
			ownValues: (field: string): string => `wartości pola „${field}”`,
			none: {
				style: 'bez stylu',
				material: 'bez materiału',
				location: 'bez miejsca',
				value: 'bez wartości'
			}
		},
		blanks: {
			title: 'Białe plamy',
			lead: 'Dzieła, którym brakuje obrazu, roku, epoki, okresu albo typu.'
		},
		oddities: {
			title: 'Osobliwości',
			oldest: 'Najstarsze dzieło',
			newest: 'Najmłodsze dzieło',
			longestBuilt: 'Powstawało najdłużej',
			longestLived: 'Najdłużej żyjący autor',
			versatile: 'Najbardziej wszechstronny autor',
			materials: 'Najwięcej materiałów u jednego autora',
			pins: 'Najwięcej pinezek',
			visit: 'Najwięcej dzieł z jednej wizyty',
			years: (count: number): string =>
				`${count} ${plural(count, { one: 'rok', few: 'lata', many: 'lat' })}`,
			materialCount: (count: number): string =>
				`${count} ${plural(count, { one: 'materiał', few: 'materiały', many: 'materiałów' })}`,
			pinCount: (count: number): string =>
				`${count} ${plural(count, { one: 'pinezka', few: 'pinezki', many: 'pinezek' })}`,
			artworkCount: (count: number): string => workCount(count),
			list: (items: string[]): string =>
				items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} i ${items.at(-1)}`,
			tiedArtworks: (count: number): string =>
				`i ${count} ${plural(count, { one: 'inne', few: 'inne', many: 'innych' })}`,
			tiedAuthors: (count: number): string =>
				`i ${count} ${plural(count, { one: 'inny', few: 'innych', many: 'innych' })}`,
			tiedVisits: (count: number): string =>
				`i ${count} ${plural(count, { one: 'inna', few: 'inne', many: 'innych' })}`,
			datesLater: 'Rekordy dat pojawią się, gdy co najmniej dwa dzieła będą miały rok powstania.',
			noneYet: 'Rekordy pojawią się, gdy dzieła i autorzy będą mieli więcej szczegółów.'
		},
		memory: {
			title: 'W pamięci',
			quiz: 'Poprawne odpowiedzi w quizach',
			quizShare: (correct: number, all: number): string =>
				`${correct} ${all >= 100 && all < 200 ? 'ze' : 'z'} ${all}`,
			quizLater: (count: number): string =>
				`Odsetek poprawnych odpowiedzi pojawi się po 20 odpowiedziach w quizach. Na razie jest ich ${count}.`,
			mostReviewed: 'Najczęściej w powtórkach',
			forgotten: 'Najczęściej zapominane',
			times: (count: number): string =>
				`${count} ${plural(count, { one: 'raz', few: 'razy', many: 'razy' })}`,
			stable: 'Najmocniej utrwalone: ',
			stableIn: (days: number): string =>
				days === 0
					? ', wróci w powtórkach dziś.'
					: `, wróci w powtórkach za ${days} ${plural(days, { one: 'dzień', few: 'dni', many: 'dni' })}.`,
			noCards: 'Statystyki powtórek pojawią się po pierwszej powtórce.'
		},
		acquisitions: {
			title: 'Nabytki',
			caption: (unit: 'day' | 'week' | 'month', first: string): string =>
				`Dzieła dodane w kolejnych ${{ day: 'dniach', week: 'tygodniach', month: 'miesiącach' }[unit]}, od pierwszego dzieła ${first}.`,
			column: (when: string, count: number): string => `${when}: ${workCount(count)}`,
			weekFrom: (day: string): string => `od ${day}`,
			chart: 'Dzieła dodane w czasie'
		},
		foreground: {
			title: 'Na pierwszym planie',
			tabsLabel: 'Ranking',
			tabs: { authors: 'Autorzy', locations: 'Miejsca', styles: 'Style', materials: 'Materiały' },
			single: (single: number, values: number, kind: string): string =>
				`${single} ${values >= 100 && values < 200 ? 'ze' : 'z'} ${values} ${kind} ma w atelier jedno dzieło.`,
			kinds: { authors: 'autorów', locations: 'miejsc', styles: 'stylów', materials: 'materiałów' },
			tooEarly: {
				authors:
					'Ranking autorów pojawi się, gdy co najmniej trzech autorów będzie miało przypisane przynajmniej dwa dzieła.',
				locations:
					'Ranking miejsc pojawi się, gdy co najmniej trzy miejsca będą miały przypisane przynajmniej dwa dzieła.',
				styles:
					'Ranking stylów pojawi się, gdy co najmniej trzy style będą miały przypisane przynajmniej dwa dzieła.',
				materials:
					'Ranking materiałów pojawi się, gdy co najmniej trzy materiały będą miały przypisane przynajmniej dwa dzieła.'
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
			nameRequired: 'Wpisz nazwę wydarzenia.',
			year: 'Rok',
			spanTitle: 'Lata',
			yearRequired: 'Wpisz rok wydarzenia.',
			description: 'Opis',
			descriptionPlaceholder: 'Wszystko, co warto zapamiętać',
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
			spans: 'Zakresy dat dzieł',
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
	relations: {
		title: 'Powiązania',
		span: 'Rozpiętość w czasie',
		artworkYears: (from: string, to: string): string =>
			from === to ? `Twoje dzieła z roku ${from}` : `Twoje dzieła z lat ${from} – ${to}`,
		noYears: 'Żadne z tych dzieł nie ma daty',
		bounds: {
			era: (from: string, to: string): string => `w epoce ${from} – ${to}`,
			author: (from: string, to: string): string => `w ciągu życia ${from} – ${to}`,
			event: (from: string, to: string): string =>
				from === to ? `w roku ${from}` : `w latach ${from} – ${to}`
		},
		together: 'Najczęściej razem',
		hierarchy: 'W tej epoce',
		groups: {
			periods: 'Okresy',
			styles: 'Style',
			authors: 'Autorzy',
			materials: 'Materiały',
			places: 'Miejsca',
			periodsAndStyles: 'Okresy i style'
		},
		types: 'Typy dzieł',
		progress: 'Postęp w nauce',
		mastered: (count: number, total: number): string =>
			`${count} z ${total} ${total === 1 ? 'dzieła' : 'dzieł'} opanowane`,
		sameTime: 'W tym samym czasie',
		allEvents: (count: number): string => `Pokaż wszystkie (${count})`,
		otherEvents: 'Inne wydarzenia w tym czasie'
	},
	artworkRelations: {
		title: 'Powiązania',
		types: {
			studyFrom: 'Studium lub projekt do',
			studyTo: 'Ma studium lub projekt',
			copyFrom: 'Kopia lub reprodukcja',
			copyTo: 'Ma kopię lub reprodukcję',
			version: 'Inna wersja',
			partFrom: 'Część',
			partTo: 'Składa się z',
			referenceFrom: 'Nawiązuje do',
			referenceTo: 'Jest punktem odniesienia dla',
			related: 'Powiązane z'
		},
		add: 'Dodaj powiązanie',
		type: 'Rodzaj powiązania',
		choose: 'Wybierz rodzaj',
		search: 'Szukaj dzieła',
		remove: (title: string): string => `Usuń powiązanie z „${title}”`,
		removeEmpty: 'Usuń powiązanie',
		typeRequired: 'Wybierz, jak te dzieła są powiązane.',
		artworkRequired: 'Wybierz dzieło albo usuń ten wiersz.',
		noMatch: 'Nie ma takiego dzieła w Twoim atelier.'
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
		countryPlaceholder: 'Zacznij wpisywać nazwę kraju, żeby zobaczyć listę opcji',
		countryHint: 'Wybierz kraj z listy.',
		authorCountry: 'Kraj autora',
		authorCountryHint: 'Wpisz kraj lub krainę.',
		placeType: 'Typ miejsca',
		placeTypes: {
			museum: 'Muzeum',
			gallery: 'Galeria',
			private_collection: 'Kolekcja prywatna',
			on_site: 'Na miejscu'
		}
	},
	exhibitions: {
		title: 'Wystawy',
		kind: 'Wystawa',
		lead: 'Opowieści, które układasz z dzieł swojego atelier. Wystawy pozwalają wykorzystać kolekcję do szukania powiązań w sztuce, budowania porównań i zapisywania własnych komentarzy.',
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'wystawa', few: 'wystawy', many: 'wystaw' })}`,
		add: 'Dodaj wystawę',
		adding: 'Dodawanie…',
		search: 'Szukaj wystawy',
		sortLabel: 'Sortuj',
		sorts: {
			changed: 'Ostatnio zmienione',
			name: 'Alfabetycznie',
			count: 'Najwięcej dzieł'
		},
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment tytułu.`,
		newTitle: 'Nowa wystawa',
		nameLabel: 'Tytuł wystawy',
		nameRequired: 'Wpisz tytuł wystawy.',
		emptyTitle: 'Pierwszy wernisaż dopiero przed Tobą',
		empty:
			'Wybierz temat przewodni i zbuduj jego historię z dzieł Twojego atelier i własnych wniosków.',
		posterMeta: (count: number, changed: string): string =>
			`${workCount(count)} · zmieniona ${changed}`,
		onExhibitions: (count: number): string => exhibitionCount(count),
		artworkCount: (count: number): string => workCount(count),
		changedToday: 'dziś',
		loadErrorTitle: 'Nie udało się wczytać wystaw',
		addErrorTitle: 'Nie udało się dodać wystawy',
		view: {
			notFoundTitle: 'Nie ma takiej wystawy',
			loadErrorTitle: 'Nie udało się wczytać wystawy',
			back: 'Wystawy',
			edit: 'Edytuj',
			done: 'Gotowe',
			delete: 'Usuń',
			titleLabel: 'Tytuł wystawy',
			emptyBody: 'Tu zaczyna się Twoja opowieść. Dodaj tekst albo dzieło z panelu obok.',
			missingArtwork: 'Dzieła nie ma w atelier',
			archivedArtwork: 'Dzieło jest w Archiwum',
			flip: 'Notatka do dzieła',
			noteOf: (title: string): string => `Notatka do dzieła „${title}”`,
			noNote: 'To dzieło nie ma już notatki.',
			loadingNote: 'Wczytywanie notatki…'
		},
		save: {
			saving: 'Zapisywanie…',
			saved: 'Zapisano',
			untitled: 'Wpisz tytuł, żeby zapisać zmiany',
			failed: 'Nie udało się zapisać. Spróbujemy ponownie za chwilę.',
			conflict:
				'Ta wystawa w międzyczasie zmieniła swój kształt, więc Twoich ostatnich zmian nie udało się zapisać. Odśwież stronę, żeby zobaczyć najnowszą wersję.',
			conflictTitle: 'Nie zapisano zmian',
			limitTitle: 'Nie zapisano zmian',
			keepEditing: 'Wróć do wystawy'
		},
		panel: {
			title: 'Przybornik',
			open: 'Rozwiń Przybornik',
			close: 'Zwiń Przybornik',
			textTitle: 'Tekst',
			paragraph: 'Akapit',
			heading: 'Nagłówek',
			quote: 'Cytat',
			divider: 'Odstęp',
			artworksTitle: 'Dzieła',
			addAs: 'Dodaj jako',
			search: 'Szukaj dzieła',
			searchPlaceholder: 'Tytuł, autor albo numer',
			recent: 'Ostatnio dodane',
			found: (count: number): string => `Znalezione: ${count}`,
			noMatch: 'Nic nie pasuje. Sprawdź pisownię albo przeglądaj całe atelier.',
			browse: 'Przeglądaj całe atelier…',
			addMissing: 'Dodaj dzieło, którego brakuje',
			glossaryTitle: 'Słowniczek',
			searchTerm: 'Szukaj hasła',
			searchTermPlaceholder: 'Nazwa albo synonim',
			termsByName: 'Hasła od A do Z',
			noTerm: 'Nic nie pasuje. Sprawdź pisownię albo dodaj hasło w Słowniczku.',
			noTerms: 'W Słowniczku nie ma jeszcze haseł.',
			browseGlossary: 'Otwórz Słowniczek…',
			empty: 'W atelier nie ma jeszcze dzieł.',
			loadError: 'Nie udało się wczytać dzieł.'
		},
		closeUp: {
			caption: 'Szczegół: ',
			label: (title: string): string => `Szczegół: ${title}`
		},
		paletteDialog: {
			title: 'Paleta kolejnego dzieła'
		},
		closeUpDialog: {
			title: 'Szczegół',
			hint: 'Wybierz pinezkę, której fragment pokaże szczegół.',
			loading: 'Wczytywanie pinezek…',
			loadError: 'Nie udało się wczytać pinezek. Spróbuj ponownie za chwilę.',
			noPins: 'To dzieło nie ma jeszcze pinezek. Wbij je lupą w widoku dzieła, a potem wróć tutaj.',
			openArtwork: 'Otwórz dzieło',
			pin: (number: number): string => `Pinezka ${number}`
		},
		blocks: {
			textBlock: 'Tekst',
			heading: 'Nagłówek',
			quote: 'Cytat',
			artwork: 'Dzieło',
			palette: 'Paleta',
			closeUp: 'Szczegół',
			divider: 'Odstęp',
			term: 'Hasło',
			termOf: (name: string): string => `Hasło ze Słowniczka: ${name}`,
			textHint: 'Pisz tutaj…',
			headingHint: 'Wpisz nagłówek',
			quoteHint: 'Wpisz cytat'
		},
		bar: {
			label: (block: string): string => `Blok: ${block}`,
			move: (block: string): string => `${block}: przeciągnij, żeby przenieść`,
			up: 'W górę',
			down: 'W dół',
			remove: 'Usuń z wystawy',
			bold: 'Pogrubienie',
			italic: 'Kursywa',
			heading: 'Nagłówek',
			bulletList: 'Lista',
			orderedList: 'Lista numerowana',
			line: 'Linia',
			position: 'Położenie',
			addMore: 'Dodaj kolejny',
			full: 'Zestaw ma już pięć elementów',
			removeItem: (number: number): string => `Usuń element ${number} z zestawu`,
			place: (valign: string, align: string): string =>
				`${{ top: 'U góry', middle: 'W połowie', bottom: 'Na dole' }[valign] ?? valign}, ${{ left: 'z lewej', center: 'na środku', right: 'z prawej' }[align] ?? align}`
		},
		deleteConfirm: {
			title: (title: string): string => `Przenieść wystawę „${title}” do Archiwum?`,
			description:
				'Wystawa zniknie z listy. Dzieła zostaną w atelier, a wystawę przywrócisz z Archiwum.',
			confirm: 'Przenieś do Archiwum',
			moving: 'Przenoszenie…',
			errorTitle: 'Nie udało się przenieść wystawy'
		},
		moved: 'Przeniesiono wystawę do Archiwum.',
		limits: {
			artworks:
				'Ta wystawa ma już 100 dzieł, czyli najwięcej, ile się zmieści. Może warto podzielić ją na dwie?',
			blocks:
				'Ta wystawa ma już 300 elementów, czyli najwięcej, ile się zmieści. Może warto podzielić ją na dwie?',
			noPalette:
				'Z obrazu tego dzieła nie da się odczytać kolorów, więc paleta nie została dodana.',
			noImage: 'To dzieło nie ma obrazu, więc nie ma z czego zebrać palety.'
		},
		errors: {
			notFound: 'Nie ma takiej wystawy.',
			invalid: 'Wystawa ma w sobie coś, czego nie umiemy zapisać.',
			tooBig: 'Ta wystawa jest za duża, żeby ją zapisać. Może warto podzielić ją na dwie?'
		}
	},
	trash: {
		title: 'Archiwum',
		lead: 'Trafiają tu dzieła i wystawy, które usuniesz z atelier. Możesz je stąd przywrócić albo usunąć na zawsze.',
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
		deleted: (number: string): string => `Usunięto ${number} na zawsze.`,
		tabsLabel: 'Co jest w Archiwum',
		tabs: { artworks: 'Dzieła', exhibitions: 'Wystawy' },
		exhibitionsEmpty:
			'Nie ma tu żadnej wystawy. Trafiają tu wystawy, które postanowisz wycofać. Stąd możesz je przywrócić lub usunąć na zawsze.',
		exhibitionMeta: (count: number, date: string): string => `${workCount(count)} · ${date}`,
		exhibitionRestored: (title: string): string => `Przywrócono wystawę „${title}”.`,
		exhibitionDeleteTitle: (title: string): string => `Usunąć wystawę „${title}” na zawsze?`,
		exhibitionDeleteDescription: 'Zniknie razem ze swoimi tekstami. Dzieła zostaną w atelier.',
		exhibitionDeleted: (title: string): string => `Usunięto wystawę „${title}” na zawsze.`
	}
};

type PluralForms = Record<'one' | 'few' | 'many', string>;

const pluralRules = new Intl.PluralRules('pl');

function minuteCount(count: number): string {
	return `${count} ${plural(count, { one: 'minutę', few: 'minuty', many: 'minut' })}`;
}

function counter(unit: string): (next?: number) => string {
	return (next) => (next === undefined ? unit : `z ${next} ${unit}`);
}

function pointCount(count: number): string {
	return `${count} ${plural(count, { one: 'punkt', few: 'punkty', many: 'punktów' })}`;
}

function exhibitionCount(count: number): string {
	return `Na ${count} ${plural(count, { one: 'wystawie', few: 'wystawach', many: 'wystawach' })}`;
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
