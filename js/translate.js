let translate_icon_1 = chrome.runtime.getURL("logo/pro-translation_1.png");
let translate_icon_2 = chrome.runtime.getURL("logo/pro-translation_2.png");

let is_translate_enabled = false;
let is_translate_message_used = false;
let is_translate_btn_clicked = false;
let languageNames = new Intl.DisplayNames(["en"], { type: "language" });
let currentLanguage = "en";
let last_day_since_translate_used = "";
let count_of_days_translate_used = 0;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getConversationHost() {
  const main = document.querySelector('#main');
  if (main) return main;
  
  const msgs = document.querySelector('[data-testid="conversation-panel-messages"], [data-testid="chat-list"], [data-testid="conversation-panel-wrapper"]');
  if (msgs) return msgs;
  
  const composer = document.querySelector('[contenteditable="true"][data-lexical-editor], footer [contenteditable="true"]');
  if (composer && composer.closest('#main')) return composer.closest('#main');
  
  return document.body || null;
}

async function ensureConversationHost(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const host = getConversationHost();
    if (host) return host;
    await sleep(300);
  }
  return null;
}

(function initVars() {
  chrome.storage.local.get(
    [
      "currentLanguage",
      "isTranslateMessageUsed",
      "lastDaySinceTranslateMessageUsed",
      "countOfDaysTranslateMessageUsed",
    ],
    (res) => {
      currentLanguage = res.currentLanguage || "default";
      is_translate_message_used = res.isTranslateMessageUsed || false;
      last_day_since_translate_used =
        res.lastDaySinceTranslateMessageUsed || "";
      count_of_days_translate_used = res.countOfDaysTranslateMessageUsed || 0;
    }
  );
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "translate_language") currentLanguage = request.language;
});

// === Start of Translating Messages ===
function replace_HTML_tags(original_message) {
  let text = original_message;
  Object.keys(REPLACEMENT_HTML_TAGS).forEach((key) => {
    let tag = REPLACEMENT_HTML_TAGS[key];
    text = text.replaceAll(tag.replacement_regex, tag.replacement_pattern);
  });

  let tempElement = document.createElement("div");
  tempElement.innerHTML = text;
  text = tempElement.innerText;

  return text;
}

function replace_back_HTML_tags(translated_text, original_message) {
  let text = translated_text;
  Object.keys(REPLACEMENT_HTML_TAGS).forEach((key) => {
    let tag = REPLACEMENT_HTML_TAGS[key];
    if (tag.replaceback_regex) {
      text = text.replaceAll(tag.replaceback_regex, tag.replaceback_pattern);
    } else {
      let original_tags = original_message.match(tag.replacement_regex);
      if (original_tags) {
        original_tags.forEach(
          (original_tag) =>
            (text = text.replace(tag.replacement_pattern, original_tag))
        );
      }
      text = text.replaceAll(tag.replacement_pattern, "");
    }
  });
  return text;
}

function is_valid_translation(
  detected_language,
  targeted_language,
  original_text,
  translated_text
) {
  if (!detected_language || !translated_text) return false;
  if (
    detected_language === targeted_language ||
    original_text == translated_text
  )
    return false;
  let normalized_original_text = original_text
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
  let normalized_translated_text = translated_text
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();

  if (normalized_original_text === normalized_translated_text) return false;
  return true;
}

// For translating message's html
async function translate_message_HTML(original_message, targeted_language) {
  if (
    original_message === undefined ||
    original_message === null ||
    original_message.trim().length === 0
  )
    return "";
  let original_text = replace_HTML_tags(original_message);

  return await new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: 'TRANSLATE_TEXT', q: original_text, sl: 'auto', tl: targeted_language },
        (resp) => {
          if (chrome.runtime.lastError || !resp || !resp.ok) {
            return resolve([null, null]);
          }
          const detected_language = resp.detected;
          const translated_text = resp.translated || original_text;

          if (
            is_valid_translation(
              detected_language,
              targeted_language,
              original_text,
              translated_text
            )
          ) {
            const translated_message = replace_back_HTML_tags(
              translated_text,
              original_message
            );
            resolve([detected_language, translated_message]);
          } else {
            resolve([null, null]);
          }
        }
      );
    } catch (err) {
      resolve([null, null]);
    }
  });
}

function is_in_viewport(childElement, parentElement) {
  if (!childElement || !parentElement) return false;

  const childRect = childElement.getBoundingClientRect();
  const parentRect = parentElement.getBoundingClientRect();

  return (
    childRect.bottom >= parentRect.top && childRect.top <= parentRect.bottom
  );
}

function get_detected_language_names(detected_languages_set) {
  let size = detected_languages_set.size;
  if (size === 1) return [...detected_languages_set][0];
  if (size === 2) return [...detected_languages_set].sort().join(", ");
  return "Multiple Languages";
}

function add_traslate_button() {
  let existing = document.getElementById("translate_div");
  if (existing) return;

  let translate_div = document.createElement("div");
  translate_div.id = "translate_div";
  translate_div.className = "hide";
  translate_div.innerHTML = `
        <div id="translate_message_btn" class="btn" style="display: ${
          is_translate_enabled ? "none" : "flex"
        }; text-transform:none;">
            <img src="${translate_icon_1}" class="translate_icon" width="17px"/>
            <div><span id="detected_language_names"></span> > <span id="targeted_language_name"></span></div>
            <span class="highlight" style="text-transform:none;">Translate Message</span>
        </div>
        <div id="original_message_btn" class="btn" style="display: ${
          is_translate_enabled ? "flex" : "none"
        }">
            <img src="${translate_icon_2}" class="translate_icon" width="17px"/>
            <span class="highlight">View Original</span>
        </div>`;

  (async () => {
    const host = await ensureConversationHost(15000);
    if (!host) {
      console.debug("[translate] no host found; mounting to body as fallback");
      (document.body || document.documentElement).appendChild(translate_div);
    } else {
      try {
        host.prepend(translate_div);
      } catch {
        host.insertBefore(translate_div, host.firstChild || null);
      }
    }
  })();

  translate_div.addEventListener("click", translate_all_messages);
}

function update_translate_button() {
  let targeted_language =
    currentLanguage === "default" ? "en" : currentLanguage;

  // If translate button does not exists add it to document
  if (!document.getElementById("translate_div")) {
    add_traslate_button();
  }
  let translate_div = document.getElementById("translate_div");
  if (!translate_div) return;

  // Update translate button's info - detected languages and targeted languages
  let conversation_panel = getDocumentElement("conversation_panel");
  let all_messages_div = document.querySelectorAll(".message-in");
  let visible_messages_div = Array.from(all_messages_div).filter(
    (message_div) => is_in_viewport(message_div, conversation_panel)
  );

  let detected_languages_set = new Set();
  visible_messages_div.forEach((message_container) => {
    if (message_container.querySelector(".detected_language_name")) {
      let detected_language_name = message_container.querySelector(
        ".detected_language_name"
      ).innerText;
      detected_languages_set.add(detected_language_name);
    }
  });

  if (detected_languages_set.size === 0) {
    translate_div.classList.add("hide");
    translate_div.classList.remove("show");
    return;
  }

  let detected_language_names = get_detected_language_names(
    detected_languages_set
  );
  let targeted_language_name = languageNames.of(targeted_language);

  translate_div.classList.add("show");
  translate_div.classList.remove("hide");
  translate_div.querySelector("#detected_language_names").innerText =
    detected_language_names;
  translate_div.querySelector("#targeted_language_name").innerText =
    targeted_language_name;

  // Add shimmer effect to the button
  if (
    !is_translate_message_used &&
    !translate_div.classList.contains("shimmer")
  ) {
    translate_div.classList.add("shimmer");
    setTimeout(() => translate_div.classList.remove("shimmer"), 7000);
  }
}

// Get message div of whatsapp
function get_message_div(message_container) {
  let message_parent_div = message_container.querySelector(".selectable-text");
  let spans = message_parent_div.querySelectorAll(":scope > span");

  if (spans.length > 1) {
    let merged_html = "";
    // spans.forEach(span => merged_html += '\n' + span.innerHTML);
    merged_html += Array.from(spans)
      .map((span) => span.innerHTML)
      .filter((html) => html.trim().length > 0)
      .join("\n");

    let new_span = document.createElement("span");
    new_span.className = spans[0]?.className;
    new_span.innerHTML = merged_html;

    if (is_translate_btn_clicked) {
      message_parent_div.innerHTML = "";
      message_parent_div.appendChild(new_span);
    } else {
      return new_span;
    }
  }

  let message_div = message_parent_div.querySelector(":scope > span");
  return message_div;
}

// Replace message to original or translated
function replace_message(message_container) {
  if (
    !message_container.querySelector(".selectable-text") ||
    !message_container.querySelector(".translated_message")
  )
    return;
  let message_div = get_message_div(message_container);

  let translated_message = message_container.querySelector(
    ".translated_message"
  ).innerHTML;
  let original_message =
    message_container.querySelector(".original_message").innerHTML;
  let targeted_language_code = message_container.querySelector(
    ".targeted_language_code"
  ).innerText;
  let detected_language_code = message_container.querySelector(
    ".detected_language_code"
  ).innerText;

  if (is_translate_enabled) {
    message_div.innerHTML = translated_message;
    message_div.setAttribute(
      "dir",
      RTL_LANGUAGE_CODES.includes(targeted_language_code) ? "rtl" : "ltr"
    );
  } else if (is_translate_btn_clicked) {
    message_div.innerHTML = original_message;
    message_div.setAttribute(
      "dir",
      RTL_LANGUAGE_CODES.includes(detected_language_code) ? "rtl" : "ltr"
    );
  }
}

// Translate all messages when translate button is clicked
function translate_all_messages() {
  is_translate_enabled = !is_translate_enabled;
  is_translate_btn_clicked = true;
  let all_message_div = document.querySelectorAll(".message-in");

  all_message_div.forEach((message_container) => {
    // Replace message's html to it's translated html or original html based on "is_translate_enabled"
    replace_message(message_container);
  });

  document.getElementById("original_message_btn").style.display =
    is_translate_enabled ? "flex" : "none";
  document.getElementById("translate_message_btn").style.display =
    is_translate_enabled ? "none" : "flex";

  // Handle translate btn click actions
  let translate_div = document.getElementById("translate_div");
  if (is_translate_enabled) {
    let today = new Date().toDateString();
    if (
      today == last_day_since_translate_used ||
      count_of_days_translate_used >= 5
    ) {
      translate_div.classList.remove("shimmer");
    } else {
      translate_div.classList.add("shimmer");
      setTimeout(() => translate_div.classList.remove("shimmer"), 3000);

      last_day_since_translate_used = today;
      count_of_days_translate_used++;
      chrome.storage.local.set({
        lastDaySinceTranslateMessageUsed: last_day_since_translate_used,
        countOfDaysTranslateMessageUsed: count_of_days_translate_used,
      });
    }
  } else {
    translate_div.classList.remove("shimmer");
  }
  is_translate_message_used = true;
  chrome.storage.local.set({ isTranslateMessageUsed: true });
   
}

// Translate visible messages on scroll event and store translated data in the message
function translate_visible_messages() {
  let targeted_language =
    currentLanguage === "default" ? "en" : currentLanguage;

  let visible_messages_div = document.querySelectorAll(".message-in");
  // let visible_messages_div = document.querySelectorAll('.message-in');
  visible_messages_div.forEach(async (message_container, index) => {
    // Check if its already visited / translated or not
    if (
      !message_container.querySelector(".translated_message_div") &&
      message_container.querySelector(".selectable-text")
    ) {
      // Append translated_message_div to mark this message_container as visited
      let translated_message_div = document.createElement("div");
      translated_message_div.className = "translated_message_div";
      translated_message_div.hidden = true;
      message_container.appendChild(translated_message_div);

      // let message = message_container.querySelector('.selectable-text span');
      let message = get_message_div(message_container);

      if (message && message.innerText.length > 0) {
        let original_message = message.innerHTML;
        let [detected_language, translated_message] =
          await translate_message_HTML(original_message, targeted_language);

        // If translated_message is valid then store it in "translated_message_div"
        if (detected_language && translated_message) {
          translated_message_div.innerHTML = `
                        <div class="targeted_language_code">${targeted_language}</div>
                        <div class="detected_language_code">${detected_language}</div>
                        <div class="targeted_language_name">${languageNames.of(
                          targeted_language
                        )}</div>
                        <div class="detected_language_name">${languageNames.of(
                          detected_language
                        )}</div>
                        <div class="translated_message">${translated_message}</div>
                        <div class="original_message">${original_message}</div>
                    `;

          // Replace message's html to it's translated html or original html based on "is_translate_enabled"
          replace_message(message_container);

          // For opening mentioned contact number (which is not working due to translation)
          message_container.addEventListener("click", (e) => {
            let number_id =
              e.target.dataset.jid || e.target.parentNode.dataset.jid || "";
            if (number_id && number_id.includes("@c.us")) {
              openNumber(number_id.split("@c.us")[0], "");
            }
          });
        }
      }
    }
    // If all visible messages are visited, update translate button info
    if (index == visible_messages_div.length - 1) {
      update_translate_button();
    }
  });
}

// Initiate translate message feature
async function translate_messages() {
  let conversation_panel = getDocumentElement("conversation_panel");
  if (!conversation_panel) return;

  const host = await ensureConversationHost(15000);
  if (!host || !document.querySelector('#main')) {
    console.debug("[translate] UI suppressed (no chat open yet).");
    return;
  }
  
  add_traslate_button();
  let is_scrolling = null;
  is_translate_btn_clicked = is_translate_enabled;

  // Translate visible messages on each scroll event
  let previous_scroll_pos = conversation_panel.scrollTop;

  function handleScroll(first_time = false) {
    let scroll_diff = Math.abs(
      conversation_panel.scrollTop - previous_scroll_pos
    );
    if (first_time || scroll_diff > 33) {
      previous_scroll_pos = conversation_panel.scrollTop;
      translate_visible_messages();
    }

    // Handle scroll-stop actions
    window.clearTimeout(is_scrolling);
    let today_yesterday_div = getDocumentElement("today_yesterday_div");
    let translate_div = document.getElementById("translate_div");
    if (translate_div) {
      if (today_yesterday_div) {
        translate_div.style.top = "35px";
        is_scrolling = setTimeout(
          () => (translate_div.style.top = "0px"),
          3200
        );
      } else {
        translate_div.style.top = "0px";
      }
    }
  }

  // Initiate translate on visible messages
  conversation_panel.addEventListener("scroll", handleScroll);
  handleScroll(true);
}
// === End of Translating Messages ===

// === Start of Translating Text ======
async function translate(
  text,
  sourceLanguage = "en",
  targetLanguage = currentLanguage
) {
  if (text === undefined || text === null || text.trim().length === 0)
    return "";

  // Check if the translation is already in cache
  return new Promise((resolve) => {
    chrome.storage.local.get(["translatedCache"], async function (result) {
      const cache = result.translatedCache || {};

      if (cache[text] && cache[text][targetLanguage]) {
        resolve(cache[text][targetLanguage]);
      } else {
        const translatedText = await translateAPI(
          text,
          sourceLanguage,
          targetLanguage
        );

        if (!cache[text]) cache[text] = {};
        cache[text][targetLanguage] = translatedText;

        chrome.storage.local.set({ translatedCache: cache }, function () {
          resolve(translatedText);
        });
      }
    });
  });
}

async function translateAPI(
  text,
  sourceLanguage = "en",
  targetLanguage = currentLanguage
) {
  let filter = (normalText) =>
    normalText.replaceAll(/<<(.*?)>>/gi, '<span class="styled_text">$1</span>');
  if (text === undefined || text === null || text.trim().length === 0)
    return "";
  if (targetLanguage === "default" || targetLanguage === sourceLanguage)
    return filter(text);

  return await new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: 'TRANSLATE_TEXT', q: text, sl: sourceLanguage, tl: targetLanguage },
        (resp) => {
          if (chrome.runtime.lastError || !resp || !resp.ok) {
            return resolve(filter(text));
          }
          resolve(filter(resp.translated || text));
        }
      );
    } catch (err) {
      resolve(filter(text));
    }
  });
}
// === End of Translating Text ===
