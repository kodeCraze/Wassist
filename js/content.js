var close_img_src = chrome.runtime.getURL("logo/pro-closeBtn.png");
var free_trial_src = chrome.runtime.getURL("logo/pro-free-trial.png");
var advance_promo_src = chrome.runtime.getURL("logo/pro_advance_promo.png");
var success_gif = chrome.runtime.getURL("logo/pro-success.gif");
var recommend_tick = chrome.runtime.getURL("logo/pro-tickmark.png");
var export_chat_contacts_img_src = chrome.runtime.getURL(
  "logo/pro-export-unsaved-contacts.png"
);
var export_img_src = chrome.runtime.getURL("logo/pro-export.png");
var export_contacts_text_src = chrome.runtime.getURL(
  "logo/pro-export-contact.svg"
);
var email_icon_src = chrome.runtime.getURL("logo/pro-email.png");
var error_icon_src = chrome.runtime.getURL("logo/pro-error.png");
var help_icon_src = chrome.runtime.getURL("logo/pro-help.png");
var read_icon_src = chrome.runtime.getURL("logo/pro-read.png");
var wall_clock_white_icon = chrome.runtime.getURL(
  "logo/pro-wall-clock-white.png"
);
var smile_icon = chrome.runtime.getURL("logo/pro-smile.png");
var logo_img = chrome.runtime.getURL("logo/pro-logo-img.png");
var large_logo_img = chrome.runtime.getURL("logo/large.png");
var medium_logo_img = chrome.runtime.getURL("logo/pro-medium.png");
var logo_text = chrome.runtime.getURL("logo/pro-logo-text.png");
var logo_text_light = chrome.runtime.getURL("logo/pro-logo-text-light.png");
var arrow_left = chrome.runtime.getURL("logo/pro-arrow-left.png");
var arrow_right = chrome.runtime.getURL("logo/pro-arrow-right.png");
var bulb_icon = chrome.runtime.getURL("logo/pro-lightbulb.png");
var how_to_use1 = chrome.runtime.getURL("logo/pro-how-to-use-1.gif");
var how_to_use2 = chrome.runtime.getURL("logo/pro-how-to-use-2.gif");
var how_to_use3 = chrome.runtime.getURL("logo/pro-how-to-use-3.gif");
var man_thinking = chrome.runtime.getURL("logo/pro-man-thinking.png");
var cross_icon_src = chrome.runtime.getURL("logo/pro-close-1.png");
var check_icon_src = chrome.runtime.getURL("logo/pro-check-mark.png");
var eye_visible = chrome.runtime.getURL("logo/pro-eye-visible.png");
var eye_hidden = chrome.runtime.getURL("logo/pro-eye-hidden.png");
var pause_icon_src = chrome.runtime.getURL("logo/pro-pause_logo.png");
var alarm_clock = chrome.runtime.getURL("logo/pro_alarm_clock.png");
var yellow_star = chrome.runtime.getURL("logo/pro_yellow-star.png");
var multiple_users_icon = chrome.runtime.getURL("logo/pro_multiple-users.png");

let link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Palanquin+Dark:wght@400;500;700&family=PT+Sans+Caption&family=Reem+Kufi+Ink&display=swap";
document.head.appendChild(link);

let my_number = null,
  logged_in_user = null,
  plan_type = "Advance",
  last_plan_type = "Basic",
  plan_duration = "";
let expiry_date = null;

var rows = [],
  notifications_hash = {},
  stop = false,
  pause = false,
  groupIdToName = {},
  contactIdToName = {};

let isProfile = false;

var messages = [
  "Hello! how can we help you?",
  "Hello!",
  "Thank you for using service!",
],
  total_messages = 0;

var location_info = {
  name: "international",
  name_code: "US",
  currency: "USD",
  default: true,
};

var cancelDelay;

var init_store_type = null,
  whatsapp_version = null,
  extension_version = chrome.runtime.getManifest().version;

// setting premium usage object in the local
let premiumUsageObject = {
  lastDate: new Date().getDate(),
  lastMonth: new Date().getMonth(),
  attachment: false,
  customisation: false, // feature where???
  groupContactExport: false,
  quickReplies: false,
  caption: false,
  stop: false,
  timeGap: false,
  batching: false,
};

if (isAdvanceFeatureAvailable() || isExpired()) {
  premiumUsageObject = {
    ...premiumUsageObject,
    multipleAttachment: false,
    schedule: false,
  };
}


// For injecting api js
(function addInject() {
  // Inject inject.js
  const injectScript = document.createElement("script");
  injectScript.type = "text/javascript";
  injectScript.id = "inject";
  injectScript.src = chrome.runtime.getURL("/js/inject.js");
  injectScript.onload = function () {
    this.parentNode.removeChild(this);
  };
  document.head.appendChild(injectScript);

  // Inject wppconnect-wa.js
  const wppScript = document.createElement("script");
  wppScript.type = "text/javascript";
  wppScript.id = "wppconnect";
  wppScript.src = chrome.runtime.getURL("/js/wppconnect-wa.js");
  wppScript.onload = function () {
    console.log("✅ WPPConnect.js injected successfully");
    this.parentNode.removeChild(this);
  };


  wppScript.onerror = function () {
    console.error("❌ Failed to inject WPPConnect.js");
  };
  document.head.appendChild(wppScript);
})();

// Inject external chat functions script
function injectChatFunctions() {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL('js/chat-functions.js');
  script.onload = function () {
    console.log('✅ Chat functions injected successfully');
    this.remove();
  };
  script.onerror = function () {
    console.error('❌ Failed to inject chat functions');
  };
  (document.head || document.documentElement).appendChild(script);
}

// Wait for WPP to be ready before injecting
window.addEventListener('load', () => {
  const checkWPP = setInterval(() => {
    if (window.WPP || document.querySelector('#app')) {
      clearInterval(checkWPP);
      setTimeout(injectChatFunctions, 2000); // Wait 2s for WPP to fully load
    }
  }, 500);
});






// InjectJS Message Listener
window.addEventListener("message", injectMessageListner, false);

// Message Bridge for Extension communication
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'CHECK_AUTO_MODE') {
    // Return false as AI features are disabled
    window.postMessage({
      type: 'AUTO_MODE_STATUS',
      enabled: false
    }, '*');
  }

  // Handle Translate or other non-AI features here if needed
}, false);


function injectMessageListner(event) {
  if (event.source != window || !event.data.type) return;

  let message_type = event.data.type;
  let message_payload = event.data.payload;

  // Handle error and success
  if (message_payload) {
    if (message_payload.error) {
    } else if (message_type.includes("send")) {
    }
  }

  // Handle message type
  switch (message_type) {
    case "get_init_store_type":
      init_store_type = localStorage.getItem("pro-sender::init_store_type");
      if (!init_store_type || init_store_type != message_payload) {
        init_store_type = message_payload;
        localStorage.setItem("pro-sender::init_store_type", init_store_type);
      }
      break;

    case "get_whatsapp_version":
      whatsapp_version = localStorage.getItem("pro-sender::whatsapp-version");
      if (!whatsapp_version || whatsapp_version != message_payload) {
        whatsapp_version = message_payload;
        localStorage.setItem("pro-sender::whatsapp-version", whatsapp_version);
      }
      break;

    case "get_all_groups":
      setGroupDataToLocalStorage(message_payload);
      break;

    case "get_all_contacts":
      setContactDataToLocalStorage(message_payload);
      break;

    // Handle send_message responses
    case "send_message_to_number":
      resolveSendMessageToNumber(message_payload);
      break;
    case "send_message_to_number_new_error":
      rejectSendMessageToNumber(message_payload);
      break;

    case "send_message_to_group":
    case "send_message_to_group_error":
      resolveSendMessageToGroup(message_payload);
      break;

    // Handle send_attachments responses
    case "send_attachments_to_number":
    case "send_attachments_to_number_error":
      resolveSendAttachmentsToNumber(message_payload);
      break;

    case "send_attachments_to_group":
    case "send_attachments_to_grpup_error":
      resolveSendAttachmentsToGroup(message_payload);
      break;

    default:
      break;
  }
}
// content.js
chrome.runtime.sendMessage({ type: "CONTENT_READY" }).catch(() => { });

// Chat Extraction: Chrome Extension Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle PING messages for connection testing
  if (request.type === 'PING') {
    sendResponse({ success: true, ready: true });
    return true;
  }
  if (request.action === 'getChatArrays') {
    (async () => {
      try {
        // Use postMessage for communication
        window.postMessage({ type: 'GET_CHAT_DATA' }, '*');

        // Listen for response
        const messageHandler = (event) => {
          if (event.source === window && event.data.type === 'CHAT_DATA_RESPONSE') {
            window.removeEventListener('message', messageHandler);
            sendResponse({ success: true, data: event.data.data });
          } else if (event.source === window && event.data.type === 'CHAT_DATA_ERROR') {
            window.removeEventListener('message', messageHandler);
            sendResponse({ success: false, error: event.data.error });
          }
        };

        window.addEventListener('message', messageHandler);

        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          sendResponse({ success: false, error: 'Timeout' });
        }, 10000);
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Handle send message to specific chat
  if (request.action === 'sendMessageToChat') {
    (async () => {
      try {
        window.postMessage({
          type: 'SEND_MESSAGE_TO_CHAT',
          chatId: request.chatId,
          message: request.message
        }, '*');

        // Wait for response
        const messageHandler = (event) => {
          if (event.source === window && event.data.type === 'SEND_MESSAGE_RESULT') {
            window.removeEventListener('message', messageHandler);
            sendResponse(event.data);
          }
        };

        window.addEventListener('message', messageHandler);

        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          sendResponse({ success: false, error: 'Timeout' });
        }, 5000);
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Handle smart reply generation
  if (request.action === 'generateSmartReply') {
    (async () => {
      try {
        window.postMessage({ type: 'EXECUTE_SCRIPT', script: 'window.generateSmartReply()' }, '*');

        const messageHandler = (event) => {
          if (event.source === window && event.data.type === 'SCRIPT_RESULT') {
            window.removeEventListener('message', messageHandler);
            sendResponse(event.data);
          }
        };

        window.addEventListener('message', messageHandler);

        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          sendResponse({ success: false, error: 'Smart reply generation timeout' });
        }, 15000);
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (request.action === 'executeScript') {
    // Use postMessage to execute script in page context without CSP violations
    try {
      window.postMessage({
        type: 'EXECUTE_SCRIPT',
        script: request.script
      }, '*');

      const messageHandler = (event) => {
        if (event.source === window && event.data.type === 'SCRIPT_RESULT') {
          window.removeEventListener('message', messageHandler);
          sendResponse(event.data);
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        sendResponse({ success: false, error: 'Script execution timeout' });
      }, 10000);

      return true;
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  return false; // Let other listeners handle unknown actions
});





function download_group_contacts() {
  let conv_header = getDocumentElement("conversation_header");
  if (!conv_header) return;

  let conv_msg_div = getDocumentElement("conversation_message_div");
  if (!conv_msg_div || !conv_msg_div.dataset["id"].includes("@g.us")) return;
  let curr_chat_id = conv_msg_div.dataset["id"];

  let group_id = curr_chat_id.split("_")[1];
  let download_group_btn = document.createElement("div");

  let export_contacts_text = document.createElement("span");
  export_contacts_text.classList.add("export_contacts_text");
  let export_contacts_text_class = "";
  let groupTitleElement = getDocumentElement("conversation_title_div");
  let groupTitle = groupTitleElement.innerText;

  if (document.body.classList.contains("dark")) {
    export_contacts_text_class = "export_gif_bright";
  }

  export_contacts_text.innerHTML = ` <img class="export_gif ${export_contacts_text_class}" src=${export_contacts_text_src} />`;

  download_group_btn.id = "download_group_btn";
  download_group_btn.className = "CtaBtn shimmer";
  download_group_btn.innerHTML = `<img src=${export_img_src} />`;
  download_group_btn.appendChild(export_contacts_text);

  chrome.storage.local.get(
    ["coeu862", "ldeu863", "groupDataForShimmer"],
    function (result) {
      let today = new Date().toDateString();
      let coeu862 = result.coeu862 || 0;
      let ldeu863 = result.ldeu863 || "";
      let groupDataForShimmer = result.groupDataForShimmer || [{}];

      if (today !== ldeu863) {
        ldeu863 = today;
        coeu862++;
        chrome.storage.local.set({
          coeu862: coeu862,
          ldeu863: ldeu863,
        });
      }

      if (coeu862 <= 5) {
        let groupIndex = groupDataForShimmer.findIndex(
          (group) => group.groupName === groupTitle
        );
        if (groupIndex !== -1) {
          if (
            groupDataForShimmer[groupIndex].lastShimmerDay !== today &&
            groupDataForShimmer[groupIndex].shimmerCount <= 5
          ) {
            groupDataForShimmer[groupIndex].lastShimmerDay = today;
            groupDataForShimmer[groupIndex].shimmerCount =
              groupDataForShimmer[groupIndex].shimmerCount + 1;
            chrome.storage.local.set({
              groupDataForShimmer: groupDataForShimmer,
            });
          } else {
            download_group_btn.classList.remove("shimmer");
            export_contacts_text.innerHTML = `Export Contacts`;
          }
        } else {
          groupDataForShimmer.push({
            groupName: groupTitle,
            lastShimmerDay: today,
            shimmerCount: 1,
          });
          chrome.storage.local.set({
            groupDataForShimmer: groupDataForShimmer,
          });
        }
        setTimeout(() => {
          download_group_btn.classList.remove("shimmer");
          export_contacts_text.innerHTML = `Export Contacts`;
        }, 5000);
      } else {
        download_group_btn.classList.remove("shimmer");
        export_contacts_text.innerHTML = `Export Contacts`;
      }
    }
  );

  conv_header.insertBefore(download_group_btn, conv_header.childNodes[2]);
  let groupTitleParent = groupTitleElement?.parentElement?.parentElement;
  if (groupTitleElement) {
    groupTitleParent.style.overflowX = "hidden";
  }

  download_group_btn.addEventListener("click", function () {
    if (isPremiumFeatureAvailable()) {
      window.dispatchEvent(
        new CustomEvent("PROS::export-group", {
          detail: {
            groupId: group_id,
          },
        })
      );

    } else {
      premium_reminder("download_group_contacts", "Premium");
    }
    // updating premium usage for group contact export
    chrome.storage.local.get(["premiumUsageObject"], function (result) {
      if (result.premiumUsageObject !== undefined) {
        let updatedPremiumUsageObject = {
          ...result.premiumUsageObject,
          groupContactExport: true,
        };
        chrome.storage.local.set({
          premiumUsageObject: updatedPremiumUsageObject,
        });
      }
    });

  });
}

function profile_header_buttons() {
  const profile_header = getDocumentElement("profile_header");
  if (!profile_header) return;

  const profile_header_buttons_div = document.createElement("div");
  profile_header_buttons_div.id = "profile_header_buttons_div";

  const profile_header_buttons_list = profile_header.children[0];
  profile_header_buttons_list.insertBefore(
    profile_header_buttons_div,
    profile_header_buttons_list.children[0]
  );

  add_profile_header_btn(
    "blur_contacts",
    "Blur chat, contact name and profile picture",
    eye_hidden,
    toggle_blur
  );
  add_profile_header_btn(
    "download_unsaved_contacts",
    "Export unsaved contacts",
    export_chat_contacts_img_src,
    download_unsaved_contacts
  );
  add_profile_header_btn(
    "export_broadcast_contacts",
    "Export group broadcast contacts",
    export_img_src,
    export_broadcast_contacts
  );

  // Handle other
  const new_chat_btn = getDocumentElement("new_chat_btn");
  if (new_chat_btn && !new_chat_btn.classList.contains("CtaBtn")) {
    new_chat_btn.classList.add("CtaBtn");
  }
  const new_chat_parent = getDocumentElement("new_chat_parent");
  if (new_chat_parent) {
    new_chat_btn.title = "";
    handleShowTooltip({
      query: DOCUMENT_ELEMENT_SELECTORS["new_chat_parent"][0],
      text: "New chat",
      bottom: "-30px",
    });
  }
}

function add_profile_header_btn(btn_id, btn_title, btn_image = null, on_click) {
  const profile_header_buttons_div = document.querySelector(
    "#profile_header_buttons_div"
  );
  if (!profile_header_buttons_div) return;

  const existing_btn = document.querySelector(`#${btn_id}`);
  if (existing_btn) return;

  const btn = document.createElement("div");
  btn.id = btn_id;
  btn.classList.add("profile_header_button");
  btn.innerHTML = `<img src=${btn_image} class='${btn_id}_icon CtaBtn' alt='${btn_id}'>`;
  btn.addEventListener("click", on_click);

  profile_header_buttons_div.appendChild(btn);
  handleShowTooltip({
    query: `#${btn_id}`,
    text: btn_title,
    bottom: "-30px",
  });
}

function download_unsaved_contacts() {
  if (isAdvanceFeatureAvailable()) {
    window.dispatchEvent(
      new CustomEvent("PROS::export-unsaved-contacts", {
        detail: { type: "Advance" },
      })
    );

  } else {
    window.dispatchEvent(
      new CustomEvent("PROS::export-unsaved-contacts", {
        detail: { type: "Expired" },
      })
    );
  }

  // Update premium usage
  chrome.storage.local.get(["premiumUsageObject"], (result) => {
    if (result.premiumUsageObject !== undefined) {
      let updatedPremiumUsageObject = {
        ...result.premiumUsageObject,
        downloadUnsavedContacts: true,
      };
      chrome.storage.local.set({
        premiumUsageObject: updatedPremiumUsageObject,
      });
    }
  });


}

function export_broadcast_contacts() {
  try {
    window.dispatchEvent(
      new CustomEvent("PROS::export-saved-contacts", {
        detail: { savedState: "any", groupName: null }
      })
    );
  } catch (err) {
    console.error("export_broadcast_contacts error", err);
  }
}


function toggle_blur(click_event) {
  try {
    const blurContactsBtn = document.getElementById("blur_contacts");
    const isBlurred = blurContactsBtn.classList.contains("blurred");

    // Elements to blur
    const reply_div = document.querySelector("#reply_div");
    const left_side_contacts_panel = getDocumentElement(
      "left_side_contacts_panel"
    );
    const conversation_header_name_div = getDocumentElement(
      "conversation_header_name_div"
    );

    const contact_profile_divs = getDocumentElement(
      "contact_profile_div",
      true
    );
    const conversation_message_divs = getDocumentElement(
      "conversation_message_div",
      true
    );
    const conversation_non_message_divs = getDocumentElement(
      "conversation_non_message_div",
      true
    );

    const elementsToToggle = [
      reply_div,
      left_side_contacts_panel,
      conversation_header_name_div,
      ...contact_profile_divs,
      ...conversation_message_divs,
      ...conversation_non_message_divs,
      // Add other elements as needed
    ];

    elementsToToggle.forEach((element) => {
      applyOrRemoveBlur(element, "blur", click_event ? !isBlurred : isBlurred);
    });

    if (click_event) {
      blurContactsBtn.classList.toggle("blurred", !isBlurred);
      blurContactsBtn.innerHTML = `<img class='blur_icon' src=${!isBlurred ? eye_visible : eye_hidden
        } alt='blur-info'>`;

      if (isBlurred) {

      }
    }
  } catch (e) {
    console.error("Error :: toggle_blur :: ", e);
  }
}

function applyOrRemoveBlur(element, className, shouldApply) {
  try {
    if (!element) return;

    if (shouldApply) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  } catch (error) {
    console.log(error);
  }
}

function suggestion_messages() {
  var reply_div = document.getElementById("reply_div");
  if (reply_div) reply_div.parentNode.removeChild(reply_div);
  var smart_reply_edit_button = document.getElementById(
    "smart_reply_edit_button"
  );
  if (smart_reply_edit_button)
    smart_reply_edit_button.parentNode.removeChild(smart_reply_edit_button);
  var footer = getDocumentElement("footer_div");
  if (!footer) return;
  footer.style.paddingTop = "33px";
  var reply_div = document.createElement("div");
  reply_div.id = "reply_div";
  reply_div.style.position = "absolute";
  reply_div.style.padding = "8px 12px";
  reply_div.style.top = "0";
  reply_div.style.zIndex = "1";
  reply_div.style.width = "calc(100% - 80px)";
  $.each(messages, function (i, p) {
    var ps = p;
    if (p.length > 47) var ps = p.substring(0, 47) + "...";
    var dom_node = $(
      $.parseHTML(
        '<button class="reply_click CtaBtn" style="color: var(--message-primary);background-color: var(--outgoing-background);border-radius: 15px;padding: 4px 8px;font-size: 12px;margin-right: 8px;margin-bottom: 4px;direction: ltr !important" value="' +
        p +
        '">' +
        ps +
        "</button>"
      )
    );
    reply_div.appendChild(dom_node[0]);
  });
  total_messages = messages.length;
  footer.appendChild(reply_div);
  // scrolling windown to the top
  let conversation_panel = getDocumentElement("conversation_panel");
  if (conversation_panel) {
    conversation_panel.scrollBy(0, 33);
  }
  footer.appendChild(
    $(
      $.parseHTML(
        '<button class="CtaBtn" style="position: absolute;width: 80px;right: 8px;top: 12px;color: var(--message-primary);font-size: 12px !important;" id="smart_reply_edit_button">Edit</button>'
      )
    )[0]
  );

  var scrollWindow = document.getElementsByClassName("_33LGR")[0];
  if (scrollWindow) scrollWindow.scrollTop = scrollWindow.scrollHeight;
  var btnContainer = document.getElementById("reply_div");
  btnContainer.addEventListener("click", async function (event) {
    if (isPremiumFeatureAvailable()) {
      var message = event.target.value;
      if (message != undefined) {
        sendSuggestionMessage(message);
      }

    } else {

    }

  });
  document
    .getElementById("smart_reply_edit_button")
    .addEventListener("click", function (event) {
      suggestion_popup();
      if (isPremiumFeatureAvailable()) {

      }

    });

  // updating premium usage for quick replies
  let quickReplyButton = document.getElementsByClassName("reply_click")[0];
  if (quickReplyButton) {
    quickReplyButton.addEventListener("click", function () {
      chrome.storage.local.get(["premiumUsageObject"], function (result) {
        if (result.premiumUsageObject !== undefined) {
          let updatedPremiumUsageObject = {
            ...result.premiumUsageObject,
            quickReplies: true,
          };
          chrome.storage.local.set({
            premiumUsageObject: updatedPremiumUsageObject,
          });
        }
      });
    });
  }
}

async function sendSuggestionMessage(message) {
  if (!message || message.trim().length == 0) return;

  let message_input_box = getDocumentElement("input_message_div");
  if (!message_input_box) return;

  pasteMessage(message);
  await sendMessageToNumber();
}

function pasteMessage(text) {
  const dataTransfer = new DataTransfer();
  dataTransfer.setData("text", text);
  const event = new ClipboardEvent("paste", {
    clipboardData: dataTransfer,
    bubbles: true,
  });

  const inputMessageBox = getDocumentElement("input_message_div");
  inputMessageBox.dispatchEvent(event);
}

function referesh_messages() {
  var inner_div = document.getElementById("sugg_message_list");
  inner_div.innerHTML = "";
  $.each(messages, function (i, p) {
    var dom_node = $(
      $.parseHTML(
        '<div style="margin: 8px 0px;display: flex;"><div class="popup_list_message" style="color: var(--message-primary);background-color: var(--outgoing-background);padding: 6px 7px 8px 9px;border-radius: 7.5px;margin: 2px 0px;max-width: 400px;margin-right: 8px;cursor: pointer;overflow: auto;">' +
        p +
        "</div>" +
        '<button class="delete_message CtaDeleteBtn" style="border: 1px solid red;width: 18px;height: 18px;color: red;border-radius: 50%;font-size: 11px;margin-top: 8px;" value="' +
        p +
        '">X</button></div>'
      )
    );
    inner_div.appendChild(dom_node[0]);
  });
  chrome.storage.local.set({ messages: messages });
}

async function suggestion_popup() {
  if (!document.getElementsByClassName("modal")[0]) {
    var popup = document.createElement("div");
    popup.className = "modal";
    var modal_content = document.createElement("div");
    modal_content.className = "modal-content";
    modal_content.style.position = "relative";
    modal_content.style.width = "600px";
    modal_content.style.maxHeight = "560px";
    modal_content.style.overflow = "auto";
    popup.appendChild(modal_content);
    var body = document.querySelector("body");
    body.appendChild(popup);
    modal_content.appendChild(
      $(
        $.parseHTML(
          '<div style="font-weight: bold;font-size: 20px;text-align: center;margin-bottom: 24px;color: #000;">Edit/Add quick replies</div>'
        )
      )[0]
    );
    var inner_div = document.createElement("div");
    inner_div.id = "sugg_message_list";
    inner_div.style.height = "210px";
    inner_div.style.overflowY = "auto";
    inner_div.style.margin = "16px 0px";
    modal_content.appendChild(inner_div);
    referesh_messages();
    modal_content.appendChild(
      $(
        $.parseHTML(
          '<span id="close_edit" class="CtaCloseBtn" style="position: absolute;top: 6px;right: 6px;font-size: 20px;width:14px"><img  class="CtaCloseBtn" src="' +
          close_img_src +
          '" style="width: 100%;" alt="x"></span>'
        )
      )[0]
    );
    modal_content.appendChild(
      $(
        $.parseHTML(
          '<textarea style="width: 400px;height: 100px;padding: 8px;" type="text" id="add_message" placeholder="Type your quick reply here"></textarea>'
        )
      )[0]
    );
    modal_content.appendChild(
      $(
        $.parseHTML(
          '<button class="CtaBtn" style="background: #62D9C7;border-radius: 2px;padding: 8px 12px;float: right;color: #fff;" id="add_message_btn">Add Template</button>'
        )
      )[0]
    );

    document
      .getElementById("close_edit")
      .addEventListener("click", function (event) {
        document.getElementsByClassName("modal")[0].style.display = "none";
      });
    document
      .getElementById("sugg_message_list")
      .addEventListener("click", async function (event) {
        var nmessage = event.target.value;
        if (event.target.localName != "div") {
          var index = messages.indexOf(nmessage);
          messages.splice(index, 1);
          referesh_messages();

        } else if (
          event.target.localName == "div" &&
          event.target.className == "popup_list_message"
        ) {
          document.getElementsByClassName("modal")[0].style.display = "none";
          if (isPremiumFeatureAvailable()) {
            var message = event.target.innerText;
            if (message != undefined) {
              sendSuggestionMessage(message);
            }

          } else {
            premium_reminder("smart_reply", "Premium");
          }

        }
      });
    document
      .getElementById("add_message_btn")
      .addEventListener("click", function (event) {
        var nmessage = document.getElementById("add_message").value;
        if (nmessage !== "") {
          nmessage = nmessage
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

          messages.push(nmessage);
          referesh_messages();
          document.getElementById("add_message").value = "";

        }
      });
  } else {
    document.getElementsByClassName("modal")[0].style.display = "block";
  }

  document.getElementById("add_message").placeholder = await translate(
    "Type your quick reply here"
  );
  document.getElementById("add_message_btn").innerText = await translate(
    "Add Template"
  );
}

async function reload_my_number() {
  if (!my_number) {
    try {
      var last_wid = window.localStorage.getItem("last-wid");
      var last_wid_md = window.localStorage.getItem("last-wid-md");
      if (last_wid_md)
        my_number = window.localStorage
          .getItem("last-wid-md")
          .split("@")[0]
          .substring(1)
          .split(":")[0];
      else if (last_wid)
        my_number = window.localStorage
          .getItem("last-wid")
          .split("@")[0]
          .substring(1);

      if (my_number) {
        chrome.storage.local.set({ my_number: my_number });
      }
    } catch (e) {
      console.log(e);
    }
  }

  if (!my_number) {
    let result = await chrome.storage.local.get("my_number");
    my_number = result.my_number || null;
  }

}


function setGroupDataToLocalStorage(data) {
  let finalGroupData = data.map((group) => {
    return {
      ...group,
      objId: "g" + group.id._serialized.replace(/\D+/g, ""),
    };
  });
  chrome.storage.local.set({ allGroupData: finalGroupData });

  const groupData = data;
  groupData.forEach((group) => {
    const groupid = group.id._serialized;
    if (groupid && group.name) groupIdToName[groupid] = group.name;
  });
}

function setContactDataToLocalStorage(data) {
  let finalContactData = data.map((contact) => {
    return {
      ...contact,
      objId: "c" + contact.id._serialized.replace(/\D+/g, ""),
    };
  });
  chrome.storage.local.set({ allContactData: finalContactData });

  const contactData = data;
  contactData.forEach((contact) => {
    const contact_id = contact.id._serialized;
    if (contact_id && contact.name) contactIdToName[contact_id] = contact.name;
  });
}

async function readFileAndSaveToLocalStorage(e, localStorageName) {
  let files = e.target.files;
  let renderedFiles = [];

  let fileReadPromises = Array.from(files).map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const base64Data = event.target.result;
        const fileData = {
          name: file.name,
          type: file.type,
          data: base64Data,
        };
        renderedFiles.push(fileData);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  });
  await Promise.all(fileReadPromises);
  chrome.storage.local.set({ [localStorageName]: renderedFiles });
}

async function handleAddAttachment() {
  console.log('handleAddAttachment')
  let inputElement = document.createElement("input");
  inputElement.type = "file";
  inputElement.id = "new_input_element";
  inputElement.multiple = true;
  document.body.appendChild(inputElement);
  inputElement.click();

  inputElement.addEventListener("change", async function (e) {
    let fileCount = inputElement?.files.length;
    console.log('file count', fileCount)
    if (fileCount && fileCount > 1 && !isAdvanceFeatureAvailable()) {
      premium_reminder("multiple_attachments", "Advance");
    } else {
      await readFileAndSaveToLocalStorage(e, "linuxInputAttachments");
    }
    inputElement.remove();
  });
}

function handleAddCSVInput() {
  let inputElement = document.createElement("input");
  inputElement.type = "file";
  inputElement.id = "new_csv_input_element";
  inputElement.accept = ".xls,.xlsx,.ods,.csv";
  document.body.appendChild(inputElement);
  inputElement.click();

  inputElement.addEventListener("change", async function (e) {
    await readFileAndSaveToLocalStorage(e, "linuxCSVAttachment");
    inputElement.remove();
  });
}

function init() {
  messageListner();
  fetchConfigData();

  window.onload = function () {

    if (window.location.host === "web.whatsapp.com") {
      reload_my_number();

      chrome.storage.local.get(["messages"], function (result) {
        if (result.messages) messages = result.messages;
      });

      try {
        if (window.localStorage.getItem("last-wid")) {
          var a = window.localStorage.getItem("last-wid");
          myNumber = a.split("@")[0].substring(1);
        } else
          (a = window.localStorage.getItem("last-wid-md")),
            (myNumber = a.split(":")[0].substring(1));
        chrome.storage.local.set({ currentState });
      } catch (b) { }

      setInterval(() => {
        const reply_div = document.getElementById("reply_div");
        if (!reply_div || messages.length !== total_messages) {
          suggestion_messages();
        }

        const download_group_btn =
          document.getElementById("download_group_btn");
        if (!download_group_btn) {
          download_group_contacts();
        }

        const translate_div = document.getElementById("translate_div");
        if (!translate_div) {
          translate_messages();
        }

        const profile_header_buttons_div = document.getElementById(
          "profile_header_buttons_div"
        );
        if (!profile_header_buttons_div) {
          profile_header_buttons();
        }

        const main_panel = document.getElementById("main");
        if (main_panel) {
          toggle_blur(null);
        }

        const sidePanel = document.querySelector("#pane-side");
        if (!sidePanel) {
          detectBanText();
        }
      }, 1000);


    }
    const profileHeaderInterval = setInterval(() => {
      const profile_header = getDocumentElement("profile_header");
      if (profile_header) {
        clearInterval(profileHeaderInterval);
        handleScheduleCampaigns();
      }
    }, 100);
  };
}
init();


function messageListner() {
  chrome.runtime.onMessage.addListener(listner);
}

function listner(request, sender, sendResponse) {
  if (request.type === "number_message") {
    console.log('number_message listner')
    messenger(
      request.numbers,
      request.message,
      request.time_gap,
      request.csv_data,
      request.customization,
      request.caption_customization,
      request.random_delay,
      request.batch_size,
      request.batch_gap,
      request.caption,
      request.send_attachment_first,
      request.type,
      request.startIndex,
      request.paused_report_rows,
      request.paused_sent_count,
      request.custom_time_range
    );
  }
  else if (request.type === "group_message")
    messenger(
      request.groups,
      request.message,
      request.time_gap,
      request.csv_data,
      request.customization,
      request.caption_customization,
      request.random_delay,
      request.batch_size,
      request.batch_gap,
      request.caption,
      request.send_attachment_first,
      request.type,
      request.startIndex,
      request.paused_report_rows,
      request.paused_sent_count,
      request.custom_time_range
    );
  else if (request.type === "show_message_count_over_popup")
    messageCountOverPopup();
  else if (request.type === "schedule_message") handleScheduleCampaigns();
  else if (request.type === "clear_schedule_timeout")
    clearTimeout(request.timeoutId);
  else if (request.type === "help") handle_help();
  else if (request.type === "transfer_premium") help(request.message);
  else if (request.type === "show_premium_popup")
    premium_reminder(request.feature, "Premium");
  else if (request.type === "show_advance_popup")
    premium_reminder(request.feature, "Advance");
  else if (request.type === "add_attachments") handleAddAttachment();
  else if (request.type === "create_csv_input") handleAddCSVInput();
  else if (request.type === "reload_contacts") {
    window.dispatchEvent(new CustomEvent("PROS::get-all-contacts"));
  } else if (request.type === "reload_my_number") {
    reload_my_number();
  } else if (request.type === "chat_link") chat_link();
  else if (request.type === "unsaved_contacts_demo") unsavedContactsDemo();
  else if (request.type === "request_chat_premium") {
    if (isAdvance()) help(HELP_MESSAGES.REQUEST_CHAT_SUPPORT_ADVANCE);
    else help(HELP_MESSAGES.REQUEST_CHAT_SUPPORT_BASIC);
  } else if (request.type === "request_zoom_premium") {
    if (isAdvance()) help(HELP_MESSAGES.REQUEST_ZOOM_SUPPORT_ADVANCE);
    else help(HELP_MESSAGES.REQUEST_ZOOM_SUPPORT_BASIC);
  } else if (request.type === "request_call_premium") {
    if (isAdvance()) help(HELP_MESSAGES.REQUEST_CALL_SUPPORT_ADVANCE);
    else help(HELP_MESSAGES.REQUEST_CALL_SUPPORT_BASIC);
  } else if (request.type === "unsubscribe")
    help(HELP_MESSAGES.UNSUBSCRIBE_PLAN);
  else if (request.type === "learn_schedule")
    help(HELP_MESSAGES.LEARN_SCHEDULE);
  else if (request.type === "buy_premium_popup") show_trial_popups();
  // else if (request.type === 'show_update_reminder_popup')
  //     updateReminderPopup();
}

function sendChromeMessage(message) {
  chrome.runtime.sendMessage(message);
}

function help(message) {
  chrome.storage.local.get(
    ["currentLanguage", "customer_care_number"],
    async (res) => {
      let help_message = message.replace(/ /gm, " ");
      let language = res.currentLanguage || "default";

      if (HELP_MESSAGE_LANGUAGE_CODES.includes(language)) {
        help_message = await translate(help_message);
      }
      await openNumber(res.customer_care_number, help_message);
      await sendMessage();
    }
  );
}

function handle_help() {

}

document.body.addEventListener("click", function (event) {
  if (event.target.classList.contains("handle_help_btn")) {
    handle_help();
  }
});

async function unsavedContactsDemo() {
  let translatedExportUnsavedContactsObj = await fetchTranslations(
    exportUnsavedContactsObj
  );
  driver(translatedExportUnsavedContactsObj).drive();
}

function getTodayDate() {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();

  return yyyy + "-" + mm + "-" + dd;
}

async function delay(ms) {
  if (ms == 0) return;

  return new Promise((resolve) => {
    cancelDelay = resolve;
    setTimeout(resolve, ms);
  });
}

async function sendMessage() {
  return new Promise((resolve) => {
    setTimeout(() => {
      let send_message_btn = getDocumentElement("send_message_btn");
      if (send_message_btn) {
        send_message_btn.click();
        resolve(["Yes", ""]);
      } else {
        resolve(["No", "Issue with the number"]);
      }
    }, 500);
  });
}

function download_report() {
  let s =
    "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  var o = encodeURI(s),
    l = document.createElement("a");
  l.setAttribute("href", o),
    l.setAttribute("download", "report.csv"),
    document.body.appendChild(l),
    l.click();
}

// Google Analytics
function getTrackLabel() {
  try {
    return [my_number, plan_type, plan_duration].join(" ").trim();
  } catch {
    return "";
  }
}

function getTrackLocation() {
  return location_info.default
    ? {}
    : {
      city: location_info.city,
      region: location_info.region,
      country: location_info.country,
      dial_code: location_info.dial_code,
    };
}

function convertDate(date = null) {
  if (!date) date = new Date();
  return (
    date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
  );
}

function dateDiff(date1, date2) {
  if (date1 && date2) return Math.ceil((date2 - date1) / (1000 * 24 * 3600));
}

function check_web_and_show_trial_popups() {
  if (document.getElementById("side") !== null) {
    show_trial_popups();
    if (!my_number) return;
  } else {
    setTimeout(check_web_and_show_trial_popups, 500);
  }
}

function show_trial_popups() {
  chrome.storage.local.get(
    [
      "is_advance_promo_activated",
      "content_visits",
      "plan_type",
      "created_date",
      "expiry_date",
      "last_plan_type",
      "subscribed_date",
      "location_info",
    ],
    function (result) {
      // Initialize Values
      plan_type = result.plan_type || "Advance";
      last_plan_type = result.last_plan_type || "Basic";
      location_info = result.location_info || location_info;

      let today = new Date();
      let content_visits = result.content_visits || 0;
      let expiry_date = result.expiry_date
        ? new Date(result.expiry_date)
        : null;
      let created_date = result.created_date
        ? new Date(result.created_date)
        : null;
      let subscribed_date = result.subscribed_date
        ? new Date(result.subscribed_date)
        : null;
      let is_advance_promo_activated =
        result.is_advance_promo_activated || "NO";

      // Calculate Values
      let date_diff = expiry_date ? dateDiff(today, expiry_date) : 7;
      if (subscribed_date && expiry_date) {
        let plan_days = Math.abs(dateDiff(expiry_date, subscribed_date));
        plan_duration = plan_days > 31 ? "Yearly" : "Monthly";
      }


      // Set updated values
      chrome.storage.local.set({
        content_visits: content_visits + 1,
        plan_duration: plan_duration,
        is_advance_promo_activated: is_advance_promo_activated,
      });

      chrome.runtime.sendMessage({}, function (response) {
        logged_in_user = response.email;

      });
    }
  );
}

function isExpired() {
  return plan_type === "Expired";
}

function isBasic() {
  return true;
}

function isAdvance() {
  return plan_type === "Advance";
}

function isAdvance() {
  return true;
}

function isPremium() {
  return true;
}

function isFreeTrial() {
  return false;
}

function isAdvancePromo() {
  return false;
}

function isTrial() {
  return false;
}

function isBasicFeatureAvailable() {
  return true;
}

function isAdvanceFeatureAvailable() {
  return true;
}

function isPremiumFeatureAvailable() {
  return true;
}

function create_footer_html() {
  let footer_html = `
        <div class="popup-footer">
            <div class="popup-footer-container">
                <div class="logo-div">
                    <img class="logo-icon" src="${window["logo_img"]}" alt="Logo"/>
                    <img class="logo-text" src="${window["logo_text"]}" alt="Logo Text"/>
                </div>
                <div class="contact-div">
                    <p>Any questions?</p>
                    <a class="handle_help_btn CtaBtn">Contact Support</a>
                </div>
            </div>
        </div>`;
  return footer_html;
}

async function create_popup_html(popup_name, date_diff) {
  const data = POPUP_DATA[popup_name];
  const common = POPUP_DATA.common;

  const title_text = data.title
    ? data.title
      .replace(
        "{VAR_DATE_DIFF}",
        `<br /><span class="expire_date_number">${date_diff}</span>`
      )
      .replace(
        "{VAR_EXP_TEXT}",
        date_diff > 0 ? `expires in ${date_diff} days` : "have expired"
      )
    : null;
  const pricing_buttons_html = await create_pricing_buttons_html(popup_name);
  const features_html = create_features_list_html(popup_name);
  const footer_html = create_footer_html();

  const popup_html = `
        <div class="${popup_name}_content trial_content" style="background: ${data.background_color
    }">
            ${data.close_button
      ? `<span class="CtaCloseBtn popup-close-btn" id="close_${popup_name}_popup"><img src=${close_img_src} /></span>`
      : ""
    }

            <div class="popup-header">
                ${data.heading
      ? `<div class="trial_big_title heading ${popup_name}_bold">${await translate(
        data.heading
      )}</div>`
      : ""
    }
                <div class="trial_big_title">
                    ${data.icon ? `<img src=${window[data.icon]} />` : ""}
                    ${title_text ? `<p>${await translate(title_text)}</p>` : ""}
                </div>
                ${data.description
      ? `<div class="trial_title">${await translate(
        data.description
      )}</div>`
      : ""
    }
            </div>

            <div class="trial_separator_line ${popup_name}_divider"></div>

            <div class="popup-center"> 
                <div class="trial_features">${features_html}</div>
                ${data.note
      ? `<div class="trial_desc">${await translate(
        data.note
      )}</div>`
      : ""
    }
                ${pricing_buttons_html}
                ${data.action_button
      ? `<div id="${data.action_button.id}" class="popup-btn CtaBtn ${data.action_button.class}">${data.action_button.text}</div>`
      : ""
    }
                ${data.recommend_price
      ? `<div class="popup-message popup-recommendation-message"><img src="${recommend_tick}"> ${await translate(
        common.recommend_text
      )}</div>`
      : ""
    }
                ${data.discount_text
      ? `<div class="popup-message popup-discount-message">*${await translate(
        common.discount_text
      )}</div>`
      : ""
    }
                ${data.purchase_note
      ? `<div class="popup-message popup-purchase-note">${await translate(
        common.purchase_note
      )}</div>`
      : ""
    }  
            </div>

            ${footer_html}
        </div>
    `;
  return popup_html;
}

function show_loader_and_close_popup(popup_name, delay, next_popup = false) {
  $(`#close_${popup_name}_popup`).addClass("loading").html("");
  setTimeout(() => {
    $(`#${popup_name}_popup`).remove();

    if (next_popup) {
      success_popup(next_popup);
    }
  }, delay);
}

// Close Reminder Popup if user clicks outside of it
document.addEventListener("click", (event) => {
  if (document.querySelector(".trial_popup")) {
    let popup = document.querySelectorAll(".trial_popup")[0];
    const isBuyAnnualPopup = popup.classList.contains("buy_annual_popup");
    if (!popup.contains(event.target)) {
      document.body.removeChild(popup);
      if (isBuyAnnualPopup) {
        chrome.storage.local.set({
          lastShownAnnualPopup: formatToIsoDate(new Date()),
        });
      }
    }
  }
});

async function chat_link() {
  var chat_link_div = document.getElementsByClassName("chat_link_popup")[0];
  if (!chat_link_div) {
    let chat_link_title = await translate(
      "Generate WhatsApp chat link for your number"
    );
    let chat_link_desc = await translate(
      "Enter the pre-set message that you would receive when your customer clicks on the link"
    );

    let modal_content_html = `
        <span id="close_chat_link_popup" style="position: absolute;top: 6px;right: 6px;font-size: 20px;width:14px"><img  class="CtaCloseBtn" src="${close_img_src}" style="width: 100%;" alt="x"></span>
        <div class="chat_link_title">${chat_link_title}</div>
        <div class="chat_link_desc">${chat_link_desc} (Optional)</div>
        <textarea style="width: 460px;height: 64px;padding: 8px;" type="text" id="add_chat_message"></textarea>
        <div id="generate_chat_link" class="popup-btn action-green-btn CtaBtn">Generate</div>
        `;

    let modal_content = document.createElement("div");
    modal_content.className = "chat_link_content trial_content";
    modal_content.innerHTML = modal_content_html;

    let popup = document.createElement("div");
    popup.className = "chat_link_popup trial_popup";
    popup.style.width = "min(550px, 95%)";
    popup.appendChild(modal_content);

    var body = document.querySelector("body");
    body.appendChild(popup);
    document
      .getElementById("close_chat_link_popup")
      .addEventListener("click", function (event) {
        document.getElementsByClassName("chat_link_popup")[0].style.display =
          "none";

      });
    document
      .getElementById("generate_chat_link")
      .addEventListener("click", function (event) {
        if (isAdvanceFeatureAvailable()) {
          var message = document.getElementById("add_chat_message").value;
          var text = "https://wa.me/" + my_number;
          if (message !== "") {
            message = encodeURIComponent(message);
            text += "?text=" + message;
          }
          navigator.clipboard.writeText(text).then(function () {
            alert("Chat link generated and copied: " + text);
          });
          document.getElementsByClassName("chat_link_popup")[0].style.display =
            "none";
        } else {
          document.getElementsByClassName("chat_link_popup")[0].style.display =
            "none";
          premium_reminder("business_chat_link", "Advance");
        }

      });
  } else chat_link_div.style.display = "block";

  document.querySelector(".chat_link_title").innerText = await translate(
    "Generate WhatsApp chat link for your number"
  );
  document.querySelector(".chat_link_desc").innerText = await translate(
    "Enter the pre-set message that you would receive when your customer clicks on the link (Optional)"
  );

}

// Invoice Feature
// formatting the date
function formatDate(inputDate) {
  const dateParts = inputDate.split("/");
  const day = parseInt(dateParts[1]);
  const month = parseInt(dateParts[0]) - 1;
  const year = parseInt(dateParts[2]);
  const formattedDate = new Date(year, month, day);
  const options = { year: "numeric", month: "short", day: "numeric" };
  const formattedDateString = formattedDate.toLocaleDateString(
    "en-US",
    options
  );
  const splittedDate = formattedDateString.split(" ");
  let returnDateString = `${splittedDate[0]}, ${splittedDate[2]}`;
  return returnDateString;
}

// sorting dates in descending order
function sortDatesDescending(dateArray) {
  return dateArray.sort(function (a, b) {
    const datePartsA = a.date.split("/").map(Number);
    const datePartsB = b.date.split("/").map(Number);

    const dateA = new Date(datePartsA[2], datePartsA[0] - 1, datePartsA[1]);
    const dateB = new Date(datePartsB[2], datePartsB[0] - 1, datePartsB[1]);

    return dateB - dateA;
  });
}

// call this function if you want to show a popup only if there are no other popup on the screen
function callIfNoOtherPopups(fun) {
  const getPopupInterval = setInterval(() => {
    const trialPopup = document.querySelector(".trial_popup");
    const successPopup = document.querySelector(".success_popup");
    const sidebar = document.getElementById("side");
    const buyAnnualPopup = document.querySelector("#buy_annual_popup");
    if (!trialPopup && !successPopup && !buyAnnualPopup && sidebar) {
      clearInterval(getPopupInterval);
      fun();
    }
  }, 500);
}


const howToUseData = [
  {
    image: how_to_use1,
    content:
      "Click on the ‘Extensions’ icons at the top right of the chrome window",
    index: 1,
    hasPrev: false,
    hasNext: true,
  },
  {
    image: how_to_use2,
    content: "Pin the extension icon by clicking on the pin button ",
    index: 2,
    hasPrev: true,
    hasNext: true,
  },
  {
    image: how_to_use3,
    content:
      "Start using the extension by clicking on the extension icon",
    index: 3,
    hasPrev: true,
    hasNext: true,
  },
];

function changeNavigationColor(index) {
  if (index == 0) {
    if (
      document
        .querySelector(".nav_line_1")
        .classList.contains("active_line_class")
    ) {
      document
        .querySelector(".nav_line_1")
        .classList.remove("active_line_class");
    }
    if (
      document
        .querySelector(".nav_num_2")
        .classList.contains("active_num_class")
    ) {
      document.querySelector(".nav_num_2").classList.remove("active_num_class");
    }
    if (
      document
        .querySelector(".nav_line_2")
        .classList.contains("active_line_class")
    ) {
      document
        .querySelector(".nav_line_2")
        .classList.remove("active_line_class");
    }
    if (
      document
        .querySelector(".nav_num_3")
        .classList.contains("active_num_class")
    ) {
      document.querySelector(".nav_num_3").classList.remove("active_num_class");
    }
  }
  if (index == 1) {
    if (
      !document
        .querySelector(".nav_line_1")
        .classList.contains("active_line_class")
    ) {
      document.querySelector(".nav_line_1").classList.add("active_line_class");
    }
    if (
      !document
        .querySelector(".nav_num_2")
        .classList.contains("active_num_class")
    ) {
      document.querySelector(".nav_num_2").classList.add("active_num_class");
    }
    if (
      document
        .querySelector(".nav_line_2")
        .classList.contains("active_line_class")
    ) {
      document
        .querySelector(".nav_line_2")
        .classList.remove("active_line_class");
    }
    if (
      document
        .querySelector(".nav_num_3")
        .classList.contains("active_num_class")
    ) {
      document.querySelector(".nav_num_3").classList.remove("active_num_class");
    }
  }
  if (index == 2) {
    if (
      !document
        .querySelector(".nav_line_2")
        .classList.contains("active_line_class")
    ) {
      document.querySelector(".nav_line_2").classList.add("active_line_class");
    }
    if (
      !document
        .querySelector(".nav_num_3")
        .classList.contains("active_num_class")
    ) {
      document.querySelector(".nav_num_3").classList.add("active_num_class");
    }
  }
}

function howToUsePopup() {
  const parentDiv = document.createElement("div");
  parentDiv.className = "how_to_use_popup";
  let currentIndex = 0;
  const popupHtml = `
        <div class="how_to_use_container">
            <div class="how_to_use_header">
                <div class="how_to_use_title">
                    <img style="width: 50px; margin-right:10px;" src=${bulb_icon} alt="" />
                    <p>How to use</p>
                </div>
                <div class="how_to_use_logo">
                    <img class="how_to_use_logo_img" src="${logo_img}"/>
                    <img class="how_to_use_logo_text" src="${logo_text}"/>
                </div>
            </div>
            <div class="how_to_use_body">
                <div class="how_to_use_text ${currentIndex == 1 ? "second" : ""
    }">
                    <p class="ins_number">${howToUseData[currentIndex].index
    }</p>
                    <p class="ins_text">${howToUseData[currentIndex].content
    }</p>
                </div>
                <div class="how_to_use_image">
                    <img src=${howToUseData[currentIndex].image} alt="" />
                </div>
            </div>
            <div class="how_to_use_buttons">
                <div class="how_to_use_button prev_button CtaBtn">
                    <img style="width: 22px" src=${arrow_left} alt="" />
                    Previous
                </div>
                <div class="how_to_use_button next_button CtaBtn">
                    Next
                    <img style="width: 22px" src=${arrow_right} alt="" />
                </div>
                <div class="how_to_use_button navigation_close_button CtaBtn" style="display: none; padding:13px 30px;">
                    Close
                </div>
            </div>
            <div class="navigation_section">
                <div class="nav_num nav_num_1 active_num_class">1</div>
                <div class="nav_line nav_line_1"></div>
                <div class="nav_num nav_num_2">2</div>
                <div class="nav_line nav_line_2"></div>
                <div class="nav_num nav_num_3">3</div>
            </div>
        </div>
    `;

  parentDiv.innerHTML = popupHtml;
  document.body.appendChild(parentDiv);

  document
    .querySelector(".navigation_close_button")
    .addEventListener("click", () => {
      document.body.removeChild(parentDiv);
      chrome.storage.local.set({ showHowToUsePopup: false });
    });

  document.querySelector(".next_button").addEventListener("click", () => {
    // removing next button
    if (currentIndex == howToUseData.length - 1) {
      return;
    }
    currentIndex++;
    changeNavigationColor(currentIndex);
    if (currentIndex == 1) {
      document.querySelector(".how_to_use_text").style.flexDirection =
        "row-reverse";
    } else {
      document.querySelector(".how_to_use_text").style.flexDirection = "row";
    }
    if (currentIndex % 2 == 0) {
      document.querySelector(".how_to_use_body").style.flexDirection = "row";
      document.querySelector(".how_to_use_popup").style.background =
        "linear-gradient(270deg, #FFFFFF 90.23%, #009A88 100%)";
    } else {
      document.querySelector(".how_to_use_body").style.flexDirection =
        "row-reverse";
      document.querySelector(".how_to_use_popup").style.background =
        "linear-gradient(90deg, #FFFFFF 90.23%, #009A88 100%)";
    }
    document.querySelector(".ins_number").innerText =
      howToUseData[currentIndex].index;
    document.querySelector(".ins_text").innerText =
      howToUseData[currentIndex].content;
    document.querySelector(".how_to_use_image img").src =
      howToUseData[currentIndex].image;
    document.querySelector(".prev_button").style.display = "flex";
    if (currentIndex == howToUseData.length - 1) {
      document.querySelector(".next_button").style.display = "none";
      document.querySelector(".navigation_close_button").style.display = "flex";
    }
  });

  document.querySelector(".prev_button").addEventListener("click", () => {
    // removing prev button
    if (currentIndex == 0) {
      return;
    }
    currentIndex--;
    changeNavigationColor(currentIndex);
    if (currentIndex == 1) {
      document.querySelector(".how_to_use_text").style.flexDirection =
        "row-reverse";
    } else {
      document.querySelector(".how_to_use_text").style.flexDirection = "row";
    }
    if (currentIndex % 2 == 0) {
      document.querySelector(".how_to_use_body").style.flexDirection = "row";
      document.querySelector(".how_to_use_popup").style.background =
        "linear-gradient(270deg, #FFFFFF 90.23%, #009A88 100%)";
    } else {
      document.querySelector(".how_to_use_body").style.flexDirection =
        "row-reverse";
      document.querySelector(".how_to_use_popup").style.background =
        "linear-gradient(90deg, #FFFFFF 90.23%, #009A88 100%)";
    }
    document.querySelector(".ins_number").innerText =
      howToUseData[currentIndex].index;
    document.querySelector(".ins_text").innerText =
      howToUseData[currentIndex].content;
    document.querySelector(".how_to_use_image img").src =
      howToUseData[currentIndex].image;
    document.querySelector(".next_button").style.display = "flex";
    document.querySelector(".navigation_close_button").style.display = "none";
    if (currentIndex == 0) {
      document.querySelector(".prev_button").style.display = "none";
    }
  });
}
function showHowToUsePopup() {
  chrome.storage.local.get(["showHowToUsePopup", "no_of_visit"], (res) => {
    let visit_count = res.no_of_visit || 0;
    if (res.showHowToUsePopup == false) {
      return;
    }
    if (visit_count == 0) {
      chrome.storage.local.set({ showHowToUsePopup: true });
    }
    const getSideBarInterval = setInterval(() => {
      const sidebar = document.getElementById("side");
      const trialPopup = document.querySelector(".trial_popup");
      if (sidebar && !trialPopup) {
        howToUsePopup();
        clearInterval(getSideBarInterval);
      }
    }, 500);
  });
}


function changeCounterTime(getCounterInterval) {
  const expiryDate = new Date(expiry_date);
  const currentDate = new Date();
  const diff = expiryDate - currentDate;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  let counterText = "";
  if (days > 0) {
    counterText += `${days} days, `;
  }
  counterText += `${hours} hrs, ${minutes} min, ${seconds} sec `;
  const buyAnnualCouter = document.querySelector(".buy_annual_counter");
  if (!buyAnnualCouter) {
    clearInterval(getCounterInterval);
    return;
  }
  buyAnnualCouter.innerText = counterText;
  if (diff <= 0 && getCounterInterval) {
    clearInterval(getCounterInterval);
  }
}

function handleAnnualPopupCounter() {
  const getCounterInterval = setInterval(() => {
    changeCounterTime(getCounterInterval);
  }, 1000);
}

function getMonthDifference(date1, date2) {
  const [month1, year1] = date1.split(", ");
  const [month2, year2] = date2.split(", ");

  return (
    (parseInt(year2) - parseInt(year1)) * 12 +
    (getMonthIndex(month2) - getMonthIndex(month1))
  );
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function getMonthIndex(month) {
  return monthNames.indexOf(month);
}

function formatToIsoDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

function dateDiffInDays(date1, date2) {
  if (!date1 || !date2) return NaN;

  const [year1, month1, day1] = date1.split("-").map(Number);
  const [year2, month2, day2] = date2.split("-").map(Number);
  const d1 = new Date(year1, month1 - 1, day1);
  const d2 = new Date(year2, month2 - 1, day2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function updateReminderPopup() {
  if (!SHOW_UPDATE_REMINDER_POPUP) return;

  // Remove existing popup if it exists
  if (document.querySelector("#update_reminder_popup")) {
    document
      .querySelector("body")
      .removeChild(document.querySelector("#update_reminder_popup"));
  }

  let update_desc = await translate(
    "You can either restart your Chrome to update or you can go to manage Chrome extension and update it."
  );

  let modal_content_html = `
           <div class="rheader">
            <h2 id="update_popup_title">New Version Available</h2>
        </div>
        <div class="rcenter">
            <div class="rtop" id="update_popup_desc">${update_desc}</div>
            <div class="rbottom">
                <a href="http://chrome://extensions/?id=klfaghfflijdgoljefdlofkoinndmpia" target="_blank">
                    <div id="okBtn" class="popup-btn action-green-btn CtaBtn">Update</div>
                </a>
            </div>
        </div>
        ${create_footer_html()}
    `;

  let modal_content = document.createElement("div");
  modal_content.className = "update_reminder_popup_content trial_content";
  modal_content.style.background = "#62d9c7";
  modal_content.style.zIndex = "100";
  modal_content.style.width = "60%";
  modal_content.innerHTML = modal_content_html;
  modal_content.appendChild(
    $(
      $.parseHTML(
        '<span id="close_update" style="position: absolute;top: 12px;right: 12px;font-size: 20px;width:14px"><img class="CtaCloseBtn" src="' +
        close_img_src +
        '" style="width: 100%;" alt="x"></span>'
      )
    )[0]
  );

  let popup = document.createElement("div");
  popup.className = "update_reminder_popup";
  popup.id = "update_reminder_popup";
  popup.style.height = "100%";
  popup.style.display = "flex";
  popup.appendChild(modal_content);

  document.querySelector("body").appendChild(popup);

  document.querySelector("#okBtn").addEventListener("click", () => {
    document.querySelector("body").removeChild(popup);
  });
  document
    .getElementById("close_update")
    .addEventListener("click", function (event) {
      document.querySelector("body").removeChild(popup);
    });
  document.querySelector("#closePopupBtn").addEventListener("click", () => {
    document.querySelector("body").removeChild(popup);
  });
}

// ---- config-data OR data.js related functions ---

function getDocumentElement(key, selectAll = false) {
  try {
    if (DOCUMENT_ELEMENT_SELECTORS[key]) {
      for (const className of DOCUMENT_ELEMENT_SELECTORS[key]) {
        const element = selectAll
          ? document.querySelectorAll(className)
          : document.querySelector(className);
        if (element) {
          return element;
        }
      }
    } else {
      console.log("Selector not exists:", key);
    }
  } catch (err) {
    console.log("Error while finding document element", err);
  }
  return null;
}

async function fetchConfigData() {



  try {

    const configMap = {

      "ALL_LANGUAGE_CODES": [
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
        "zu"
      ],
      "COUNTRY_WITH_SPECIFIC_PRICING": {
        "EG": "egypt",
        "IL": "israel",
        "AE": "uae",
        "SG": "singapore",
        "IN": "india",
        "ID": "indonesia",
        "GB": "uk",
        "KW": "kuwait",
        "SA": "saudi_arabia"
      },
      "DID_YOU_KNOW_TIPS": [
        "You can add batching to reduce the chances of getting your number banned",
        "You can increase the time gap or change it to random to reduce the chances of getting your number banned",
        "You can create a business chat link for your business/organisation's website with the 'Business chat link' feature on the bottom left of the extension",
        "You can request for voice call and video call support",
        "You can customise your messages to the customer while sending messages",
        "You can edit and create your own quick responses to respond to messages faster and efficiently"
      ],
      "DOCUMENT_ELEMENT_SELECTORS": {
        "invalid_popup_ok_btn": [
          "[data-testid=\"popup-controls-ok\"]",
          "[data-animate-modal-popup=\"true\"]:not(:has(svg circle)) button"
        ],
        "conversation_compose_div": [
          "[data-testid=\"conversation-compose-box-input\"]",
          "._4r9rJ",
          "._ak1p",
          "._ak1r",
          "._ak1q"
        ],
        "profile_header": [
          "._604FD",
          "._ak0z",
          "span.x1okw0bk"
        ],
        "block_message_div": [
          "[data-testid=\"block-message\"]",
          "._1alON"
        ],
        "conversation_panel": [
          "[data-testid=\"conversation-panel-messages\"]",
          "._5kRIK",
          "._ajyl",
          ".x1rife3k"
        ],
        "today_yesterday_div": [
          "._1fyro",
          "._ao3e"
        ],
        "new_chat_parent": [
          "[aria-label=\"New chat\"]"
        ],
        "conversation_non_message_div": [
          ".focusable-list-item"
        ],
        "send_message_btn": [
          "span[data-icon=\"send\"]",
          "[aria-label=\"Send\"]"
        ],
        "conversation_title_div": [
          "[data-testid=\"conversation-info-header-chat-title\"]",
          "#main header span"
        ],
        "starting_chat_popup": [
          "[data-animate-modal-popup=\"true\"]:has(svg circle)"
        ],
        "contact_profile_div": [
          "img.x1hc1fzr._ao3e"
        ],
        "conversation_panel_wrapper": [
          ".copyable-area"
        ],
        "conversation_header": [
          "[data-testid=\"conversation-header\"]",
          "#main header"
        ],
        "invalid_chat_popup": [
          "[data-animate-modal-popup=\"true\"]:not(:has(svg circle))"
        ],
        "left_side_contacts_panel": [
          "#pane-side"
        ],
        "conversation_message_div": [
          "[data-testid^=\"conv-msg\"]",
          "[data-id^=\"true\"]",
          "[data-id^=\"false\"]"
        ],
        "conversation_header_name_div": [
          "._amie"
        ],
        "footer_div": [
          "footer._3E8Fg",
          "footer._ak1i"
        ],
        "input_message_div": [
          "#main [contenteditable=\"true\"][role=\"textbox\"]"
        ],
        "new_chat_btn": [
          "[data-icon=\"new-chat-outline\"]"
        ]
      },
      "FAQS": [
        {
          "question": "Does it work in the desktop app?",
          "answer": "No, it is a browser extension and it works on Google Chrome, Internet Edge, Brave (Mac, Windows, and Linux)."
        },
        {
          "question": "Does it work in my country?",
          "answer": "Yes, every country in the world can use the extension."
        },
        {
          "question": "How to send clickable links?",
          "answer": "You can send a clickable link to anyone who</br>- Either has your number saved in their phone book</br>- Or has replied to you at least once."
        },
        {
          "question": "How to correctly format the numbers column in CSV file?",
          "answer": "1. Select the numbers column -> Right click -> Click on ‘Format Cells’.</br>2. Go to the ‘Number‘ category -> Go to ‘Decimal Places‘ box</br>3. Change it ‘0’ and click ‘OK’.</br>4. Verify that the numbers are now coming correctly."
        },
        {
          "question": "How to send an attachment?",
          "answer": "1. Click on 'Add Attachment' and select the type of attachment</br>2. Select the file you want to send</br>3. Your personal chat would open up - send the file in the chat.</br>4. Now open the extension and click on 'Send Message'. Your file will be sent one by one to all the contacts."
        },
        {
          "question": "Can I send message to people in a group separately without saving their contacts?",
          "answer": "Yes, you can. Here's how:</br>1. Open the respective group and click on the extension</br>2. Click on 'Download Group Contacts' and an excel of contact numbers will be downloaded</br>3. Upload this csv and enter the message you want to send in the extension."
        }
      ],
      "GA_CONFIG": {
        "SESSION_EXPIRATION_IN_MIN": 30,
        "MEASUREMENT_ID": "G-Z5RKTJRHLN",
        "API_SECRET": "maXsjuUoSAabJEdj7RxlFg",
        "GA_ENDPOINT": "https://www.google-analytics.com/mp/collect",
        "GA_DEBUG_ENDPOINT": "https://www.google-analytics.com/debug/mp/collect",
        "DEFAULT_ENGAGEMENT_TIME_MSEC": 100
      },
      "HELP_MESSAGES": {
        "NEED_HELP_NON_PREMIUM": "Hi, I need help.",
        "REQUEST_CHAT_SUPPORT_BASIC": "Hi, I would like to request chat support.",
        "LEARN_SCHEDULE": "Hi, I want to learn more about the Schedule feature.",
        "REQUEST_CHAT_SUPPORT_ADVANCE": "Hi, I would like to request chat support.",
        "REQUEST_CALL_SUPPORT_BASIC": "Hi, I would like to request call support.",
        "REQUEST_ZOOM_SUPPORT_ADVANCE": "Hi, I would like to request video call support.",
        "REQUEST_CALL_SUPPORT_ADVANCE": "Hi, I would like to request call support.",
        "UNSUBSCRIBE_PLAN": "Hi, I would like to unsubscribe from my plan.",
        "REQUEST_ZOOM_SUPPORT_BASIC": "Hi, I would like to request video call support."
      },
      "HELP_MESSAGE_LANGUAGE_CODES": [
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
        "de"
      ],
      "LOAD_INJECT": {
        "useOldMethod": true,
        "reload": true
      },
      "MULT25ACCOUNTPRICE": {
        "kuwait": "$3.49",
        "singapore": "SGD 4.49",
        "egypt": "EGP 150.99",
        "israel": "ILS 11.49",
        "uk": "GBP 2.99",
        "uae": "AED 11.49",
        "saudi_arabia": "SAR 11.49",
        "international": "$3.49",
        "india": "149",
        "indonesia": "IDR 49999"
      },
      "POPUP_DATA": {
        "premium_expired": {
          "icon": "wall_clock_white_icon",
          "pricing_buttons": true,
          "title": "Your PREMIUM features {VAR_EXP_TEXT}! BUT don’t worry...",
          "background_color": "#80C0B7",
          "close_button": true,
          "purchase_note": true
        },
        "common": {
          "recommend_text": "Recommended based on your usage",
          "purchase_note": "While purchasing, please enter the WhatsApp number you want to send messages from",
          "discount_text": "Discount applicable for only first month"
        },
        "free_trial_start": {
          "icon": "free_trial_src",
          "note": "Note: Main features will remain free even after trial",
          "action_button": {
            "class": "action-green-btn",
            "text": "Okay",
            "id": "close_free_trial_start_popup"
          },
          "title": "You get free trial for PREMIUM features!",
          "background_color": "#fff",
          "heading": "Congratulations!"
        },
        "free_trial_reminder": {
          "pricing_buttons": true,
          "background_color": "#f99909",
          "close_button": true,
          "purchase_note": true,
          "description": "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
          "title": "Your trial of PREMIUM features expires in {VAR_DATE_DIFF} days! But do not worry",
          "recommend_price": true,
          "discount_text": true
        },
        "advance_promo_start": {
          "icon": "advance_promo_src",
          "action_button": {
            "class": "action-green-btn claim-advance-promo",
            "text": "Claim Now!",
            "id": "close_advance_promo_start_popup"
          },
          "title": "You've received a coupon for {VAR_DATE_DIFF} days of Advance Premium for Free!",
          "background_color": "#A480C0",
          "heading": "Congratulations!"
        },
        "advance_promo_reminder": {
          "pricing_buttons": true,
          "background_color": "#A480C0",
          "close_button": true,
          "purchase_note": true,
          "description": "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
          "title": "Your Advance Promo of PREMIUM features expires in {VAR_DATE_DIFF} days! But do not worry",
          "recommend_price": true,
          "discount_text": true
        },
        "free_trial_expired": {
          "pricing_buttons": true,
          "background_color": "#80C0B7",
          "close_button": true,
          "purchase_note": true,
          "icon": "wall_clock_white_icon",
          "description": "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
          "title": "Your trial for PREMIUM features has expired!! But do not worry",
          "recommend_price": true,
          "discount_text": true
        },
        "advance_promo_expired": {
          "pricing_buttons": true,
          "background_color": "#A480C0",
          "close_button": true,
          "purchase_note": true,
          "icon": "wall_clock_white_icon",
          "description": "Flat discount of 30% on PREMIUM EXCLUSIVELY for you!",
          "title": "Your Advance Promo for PREMIUM features has expired!! But do not worry",
          "recommend_price": true,
          "discount_text": true
        }
      },
      "PREMIUM_FEATURES": [
        "Schedule ",
        "Business Chat Link ",
        "Meet/Zoom Support ",
        "Multiple Attachments ",
        "custom_random_time_gap"
      ],
      "PREMIUM_REMINDER": {
        "zoom_call_support": {
          "title": "Zoom call support is only for Advance Plan users",
          "description": "to request zoom call support"
        },
        "multiple_attachments": {
          "title": "You can only send 1 attachment at a time",
          "description": "to send multiple attachments"
        },
        "resume_campaign": {
          "title": "Resume campaign is an Advance Plan feature",
          "description": "to resume your campaign"
        },
        "batching": {
          "title": "Batching is a Premium feature",
          "description": "to use batching"
        },
        "smart_reply": {
          "title": "Quick reply is a Premium feature",
          "description": "to use quick reply"
        },
        "download_chat_contacts": {
          "title": "Export chat contacts is an Advance feature",
          "description": "to download chat contacts"
        },
        "download_group_contacts": {
          "title": "Export group contacts is a Premium feature",
          "description": "to download group contacts"
        },
        "schedule": {
          "title": "Scheduling is an Advance Plan feature",
          "description": "to schedule your messages"
        },
        "default": {
          "title": "",
          "description": "to continue using that feature"
        },
        "business_chat_link": {
          "title": "Business chat link is only for Advance Plan users",
          "description": "to generate a business chat link"
        },
        "time_gap": {
          "title": "Default time gap is 30 seconds",
          "description": "to randomize or customize the time gap"
        },
        "stop_campaign": {
          "title": "Stop campaign is a Premium feature",
          "description": "to stop your campaign"
        },
        "pause_campaign": {
          "title": "Pause campaign is an Advance Plan feature",
          "description": "to pause your campaign"
        },
        "send_message": {
          "title": "Premium Expired",
          "description": "to send messages"
        },
        "custom_random_time_gap": {
          "title": "Custom random time gap is a Premium feature",
          "description": "to randomize or customize the time gap"
        }
      },
      "PRICING": {
        "kuwait": {
          "monthly": {
            "basic_plan": {
              "discounted": "5.99",
              "original": "9.99"
            },
            "advance_plan": {
              "discounted": "7.99",
              "original": "11.99"
            }
          },
          "currency": "USD",
          "currency_symbol": "$",
          "annually": {
            "basic_plan": {
              "final": "59.99",
              "monthly_final": "4.99"
            },
            "advance_plan": {
              "final": "79.99",
              "monthly_final": "6.49"
            }
          }
        },
        "singapore": {
          "monthly": {
            "basic_plan": {
              "final": "5.99",
              "discounted": "8.99",
              "original": "10.99"
            },
            "advance_plan": {
              "final": "7.99",
              "discounted": "11.99",
              "original": "15.99"
            }
          },
          "currency": "SGD",
          "currency_symbol": "SGD",
          "annually": {
            "basic_plan": {
              "final": "59.99",
              "monthly_final": "4.99"
            },
            "advance_plan": {
              "final": "74.99",
              "monthly_final": "6.49"
            }
          }
        },
        "egypt": {
          "monthly": {
            "basic_plan": {
              "final": "179.99",
              "discounted": "179.99",
              "original": "349.99"
            },
            "advance_plan": {
              "final": "249.99",
              "discounted": "249.99",
              "original": "499.99"
            }
          },
          "currency": "EGP",
          "currency_symbol": "EGP",
          "annually": {
            "basic_plan": {
              "final": "1899.99",
              "monthly_final": "157.99"
            },
            "advance_plan": {
              "final": "2599.99",
              "monthly_final": "215.99"
            }
          }
        },
        "israel": {
          "monthly": {
            "basic_plan": {
              "final": "15.99",
              "discounted": "20.99",
              "original": "24.99"
            },
            "advance_plan": {
              "final": "24.99",
              "discounted": "29.99",
              "original": "39.99"
            }
          },
          "currency": "ILS",
          "currency_symbol": "ILS",
          "annually": {
            "basic_plan": {
              "final": "129.99",
              "monthly_final": "11.99"
            },
            "advance_plan": {
              "final": "179.99",
              "monthly_final": "15.99"
            }
          }
        },
        "uk": {
          "monthly": {
            "basic_plan": {
              "final": "5.99",
              "discounted": "5.99",
              "original": "9.99"
            },
            "advance_plan": {
              "final": "7.99",
              "discounted": "7.99",
              "original": "11.99"
            }
          },
          "currency": "GBP",
          "currency_symbol": "GBP",
          "annually": {
            "basic_plan": {
              "final": "59.99",
              "monthly_final": "4.99"
            },
            "advance_plan": {
              "final": "79.99",
              "monthly_final": "6.49"
            }
          }
        },
        "uae": {
          "monthly": {
            "basic_plan": {
              "final": "21.99",
              "discounted": "21.99",
              "original": "34.99"
            },
            "advance_plan": {
              "final": "29.99",
              "discounted": "29.99",
              "original": "43.99"
            }
          },
          "currency": "AED",
          "currency_symbol": "AED",
          "annually": {
            "basic_plan": {
              "final": "199.99",
              "monthly_final": "16.49"
            },
            "advance_plan": {
              "final": "279.99",
              "monthly_final": "23.49"
            }
          }
        },
        "saudi_arabia": {
          "monthly": {
            "basic_plan": {
              "final": "21.99",
              "discounted": "19.99",
              "original": "29.99"
            },
            "advance_plan": {
              "final": "29.99",
              "discounted": "29.99",
              "original": "45.99"
            }
          },
          "currency": "SAR",
          "currency_symbol": "SAR",
          "annually": {
            "basic_plan": {
              "final": "199.99",
              "monthly_final": "16.49"
            },
            "advance_plan": {
              "final": "279.99",
              "monthly_final": "23.99"
            }
          }
        },
        "international": {
          "monthly": {
            "basic_plan": {
              "final": "5.99",
              "discounted": "5.99",
              "original": "9.99"
            },
            "advance_plan": {
              "final": "7.99",
              "discounted": "7.99",
              "original": "11.99"
            }
          },
          "currency": "USD",
          "currency_symbol": "$",
          "annually": {
            "basic_plan": {
              "final": "59.99",
              "monthly_final": "4.99"
            },
            "advance_plan": {
              "final": "79.99",
              "monthly_final": "6.79"
            }
          }
        },
        "india": {
          "monthly": {
            "basic_plan": {
              "final": "299",
              "discounted": "299",
              "original": "599"
            },
            "advance_plan": {
              "final": "499",
              "discounted": "499",
              "original": "699"
            }
          },
          "currency": "INR",
          "currency_symbol": "₹",
          "annually": {
            "basic_plan": {
              "final": "2999",
              "monthly_final": "249"
            },
            "advance_plan": {
              "final": "4499",
              "monthly_final": "374"
            }
          }
        },
        "indonesia": {
          "monthly": {
            "basic_plan": {
              "final": "49999",
              "discounted": "49999",
              "original": "75999"
            },
            "advance_plan": {
              "final": "69999",
              "discounted": "69999",
              "original": "99999"
            }
          },
          "currency": "IDR",
          "currency_symbol": "IDR",
          "annually": {
            "basic_plan": {
              "final": "599999",
              "monthly_final": "49999"
            },
            "advance_plan": {
              "final": "749999",
              "monthly_final": "62499"
            }
          }
        }
      },
      "PRICING_DATA": {
        "free_trial_expired": {
          "advance_price": {
            "kuwait": "$7.99*",
            "singapore": "SGD 7.99*",
            "egypt": "EGP 249.99*",
            "israel": "ILS 24.99*",
            "uk": "GBP 7.99*",
            "uae": "AED 29.99*",
            "saudi_arabia": "SAR 29.99*",
            "india": "499*",
            "international": "$7.99*",
            "indonesia": "69999* IDR"
          },
          "lastPlan": "freeTrial",
          "basic_price": {
            "kuwait": "$5.99*",
            "singapore": "SGD 5.99*",
            "egypt": "EGP 179.99*",
            "israel": "ILS 15.99*",
            "uk": "GBP 5.99*",
            "uae": "AED 21.99*",
            "saudi_arabia": "SAR 21.99*",
            "india": "299*",
            "international": "$5.99*",
            "indonesia": "49999* IDR"
          }
        },
        "advance_promo_expired": {
          "advance_price": {
            "kuwait": "$7.99*",
            "singapore": "SGD 7.99*",
            "egypt": "EGP 249.99*",
            "israel": "ILS 24.99*",
            "uk": "GBP 7.99*",
            "uae": "AED 29.99*",
            "saudi_arabia": "SAR 29.99*",
            "india": "499*",
            "international": "$7.99*",
            "indonesia": "69999* IDR"
          },
          "lastPlan": "freeTrial",
          "basic_price": {
            "kuwait": "$5.99*",
            "singapore": "SGD 5.99*",
            "egypt": "EGP 179.99*",
            "israel": "ILS 15.99*",
            "uk": "GBP 5.99*",
            "uae": "AED 21.99*",
            "saudi_arabia": "SAR 21.99*",
            "india": "299*",
            "international": "$5.99*",
            "indonesia": "49999* IDR"
          }
        },
        "buy_annual": {
          "advance_price": {
            "kuwait": "$7.99*",
            "singapore": "SGD 7.99*",
            "egypt": "EGP 249.99*",
            "israel": "ILS 24.99*",
            "uk": "GBP 7.99*",
            "uae": "AED 29.99*",
            "saudi_arabia": "SAR 29.99*",
            "india": "499*",
            "international": "$7.99*",
            "indonesia": "69999* IDR"
          },
          "lastPlan": "freeTrial",
          "basic_price": {
            "kuwait": "$5.99*",
            "singapore": "SGD 5.99*",
            "egypt": "EGP 179.99*",
            "israel": "ILS 15.99*",
            "uk": "GBP 5.99*",
            "uae": "AED 21.99*",
            "saudi_arabia": "SAR 21.99*",
            "india": "299*",
            "international": "$5.99*",
            "indonesia": "49999* IDR"
          }
        },
        "premium_expired": {
          "advance_price": {
            "kuwait": "$7.99*",
            "singapore": "SGD 7.99*",
            "egypt": "EGP 249.99*",
            "israel": "ILS 24.99*",
            "uk": "GBP 7.99*",
            "uae": "AED 29.99*",
            "saudi_arabia": "SAR 29.99*",
            "india": "499*",
            "international": "$7.99*",
            "indonesia": "69999* IDR"
          },
          "lastPlan": "planExpired",
          "basic_price": {
            "kuwait": "$5.99*",
            "singapore": "SGD 5.99*",
            "egypt": "EGP 179.99*",
            "israel": "ILS 15.99*",
            "uk": "GBP 5.99*",
            "uae": "AED 21.99*",
            "saudi_arabia": "SAR 21.99*",
            "india": "299*",
            "international": "$5.99*",
            "indonesia": "49999* IDR"
          }
        },
        "free_trial_reminder": {
          "advance_price": {
            "kuwait": "$7.99*",
            "singapore": "SGD 7.99*",
            "egypt": "EGP 249.99*",
            "israel": "ILS 24.99*",
            "uk": "GBP 7.99*",
            "uae": "AED 29.99*",
            "saudi_arabia": "SAR 29.99*",
            "india": "499*",
            "international": "$7.99*",
            "indonesia": "69999* IDR"
          },
          "lastPlan": "freeTrial",
          "basic_price": {
            "kuwait": "$5.99*",
            "singapore": "SGD 5.99*",
            "egypt": "EGP 179.99*",
            "israel": "ILS 15.99*",
            "uk": "GBP 5.99*",
            "uae": "AED 21.99*",
            "saudi_arabia": "SAR 21.99*",
            "india": "299*",
            "international": "$5.99*",
            "indonesia": "49999* IDR"
          }
        }
      },
      "REPLACEMENT_HTML_TAGS": {
        "ITALIC": {
          "replaceback_pattern": "<em class=\"_ao3e selectable-text copyable-text\" data-app-text-template=\"_${appText}_\">$1</em>",
          "replacement_pattern": "◈☱$2☱◈",
          "replaceback_regex": "/◈☱(.*?)☱◈/gi",
          "replacement_regex": "/<em(.*?)>(.*?)</em>/gi"
        },
        "UNORDERED_LIST": {
          "replaceback_pattern": "<li dir=\"auto\" class=\"x1ye3gou x1jieuv1 xo7wnuk x1sy0ulg xt1y1ed xlu7um4 xm78dhd x1r4uxqn\"><span class=\"_ao3e selectable-text copyable-text\" data-pre-plain-text=\"- \">$1</span></li>",
          "replacement_pattern": "⚉⚏$3⚏⚉",
          "replaceback_regex": "/⚉⚏(.*?)⚏⚉/gi",
          "replacement_regex": "/<li(.*?)><span(.*?)>(.*?)</span></li>/gi"
        },
        "ORDERED_LIST_END": {
          "replacement_regex": "/</ol>/gi",
          "replacement_pattern": "🀜🀝🀞"
        },
        "ORDERED_LIST": {
          "replaceback_pattern": "<li dir=\"auto\" value=\"$1\" class=\"x1h0ha7o\"><span class=\"_ao3e selectable-text copyable-text\" data-pre-plain-text=\"$1. \">$2</span></li>",
          "replacement_pattern": "❖⚌$2= $5⚌❖",
          "replaceback_regex": "/❖⚌(.*?)= (.*?)⚌❖/gi",
          "replacement_regex": "/<li(.*?)value=\"(.*?)\"(.*?)><span(.*?)>(.*?)</span></li>/gi"
        },
        "CODE": {
          "replaceback_pattern": "<code class=\"_ao3e selectable-text copyable-text x1lcm9me x1yr5g0i xrt01vj x10y3i5r x14bl8p4 x10jhi2x x1e558r4 x150jy0e x1nn3v0j x1120s5i\" data-app-text-template=\"`${appText}`\">$1</code>",
          "replacement_pattern": "▮☳$2☳▮",
          "replaceback_regex": "/▮☳(.*?)☳▮/gi",
          "replacement_regex": "/<code(.*?)>(.*?)</code>/gi"
        },
        "STRIKETHROUGH": {
          "replaceback_pattern": "<del class=\"_ao3e selectable-text copyable-text\" data-app-text-template=\"~${appText}~\">$1</del>",
          "replacement_pattern": "◎☲$2☲◎",
          "replaceback_regex": "/◎☲(.*?)☲◎/gi",
          "replacement_regex": "/<del(.*?)>(.*?)</del>/gi"
        },
        "EMOJI": {
          "replacement_regex": "/<img(.*?)>/gi",
          "replacement_pattern": "▣▤▥"
        },
        "LINK": {
          "replacement_regex": "/<a(.*?)>(.*?)</a>/gi",
          "replacement_pattern": "◬◭◮"
        },
        "BOLD": {
          "replaceback_pattern": "<strong class=\"_ao3e selectable-text copyable-text\" data-app-text-template=\"*${appText}*\">$1</strong>",
          "replacement_pattern": "◉☰$2☰◉",
          "replaceback_regex": "/◉☰(.*?)☰◉/gi",
          "replacement_regex": "/<strong(.*?)>(.*?)</strong>/gi"
        },
        "MENTION": {
          "replacement_regex": "/<span role=\"button\"(.*?)><span(.*?)>(.*?)<span(.*?)>(.*?)</span></span></span>/gi",
          "replacement_pattern": "▩▨▧"
        },
        "UNORDERED_LIST_END": {
          "replacement_regex": "/</ul>/gi",
          "replacement_pattern": "🀓🀔🀕"
        },
        "ORDERED_LIST_START": {
          "replacement_regex": "/<ol(.*?)>/gi",
          "replacement_pattern": "🀞🀝🀜"
        },
        "UNORDERED_LIST_START": {
          "replacement_regex": "/<ul(.*?)>/gi",
          "replacement_pattern": "🀕🀔🀓"
        }
      },
      "RTL_LANGUAGE_CODES": [
        "ar",
        "he",
        "fa",
        "ur",
        "ps",
        "ug",
        "sd",
        "yi"
      ],
      "RUNTIME_CONFIG": {
        "reloadInject": true,
        "useOldInjectMethod": true,
        "useOldMessageSending": false
      },
      "SHOW_UPDATE_REMINDER_POPUP": false,
      "SUCCESS_POPUP_DATA": {
        "advance_promo_activated": {
          "icon": "success_gif",
          "description": "You're now using Advance Premium",
          "action_button": {
            "class": "action-green-btn",
            "text": "Okay",
            "id": "close_advance_promo_activated_popup"
          },
          "title": "Congrats!",
          "background_color": "#f99909"
        }
      },
      "TRIAL_FEATURES": [
        "Export Group Contacts",
        "Translate Conversation",
        "Quick Replies",
        "Customizable Time Gap",
        "Random Time Gap",
        "Chat Support",
        "Batching",
        "Caption",
        "Save Message Template",
        "Detailed Delivery report"
      ]
    };
    console.log(configMap);
    loadConfigData(configMap);

    chrome.storage.local.get(["CONFIG_DATA"], (res) => {
      // console.log("OLD CONFIG DATA:", res.CONFIG_DATA);
      chrome.storage.local.set({ CONFIG_DATA: configMap });

    });

  } catch (err) {
    console.log("Error while fetching config data:", err);
  }
}

function createConfigMap(configArray) {
  const configMap = {};
  configArray.forEach((item) => {
    if (item.name && item.data !== null) {
      configMap[item.name] = item.data;
    }
  });
  return configMap;
}

// Load AWS Config Data from API to Local Data (for content js)
function loadConfigData(configMap) {
  // Constant Arrays
  if (configMap.TRIAL_FEATURES) TRIAL_FEATURES = [...configMap.TRIAL_FEATURES];
  if (configMap.PREMIUM_FEATURES)
    PREMIUM_FEATURES = [...configMap.PREMIUM_FEATURES];
  // if (configMap.DID_YOU_KNOW_TIPS)
  //     DID_YOU_KNOW_TIPS = [...configMap.DID_YOU_KNOW_TIPS];
  // if (configMap.ALL_LANGUAGE_CODES)
  //     ALL_LANGUAGE_CODES = [...configMap.ALL_LANGUAGE_CODES];

  // Constant Objects
  if (configMap.HELP_MESSAGES) HELP_MESSAGES = { ...HELP_MESSAGES };
  if (configMap.GA_CONFIG) GA_CONFIG = { ...configMap.GA_CONFIG };
  // if (configMap.POPUP_DATA)
  //     POPUP_DATA = { ...configMap.POPUP_DATA };
  if (configMap.PRICING_DATA) PRICING_DATA = { ...configMap.PRICING_DATA };
  if (configMap.PREMIUM_REMINDER)
    PREMIUM_REMINDER = { ...configMap.PREMIUM_REMINDER };
  // if (configMap.SUCCESS_POPUP_DATA)
  //     SUCCESS_POPUP_DATA = { ...configMap.SUCCESS_POPUP_DATA };
  if (configMap.DOCUMENT_ELEMENT_SELECTORS)
    DOCUMENT_ELEMENT_SELECTORS = { ...configMap.DOCUMENT_ELEMENT_SELECTORS };
  if (configMap.FAQS) FAQS = { ...configMap.FAQS };
  if (configMap.RUNTIME_CONFIG) {
    RUNTIME_CONFIG = { ...configMap.RUNTIME_CONFIG };
    if (RUNTIME_CONFIG.reloadInject) {
      window.dispatchEvent(
        new CustomEvent("PROS::init", {
          detail: { useOldMethod: RUNTIME_CONFIG.useOldInjectMethod },
        })
      );
    }
  }
}

var ban_text_detected = false;
function detectBanText() {
  if (ban_text_detected) return;

  let banMessages = [
    "verify your phone number",
    "you will need to verify your phone number",
    "You have been logged out. To log back in, you will need to verify your phone number.", // English
    "आप लॉग आउट हो गए हैं। फिर से लॉग इन करने के लिए, आपको अपना फ़ोन नंबर सत्यापित करना होगा।", // Hindi
    "Você foi desconectado. Para fazer login novamente, será necessário verificar seu número de telefone.", // Brazilian Portuguese
    "Has cerrado sesión. Para volver a iniciar sesión, deberás verificar tu número de teléfono.", // Spanish
  ];

  for (const message of banMessages) {
    if (
      document.body.innerText.includes(message) ||
      document.body.innerText
        .toLowerCase()
        .includes(message.toLocaleLowerCase())
    ) {

      ban_text_detected = true;
    }
  }
}

async function messageCountOverPopup() {
  let {
    name: country_name,
    name_code: country_code,
    currency: country_currency,
  } = location_info;
  if (Object.keys(COUNTRY_WITH_SPECIFIC_PRICING).includes(country_code)) {
    country_name = COUNTRY_WITH_SPECIFIC_PRICING[country_code];
  } else {
    country_name = "international";
  }

  let body = document.querySelector("body");
  let popup = document.createElement("div");
  let modal_content = document.createElement("div");

  let popup_button = getPremiumReminderButton("Premium");

  if (document.querySelector(".premium_reminder_popup")) {
    body.removeChild(document.querySelector(".premium_reminder_popup"));
  }

  let remaining_count = 0;
  let total_count = 0;
  await new Promise((resolve) => {
    chrome.storage.local.get(["freeTrialExpiredUserData"], function (res) {
      const freeTrialExpiredUserData = res.freeTrialExpiredUserData;
      if (
        freeTrialExpiredUserData &&
        freeTrialExpiredUserData.sent_count != undefined &&
        freeTrialExpiredUserData.total_count != undefined
      ) {
        remaining_count =
          freeTrialExpiredUserData.total_count -
          freeTrialExpiredUserData.sent_count;
        total_count = freeTrialExpiredUserData.total_count;
      }
      resolve();
    });
  });

  popup.className = "premium_reminder_popup trial_popup";

  modal_content.className = "premium_reminder_content trial_content";
  modal_content.style.background = "#d5cd2f";
  modal_content.innerHTML = `
        <span id="close_premium_reminder_popup">
            <img class="CtaCloseBtn" src="${close_img_src}" alt="x">
        </span>
        <div class="premium_reminder_popup_title">
            <span class="oops_icon"></span>Oops!
        </div>
        <div class="reminder_title">
            ${`You have ${remaining_count} of daily ${total_count} messages remaining`}
        </div>
        <div class="reminder_description">
            ${await translate(
    `Please buy <<${"Premium"}>> to send unlimited messages!`
  )}
        </div>
        <div style="display:flex;justify-content:center;gap:20px;width:100%;margin-bottom:20px;">
            ${popup_button}
        </div> 
        <div style="display:flex;justify-content:center;align-items:center;gap:5px;">
            <img src=${large_logo_img} style="width:25px;" />
            <span style="font-weight:bold;">Assistant</span>
        </div>
        `;
  popup.appendChild(modal_content);
  body.appendChild(popup);

  let closePopupBtn = document.getElementById("close_premium_reminder_popup");
  closePopupBtn.addEventListener("click", function () {
    body.removeChild(popup);

  });
  $(".popup-btn").on("click", function (event) {
    let buttonType = $(this).attr("buttonType");
    if (buttonType && buttonType.length > 0) {

    }
  });


}

function showTooltip({
  elementParentClass,
  text,
  positionTop,
  positionBottom,
  positionLeft,
  positionRight,
}) {
  const parentElement = document.querySelector(elementParentClass);
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip_main_container";
  if (positionTop) tooltip.style.top = positionTop;
  if (positionBottom) tooltip.style.bottom = positionBottom;
  if (positionLeft) tooltip.style.left = positionLeft;
  if (positionRight) tooltip.style.right = positionRight;
  tooltip.innerHTML = `
        <div>
            ${text}
        </div>
        <div class="tooltip_arrow"></div>
    `;
  parentElement.appendChild(tooltip);
}

function removeTooltip() {
  const tooltip = document.querySelector(".tooltip_main_container");
  if (tooltip) {
    tooltip.remove();
  }
}

function handleShowTooltip(element) {
  const parentElement = document.querySelector(element.query);
  if (parentElement) {
    parentElement.addEventListener("mouseover", () => {
      showTooltip({
        elementParentClass: element.query,
        text: element.text,
        positionTop: element.top,
        positionLeft: element.left,
        positionRight: element.right,
        positionBottom: element.bottom,
      });
    });
    parentElement.addEventListener("mouseout", () => {
      removeTooltip();
    });
  }
}
