const BASE = import.meta.env.BASE_URL;
const root = document.documentElement;
const siteLoader = document.getElementById("site-loader");
const heroSection = document.querySelector(".hero-section");
const heroPeelElement = document.getElementById("hero-peel");
const nameSection = document.querySelector(".name-section");
const nameRows = [...document.querySelectorAll(".name-row")];
const topbar = document.querySelector(".topbar");
const topbarToggle = document.getElementById("topbar-toggle");
const topbarNav = document.getElementById("topbar-nav");
const topbarNavLinks = [...document.querySelectorAll(".topbar-nav a")];
const issueSections = [...document.querySelectorAll(".issue-section[data-issue]")];
const aboutSection = document.querySelector(".issue-section--about");
const aboutHeading = document.querySelector(".issue-section--about .section-heading");
const aboutPanel = document.querySelector(".issue-section--about .about-panel");
const skillsSection = document.querySelector(".issue-section--skills");
const projectsSection = document.querySelector(".issue-section--projects");
const contactSection = document.querySelector(".issue-section--contact");
const projectGrid = document.getElementById("project-grid");
const projectCards = [...document.querySelectorAll(".issue-section--projects .project-card")];
const yearPrevBtn = document.getElementById("year-prev");
const yearNextBtn = document.getElementById("year-next");
const yearLabel   = document.getElementById("year-label");
const skillBadges = [...document.querySelectorAll(".issue-section--skills .tool-badge")];
const revealItems = [...document.querySelectorAll(".reveal")].filter(
  (item) => !item.classList.contains("project-card"),
);
const questionChips = document.querySelectorAll(".question-chip");
const answerBox = document.getElementById("assistant-answer");
const askForm = document.getElementById("assistant-ask-form");
const askInput = document.getElementById("assistant-question");
const askSubmit = document.getElementById("assistant-ask-submit");
const askStatus = document.getElementById("assistant-status");
const projectButtons = document.querySelectorAll(".project-card__button");
const projectModal = document.getElementById("project-modal");
const modalPanel = document.querySelector(".project-modal__panel");
const modalFront = document.getElementById("project-modal-front");
const modalMirror = document.getElementById("project-modal-mirror");
const modalTitle = document.getElementById("project-modal-title");
const modalType = document.getElementById("project-modal-type");
const modalDescription = document.getElementById("project-modal-description");
const modalDomain = document.getElementById("project-modal-domain");
const modalGithub = document.getElementById("project-modal-github");
const modalGithubNote = document.getElementById("project-modal-github-note");
const modalMeta = document.getElementById("project-modal-meta");
const modalSignals = document.getElementById("project-modal-signals");
const modalPreview = document.getElementById("project-modal-preview");
const modalProofs = document.getElementById("project-modal-proofs");
const modalProofTrigger = document.getElementById("project-modal-proof-trigger");
const modalProofSheet = document.getElementById("project-modal-proof-sheet");
const contactIcon = document.querySelector(".contact-callout__icon");
const copyContactButtons = [...document.querySelectorAll(".contact-link--copy[data-copy-value]")];
const languageToggle = document.getElementById("language-toggle");
const heroScrollLabel = document.querySelector(".hero-scroll__label");
const nameTranslationNodes = [...document.querySelectorAll(".name-translation")];
const nameLetterOverlayNodes = nameRows.map((row, index) => {
  const shell = row.querySelector(".name-letter-shell");
  if (!(shell instanceof HTMLElement)) return null;

  const overlay = document.createElement("span");
  overlay.className = "name-letter-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.textContent = nameTranslationNodes[index]?.textContent?.trim() ?? "";
  shell.append(overlay);
  return overlay;
});
const aboutFactBodies = [...document.querySelectorAll(".about-facts article p:not(.fact-label)")];
const contactCopy = document.querySelector(".contact-copy");
const modalProofHeading = document.querySelector(".project-modal__proof-heading");
const modalProofNote = document.querySelector(".project-modal__proof-note");

let activeProjectButton = null;
let activeProjectData = null;
let closeTimer = null;
let closeStageTimer = null;
let flipTimer = null;
let collapseAnimation = null;
let suppressedHoverButton = null;
let lastPointerPosition = null;
let assistantRequestId = 0;
let heroPeel = null;
let heroPeelTime = 0;
let currentLanguage = "zh";
let pendingAssistantQuestion = "";
const visibleIssueSections = new Set();
const issueIntersectionRatios = new Map();
const copyFeedbackTimers = new WeakMap();

const PANEL_TRANSITION_MS = 620;
const CLOSE_RETURN_DELAY_MS = 520;
const CLOSE_COLLAPSE_MS = 760;
const FLIP_DELAY_MS = 120;
const MODAL_EXIT_BUFFER_MS = 90;
const SKILL_BADGE_SEQUENCE = [7, 2, 10, 4, 1, 13, 8, 14, 9, 16, 6, 15, 5, 11, 3, 12];
const LANGUAGE_STORAGE_KEY = "site-language";
const defaultAssistantAnswer = answerBox?.textContent?.trim() ?? "";
const defaultAssistantStatus = askStatus?.textContent?.trim() ?? "";
const lowMemoryDevice =
  Boolean(navigator.connection?.saveData) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 8);
const LOADER_MIN_VISIBLE_MS = 520;
const LANGUAGE_COPY = {
  zh: {
    buttonLabel: "EN",
    buttonAria: "Switch to Italian",
    htmlLang: "en",
    heroScroll: "Scroll down",
    nameTranslations: [
      "Development",
      "Hardware Assembly",
      "Networking",
      "Computer Science",
      "Cybersecurity",
    ],
    assistant: {
      defaultAnswer:
        "I'm Chris Zhang, a fifth-year student in IT at Blaise Pascal in Reggio Emilia (A.S. 2025/2026). I specialise in backend and software architecture with a focus on security. I also study piano at the Peri-Merulo Conservatory.",
      defaultStatus: defaultAssistantStatus,
      emptyQuestion: "Enter a question about Chris first, then I'll answer.",
      loadingAnswer: (question) => `Generating an answer about "${question}"...`,
      loadingStatus: "Loading response about Chris, his skills and projects.",
      followUpStatus: "You can ask another question about Chris's projects, skills, or background.",
      requestError: "Service unavailable. Reverted to default answer.",
      placeholder: "E.g.: What is your best project?",
      questions: [
        {
          label: "Who are you?",
          answer:
            "I'm Chris Zhang, a fifth-year IT student at Blaise Pascal in Reggio Emilia. I specialise in backend development (Node.js, PHP) and software architecture with a focus on security. In my spare time I play piano at the Peri-Merulo Conservatory.",
        },
        {
          label: "What can you do?",
          answer:
            "I develop backends in Node.js and PHP, manage MySQL databases with encryption, and implement secure authentication (prepared statements, CSRF protection). I have experience in REST APIs, browser extensions (manifest, content scripts, service worker), testing with Jest (80%+ coverage), LAN networking (IP, switches), and hardware assembly. My main project is KeyManager: a password manager with triple-layer security.",
        },
        {
          label: "What is your best project?",
          answer:
            "KeyManager: a three-layer credential management system. PHP backend with user authentication and CSRF protection. MySQL database with double-layer encryption (master password + extra layer). JavaScript browser extension that detects login fields and auto-fills secured data. I implemented 30-min session timeout, prepared statements against SQL injection, audit logging, email verification, and tokenised password reset. Jest tests with 80%+ coverage.",
        },
        {
          label: "What excites you about computer science?",
          answer:
            "Cybersecurity fascinates me — understanding how attackers think. At the Mead Informatica lab we simulated a real attack/defence on a company infrastructure. I also love software architecture: designing systems that actually work, not just look good. And I enjoy discovering how components interconnect (backend, database, frontend, network).",
        },
      ],
      facts: [
        "Specialised in backend (Node.js, PHP) and software architecture with a focus on security and testing.",
        "From design to code: database design, robust authentication, REST APIs, browser extensions, test coverage.",
        "I care that code is secure, maintainable, and tested — it's not enough for it to 'work', it has to be resilient.",
      ],
    },
    secondaryProjects: {
      "project-two.dev": {
        intro: "Frontend and backend logic advancing at the same pace.",
        description: "A product built end to end, from interface to backend, with emphasis on coherence rather than connecting isolated features.",
        meta: "Full-Stack / UI / API",
      },
      "project-three.dev": {
        intro: "Not just a visual experiment, but a product with clear functional goals.",
        description: "An expressive project that keeps a clear function, so visual impact and practical utility coexist.",
        meta: "Creative Interaction / Animation / Usability",
      },
      "project-four.dev": {
        intro: "System-oriented, suited to solving problems in complex environments.",
        description: "A system-level project combining infrastructure, networks, and edge capabilities in a single solution.",
        meta: "Systems / Networking / Hardware",
      },
    },
    contactCopy:
      "If you're looking for someone who can build complete products with attention to detail and security, let's talk.",
    modal: {
      proofTrigger: "View proof",
      proofTriggerWithCount: (count) => `View proof and feedback (${count})`,
      proofHeading: "Proof and Feedback",
      proofNote: "Supplementary proof here, without taking up the main preview slot.",
      previewAria: (title) => `Play ${title ?? "project demo video"}`,
      previewPlay: "Start Demo",
      previewPending: "Video coming soon",
      previewTitle: "Project Preview",
      previewVideoTitle: "project demo video",
      previewNote: "Preview material coming soon.",
      galleryPending: "Images coming soon",
    },
  },
  en: {
    buttonLabel: "IT",
    buttonAria: "Switch to English",
    htmlLang: "it",
    heroScroll: "Scorri in basso",
    nameTranslations: [
      "Programmazione",
      "Assemblaggio PC",
      "Networking",
      "Informatica",
      "Cybersecurity",
    ],
    assistant: {
      defaultAnswer:
        "Sono Chris Zhang, studente di quinto anno dell'indirizzo tecnico informatico al Blaise Pascal di Reggio Emilia (A.S. 2025/2026). Mi specializo in backend e architettura software con focus su sicurezza. Studio anche pianoforte al Conservatorio Peri-Merulo.",
      defaultStatus: "Clicca una domanda per saperne di più.",
      emptyQuestion: "Inserisci prima una domanda su Chris, poi rispondo.",
      loadingAnswer: (question) => `Elaboro una risposta su "${question}"...`,
      loadingStatus: "Caricamento risposta su Chris, le sue competenze e i suoi progetti.",
      followUpStatus: "Puoi fare un'altra domanda sui progetti, le competenze o il percorso di Chris.",
      requestError: "Servizio non disponibile. Tornato alla risposta predefinita.",
      placeholder: "Es.: Qual è il tuo progetto migliore?",
      questions: [
        {
          label: "Chi sei?",
          answer:
            "Sono Chris Zhang, frequento il quinto anno dell'indirizzo tecnico informatico al Blaise Pascal di Reggia Emilia. Mi specializo in backend (Node.js, PHP) e architettura software con focus su sicurezza. Nel tempo libero suono pianoforte al Conservatorio Peri-Merulo di Reggio Emilia.",
        },
        {
          label: "Cosa sai fare?",
          answer:
            "Sviluppo backend in Node.js e PHP, gestisco database MySQL con crittografia, implemento autenticazione sicura (prepared statements, CSRF protection). Ho esperienza in: API REST, browser extension (manifest, content scripts, service worker), testing con Jest (80%+ coverage), reti LAN (IP, switch), hardware (assemblaggio). Il mio progetto maggiore è KeyManager: password manager con triple-layer security.",
        },
        {
          label: "Qual è il tuo progetto migliore?",
          answer:
            "KeyManager: sistema di gestione credenziali a tre strati. Backend PHP con autenticazione utente e CSRF protection. Database MySQL con doppio livello di crittografia (master password + layer aggiuntivo). Browser extension JavaScript che rileva campi login e auto-compila dati securizzati. Ho implementato session timeout 30 min, prepared statements contro SQL injection, logging per audit trail, email verification e password reset tokenizzato. Test Jest con copertura 80%+.",
        },
        {
          label: "Cosa ti appassiona dell'informatica?",
          answer:
            "La cybersecurity mi affascina: capire come ragionano gli attaccanti. Al laboratorio Mead Informatica abbiamo simulato un vero attacco/difesa su infrastruttura aziendale. Mi piace anche l'architettura software — progettare sistemi che funzionano davvero, non solo belli. E mi attrae scoprire come i componenti si interconnettono (backend, database, frontend, network).",
        },
      ],
      facts: [
        "Specializzato in backend (Node.js, PHP) e architettura software con focus su sicurezza e testing.",
        "Dalla progettazione al codice: database design, autenticazione robusta, API REST, browser extension, test coverage.",
        "Mi importa che il codice sia sicuro, manutenibile e testato — non basta che 'funzioni', deve essere resiliente.",
      ],
    },
    secondaryProjects: {
      "project-two.dev": {
        intro: "Frontend e logica backend avanzano con lo stesso ritmo.",
        description: "Un prodotto costruito end to end, dall'interfaccia al backend, con enfasi sulla coerenza invece di collegare funzionalità isolate.",
        meta: "Full-Stack / UI / API",
      },
      "project-three.dev": {
        intro: "Non solo un esperimento visivo, ma un prodotto con obiettivi funzionali chiari.",
        description: "Progetto espressivo che mantiene una funzione chiara, così l'impatto visivo e l'utilità pratica coesistono.",
        meta: "Interazione creativa / Animazione / Usabilità",
      },
      "project-four.dev": {
        intro: "Orientato ai sistemi, adatto a risolvere problemi in ambienti complessi.",
        description: "Un progetto di livello sistemico che combina infrastruttura, reti e capacità edge in un'unica soluzione.",
        meta: "Sistemi / Reti / Hardware",
      },
    },
    contactCopy:
      "Se cerchi qualcuno che sa realizzare prodotti completi con attenzione ai dettagli e alla sicurezza, parliamoci.",
    modal: {
      proofTrigger: "Visualizza prove",
      proofTriggerWithCount: (count) => `Visualizza prove e feedback (${count})`,
      proofHeading: "Prove e Feedback",
      proofNote: "Prove supplementari qui, senza occupare l'anteprima principale.",
      previewAria: (title) => `Riproduci ${title ?? "video demo del progetto"}`,
      previewPlay: "Avvia Demo",
      previewPending: "Video in arrivo",
      previewTitle: "Anteprima Progetto",
      previewVideoTitle: "video demo del progetto",
      previewNote: "Materiale di anteprima in arrivo.",
      galleryPending: "Immagini in arrivo",
    },
  },
};
const PROJECT_DETAILS = {
  cna: {
    title: "CNA",
    type: { zh: "Company Visit / Career Orientation", en: "Ascolto / Orientamento" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Company visit to Credem bank to explore the skills required in the workplace.", en: "Visita aziendale Credem per esplorare le competenze richieste nel mondo del lavoro." },
    description: {
      zh: "Date: 04/2025 (A.S. 2024/2025)<br>Location: Reggio Emilia (Credem)<br><br>Description: I attended a company visit and orientation session at Credem bank. I listened to experts who explained the technical and transversal skills required in the modern business environment. I reflected on the gaps in my preparation and on which skills I need to develop to enter the job market with confidence. The meeting helped me concretely understand what employers expect beyond purely technical skills.<br><br>Technical skills:<br>- Business dynamics: organisational structure, processes<br>- Project lifecycle in a company<br>- Specifics of the banking/financial sector (in this case)<br><br>Transversal skills:<br>- Active listening: ability to extract relevant information<br>- Self-assessment: recognising my strengths and weaknesses<br>- Continuous improvement: identifying concrete actions for development<br>- Career orientation: conscious vision of my future",
      en: "Data: 04/2025 (A.S. 2024/2025)<br>Luogo: Reggio Emilia (Credem)<br><br>Descrizione: Ho partecipato a una visita aziendale e a un incontro di orientamento presso Credem. Ho ascoltato esperti che hanno illustrato le competenze tecniche e trasversali richieste nel contesto aziendale moderno. Ho riflettuto su quali gap ho nella mia preparazione e su quali skill devo sviluppare per affrontare il mercato del lavoro con consapevolezza. L'incontro mi ha aiutato a comprendere concretamente cosa si aspettano i datori di lavoro oltre le competenze puramente tecniche.<br><br>Competenze tecniche:<br>- Dinamiche aziendali: struttura organizzativa, processi<br>- Ciclo di vita del progetto in azienda<br>- Specifici del settore bancario/finanziario (in questo caso)<br><br>Competenze trasversali:<br>- Ascolto attivo: capacità di estrarre informazioni rilevanti<br>- Autovalutazione: riconoscere miei punti di forza e debolezza<br>- Miglioramento continuo: identificare azioni concrete per lo sviluppo<br>- Orientamento professionale: visione consapevole del proprio futuro"
    },
    meta: { zh: "Career Orientation / Soft Skills / Business Communication", en: "Orientamento professionale / Soft skills / Comunicazione aziendale" },
    signals: { zh: ["Active listening", "Career reflection"], en: ["Ascolto attivo", "Orientamento al lavoro"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/credem.webp" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "50%", originY: "40%",
        logoMuted: "rgba(199, 209, 212, 0.82)", logoActive: "#2cd8c9", logoGlow: "rgba(44, 216, 201, 0.34)",
        burstAccent: "#39e977", burstSoft: "rgba(247, 255, 252, 0.98)",
        dotMuted: "rgba(239, 246, 244, 0.12)", dotActive: "rgba(247, 255, 251, 0.38)",
        lineMuted: "rgba(154, 194, 191, 0.12)", rayLight: "rgba(255, 255, 255, 0.96)", rayInk: "rgba(6, 8, 11, 0.98)",
        panelTint: "rgba(176, 224, 216, 0.2)", borderActive: "rgba(121, 247, 217, 0.44)", shadowActive: "rgba(22, 118, 98, 0.42)",
      },
      impact: { text: "LISTEN!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/banca.jpg", alt: "banca Image" }] },
    proofs: [],
  },
  "mi-presento": {
    title: "Mi Presento",
    type: { zh: "CV / Career Presentation", en: "Curriculum / Comunicazione" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Independent creation of a personal CV to improve professional presentation skills.", en: "Realizzazione autonoma del curriculum vitae personale al Tecnopolo di Reggio Emilia." },
    description: {
      zh: "Date: 03/2025 (A.S. 2024/2025)<br>Location: Reggio Emilia (Tecnopolo)<br><br>Description: I learned how to build an effective CV during a training activity. I chose the format best suited to my profile, selected the relevant information to highlight, and paid attention to the visual layout. The experience taught me how to present myself professionally, showcasing acquired skills without exaggerating. I produced a CV ready for internships and job opportunities, with awareness of what employers look for.<br><br>Technical skills:<br>- CV structure: standard sections (contacts, profile, experience, skills, education)<br>- Formats: PDF, ATS-friendly, design<br>- Professional language: concise, keywords, action verbs<br><br>Transversal skills:<br>- Self-assessment: recognising which parts of my experience are relevant<br>- Professional storytelling: telling my story with credibility<br>- Attention to detail: spelling, formatting, consistency<br>- Ethical self-marketing: presenting myself without exaggerating",
      en: "Data: 03/2025 (A.S. 2024/2025)<br>Luogo: Reggio Emilia (Tecnopolo)<br><br>Descrizione: Ho imparato a costruire un curriculum vitae efficace durante un'attività formativa. Ho scelto il formato più adatto al mio profilo, selezionato le informazioni rilevanti da evidenziare, e curato l'aspetto grafico. L'esperienza mi ha insegnato come presentarmi professionalmente, valorizzando le competenze acquisite senza esagerare. Ho realizzato un CV pronto per stage e opportunità lavorative, con consapevolezza di cosa cercano i datori di lavoro.<br><br>Competenze tecniche:<br>- Struttura del curriculum: sezioni standard (contatti, profile, esperienze, competenze, formazione)<br>- Formati: PDF, ATS-friendly, design<br>- Linguaggio professionale: sintesi, keywords, azione<br><br>Competenze trasversali:<br>- Autovalutazione: riconoscere cosa è rilevante delle mie esperienze<br>- Storytelling professionale: raccontare la propria storia con credibilità<br>- Attenzione al dettaglio: ortografia, formattazione, consistenza<br>- Self-marketing etico: presentarsi senza esagerare",
    },
    meta: { zh: "CV / Content Organisation / Professional Presentation", en: "CV / Organizzazione contenuti / Comunicazione professionale" },
    signals: { zh: ["Done independently", "Work-ready"], en: ["Realizzato in autonomia", "Pronto per il lavoro"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/CV.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "42%", originY: "38%",
        logoMuted: "rgba(194, 207, 244, 0.82)", logoActive: "#38bdf8", logoGlow: "rgba(56, 189, 248, 0.34)",
        burstAccent: "#60a5fa", burstSoft: "rgba(236, 254, 255, 0.98)",
        dotMuted: "rgba(186, 230, 253, 0.12)", dotActive: "rgba(224, 242, 254, 0.38)",
        lineMuted: "rgba(147, 197, 253, 0.16)", rayLight: "rgba(240, 249, 255, 0.96)", rayInk: "rgba(3, 7, 18, 0.98)",
        panelTint: "rgba(96, 165, 250, 0.14)", borderActive: "rgba(125, 211, 252, 0.44)", shadowActive: "rgba(7, 89, 133, 0.42)",
      },
      impact: { text: "PRONTO!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/il-curriculum.jpg", alt: "CV Image" }] },
    proofs: [],
  },
  mead: {
    title: "MEAD",
    type: { zh: "Networking / LAN", en: "Reti / Configurazione IP" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Configured a LAN with a switch and manual IP addresses between two computers.", en: "Configurazione reti LAN con switch e indirizzi IP manuali tra due computer." },
    description: {
      zh: "Date: 02/2025 (A.S. 2024/2025)<br>Location: Reggio Emilia<br><br>Description: I took part in assembling and configuring a local network during a hands-on lab. I learned to manually configure IPv4 addresses on two PCs connected via a switch, creating working communication between the two systems. We experimented with both direct cable and switch connections. The experience taught me how a LAN works in practice and how devices communicate once correctly configured. Precision was crucial: even a single wrong byte in the IP address broke the connection.<br><br>Technical skills:<br>- IPv4 configuration: subnet mask, gateway, manual address assignment<br>- Switch and network hardware: physical connections, cabling<br>- LAN: architecture, network isolation, local communication<br>- Client-server: communication logic between two systems<br>- Basic protocols: ping, address resolution<br><br>Transversal skills:<br>- Teamwork on coordinated tasks<br>- Precision and attention to detail (critical configuration)<br>- Practical debugging: identifying connectivity problems<br>- Hands-on technical competence",
      en: "Data: 02/2025 (A.S. 2024/2025)<br>Luogo: Reggio Emilia<br><br>Descrizione: Ho partecipato al montaggio e configurazione di una rete locale durante un laboratorio pratico. Ho imparato a configurare manualmente gli indirizzi IP su due PC collegati tramite switch, creando una comunicazione funzionante tra i due sistemi. Abbiamo sperimentato sia con collegamento telefonico che con switch. L'esperienza mi ha insegnato come funziona concretamente una LAN e come i dispositivi comunicano una volta correttamente configurati. La precisione era cruciale: anche un singolo byte sbagliato nell'indirizzo IP interrompeva la comunicazione.<br><br>Competenze tecniche:<br>- Configurazione IPv4: subnet mask, gateway, assegnazione manuale indirizzi<br>- Switch e hardware di rete: connessioni fisiche, cablaggio<br>- LAN: architettura, isolamento di rete, comunicazione locale<br>- Client-server: logica di comunicazione tra due sistemi<br>- Protocolli di base: ping, risoluzione indirizzi<br><br>Competenze trasversali:<br>- Lavoro di squadra su compiti coordinati<br>- Precisione e attenzione al dettaglio (configurazione critica)<br>- Debugging pratico: identificare problemi di connettività<br>- Competenza tecnica hands-on",
    },
    meta: { zh: "LAN / Manual IP / Switch / Client-Server", en: "LAN / IP manuali / Switch / Client-Server" },
    signals: { zh: ["Manual IP configuration", "Working LAN"], en: ["IP configurati manualmente", "LAN funzionante"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/mead.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "54%", originY: "36%",
        logoMuted: "rgba(232, 210, 193, 0.82)", logoActive: "#fb923c", logoGlow: "rgba(251, 146, 60, 0.34)",
        burstAccent: "#f59e0b", burstSoft: "rgba(255, 251, 235, 0.98)",
        dotMuted: "rgba(253, 230, 138, 0.12)", dotActive: "rgba(254, 243, 199, 0.38)",
        lineMuted: "rgba(253, 186, 116, 0.16)", rayLight: "rgba(255, 247, 237, 0.96)", rayInk: "rgba(12, 7, 2, 0.98)",
        panelTint: "rgba(245, 158, 11, 0.14)", borderActive: "rgba(252, 211, 77, 0.44)", shadowActive: "rgba(146, 64, 14, 0.42)",
      },
      impact: { text: "LAN!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/MEAD.jpeg", alt: "MEAD Image" },{ src: "img/MEAD2.jpeg", alt: "MEAD2 Image" }] },
    proofs: [],
  },
  "polarity-bot": {
    title: "Polarity Bot",
    type: { zh: "Node.js / Telegram Bot / API", en: "Node.js / Bot Telegram / API" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School project — repository not public.", en: "Progetto scolastico — repository non pubblico." },
    frontIntro: { zh: "Telegram bot in Node.js integrated with music APIs to search artists and get description and discography.", en: "Bot Telegram integrato con API musicali per cercare artisti e ottenere descrizione e discografia." },
    description: {
      zh: "Date: 11/2024 (A.S. 2024/2025)<br>Location: Reggio Emilia<br><br>Description: I developed a Telegram bot in Node.js that integrates REST APIs for searching artists and music. During this project I learned how to structure a backend application with Node.js, manage asynchronous requests, and integrate external services via API. I implemented the search logic that, given an artist name, queries a music service and returns the description and discography. The experience taught me the importance of good error handling and resilience to external API calls.<br><br>Technical skills:<br>- JavaScript (Node.js): application logic, modules, dependency management<br>- REST API: integration with external services, JSON response handling<br>- Telegram Bot: Telegram API integration, message handlers<br>- Asynchronous programming: promises, async/await, error handling<br>- Backend structure: code organisation, configuration<br><br>Transversal skills:<br>- Understanding of distributed systems (client-server, API)<br>- Problem solving: debugging API integrations<br>- Documentation and technical communication<br>- Teamwork in project design",
      en: "Data: 11/2024 (A.S. 2024/2025)<br>Luogo: Reggio Emilia<br><br>Descrizione: Ho sviluppato un bot Telegram in Node.js che integra API REST per la ricerca di artisti e musica. Durante questo progetto ho appreso come strutturare un'applicazione backend con Node.js, gestire richieste asincrone, e integrare servizi esterni tramite API. Ho implementato la logica di ricerca che, ricevuto il nome di un artista, interroga un servizio musicale e restituisce descrizione e discografia. L'esperienza mi ha insegnato l'importanza di una buona gestione degli errori e della resilienza alle chiamate API esterne.<br><br>Competenze tecniche:<br>- JavaScript (Node.js): logica applicativa, moduli, gestione dipendenze<br>- API REST: integrazione con servizi esterni, gestione risposte JSON<br>- Bot Telegram: integrazione con API Telegram, handler di messaggi<br>- Programmazione asincrona: promise, async/await, gestione errori<br>- Struttura backend: organizzazione del codice, configurazione<br><br>Competenze trasversali:<br>- Comprensione di sistemi distribuiti (client-server, API)<br>- Problem solving: debug di integrazioni API<br>- Documentazione e comunicazione tecnica<br>- Lavoro di gruppo nella progettazione",
    },
    meta: { zh: "Node.js / JavaScript / REST API / Telegram Bot / Async", en: "JavaScript / Node.js / API REST / Telegram Bot API / Asincrono" },
    signals: { zh: ["Working bot", "Integrated APIs"], en: ["Bot funzionante", "API integrate"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/bot.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "46%", originY: "42%",
        logoMuted: "rgba(232, 193, 193, 0.82)", logoActive: "#f87171", logoGlow: "rgba(248, 113, 113, 0.34)",
        burstAccent: "#ef4444", burstSoft: "rgba(255, 241, 241, 0.98)",
        dotMuted: "rgba(254, 202, 202, 0.12)", dotActive: "rgba(254, 226, 226, 0.38)",
        lineMuted: "rgba(252, 165, 165, 0.16)", rayLight: "rgba(255, 245, 245, 0.96)", rayInk: "rgba(12, 3, 3, 0.98)",
        panelTint: "rgba(239, 68, 68, 0.14)", borderActive: "rgba(252, 165, 165, 0.44)", shadowActive: "rgba(153, 27, 27, 0.42)",
      },
      impact: { text: "API!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/studenti.jpg", alt: "studenti Image" }, { src: "img/bots.jpg", alt: "bots Image" }] },
    proofs: [],
  },
  sicurezza: {
    title: "Sicurezza",
    type: { zh: "Computer Safety / Workstation Ergonomics", en: "Sicurezza Informatica / Igiene PC" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Study of safety rules and ergonomics in computer use to prevent physical harm.", en: "Studio delle regole di sicurezza e igiene nell'uso del computer per prevenire danni fisici." },
    description: {
      zh: "Date: 02/2024 (A.S. 2024/2025)<br>Location: Reggio Emilia<br><br>Description: I studied safety rules and ergonomics for prolonged computer use. The activity raised my awareness of how small preventive habits (posture, breaks, lighting) impact health in the long term. I learned how to correctly set up a workstation, considering monitor, keyboard, and mouse positioning, and managing visual and muscular fatigue.<br><br>Technical skills:<br>- Workspace ergonomics: desk height, monitor distance, lumbar support<br>- RSI (Repetitive Strain Injury) prevention: hand posture, repetitive movements<br>- Eye health: screen distance, lighting, break frequency<br>- Work environment: air, noise, temperature<br><br>Transversal skills:<br>- Responsibility towards my own health<br>- Long-term wellbeing awareness<br>- Self-care and prevention (don't wait for harm to act)<br>- Discipline in maintaining good habits",
      en: "Data: 02/2024 (A.S. 2024/2025)<br>Luogo: Reggio Emilia<br><br>Descrizione: Ho approfondito le regole di sicurezza e ergonomia nell'utilizzo prolungato del computer. L'attività mi ha sensibilizzato su come piccole abitudini preventive (postura, pause, illuminazione) impattano sulla salute a lungo termine. Ho imparato a organizzare correttamente la postazione di lavoro, considerando posizionamento di monitor, tastiera, mouse, e la gestione dell'affaticamento visivo e muscolare.<br><br>Competenze tecniche:<br>- Ergonomia del workspace: altezza scrivania, monitor distance, supporto lombare<br>- Prevenzione di RSI (Repetitive Strain Injury): postura mani, movimenti ripetitivi<br>- Salute visiva: distanza schermo, illuminazione, frequenza di break<br>- Ambiente di lavoro: aria, rumore, temperature<br><br>Competenze trasversali:<br>- Responsabilità verso la propria salute<br>- Consapevolezza del benessere a lungo termine<br>- Autocura e prevenzione (non aspettare il danno per agire)<br>- Disciplina nel mantenere buone abitudini",
    },
    meta: { zh: "Workstation Setup / Eye Care / Occupational Health", en: "Postazione di lavoro / Prevenzione disturbi / Salute" },
    signals: { zh: ["Safety awareness", "Correct workstation"], en: ["Prevenzione rischi", "Postazione corretta"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/work.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "48%", originY: "38%",
        logoMuted: "rgba(221, 214, 254, 0.82)", logoActive: "#a78bfa", logoGlow: "rgba(167, 139, 250, 0.34)",
        burstAccent: "#8b5cf6", burstSoft: "rgba(245, 243, 255, 0.98)",
        dotMuted: "rgba(196, 181, 253, 0.12)", dotActive: "rgba(221, 214, 254, 0.38)",
        lineMuted: "rgba(167, 139, 250, 0.16)", rayLight: "rgba(245, 243, 255, 0.96)", rayInk: "rgba(9, 5, 16, 0.98)",
        panelTint: "rgba(139, 92, 246, 0.14)", borderActive: "rgba(196, 181, 253, 0.44)", shadowActive: "rgba(109, 40, 217, 0.42)",
      },
      impact: { text: "SAFE!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/sicurezza.jpg", alt: "sicurezza Image" }] },
    proofs: [],
  },
  "monta-smonta": {
    title: "Monta e Smonta",
    type: { zh: "Hardware / PC Assembly", en: "Hardware / Assemblaggio PC" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Disassembly and reassembly of a desktop PC to study its internal components.", en: "Smontaggio e rimontaggio di un computer fisso per studiarne i componenti interni." },
    description: {
      zh: "Date: 02/2024 (A.S. 2024/2025)<br>Location: Reggio Emilia<br><br>Description: I disassembled and reassembled a desktop PC during a lab activity. I identified each component (CPU, RAM, hard disk, motherboard, power supply, heatsinks, fans) and understood their role in the system ecosystem. The experience taught me how interconnected components form an integrated system, and how practical maintenance requires precision and knowledge of specifications (compatible connectors, correct orientation, thermal management).<br><br>Technical skills:<br>- Hardware components: CPU (socket and thermal paste), RAM (slots), storage (SATA, M.2)<br>- Power supply: voltage, PWR connectors, power distribution<br>- Thermal dissipation: fans, thermal paste, airflow paths<br>- Connectors and interfaces: PCI, USB, internal audio<br>- Troubleshooting: boot failure diagnosis, component replacement<br><br>Transversal skills:<br>- Manual precision: delicate handling of fragile components<br>- Attention to detail: correct orientation, secure connections<br>- Teamwork: coordination with classmates for simultaneous activities<br>- Responsibility: conscientiousness in handling expensive equipment",
      en: "Data: 02/2024 (A.S. 2024/2025)<br>Luogo: Reggio Emilia<br><br>Descrizione: Ho smontato e rimontato un computer fisso durante un'attività laboratoriale. Ho identificato ogni componente (CPU, RAM, hard disk, scheda madre, alimentatore, dissipatori, ventole) e compreso il loro ruolo nell'ecosistema del sistema. L'esperienza mi ha insegnato come i componenti interconnessi formano un sistema integrato, e come la manutenzione pratica richieda precisione e conoscenza delle specifiche (connettori compatibili, corretta orientazione, gestione termica).<br><br>Competenze tecniche:<br>- Componenti hardware: CPU (socket e thermal paste), RAM (slots), storage (SATA, M.2)<br>- Alimentazione: voltaggio, connettori PWR, distribuzione energia<br>- Dissipazione termica: ventole, pasta termica, percorsi aria<br>- Connettori e interfacce: PCI, USB, audio interni<br>- Troubleshooting: diagnosi di boot failure, sostituzione componenti<br><br>Competenze trasversali:<br>- Precisione manuale: manipolazione delicata di componenti fragili<br>- Attenzione ai dettagli: orientamento corretto, connessioni salde<br>- Lavoro di squadra: coordinamento con compagni per attività simultanee<br>- Responsabilità: conscienziosità nel trattare dispositivi costosi",
    },
    meta: { zh: "CPU / RAM / Motherboard / Hardware Maintenance", en: "CPU / RAM / Scheda madre / Manutenzione hardware" },
    signals: { zh: ["Hands-on assembly", "Components identified"], en: ["Assemblaggio pratico", "Componenti identificati"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/monta_smonta.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "50%", originY: "40%",
        logoMuted: "rgba(199, 209, 212, 0.82)", logoActive: "#2cd8c9", logoGlow: "rgba(44, 216, 201, 0.34)",
        burstAccent: "#39e977", burstSoft: "rgba(247, 255, 252, 0.98)",
        dotMuted: "rgba(239, 246, 244, 0.12)", dotActive: "rgba(247, 255, 251, 0.38)",
        lineMuted: "rgba(154, 194, 191, 0.12)", rayLight: "rgba(255, 255, 255, 0.96)", rayInk: "rgba(6, 8, 11, 0.98)",
        panelTint: "rgba(176, 224, 216, 0.2)", borderActive: "rgba(121, 247, 217, 0.44)", shadowActive: "rgba(22, 118, 98, 0.42)",
      },
      impact: { text: "BOOT!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/monta-smonta.gif", alt: "monta smonta Image" }] },
    proofs: [],
  },
  anpal: {
    title: "ANPAL",
    type: { zh: "Job Market / Career Planning", en: "Orientamento / Mercato del Lavoro" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Study of ANPAL's functions and opportunities in the Italian job market.", en: "Studio delle funzioni di ANPAL e delle opportunità nel mercato del lavoro italiano." },
    description: {
      zh: "Date: 02/2023 (A.S. 2024/2025)<br>Location: Reggio Emilia<br><br>Description: I studied the role of ANPAL (National Agency for Active Labour Policies) during an orientation activity. I learned how the agency supports employment through training, personalised guidance, and job placement. The experience gave me a map of resources available to young people after graduation, and a more aware understanding of the Italian job market and the challenges of entering it.<br><br>Technical skills:<br>- ANPAL overview: mission, programmes, services (CPI, placement, training)<br>- Training pathways: ITS, university, apprenticeship<br>- Employment incentives for companies<br>- Labour market: demand, supply, skill gaps<br><br>Transversal skills:<br>- Career orientation: systematic vision of opportunities<br>- Context awareness: how the employment system works in Italy<br>- Planning: identifying concrete future paths<br>- Networking: knowledge of resources and contacts",
      en: "Data: 02/2023 (A.S. 2024/2025)<br>Luogo: Reggio Emilia<br><br>Descrizione: Ho approfondito il ruolo di ANPAL (Agenzia Nazionale per le Politiche Attive del Lavoro) durante un'attività di orientamento. Ho imparato come l'ente supporta l'occupazione tramite formazione, orientamento personalizzato e inserimento lavorativo. L'esperienza mi ha fornito una mappa delle risorse disponibili per giovani dopo il diploma, e una comprensione più consapevole del mercato del lavoro italiano e delle sfide dell'inserimento.<br><br>Competenze tecniche:<br>- Panoramica ANPAL: missione, programmi, servizi (CPI, collocamento, formazione)<br>- Percorsi formativi: ITS, università, apprendistato<br>- Incentivi all'occupazione per aziende<br>- Mercato del lavoro: demand, supply, skill gaps<br><br>Competenze trasversali:<br>- Orientamento professionale: visione sistemica delle opportunità<br>- Consapevolezza del contesto: come funziona il sistema lavoro in Italia<br>- Pianificazione: identificare percorsi concreti per il proprio futuro<br>- Networking: conoscenza di risorse e contatti",
    },
    meta: { zh: "Employment Policy / Career Orientation / Labour Market", en: "ANPAL / Orientamento al lavoro / Mercato del lavoro" },
    signals: { zh: ["Employment awareness", "Career planning"], en: ["Orientamento professionale", "Mercato del lavoro"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/anpal.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "42%", originY: "38%",
        logoMuted: "rgba(194, 207, 244, 0.82)", logoActive: "#38bdf8", logoGlow: "rgba(56, 189, 248, 0.34)",
        burstAccent: "#60a5fa", burstSoft: "rgba(236, 254, 255, 0.98)",
        dotMuted: "rgba(186, 230, 253, 0.12)", dotActive: "rgba(224, 242, 254, 0.38)",
        lineMuted: "rgba(147, 197, 253, 0.16)", rayLight: "rgba(240, 249, 255, 0.96)", rayInk: "rgba(3, 7, 18, 0.98)",
        panelTint: "rgba(96, 165, 250, 0.14)", borderActive: "rgba(125, 211, 252, 0.44)", shadowActive: "rgba(7, 89, 133, 0.42)",
      },
      impact: { text: "LAVORO!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/anpal.jpeg", alt: "anpal Image" }] },
    proofs: [],
  },
  linux: {
    title: "Linux",
    type: { zh: "Operating System / Ubuntu", en: "Linux / Ubuntu / Terminale" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Five lessons on Linux Ubuntu: basic commands, system history, and comparison with other OSes.", en: "Cinque lezioni su Linux Ubuntu: comandi base, storia del sistema e confronto con altri OS." },
    description: {
      zh: "Date: 02/2023 (A.S. 2024/2025)<br>Location: Reggio Emilia<br><br>Description: I studied the Linux operating system (Ubuntu distribution) over 5 lessons totalling 10 hours. I learned to use the terminal, the main management commands (navigation, file permissions, process management) and understood the open-source philosophy behind Linux. The experience taught me how the design paradigm (modularity, code transparency, community) influences how the system works compared to proprietary systems.<br><br>Technical skills:<br>- Linux/Bash terminal: navigation, basic commands, scripts<br>- File system management: permissions (chmod), owners, directory structure<br>- Processes and services: viewing, terminating, background jobs<br>- Package manager: software installation and updates<br>- Differences between operating systems: kernel, file system, licences<br><br>Transversal skills:<br>- Adaptability: learning a new environment after years with Windows/macOS<br>- Self-directed learning: documentation, troubleshooting<br>- Technical curiosity: understanding \"how it works\" not just \"how to use it\"",
      en: "Data: 02/2023 (A.S. 2024/2025)<br>Luogo: Reggio Emilia<br><br>Descrizione: Ho approfondito il sistema operativo Linux (distribuzione Ubuntu) durante un'attività di studio. Ho imparato come utilizzare il terminale, i principali comandi di gestione (navigazione, permessi file, gestione processi) e compreso la filosofia open source dietro Linux. L'esperienza mi ha insegnato come il paradigma di progettazione (modularità, trasparenza del codice, comunità) influenza il funzionamento del sistema rispetto ai sistemi proprietari.<br><br>Competenze tecniche:<br>- Terminale Linux/Bash: navigazione, comandi di base, script<br>- Gestione file system: permessi (chmod), proprietari, struttura directory<br>- Processi e servizi: visualizzazione, terminazione, background jobs<br>- Package manager: installazione e aggiornamento software<br>- Differenze tra sistemi operativi: kernel, file system, licenze<br><br>Competenze trasversali:<br>- Adattabilità: imparare un nuovo ambiente dopo anni con Windows/macOS<br>- Apprendimento autonomo: documentazione, troubleshooting<br>- Curiosità tecnica: capire \"come funziona\" non solo \"come usare\"",
    },
    meta: { zh: "Linux / Ubuntu / Terminal Commands / Open Source", en: "Linux / Ubuntu / Terminale / Open source" },
    signals: { zh: ["Terminal commands", "Open source system"], en: ["Comandi terminale", "Sistema open source"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/linux.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "54%", originY: "36%",
        logoMuted: "rgba(232, 210, 193, 0.82)", logoActive: "#fb923c", logoGlow: "rgba(251, 146, 60, 0.34)",
        burstAccent: "#f59e0b", burstSoft: "rgba(255, 251, 235, 0.98)",
        dotMuted: "rgba(253, 230, 138, 0.12)", dotActive: "rgba(254, 243, 199, 0.38)",
        lineMuted: "rgba(253, 186, 116, 0.16)", rayLight: "rgba(255, 247, 237, 0.96)", rayInk: "rgba(12, 7, 2, 0.98)",
        panelTint: "rgba(245, 158, 11, 0.14)", borderActive: "rgba(252, 211, 77, 0.44)", shadowActive: "rgba(146, 64, 14, 0.42)",
      },
      impact: { text: "LINUX!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/ubuntu.jpg", alt: "ubuntu Image" }] },
    proofs: [],
  },
  "polarity-ai": {
    title: "Polarity AI",
    type: { zh: "AI Lab / Algorithms / API", en: "AI / Algoritmi / API" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "AI lab with a team game based on HTTP API and JSON to find treasures on a map.", en: "Laboratorio AI con gioco a squadre basato su API HTTP e JSON per trovare tesori su una mappa." },
    description: {
      zh: "Date: 2025 (A.S. 2025/2026)<br>Location: Territory labs<br><br>Description: I took part in a training activity where we applied APIs and algorithms to solve a map search game. The exercise taught me how to interpret binary feedback from a server and optimise the search strategy. We made HTTP requests to a service that responded with JSON (far, near, very near). In the team we developed increasingly efficient algorithms: initially a random approach, then a quadrant search, finally a bisection strategy. The experience reinforced my ability to reason algorithmically and translate feedback into better strategies. The final presentation required clearly communicating the iterative process.<br><br>Technical skills:<br>- HTTP and REST API: making requests, interpreting responses<br>- Data formats: JSON parsing, structured response handling<br>- Algorithms: optimisation through feedback, time complexity<br>- Logic and strategy: bisection, geographic search, rapid prototyping<br><br>Transversal skills:<br>- Algorithmic thinking and optimisation<br>- Strategy adaptation based on feedback (iteration)<br>- Communication of technical ideas<br>- Collaboration under competitive pressure",
      en: "Data: 2025 (A.S. 2025/2026)<br>Luogo: Laboratori territoriali<br><br>Descrizione: Ho partecipato a un'attività formativa in cui abbiamo applicato API e algoritmi per risolvere un gioco di ricerca su mappa. L'esercizio mi ha insegnato come interpretare feedback binari da un server e ottimizzare la strategia di ricerca. Abbiamo fatto richieste HTTP a un servizio che rispondeva con JSON (lontano, vicino, molto vicino). Nel team abbiamo sviluppato algoritmi sempre più efficienti: inizialmente un'approccio casuale, poi una ricerca per quadranti, infine una strategia di bisezione. L'esperienza ha rafforzato la mia capacità di ragionare algoritmicamente e tradurre feedback in strategie migliori. La presentazione finale ha richiesto di comunicare chiaramente il processo iterativo.<br><br>Competenze tecniche:<br>- HTTP e REST API: effettuare richieste, interpretare risposte<br>- Formati dati: parsing JSON, gestione risposte strutturate<br>- Algoritmi: ottimizzazione mediante feedback, complessità temporale<br>- Logica e strategia: bisezione, ricerca geografica, prototipazione rapida<br><br>Competenze trasversali:<br>- Pensiero algoritmico e ottimizzazione<br>- Adattamento della strategia basato su feedback (iterazione)<br>- Comunicazione di idee tecniche<br>- Collaborazione sotto pressione competitiva",
    },
    meta: { zh: "HTTP API / JSON / Algorithm Optimisation / AI", en: "API HTTP / JSON / Algoritmi / AI" },
    signals: { zh: ["Optimised algorithm", "Teamwork"], en: ["Algoritmo ottimizzato", "Lavoro di squadra"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/node.js.svg" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "46%", originY: "42%",
        logoMuted: "rgba(232, 193, 193, 0.82)", logoActive: "#f87171", logoGlow: "rgba(248, 113, 113, 0.34)",
        burstAccent: "#ef4444", burstSoft: "rgba(255, 241, 241, 0.98)",
        dotMuted: "rgba(254, 202, 202, 0.12)", dotActive: "rgba(254, 226, 226, 0.38)",
        lineMuted: "rgba(252, 165, 165, 0.16)", rayLight: "rgba(255, 245, 245, 0.96)", rayInk: "rgba(12, 3, 3, 0.98)",
        panelTint: "rgba(239, 68, 68, 0.14)", borderActive: "rgba(252, 165, 165, 0.44)", shadowActive: "rgba(153, 27, 27, 0.42)",
      },
      impact: { text: "CODE!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/treasure.jpeg", alt: "Preview Image" }, { src: "img/api.webp", alt: "api Image" },{src: "img/json.jpg", alt: "json Image"}] },
    proofs: [],
  },
  "mead-informatica": {
    title: "Mead Informatica",
    type: { zh: "Cybersecurity / Attack-Defence Lab", en: "Cybersecurity / Laboratorio" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Real attack/defence simulation on a company infrastructure, split into attackers and defenders.", en: "Simulazione reale di attacco e difesa su infrastruttura aziendale presso un'azienda." },
    description: {
      zh: "Date: 04/2026 (A.S. 2025/2026)<br>Location: Company<br><br>Description: I took part in a real attack/defence simulation exercise on a company infrastructure. Our team played the role of defenders: we monitored the systems, identified intrusion attempts, and put countermeasures in place. The experience was illuminating: it taught me how vulnerabilities manifest in practice and how you need to think \"offensively\" (put yourself in the attacker's shoes) even when defending. I saw how small misconfigurations can open important access points.<br><br>Technical skills:<br>- System monitoring: log analysis, detection of suspicious activity<br>- Defence: patching, secure configuration, hardening<br>- Understanding of attack techniques: brute force, privilege escalation, social engineering<br>- Incident response: real-time management<br>- Audit trail: tracking activities for investigation<br><br>Transversal skills:<br>- Critical thinking: anticipating adversary moves<br>- Stress management under pressure (real-time exercise)<br>- Close collaboration with the team<br>- Responsibility for others' security",
      en: "Data: 04/2026 (A.S. 2025/2026)<br>Luogo: Azienda<br><br>Descrizione: Ho partecipato a un esercizio di simulazione reale di attacco/difesa di un'infrastruttura aziendale. Il nostro team ha ricoperto il ruolo di difensori: abbiamo monitorato i sistemi, identificato i tentativi di intrusione, e messo in atto contromisure. L'esperienza è stata illuminante: mi ha insegnato come le vulnerabilità si manifestano nella pratica e come è necessario pensare in modo \"offensivo\" (mettersi nei panni dell'attaccante) anche quando si difende. Ho visto come piccole configurazioni errate possono aprire varchi di accesso importanti.<br><br>Competenze tecniche:<br>- Monitoraggio sistemico: log analysis, detection di attività sospette<br>- Difesa: patching, configurazione sicura, hardening<br>- Comprensione di tecniche di attacco: brute force, privilege escalation, social engineering<br>- Risposta agli incidenti: gestione in tempo reale<br>- Audit trail: tracciamento delle attività per investigazione<br><br>Competenze trasversali:<br>- Pensiero critico: anticipare manovre avversarie<br>- Gestione dello stress sotto pressione (esercizio in real-time)<br>- Collaborazione stretta con il team<br>- Responsabilità sulla sicurezza altrui",
    },
    meta: { zh: "Cybersecurity / Vulnerability Analysis / Defence Strategy / Monitoring", en: "Cybersecurity / Vulnerabilità / Difesa sistemi / Monitoraggio" },
    signals: { zh: ["Attack and defence", "Real vulnerabilities"], en: ["Attacco e difesa", "Vulnerabilità reali"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/mead.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "48%", originY: "38%",
        logoMuted: "rgba(221, 214, 254, 0.82)", logoActive: "#a78bfa", logoGlow: "rgba(167, 139, 250, 0.34)",
        burstAccent: "#8b5cf6", burstSoft: "rgba(245, 243, 255, 0.98)",
        dotMuted: "rgba(196, 181, 253, 0.12)", dotActive: "rgba(221, 214, 254, 0.38)",
        lineMuted: "rgba(167, 139, 250, 0.16)", rayLight: "rgba(245, 243, 255, 0.96)", rayInk: "rgba(9, 5, 16, 0.98)",
        panelTint: "rgba(139, 92, 246, 0.14)", borderActive: "rgba(196, 181, 253, 0.44)", shadowActive: "rgba(109, 40, 217, 0.42)",
      },
      impact: { text: "SECURE!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/redblue.jpeg", alt: "redblue Image" },{src: "img/cybersecurity.jpg", alt: "Mead Image"}] },
    proofs: [],
  },
  "restituzione-tirocinio": {
    title: "Tirocinio",
    type: { zh: "Internship Presentation / Web App", en: "Presentazione / Tirocinio" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School internship project — repository not public.", en: "Progetto di tirocinio scolastico — repository non pubblico." },
    frontIntro: { zh: "Presentation of the company internship to the class: web app for booking machinery.", en: "Presentazione del tirocinio aziendale: web app per la prenotazione di macchinari." },
    description: {
      zh: "Date: 11/2025 (A.S. 2025/2026)<br>Location: School<br><br>Description: I presented my company internship experience to the class and teachers. During the internship I independently managed the transfer of sensitive company data to the SmartSuite platform, learning the importance of precision when handling confidential information and respecting data handling protocols. The presentation challenged me to synthesise a complex experience in a way that was understandable and interesting for the audience.<br><br>Technical skills:<br>- Visual presentation: slide design, use of PowerPoint<br>- Data management: integrity, confidentiality, secure transfer<br>- Technical synthesis: turning experience into a clear narrative<br>- SaaS platforms: SmartSuite (structure, data import logic)<br><br>Transversal skills:<br>- Public speaking: communicating confidently in front of an audience<br>- Synthesis: capturing the key elements of an experience<br>- Responsibility in handling sensitive data<br>- Self-assessment and reflection on learning",
      en: "Data: 11/2025 (A.S. 2025/2026)<br>Luogo: Scuola<br><br>Descrizione: Ho presentato l'esperienza del mio tirocinio aziendale davanti alla classe e ai docenti. Durante il tirocinio ho gestito autonomamente il trasferimento di dati sensibili aziendali verso la piattaforma SmartSuite, imparando l'importanza della precisione nel trattamento di informazioni confidenziali e il rispetto dei protocolli di data handling. La presentazione mi ha sfidato nel sintetizzare un'esperienza complessa in modo comprensibile e interessante per il pubblico.<br><br>Competenze tecniche:<br>- Presentazione visiva: design di slide, uso di PowerPoint<br>- Gestione dati: integrità, confidenzialità, trasferimento sicuro<br>- Sintesi tecnica: trasformare esperienza in narrativa chiara<br>- Piattaforme SaaS: SmartSuite (struttura, logica di importazione dati)<br><br>Competenze trasversali:<br>- Public speaking: comunicare con sicurezza davanti al pubblico<br>- Sintesi: catturare gli elementi chiave di un'esperienza<br>- Responsabilità nel trattare dati sensibili<br>- Autovalutazione e riflessione su apprendimenti",
    },
    meta: { zh: "PowerPoint / Web App / Technical Presentation", en: "PowerPoint / Web app / Comunicazione tecnica" },
    signals: { zh: ["Internship result", "Public presentation"], en: ["Risultato tirocinio", "Presentazione pubblica"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/presentation.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "50%", originY: "40%",
        logoMuted: "rgba(199, 209, 212, 0.82)", logoActive: "#2cd8c9", logoGlow: "rgba(44, 216, 201, 0.34)",
        burstAccent: "#39e977", burstSoft: "rgba(247, 255, 252, 0.98)",
        dotMuted: "rgba(239, 246, 244, 0.12)", dotActive: "rgba(247, 255, 251, 0.38)",
        lineMuted: "rgba(154, 194, 191, 0.12)", rayLight: "rgba(255, 255, 255, 0.96)", rayInk: "rgba(6, 8, 11, 0.98)",
        panelTint: "rgba(176, 224, 216, 0.2)", borderActive: "rgba(121, 247, 217, 0.44)", shadowActive: "rgba(22, 118, 98, 0.42)",
      },
      impact: { text: "DEMO!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/tirocinio.jpg", alt: "Tirocinio Image" },{src: "img/powerautomate.jpg", alt: " powerautomate Image"}] },
    proofs: [],
  },
  "ready-to-go": {
    title: "Ready To Go",
    type: { zh: "Post-Diploma Orientation / Career Planning", en: "Orientamento Post-Diploma" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "Post-diploma orientation covering university, work, and community service.", en: "Orientamento post-diploma su università, lavoro e servizio civile." },
    description: {
      zh: "Date: 2025 (A.S. 2025/2026)<br>Location: School<br><br>Description: I attended orientation sessions focused on the post-diploma transition. I explored the three main directions: university (programmes, admissions, study), work (internships, apprenticeship, direct employment), and alternatives (community service, gap year). The sessions helped me understand that there is no single \"right\" path, but many opportunities with their own pros and cons. I started thinking consciously about which path best aligns with my interests and abilities.<br><br>Technical skills:<br>- University pathways: bachelor's degrees, master's programmes, specialisations<br>- Work pathways: internships, apprenticeship, direct employment<br>- Funding: scholarships, loans, grants<br>- Alternative opportunities: community service, abroad, dual training<br><br>Transversal skills:<br>- Self-awareness: what I truly want from my future<br>- Decision-making: weighing alternatives and choosing<br>- Responsibility: awareness that choices have consequences<br>- Flexibility: openness to the fact that plans can change",
      en: "Data: 2025 (A.S. 2025/2026)<br>Luogo: Scuola<br><br>Descrizione: Ho partecipato a incontri di orientamento focalizzati sulla transizione post-diploma. Ho esplorato le tre macro-direzioni: università (percorsi, selezioni, studi), lavoro (tirocini, apprendistato, inserimento), e alternative (servizio civile, gap year). Gli incontri mi hanno aiutato a comprendere che non c'è un'unica strada giusta, ma molte opportunità con pro e contro. Ho iniziato a ragionare in modo consapevole su quale percorso si allinea meglio ai miei interessi e capacità.<br><br>Competenze tecniche:<br>- Percorsi universitari: lauree triennali, magistrali, specializzazioni<br>- Percorsi lavorativi: stage, apprendistato, assunzione diretta<br>- Finanziamento: borse di studio, prestiti, agevolazioni<br>- Opportunità alternative: servizio civile, estero, formazione duale<br><br>Competenze trasversali:<br>- Autoconsapevolezza: cosa voglio davvero dal mio futuro<br>- Decisionalità: capacità di vagliare alternative e scegliere<br>- Responsabilità: consapevolezza che le scelte hanno conseguenze<br>- Flessibilità: apertura al fatto che i piani possono cambiare",
    },
    meta: { zh: "Post-Diploma Planning / University / Work / Community Service", en: "Post-diploma / Università / Lavoro / Servizio civile" },
    signals: { zh: ["Future planning", "Informed choices"], en: ["Scelte consapevoli", "Orientamento futuro"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/bussola.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "42%", originY: "38%",
        logoMuted: "rgba(194, 207, 244, 0.82)", logoActive: "#38bdf8", logoGlow: "rgba(56, 189, 248, 0.34)",
        burstAccent: "#60a5fa", burstSoft: "rgba(236, 254, 255, 0.98)",
        dotMuted: "rgba(186, 230, 253, 0.12)", dotActive: "rgba(224, 242, 254, 0.38)",
        lineMuted: "rgba(147, 197, 253, 0.16)", rayLight: "rgba(240, 249, 255, 0.96)", rayInk: "rgba(3, 7, 18, 0.98)",
        panelTint: "rgba(96, 165, 250, 0.14)", borderActive: "rgba(125, 211, 252, 0.44)", shadowActive: "rgba(7, 89, 133, 0.42)",
      },
      impact: { text: "GO!", mode: "subtle" },
    },
    preview: { images: [{src: "img/orientamento.jpg", alt: "Orientamento post-diploma"}] },
    proofs: [],
  },
  lubiana: {
    title: "Università di Lubiana",
    type: { zh: "AI Projects / International University Visit", en: "Università / AI / Internazionale" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School visit activity — no public repository.", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "AI presentations at the Computer Science department of the University of Ljubljana during the study trip.", en: "Presentazioni AI al dipartimento di Informatica dell'Università di Lubiana durante il viaggio d'istruzione." },
    description: {
      zh: "Date: 04/2026 (A.S. 2025/2026)<br>Location: Ljubljana (Slovenia)<br><br>Description: I visited the Computer Science department of the University of Ljubljana during a study trip. I listened to university students presenting AI research projects, seeing how technology is used at the highest academic levels. I wrote a summary report that forced me to distil the key concepts and reflect on which aspects of the research interested me most. The experience opened my perspective on what it might mean to continue studying beyond the diploma.<br><br>Technical skills:<br>- Artificial intelligence: overview of applications and research<br>- Machine learning: basic concepts, case study projects<br>- University research: methodologies, publications, funding<br>- Tools and frameworks: overview of the AI ecosystem<br><br>Transversal skills:<br>- Active listening: extracting concepts from technical presentations<br>- Analytical synthesis: reducing complexity to key points<br>- International outlook: openness to European contexts<br>- Intellectual curiosity: interest in frontier research<br>- Multilingualism: navigating non-English environments (Slovenian, academic English)",
      en: "Data: 04/2026 (A.S. 2025/2026)<br>Luogo: Lubiana (Slovenia)<br><br>Descrizione: Ho visitato il dipartimento di Informatica dell'Università di Lubiana durante un viaggio di istruzione. Ho ascoltato presentazioni di studenti universitari su progetti di ricerca in AI, vedendo come si lavora con le tecnologie ai massimi livelli accademici. Ho scritto una relazione sintetica che mi ha obbligato a distillare i concetti principali e a riflettere su quali aspetti della ricerca mi interessassero di più. L'esperienza ha aperto la mia prospettiva su cosa possa significare proseguire gli studi oltre il diploma.<br><br>Competenze tecniche:<br>- Intelligenza artificiale: panoramica di applicazioni e ricerca<br>- Machine learning: concetti base, progetti case study<br>- Ricerca universitaria: metodologie, pubblicazioni, funding<br>- Strumenti e framework: panoramica ecosistema AI<br><br>Competenze trasversali:<br>- Ascolto attivo: estrarre concetti da presentazioni tecniche<br>- Sintesi analitica: ridurre complessità a punti chiave<br>- Visione internazionale: apertura a contesti europei<br>- Curiosità intellettuale: interesse per la ricerca frontiera<br>- Bilinguismo: navigare ambienti non anglofoni (Slovenia, inglese accademico)",
    },
    meta: { zh: "AI Fundamentals / International Outlook / University Research", en: "AI / Università internazionale / Sintesi" },
    signals: { zh: ["International outlook", "Real AI projects"], en: ["Contesto internazionale", "Progetti AI reali"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/zagreb.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "54%", originY: "36%",
        logoMuted: "rgba(232, 210, 193, 0.82)", logoActive: "#fb923c", logoGlow: "rgba(251, 146, 60, 0.34)",
        burstAccent: "#f59e0b", burstSoft: "rgba(255, 251, 235, 0.98)",
        dotMuted: "rgba(253, 230, 138, 0.12)", dotActive: "rgba(254, 243, 199, 0.38)",
        lineMuted: "rgba(253, 186, 116, 0.16)", rayLight: "rgba(255, 247, 237, 0.96)", rayInk: "rgba(12, 7, 2, 0.98)",
        panelTint: "rgba(245, 158, 11, 0.14)", borderActive: "rgba(252, 211, 77, 0.44)", shadowActive: "rgba(146, 64, 14, 0.42)",
      },
      impact: { text: "GLOBAL!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/IMG_1366.png", alt: "trip" },{src: "img/IMG_1445.png", alt: "trip2"},{src: "img/IMG_1471.png", alt: "trip3"},{src: "img/IMG_1478.png", alt: "trip4"},{src:"img/lubiana.jpg", alt: "trip5"}] },
    proofs: [],
  },
  "project-work-expo": {
    title: "Esposizione KeyManager",
    type: { zh: "Project Presentation / KeyManager", en: "Presentazione / KeyManager" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "School project — repository not public.", en: "Progetto scolastico — repository non pubblico." },
    frontIntro: { zh: "Presentation of the KeyManager project to fourth-year students, explaining the architecture and security choices.", en: "Presentazione del progetto KeyManager alle classi quarte con illustrazione dell'architettura e delle scelte di sicurezza." },
    description: {
      zh: "Date: 05/2026 (A.S. 2025/2026)<br>Location: School<br><br>Description: I presented the KeyManager project to fourth-year classes, explaining the three-layer architecture (PHP backend, MySQL database, browser extension), the security choices (encryption, prepared statements, session management), and the design trade-offs (usability vs. security, implementation complexity). The challenge was making a complex technical solution understandable to a student audience with varying levels of experience.<br><br>Technical skills:<br>- Presenting software architecture<br>- Explaining design choices and trade-offs<br>- Communicating security concepts accessibly<br>- Organising technical content<br><br>Transversal skills:<br>- Public speaking: managing nerves, clarity of language<br>- Technical empathy: adapting level of detail to the audience<br>- Time management: staying within the allotted time<br>- Openness to feedback: questions and rubric evaluation",
      en: "Data: 05/2026 (A.S. 2025/2026)<br>Luogo: Scuola<br><br>Descrizione: Ho presentato il progetto KeyManager alle classi quarte, illustrando l'architettura a tre strati (backend PHP, database MySQL, browser extension), le scelte di sicurezza (crittografia, prepared statements, session management) e i compromessi progettuali (usabilità vs. sicurezza, complessità implementativa). La sfida era rendere comprensibile una soluzione tecnica complessa a un'audience di studenti con diversi livelli di esperienza.<br><br>Competenze tecniche:<br>- Presentazione di architetture software<br>- Spiegazione di scelte progettuali e compromessi<br>- Comunicazione di concetti di sicurezza in modo accessibile<br>- Organizzazione di contenuti tecnici<br><br>Competenze trasversali:<br>- Public speaking: gestione dell'ansia, chiarezza nel linguaggio<br>- Empatia tecnica: adattare il livello di dettaglio all'audience<br>- Gestione del tempo: entro limite temporale assegnato<br>- Apertura al feedback: domande e valutazione della rubrica",
    },
    meta: { zh: "Project Demo / Technical Communication / Public Speaking", en: "Public speaking / Comunicazione tecnica / Architettura" },
    signals: { zh: ["Public presentation", "Rubric evaluation"], en: ["Presentazione pubblica", "Valutazione con rubrica"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/presentation.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "46%", originY: "42%",
        logoMuted: "rgba(232, 193, 193, 0.82)", logoActive: "#f87171", logoGlow: "rgba(248, 113, 113, 0.34)",
        burstAccent: "#ef4444", burstSoft: "rgba(255, 241, 241, 0.98)",
        dotMuted: "rgba(254, 202, 202, 0.12)", dotActive: "rgba(254, 226, 226, 0.38)",
        lineMuted: "rgba(252, 165, 165, 0.16)", rayLight: "rgba(255, 245, 245, 0.96)", rayInk: "rgba(12, 3, 3, 0.98)",
        panelTint: "rgba(239, 68, 68, 0.14)", borderActive: "rgba(252, 165, 165, 0.44)", shadowActive: "rgba(153, 27, 27, 0.42)",
      },
      impact: { text: "SHARE!", mode: "subtle" },
    },
    preview: { images: [] },
    proofs: [],
  },
  keymanager: {
    title: "KeyManager",
    type: { zh: "Backend / Security / Browser Extension", en: "Backend / Sicurezza / Browser Extension" },
    link: "", linkLabel: "",
    githubLink: "https://github.com/xiul1/project-work",
    githubLabel: "GitHub / project-work",
    githubNote: { zh: "", en: "" },
    frontIntro: { zh: "Complete credential management system: PHP backend, MySQL, and browser extension with automatic autofill.", en: "Sistema completo di gestione credenziali: PHP backend, MySQL e browser extension con autofill automatico." },
    description: {
      zh: "Date: A.S. 2025/2026 (annual)<br>Location: School<br><br>Description: I developed KeyManager, a complete three-layer credential management system: PHP backend, MySQL database, and browser extension. The system allowed me to deeply study end-to-end secure architecture. In the backend I implemented user authentication, encrypted storage (master password + double layer), session management with 30-minute timeout, prepared statements to prevent SQL injection, logging and audit trail, CSRF protection. In the database I managed encrypted credentials and sessions. In the browser extension (JavaScript/Node.js) I implemented automatic recognition of login fields and secure autofill via encrypted channel. I also handled email verification, password reset with temporary tokens, input validation at system boundaries, and 80%+ test coverage on the extension with Jest. The experience taught me how to approach a large-scale project with a focus on quality and security.<br><br>Technical skills:<br>- Backend programming (PHP): authentication, application logic, error handling<br>- Frontend programming (JavaScript): browser extension with manifest, content scripts, service worker<br>- Cryptography: double-layer encryption, master password management<br>- Database: MySQL, query design, session management, schema security<br>- Security: CSRF protection, prepared statements, SQL injection prevention, input validation<br>- Browser extension: DOM inspection, pattern matching for login fields, secure communication between extension and backend<br>- Testing: Jest, test coverage analysis (80%+)<br>- Email: verification setup and tokenised password reset<br>- Distributed debugging across multi-layer components<br><br>Transversal skills:<br>- Architectural thinking for complex systems<br>- Time management on an annual project<br>- Responsibility for data security<br>- Multi-component problem solving (backend, database, frontend)<br>- Iteration based on feedback and refactoring<br>- Attention to detail (security-critical code)<br>- Autonomy on a large-scale project",
      en: "Data: A.S. 2025/2026 (annuale)<br>Luogo: Scuola<br><br>Descrizione: Ho sviluppato KeyManager, un sistema completo di gestione delle credenziali a tre strati: backend PHP, database MySQL e browser extension. Il sistema mi ha permesso di approfondire l'architettura sicura end-to-end. Nel backend ho implementato autenticazione utente, archiviazione crittografata (master password + doppio livello), session management con timeout di 30 minuti, prepared statements per prevenire SQL injection, logging e audit trail, CSRF protection. Nel database ho gestito credenziali crittografate e sessioni. Nella browser extension (JavaScript/Node.js) ho implementato il riconoscimento automatico di campi login e l'autofill sicuro tramite canale crittografato. Ho curato anche verifiche email, reset password con token temporanei, validazione input alle system boundaries, e test coverage del 80%+ sulla extension con Jest. L'esperienza mi ha insegnato come affrontare un progetto di ampia portata con focus sulla qualità e la sicurezza.<br><br>Competenze tecniche:<br>- Programmazione backend (PHP): autenticazione, logica applicativa, gestione errori<br>- Programmazione frontend (JavaScript): browser extension con manifest, content scripts, service worker<br>- Crittografia: double-layer encryption, master password management<br>- Database: MySQL, query design, gestione sessioni, schema security<br>- Sicurezza: CSRF protection, prepared statements, SQL injection prevention, input validation<br>- Browser extension: DOM inspection, pattern matching per campi login, comunicazione secure tra extension e backend<br>- Testing: Jest, test coverage analysis (80%+)<br>- Email: configurazione verifica e password reset tokenizzato<br>- Debugging distribuito su componenti multi-layer<br><br>Competenze trasversali:<br>- Pensiero architetturale per sistemi complessi<br>- Gestione del tempo su progetto annuale<br>- Responsabilità sulla sicurezza dei dati<br>- Problem solving multi-componente (backend, database, frontend)<br>- Iterazione basata su feedback e refactoring<br>- Attenzione al dettaglio (security-critical code)<br>- Autonomia su progetto di ampia portata",
    },
    meta: { zh: "PHP / MySQL / JavaScript / Browser Extension / Encryption / CSRF / Jest", en: "PHP / MySQL / JavaScript / Browser Extension / Crittografia / CSRF / Jest" },
    signals: { zh: ["End-to-end encryption", "Automatic autofill", "Test coverage 80%+"], en: ["Crittografia end-to-end", "Autofill automatico", "Test coverage 80%+"] },
    cover: {
      profile: "logo-burst",
      logo: { asset: "img/cover-logo/lock.png" /* TODO: aggiungi immagine */ },
      theme: {
        originX: "48%", originY: "38%",
        logoMuted: "rgba(221, 214, 254, 0.82)", logoActive: "#a78bfa", logoGlow: "rgba(167, 139, 250, 0.34)",
        burstAccent: "#8b5cf6", burstSoft: "rgba(245, 243, 255, 0.98)",
        dotMuted: "rgba(196, 181, 253, 0.12)", dotActive: "rgba(221, 214, 254, 0.38)",
        lineMuted: "rgba(167, 139, 250, 0.16)", rayLight: "rgba(245, 243, 255, 0.96)", rayInk: "rgba(9, 5, 16, 0.98)",
        panelTint: "rgba(139, 92, 246, 0.14)", borderActive: "rgba(196, 181, 253, 0.44)", shadowActive: "rgba(109, 40, 217, 0.42)",
      },
      impact: { text: "AUTH!", mode: "subtle" },
    },
    preview: { images: [{ src: "img/KeyManager.png", alt: "KeyManager" }] },
    proofs: [],
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - (1 - value) ** 3;
const easeInCubic = (value) => value ** 3;
const easeInOutQuad = (value) =>
  value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;
const isLocalizedValue = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value) && "zh" in value && "en" in value;

const getStoredLanguage = () => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "en" ? "en" : stored === "zh" ? "zh" : null;
  } catch {
    return null;
  }
};

const storeLanguage = (language) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // ignore storage failures
  }
};

const getCopy = () => LANGUAGE_COPY[currentLanguage];
const getAssistantCopy = () => getCopy().assistant;
const getModalCopy = () => getCopy().modal;

const localizeValue = (value) => {
  if (isLocalizedValue(value)) return value[currentLanguage] ?? value.zh;
  return value;
};

const localizeProjectDetail = (detail) => {
  if (!detail) return null;

  return {
    ...detail,
    title: localizeValue(detail.title),
    type: localizeValue(detail.type),
    frontIntro: localizeValue(detail.frontIntro),
    description: localizeValue(detail.description),
    meta: localizeValue(detail.meta),
    githubNote: localizeValue(detail.githubNote),
    signals: localizeValue(detail.signals) ?? [],
    cover: detail.cover
      ? {
          ...detail.cover,
          logo: detail.cover.logo ? { ...detail.cover.logo } : null,
          impact: detail.cover.impact
            ? {
                ...detail.cover.impact,
                text: localizeValue(detail.cover.impact.text),
              }
            : null,
        }
      : null,
    preview: detail.preview
      ? {
          ...detail.preview,
          label: localizeValue(detail.preview.label),
          title: localizeValue(detail.preview.title),
          note: localizeValue(detail.preview.note),
        }
      : null,
    proofs: Array.isArray(detail.proofs)
      ? detail.proofs.map((proof) => ({
          ...proof,
          title: localizeValue(proof.title),
          description: localizeValue(proof.description),
          alt: localizeValue(proof.alt),
        }))
      : [],
  };
};

const getAssistantStatusKey = (value) => {
  if (!value) return null;

  const statusKeys = ["defaultStatus", "emptyQuestion", "loadingStatus", "followUpStatus", "requestError"];
  for (const language of ["zh", "en"]) {
    for (const key of statusKeys) {
      if (LANGUAGE_COPY[language].assistant[key] === value) {
        return key;
      }
    }
  }

  return null;
};

const applyStaticLanguage = () => {
  const copy = getCopy();

  document.documentElement.lang = copy.htmlLang;

  if (languageToggle) {
    languageToggle.textContent = copy.buttonLabel;
    languageToggle.setAttribute("aria-label", copy.buttonAria);
  }

  if (heroScrollLabel) {
    heroScrollLabel.textContent = copy.heroScroll;
  }

  nameTranslationNodes.forEach((node, index) => {
    const nextText = copy.nameTranslations[index];
    if (nextText) node.textContent = nextText;
    if (nameLetterOverlayNodes[index]) {
      nameLetterOverlayNodes[index].textContent = nextText ?? "";
    }
  });

  if (contactCopy) {
    contactCopy.textContent = copy.contactCopy;
  }

  if (modalProofHeading) {
    modalProofHeading.textContent = copy.modal.proofHeading;
  }

  if (modalProofNote) {
    modalProofNote.textContent = copy.modal.proofNote;
  }
};

const dismissSiteLoader = () => {
  if (!(siteLoader instanceof HTMLElement) || siteLoader.dataset.dismissed === "true") return;

  siteLoader.dataset.dismissed = "true";
  document.body.classList.remove("is-site-loading");
  siteLoader.classList.add("is-loaded");

  window.setTimeout(() => {
    siteLoader.hidden = true;
  }, 620);
};

const applyAssistantLanguage = () => {
  const assistantCopy = getAssistantCopy();
  const activeChip = [...questionChips].find((chip) => chip.classList.contains("is-active"));
  const currentAnswer = answerBox?.textContent?.trim() ?? "";
  const currentStatus = askStatus?.textContent?.trim() ?? "";

  questionChips.forEach((chip, index) => {
    const question = assistantCopy.questions[index];
    if (!question) return;
    chip.textContent = question.label;
    chip.dataset.answer = question.answer;
  });

  if (askInput) {
    askInput.placeholder = assistantCopy.placeholder;
  }

  aboutFactBodies.forEach((node, index) => {
    const nextText = assistantCopy.facts[index];
    if (nextText) node.textContent = nextText;
  });

  if (answerBox) {
    if (answerBox.classList.contains("is-loading") && pendingAssistantQuestion) {
      answerBox.textContent = assistantCopy.loadingAnswer(pendingAssistantQuestion);
    } else if (activeChip?.dataset.answer) {
      answerBox.textContent = activeChip.dataset.answer;
    } else if (
      !currentAnswer ||
      currentAnswer === LANGUAGE_COPY.zh.assistant.defaultAnswer ||
      currentAnswer === LANGUAGE_COPY.en.assistant.defaultAnswer
    ) {
      answerBox.textContent = assistantCopy.defaultAnswer;
    }
  }

  if (askStatus) {
    const statusKey = getAssistantStatusKey(currentStatus);
    askStatus.textContent = statusKey ? assistantCopy[statusKey] : assistantCopy.defaultStatus;
  }
};

const applySecondaryProjectLanguage = () => {
  const projectCopy = getCopy().secondaryProjects;

  projectButtons.forEach((button) => {
    const detail = projectCopy[button.dataset.domain ?? ""];
    if (!detail) return;

    button.dataset.description = detail.description;
    button.dataset.meta = detail.meta;

    const intro = button.querySelector("p");
    if (intro) intro.textContent = detail.intro;
  });
};

const applyLanguage = (language, { persist = true } = {}) => {
  currentLanguage = language === "en" ? "en" : "zh";
  if (persist) {
    storeLanguage(currentLanguage);
  }

  applyStaticLanguage();
  applyAssistantLanguage();
  applySecondaryProjectLanguage();
  hydrateProjectCards();

  if (activeProjectButton) {
    activeProjectData = getProjectDetail(activeProjectButton);
    populateModalContent(activeProjectData);
    const currentModalCard = modalFront?.querySelector(".project-card__button");
    syncModalCardScene(activeProjectButton, {
      scene: currentModalCard?.classList.contains("is-active-scene") ? "active" : "idle",
    });
  }
};

const setupHeroPeelPath = () => {
  if (!heroPeel || !heroPeelElement) return;

  heroPeel.setupDimensions();

  const width = heroPeelElement.offsetWidth;
  const height = heroPeelElement.offsetHeight;

  heroPeel.setPeelPath(
    width,
    height,
    width * 0.992,
    height * 0.972,
    width * 0.62,
    height * 0.28,
    width * -0.22,
    height * -0.26,
  );

  heroPeel.setTimeAlongPath(heroPeelTime);
};

const setupHeroPeel = () => {
  if (!heroPeelElement || typeof window.Peel !== "function" || heroPeel) return;

  heroPeel = new window.Peel(heroPeelElement, {
    corner: window.Peel.Corners.BOTTOM_RIGHT,
    setPeelOnInit: false,
    topShadowBlur: 8,
    topShadowAlpha: 0.22,
    topShadowOffsetX: 1,
    topShadowOffsetY: 2,
    backReflection: false,
    backShadowAlpha: 0.16,
    backShadowSize: 0.04,
    bottomShadowDarkAlpha: 0.22,
    bottomShadowLightAlpha: 0.06,
  });

  heroPeel.setFadeThreshold(1.01);
  setupHeroPeelPath();
  heroPeel.setTimeAlongPath(0);
};

const normalizeProjectUrl = (value) => {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const getProjectDetail = (button) => {
  const projectId = button.dataset.projectId;
  const projectDetail = projectId ? PROJECT_DETAILS[projectId] : null;

  if (projectDetail) return localizeProjectDetail(projectDetail);

  const title =
    button.dataset.title ??
    button.querySelector("strong")?.textContent?.trim() ??
    "Project";
  const type =
    button.dataset.type ??
    button.querySelector(".project-card__type")?.textContent?.trim() ??
    "Project Type";
  const frontIntro = button.querySelector("p")?.textContent?.trim() ?? "";
  const linkLabel = button.dataset.domain ?? "";

  return {
    title,
    type,
    link: normalizeProjectUrl(linkLabel),
    linkLabel,
    frontIntro,
    description: button.dataset.description ?? frontIntro,
    meta: button.dataset.meta ?? "",
    signals: [],
    preview: { images: [] },
    proofs: [],
  };
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sanitizeClassToken = (value = "") => String(value).replace(/[^a-z0-9_-]/gi, "");

const getProjectCardIndexLabel = (button) =>
  button.dataset.projectIndex ??
  button.querySelector(".project-card__index")?.textContent?.trim() ??
  "";

const applyProjectCoverTheme = (button, cover) => {
  const theme = cover?.theme ?? {};
  const styleEntries = [
    ["--cover-logo-asset", cover?.logo?.asset ? `url("${BASE}${cover.logo.asset}")` : ""],
    ["--cover-art-asset", cover?.art?.asset ? `url("${BASE}${cover.art.asset}")` : ""],
    ["--card-hover-image", (cover?.art?.asset || cover?.logo?.asset) ? `url("${BASE}${cover.art?.asset || cover.logo?.asset}")` : ""],
    ["--cover-origin-x", theme.originX],
    ["--cover-origin-y", theme.originY],
    ["--cover-logo-muted", theme.logoMuted],
    ["--cover-logo-active", theme.logoActive],
    ["--cover-logo-glow", theme.logoGlow],
    ["--cover-burst-accent", theme.burstAccent],
    ["--cover-burst-soft", theme.burstSoft],
    ["--cover-dot-muted", theme.dotMuted],
    ["--cover-dot-active", theme.dotActive],
    ["--cover-line-muted", theme.lineMuted],
    ["--cover-ray-light", theme.rayLight],
    ["--cover-ray-ink", theme.rayInk],
    ["--cover-panel-tint", theme.panelTint],
    ["--cover-accent", theme.accent],
    ["--cover-accent-soft", theme.accentSoft],
    ["--cover-ink-soft", theme.inkSoft],
    ["--cover-ink-strong", theme.inkStrong],
    ["--cover-line-soft", theme.lineSoft],
    ["--cover-line-strong", theme.lineStrong],
    ["--cover-net-line", theme.netLine],
    ["--cover-speedline-light", theme.speedlineLight],
    ["--cover-speedline-dark", theme.speedlineDark],
    ["--cover-border-active", theme.borderActive],
    ["--cover-shadow-active", theme.shadowActive],
  ];

  styleEntries.forEach(([property, value]) => {
    if (value) {
      button.style.setProperty(property, value);
    } else {
      button.style.removeProperty(property);
    }
  });
};

const buildLogoBurstCardMarkup = ({ indexLabel, detail, cover }) => {
  const impactText = cover?.impact?.text ?? "";
  const impactMode = sanitizeClassToken(cover?.impact?.mode);
  const impactClass = impactMode ? ` project-card__impact--${impactMode}` : "";
  const logoMarkStyle = cover?.logo?.asset
    ? ` style="--cover-logo-asset: url('${BASE}${cover.logo.asset}')"`
    : "";

  return `
    <span class="project-card__cover" aria-hidden="true">
      <span class="project-card__cover-panel"></span>
      <span class="project-card__cover-burst"></span>
      <span class="project-card__cover-dots"></span>
      <span class="project-card__cover-rays"></span>
      <span class="project-card__cover-bubble"></span>
      <span class="project-card__cover-fragments"></span>
      <span class="project-card__logo">
        <span class="project-card__logo-mark"${logoMarkStyle}></span>
      </span>
    </span>
    <span class="project-card__impact${impactClass}" aria-hidden="true">${escapeHtml(impactText)}</span>
    <span class="project-card__copy">
      <span class="project-card__index">${escapeHtml(indexLabel)}</span>
      <strong>${escapeHtml(detail.title)}</strong>
      <span class="project-card__type">${escapeHtml(detail.type)}</span>
      <p>${escapeHtml(detail.frontIntro)}</p>
    </span>
  `;
};

const buildFootballInkCardMarkup = ({ indexLabel, detail, cover }) => {
  const impactText = cover?.impact?.text ?? "";
  const impactMode = sanitizeClassToken(cover?.impact?.mode);
  const impactClass = impactMode ? ` project-card__impact--${impactMode}` : "";

  return `
    <span class="project-card__cover" aria-hidden="true">
      <span class="project-card__cover-panel"></span>
      <span class="project-card__cover-dots"></span>
      <span class="project-card__cover-rays"></span>
      <span class="project-card__cover-goal"></span>
      <span class="project-card__cover-net"></span>
      <span class="project-card__cover-burst"></span>
      <span class="project-card__cover-shot"></span>
      <span class="project-card__cover-ball"></span>
      <span class="project-card__cover-fragments"></span>
      <span class="project-card__logo">
        <span class="project-card__logo-mark"></span>
      </span>
    </span>
    <span class="project-card__impact${impactClass}" aria-hidden="true">${escapeHtml(impactText)}</span>
    <span class="project-card__copy">
      <span class="project-card__index">${escapeHtml(indexLabel)}</span>
      <strong>${escapeHtml(detail.title)}</strong>
      <span class="project-card__type">${escapeHtml(detail.type)}</span>
      <p>${escapeHtml(detail.frontIntro)}</p>
    </span>
  `;
};

const resetProjectCardVariants = (button) => {
  button.classList.remove(
    "project-card__button--pow",
    "project-card__button--bang",
    "project-card__button--crash",
    "project-card__button--wham",
    "project-card__button--logo-burst",
    "project-card__button--bugpet-pixel",
    "project-card__button--football-ink",
    "project-card__button--scriptmind-wave",
  );
};

const renderProjectCardCover = (button, localizedDetail) => {
  const cover = localizedDetail.cover;
  if (!cover?.profile) return false;

  if (cover.profile === "logo-burst") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--logo-burst");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildLogoBurstCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  if (cover.profile === "football-ink") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--football-ink");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildFootballInkCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  if (cover.profile === "scriptmind-wave") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--logo-burst", "project-card__button--scriptmind-wave");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildLogoBurstCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  if (cover.profile === "bugpet-pixel") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--logo-burst", "project-card__button--bugpet-pixel");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildLogoBurstCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  return false;
};

const hydrateProjectCards = () => {
  projectButtons.forEach((button) => {
    const projectId = button.dataset.projectId;
    const projectDetail = projectId ? PROJECT_DETAILS[projectId] : null;
    if (!projectDetail) return;

    const localizedDetail = localizeProjectDetail(projectDetail);

    if (renderProjectCardCover(button, localizedDetail)) {
      button.setAttribute(
        "aria-label",
        currentLanguage === "zh"
          ? `${localizedDetail.title}，${localizedDetail.type}`
          : `${localizedDetail.title}, ${localizedDetail.type}`,
      );
      return;
    }

    const title = button.querySelector("strong");
    const type = button.querySelector(".project-card__type");
    const intro = button.querySelector("p");

    if (title) title.textContent = localizedDetail.title;
    if (type) type.textContent = localizedDetail.type;
    if (intro) intro.textContent = localizedDetail.frontIntro;
    button.setAttribute(
      "aria-label",
      currentLanguage === "zh"
        ? `${localizedDetail.title}，${localizedDetail.type}`
        : `${localizedDetail.title}, ${localizedDetail.type}`,
    );
  });
};

const getToolBadgeNumber = (badge) => {
  const badgeClass = [...badge.classList].find((className) => /^tool-badge--\d+$/.test(className));
  return badgeClass ? Number.parseInt(badgeClass.replace("tool-badge--", ""), 10) : null;
};

const initializeSkillBadges = () => {
  if (skillBadges.length === 0) return;

  const badgeOrder = new Map(SKILL_BADGE_SEQUENCE.map((badgeNumber, index) => [badgeNumber, index]));

  skillBadges.forEach((badge, fallbackIndex) => {
    const badgeNumber = getToolBadgeNumber(badge) ?? fallbackIndex + 1;
    const order = badgeOrder.get(badgeNumber) ?? fallbackIndex;
    const angle = (order / Math.max(skillBadges.length, 1)) * Math.PI * 2 - Math.PI * 0.56;
    const enterRadius = 14 + (order % 4) * 3.2;
    const driftRadius = 3.4 + (order % 3) * 1.45;
    const enterX = Math.cos(angle) * enterRadius;
    const enterY = Math.sin(angle) * enterRadius + 18;
    const enterRotate = ((order % 2 === 0 ? -1 : 1) * (4 + (order % 4) * 1.2));
    const driftX = Math.cos(angle + Math.PI / 3) * driftRadius;
    const driftY = -5.4 - (order % 4) * 1.15;
    const driftRotate = ((badgeNumber % 2 === 0 ? 1 : -1) * (0.38 + (order % 3) * 0.12));
    const driftScale = 0.009 + (order % 4) * 0.002;
    const floatDuration = 8.6 + (order % 5) * 0.8;
    const floatDelay = order * -0.53;

    badge.style.setProperty("--badge-order", String(order));
    badge.style.setProperty("--badge-enter-x", `${enterX.toFixed(2)}px`);
    badge.style.setProperty("--badge-enter-y", `${enterY.toFixed(2)}px`);
    badge.style.setProperty("--badge-enter-rotate", `${enterRotate.toFixed(2)}deg`);
    badge.style.setProperty("--badge-drift-x", `${driftX.toFixed(2)}px`);
    badge.style.setProperty("--badge-drift-y", `${driftY.toFixed(2)}px`);
    badge.style.setProperty("--badge-drift-rotate", `${driftRotate.toFixed(2)}deg`);
    badge.style.setProperty("--badge-drift-scale", driftScale.toFixed(4));
    badge.style.setProperty("--badge-float-duration", `${floatDuration.toFixed(2)}s`);
    badge.style.setProperty("--badge-float-delay", `${floatDelay.toFixed(2)}s`);
    badge.style.setProperty("--badge-pop", "0");
    badge.style.setProperty("--badge-float", "0");
    badge.style.setProperty("--badge-burst-y", "0px");
    badge.style.setProperty("--badge-burst-scale", "0");
    badge.style.setProperty("--badge-burst-rotate", "0deg");
  });
};

const setTopbarMenuState = (isOpen) => {
  if (!topbar || !topbarToggle) return;
  topbar.classList.toggle("is-open", isOpen);
  topbarToggle.setAttribute("aria-expanded", String(isOpen));
};

const trimContactIconBackground = () => {
  if (!(contactIcon instanceof HTMLImageElement) || contactIcon.dataset.trimmed === "true") return;

  const applyTrim = () => {
    if (!contactIcon.naturalWidth || !contactIcon.naturalHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = contactIcon.naturalWidth;
    canvas.height = contactIcon.naturalHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(contactIcon, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const brightness = (red + green + blue) / 3;
      const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);

      if (brightness > 247 && saturation < 22) {
        data[index + 3] = 0;
      } else if (brightness > 232 && saturation < 38) {
        const softness = (247 - brightness) / 15;
        data[index + 3] = Math.min(data[index + 3], Math.round(Math.max(softness, 0) * 255));
      }
    }

    context.putImageData(imageData, 0, 0);
    contactIcon.dataset.trimmed = "true";
    contactIcon.src = canvas.toDataURL("image/png");
  };

  if (contactIcon.complete) {
    applyTrim();
  } else {
    contactIcon.addEventListener("load", applyTrim, { once: true });
  }
};

const fallbackCopyText = (value) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.inset = "0 auto auto 0";
  document.body.append(textarea);
  textarea.select();

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch (_error) {
    copied = false;
  }

  textarea.remove();
  return copied;
};

const copyTextToClipboard = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      return fallbackCopyText(value);
    }
  }

  return fallbackCopyText(value);
};

const setCopyFeedbackState = (button, state) => {
  button.classList.remove("is-copied", "is-copy-failed");

  const existingTimer = copyFeedbackTimers.get(button);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  if (!state) return;

  button.classList.add(state);
  button.dataset.copyStatus = "COPIED";

  const resetTimer = window.setTimeout(() => {
    button.classList.remove("is-copied", "is-copy-failed");
    button.dataset.copyStatus = "COPIED";
    copyFeedbackTimers.delete(button);
  }, 1400);

  copyFeedbackTimers.set(button, resetTimer);
};

const initializeContactCopyButtons = () => {
  copyContactButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const copyValue = button.dataset.copyValue?.trim();
      if (!copyValue) return;

      const copied = await copyTextToClipboard(copyValue);
      setCopyFeedbackState(button, copied ? "is-copied" : "is-copy-failed");
    });
  });
};

const updateHeroProgress = () => {
  if (!heroSection) return;

  const rect = heroSection.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  const progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
  const liftProgress = easeOutCubic(clamp((progress - 0.018) / 0.18, 0, 1));
  const peelIntro = easeOutCubic(clamp(progress / 0.06, 0, 1));
  const peelBuild = easeInOutQuad(clamp(progress / 0.58, 0, 1));
  const travelProgress = easeInOutQuad(clamp((progress - 0.6) / 0.34, 0, 1));
  const peelProgress = Math.min(0.998, 0.03 * peelIntro + 0.968 * peelBuild);

  document.body.classList.toggle("is-hero-active", progress < 0.92);
  root.style.setProperty("--hero-progress", progress.toFixed(3));
  root.style.setProperty("--hero-lift-progress", liftProgress.toFixed(3));
  root.style.setProperty("--hero-detach-progress", travelProgress.toFixed(3));
  root.style.setProperty("--hero-lift-x", `${liftProgress * -18}px`);
  root.style.setProperty("--hero-lift-y", `${liftProgress * -26}px`);
  root.style.setProperty("--hero-lift-rotate", `${liftProgress * -4.2}deg`);
  root.style.setProperty("--hero-tilt-x", `${travelProgress * 8}deg`);
  root.style.setProperty("--hero-tilt-y", `${travelProgress * -18}deg`);
  root.style.setProperty("--hero-residue-opacity", `${Math.max(travelProgress * 0.78, liftProgress * 0.08)}`);
  root.style.setProperty("--hero-residue-size", `${28 + travelProgress * 168}px`);
  root.style.setProperty("--hero-shadow-opacity", `${0.42 + liftProgress * 0.18 + travelProgress * 0.11}`);
  root.style.setProperty("--hero-shift-x", `${travelProgress * window.innerWidth * -0.82}px`);
  root.style.setProperty("--hero-shift-y", `${travelProgress * window.innerHeight * -0.96}px`);
  root.style.setProperty("--hero-rotate", `${travelProgress * -20}deg`);
  root.style.setProperty("--hero-scale", `${1 + liftProgress * 0.012 - travelProgress * 0.098}`);

  if (heroPeel) {
    heroPeelTime = peelProgress;
    heroPeel.setTimeAlongPath(peelProgress);
  }
};

const updateNameProgress = () => {
  if (!nameSection || nameRows.length === 0) return;

  const rect = nameSection.getBoundingClientRect();
  const total = rect.height - window.innerHeight * 0.45;
  const progress = total > 0 ? clamp((window.innerHeight * 0.2 - rect.top) / total, 0, 1) : 0;

  nameRows.forEach((row, index) => {
    const start = index * 0.12;
    const end = start + 0.26;
    const rowProgress = clamp((progress - start) / (end - start), 0, 1);
    row.style.setProperty("--row-progress", rowProgress.toFixed(3));
  });
};

const updateProjectsProgress = () => {
  if (!projectsSection || !projectGrid || projectCards.length === 0) return;

  const rect = projectGrid.getBoundingClientRect();
  const start = window.innerHeight * 0.92;
  const end = window.innerHeight * 0.24;
  const distance = start - end;
  const sectionProgress = distance > 0 ? clamp((start - rect.top) / distance, 0, 1) : 0;
  const cardFlow = clamp((sectionProgress - 0.05) / 0.82, 0, 1);
  const titleEnter = easeOutCubic(clamp((sectionProgress - 0.02) / 0.17, 0, 1));
  const titleHoldEnd = 0.82;
  const titleExitWindow = 0.1;
  const titleExit = easeOutCubic(clamp((sectionProgress - titleHoldEnd) / titleExitWindow, 0, 1));

  projectsSection.style.setProperty("--projects-progress", sectionProgress.toFixed(3));
  projectsSection.style.setProperty("--projects-title-enter", titleEnter.toFixed(3));
  projectsSection.style.setProperty("--projects-title-exit", titleExit.toFixed(3));

  projectCards.forEach((card, index) => {
    const total = Math.max(projectCards.length, 1);
    const cardStart = 0.04 + (index / total) * 0.35;
    const cardEnd = cardStart + 0.3;
    const cardRaw = clamp((cardFlow - cardStart) / (cardEnd - cardStart), 0, 1);
    const cardProgress = easeInOutQuad(cardRaw);
    card.style.setProperty("--project-pop", cardProgress.toFixed(3));
  });
};

const updateIssueFiveSixTransition = () => {
  if (!projectsSection || !contactSection) return;

  const contactRect = contactSection.getBoundingClientRect();
  const start = window.innerHeight * 0.9;
  const end = window.innerHeight * 0.18;
  const distance = start - end;
  const progress = distance > 0 ? clamp((start - contactRect.top) / distance, 0, 1) : 0;

  root.style.setProperty("--issue-56-progress", progress.toFixed(3));
};

const updateSkillsTransition = () => {
  if (!skillsSection) return;

  const rect = skillsSection.getBoundingClientRect();
  const isPhoneViewport = window.innerWidth <= 560;
  const start = window.innerHeight * 0.99;
  const end = window.innerHeight * -0.12;
  const distance = start - end;
  const progress = distance > 0 ? clamp((start - rect.top) / distance, 0, 1) : 0;

  const titleRaw = clamp((progress - 0.14) / 0.22, 0, 1);
  const webRaw = clamp((progress - (isPhoneViewport ? 0.54 : 0.64)) / (isPhoneViewport ? 0.24 : 0.2), 0, 1);
  const webDensityRaw = clamp(
    (progress - (isPhoneViewport ? 0.62 : 0.74)) / (isPhoneViewport ? 0.18 : 0.14),
    0,
    1,
  );
  const iconsRaw = clamp((progress - (isPhoneViewport ? 0.7 : 0.9)) / (isPhoneViewport ? 0.22 : 0.16), 0, 1);
  const aboutExitRaw = clamp((progress - 0.28) / 0.46, 0, 1);

  const titleProgress = easeInOutQuad(titleRaw);
  const webProgress = easeInOutQuad(webRaw);
  const webDensityProgress = easeInOutQuad(webDensityRaw);
  const iconsProgress = easeInOutQuad(iconsRaw);
  const aboutExitProgress = easeInOutQuad(aboutExitRaw);

  skillsSection.style.setProperty("--skills-progress", progress.toFixed(3));
  skillsSection.style.setProperty("--skills-title-progress", titleProgress.toFixed(3));
  skillsSection.style.setProperty("--skills-web-progress", webProgress.toFixed(3));
  skillsSection.style.setProperty("--skills-web-density-progress", webDensityProgress.toFixed(3));
  skillsSection.style.setProperty("--skills-icons-progress", iconsProgress.toFixed(3));

  if (aboutSection) {
    aboutSection.style.setProperty("--about-exit-progress", aboutExitProgress.toFixed(3));
  }

  skillBadges.forEach((badge) => {
    const badgeNumber = getToolBadgeNumber(badge);
    const order = Number.parseFloat(badge.style.getPropertyValue("--badge-order")) || 0;
    const normalizedOrder = skillBadges.length > 1 ? order / (skillBadges.length - 1) : 0;
    const badgeSpread = isPhoneViewport ? 0.46 : 0.68;
    const badgeWindow = isPhoneViewport ? 0.42 : 0.32;
    const badgeLead = badgeNumber === 12 ? (isPhoneViewport ? 0.16 : 0.18) : 0;
    const badgeStart = Math.max(0, normalizedOrder * badgeSpread - badgeLead);
    const badgeEnd = Math.min(badgeStart + badgeWindow + (badgeNumber === 12 ? 0.08 : 0), 1);
    const badgeRaw = clamp((iconsProgress - badgeStart) / (badgeEnd - badgeStart), 0, 1);
    const badgePopBase = easeOutCubic(clamp((badgeRaw - 0.06) / 0.84, 0, 1));
    const badgePop = badgeNumber === 12 ? Math.max(badgePopBase, iconsProgress * 0.38) : badgePopBase;
    const badgeFloat = easeInOutQuad(clamp((badgeRaw - 0.82) / 0.18, 0, 1));
    const burstEnvelope = Math.sin(badgeRaw * Math.PI);
    const burstLift = burstEnvelope * (1 - badgeRaw * 0.22) * (isPhoneViewport ? 10 : 18);
    const burstScale = burstEnvelope * (isPhoneViewport ? 0.04 : 0.07);
    const burstRotate = burstEnvelope * (order % 2 === 0 ? -1 : 1) * 1.35;

    badge.style.setProperty("--badge-pop", badgePop.toFixed(3));
    badge.style.setProperty("--badge-float", badgeFloat.toFixed(3));
    badge.style.setProperty("--badge-burst-y", `${burstLift.toFixed(2)}px`);
    badge.style.setProperty("--badge-burst-scale", burstScale.toFixed(4));
    badge.style.setProperty("--badge-burst-rotate", `${burstRotate.toFixed(2)}deg`);
  });
};

const updateAboutEntryTransition = () => {
  if (!aboutSection || !aboutHeading || !aboutPanel) {
    root.style.setProperty("--about-enter-progress", "0");
    root.style.setProperty("--about-heading-enter", "0");
    root.style.setProperty("--about-panel-enter", "0");
    return;
  }

  const sectionRect = aboutSection.getBoundingClientRect();
  const headingRect = aboutHeading.getBoundingClientRect();
  const panelRect = aboutPanel.getBoundingClientRect();

  const sectionStart = window.innerHeight * 0.94;
  const sectionEnd = window.innerHeight * 0.44;
  const sectionDistance = sectionStart - sectionEnd;
  const progress =
    sectionDistance > 0 ? clamp((sectionStart - sectionRect.top) / sectionDistance, 0, 1) : 0;

  const headingStart = window.innerHeight * 0.64;
  const headingEnd = window.innerHeight * 0.26;
  const headingDistance = headingStart - headingEnd;
  const headingRaw =
    headingDistance > 0 ? clamp((headingStart - headingRect.top) / headingDistance, 0, 1) : 0;

  const panelStart = window.innerHeight * 0.82;
  const panelEnd = window.innerHeight * 0.34;
  const panelDistance = panelStart - panelEnd;
  const panelRaw =
    panelDistance > 0 ? clamp((panelStart - panelRect.top) / panelDistance, 0, 1) : 0;

  const headingEnter = easeOutCubic(headingRaw);
  const panelEnter = easeOutCubic(panelRaw);

  root.style.setProperty("--about-enter-progress", progress.toFixed(3));
  root.style.setProperty("--about-heading-enter", headingEnter.toFixed(3));
  root.style.setProperty("--about-panel-enter", panelEnter.toFixed(3));
};

const resetIssueProgress = () => {
  issueSections.forEach((section) => section.classList.remove("is-current"));
  document.body.classList.remove("is-skills-active");
  delete document.body.dataset.issue;
  root.style.setProperty("--bridge-progress", "0");
  root.style.setProperty("--accent-opacity", "0.16");
  root.style.setProperty("--thread-opacity", "0.24");
  root.style.setProperty("--section-dim", "0.16");
  root.style.setProperty("--issue-56-progress", "0");
  root.style.setProperty("--about-enter-progress", "0");
  root.style.setProperty("--about-heading-enter", "0");
  root.style.setProperty("--about-panel-enter", "0");
  aboutSection?.style.setProperty("--about-exit-progress", "0");
  skillsSection?.style.setProperty("--skills-progress", "0");
  skillsSection?.style.setProperty("--skills-title-progress", "0");
  skillsSection?.style.setProperty("--skills-web-progress", "0");
  skillsSection?.style.setProperty("--skills-web-density-progress", "0");
  skillsSection?.style.setProperty("--skills-icons-progress", "0");
  skillBadges.forEach((badge) => {
    badge.style.setProperty("--badge-pop", "0");
    badge.style.setProperty("--badge-float", "0");
    badge.style.setProperty("--badge-burst-y", "0px");
    badge.style.setProperty("--badge-burst-scale", "0");
    badge.style.setProperty("--badge-burst-rotate", "0deg");
  });
};

const getIssueFocus = (rect) => {
  const viewportAnchor = window.innerHeight * 0.48;
  const sectionCenter = rect.top + rect.height / 2;
  const distance = Math.abs(sectionCenter - viewportAnchor);
  const maxDistance = window.innerHeight * 0.72 + rect.height * 0.16;
  return clamp(1 - distance / maxDistance, 0, 1);
};

const getIssueProgress = (rect) => {
  const total = rect.height + window.innerHeight * 0.38;
  return total > 0 ? clamp((window.innerHeight * 0.22 - rect.top) / total, 0, 1) : 0;
};

const updateIssueProgress = () => {
  if (issueSections.length === 0) return;

  const candidates = issueSections
    .filter((section) => visibleIssueSections.has(section))
    .map((section) => {
      const rect = section.getBoundingClientRect();
      const focus = getIssueFocus(rect);
      const ratio = issueIntersectionRatios.get(section) ?? 0;
      return {
        section,
        rect,
        focus,
        score: focus * 0.72 + ratio * 0.28,
      };
    });

  if (candidates.length === 0) {
    resetIssueProgress();
    return;
  }

  const activeCandidate = candidates.reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  );

  const activeIssue = activeCandidate.section.dataset.issue ?? "";
  const progress = getIssueProgress(activeCandidate.rect);
  const stage = clamp((Number(activeIssue) - 3) / 3, 0, 1);
  const accentOpacity = clamp(0.24 - stage * 0.1 + Math.sin(progress * Math.PI) * 0.05, 0.08, 0.26);
  const threadOpacity = clamp(0.34 - stage * 0.1 + (1 - progress) * 0.08, 0.12, 0.4);
  const sectionDim = clamp(0.14 + stage * 0.14 + Math.abs(progress - 0.5) * 0.06, 0.14, 0.34);

  issueSections.forEach((section) => {
    section.classList.toggle("is-current", section === activeCandidate.section);
  });

  document.body.dataset.issue = activeIssue;
  document.body.classList.toggle("is-skills-active", activeIssue === "04");
  root.style.setProperty("--bridge-progress", progress.toFixed(3));
  root.style.setProperty("--accent-opacity", accentOpacity.toFixed(3));
  root.style.setProperty("--thread-opacity", threadOpacity.toFixed(3));
  root.style.setProperty("--section-dim", sectionDim.toFixed(3));
};

let ticking = false;

const updateScene = () => {
  ticking = false;
  updateHeroProgress();
  updateNameProgress();
  updateIssueProgress();
  updateAboutEntryTransition();
  updateSkillsTransition();
  updateProjectsProgress();
  updateIssueFiveSixTransition();
};

const requestSceneUpdate = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScene);
};

const issueObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      issueIntersectionRatios.set(entry.target, entry.intersectionRatio);

      if (entry.isIntersecting) {
        visibleIssueSections.add(entry.target);
        entry.target.classList.add("is-visible");
      } else {
        visibleIssueSections.delete(entry.target);
      }
    });

    requestSceneUpdate();
  },
  {
    threshold: [0, 0.16, 0.32, 0.48, 0.64, 0.8],
    rootMargin: "-16% 0px -16% 0px",
  },
);

currentLanguage = getStoredLanguage() ?? "zh";
document.body.classList.toggle("is-low-memory-device", lowMemoryDevice);
initializeSkillBadges();
issueSections.forEach((section) => issueObserver.observe(section));
setupHeroPeel();
applyLanguage(currentLanguage, { persist: false });
updateScene();
trimContactIconBackground();
initializeContactCopyButtons();
window.addEventListener("scroll", requestSceneUpdate, { passive: true });
window.addEventListener("resize", () => {
  setupHeroPeelPath();
  requestSceneUpdate();
});

languageToggle?.addEventListener("click", () => {
  applyLanguage(currentLanguage === "zh" ? "en" : "zh");
});

topbarToggle?.addEventListener("click", () => {
  setTopbarMenuState(!topbar?.classList.contains("is-open"));
});

topbarNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setTopbarMenuState(false);
  });
});

document.addEventListener("click", (event) => {
  if (!topbar?.classList.contains("is-open")) return;
  if (event.target instanceof Node && topbar.contains(event.target)) return;
  setTopbarMenuState(false);
});

const clearQuestionChipState = () => {
  questionChips.forEach((chip) => chip.classList.remove("is-active"));
};

const setAssistantState = ({
  answer,
  status = getAssistantCopy().defaultStatus,
  isLoading = false,
  disableInput = false,
}) => {
  if (answerBox && typeof answer === "string") {
    answerBox.textContent = answer;
    answerBox.classList.toggle("is-loading", isLoading);
  }

  if (askStatus) {
    askStatus.textContent = status;
  }

  if (askInput) {
    askInput.disabled = disableInput;
  }

  if (askSubmit) {
    askSubmit.disabled = disableInput;
  }
};

const askPortfolioAssistant = async (question, fallbackAnswer = getAssistantCopy().defaultAnswer) => {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    setAssistantState({
      answer: fallbackAnswer,
      status: getAssistantCopy().emptyQuestion,
    });
    return;
  }

  const currentRequestId = ++assistantRequestId;
  pendingAssistantQuestion = trimmedQuestion;

  setAssistantState({
    answer: getAssistantCopy().loadingAnswer(trimmedQuestion),
    status: getAssistantCopy().loadingStatus,
    isLoading: true,
    disableInput: true,
  });

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmedQuestion,
        language: currentLanguage,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || getAssistantCopy().requestError);
    }

    if (currentRequestId !== assistantRequestId) return;

    setAssistantState({
      answer: data.answer || fallbackAnswer,
      status: getAssistantCopy().followUpStatus,
    });
  } catch (error) {
    if (currentRequestId !== assistantRequestId) return;

    setAssistantState({
      answer: fallbackAnswer,
      status: error instanceof Error ? getAssistantCopy().requestError : getAssistantCopy().requestError,
    });
  } finally {
    if (currentRequestId === assistantRequestId) {
      pendingAssistantQuestion = "";
      setAssistantState({
        answer: answerBox?.textContent?.trim() ?? fallbackAnswer,
        status: askStatus?.textContent?.trim() ?? getAssistantCopy().defaultStatus,
        disableInput: false,
      });
    }
  }
};

questionChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    clearQuestionChipState();
    chip.classList.add("is-active");
    setAssistantState({
      answer: chip.dataset.answer ?? getAssistantCopy().defaultAnswer,
      status: getAssistantCopy().defaultStatus,
    });
  });
});

askForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const question = askInput?.value?.trim() ?? "";
  if (!question) {
    setAssistantState({
      answer: getAssistantCopy().defaultAnswer,
      status: getAssistantCopy().emptyQuestion,
    });
    askInput?.focus();
    return;
  }

  clearQuestionChipState();
  void askPortfolioAssistant(question);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px",
  },
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 70, 210)}ms`;
  revealObserver.observe(item);
});

const getCenteredRect = () => {
  const maxWidth = Math.min(window.innerWidth - 32, 560);
  const maxHeight = Math.min(window.innerHeight - 24, 820);
  const width = Math.min(maxWidth, maxHeight * 0.68);
  const height = Math.min(maxHeight, width / 0.68);

  return {
    top: (window.innerHeight - height) / 2,
    left: (window.innerWidth - width) / 2,
    width,
    height,
  };
};

const applyPanelRect = (rect) => {
  if (!modalPanel) return;
  modalPanel.style.top = `${rect.top}px`;
  modalPanel.style.left = `${rect.left}px`;
  modalPanel.style.width = `${rect.width}px`;
  modalPanel.style.height = `${rect.height}px`;
};

const applyPanelTransform = ({ x = 0, y = 0, scaleX = 1, scaleY = 1 }) => {
  if (!modalPanel) return;
  modalPanel.style.setProperty("--panel-x", `${x}px`);
  modalPanel.style.setProperty("--panel-y", `${y}px`);
  modalPanel.style.setProperty("--panel-scale-x", `${scaleX}`);
  modalPanel.style.setProperty("--panel-scale-y", `${scaleY}`);
};

const getTransformFromRect = (fromRect, toRect) => {
  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRect.left + toRect.width / 2;
  const toCenterY = toRect.top + toRect.height / 2;

  return {
    x: fromCenterX - toCenterX,
    y: fromCenterY - toCenterY,
    scaleX: fromRect.width / toRect.width,
    scaleY: fromRect.height / toRect.height,
  };
};

const getTransformString = ({ x = 0, y = 0, scaleX = 1, scaleY = 1 }) =>
  `translate3d(${x}px, ${y}px, 0) scale(${scaleX}, ${scaleY})`;

const cancelCollapseAnimation = () => {
  if (!collapseAnimation) return;
  collapseAnimation.cancel();
  collapseAnimation = null;
};

const clearModalTimers = () => {
  clearTimeout(closeTimer);
  clearTimeout(closeStageTimer);
  clearTimeout(flipTimer);
  cancelCollapseAnimation();
};

const setProjectCardScene = (element, scene = "idle") => {
  if (!(element instanceof HTMLElement)) return;

  element.classList.remove("is-hovered", "is-active-scene", "is-returning");

  if (scene === "hovered") {
    element.classList.add("is-hovered");
  }

  if (scene === "active") {
    element.classList.add("is-active-scene");
  }
};

const setModalCardScene = (scene = "idle") => {
  const modalCards = [
    modalFront?.querySelector(".project-card__button"),
    modalMirror?.querySelector(".project-card__button"),
  ];

  modalCards.forEach((card) => setProjectCardScene(card, scene));
};

const syncHoveredProjectCard = () => {
  if (!lastPointerPosition) return;

  if (projectModal && !projectModal.hidden && projectModal.classList.contains("is-visible")) {
    projectButtons.forEach((button) => {
      if (!button.classList.contains("is-source-hidden")) {
        setProjectCardScene(button, "idle");
      }
    });
    return;
  }

  const hoveredElement = document.elementFromPoint(
    lastPointerPosition.clientX,
    lastPointerPosition.clientY,
  );
  const hoveredButton = hoveredElement?.closest?.(".project-card__button");

  projectButtons.forEach((button) => {
    const isInteractive =
      !button.classList.contains("is-hover-suppressed") &&
      !button.classList.contains("is-source-hidden");

    if (isInteractive && button === hoveredButton) {
      setProjectCardScene(button, "hovered");
      return;
    }

    setProjectCardScene(button, "idle");
  });
};

const updatePointerPosition = (event) => {
  lastPointerPosition = { clientX: event.clientX, clientY: event.clientY };
};

const releaseSuppressedProjectHover = () => {
  suppressedHoverButton?.classList.remove("is-hover-suppressed");
  suppressedHoverButton = null;
};

const isPointerOutsideElement = (element) => {
  if (!(element instanceof HTMLElement) || !lastPointerPosition) return true;

  const { clientX, clientY } = lastPointerPosition;
  const rect = element.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
};

const queueSuppressedProjectHoverRelease = () => {
  requestAnimationFrame(() => {
    if (!suppressedHoverButton || isPointerOutsideElement(suppressedHoverButton)) {
      releaseSuppressedProjectHover();
    }
  });
};

const suppressProjectHover = (button) => {
  releaseSuppressedProjectHover();
  if (!(button instanceof HTMLElement)) return;

  suppressedHoverButton = button;
  suppressedHoverButton.classList.add("is-hover-suppressed");
};

const getProjectCardCloneMarkup = (button, { extraClasses = "", stripped = false, scene = "active" } = {}) => {
  const variantClasses = [...button.classList].filter((className) =>
    className.startsWith("project-card__button--"),
  );
  const cloneClasses = [
    "project-card__button",
    ...variantClasses,
    "project-card__button--modal",
    scene === "hovered" ? "is-hovered" : "",
    scene === "active" ? "is-active-scene" : "",
    extraClasses,
  ]
    .filter(Boolean)
    .join(" ");

  const clone = document.createElement("div");
  clone.className = cloneClasses;
  clone.setAttribute("aria-hidden", "true");
  if (button.dataset.projectId) clone.dataset.projectId = button.dataset.projectId;
  if (button.dataset.coverProfile) clone.dataset.coverProfile = button.dataset.coverProfile;
  if (button.getAttribute("style")) clone.setAttribute("style", button.getAttribute("style"));
  clone.innerHTML = button.innerHTML;

  if (stripped) {
    clone
      .querySelectorAll(
        ".project-card__copy, .project-card__impact, .project-card__logo, .project-card__index, strong, .project-card__type, p",
      )
      .forEach((element) => element.remove());

    const echoPanel = document.createElement("span");
    echoPanel.className = "project-modal__echo-panel";
    const echoLines = document.createElement("span");
    echoLines.className = "project-modal__echo-lines";
    clone.append(echoPanel, echoLines);
  }

  return clone.outerHTML;
};

const syncModalCardScene = (button, { scene = "active" } = {}) => {
  if (!modalFront || !modalMirror) return;

  modalFront.innerHTML = getProjectCardCloneMarkup(button, {
    extraClasses: "project-modal__card",
    scene,
  });
  modalMirror.innerHTML = getProjectCardCloneMarkup(button, {
    extraClasses: "project-modal__card project-modal__card--echo",
    stripped: true,
    scene,
  });
};

const clearModalCardScene = () => {
  if (modalFront) modalFront.innerHTML = "";
  if (modalMirror) modalMirror.innerHTML = "";
};

const clearModalProjectContent = () => {
  const previewVideo = modalPreview?.querySelector("video");
  if (previewVideo instanceof HTMLVideoElement) {
    previewVideo.pause();
    previewVideo.removeAttribute("src");
    previewVideo.querySelectorAll("source").forEach((source) => source.remove());
    previewVideo.load();
  }

  if (modalSignals) modalSignals.replaceChildren();
  if (modalPreview) modalPreview.replaceChildren();
  if (modalProofs) modalProofs.replaceChildren();
  if (modalProofTrigger) {
    modalProofTrigger.hidden = true;
    modalProofTrigger.textContent = getModalCopy().proofTrigger;
  }
  closeProofSheet();
};

const renderProjectSignals = (signals = []) => {
  if (!modalSignals) return;

  modalSignals.replaceChildren();
  modalSignals.hidden = signals.length === 0;

  signals.forEach((signal) => {
    const chip = document.createElement("span");
    chip.className = "project-modal__signal";
    chip.textContent = signal;
    modalSignals.append(chip);
  });
};

const createPreviewMedia = (preview) => {
  const hasVideo = Boolean(preview?.videoSrc);
  const mediaWrapper = hasVideo ? document.createElement("button") : document.createElement("div");
  mediaWrapper.className = "project-modal__preview-frame";

  if (hasVideo) {
    mediaWrapper.type = "button";
    mediaWrapper.classList.add("project-modal__preview-frame--interactive");
    mediaWrapper.dataset.previewPlay = "true";
    mediaWrapper.dataset.videoSrc = preview.videoSrc ?? "";
    mediaWrapper.dataset.videoType = preview.videoType ?? "video/mp4";
    mediaWrapper.setAttribute(
      "aria-label",
      getModalCopy().previewAria(preview.title ?? getModalCopy().previewVideoTitle),
    );
  } else {
    mediaWrapper.classList.add("project-modal__preview-frame--pending");
  }

  if (preview?.poster) {
    const poster = document.createElement("img");
    poster.className = "project-modal__preview-poster";
    poster.src = preview.poster;
    poster.alt = preview.label ?? "";
    poster.loading = "lazy";
    mediaWrapper.append(poster);
  }

  const overlay = document.createElement("div");
  overlay.className = "project-modal__preview-overlay";

  const badge = document.createElement("span");
  badge.className = "project-modal__preview-badge";
  badge.textContent = hasVideo ? getModalCopy().previewPlay : getModalCopy().previewPending;

  const play = document.createElement("span");
  play.className = "project-modal__preview-play";
  play.setAttribute("aria-hidden", "true");
  play.textContent = hasVideo ? "▶" : "•";

  const copy = document.createElement("div");
  copy.className = "project-modal__preview-copy";

  const title = document.createElement("strong");
  title.className = "project-modal__preview-title";
  title.textContent = preview?.title ?? getModalCopy().previewTitle;

  const note = document.createElement("p");
  note.className = "project-modal__preview-note";
  note.textContent = preview?.note ?? getModalCopy().previewNote;

  copy.append(title, note);
  overlay.append(badge, play, copy);
  mediaWrapper.append(overlay);

  return mediaWrapper;
};

const renderProjectGallery = (images) => {
  const gallery = document.createElement("div");
  gallery.className = "project-modal__gallery";

  const track = document.createElement("div");
  track.className = "project-modal__gallery-track";

  if (images.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "project-modal__gallery-placeholder";
    const icon = document.createElement("span");
    icon.className = "project-modal__gallery-placeholder-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🖼";
    const label = document.createElement("span");
    label.textContent = getModalCopy().galleryPending;
    placeholder.append(icon, label);
    track.append(placeholder);
    gallery.append(track);
    return gallery;
  }

  images.forEach(({ src, alt = "" }) => {
    const slide = document.createElement("div");
    slide.className = "project-modal__gallery-slide";
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    slide.append(img);
    track.append(slide);
  });

  const btnPrev = document.createElement("button");
  btnPrev.type = "button";
  btnPrev.className = "project-modal__gallery-arrow project-modal__gallery-arrow--prev";
  btnPrev.setAttribute("aria-label", "Immagine precedente");
  btnPrev.textContent = "‹";

  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.className = "project-modal__gallery-arrow project-modal__gallery-arrow--next";
  btnNext.setAttribute("aria-label", "Immagine successiva");
  btnNext.textContent = "›";

  const dotsEl = document.createElement("div");
  dotsEl.className = "project-modal__gallery-dots";
  const dots = images.map((_, i) => {
    const d = document.createElement("span");
    d.className = "project-modal__gallery-dot" + (i === 0 ? " is-active" : "");
    dotsEl.append(d);
    return d;
  });

  let current = 0;
  const goTo = (index) => {
    current = Math.max(0, Math.min(images.length - 1, index));
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
    btnPrev.disabled = current === 0;
    btnNext.disabled = current === images.length - 1;
  };

  btnPrev.addEventListener("click", () => goTo(current - 1));
  btnNext.addEventListener("click", () => goTo(current + 1));

  gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(current - 1);
    else if (e.key === "ArrowRight") goTo(current + 1);
  });

  goTo(0);
  gallery.append(track, btnPrev, btnNext, dotsEl);
  return gallery;
};

const renderProjectPreview = (projectDetail) => {
  if (!modalPreview) return;

  modalPreview.replaceChildren();
  const preview = projectDetail.preview ?? {};
  const images = Array.isArray(preview.images) ? preview.images : [];

  modalPreview.append(renderProjectGallery(images));
};

const renderProjectProofs = (proofs = []) => {
  if (!modalProofs) return;

  modalProofs.replaceChildren();

  proofs.forEach((proof) => {
    const figure = document.createElement("figure");
    figure.className = "project-modal__proof";

    const image = document.createElement("img");
    image.className = "project-modal__proof-image";
    image.src = proof.src;
    image.alt = proof.alt ?? proof.title;
    image.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.className = "project-modal__proof-copy";

    const kicker = document.createElement("span");
    kicker.className = "project-modal__proof-kicker";
    kicker.textContent = "Real Signal";

    const title = document.createElement("strong");
    title.className = "project-modal__proof-title";
    title.textContent = proof.title;

    const description = document.createElement("p");
    description.className = "project-modal__proof-description";
    description.textContent = proof.description;

    caption.append(kicker, title, description);
    figure.append(image, caption);
    modalProofs.append(figure);
  });
};

const openProofSheet = () => {
  if (!modalProofSheet) return;
  modalProofSheet.hidden = false;
  projectModal?.classList.add("is-proof-open");
};

const closeProofSheet = () => {
  projectModal?.classList.remove("is-proof-open");
  if (modalProofSheet) modalProofSheet.hidden = true;
};

const renderProjectProofTrigger = (proofs = []) => {
  if (!modalProofTrigger) return;

  const hasProofs = proofs.length > 0;
  modalProofTrigger.hidden = !hasProofs;
  modalProofTrigger.textContent = hasProofs
    ? getModalCopy().proofTriggerWithCount(proofs.length)
    : getModalCopy().proofTrigger;
};

const populateModalContent = (projectDetail) => {
  if (modalTitle) modalTitle.textContent = projectDetail.title ?? "Project";
  if (modalType) modalType.textContent = projectDetail.type ?? "Project Type";
  if (modalDescription) {
    modalDescription.innerHTML = projectDetail.description ?? projectDetail.frontIntro ?? "";
  }

  renderProjectSignals(projectDetail.signals ?? []);
  renderProjectPreview(projectDetail);
  renderProjectProofs(projectDetail.proofs ?? []);
  renderProjectProofTrigger(projectDetail.proofs ?? []);

  if (modalDomain) {
    const href = projectDetail.link ?? "";
    modalDomain.textContent = projectDetail.linkLabel ?? href;
    modalDomain.href = href || "#";
    modalDomain.hidden = !href;
  }

  if (modalGithub) {
    const href = projectDetail.githubLink ?? "";
    modalGithub.textContent = projectDetail.githubLabel ?? "GitHub";
    modalGithub.href = href || "#";
    modalGithub.hidden = !href;
  }

  if (modalGithubNote) {
    const note = projectDetail.githubNote ?? "";
    modalGithubNote.textContent = note;
    modalGithubNote.hidden = !note.trim();
  }

  if (modalMeta) {
    modalMeta.textContent = projectDetail.meta ?? "";
    modalMeta.hidden = !(projectDetail.meta ?? "").trim();
  }
};

const lockBodyScroll = () => {
  const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = scrollbarGap > 0 ? `${scrollbarGap}px` : "";
};

const unlockBodyScroll = () => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
};

const openModal = (button) => {
  if (!projectModal || !modalPanel || !modalFront) return;

  releaseSuppressedProjectHover();

  const projectDetail = getProjectDetail(button);
  const startRect = button.getBoundingClientRect();
  const centeredRect = getCenteredRect();

  activeProjectData = projectDetail;
  populateModalContent(projectDetail);
  syncModalCardScene(button, { scene: "active" });
  projectButtons.forEach((item) => {
    setProjectCardScene(item, "idle");
    item.classList.remove("is-source-hidden");
  });

  activeProjectButton = button;
  clearModalTimers();
  setProjectCardScene(button, "idle");
  button.classList.add("is-source-hidden");

  projectModal.hidden = false;
  projectModal.classList.remove("is-closing");
  projectModal.classList.remove("is-collapsing");
  projectModal.classList.remove("is-open");
  applyPanelRect(centeredRect);
  applyPanelTransform({});
  projectModal.classList.add("is-visible");
  lockBodyScroll();
  cancelCollapseAnimation();
  const isPhoneViewport = window.innerWidth <= 560;
  const mobileOpenDelay = isPhoneViewport ? 520 : FLIP_DELAY_MS;
  collapseAnimation = modalPanel.animate(
    [
      {
        transform: getTransformString(getTransformFromRect(startRect, centeredRect)),
        opacity: 1,
      },
      {
        transform: getTransformString({}),
        opacity: 1,
      },
    ],
    {
      duration: PANEL_TRANSITION_MS,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  );
  collapseAnimation.onfinish = () => {
    collapseAnimation = null;
  };
  collapseAnimation.oncancel = () => {
    collapseAnimation = null;
  };
  flipTimer = window.setTimeout(() => {
    projectModal.classList.add("is-open");
  }, mobileOpenDelay);
};

const closeModal = () => {
  if (!projectModal || !modalPanel) return;

  clearModalTimers();
  closeProofSheet();
  if (activeProjectButton) {
    suppressProjectHover(activeProjectButton);
    activeProjectButton.blur();
    setProjectCardScene(activeProjectButton, "idle");
    activeProjectButton.classList.add("is-source-hidden");
  }
  projectModal.classList.add("is-closing");
  projectModal.classList.remove("is-collapsing");
  projectModal.classList.remove("is-open");
  const centeredRect = getCenteredRect();
  applyPanelRect(centeredRect);
  applyPanelTransform({});

  closeStageTimer = window.setTimeout(() => {
    const targetRect = activeProjectButton?.getBoundingClientRect();
    if (!targetRect || !projectModal?.classList.contains("is-visible")) return;
    const currentRect = modalPanel.getBoundingClientRect();
    const fromTransform = getTransformFromRect(currentRect, targetRect);

    projectModal.classList.add("is-collapsing");
    setModalCardScene("idle");
    cancelCollapseAnimation();
    applyPanelRect(targetRect);
    applyPanelTransform({});
    collapseAnimation = modalPanel.animate(
      [
        {
          transform: getTransformString(fromTransform),
          opacity: 1,
        },
        {
          transform: getTransformString({}),
          opacity: 1,
        },
      ],
      {
        duration: CLOSE_COLLAPSE_MS,
        easing: "cubic-bezier(0.28, 0.2, 0.18, 1)",
        fill: "both",
      },
    );
    collapseAnimation.onfinish = () => {
      collapseAnimation = null;
    };
    collapseAnimation.oncancel = () => {
      collapseAnimation = null;
    };
  }, CLOSE_RETURN_DELAY_MS);

  closeTimer = window.setTimeout(() => {
    const returningButton = activeProjectButton;
    projectModal.classList.remove("is-closing");
    projectModal.classList.remove("is-collapsing");
    projectModal.classList.remove("is-visible");
    projectModal.hidden = true;
    cancelCollapseAnimation();
    applyPanelTransform({});
    clearModalCardScene();
    clearModalProjectContent();
    unlockBodyScroll();
    activeProjectButton = null;
    activeProjectData = null;

    if (returningButton) {
      setProjectCardScene(returningButton, "idle");
      returningButton.classList.remove("is-source-hidden");
      queueSuppressedProjectHoverRelease();
    }
  }, CLOSE_RETURN_DELAY_MS + CLOSE_COLLAPSE_MS + MODAL_EXIT_BUFFER_MS);
};

projectButtons.forEach((button) => {
  button.addEventListener("click", () => openModal(button));
});

modalPreview?.addEventListener("click", async (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-preview-play='true']") : null;
  if (!(trigger instanceof HTMLButtonElement) || !activeProjectData?.preview?.videoSrc) return;

  const frame = document.createElement("div");
  frame.className = "project-modal__preview-frame";
  const video = document.createElement("video");
  video.className = "project-modal__preview-video";
  video.controls = true;
  video.playsInline = true;
  video.preload = "none";
  video.poster = activeProjectData.preview.poster ?? "";

  const source = document.createElement("source");
  source.src = activeProjectData.preview.videoSrc;
  source.type = activeProjectData.preview.videoType ?? "video/mp4";
  video.append(source);

  frame.append(video);
  trigger.replaceWith(frame);

  try {
    await video.play();
  } catch (_error) {
    video.controls = true;
  }
});

modalProofTrigger?.addEventListener("click", () => {
  if (!activeProjectData?.proofs?.length) return;
  openProofSheet();
});

projectModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.close === "true") {
    closeModal();
    return;
  }
  if (target.dataset.proofClose === "true") {
    closeProofSheet();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setTopbarMenuState(false);
    if (projectModal?.classList.contains("is-proof-open")) {
      closeProofSheet();
      return;
    }
    closeModal();
  }
});

window.addEventListener(
  "pointermove",
  (event) => {
    updatePointerPosition(event);

    if (suppressedHoverButton && isPointerOutsideElement(suppressedHoverButton)) {
      releaseSuppressedProjectHover();
      return;
    }

    syncHoveredProjectCard();
  },
  { passive: true },
);

window.addEventListener(
  "pointerdown",
  (event) => {
    updatePointerPosition(event);
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  setTopbarMenuState(false);

  if (!projectModal || projectModal.hidden || !projectModal.classList.contains("is-visible")) return;
  const centeredRect = getCenteredRect();

  if (projectModal.classList.contains("is-closing") && activeProjectButton) {
    if (projectModal.classList.contains("is-collapsing")) {
      const targetRect = activeProjectButton.getBoundingClientRect();
      applyPanelRect(targetRect);
      applyPanelTransform({});
      return;
    }

    applyPanelRect(centeredRect);
    applyPanelTransform({});
    return;
  }

  applyPanelRect(centeredRect);

  if (!projectModal.classList.contains("is-open") && activeProjectButton) {
    applyPanelTransform(getTransformFromRect(activeProjectButton.getBoundingClientRect(), centeredRect));
    return;
  }

  applyPanelTransform({});
});

const LOADER_HARD_TIMEOUT_MS = 5000;
const loaderStartTime = performance.now();
const completeInitialLoad = () => {
  const elapsed = performance.now() - loaderStartTime;
  const remaining = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);
  window.setTimeout(dismissSiteLoader, remaining);
};

window.setTimeout(() => {
  if (siteLoader instanceof HTMLElement && siteLoader.dataset.dismissed !== "true") {
    console.warn("[loader] Hard timeout fired — dismissing loader. Check console for upstream errors.");
    dismissSiteLoader();
  }
}, LOADER_HARD_TIMEOUT_MS);

if (document.readyState === "complete") {
  completeInitialLoad();
} else {
  window.addEventListener("load", completeInitialLoad, { once: true });
}

/* ── Year navigation ── */
const YEARS = ["2023-2024", "2024-2025", "2025-2026"];
const YEAR_LABELS = { "2023-2024": "A.S. 2023/2024", "2024-2025": "A.S. 2024/2025", "2025-2026": "A.S. 2025/2026" };
let currentYearIndex = 0;

const getFirstCardForYear = (year) =>
  projectGrid?.querySelector(`.project-card[data-year="${year}"]`) ?? null;

const scrollToYear = (index) => {
  const year = YEARS[index];
  const target = getFirstCardForYear(year);
  if (!target || !projectGrid) return;
  const gridRect = projectGrid.getBoundingClientRect();
  const cardRect = target.getBoundingClientRect();
  projectGrid.scrollBy({ left: cardRect.left - gridRect.left, behavior: "smooth" });
};

const setYearIndex = (index) => {
  currentYearIndex = index;
  if (yearLabel) yearLabel.textContent = YEAR_LABELS[YEARS[index]];
  if (yearPrevBtn) yearPrevBtn.disabled = index === 0;
  if (yearNextBtn) yearNextBtn.disabled = index === YEARS.length - 1;
  scrollToYear(index);
};

const detectCurrentYear = () => {
  if (!projectGrid) return;
  const gridLeft = projectGrid.getBoundingClientRect().left;
  for (let i = YEARS.length - 1; i >= 0; i--) {
    const card = getFirstCardForYear(YEARS[i]);
    if (card && card.getBoundingClientRect().left - gridLeft <= 8) {
      if (i !== currentYearIndex) {
        currentYearIndex = i;
        if (yearLabel) yearLabel.textContent = YEAR_LABELS[YEARS[i]];
        if (yearPrevBtn) yearPrevBtn.disabled = i === 0;
        if (yearNextBtn) yearNextBtn.disabled = i === YEARS.length - 1;
      }
      break;
    }
  }
};

yearPrevBtn?.addEventListener("click", () => {
  if (currentYearIndex > 0) setYearIndex(currentYearIndex - 1);
});

yearNextBtn?.addEventListener("click", () => {
  if (currentYearIndex < YEARS.length - 1) setYearIndex(currentYearIndex + 1);
});

projectGrid?.addEventListener("scroll", detectCurrentYear, { passive: true });
