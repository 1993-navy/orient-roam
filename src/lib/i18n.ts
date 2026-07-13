// Lightweight bilingual support (English-first + Chinese).
// Place/city records carry both `name` (zh) and `nameEn`, so switching locale
// also switches which name is shown. UI strings live in the dictionary below.

export const LOCALES = ["en", "zh", "fr", "es", "ja", "ar", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

// Native language names shown in the language switcher.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  es: "Español",
  ja: "日本語",
  ar: "العربية",
  pt: "Português",
};

// Right-to-left locales (used to set <html dir>).
export const RTL_LOCALES: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}


export const CATEGORY_LABELS: Record<string, { en: string; zh: string; emoji: string }> = {
  FOOD: { en: "Food", zh: "美食", emoji: "🍜" },
  ATTRACTION: { en: "Attractions", zh: "名胜古迹", emoji: "🏯" },
  HOTEL: { en: "Stay", zh: "住宿", emoji: "🛏️" },
  NATURE: { en: "Nature", zh: "自然风景", emoji: "⛰️" },
  NIGHTLIFE: { en: "Nightlife", zh: "夜生活", emoji: "🍸" },
  SHOPPING: { en: "Shopping", zh: "购物", emoji: "🛍️" },
};

export const MEETUP_TYPE_LABELS: Record<string, { en: string; zh: string; emoji: string }> = {
  MEAL: { en: "Group meal", zh: "拼饭", emoji: "🍽️" },
  SHOPPING: { en: "Group buy", zh: "拼单", emoji: "🛒" },
  TRIP: { en: "Travel buddy", zh: "搭子", emoji: "🧭" },
  ACTIVITY: { en: "Regular activity", zh: "定期活动", emoji: "📅" },
};

// Report reasons (shared by ReportButton across meetups/users/etc.)
export const REPORT_REASON_LABELS: Record<string, { en: string; zh: string }> = {
  SPAM: { en: "Spam", zh: "垃圾信息" },
  INAPPROPRIATE: { en: "Inappropriate", zh: "内容不当" },
  SAFETY: { en: "Safety concern", zh: "安全顾虑" },
  SCAM: { en: "Scam / fraud", zh: "诈骗" },
  OTHER: { en: "Other", zh: "其他" },
};

// Foreigner-friendly attribute badges. Keys match FOREIGNER_TAGS in validations.
export const FOREIGNER_TAG_LABELS: Record<string, { en: string; zh: string; emoji: string }> = {
  ENGLISH_MENU: { en: "English menu", zh: "英文菜单", emoji: "📖" },
  PICTURE_MENU: { en: "Picture menu", zh: "图片菜单", emoji: "🖼️" },
  STAFF_ENGLISH: { en: "Staff speak English", zh: "店员会英文", emoji: "💬" },
  CARD_PAY: { en: "Cards accepted", zh: "可刷卡", emoji: "💳" },
  MOBILE_PAY: { en: "Mobile pay", zh: "移动支付", emoji: "📱" },
  HALAL: { en: "Halal", zh: "清真", emoji: "🕌" },
  VEG_FRIENDLY: { en: "Veg-friendly", zh: "素食友好", emoji: "🥗" },
  ENGLISH_SIGN: { en: "English signage", zh: "英文标识", emoji: "🪧" },
};

export const CITY_TIER_LABELS: Record<string, { en: string; zh: string; color: string }> = {
  MEGA: { en: "Megacity", zh: "特大城市", color: "bg-red-100 text-red-700" },
  FIRST: { en: "1st Tier", zh: "一线城市", color: "bg-orange-100 text-orange-700" },
  SECOND: { en: "2nd Tier", zh: "二线城市", color: "bg-amber-100 text-amber-700" },
  THIRD: { en: "3rd Tier", zh: "三线城市", color: "bg-green-100 text-green-700" },
};

export type UIStrings = {
  tagline: string;
  subtitle: string;
  explore: string;
  cities: string;
  chat: string;
  community: string;
  signIn: string;
  signUp: string;
  signOut: string;
  chooseCity: string;
  topPicks: string;
  allCategories: string;
  reviews: string;
  writeReview: string;
  yourRating: string;
  submit: string;
  viewDetails: string;
  onMap: string;
  backToExplore: string;
  noReviews: string;
  startMeetup: string;
  join: string;
  joined: string;
  members: string;
  send: string;
  typeMessage: string;
  loginToReview: string;
  loginToChat: string;
  home: string;
  profile: string;
  more: string;
  wantToGo: string;
  save: string;
  topic: string;
  posts: string;
  backToTop: string;
  loginToSave: string;
  noTopicPosts: string;
  hashtagHint: string;
  searchPlaces: string;
  search: string;
  searchEverything: string;
  places: string;
  price: string;
  rating: string;
  any: string;
  endOfList: string;
  noResults: string;
  loadingMore: string;
  newChat: string;
  noConversations: string;
  selectConversation: string;
  feed: string;
  shareUpdate: string;
  postPlaceholder: string;
  postEmpty: string;
  anyCity: string;
  participants: string;
  leave: string;
  hosting: string;
  when: string;
  trips: string;
  newTrip: string;
  tripTitle: string;
  addToTrip: string;
  remove: string;
  noTrips: string;
  createTrip: string;
  // Foreigner-friendly tags + dish-level reviews
  foreignerFriendly: string;
  confirmTag: string;
  confirmed: string;
  loginToConfirm: string;
  dishes: string;
  addDish: string;
  dishNameZh: string;
  dishNameEn: string;
  priceOptional: string;
  noDishes: string;
  rateDish: string;
  mustTry: string;
  mustTryShort: string;
  sortByRating: string;
  loginToRateDish: string;
  // Meetups: filters, restaurant link, reporting
  findMeetups: string;
  meetupsSubtitle: string;
  createMeetup: string;
  allTypes: string;
  myMeetups: string;
  restaurant: string;
  placeOptional: string;
  noPlace: string;
  reportMeetup: string;
  reportHost: string;
  report: string;
  reportReason: string;
  reportDetail: string;
  reportThanks: string;
  full: string;
  noMeetupsMine: string;
  // Group pooling
  groupPools: string;
  poolsSubtitle: string;
  createPool: string;
  targetPeople: string;
  perPerson: string;
  deadline: string;
  productLink: string;
  joinPool: string;
  formed: string;
  needMore: string;
  noPools: string;
  reportPool: string;
  meetupsNav: string;
  groupChat: string;
  // Publishing (我要发布)
  publish: string;
  publishTitle: string;
  publishSubtitle: string;
  publishFood: string;
  publishAttraction: string;
  publishDiary: string;
  publishPhoto: string;
  publishVideo: string;
  publishChooseType: string;
  publishSubmit: string;
  publishPending: string;
  publishReviewNotice: string;
  publishTitleField: string;
  publishBodyField: string;
  publishMediaUrls: string;
  publishAddMedia: string;
  publishLoginRequired: string;
  moderationPending: string;
  approve: string;
  reject: string;
  // Feedback (意见反馈)
  feedback: string;
  feedbackTitle: string;
  feedbackSubtitle: string;
  feedbackCategory: string;
  feedbackMessage: string;
  feedbackPlaceholder: string;
  feedbackEmail: string;
  feedbackSubmit: string;
  feedbackThanks: string;
  feedbackAnother: string;
};



// Full English + Chinese dictionaries. The five additional locales below supply
// partial translations for the most visible strings; anything they omit falls
// back to English via the merge in `UI`.
const BASE: Record<"en" | "zh", UIStrings> = {
  en: {
    tagline: "Wander China with confidence",

    subtitle:
      "Where to eat, what to see, where to sleep — picked by travelers, ranked by real reviews, pinned on the map.",
    explore: "Explore",
    cities: "Cities",
    chat: "Chat",
    community: "Community",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    chooseCity: "Choose a city",
    topPicks: "Top picks",
    allCategories: "All",
    reviews: "reviews",
    writeReview: "Write a review",
    yourRating: "Your rating",
    submit: "Submit",
    viewDetails: "View details",
    onMap: "Map",
    backToExplore: "Back to explore",
    noReviews: "No reviews yet — be the first!",
    startMeetup: "Start a meetup",
    join: "Join",
    joined: "Joined",
    members: "members",
    send: "Send",
    typeMessage: "Type a message…",
    loginToReview: "Sign in to leave a review",
    loginToChat: "Sign in to chat and join meetups",
    home: "Home",
    profile: "Profile",
    more: "More",
    wantToGo: "Want to go",
    save: "Save",
    topic: "Topic",
    posts: "posts",
    backToTop: "Back to top",
    loginToSave: "Sign in to save places",
    noTopicPosts: "No posts with this topic yet.",
    hashtagHint: "Tip: add #topics to your review",
    searchPlaces: "Search places, food…",
    search: "Search",
    searchEverything: "Search cities, places, posts, topics…",
    places: "Places",
    price: "Price",
    rating: "Rating",
    any: "Any",
    endOfList: "You've reached the end",
    noResults: "No matches — try adjusting your filters.",
    loadingMore: "Loading more…",
    newChat: "New chat",
    noConversations: "No conversations yet",
    selectConversation: "Select a chat to start messaging",
    feed: "Feed",
    shareUpdate: "Post",
    postPlaceholder: "Share a travel find… add #topics",
    postEmpty: "No posts yet — be the first!",
    anyCity: "Any city",
    participants: "Participants",
    leave: "Leave",
    hosting: "You're hosting",
    when: "When",
    trips: "Trips",
    newTrip: "New trip",
    tripTitle: "Trip name",
    addToTrip: "Add to trip",
    remove: "Remove",
    noTrips: "No trips yet — create one!",
    createTrip: "Create",
    foreignerFriendly: "Foreigner-friendly",
    confirmTag: "Confirm",
    confirmed: "confirmed",
    loginToConfirm: "Sign in to confirm",
    dishes: "Dishes",
    addDish: "Add a dish",
    dishNameZh: "Chinese name",
    dishNameEn: "English name",
    priceOptional: "Price ¥ (optional)",
    noDishes: "No dishes yet — add the first!",
    rateDish: "Rate this dish",
    mustTry: "Must try",
    mustTryShort: "must-try",
    sortByRating: "Top rated",
    loginToRateDish: "Sign in to rate dishes",
    findMeetups: "Find Meetups",
    meetupsSubtitle: "Join group meals, travel buddies, and regular activities",
    createMeetup: "Create Meetup",
    allTypes: "All",
    myMeetups: "My meetups",
    restaurant: "Restaurant",
    placeOptional: "Place (optional)",
    noPlace: "No place",
    reportMeetup: "Report meetup",
    reportHost: "Report host",
    report: "Report",
    reportReason: "Reason",
    reportDetail: "Details (optional)",
    reportThanks: "Thanks — our team will review this.",
    full: "Full",
    noMeetupsMine: "You haven't hosted or joined any meetups yet.",
    groupPools: "Group Pools",
    poolsSubtitle: "Team up to hit a group-buy threshold — split bulk buys & deals",
    createPool: "Start a pool",
    targetPeople: "Target group size",
    perPerson: "per person",
    deadline: "Deadline",
    productLink: "Product link (optional)",
    joinPool: "Join pool",
    formed: "Formed",
    needMore: "more to form",
    noPools: "No open pools — start the first one!",
    reportPool: "Report pool",
    meetupsNav: "Meetups",
    groupChat: "Group chat",
    publish: "Publish",
    publishTitle: "Publish something",
    publishSubtitle: "Share a restaurant, an attraction, or a travel diary, photo or video.",
    publishFood: "Restaurant",
    publishAttraction: "Attraction",
    publishDiary: "Travel diary",
    publishPhoto: "Photos",
    publishVideo: "Video",
    publishChooseType: "What do you want to publish?",
    publishSubmit: "Submit for review",
    publishPending: "Submitted! It will appear once approved.",
    publishReviewNotice: "To keep the community safe, submissions are reviewed before they go live.",
    publishTitleField: "Title",
    publishBodyField: "Tell your story…",
    publishMediaUrls: "Image / video URLs",
    publishAddMedia: "Add another URL",
    publishLoginRequired: "Sign in to publish",
    moderationPending: "Pending submissions",
    approve: "Approve",
    reject: "Reject",
    feedback: "Feedback",
    feedbackTitle: "Share your feedback",
    feedbackSubtitle: "Found a bug, have an idea, or something to tell us? We read every note.",
    feedbackCategory: "What's this about?",
    feedbackMessage: "Your message",
    feedbackPlaceholder: "Tell us what's on your mind…",
    feedbackEmail: "Email (optional, so we can reply)",
    feedbackSubmit: "Send feedback",
    feedbackThanks: "Thanks for the feedback!",
    feedbackAnother: "Send another",
  },
  zh: {


    tagline: "安心畅游中国",
    subtitle:
      "吃什么、看什么、住哪里——由旅行者甄选，按真实评价排序，清晰标注在地图上。",
    explore: "探索",
    cities: "城市",
    chat: "聊天",
    community: "社群",
    signIn: "登录",
    signUp: "注册",
    signOut: "退出",
    chooseCity: "选择城市",
    topPicks: "热门推荐",
    allCategories: "全部",
    reviews: "条评价",
    writeReview: "写评价",
    yourRating: "你的评分",
    submit: "提交",
    viewDetails: "查看详情",
    onMap: "地图",
    backToExplore: "返回探索",
    noReviews: "还没有评价——来当第一个吧！",
    startMeetup: "发起活动",
    join: "加入",
    joined: "已加入",
    members: "成员",
    send: "发送",
    typeMessage: "输入消息……",
    loginToReview: "登录后即可评价",
    loginToChat: "登录后即可聊天和加入活动",
    home: "首页",
    profile: "我的",
    more: "更多",
    wantToGo: "想去",
    save: "收藏",
    topic: "话题",
    posts: "条内容",
    backToTop: "返回顶部",
    loginToSave: "登录后即可收藏",
    noTopicPosts: "还没有带这个话题的内容。",
    hashtagHint: "小贴士：在评价里加 #话题 试试",
    searchPlaces: "搜索景点、美食……",
    search: "搜索",
    searchEverything: "搜索城市、地点、帖子、话题……",
    places: "地点",
    price: "价格",
    rating: "评分",
    any: "不限",
    endOfList: "已经到底啦",
    noResults: "没有匹配结果——试试调整筛选条件。",
    loadingMore: "加载中……",
    newChat: "发起聊天",
    noConversations: "还没有会话",
    selectConversation: "选择一个会话开始聊天",
    feed: "动态",
    shareUpdate: "发布",
    postPlaceholder: "分享你的旅行发现……可加 #话题",
    postEmpty: "还没有动态,来发第一条吧!",
    anyCity: "不限城市",
    participants: "参与者",
    leave: "退出",
    hosting: "你是主办人",
    when: "时间",
    trips: "行程",
    newTrip: "新建行程",
    tripTitle: "行程名称",
    addToTrip: "加入行程",
    remove: "移除",
    noTrips: "还没有行程,新建一个吧!",
    createTrip: "创建",
    foreignerFriendly: "外国人友好",
    confirmTag: "确认",
    confirmed: "人确认",
    loginToConfirm: "登录后即可确认",
    dishes: "菜品",
    addDish: "添加菜品",
    dishNameZh: "中文名",
    dishNameEn: "英文名",
    priceOptional: "价格 ¥（可选）",
    noDishes: "还没有菜品——来添加第一道吧！",
    rateDish: "评价这道菜",
    mustTry: "必点",
    mustTryShort: "人推荐必点",
    sortByRating: "评分最高",
    loginToRateDish: "登录后即可评价菜品",
    findMeetups: "发现约饭",
    meetupsSubtitle: "加入拼饭、找搭子、参加定期活动",
    createMeetup: "发起约饭",
    allTypes: "全部",
    myMeetups: "我的约饭",
    restaurant: "餐厅",
    placeOptional: "地点（可选）",
    noPlace: "不指定地点",
    reportMeetup: "举报活动",
    reportHost: "举报房主",
    report: "举报",
    reportReason: "原因",
    reportDetail: "补充说明（可选）",
    reportThanks: "已收到，我们会尽快审核。",
    full: "已满",
    noMeetupsMine: "你还没有发起或报名任何约饭。",
    groupPools: "拼团",
    poolsSubtitle: "凑齐人数享团购价——拼单、分摊、薅羊毛",
    createPool: "发起拼团",
    targetPeople: "成团人数",
    perPerson: "每人",
    deadline: "截止时间",
    productLink: "商品链接（可选）",
    joinPool: "参团",
    formed: "已成团",
    needMore: "人即可成团",
    noPools: "还没有进行中的拼团——来发起第一个吧！",
    reportPool: "举报拼团",
    meetupsNav: "约饭",
    groupChat: "群聊",
    publish: "发布",
    publishTitle: "我要发布",
    publishSubtitle: "分享一家餐厅、一个景点，或你的旅游日记、图片、视频。",
    publishFood: "餐厅",
    publishAttraction: "景点",
    publishDiary: "旅游日记",
    publishPhoto: "图片",
    publishVideo: "视频",
    publishChooseType: "你想发布什么？",
    publishSubmit: "提交审核",
    publishPending: "已提交！审核通过后即会显示。",
    publishReviewNotice: "为维护社区安全，内容在上线前需经过审核。",
    publishTitleField: "标题",
    publishBodyField: "讲讲你的故事……",
    publishMediaUrls: "图片 / 视频链接",
    publishAddMedia: "再添加一个链接",
    publishLoginRequired: "登录后即可发布",
    moderationPending: "待审核内容",
    approve: "通过",
    reject: "拒绝",
    feedback: "意见反馈",
    feedbackTitle: "提交意见反馈",
    feedbackSubtitle: "发现了问题、有好点子，或者想对我们说点什么？每一条我们都会认真看。",
    feedbackCategory: "反馈类型",
    feedbackMessage: "你的意见",
    feedbackPlaceholder: "把你的想法告诉我们……",
    feedbackEmail: "邮箱（可选，方便我们回复你）",
    feedbackSubmit: "提交反馈",
    feedbackThanks: "感谢你的反馈！",
    feedbackAnother: "再提一条",
  },
};



// Partial translations for the additional locales. Any key omitted here falls
// back to English via the merge below. Focused on high-visibility navigation,
// the publish flow, and common actions.
const OVERRIDES: Record<Exclude<Locale, "en" | "zh">, Partial<UIStrings>> = {
  fr: {
    tagline: "Explorez la Chine en toute confiance",
    explore: "Explorer",
    cities: "Villes",
    chat: "Discuter",
    community: "Communauté",
    signIn: "Se connecter",
    signUp: "S'inscrire",
    signOut: "Se déconnecter",
    chooseCity: "Choisir une ville",
    topPicks: "Coups de cœur",
    allCategories: "Tout",
    search: "Rechercher",
    home: "Accueil",
    profile: "Profil",
    more: "Plus",
    save: "Enregistrer",
    submit: "Envoyer",
    trips: "Voyages",
    feed: "Actualité",
    meetupsNav: "Rencontres",
    findMeetups: "Trouver des rencontres",
    groupPools: "Achats groupés",
    publish: "Publier",
    publishTitle: "Publier du contenu",
    publishSubtitle: "Partagez un restaurant, un site touristique, ou un carnet de voyage, une photo ou une vidéo.",
    publishFood: "Restaurant",
    publishAttraction: "Site touristique",
    publishDiary: "Carnet de voyage",
    publishPhoto: "Photos",
    publishVideo: "Vidéo",
    publishChooseType: "Que voulez-vous publier ?",
    publishSubmit: "Soumettre pour révision",
    publishPending: "Envoyé ! Il apparaîtra après approbation.",
    publishReviewNotice: "Pour la sécurité de la communauté, les publications sont examinées avant leur mise en ligne.",
    publishTitleField: "Titre",
    publishBodyField: "Racontez votre histoire…",
    publishMediaUrls: "URL d'image / vidéo",
    publishAddMedia: "Ajouter une autre URL",
    publishLoginRequired: "Connectez-vous pour publier",
    approve: "Approuver",
    reject: "Rejeter",
  },
  es: {
    tagline: "Recorre China con confianza",
    explore: "Explorar",
    cities: "Ciudades",
    chat: "Chat",
    community: "Comunidad",
    signIn: "Iniciar sesión",
    signUp: "Registrarse",
    signOut: "Cerrar sesión",
    chooseCity: "Elige una ciudad",
    topPicks: "Destacados",
    allCategories: "Todo",
    search: "Buscar",
    home: "Inicio",
    profile: "Perfil",
    more: "Más",
    save: "Guardar",
    submit: "Enviar",
    trips: "Viajes",
    feed: "Novedades",
    meetupsNav: "Quedadas",
    findMeetups: "Buscar quedadas",
    groupPools: "Compras en grupo",
    publish: "Publicar",
    publishTitle: "Publicar algo",
    publishSubtitle: "Comparte un restaurante, un lugar de interés, o un diario de viaje, foto o vídeo.",
    publishFood: "Restaurante",
    publishAttraction: "Lugar de interés",
    publishDiary: "Diario de viaje",
    publishPhoto: "Fotos",
    publishVideo: "Vídeo",
    publishChooseType: "¿Qué quieres publicar?",
    publishSubmit: "Enviar para revisión",
    publishPending: "¡Enviado! Aparecerá una vez aprobado.",
    publishReviewNotice: "Para mantener la comunidad segura, las publicaciones se revisan antes de publicarse.",
    publishTitleField: "Título",
    publishBodyField: "Cuenta tu historia…",
    publishMediaUrls: "URL de imagen / vídeo",
    publishAddMedia: "Añadir otra URL",
    publishLoginRequired: "Inicia sesión para publicar",
    approve: "Aprobar",
    reject: "Rechazar",
  },
  ja: {
    tagline: "安心して中国を旅しよう",
    explore: "さがす",
    cities: "都市",
    chat: "チャット",
    community: "コミュニティ",
    signIn: "ログイン",
    signUp: "登録",
    signOut: "ログアウト",
    chooseCity: "都市を選ぶ",
    topPicks: "おすすめ",
    allCategories: "すべて",
    search: "検索",
    home: "ホーム",
    profile: "プロフィール",
    more: "もっと見る",
    save: "保存",
    submit: "送信",
    trips: "旅程",
    feed: "フィード",
    meetupsNav: "ミートアップ",
    findMeetups: "ミートアップを探す",
    groupPools: "共同購入",
    publish: "投稿",
    publishTitle: "投稿する",
    publishSubtitle: "レストラン、観光スポット、旅行日記・写真・動画をシェアしよう。",
    publishFood: "レストラン",
    publishAttraction: "観光スポット",
    publishDiary: "旅行日記",
    publishPhoto: "写真",
    publishVideo: "動画",
    publishChooseType: "何を投稿しますか？",
    publishSubmit: "審査に送信",
    publishPending: "送信しました！承認後に表示されます。",
    publishReviewNotice: "コミュニティの安全のため、投稿は公開前に審査されます。",
    publishTitleField: "タイトル",
    publishBodyField: "あなたのストーリーを…",
    publishMediaUrls: "画像・動画のURL",
    publishAddMedia: "URLを追加",
    publishLoginRequired: "投稿するにはログインしてください",
    approve: "承認",
    reject: "却下",
  },
  ar: {
    tagline: "تجوّل في الصين بثقة",
    explore: "استكشف",
    cities: "المدن",
    chat: "الدردشة",
    community: "المجتمع",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    signOut: "تسجيل الخروج",
    chooseCity: "اختر مدينة",
    topPicks: "الأفضل",
    allCategories: "الكل",
    search: "بحث",
    home: "الرئيسية",
    profile: "الملف الشخصي",
    more: "المزيد",
    save: "حفظ",
    submit: "إرسال",
    trips: "الرحلات",
    feed: "المستجدات",
    meetupsNav: "اللقاءات",
    findMeetups: "ابحث عن لقاءات",
    groupPools: "الشراء الجماعي",
    publish: "نشر",
    publishTitle: "انشر شيئًا",
    publishSubtitle: "شارك مطعمًا أو معلمًا سياحيًا أو مذكرات سفر أو صورة أو فيديو.",
    publishFood: "مطعم",
    publishAttraction: "معلم سياحي",
    publishDiary: "مذكرات السفر",
    publishPhoto: "صور",
    publishVideo: "فيديو",
    publishChooseType: "ماذا تريد أن تنشر؟",
    publishSubmit: "إرسال للمراجعة",
    publishPending: "تم الإرسال! سيظهر بعد الموافقة.",
    publishReviewNotice: "للحفاظ على أمان المجتمع، تتم مراجعة المنشورات قبل نشرها.",
    publishTitleField: "العنوان",
    publishBodyField: "احكِ قصتك…",
    publishMediaUrls: "روابط الصور / الفيديو",
    publishAddMedia: "إضافة رابط آخر",
    publishLoginRequired: "سجّل الدخول للنشر",
    approve: "موافقة",
    reject: "رفض",
  },
  pt: {
    tagline: "Explore a China com confiança",
    explore: "Explorar",
    cities: "Cidades",
    chat: "Conversar",
    community: "Comunidade",
    signIn: "Entrar",
    signUp: "Cadastrar-se",
    signOut: "Sair",
    chooseCity: "Escolha uma cidade",
    topPicks: "Destaques",
    allCategories: "Tudo",
    search: "Pesquisar",
    home: "Início",
    profile: "Perfil",
    more: "Mais",
    save: "Salvar",
    submit: "Enviar",
    trips: "Viagens",
    feed: "Novidades",
    meetupsNav: "Encontros",
    findMeetups: "Encontrar encontros",
    groupPools: "Compras em grupo",
    publish: "Publicar",
    publishTitle: "Publicar algo",
    publishSubtitle: "Compartilhe um restaurante, um ponto turístico, ou um diário de viagem, foto ou vídeo.",
    publishFood: "Restaurante",
    publishAttraction: "Ponto turístico",
    publishDiary: "Diário de viagem",
    publishPhoto: "Fotos",
    publishVideo: "Vídeo",
    publishChooseType: "O que você quer publicar?",
    publishSubmit: "Enviar para revisão",
    publishPending: "Enviado! Aparecerá após a aprovação.",
    publishReviewNotice: "Para manter a comunidade segura, as publicações são revisadas antes de irem ao ar.",
    publishTitleField: "Título",
    publishBodyField: "Conte sua história…",
    publishMediaUrls: "URLs de imagem / vídeo",
    publishAddMedia: "Adicionar outra URL",
    publishLoginRequired: "Entre para publicar",
    approve: "Aprovar",
    reject: "Rejeitar",
  },
};

// Merge each additional locale over the English base so any untranslated key
// gracefully falls back to English.
export const UI: Record<Locale, UIStrings> = {
  en: BASE.en,
  zh: BASE.zh,
  fr: { ...BASE.en, ...OVERRIDES.fr },
  es: { ...BASE.en, ...OVERRIDES.es },
  ja: { ...BASE.en, ...OVERRIDES.ja },
  ar: { ...BASE.en, ...OVERRIDES.ar },
  pt: { ...BASE.en, ...OVERRIDES.pt },
};


// Resolve a bilingual label object (only carries en + zh) for any locale,
// falling back to English for the non-en/zh locales.
export function biLabel(obj: { en: string; zh: string }, locale: Locale): string {
  return locale === "zh" ? obj.zh : obj.en;
}

// Interaction / share / gallery labels. Kept as bilingual objects (resolved via
// biLabel) so new UI strings don't require touching every locale in UIStrings.
export const INTERACTION_LABELS = {
  like: { en: "Like", zh: "点赞" },
  comment: { en: "Comment", zh: "评论" },
  comments: { en: "Comments", zh: "评论" },
  share: { en: "Share", zh: "转发" },
  shareTo: { en: "Share to", zh: "转发到" },
  copyLink: { en: "Copy link", zh: "复制链接" },
  linkCopied: { en: "Link copied", zh: "链接已复制" },
  wechatHint: { en: "Link copied — paste it into WeChat", zh: "链接已复制，粘贴到微信即可" },
  writeComment: { en: "Write a comment…", zh: "写下你的评论…" },
  postComment: { en: "Post", zh: "发表" },
  noComments: { en: "No comments yet — be the first!", zh: "还没有评论——来当第一个吧！" },
  featured: { en: "Featured", zh: "精选" },
  travelNotes: { en: "Travel Notes", zh: "旅行笔记" },
} as const;

// Chat auto-translation labels (resolved via biLabel).
export const TRANSLATE_LABELS = {
  autoTranslate: { en: "Auto-translate", zh: "自动翻译" },
  translating: { en: "Translating…", zh: "翻译中…" },
  translatedTag: { en: "translated", zh: "译文" },
  showOriginal: { en: "Show original", zh: "显示原文" },
  showTranslation: { en: "Translate", zh: "翻译" },
} as const;

// Share channels (order = display order in ShareMenu).
export const SHARE_CHANNELS = {
  wechat: { en: "WeChat", zh: "微信", emoji: "💬" },
  telegram: { en: "Telegram", zh: "Telegram", emoji: "✈️" },
  whatsapp: { en: "WhatsApp", zh: "WhatsApp", emoji: "🟢" },
  youtube: { en: "YouTube", zh: "YouTube", emoji: "▶️" },
  x: { en: "X", zh: "X", emoji: "𝕏" },
} as const;

export function categoryLabel(category: string, locale: Locale): string {

  const c = CATEGORY_LABELS[category];
  if (!c) return category;
  // Only English + Chinese have localized category labels; others use English.
  return locale === "zh" ? c.zh : c.en;
}

export function localizedName(
  item: { name: string; nameEn: string },
  locale: Locale,
): string {
  // Place/city records only carry zh + English names; non-zh locales show English.
  return locale === "zh" ? item.name : item.nameEn;
}


export function priceLevelLabel(level: number): string {
  return "¥".repeat(Math.max(1, Math.min(4, level)));
}
