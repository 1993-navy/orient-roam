// Lightweight bilingual support (English-first + Chinese).
// Place/city records carry both `name` (zh) and `nameEn`, so switching locale
// also switches which name is shown. UI strings live in the dictionary below.

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const CATEGORY_LABELS: Record<string, { en: string; zh: string; emoji: string }> = {
  FOOD: { en: "Food", zh: "美食", emoji: "🍜" },
  ATTRACTION: { en: "Attractions", zh: "名胜古迹", emoji: "🏯" },
  HOTEL: { en: "Stay", zh: "住宿", emoji: "🛏️" },
  NATURE: { en: "Nature", zh: "自然风景", emoji: "⛰️" },
  NIGHTLIFE: { en: "Nightlife", zh: "夜生活", emoji: "🍸" },
  SHOPPING: { en: "Shopping", zh: "购物", emoji: "🛍️" },
};

export const MEETUP_TYPE_LABELS: Record<string, { en: string; zh: string; emoji: string }> = {
  MEAL: { en: "Group meal (拼饭)", zh: "拼饭", emoji: "🍽️" },
  SHOPPING: { en: "Group order (拼单)", zh: "拼单", emoji: "🛒" },
  TRIP: { en: "Travel buddy (搭子)", zh: "搭子", emoji: "🧭" },
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
  backToExplore: string;
  noReviews: string;
  startMeetup: string;
  join: string;
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
  price: string;
  rating: string;
  any: string;
  endOfList: string;
  noResults: string;
  loadingMore: string;
  newChat: string;
  noConversations: string;
  selectConversation: string;
};

export const UI: Record<Locale, UIStrings> = {
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
    backToExplore: "Back to explore",
    noReviews: "No reviews yet — be the first!",
    startMeetup: "Start a meetup",
    join: "Join",
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
    price: "Price",
    rating: "Rating",
    any: "Any",
    endOfList: "You've reached the end",
    noResults: "No matches — try adjusting your filters.",
    loadingMore: "Loading more…",
    newChat: "New chat",
    noConversations: "No conversations yet",
    selectConversation: "Select a chat to start messaging",
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
    backToExplore: "返回探索",
    noReviews: "还没有评价——来当第一个吧！",
    startMeetup: "发起活动",
    join: "加入",
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
    price: "价格",
    rating: "评分",
    any: "不限",
    endOfList: "已经到底啦",
    noResults: "没有匹配结果——试试调整筛选条件。",
    loadingMore: "加载中……",
    newChat: "发起聊天",
    noConversations: "还没有会话",
    selectConversation: "选择一个会话开始聊天",
  },
};

export function categoryLabel(category: string, locale: Locale): string {
  const c = CATEGORY_LABELS[category];
  return c ? c[locale] : category;
}

export function localizedName(
  item: { name: string; nameEn: string },
  locale: Locale,
): string {
  return locale === "zh" ? item.name : item.nameEn;
}

export function priceLevelLabel(level: number): string {
  return "¥".repeat(Math.max(1, Math.min(4, level)));
}
