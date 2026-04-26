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
    buttonLabel: "CH",
    buttonAria: "Switch to Italian",
    htmlLang: "zh-CN",
    heroScroll: "向下滑动",
    nameTranslations: [
      "编程开发",
      "硬件组装",
      "网络配置",
      "信息科学",
      "网络安全",
    ],
    assistant: {
      defaultAnswer:
        "我更喜欢做那些有明确个性和记忆点的项目。对我来说，好的产品不是把功能机械拼起来，而是能让人一眼记住、愿意继续用下去。",
      defaultStatus: defaultAssistantStatus,
      emptyQuestion: "先输入一个和 EIDDIE 相关的问题，我再继续回答。",
      loadingAnswer: (question) => `正在整理关于"${question}"的回答...`,
      loadingStatus: "DeepSeek 正在生成回答，只回答和 EIDDIE 本人、经历、技能、项目、合作方式相关的问题。",
      followUpStatus: "也可以继续换个问法，直接聊我做的项目、技能和合作方式。",
      requestError: "暂时无法连接 DeepSeek，已先切回预设回答。",
      placeholder: "比如：如果我想和你一起做 AI 产品，你会先从哪里开始？",
      questions: [
        {
          label: "你最想做什么样的项目？",
          answer:
            "我更喜欢做那些有明确个性和记忆点的项目。对我来说，好的产品不是把功能机械拼起来，而是能让人一眼记住、愿意继续用下去。我会更容易被那种有方向感、有表达欲、同时又真的能落地的项目吸引。",
        },
        {
          label: "你常用哪些技术和工具？",
          answer:
            "我更习惯用全栈的方式去做产品，而不是只负责其中一个环节。前端、后端、数据库、AI 接入、部署上线这些部分我都能自己接起来，所以我可以把一个想法从 demo 一路推进到真正可用的版本。比起分得很细，我更擅长把整条链路做完整。",
        },
        {
          label: "你做产品时最在意什么？",
          answer:
            "我最在意的是一个产品最后能不能成立，而不是只停留在一个好看的想法上。成立意味着逻辑清楚、体验顺畅、细节可靠，也意味着它真的能被用户持续使用。对我来说，完成度和真实可用性比表面的热闹更重要。",
        },
        {
          label: "你想和什么样的人一起做事？",
          answer:
            "我喜欢和有创造力、有判断力、也有执行力的人一起做事。最好是那种愿意交流、也真的想把事情做成的人，而不是只按部就班地完成任务。",
        },
      ],
      facts: [
        "做 AI 产品、前端体验、后端能力和自动化流程的整合型开发。",
        "先抓核心体验，再搭系统骨架，最后把细节和质感一并补齐。",
        "我在意可用性、迭代速度、表达张力，以及产品上线后的真实存活能力。",
      ],
    },
    secondaryProjects: {
      "project-two.dev": {
        intro: "前台体验和后台逻辑同一个节奏推进。",
        description: "从界面系统到后端交付一体推进，强调完整产品感，而不是把功能零散拼接。",
        meta: "产品化 / UI / API",
      },
      "project-three.dev": {
        intro: "不是纯视觉实验，而是有明确功能目标的表达型作品。",
        description: "偏表达型的实验项目，但仍然保留明确功能，让视觉冲击和实际用途同时成立。",
        meta: "创意交互 / 动效 / 可用性",
      },
      "project-four.dev": {
        intro: "更偏系统侧的能力拼接，适合做复杂环境中的解决方案。",
        description: "把基础设施、边缘设备或网络环境相关能力组合起来，做成更偏系统层的项目。",
        meta: "系统实践 / 网络 / 硬件边缘",
      },
    },
    contactCopy: "如果你想找一个既能把东西做出来、又在意页面气质和产品感觉的人，我们可以聊聊。",
    modal: {
      proofTrigger: "查看上线证明",
      proofTriggerWithCount: (count) => `查看上线证明与用户反馈 (${count})`,
      proofHeading: "上线证明与用户反馈",
      proofNote: "补充证据放在这里，不占主预览位置。",
      previewAria: (title) => `播放 ${title ?? "项目演示视频"}`,
      previewPlay: "播放演示",
      previewPending: "视频待补充",
      previewTitle: "项目预览",
      previewVideoTitle: "项目演示视频",
      previewNote: "项目预览素材待补充。",
      galleryPending: "图片即将上传",
    },
  },
  en: {
    buttonLabel: "IT",
    buttonAria: "Switch to Chinese",
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
        "Sono Chris Zhang, studente di terza superiore informatica al Liceo Blaise Pascal di Reggio Emilia. Studio anche pianoforte al Conservatorio Peri-Merulo.",
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
            "Sono Chris Zhang, frequento la terza superiore dell'indirizzo informatico al Liceo Blaise Pascal di Reggio Emilia. Mi appassionano la cybersecurity e lo sviluppo full-stack. Nel tempo libero studio pianoforte al Conservatorio Peri-Merulo.",
        },
        {
          label: "Cosa sai fare?",
          answer:
            "Programmo in JavaScript, Node.js e PHP. So configurare reti LAN (indirizzi IP, switch), assemblare computer e sviluppare applicazioni web full-stack con MySQL. Il mio progetto più completo è KeyManager: backend PHP, database crittografato e browser extension con autofill automatico.",
        },
        {
          label: "Qual è il tuo progetto migliore?",
          answer:
            "KeyManager: un sistema completo di gestione credenziali con PHP backend, MySQL a doppio livello di crittografia e browser extension per l'autofill automatico. Ho curato la sicurezza end-to-end con CSRF protection, prepared statements contro SQL injection e test Jest con copertura oltre l'80%.",
        },
        {
          label: "Cosa ti appassiona dell'informatica?",
          answer:
            "La cybersecurity mi affascina di più. Al laboratorio Mead Informatica abbiamo simulato un attacco a una vera infrastruttura aziendale — capire come ragiona un attaccante mi ha aiutato a progettare sistemi più sicuri.",
        },
      ],
      facts: [
        "Frequento l'indirizzo informatico, con focus su reti, hardware, programmazione e sicurezza.",
        "Parto dal problema concreto, costruisco la soluzione minima funzionante, poi aggiungo sicurezza e robustezza.",
        "Mi appassionano la cybersecurity, lo sviluppo full-stack e la progettazione di sistemi realmente sicuri.",
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
    type: { zh: "企业参访 / 职业定向", en: "Ascolto / Orientamento" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "参访 Credem 银行，了解职场软技能需求。", en: "Visita aziendale Credem per esplorare le competenze richieste nel mondo del lavoro." },
    description: {
      zh: "参观 Reggio Emilia 的 Credem 银行，参加定向讲座，了解职场软技能和专业能力要求。Chris 积极聆听并记录信息，深入反思自身职业发展方向，认识了企业环境和雇主期望。",
      en: "Visita presso Credem a Reggio Emilia: incontro di orientamento con illustrazione delle competenze richieste in ambito aziendale. Chris ha partecipato attivamente all'ascolto, raccogliendo informazioni sulle soft skills e riflettendo sulle competenze da sviluppare per il mondo del lavoro."
    },
    meta: { zh: "职业定向 / 软技能 / 企业沟通", en: "Orientamento professionale / Soft skills / Comunicazione aziendale" },
    signals: { zh: ["主动倾听", "职业反思"], en: ["Ascolto attivo", "Orientamento al lavoro"] },
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
    type: { zh: "简历制作 / 职业展示", en: "Curriculum / Comunicazione" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "独立制作个人简历，提升职业展示能力。", en: "Realizzazione autonoma del curriculum vitae personale al Tecnopolo di Reggio Emilia." },
    description: {
      zh: "在 Tecnopolo 学习制作专业简历：内容组织、格式排版和图形呈现。Chris 独立完成自己的简历，选择合适的格式，精心挑选相关经历，成品可用于学校、实习或工作申请。",
      en: "Al Tecnopolo di Reggio Emilia Chris ha appreso come realizzare un curriculum vitae efficace, creandolo in autonomia: scelta del formato, selezione delle informazioni rilevanti e cura dell'aspetto grafico. Risultato: un CV completo pronto per contesti scolastici, di stage o lavorativi.",
    },
    meta: { zh: "简历制作 / 内容组织 / 职业展示", en: "CV / Organizzazione contenuti / Comunicazione professionale" },
    signals: { zh: ["独立完成", "职场准备"], en: ["Realizzato in autonomia", "Pronto per il lavoro"] },
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
    type: { zh: "网络配置 / LAN", en: "Reti / Configurazione IP" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "配置局域网，用交换机连接PC，手动设置IP地址。", en: "Configurazione reti LAN con switch e indirizzi IP manuali tra due computer." },
    description: {
      zh: "深入研究服务器、网络及网络连接原理，通过电话网络和交换机实现PC互联，手动配置IP地址。Chris 积极参与网络配置和物理设备连接，成功建立了两台电脑之间的通信。",
      en: "Approfondimento su server, reti e collegamenti di rete. Realizzazione di connessioni tra PC con rete telefonica e switch, configurazione manuale degli indirizzi IP. Chris ha contribuito alla configurazione fisica dei dispositivi, creando una comunicazione funzionante tra due computer.",
    },
    meta: { zh: "LAN / IP配置 / 交换机 / 客户端-服务器", en: "LAN / IP manuali / Switch / Client-Server" },
    signals: { zh: ["手动IP配置", "局域网互通"], en: ["IP configurati manualmente", "LAN funzionante"] },
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
    type: { zh: "Node.js / Telegram机器人 / API", en: "Node.js / Bot Telegram / API" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校项目，仓库暂不公开。", en: "Progetto scolastico — repository non pubblico." },
    frontIntro: { zh: "用 Node.js 开发 Telegram 机器人，集成音乐 API。", en: "Bot Telegram integrato con API musicali per cercare artisti e ottenere descrizione e discografia." },
    description: {
      zh: "在实验室活动中学习 Node.js、API 和 Telegram 机器人开发。Chris 担任主要设计师和程序员，负责应用架构、后端开发和音乐 API 集成，最终实现了一个能搜索艺人并提供描述和唱片目录的功能机器人。",
      en: "Progetto di laboratorio informatico per comprendere Node.js, API e sviluppo di bot Telegram. Chris ha ricoperto il ruolo di progettista e programmatore principale, occupandosi dell'architettura, del backend e dell'integrazione con API musicali. Risultato: un bot Telegram funzionante che cerca artisti e fornisce descrizione e discografia.",
    },
    meta: { zh: "Node.js / JavaScript / REST API / Telegram Bot / 异步请求", en: "JavaScript / Node.js / API REST / Telegram Bot API / Asincrono" },
    signals: { zh: ["机器人上线", "API集成"], en: ["Bot funzionante", "API integrate"] },
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
    type: { zh: "计算机安全 / 工作站卫生", en: "Sicurezza Informatica / Igiene PC" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "学习计算机使用中的安全规则和卫生习惯。", en: "Studio delle regole di sicurezza e igiene nell'uso del computer per prevenire danni fisici." },
    description: {
      zh: "专项研究计算机使用安全规则，预防长时间使用PC导致的眼睛疲劳和不良姿势等问题。Chris 积极参与，学习如何正确布置工作台、养成安全使用习惯，提高了健康意识。",
      en: "Progetto dedicato alle regole di sicurezza e igiene nell'utilizzo del computer: prevenzione di affaticamento visivo, postura scorretta e altri rischi legati all'uso prolungato del PC. Chris ha appreso come organizzare correttamente la postazione di lavoro.",
    },
    meta: { zh: "工作站布置 / 视力保护 / 职业健康", en: "Postazione di lavoro / Prevenzione disturbi / Salute" },
    signals: { zh: ["安全意识", "工作台配置"], en: ["Prevenzione rischi", "Postazione corretta"] },
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
    type: { zh: "硬件 / 组装拆卸", en: "Hardware / Assemblaggio PC" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "拆卸并重新组装台式机，深入了解硬件组件及其功能。", en: "Smontaggio e rimontaggio di un computer fisso per studiarne i componenti interni." },
    description: {
      zh: "动手实践项目，拆卸并重新组装台式机。Chris 积极参与操作，识别并分析 CPU、RAM、硬盘、主板、电源等主要硬件及其在系统中的作用，提升了对PC维护的熟练度。",
      en: "Progetto pratico di smontaggio e rimontaggio di un PC fisso. Chris ha identificato e analizzato i principali componenti hardware: CPU, RAM, hard disk, scheda madre, alimentatore. L'attività ha permesso di acquisire dimestichezza con la manutenzione e l'organizzazione interna di un computer.",
    },
    meta: { zh: "CPU / RAM / 主板 / 硬件维护", en: "CPU / RAM / Scheda madre / Manutenzione hardware" },
    signals: { zh: ["动手组装", "硬件识别"], en: ["Assemblaggio pratico", "Componenti identificati"] },
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
    type: { zh: "就业市场 / 职业规划", en: "Orientamento / Mercato del Lavoro" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "了解 ANPAL 的职能及就业市场机遇。", en: "Studio delle funzioni di ANPAL e delle opportunità nel mercato del lavoro italiano." },
    description: {
      zh: "深入了解意大利国家就业政策局（ANPAL）的职能，该机构通过培训、定向和就业安置服务支持就业。Chris 研究了该机构的功能及其在劳动力市场中的作用，全面了解了可用的职业发展途径。",
      en: "Studio delle funzioni di ANPAL, l'Agenzia Nazionale per le Politiche Attive del Lavoro. Chris ha approfondito il ruolo dell'ente nel mercato del lavoro, le opportunità disponibili per giovani e lavoratori e i percorsi formativi e professionali accessibili.",
    },
    meta: { zh: "就业政策 / 职业定向 / 劳动力市场", en: "ANPAL / Orientamento al lavoro / Mercato del lavoro" },
    signals: { zh: ["就业意识", "职业规划"], en: ["Orientamento professionale", "Mercato del lavoro"] },
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
    type: { zh: "操作系统 / Ubuntu", en: "Linux / Ubuntu / Terminale" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "5节课深入学习 Linux Ubuntu，掌握终端基础命令。", en: "Cinque lezioni su Linux Ubuntu: comandi base, storia del sistema e confronto con altri OS." },
    description: {
      zh: "系统学习 Linux 操作系统，重点关注 Ubuntu 发行版，共完成 5 节课 10 小时学习。了解开源系统的特性及结构，对比其与其他操作系统的异同。Chris 探索了 Linux 环境，学习使用终端及系统管理的基本命令。",
      en: "Cinque lezioni su Linux per un totale di 10 ore di studio. Chris ha acquisito familiarità con le caratteristiche di Linux, imparato i comandi base del terminale e approfondito la storia del sistema operativo. Confronto tra sistemi open source e proprietari.",
    },
    meta: { zh: "Linux / Ubuntu / 终端命令 / 开源系统", en: "Linux / Ubuntu / Terminale / Open source" },
    signals: { zh: ["终端操作", "开源系统"], en: ["Comandi terminale", "Sistema open source"] },
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
    type: { zh: "AI实验室 / 算法 / API", en: "AI / Algoritmi / API" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "基于HTTP请求和JSON的AI团队游戏，优化搜索算法。", en: "Laboratorio AI con gioco a squadre basato su API HTTP e JSON per trovare tesori su una mappa." },
    description: {
      zh: "以AI工具为核心的实践培训：团队游戏通过API调用找到地图上的宝藏，根据远/近/很近的JSON反馈不断优化搜索算法。Chris 参与了算法设计和优化，项目以展示各组算法的汇报收尾。",
      en: "Attività formativa sull'uso dell'AI: gioco a squadre con chiamate API per individuare tesori su una mappa tramite risposte JSON (lontano/vicino/molto vicino). Chris ha sviluppato e ottimizzato algoritmi di ricerca, concludendo con una presentazione dei risultati.",
    },
    meta: { zh: "HTTP API / JSON / 算法优化 / AI工具", en: "API HTTP / JSON / Algoritmi / AI" },
    signals: { zh: ["算法优化", "团队协作"], en: ["Algoritmo ottimizzato", "Lavoro di squadra"] },
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
    type: { zh: "网络安全 / 攻防实验室", en: "Cybersecurity / Laboratorio" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "真实企业环境的攻防模拟，分为攻击方和防御方。", en: "Simulazione reale di attacco e difesa su infrastruttura aziendale presso un'azienda." },
    description: {
      zh: "以真实企业基础设施攻防模拟为核心的实践实验室。学生分为攻击组（寻找漏洞）和防御组（监控和保护系统）两队。Chris 亲身体验了网络安全的实际动态，深入理解攻防双方的策略。",
      en: "Attività laboratoriale di cybersecurity: simulazione di attacco e difesa su un'infrastruttura aziendale reale. Gli studenti erano divisi in attaccanti (individuare vulnerabilità) e difensori (monitorare e proteggere il sistema). Chris ha compreso le dinamiche concrete della cybersecurity.",
    },
    meta: { zh: "网络安全 / 漏洞分析 / 防御策略 / 系统监控", en: "Cybersecurity / Vulnerabilità / Difesa sistemi / Monitoraggio" },
    signals: { zh: ["攻防实战", "漏洞发现"], en: ["Attacco e difesa", "Vulnerabilità reali"] },
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
    type: { zh: "实习展示 / Web应用", en: "Presentazione / Tirocinio" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校实习项目，仓库暂不公开。", en: "Progetto di tirocinio scolastico — repository non pubblico." },
    frontIntro: { zh: "向班级展示实习经历，介绍企业机器预订Web应用的开发。", en: "Presentazione del tirocinio aziendale: web app per la prenotazione di macchinari." },
    description: {
      zh: "",
      en: "",
    },
    meta: { zh: "PowerPoint演示 / Web应用 / 项目汇报", en: "PowerPoint / Web app / Comunicazione tecnica" },
    signals: { zh: ["实习成果", "公开演示"], en: ["Risultato tirocinio", "Presentazione pubblica"] },
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
    type: { zh: "高中后定向 / 职业规划", en: "Orientamento Post-Diploma" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "探索高中毕业后的各种路径：大学、就业和社区服务。", en: "Orientamento post-diploma su università, lavoro e servizio civile." },
    description: {
      zh: "专为高中后职业定向设计的活动，提供大学、就业及社区服务等不同发展路径的全面概览，并提供具体实用的决策工具，帮助学生在毕业后做出理性选择。",
      en: "Attività dedicata all'orientamento post-diploma con panoramica su università, lavoro e servizio civile. Gli incontri hanno fornito strumenti concreti per una scelta consapevole del proprio futuro professionale e formativo.",
    },
    meta: { zh: "高考后规划 / 大学 / 就业 / 社区服务", en: "Post-diploma / Università / Lavoro / Servizio civile" },
    signals: { zh: ["未来规划", "知情选择"], en: ["Scelte consapevoli", "Orientamento futuro"] },
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
    title: "ljubljana and Zagreb",
    type: { zh: "AI项目 / 国际大学参访", en: "Università / AI / Internazionale" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校参访活动，无公开仓库。", en: "Attività scolastica — nessun repository pubblico." },
    frontIntro: { zh: "在卢布尔雅那大学参观AI项目，听取学生研究展示。", en: "Presentazioni AI al dipartimento di Informatica dell'Università di Lubiana durante il viaggio d'istruzione." },
    description: {
      zh: "在卢布尔雅那大学信息学系参加学习之旅，听取大学生关于人工智能项目的展示。Chris 通过参与这次国际访问，增长了AI领域的基础知识，并在活动结束后撰写了综合报告。",
      en: "Visita al dipartimento di Informatica dell'Università di Lubiana durante il viaggio di istruzione. Presentazioni di studenti universitari su progetti di intelligenza artificiale. Chris ha seguito le presentazioni e redatto una relazione di sintesi, ampliando la visione su contesti internazionali dell'informatica.",
    },
    meta: { zh: "AI基础 / 国际视野 / 大学研究", en: "AI / Università internazionale / Sintesi" },
    signals: { zh: ["国际视野", "AI基础"], en: ["Contesto internazionale", "Progetti AI reali"] },
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
    title: "Esposizione",
    type: { zh: "项目汇报 / FieldBooking", en: "Presentazione / FieldBooking" },
    link: "", linkLabel: "", githubLink: "", githubLabel: "GitHub",
    githubNote: { zh: "学校项目，仓库暂不公开。", en: "Progetto scolastico — repository non pubblico." },
    frontIntro: { zh: "向四年级同学展示 FieldBooking 项目，通过评分表评估。", en: "Presentazione del progetto FieldBooking alle classi quarte con valutazione tramite rubrica." },
    description: {
      zh: "向四年级班级展示 FieldBooking 项目，介绍目标、功能和技术选型。评估通过教师准备的评分表进行。Chris 展示了清晰的表达能力和有效管理观众的能力。",
      en: "Presentazione del project work FieldBooking alle classi quarte. Chris ha illustrato obiettivi, funzionamento e scelte tecniche, ricevendo valutazione tramite rubrica predisposta dai docenti. Un'esperienza completa di public speaking e comunicazione tecnica su un progetto reale.",
    },
    meta: { zh: "项目演示 / 技术沟通 / 公众演讲", en: "Public speaking / Comunicazione tecnica / FieldBooking" },
    signals: { zh: ["项目展示", "评分表评估"], en: ["Presentazione pubblica", "Valutazione con rubrica"] },
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
    type: { zh: "全栈开发 / 安全 / 浏览器扩展", en: "Full-Stack / Sicurezza / Browser Extension" },
    link: "", linkLabel: "",
    githubLink: "https://github.com/xiul1/project-work",
    githubLabel: "GitHub / project-work",
    githubNote: { zh: "", en: "" },
    frontIntro: { zh: "完整的密码管理系统：PHP后端、MySQL数据库和自动填充浏览器扩展。", en: "Sistema completo di gestione password: PHP backend, MySQL e browser extension con autofill automatico." },
    description: {
      zh: "KeyManager 结合PHP后端（用户认证、加密存储、CSRF保护）、MySQL数据库（双层加密+主密码）和JavaScript浏览器扩展（自动识别登录字段、安全自动填充）。Chris 担任架构师和主要开发者，实现了30分钟会话超时、SQL注入防护预处理语句和操作日志。Jest 测试覆盖率达80%+。",
      en: "KeyManager è un sistema completo di gestione credenziali: backend PHP con autenticazione, archiviazione crittografata e protezione CSRF; database MySQL con doppio livello di crittografia e master password; browser extension JavaScript che rileva campi input e auto-compila le credenziali. Chris è stato architetto e sviluppatore principale: session timeout 30 min, prepared statements anti-SQL injection, test coverage 80%+ con Jest.",
    },
    meta: { zh: "PHP / MySQL / JavaScript / 浏览器扩展 / 加密 / CSRF / Jest", en: "PHP / MySQL / JavaScript / Browser Extension / Crittografia / CSRF / Jest" },
    signals: { zh: ["端到端加密", "自动填充", "测试覆盖率80%+"], en: ["Crittografia end-to-end", "Autofill automatico", "Test coverage 80%+"] },
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

  return `
    <span class="project-card__cover" aria-hidden="true">
      <span class="project-card__cover-panel"></span>
      <span class="project-card__cover-burst"></span>
      <span class="project-card__cover-dots"></span>
      <span class="project-card__cover-rays"></span>
      <span class="project-card__cover-bubble"></span>
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
    modalDescription.textContent = projectDetail.description ?? projectDetail.frontIntro ?? "";
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
