// 'Did you know' tips
let DID_YOU_KNOW_TIPS = [
  "You can add batching to reduce the chances of getting your number banned",
  "You can increase the time gap or change it to random to reduce the chances of getting your number banned",
  "You can create a business chat link for your business/organisation's website with the 'Business chat link' feature on the bottom left of the extension",
  "You can request for voice call and video call support",
  "You can customise your messages to the customer while sending messages",
  "You can edit and create your own quick responses to respond to messages faster and efficiently",
];

// Trial and Premium Features list
let TRIAL_FEATURES = [
  "Export Group Contacts",
  "Translate Conversation",
  "Quick Replies",
  "Customizable Time Gap",
  "Random Time Gap",
  "Chat Support",
  "Batching",
  "Caption",
  "Save Message Template",
  "Detailed Delivery report",
];
let PREMIUM_FEATURES = [
  "Schedule ",
  "Business Chat Link ",
  "Meet/Zoom Support ",
  "Multiple Attachments ",
];

// Premium/Advance feature reminder popup data
let PREMIUM_REMINDER = {
  // Premium Features
  time_gap: {
    title: "Default time gap is 30 seconds",
    description: "to randomize or customize the time gap",
  },
  download_group_contacts: {
    title: "Export group contacts is a Premium feature",
    description: "to download group contacts",
  },
  smart_reply: {
    title: "Quick reply is a Premium feature",
    description: "to use quick reply",
  },
  batching: {
    title: "Batching is a Premium feature",
    description: "to use batching",
  },
  stop_campaign: {
    title: "Stop campaign is a Premium feature",
    description: "to stop your campaign",
  },
  send_message: {
    title: "Your Premium Plan has expired",
    description: "to send messages",
  },

  // Advance Features
  schedule: {
    title: "Scheduling is an Advance Plan feature",
    description: "to schedule your messages",
  },
  business_chat_link: {
    title: "Business chat link is only for Advance Plan users",
    description: "to generate a business chat link",
  },
  zoom_call_support: {
    title: "Zoom call support is only for Advance Plan users",
    description: "to request zoom call support",
  },
  multiple_attachments: {
    title: "You can only send 1 attachment at a time",
    description: "to send multiple attachments",
  },
  pause_campaign: {
    title: "Pause campaign is an Advance Plan feature",
    description: "to pause your campaign",
  },
  resume_campaign: {
    title: "Resume campaign is an Advance Plan feature",
    description: "to resume your campaign",
  },
  download_chat_contacts: {
    title: "Export chat contacts is an Advance feature",
    description: "to download chat contacts",
  },

  // Default data
  default: {
    title: "",
    description: "to continue using that feature",
  },
};

let SUCCESS_POPUP_DATA = {
  advance_promo_activated: {
    icon: "success_gif",
    title: "Congrats!",
    description: "You're now using Advance Premium",
    background_color: "#f99909",
    action_button: {
      text: "Okay",
      class: "action-green-btn",
      id: "close_advance_promo_activated_popup",
    },
  },
};

// Plan reminder / expired popup's data
let POPUP_DATA = {
  common: {
    recommend_text: "Value for money",
    discount_text: "Discount applicable for only first month",
    purchase_note:
      "While purchasing, please enter the WhatsApp number you want to send messages from",
  },
  free_trial_start: {
    heading: "Congratulations!",
    title: "You get free trial for PREMIUM features!",
    icon: "free_trial_src",
    note: "Note: Main features will remain free even after trial",
    background_color: "#fff",
    action_button: {
      text: "Okay",
      class: "action-green-btn",
      id: "close_free_trial_start_popup",
    },
  },
  free_trial_reminder: {
    title: "Your trial of PREMIUM features expires in {VAR_DATE_DIFF} days!",
    description: "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
    background_color: "#f99909",
    pricing_buttons: true,
    recommend_price: false,
    discount_text: true,
    purchase_note: true,
    close_button: true,
  },
  free_trial_expired: {
    title: "Your trial for PREMIUM features has expired!! But do not worry",
    description: "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
    icon: "wall_clock_white_icon",
    background_color: "#80C0B7",
    pricing_buttons: true,
    recommend_price: false,
    discount_text: true,
    purchase_note: true,
    close_button: true,
  },
  advance_promo_start: {
    heading: "Congratulations!",
    title:
      "You've received a coupon for {VAR_DATE_DIFF} days of Advance Premium for Free!",
    icon: "advance_promo_src",
    background_color: "#A480C0",
    action_button: {
      text: "Claim Now!",
      class: "action-green-btn claim-advance-promo",
      id: "close_advance_promo_start_popup",
    },
  },
  advance_promo_reminder: {
    title:
      "Your Advance Promo of PREMIUM features expires in {VAR_DATE_DIFF} days! But do not worry",
    description: "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
    background_color: "#A480C0",
    pricing_buttons: true,
    recommend_price: false,
    discount_text: true,
    purchase_note: true,
    close_button: true,
  },
  advance_promo_expired: {
    title:
      "Your Advance Promo for PREMIUM features has expired!! But do not worry",
    description: "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
    background_color: "#A480C0",
    icon: "wall_clock_white_icon",
    pricing_buttons: true,
    recommend_price: false,
    discount_text: true,
    purchase_note: true,
    close_button: true,
  },
  premium_expired: {
    title: "Your PREMIUM features {VAR_EXP_TEXT}! BUT don’t worry...",
    background_color: "#80C0B7",
    icon: "wall_clock_white_icon",
    pricing_buttons: true,
    purchase_note: true,
    close_button: true,
  },
};

// Country Map for Pricing Data
const COUNTRY_WITH_SPECIFIC_PRICING = {
  IN: "india",
  ID: "indonesia",
  AE: "uae",
  EG: "egypt",
  GB: "uk",
  SA: "saudi_arabia",
  KW: "kuwait",
  SG: "singapore",
  IL: "israel",
};

// PRICING DATA
let BASIC_DISCOUNTED_PRICE = {
  india: "489*",
  indonesia: "55300* IDR",
  international: "$9.09*",
  uae: "AED 44.09*",
  egypt: "EGP 307.99*",
  kuwait: "$11.19*",
  singapore: "SGD 16.79*",
  israel: "ILS 44.09*",
  uk: "GBP 9.79*",
  saudi_arabia: "SAR 39.89*",
};

let BASIC_NORMAL_PRICE = {
  india: "584",
  indonesia: "65850 IDR",
  international: "$10.80",
  uae: "AED 52.49",
  egypt: "EGP 366.66",
  kuwait: "$13.33",
  singapore: "SGD 19.99",
  israel: "ILS 52.5",
  uk: "GBP 11.6",
  saudi_arabia: "SAR 47.5",
};

let BASIC_ACTUAL_PRICE = {
  international: "$12.99",
  india: "699",
  indonesia: "IDR 79000",
  uae: "AED 62.99",
  egypt: "EGP 439.99",
  kuwait: "$15.99",
  singapore: "SGD 23.99",
  israel: "ILS 62.99",
  uk: "GBP 13.99",
  saudi_arabia: "SAR 56.99",
};

let ADVANCE_DISCOUNTED_PRICE = {
  india: "594*",
  indonesia: "69300* IDR",
  international: "$11.19*",
  uae: "AED 51.79*",
  egypt: "EGP 370.99*",
  kuwait: "$13.29*",
  singapore: "SGD 19.59*",
  israel: "ILS 51.79*",
  uk: "GBP 11.89*",
  saudi_arabia: "SAR 53.19*",
};

let ADVANCE_NORMAL_PRICE = {
  india: "709",
  indonesia: "82500 IDR",
  international: "$13.30",
  uae: "AED 61.66",
  egypt: "EGP 441.66",
  kuwait: "$15.83",
  singapore: "SGD 23.33",
  israel: "ILS 61.6",
  uk: "GBP 14.2",
  saudi_arabia: "SAR 63.3",
};

let ADVANCE_ACTUAL_PRICE = {
  international: "$15.99",
  india: "849",
  indonesia: "IDR 99000",
  uae: "AED 73.99",
  egypt: "EGP 529.99",
  kuwait: "$18.99",
  singapore: "SGD 27.99",
  israel: "ILS 73.99",
  uk: "GBP 16.99",
  saudi_arabia: "SAR 75.99",
};

let MULT25ACCOUNTPRICE = {
  international: "$4",
  india: "213",
  indonesia: "IDR 24750",
  uae: "AED 19",
  egypt: "EGP 133",
  kuwait: "$5",
  singapore: "SGD 7",
  israel: "ILS 19",
  uk: "GBP 5",
  saudi_arabia: "SAR 19",
};

let BASIC_SLASHED_PRICE = {
  international: "$16.99",
  india: "999",
  indonesia: "IDR 109000",
  uae: "AED 89.99",
  egypt: "EGP 628.99",
  kuwait: "$22.99",
  singapore: "SGD 33.99",
  israel: "ILS 89.99",
  uk: "GBP 19.99",
  saudi_arabia: "SAR 81.99",
};

let ADVANCE_SLASHED_PRICE = {
  international: "$20.99",
  india: "1199",
  indonesia: "IDR 139000",
  uae: "AED 105.99",
  egypt: "EGP 756.99",
  kuwait: "$26.99",
  singapore: "SGD 39.99",
  israel: "ILS 105.99",
  uk: "GBP 23.99",
  saudi_arabia: "SAR 108.99",
};

let PRICING_DATA = {
  free_trial_reminder: {
    lastPlan: "freeTrial",
    basic_price: BASIC_DISCOUNTED_PRICE,
    advance_price: ADVANCE_DISCOUNTED_PRICE,
  },
  free_trial_expired: {
    lastPlan: "freeTrial",
    basic_price: BASIC_DISCOUNTED_PRICE,
    advance_price: ADVANCE_DISCOUNTED_PRICE,
  },
  advance_promo_reminder: {
    lastPlan: "freeTrial",
    basic_price: BASIC_DISCOUNTED_PRICE,
    advance_price: ADVANCE_DISCOUNTED_PRICE,
  },
  advance_promo_expired: {
    lastPlan: "freeTrial",
    basic_price: BASIC_DISCOUNTED_PRICE,
    advance_price: ADVANCE_DISCOUNTED_PRICE,
  },
  premium_expired: {
    lastPlan: "planExpired",
    basic_price: BASIC_NORMAL_PRICE,
    advance_price: ADVANCE_NORMAL_PRICE,
  },
  buy_annual: {
    lastPlan: "Basic",
    basic_slashed_price: BASIC_SLASHED_PRICE,
    advance_slashed_price: ADVANCE_SLASHED_PRICE,
    basic_price: BASIC_NORMAL_PRICE,
    advance_price: ADVANCE_NORMAL_PRICE,
    basic_actual_price: BASIC_ACTUAL_PRICE,
    advance_actual_price: ADVANCE_ACTUAL_PRICE,
  },
};

// Untranslatable characters mapping for replacements
let REPLACEMENT_HTML_TAGS = {
  BOLD: {
    replacement_regex: /<strong(.*?)>(.*?)<\/strong>/gi,
    replacement_pattern: "◉☰$2☰◉",
    replaceback_regex: /◉☰(.*?)☰◉/gi,
    replaceback_pattern:
      '<strong class="_ao3e selectable-text copyable-text" data-app-text-template="*${appText}*">$1</strong>',
  },
  ITALIC: {
    replacement_regex: /<em(.*?)>(.*?)<\/em>/gi,
    replacement_pattern: "◈☱$2☱◈",
    replaceback_regex: /◈☱(.*?)☱◈/gi,
    replaceback_pattern:
      '<em class="_ao3e selectable-text copyable-text" data-app-text-template="_${appText}_">$1</em>',
  },
  STRIKETHROUGH: {
    replacement_regex: /<del(.*?)>(.*?)<\/del>/gi,
    replacement_pattern: "◎☲$2☲◎",
    replaceback_regex: /◎☲(.*?)☲◎/gi,
    replaceback_pattern:
      '<del class="_ao3e selectable-text copyable-text" data-app-text-template="~${appText}~">$1</del>',
  },
  CODE: {
    replacement_regex: /<code(.*?)>(.*?)<\/code>/gi,
    replacement_pattern: "▮☳$2☳▮",
    replaceback_regex: /▮☳(.*?)☳▮/gi,
    replaceback_pattern:
      '<code class="_ao3e selectable-text copyable-text x1lcm9me x1yr5g0i xrt01vj x10y3i5r x14bl8p4 x10jhi2x x1e558r4 x150jy0e x1nn3v0j x1120s5i" data-app-text-template="`${appText}`">$1</code>',
  },
  ORDERED_LIST: {
    replacement_regex:
      /<li(.*?)value="(.*?)"(.*?)><span(.*?)>(.*?)<\/span><\/li>/gi,
    replacement_pattern: "❖⚌$2= $5⚌❖",
    replaceback_regex: /❖⚌(.*?)= (.*?)⚌❖/gi,
    replaceback_pattern:
      '<li dir="auto" value="$1" class="x1h0ha7o"><span class="_ao3e selectable-text copyable-text" data-pre-plain-text="$1. ">$2</span></li>',
  },
  UNORDERED_LIST: {
    replacement_regex: /<li(.*?)><span(.*?)>(.*?)<\/span><\/li>/gi,
    replacement_pattern: "⚉⚏$3⚏⚉",
    replaceback_regex: /⚉⚏(.*?)⚏⚉/gi,
    replaceback_pattern:
      '<li dir="auto" class="x1ye3gou x1jieuv1 xo7wnuk x1sy0ulg xt1y1ed xlu7um4 xm78dhd x1r4uxqn"><span class="_ao3e selectable-text copyable-text" data-pre-plain-text="- ">$1</span></li>',
  },
  EMOJI: {
    replacement_regex: /<img(.*?)>/gi,
    replacement_pattern: "▣▤▥",
  },
  MENTION: {
    replacement_regex:
      /<span role="button"(.*?)><span(.*?)>(.*?)<span(.*?)>(.*?)<\/span><\/span><\/span>/gi,
    replacement_pattern: "▩▨▧",
  },
  LINK: {
    replacement_regex: /<a(.*?)>(.*?)<\/a>/gi,
    replacement_pattern: "◬◭◮",
  },
  ORDERED_LIST_START: {
    replacement_regex: /<ol(.*?)>/gi,
    replacement_pattern: "🀞🀝🀜",
  },
  ORDERED_LIST_END: {
    replacement_regex: /<\/ol>/gi,
    replacement_pattern: "🀜🀝🀞",
  },
  UNORDERED_LIST_START: {
    replacement_regex: /<ul(.*?)>/gi,
    replacement_pattern: "🀕🀔🀓",
  },
  UNORDERED_LIST_END: {
    replacement_regex: /<\/ul>/gi,
    replacement_pattern: "🀓🀔🀕",
  },
};

//Classes or Selectors used in whatsapp content
let DOCUMENT_ELEMENT_SELECTORS = {
  left_side_contacts_panel: ["#pane-side"],
  contact_profile_div: ["img.x1hc1fzr._ao3e"],
  today_yesterday_div: ["._1fyro", "._ao3e"],
  profile_header: ["._604FD", "._ak0z", "span.x1okw0bk"],
  conversation_panel: [
    '[data-testid="conversation-panel-messages"]',
    "._5kRIK",
    "._ajyl",
  ],
  conversation_panel_wrapper: [
    '[data-testid="conversation-panel-body"]',
    "._3B19s",
    "._amm9",
  ],
  conversation_header: ['[data-testid="conversation-header"]', "#main header"],
  conversation_header_name_div: ["._amie"],
  conversation_message_div: [
    '[data-testid^="conv-msg"]',
    '[data-id^="true"]',
    '[data-id^="false"]',
  ],
  conversation_non_message_div: [".focusable-list-item"],
  conversation_title_div: [
    '[data-testid="conversation-info-header-chat-title"]',
    "#main header span",
  ],
  conversation_compose_div: [
    '[data-testid="conversation-compose-box-input"]',
    "._4r9rJ",
    "._ak1p",
    "._ak1r",
  ],
  block_message_div: ['[data-testid="block-message"]', "._1alON"],
  input_message_div: ['#main [contenteditable="true"][role="textbox"]'],
  footer_div: ["footer._3E8Fg", "footer._ak1i"],
  new_chat_btn: ['[data-icon="new-chat-outline"]'],
  new_chat_parent: ['[aria-label="New chat"]'],
  starting_chat_popup: ['[data-animate-modal-popup="true"]:has(svg circle)'],
  invalid_chat_popup: [
    '[data-animate-modal-popup="true"]:not(:has(svg circle))',
  ],
  invalid_popup_ok_btn: [
    '[data-testid="popup-controls-ok"]',
    '[data-animate-modal-popup="true"]:not(:has(svg circle)) button',
  ],
  send_message_btn: ['span[data-icon="send"]'],
};

// Google Analytics Config Data
let GA_CONFIG = {
  GA_ENDPOINT: "https://www.google-analytics.com/mp/collect",
  GA_DEBUG_ENDPOINT: "https://www.google-analytics.com/debug/mp/collect",
  MEASUREMENT_ID: "sdfsfggfdgfg",
  API_SECRET: "dfsdfsfsdf",
  DEFAULT_ENGAGEMENT_TIME_MSEC: 100,
  SESSION_EXPIRATION_IN_MIN: 30,
};



// Languages supported for translation
let ALL_LANGUAGE_CODES = [
  "af",
  "am",
  "an",
  "ar",
  "ast",
  "az",
  "be",
  "bg",
  "bn",
  "br",
  "bs",
  "ca",
  "ckb",
  "co",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "eo",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fil",
  "fo",
  "fr",
  "fy",
  "ga",
  "gd",
  "gl",
  "gn",
  "gu",
  "ha",
  "haw",
  "he",
  "hi",
  "hr",
  "hu",
  "hy",
  "ia",
  "id",
  "is",
  "it",
  "ja",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "ku",
  "ky",
  "la",
  "ln",
  "lo",
  "lt",
  "lv",
  "mk",
  "ml",
  "mn",
  "mo",
  "mr",
  "ms",
  "mt",
  "nb",
  "ne",
  "nl",
  "nn",
  "no",
  "oc",
  "om",
  "or",
  "pa",
  "pl",
  "ps",
  "pt",
  "qu",
  "rm",
  "ro",
  "ru",
  "sd",
  "sh",
  "si",
  "sk",
  "sl",
  "sn",
  "so",
  "sq",
  "sr",
  "st",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "ti",
  "tk",
  "to",
  "tr",
  "tt",
  "tw",
  "ug",
  "uk",
  "ur",
  "uz",
  "vi",
  "wa",
  "xh",
  "yi",
  "yo",
  "zh",
  "zu",
];

// RTL Direction Language codes
const RTL_LANGUAGE_CODES = ["ar", "he", "fa", "ur", "ps", "ug", "sd", "yi"];

// Languages supported for "Help Message"
let HELP_MESSAGE_LANGUAGE_CODES = [
  "en",
  "pt",
  "es",
  "id",
  "ar",
  "zh",
  "ru",
  "fr",
  "it",
  "tr",
  "he",
  "de",
];

// Help Messages
let HELP_MESSAGES = {
  REQUEST_CHAT_SUPPORT_BASIC:
    "Hi, I would like to request chat support.",
  REQUEST_CHAT_SUPPORT_ADVANCE:
    "Hi, I would like to request chat support.",
  REQUEST_ZOOM_SUPPORT_BASIC:
    "Hi, I would like to request video call support.",
  REQUEST_ZOOM_SUPPORT_ADVANCE:
    "Hi, I would like to request video call support.",
  REQUEST_CALL_SUPPORT_ADVANCE:
    "Hi, I would like to request call support.",
  REQUEST_CALL_SUPPORT_BASIC:
    "Hi, I would like to request call support.",
  UNSUBSCRIBE_PLAN: "Hi, I would like to unsubscribe from my plan.",
  LEARN_SCHEDULE: "Hi, I want to learn more about the Schedule feature.",
  NEED_HELP_NON_PREMIUM: "Hi, I need help.",
};

let SHOW_UPDATE_REMINDER_POPUP = false;

// FAQs
let FAQS = [
  {
    question: "Does it work in the desktop app?",
    answer:
      "No, it is a chrome extension and it works only on Google Chrome (Mac, Windows, and Linux).",
  },
  {
    question: "Does it work in my country?",
    answer: "Yes, every country in the world can use the extension.",
  },
  {
    question: "How to send clickable links?",
    answer:
      "You can send a clickable link to anyone who</br>- Either has your number saved in their phone book</br>- Or has replied to you at least once.",
  },
  {
    question: "How to correctly format the numbers column in CSV file?",
    answer:
      "1. Select the numbers column -> Right click -> Click on ‘Format Cells’.</br>2. Go to the ‘Number‘ category -> Go to ‘Decimal Places‘ box</br>3. Change it ‘0’ and click ‘OK’.</br>4. Verify that the numbers are now coming correctly.",
  },
  {
    question: "How to send an attachment?",
    answer:
      "1. Click on 'Add Attachment' and select the type of attachment</br>2. Select the file you want to send</br>3. Your personal chat would open up - send the file in the chat.</br>4. Now open the extension and click on 'Send Message'. Your file will be sent one by one to all the contacts.",
  },
  {
    question:
      "Can I send message to people in a group separately without saving their contacts?",
    answer:
      "Yes, you can. Here's how:</br>1. Open the respective group and click on the extension</br>2. Click on 'Download Group Contacts' and an excel of contact numbers will be downloaded</br>3. Upload this csv and enter the message you want to send in the extension.",
  },
];

// Other Variables
let RUNTIME_CONFIG = {
  reloadInject: false,
  useOldInjectMethod: true,
  useOldMessageSending: true,
};

let FREE_TRIAL_LIMIT = {
  duration1: 90,
  limit1: 1000,
  duration2: 90,
  limit: 1000,
};

const PRICING_PAGE_LINK = {
  india: {
    monthly: {
      basic: "00g7sMawi30A3JucN2",
      advance: "fZe7sMawi30Acg0bIZ",
    },
    annually: {
      basic: "9AQ14o47UdFe6VG7tq",
      advance: "14k9AUgUG9oY3Ju5lj",
    },
    biannually: {
      basic: "5kA7sMeMy0Ss7ZK156",
      advance: "7sIdRadIuat293O3do",
    },
  },
  international: {
    monthly: {
      basic: "4gwbJ25bYgRqa7S9AO",
      advance: "fZeeVe1ZM30Aeo88wL",
    },
    annually: {
      basic: "7sI4gAcEqeJi3JudQW",
      advance: "6oEcN6cEqat2gwg6or",
    },
    biannually: {
      basic: "5kAfZidIu1Ww6VG6po",
      advance: "aEU5kEcEq7gQ7ZKeW4",
    },
  },
  indonesia: {
    monthly: {
      basic: "dR6dRa33Q7gQeo8eV2",
      advance: "28ocN6gUGcBa7ZKdQX",
    },
    annually: {
      basic: "fZe28s8oaat2a7S8wJ",
      advance: "00g7sM7k6gRq3JufZ9",
    },
    biannually: {
      basic: "5kA00k1ZMgRqcg0bJJ",
      advance: "9AQeVebAm58I7ZKdS1",
    },
  },
  uae: {
    monthly: {
      basic: "eVa28scEqeJi7ZKeVE",
      advance: "6oEeVe1ZMfNm7ZK8xf",
    },
    annually: {
      basic: "5kAaEY7k6dFe4NycNu",
      advance: "6oE3cwdIucBadk428P",
    },
    biannually: {
      basic: "00g28s5bY30AgwgeW2",
      advance: "cN2dRa6g2cBa4Ny9BT",
    },
  },
  kuwait: {
    monthly: {
      basic: "7sIbJ27k68kU6VG4gP",
      advance: "6oE8wQ1ZM44Edk4eVw",
    },
    annually: {
      basic: "aEU3cwawi8kU93O7t2",
      advance: "14k5kE9se30A93O14F",
    },
    biannually: {
      basic: "fZe5kEawigRq7ZK29c",
      advance: "cN2bJ2eMygRqbbW15i",
    },
  },
  egypt: {
    monthly: {
      basic: "cN228s8oa8kUfsc4gW",
      advance: "bIY00keMyfNm1Bm28N",
    },
    annually: {
      basic: "00g9AU7k6bx62Fq9Be",
      advance: "4gwcN6awi7gQ93O5kX",
    },
    biannually: {
      basic: "28o6oIawiat23Ju9BJ",
      advance: "8wM5kE5bYat293O29q",
    },
  },
  singapore: {
    monthly: {
      basic: "eVa5kE6g230A4Ny28F",
      advance: "14kbJ233Qat2bbW28E",
    },
    annually: {
      basic: "dR63cwdIu9oYcg014z",
      advance: "fZeeVe8oa8kUeo828G",
    },
    biannually: {
      basic: "aEUdRa47UgRq3Ju3df",
      advance: "7sI8wQ47U9oYa7S8xJ",
    },
  },
  israel: {
    monthly: {
      basic: "8wM7sMeMy6cMeo8eVQ",
      advance: "3cseVe6g27gQ7ZK00V",
    },
    annually: {
      basic: "aEU9AUdIu0Ssfsc3d6",
      advance: "aEUcN6cEqcBa3Ju5ld",
    },
    biannually: {
      basic: "eVa3cw9se6cMbbWdRV",
      advance: "9AQ28sgUGbx63Ju7tH",
    },
  },
  uk: {
    monthly: {
      basic: "aEUcN65bYdFe4Ny4h8",
      advance: "aEUdRa5bY8kUdk47tj",
    },
    annually: {
      basic: "4gw4gA8oa44E5RC6pe",
      advance: "bIY5kEdIu9oY2FqaFt",
    },
    biannually: {
      basic: "cN2bJ2cEq8kUgwg6pu",
      advance: "5kAeVe33Q44E4Ny15k",
    },
  },
  saudi_arabia: {
    monthly: {
      basic: "aEUeVebAm58Ieo8151",
      advance: "14k6oIeMy0Sscg09Bn",
    },
    annually: {
      basic: "4gw5kE7k6dFe4Ny00M",
      advance: "6oEaEY5bY1Wwfsc28T",
    },
    biannually: {
      basic: "28o00kfQC1Wweo83dj",
      advance: "eVaeVe5bYat2eo8cO3",
    },
  },
};
