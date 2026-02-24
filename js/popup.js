var csv_data = [],
  csv_name = "",
  my_number = null,
  plan_duration = "Annual",
  plan_type = "Advance",
  last_plan_type = "Advance",
  customer_email,
  popup_numbers = "",
  expiry_date,
  selectedChatPhone = "",
  isDirty = false;
let currentLanguage = "default";
let allLanguageCodes = ALL_LANGUAGE_CODES;
let libphone = libphonenumber;
let country_info = "";
let pausedCampaignSelectorBind = false;
let allGroups = [],
  allContacts = [],
  groups_selected = [],
  contacts_selected = [],
  messageToggleSwitchValue = "numbers",
  isMultipleAccount = true,
  otherNumbers = [
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
    "+911111111111",
    "+912222222222",
    "+913333333333",
  ],
  parentEmail = "",
  showAllMultNumbers = true;
let subscribed_date = null;
let attachment_obj = false,
  group_obj = false,
  customization_obj = false,
  isTourRunning = false;
let translatedGroupMsgObj,
  translatedCustomObj,
  translatedAttachments,
  translatedContactMsgObj;
let is_excel_uploaded = false;
let lastScrollPosition = 0,
  lastScrollPosition_contacts = 0,
  selectedAll = false,
  fetching = false;
let freeTrial6MonthsExpired = false,
  freeTrial3MonthsExpired = false;
let freeTrialDuration1 = 90,
  freeTrialDuration2 = 90,
  freeTrialLimit1 = 1000,
  freeTrialLimit2 = 1000;
let showFreeTrialLimitMessage = true;
let autodownloadCampaignReport = false;

// checking if mac or not
let isMac = navigator.platform.toLowerCase().includes("mac");
let isLinux = navigator.platform.toLowerCase().includes("linux");
let location_info = {
  name: "international",
  name_code: "US",
  currency: "USD",
  default: true,
};

// Exit full-screen mode in Mac
chrome.windows.getCurrent().then((window) => {
  if (window.state === "fullscreen" && isMac) {
    chrome.windows.update(window.id, { state: "normal" });
  }
});

// Global error handler for extension context issues
window.addEventListener('error', function (event) {
  if (event.error && event.error.message &&
    (event.error.message.includes('Extension context invalidated') ||
      event.error.message.includes('message port closed'))) {
    console.warn('Extension context error caught:', event.error.message);
    event.preventDefault(); // Prevent the error from propagating
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function (event) {
  if (event.reason && event.reason.message &&
    (event.reason.message.includes('Extension context invalidated') ||
      event.reason.message.includes('message port closed'))) {
    console.warn('Extension context promise rejection caught:', event.reason.message);
    event.preventDefault(); // Prevent the error from propagating
  }
});

// Safe wrapper for chrome storage operations
function safeStorageGet(keys, callback) {
  if (!chrome.runtime?.id) {
    console.warn('Extension context invalid, skipping storage get');
    return;
  }

  try {
    chrome.storage.local.get(keys, function (result) {
      if (chrome.runtime.lastError) {
        console.warn('Storage get error:', chrome.runtime.lastError.message);
        return;
      }
      callback(result);
    });
  } catch (e) {
    console.warn('Storage get exception:', e.message);
  }
}

function safeStorageSet(items, callback) {
  if (!chrome.runtime?.id) {
    console.warn('Extension context invalid, skipping storage set');
    return;
  }

  try {
    chrome.storage.local.set(items, function () {
      if (chrome.runtime.lastError) {
        console.warn('Storage set error:', chrome.runtime.lastError.message);
        return;
      }
      if (callback) callback();
    });
  } catch (e) {
    console.warn('Storage set exception:', e.message);
  }
}

$(function () {
  init();
});


async function fetchTranslations(obj) {
  const translatedObj = JSON.parse(JSON.stringify(obj));

  for (const step of translatedObj.steps) {
    if (step.popover) {
      step.popover.title = await translate(step.popover.title);
      step.popover.description = await translate(step.popover.description);
    }
  }

  return translatedObj;
}

function handleMoreButtons() {
  const buttonContainer = $("#tours");
  const buttons = buttonContainer.find(".attachment-instructions-btn");
  const maxVisibleButtons = 3;

  if (buttons.length > maxVisibleButtons) {
    buttons.slice(maxVisibleButtons).hide();
    const moreButton = $(
      '<button class="attachment-instructions-btn more-btn"><span class="attachment-instructions-text attachment-instructions CtaBtn">...more</span></button>'
    );
    buttonContainer.append(moreButton);
    moreButton.on("click", function () {
      buttons.slice(maxVisibleButtons).addClass("active-class");
      moreButton.remove();
    });
  }
}

function handleAutoDownloadCampaignReport() {
  chrome.storage.local.get(["autodownloadCampaignReport"], function (res) {
    if (
      res.autodownloadCampaignReport == undefined ||
      res.autodownloadCampaignReport == null ||
      res.autodownloadCampaignReport == true
    ) {
      autodownloadCampaignReport = true;
    }
    const autoDownloadReportInput = document.getElementById(
      "auto_download_campaign_report"
    );
    if (autodownloadCampaignReport) {
      autoDownloadReportInput.checked = true;
    }
    chrome.storage.local.set({
      autodownloadCampaignReport: autodownloadCampaignReport,
    });
    autoDownloadReportInput.addEventListener("change", function () {
      autodownloadCampaignReport = autoDownloadReportInput.checked;
      chrome.storage.local.set({
        autodownloadCampaignReport: autodownloadCampaignReport,
      });
    });
  });
}
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.from !== "bg") return;
  if (msg.type === "CLEAR_ATTACHMENTS" || msg.CLEAR_ATTACHMENTS === true) {
    clearAllAttachmentsUI();
  }
});

function clearAllAttachmentsUI() {
  const box = document.getElementById("attachments-container");
  if (box) box.innerHTML = "";
  const input = document.getElementById("select-attachments");
  if (input) input.value = "";
}

window.addEventListener("DOMContentLoaded", (event) => {
  handleMoreButtons();
  handleDeleteBin();
  handleShowTooltip();
  getNextTour((nextTour, index) => {
    if (nextTour) {
      highlightTour(nextTour, index);
    }
  });

  var schedule_date = document.querySelector("#schedule_day");
  schedule_date.valueAsDate = new Date();
  let time = getCurrentTimein24HourFormat();
  setTimeout(() => {
    document.querySelector("input#schedule_time").value = time;
  }, 100);
  document.querySelectorAll('input[name="message_type"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const selectedValue = document.querySelector(
        'input[name="message_type"]:checked'
      ).value;
      toggleSendMessageToInput(selectedValue);
    });
  });
  // handleAutoDownloadCampaignReport();
});

document.addEventListener("DOMContentLoaded", async () => {
  // Find any open WhatsApp Web tab
  const tabs = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });

  if (tabs.length > 0) {
    const whatsappTab = tabs[0];

    // Switch focus to that tab
    await chrome.tabs.update(whatsappTab.id, { active: true });

    // Then reload it
    chrome.tabs.reload(whatsappTab.id);
  } else {
    console.log("No WhatsApp Web tab found");
  }
});


function showCustomizeContainer() {
  const message_box = document.querySelector(".message-box");
  const customize_container = document.querySelector(".customize_container");
  const attachment_instructions_container = document.querySelector(
    ".message-box .attachment-instruction-secondary"
  );
  if (message_box) {
    message_box.style.marginBottom = "0px";
    message_box.style.borderRadius = "3px 3px 0px 0px";
  }
  if (attachment_instructions_container) {
    attachment_instructions_container.hidden = "true";
  }
  if (customize_container) {
    customize_container.style.display = "flex";
  }
}

function hideCustomizationContainer() {
  const message_box = document.querySelector(".message-box");
  const customize_container = document.querySelector(".customize_container");
  const caption_customize_container = document.querySelector(
    ".caption_customize_container"
  );
  const attachment_instructions_container = document.querySelector(
    ".message-box .attachment-instruction-secondary"
  );
  if (message_box) {
    message_box.style.marginBottom = "10px";
    message_box.style.borderRadius = "3px";
  }
  if (attachment_instructions_container) {
    attachment_instructions_container.hidden = false;
  }
  if (customize_container) {
    customize_container.style.display = "none";
  }
  if (caption_customize_container) {
    caption_customize_container.style.display = "none";
  }
  showCaptionCustomizationContainer(false);
}

function populateCustomizeData() {
  column_headers = csv_data[0];
  const customize_section = document.querySelector(".customize_section");
  const caption_customize_section = document.querySelector(
    ".caption_customize_section"
  );
  if (customize_section) {
    customize_section.innerHTML = "";
    let customizeHtml = `
            <div class="customize_heading">Customizations: </div>
        `;
    column_headers.forEach((header, index) => {
      customizeHtml += `<div class="customize_box CtaBtn">${header}</div>`;
    });

    customize_section.innerHTML = customizeHtml;
    const customizeBoxes = document.querySelectorAll(".customize_box");
    customizeBoxes.forEach((box, index) => {
      box.addEventListener("click", (event) => {
        var message = document.querySelector("textarea#message").value;
        message += " {{" + event.target.innerText + "}}";
        document.querySelector("textarea#message").value = message;
        chrome.storage.local.set({ popup_message: message });
      });
    });
  }
  if (caption_customize_section) {
    caption_customize_section.innerHTML = "";
    let customizeHtml = `
            <div class="customize_heading">Customizations: </div>
        `;
    column_headers.forEach((header, index) => {
      customizeHtml += `<div class="caption_customize_box CtaBtn">${header}</div>`;
    });

    caption_customize_section.innerHTML = customizeHtml;
    const customizeBoxes = document.querySelectorAll(".caption_customize_box");
    customizeBoxes.forEach((box, index) => {
      box.addEventListener("click", async (event) => {
        let captionForIndividualAttachment = await new Promise((resolve) => {
          chrome.storage.local.get(
            ["captionForIndividualAttachment"],
            (res) => {
              resolve(res.captionForIndividualAttachment || []);
            }
          );
        });
        document.querySelectorAll(".caption-input").forEach((ele) => {
          if (!ele.classList.contains("hide")) {
            var eleId = ele.id.substring(ele.id.search(/\d/));
            ele.value += " {{" + event.target.innerText + "}}";
            captionForIndividualAttachment[eleId] = ele.value;
            chrome.storage.local.set({
              captionForIndividualAttachment: captionForIndividualAttachment,
            });
            return;
          }
        });
      });
    });
  }
}

function showCaptionCustomizationContainer(showConatiner) {
  const captionCustomizationContainer = document.querySelector(
    ".caption_customize_container"
  );
  if (captionCustomizationContainer) {
    if (showConatiner) captionCustomizationContainer.style.display = "flex";
    else captionCustomizationContainer.style.display = "none";
  }
}

async function toggleCaptionCustomizationInputDiv() {
  const captionCustomizationInputDiv = document.querySelector(
    ".caption_customization_input_div"
  );
  let internal_csv_data = await new Promise((resolve) => {
    chrome.storage.local.get(["csv_data"], (res) => {
      resolve(res.csv_data || []);
    });
  });
  if (captionCustomizationInputDiv) {
    if (internal_csv_data.length > 0) showCaptionCustomizationContainer(true);
    else showCaptionCustomizationContainer(false);
  }
}

function renderItems({
  name,
  objId,
  serizalizeId,
  isFirst = false,
  isGroup = true,
}) {
  const displayBoxClass = ".groups_display_box";
  const displayBox = document.querySelector(displayBoxClass);
  let selectedArray = isGroup ? groups_selected : contacts_selected;

  let htmlContent = displayBox.innerHTML;
  if (selectedArray.length <= 1 || isFirst) {
    htmlContent = ``;
  }

  htmlContent += `<span class="group_tag CtaBtn" id=${objId} data-id-field=${serizalizeId}>
            <span class="group">${name}</span>
             <button class="delete_group_tag" title="Remove ${isGroup ? "Group" : "Contact"}">
             <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="12" height="12" x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1zm4.242 13.829a1 1 0 1 1-1.414 1.414L12 13.414l-2.828 2.829a1 1 0 0 1-1.414-1.414L10.586 12 7.758 9.171a1 1 0 1 1 1.414-1.414L12 10.586l2.828-2.829a1 1 0 1 1 1.414 1.414L13.414 12z" data-name="Layer 2" fill="#ff0000" opacity="1" data-original="#000000" class=""></path></g></svg>
             </button>
        </span>`;

  displayBox.innerHTML = htmlContent;
}

function showItems(isGroup = true) {
  const itemsContainer = document.querySelector("#groups_container");
  itemsContainer.innerHTML = "";

  const selectedArray = isGroup ? groups_selected : contacts_selected;
  const allItems = isGroup ? allGroups : allContacts;

  const containerHtml = allItems
    .filter((item) => !selectedArray.includes(item.id._serialized))
    .map(
      (item) => `
            <div class="dropdown-item" id="${item.objId}" data-id-field="${item.id._serialized}">
                ${item.name}
            </div>
        `
    )
    .join("");

  itemsContainer.innerHTML = containerHtml;

  const searchInput = document.querySelector(".search_group_input");
  searchInput.addEventListener("input", function () {
    const inputValue = this.value.toLowerCase();

    allItems.forEach((item) => {
      const itemElement = document.querySelector(
        `#groups_container #${item.objId}`
      );

      if (!itemElement) {
        // console.warn(`Element with id "${item.objId}" not found.`);
        return;
      }

      const isMatch = item.name?.toLowerCase().includes(inputValue);
      const isSelected = selectedArray.includes(item.id._serialized);

      if (isMatch && !isSelected) {
        itemElement.classList.remove("hide");
      } else {
        itemElement.classList.add("hide");
      }
    });
  });

  document
    .querySelectorAll("#groups_container .dropdown-item")
    .forEach((listItem) => {
      listItem.addEventListener("click", function () {
        const objId = this.id;
        const name = this.innerText;
        const serizalizeId = this.getAttribute("data-id-field");

        if (!selectedArray.includes(serizalizeId)) {
          selectedArray.push(serizalizeId);
          chrome.storage.local.set({
            [isGroup ? "groups_selected" : "contacts_selected"]: selectedArray,
          });

          renderItems({ name, objId, serizalizeId, isGroup });
          listItem.classList.add("hide");
        }

        if (itemsContainer.clientHeight === 0) {
          document.querySelector(".groups_searchbar").click();
        }

        handleDeleteBin();
        // handleTemplateSaveBtn()
        // handleCampaignBox()
        showGroupsCampaignSelectorOrSave();
      });
    });
}

async function handleSelectAll() {
  const listItems = document.querySelectorAll(
    "#groups_container .dropdown-item"
  );
  const listItemContainer = document.querySelector("#groups_container");
  let isGroup = messageToggleSwitchValue === "groups";
  let selectedArray = isGroup ? groups_selected : contacts_selected;
  let allItems = isGroup ? allGroups : allContacts;

  if (selectedArray.length === allItems.length) {
    let msg = await translate(`All ${messageToggleSwitchValue} are selected`);
    alert(msg);
    return;
  }

  if (listItemContainer.classList.contains("hide")) {
    if (isGroup) {
      groups_selected = allGroups.map((item) => item.id._serialized);
      chrome.storage.local.set({ groups_selected: groups_selected });
      selectedAll = true;
    } else {
      contacts_selected = allContacts.map((item) => item.id._serialized);
      chrome.storage.local.set({ contacts_selected: contacts_selected });
      selectedAll = true;
    }
    fetching = false;
  } else {
    const visibleItems = Array.from(listItems).filter(
      (item) => !item.classList.contains("hide")
    );
    let updatedSelectedArray = visibleItems.map((item) =>
      item.getAttribute("data-id-field")
    );

    if (isGroup) {
      groups_selected = [
        ...new Set([...groups_selected, ...updatedSelectedArray]),
      ];
      chrome.storage.local.set({ groups_selected: groups_selected });
    } else {
      contacts_selected = [
        ...new Set([...contacts_selected, ...updatedSelectedArray]),
      ];
      chrome.storage.local.set({ contacts_selected: contacts_selected });
    }

    listItemContainer.classList.add("hide");
    document.querySelector(".message-box").classList.remove("hide_visibility");
  }
  renderSelectedItems();
}

function initvars() {
  document.getElementById("time_gap_type").style.display = "none";
  chrome.storage.local.get(
    [
      "popup_message",
      "show_advance_options",
      "time_gap",
      "time_gap_checked",
      "time_gap_type",
      "batch_checked",
      "batch_size",
      "batch_gap",
      "file_name",
      "csv_data",
      "customization",
      "schedule_time",
      "my_number",
      "plan_type",
      "last_plan_type",
      "plan_duration",
      "customer_name",
      "customer_email",
      "premiumUsageObject",
      "countOfDaysTranslateUsed",
      "lastDaySinceTranslateUsed",
      "attachmentShimmerLastShowed",
      "countOfDaysAttachmentShimmerShown",
      "pausedCampaign",
      "allGroupData",
      "allContactData",
      "groups_selected",
      "contacts_selected",
      "send_messages_to",
      "resumeCampaign",
      "subscribed_date",
      "linuxInputAttachments",
      "linuxCSVAttachment",
      "location_info",
      "currentLanguage",
      "pausedCampaignsList",
      "expiry_date",
    ],
    function (result) {
      if (result.currentLanguage) {
        currentLanguage = result.currentLanguage;
      }
      if (result.popup_message !== undefined) {
        document.querySelector("textarea#message").value = result.popup_message;
      }
      if (result.schedule_time !== undefined) {
        document.querySelector("#schedule_time").value = result.schedule_time;
      }
      if (result.allGroupData) {
        allGroups = result.allGroupData;
      }
      if (result.allContactData) {
        allContacts = result.allContactData;
      }
      if (result.subscribed_date) {
        subscribed_date = result.subscribed_date;
      }
      if (result.file_name !== undefined && result.file_name !== "") {
        is_excel_uploaded = true;
        set_csv_styles(result.file_name);
        showCustomizeContainer();
        csv_data = result.csv_data;
        if (csv_data) {
          var column_headers = csv_data[0];
          // $('#customized_arr').empty();
          // $('#customized_arr').append($('<option disabled selected></option>').val('Select Option').html('Select Option'));
          // $.each(column_headers, function (i, p) {
          //     $('#customized_arr').append($('<option></option>').val(p).html(p));
          // });
          populateCustomizeData();
        }
      }
      if (result.my_number === undefined) my_number = null;
      else {
        my_number = result.my_number;
      }
      if (!my_number) {
        // document.getElementById("add_number_popup").style.display = "block";
      }
      if (result.plan_type !== undefined) {
        plan_type = result.plan_type;
      }
      if (result.plan_duration !== undefined) {
        plan_duration = result.plan_duration;
      }
      if (result.expiry_date !== undefined) {
        expiry_date = result.expiry_date;
      }
      if (result.last_plan_type !== undefined) {
        last_plan_type = result.last_plan_type;
      }
      location_info = result.location_info || location_info;
      if (result.customer_email !== undefined)
        customer_email = result.customer_email;
      loadScheduledCampaigns(result.scheduled_campaigns);
      scheduleExpiredPopup();

      if (true) {
        if (result.time_gap_checked) {
          document.querySelector("#time_gap_checked").checked =
            result.time_gap_checked;
          document.getElementById("time_gap_type").style.display = "flex";
          if (result.time_gap_type) {
            document.querySelector("#" + result.time_gap_type).checked = true;
          }
          if (result.time_gap_type == "random")
            disableNumberTimeGapInput("sec");
          else disableNumberTimeGapInput("random");
        }
        if (result.time_gap) {
          var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
          if (values.includes(parseInt(result.time_gap))) {
            const index = values.indexOf(parseInt(result.time_gap));
            document.querySelector("#slider_time_gap_sec").value = index;
          } else if (result.time_gap > 20) {
            document.querySelector("#slider_time_gap_sec").value =
              values.length - 1;
          } else if (result.time_gap == 0) {
            document.querySelector("#slider_time_gap_sec").value = 3;
          }
          document.querySelector("#time_gap_sec").value = result.time_gap;
        }
        if (result.batch_checked) {
          document.querySelector("#batch_checked").checked =
            result.batch_checked;
          document.getElementById("batch_info").style.display = "grid";
        }
        if (result.batch_size) {
          var values = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
          ];
          if (values.includes(parseInt(result.batch_size))) {
            const index = values.indexOf(parseInt(result.batch_size));
            document.querySelector("#slider_batch_size").value = index;
          } else if (result.batch_size > 50) {
            document.querySelector("#slider_batch_size").value =
              values.length - 1;
          } else if (result.batch_gap == 0) {
            document.querySelector("#slider_batch_size").value =
              values.length - 1;
          }
          document.querySelector("#batch_size").value = result.batch_size;
        }
        if (result.batch_gap) {
          var values = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
          ];
          if (values.includes(parseInt(result.batch_gap))) {
            const index = values.indexOf(parseInt(result.batch_gap));
            document.querySelector("#slider_batch_gap").value = index;
          } else if (result.batch_gap > 50) {
            document.querySelector("#slider_batch_gap").value =
              values.length - 1;
          } else if (result.batch_gap == 0) {
            document.querySelector("#slider_batch_gap").value = 13;
          }
          document.querySelector("#batch_gap").value = result.batch_gap;
        }
      }

      // Changing "live support" btn to "Email Support" btn for non-premium indonesian numbers
      if (result.my_number && result.my_number.startsWith(62) && !isPremium()) {
        document.getElementById("live_support_text").hidden = true;
        document.getElementById("email_support_text").hidden = false;
      }
      if (result.groups_selected) {
        groups_selected = result.groups_selected;
      }
      if (result.contacts_selected) {
        contacts_selected = result.contacts_selected;
      }
      if (result.send_messages_to) {
        if (result.send_messages_to == "groups") {
          messageToggleSwitchValue = "groups";
          document.querySelector("#message_type_groups").click();
        } else if (result.send_messages_to == "contacts") {
          messageToggleSwitchValue = "contacts";
          document.querySelector("#message_type_contact").click();
        } else {
          messageToggleSwitchValue = "numbers";
        }

        if (result.popup_message !== undefined) {
          document.querySelector("#message").value = result.popup_message;
        }
      }

      // updating premium usage for time gap and batch gap
      if (result.premiumUsageObject !== undefined) {
        let updatedPremiumUsageObject = { ...result.premiumUsageObject };
        if (result.time_gap_checked) {
          updatedPremiumUsageObject = {
            ...updatedPremiumUsageObject,
            timeGap: true,
          };
        }
        if (result.batch_checked) {
          updatedPremiumUsageObject = {
            ...updatedPremiumUsageObject,
            batching: true,
          };
        }
        chrome.storage.local.set({
          premiumUsageObject: updatedPremiumUsageObject,
        });
      }
      // Showing shimmer effect for translate feature - first 5 days
      let today = new Date().toDateString();
      let lastDay = result.lastDaySinceTranslateUsed || "";
      let countDays = result.countOfDaysTranslateUsed || 0;
      if (lastDay == today || countDays > 5) {
        $("#language-selector").removeClass("shimmer");
        $("#customization-in-box").removeClass("shimmer");
        $("#translate-icon").removeClass("shimmer");
      } else {
        chrome.storage.local.set({ countOfDaysTranslateUsed: countDays + 1 });
        chrome.storage.local.set({ lastDaySinceTranslateUsed: today });
      }

      // Showing shimmer effect for attachment feature - first 3 days
      const lastDayWhenAttachmentShimmerShown =
        result.attachmentShimmerLastShowed || "";
      const countOfDaysAttachmentShimmerShown =
        result.countOfDaysAttachmentShimmerShown || 0;
      if (
        lastDayWhenAttachmentShimmerShown == today ||
        countOfDaysAttachmentShimmerShown > 3
      ) {
        $("#add-attachments").removeClass("shimmer");
      } else {
        chrome.storage.local.set({
          countOfDaysAttachmentShimmerShown:
            countOfDaysAttachmentShimmerShown + 1,
        });
        chrome.storage.local.set({ attachmentShimmerLastShowed: today });
      }
      document
        .querySelector("#schedule_selector")
        .addEventListener("click", async function (e) {
          chrome.storage.local.get(["scheduled_campaigns"], function (res) {
            const scheduledCampaigns = res.scheduled_campaigns || [];
            loadScheduledCampaigns(scheduledCampaigns);
            $("#schedule_container").toggleClass("hide");
            $("#schedule_selector").toggleClass("active");
          });
        });
      if (result.pausedCampaign && result.pausedCampaign.paused == true) {
        let pausedCampaignsList = result.pausedCampaignsList;
        if (!pausedCampaignsList) pausedCampaignsList = [];
        let pausedCampaignData = result.pausedCampaign;
        pausedCampaignsList.push({
          ...pausedCampaignData,
          campaignDate: getTodayDate(),
        });
        result.pausedCampaignsList = pausedCampaignsList;
        result.pausedCampaign = null;
        chrome.storage.local.set({ pausedCampaign: null });
        chrome.storage.local.set({ pausedCampaignsList: pausedCampaignsList });
      }
      if (
        result.resumeCampaign &&
        result.resumeCampaign.isCampaignRunning == true &&
        result.pausedCampaign
      ) {
        result.pausedCampaign.index = result.resumeCampaign.index;
        let pausedCampaignsList = result.pausedCampaignsList;
        if (!pausedCampaignsList) pausedCampaignsList = [];
        let pausedCampaignData = result.pausedCampaign;
        pausedCampaignsList.push({
          ...pausedCampaignData,
          campaignDate: getTodayDate(),
        });
        result.pausedCampaignsList = pausedCampaignsList;
        chrome.storage.local.set({ pausedCampaign: null });
        chrome.storage.local.set({ pausedCampaignsList: pausedCampaignsList });
        chrome.storage.local.set({
          resumeCampaign: {
            isCampaignRunning: false,
            index: 0,
          },
        });
      }
      if (!pausedCampaignSelectorBind) {
        document
          .querySelector("#paused_campaign_selector")
          .addEventListener("click", async function (e) {
            console.log('aaa')
            chrome.storage.local.get(["pausedCampaignsList"], function (res) {
              const pausedCampaignsList = res.pausedCampaignsList || [];
              let newPausedCampaignsList = pausedCampaignsList.filter(
                (campaign) => {
                  let pausedDate = campaign.campaignDate;
                  let todayDate = getTodayDate();
                  let dateDiff = dateDiffInDays(todayDate, pausedDate);
                  return dateDiff <= 7;
                }
              );
              loadPausedCampaigns(newPausedCampaignsList);
              $("#paused_campaign_container").toggleClass("hide");
              $("#paused_campaign_selector").toggleClass("active");
              chrome.storage.local.set({
                pausedCampaignsList: newPausedCampaignsList,
              });
            });
          });
        pausedCampaignSelectorBind = true
      }
      if (result.linuxInputAttachments) {
        convertURLToFileAndFireChangeEvent(
          "linuxInputAttachments",
          "select-attachments",
          result.linuxInputAttachments
        );
      }
      if (result.linuxCSVAttachment) {
        convertURLToFileAndFireChangeEvent(
          "linuxCSVAttachment",
          "csv",
          result.linuxCSVAttachment
        );
      }
    }
  );
}

function convertURLToFileAndFireChangeEvent(
  dataType,
  inputId,
  inputAttachments
) {
  const files = inputAttachments.map((fileData) => {
    return dataURLtoFile(fileData.data, fileData.name, fileData.type);
  });

  const dataTransfer = new DataTransfer();

  files.forEach((file) => {
    dataTransfer.items.add(file);
  });

  const inputElement = document.getElementById(inputId);
  inputElement.files = dataTransfer.files;

  const event = new Event("change", { bubbles: true });
  inputElement.dispatchEvent(event);

  chrome.storage.local.set({ [dataType]: null });
}

function dataURLtoFile(dataurl, filename, mimeType) {
  const arr = dataurl.split(",");
  const mime = mimeType || arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function getNonPremiumHeaderText() {
  if (isAdvancePromo()) {
    return "AdvancePromo Enabled - Explore Features";
  } else if (isExpired()) {
    switch (last_plan_type) {
      case "FreeTrial":
        return "FreeTrial Expired - Buy Premium";
      case "AdvancePromo":
        return "AdvancePromo Expired - Buy Premium";
      case "Basic":
        return "Basic Plan Expired - Buy Again";
      case "Advance":
        return "Advance Plan Expired - Buy Again";
      default:
        return "Add Business Features - Buy Premium";
    }
  } else {
    return "Add Business Features - Buy Premium";
  }
}

function handlePausedCampaign(pausedCampaignData) {
  // if (!isAdvanceFeatureAvailable()) {
  //   chrome.storage.local.set({ pausedCampaign: null });
  //   chrome.storage.local.set({ pausedCampaignsList: null });
  //   chrome.storage.local.set({
  //     resumeCampaign: {
  //       isCampaignRunning: false,
  //       index: 0,
  //     },
  //   });
  //   sendMessageToBackground({
  //     type: "show_advance_popup",
  //     feature: "resume_campaign",
  //   });
  //   window.close();
  //   return;
  // }
  const {
    numbers,
    message,
    time_gap,
    csv_data,
    customization,
    caption_customization,
    random_delay,
    batch_size,
    batch_gap,
    caption,
  } = pausedCampaignData.campaignData;
  const campaign_type = pausedCampaignData.campaignData.campaign_type;
  const startIndex = pausedCampaignData.index;
  chrome.storage.local.set(
    { attachmentsData: pausedCampaignData.attachmentsData },
    function () {
      let canSendCampaign = checkIfCanSendCampaign(numbers.length);
      if (!canSendCampaign) {
        sendMessageToBackground({ type: "show_message_count_over_popup" });
        window.close();
        return;
      }
      if (campaign_type == "group_message")
        sendMessageToBackground({
          type: "group_message",
          groups: numbers,
          message: message,
          time_gap: time_gap,
          csv_data: csv_data,
          customization: customization,
          caption_customization: caption_customization,
          random_delay: random_delay,
          batch_size: batch_size,
          batch_gap: batch_gap,
          caption: caption,
          startIndex: startIndex,
          paused_report_rows: pausedCampaignData.report_rows,
          paused_sent_count: pausedCampaignData.sent_count,
          campaign_type: campaign_type,
        });
      else
        sendMessageToBackground({
          type: "number_message",
          numbers: numbers,
          message: message,
          time_gap: time_gap,
          csv_data: csv_data,
          customization: customization,
          caption_customization: caption_customization,
          random_delay: random_delay,
          batch_size: batch_size,
          batch_gap: batch_gap,
          caption: caption,
          startIndex: startIndex,
          paused_report_rows: pausedCampaignData.report_rows,
          paused_sent_count: pausedCampaignData.sent_count,
          campaign_type: campaign_type,
        });
      chrome.storage.local.set({ pausedCampaign: null });
      // window.close();
    }
  );
  chrome.storage.local.set({
    resumeCampaign: {
      isCampaignRunning: false,
      index: 0,
    },
  });

}

async function loadPausedCampaigns(pausedCampaigns) {
  $("#paused_campaign_container").html("");
  console.log('pausedCampaigns.length > 0', pausedCampaigns.length > 0)
  if (pausedCampaigns && pausedCampaigns.length > 0) {
    for (let index = 0; index < pausedCampaigns.length; index++) {
      let campaignName =
        pausedCampaigns[index].campaign_name || "Campaign-" + Number(index + 1);
      let campaignDate = formatScheduleDate(
        pausedCampaigns[index].campaignDate
      );
      $("#paused_campaign_container").append(`
                <div class="dropdown-item">
                    <p id="paused_campaign_${index}" class="campaign_name text">
                        <img src="./logo/pro-excel_icon.png"/>
                        <span style="color: #009A88;">${campaignName}</span>
                        <span style="color: #5D6063;">${campaignDate}</span>
                    </p>
                    <img id="${index}" class="paused_campaign_resume_btn btn CtaBtn" src="./logo/pro-resume_logo.png" style="margin-right:3px;"/>
                    <img id="${index}" class="paused_campaign_delete_btn btn CtaBtn" src="./logo/pro-delete-icon.png" style="padding:4px 4px 4px 0;margin:0px;" />
                </div>`);
    }
  } else {
    $("#paused_campaign_container").append(
      `<div class="dropdown-item">${await translate(
        "No paused campaigns"
      )}</div>`
    );
  }

  $(".paused_campaign_resume_btn").click(function () {
    let index = $(this).attr("id");
    const newPausedCampaigns = pausedCampaigns.filter(
      (campaign, i) => i != index
    );
    chrome.storage.local.set({ pausedCampaignsList: newPausedCampaigns });
    handlePausedCampaign(pausedCampaigns[index]);
  });
  $(".paused_campaign_delete_btn").click(function () {
    let index = $(this).attr("id");
    const newPausedCampaigns = pausedCampaigns.filter(
      (campaign, i) => i != index
    );
    chrome.storage.local.set(
      { pausedCampaignsList: newPausedCampaigns },
      function (res) {
        loadPausedCampaigns(newPausedCampaigns);
      }
    );
  });
}

// function init() {
//   checkVisit();
//   initvars();
//   getMessage();
//   loadConfigData();
//   sendMessageToBackground({ type: "reload_contacts" });
// }
$(function () {
  // Always open WhatsApp Web when extension opens
  checkVisit();

  // Wait for authentication before initializing other features
  window.addEventListener('userAuthenticated', function () {
    init();
  });

  // Check authentication asynchronously
  if (window.authSystem && window.authSystem.isAuthenticated) {
    window.authSystem.isAuthenticated().then(isAuth => {
      if (isAuth) {
        init();
      }
    });
  }
});

function init() {
  // Remove checkVisit() from here
  initvars();
  getMessage();
  loadConfigData();

  // Wait for WhatsApp tab to be ready before sending messages
  setTimeout(() => {
    sendMessageToBackground({ type: "reload_contacts" });
    checkActiveChat(); // Check immediately
  }, 3000);
}


function checkVisit() {
  chrome.storage.local.get(["no_of_visit"], function (res) {
    let visit_count = res.no_of_visit || 0;

    // Check if there is an open WhatsApp Web tab
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, function (tabs) {
      if (tabs.length > 0) {
        // If WhatsApp Web tab is already open and is not active, activate it
        if (!tabs[0].active) {
          chrome.tabs.update(tabs[0].id, { active: true });
        }
      } else {
        // Else open a new tab for WhatsApp Web
        chrome.tabs.create({ url: "https://web.whatsapp.com" });
      }
    });

    chrome.storage.local.set({ no_of_visit: visit_count + 1 });

  });
}

function loadConfigData() {
  chrome.storage.local.get(["CONFIG_DATA"], (res) => {
    if (res.CONFIG_DATA) {
      if (res.CONFIG_DATA.ALL_LANGUAGE_CODES)
        allLanguageCodes = res.CONFIG_DATA.ALL_LANGUAGE_CODES;
      if (res.CONFIG_DATA.GA_CONFIG) GA_CONFIG = res.CONFIG_DATA.GA_CONFIG;
      if (res.CONFIG_DATA.FAQS) FAQS = res.CONFIG_DATA.FAQS;
      if (res.CONFIG_DATA.FREE_TRIAL_LIMIT) {
        FREE_TRIAL_LIMIT = res.CONFIG_DATA.FREE_TRIAL_LIMIT;
        showFreeTrialLimitMessage = FREE_TRIAL_LIMIT.showLimitMessage;
        freeTrialDuration1 = FREE_TRIAL_LIMIT.duration1;
        freeTrialDuration2 = FREE_TRIAL_LIMIT.duration2;
        freeTrialLimit1 = FREE_TRIAL_LIMIT.limit1;
        freeTrialLimit2 = FREE_TRIAL_LIMIT.limit2;
        if (freeTrialDuration1 > freeTrialDuration2) {
          [freeTrialDuration1, freeTrialDuration2] = [
            freeTrialDuration2,
            freeTrialDuration1,
          ];
          [freeTrialLimit1, freeTrialLimit2] = [
            freeTrialLimit2,
            freeTrialLimit1,
          ];
        }
      }
    }
    if (showFreeTrialLimitMessage)
      showMessgesRemainingDiv(plan_type, last_plan_type, expiry_date);
  });
}

async function sendMessageToBackground(message) {
  try {
    // Check if chrome extension context is still valid
    if (!chrome.runtime?.id) {
      console.warn('Extension context invalidated, cannot send message');
      return;
    }

    const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
    if (!tabs || tabs.length === 0) {
      console.warn('No WhatsApp Web tab found');
      return;
    }
    const target = tabs.find(t => t.status === 'complete') || tabs[0];

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Message timeout - content script may not be ready');
    }, 5000);

    chrome.tabs.sendMessage(target.id, message, (response) => {
      clearTimeout(timeoutId);
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message;
        // Only log non-critical errors
        if (!errorMsg.includes('message port closed') &&
          !errorMsg.includes('Extension context invalidated')) {
          // console.warn('sendMessage error:', errorMsg);
        }
      }
    });
  } catch (e) {
    // Handle extension context errors gracefully
    if (e.message && (e.message.includes('Extension context invalidated') ||
      e.message.includes('message port closed'))) {
      console.warn('Extension communication error:', e.message);
    } else {
      console.error('sendMessageToBackground failed:', e);
    }
  }
}
// function sendMessageToBackground(message) {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, message);
//   });
// }
function show_error(error) {
  document.getElementById("error_message").style.display = "block";
  document.getElementById("error_message").innerText = error;
}

function reset_error() {
  document.getElementById("error_message").innerText = "";
  document.getElementById("error_message").style.display = "none";
}

async function sendMessageFunction() {
  let caption = await new Promise((resolve) => {
    chrome.storage.local.get(["captionForIndividualAttachment"], (res) => {
      resolve(res.captionForIndividualAttachment || []);
    });
  });
  chrome.storage.local.set({ captionForIndividualAttachment: [] });
  document.querySelector(".captionTextAreas").innerHTML = "";
  const messageSendingTo = messageToggleSwitchValue;
  var numbers_str = document.querySelector("textarea#numbers").value;
  var message = document.querySelector("textarea#message").value;
  var attachments_str = document.querySelector(
    "#attachments-container"
  ).innerText;
  var customization = true;
  let caption_customization = true;
  var time_gap,
    random_delay = false,
    batch_size,
    batch_gap;
  let send_attachment_first = false;
  if ($("#time_gap_checked").is(":checked")) {
    if ($("#time_gap_type input[type='radio']:checked").val() === "sec") {
      time_gap = parseInt(document.querySelector("#time_gap_sec").value);
    }
    if ($("#time_gap_type input[type='radio']:checked").val() === "random") {
      time_gap = 4; //Avg of random delay
      random_delay = true;
    }
    if ($("#time_gap_type input[type='radio']:checked").val() === "random_custom") {
      const fromValue = parseInt(document.querySelector("#time_gap_from").value);
      const toValue = parseInt(document.querySelector("#time_gap_to").value);

      if (isNaN(fromValue) || isNaN(toValue) || fromValue >= toValue) {
        show_error("Invalid range. From value must be less than To value.");
        return;
      }

      time_gap = Math.floor((fromValue + toValue) / 2);
      random_delay = true;
      custom_time_range = {
        from: fromValue,
        to: toValue
      };
      trackButtonClick("campaign_started_with_custom_time_gap");
    }
  } else {
    if (!isPremiumFeatureAvailable()) {
      time_gap = parseInt(30);
    } else {
      time_gap = parseInt(3);
    }
  }
  if ($("#batch_checked").is(":checked")) {
    // if (!isPremiumFeatureAvailable()) {
    //   sendMessageToBackground({
    //     type: "show_premium_popup",
    //     feature: "batching",
    //   });
    //   window.close();
    //   return;
    // } else {
    //   batch_size = document.querySelector("#batch_size").value;
    //   batch_gap = document.querySelector("#batch_gap").value;
    //   if (batch_gap) batch_gap = parseInt(batch_gap);
    //   if (batch_size) batch_size = parseInt(batch_size);
    // }
    batch_size = document.querySelector("#batch_size").value;
    batch_gap = document.querySelector("#batch_gap").value;
    if (batch_gap) batch_gap = parseInt(batch_gap);
    if (batch_size) batch_size = parseInt(batch_size);
  }
  if ($("#attachment-first-checkbox").is(":checked")) {
    send_attachment_first = true;
  }

  var numbers = getFilteredNumbers(numbers_str)
    .split(",")
    .map((num) => country_info.dial_code + num);
  if (!numbers_str && messageSendingTo == "numbers") {
    show_error("Please enter numbers to send");
    return;
  }
  if (groups_selected.length == 0 && messageSendingTo == "groups") {
    show_error("Please select groups to send");
    return;
  }
  if (contacts_selected.length == 0 && messageSendingTo == "contacts") {
    show_error("Please select contacts to send");
    return;
  }
  if (message.trim().length == 0 && attachments_str.length == 0) {
    show_error("Please enter message or attachment");
    return;
  }
  chrome.storage.local.get(["dsi854"], (res) => {
    let dsi854 = res.dsi854;
    if (caption.length > 0 && dsi854 < 10) {
      chrome.storage.local.set({ icu861: true });
    }
  });

  let recipients, recipients_type, campaign_type;
  if (messageSendingTo === "numbers") {
    recipients = numbers;
    recipients_type = "numbers";
    campaign_type = "number_message";
  } else if (messageSendingTo === "groups") {
    recipients = groups_selected;
    recipients_type = "groups";
    campaign_type = "group_message";
  } else if (messageSendingTo === "contacts") {
    recipients = contacts_selected.map((number) => number.replace("@c.us", ""));
    recipients_type = "numbers";
    campaign_type = "number_message";
  }

  let canSendCampaign = await checkIfCanSendCampaign(recipients.length);
  if (!canSendCampaign) {
    sendMessageToBackground({ type: "show_message_count_over_popup" });
    window.close();
    return;
  }

  sendMessageToBackground({
    type: campaign_type,
    [recipients_type]: recipients,
    message,
    time_gap,
    csv_data,
    customization,
    caption_customization,
    random_delay,
    batch_size,
    batch_gap,
    caption,
    send_attachment_first,
  });
  // window.close();
}

async function messagePreparation() {
  reset_error();
  let attachments = await new Promise((resolve) => {
    chrome.storage.local.get(["attachmentsData"], (res) => {
      resolve(res.attachmentsData || []);
    });
  });

  if (attachments.length > 3) {
    const confirmOverlay = document.querySelector(".confirm-ovelay");
    confirmOverlay.style.display = "flex";
    const cancelButton = document.querySelector(".cancelAction");
    const okButton = document.querySelector(".doAction");
    cancelButton.addEventListener("click", () => {
      confirmOverlay.style.display = "none";
    });
    okButton.addEventListener("click", () => {
      confirmOverlay.style.display = "none";
      sendMessageFunction();
    });
  } else {
    sendMessageFunction();
  }
}

function processExcel(data) {
  var workbook = XLSX.read(data, {
    type: "binary",
  });

  var firstSheet = workbook.SheetNames[0];
  var data = to_json(workbook);
  return data;
}

function to_json(workbook) {
  var result = {};
  workbook.SheetNames.forEach(function (sheetName) {
    var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });
    if (roa.length) result[sheetName] = roa;
  });
  return JSON.stringify(result, 2, 2);
}

function checkIfValidPhoneNumber(phoneNumber) {
  let doesContainAlphabet = /[a-zA-Z]/.test(phoneNumber);
  return !doesContainAlphabet;
}

function showInvalidExcelPopup() {

  const invalidTextDiv = document.querySelector(
    ".invalid-excel-popup-description"
  );
  invalidTextDiv.innerHTML =
    "First column should only contain phone numbers.</br>Check template excel below.";
  const uploadAnywayBtn = document.getElementById("upload-anyway-button");
  if (uploadAnywayBtn) uploadAnywayBtn.style.display = "none";
  let invalidExcelPopup = document.getElementById("invalid-excel-popup");
  invalidExcelPopup.classList.remove("hide");
}

function process_sheet_data_and_validate(data, checkForValid) {
  if (data && data.length > 0) {
    csv_data = [data[0]];
    var numbers = "";
    var column_headers = data[0];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        isValidPhoneNumber = checkIfValidPhoneNumber(data[i][0]);
        if (!isValidPhoneNumber) {
          customization_obj && driver(translatedCustomObj).destroy();
          customization_obj = false;
          showInvalidExcelPopup();
          unset_csv_styles();
          return;
        }
        csv_data.push(data[i]);
        numbers += data[i][0];
        if (i !== data.length - 1) numbers += ",";
      }
    }
    document.getElementById("numbers").value = numbers;
    populateCustomizeData();
    chrome.storage.local.set({ csv_data: csv_data });
    chrome.storage.local.set({ popup_numbers: numbers });
    $("#numbers").click();
    replaceNumbers(numbers);
    let isFirstRowValid = true;
    if (checkForValid) {
      for (const element of column_headers) {
        if (!isNaN(Number(element)) && element.toString().length >= 10) {
          isFirstRowValid = false;
        }
      }
    }
    if (!isFirstRowValid) {
      let invalidExcelPopup = document.getElementById("invalid-excel-popup");
      invalidExcelPopup.classList.remove("hide");
      const uploadAnywayBtn = document.getElementById("upload-anyway-button");
      uploadAnywayBtn.addEventListener("click", () => {
        invalidExcelPopup.classList.add("hide");
      });
    }
  }
}

function process_sheet_data(evt, checkForValid = true) {
  var f = evt.target.files[0];

  if (f) {
    var r = new FileReader();
    r.onload = (e) => {
      var data = processExcel(e.target.result);
      data = JSON.parse(data);
      data = data[Object.keys(data)[0]];
      process_sheet_data_and_validate(data, checkForValid);
    };
    r.readAsBinaryString(f);
  }
}

function set_csv_styles(file_name) {
  if (file_name) {
    csv_name = file_name.substring(0, 15);
    if (file_name.length > 15) file_name = csv_name + "...";

    $("#campaign-name").val(csv_name);
    $("#campaign-selector").css("display", "none");
    $("#uploaded-csv").prop("hidden", false).text(file_name);
    $("#customization").prop("checked", true).trigger("change");
    is_excel_uploaded = true;
    chrome.storage.local.set({ file_name: csv_name });
  }
}

function unset_csv_styles() {
  $("#csv").val("");
  $("#campaign-name").val("");
  $("#campaign-selector").css("display", "flex");
  $("#uploaded-csv").prop("hidden", true).text("");
  $("#customization").prop("checked", false).trigger("change");
  is_excel_uploaded = false;
  chrome.storage.local.set({ csv_data: [], file_name: "" });
  csv_data = [];
}

function getMessage() {
  $("#sender").off("click").click(function () {
    if (isPremiumExpired()) {
      console.log('is pro bro')
      sendMessageToBackground({
        type: "show_premium_popup",
        feature: "send_message",
      });
      // window.close();
      return;
    }

    messagePreparation();

  });
  $("#help").off("click").click(function () {
    sendMessageToBackground({ type: "help" });

    window.close();
  });
  $("#how_to_use").off("click").click(function () {

    if (messageToggleSwitchValue !== "numbers") {
      document.querySelector("#message_type_numbers").click();
    }
  });
  $("#request_chat_premium").off("click").click(function () {
    sendMessageToBackground({ type: "request_chat_premium" });

  });
  $("#request_zoom_premium").off("click").click(function () {
    if (isAdvanceFeatureAvailable()) {
      sendMessageToBackground({ type: "request_zoom_premium" });

    } else {
      sendMessageToBackground({
        type: "show_advance_popup",
        feature: "zoom_call_support",
      });
    }
    window.close();
  });
  $("#request_call_premium").off("click").click(function () {
    sendMessageToBackground({ type: "request_call_premium" });

  });
  $("#chat_link").off("click").click(function () {
    sendMessageToBackground({ type: "chat_link" });
    window.close();
  });
  function addCountryCodeSelectorToPremiumBlock() {
    const countrySelector = document.querySelector("#country-code-input-2");
    const initialCountry = country_info.name_code;
    const preferredCountries =
      initialCountry === "XX" ? [initialCountry] : ["XX", initialCountry];

    const intlTelInputConfig = {
      separateDialCode: true,
      autoHideDialCode: false,
      autoPlaceholder: "off",
      initialCountry: initialCountry,
      preferredCountries: preferredCountries,
      autoPlaceholder: "aggressive",
      utilsScript: "library/intlTelInput.utils.js",
    };
    window.intlTelInput(countrySelector, intlTelInputConfig);
  }
  function getCountryInfo() {
    const countrySelector = document.querySelector("#country-code-input-2");
    const intlTelInputInstance =
      window.intlTelInputGlobals.getInstance(countrySelector);
    let { name, iso2, dialCode } =
      intlTelInputInstance.getSelectedCountryData();
    return dialCode;
  }

  const convert_date = (date = null) => {
    if (!date) return null;
    return new Date(date);
  };

  const get_days_diff = (date1, date2) => {
    date1 = convert_date(date1);
    date2 = convert_date(date2);

    if (!date1 || !date2) return NaN;

    let days_diff = Math.floor(
      (date1.getTime() - date2.getTime()) / (1000 * 3600 * 24)
    );
    return days_diff;
  };

  $("#select_premium_features").click(async function () {
    document
      .querySelector(".premium_features_parent_div")
      .classList.add("black_background");
    document.getElementById("popup_functionality").style.display = "none";

    document
      .getElementById("select_functionality_container")
      .classList.remove("active");
    document.getElementById("select_premium_container").classList.add("active");

    document.getElementById("add_business_text").style.color = "#fff";
    document.getElementById("add_business_img").src = "logo/pro-plus-1.png";
    document.getElementById("ps-logo-right").src = "logo/pro-logo-text.png";

    if (isBasic() || isAdvance()) {
      document.querySelector("#transfer_premium_button").style.display = "flex";
    }

    const showCountrySelector = document.querySelector(
      "#show_country_selector"
    );
    if (showCountrySelector) {
      addCountryCodeSelectorToPremiumBlock();
      const requestTransferBtn = document.querySelector(
        "#request_transfer_btn"
      );
      if (requestTransferBtn) {
        requestTransferBtn.addEventListener("click", function () {
          const inputNumber = document.querySelector(
            "#premium_number_input"
          ).value;
          if (!inputNumber) return;

          let dialCode = getCountryInfo();
          if (dialCode == "00") return;

          if (dialCode == "52") dialCode += "1";
          const new_number = `${dialCode}${inputNumber}`;

          if (new_number === my_number) {
            document.querySelector("#transfer_premium_error").style.display =
              "block";
          } else {
            document.querySelector("#transfer_premium_error").style.display =
              "none";
            sendMessageToBackground({
              type: "transfer_premium",
              message: `Hi, I would like to transfer the premium from +${my_number} to +${new_number}`,
            });
            window.close();
          }
        });
      }
      showCountrySelector.addEventListener("click", () => {
        const premiumCountrySelectorContainer = document.querySelector(
          "#premium_country_selector_container"
        );
      });
    }

    // user info
    if (plan_type == "Expired") {
      let detailsText = getNonPremiumHeaderText() || "";
      detailsText = detailsText.split("-")[0];
      document.getElementById(
        "plan_details"
      ).innerHTML = `<span style="font-weight: 700;">${detailsText}</span> on : <span style="font-weight: 700;">+${my_number}</span>`;
    } else document.getElementById("plan_details").innerHTML = `<span style="font-weight: 700;">${plan_type} plan</span> enabled on : <span style="font-weight: 700;">+${my_number}</span>`;
    document.getElementById("customer_email").innerHTML = customer_email
      ? `Registered email : <span style="font-weight: 700;">${customer_email} </span>`
      : "";

    if (isPremium()) {
      // document.querySelector(".premium_feature_block").style.display = "flex";
      document.getElementById("add_business_img").src = "logo/pro-user-2.png";
    }
    // showing pie percentage

    // showMultipleAccountSection();
    showFaqsSection();

    // calling invoice function
    chrome.storage.local.get(["plan_duration"], function (result) {
      if (result.plan_duration) {
        if (result.plan_duration == "Monthly" || plan_type == "Expired") {
          document.querySelector(".invoice_feature_block").style.display =
            "flex";
          getInvoiceData();
        }
      }
    });
  });
  $("#select_functionality").off("click").click(function () {
    document
      .querySelector(".premium_features_parent_div")
      .classList.remove("black_background");
    document.getElementById("popup_functionality").style.display = "block";

    document
      .getElementById("select_functionality_container")
      .classList.add("active");
    document
      .getElementById("select_premium_container")
      .classList.remove("active");

    document.getElementById("add_business_text").style.color = "#009A88";
    document.getElementById("add_business_img").src = "logo/pro-plus.png";
    // document.getElementById("ps-logo-right").src =
    //   "logo/pro-logo-text-light.png";
    // user info
    if (isPremium()) {
      document.querySelector(".premium_feature_block").style.display = "flex";
      document.getElementById("add_business_img").src = "logo/pro-user-1.png";
    }
  });
  $("#back_to_functionality").off("click").click(function () {
    document.getElementById("popup_functionality").style.display = "block";
    document.getElementById("select_functionality").style.background =
      "#62D9C7";
  });

  $("#csv").on("click", function (event) {
    if (isLinux) {
      sendMessageToBackground({ type: "create_csv_input" });
      event.preventDefault();
      window.close();
    }
  });

  $("#csv").on("change", async function (e) {
    var file = document.getElementById("csv").files[0];
    if (file) {
      set_csv_styles(file.name);
      showCustomizeContainer();
      showCaptionCustomizationContainer(true);
    }
    if (file.type == "text/csv" || file.name.endsWith(".csv")) {
      let parsedData = await convertCSVtoExcel(file);
      process_sheet_data_and_validate(parsedData, true);
      setTimeout(() => {
        updateCountryNumberCount();
      }, 100);
    } else {
      process_sheet_data(e);
      setTimeout(() => {
        updateCountryNumberCount();
      }, 100);
    }
  });

  // check whether the time gap feature is enabled or not
  $("#time_gap_checked").on("change", function () {
    var checked = $("#time_gap_checked").is(":checked");
    var style = checked ? "flex" : "none";
    document.getElementById("time_gap_type").style.display = style;
    chrome.storage.local.set({ time_gap_checked: checked });
    // updating premium usage for time gap
    if (checked) {
      chrome.storage.local.get(["premiumUsageObject"], function (result) {
        if (result.premiumUsageObject !== undefined) {
          let updatedPremiumUsageObject = {
            ...result.premiumUsageObject,
            timeGap: true,
          };
          chrome.storage.local.set({
            premiumUsageObject: updatedPremiumUsageObject,
          });
        }
      });
    }
  });
  $("#batch_checked").on("change", function () {
    var checked = $("#batch_checked").is(":checked");
    var style = checked ? "grid" : "none";
    document.getElementById("batch_info").style.display = style;
    if (isPremiumFeatureAvailable())
      chrome.storage.local.set({ batch_checked: checked });

    // updating premium usage for batching
    let isBatchChecked = $("#batch_checked").is(":checked");
    if (isBatchChecked) {
      chrome.storage.local.get(["premiumUsageObject"], function (result) {
        if (result.premiumUsageObject !== undefined) {
          let updatedPremiumUsageObject = {
            ...result.premiumUsageObject,
            batching: true,
          };
          chrome.storage.local.set({
            premiumUsageObject: updatedPremiumUsageObject,
          });
        }
      });
    }
  });
  // if the slider_time_gap values is changed assign its value to the time_gap_value
  $("#slider_time_gap_sec").on("change", function () {
    var sliderBtn = document.querySelector("#slider_time_gap_sec");
    var numberBtn = document.querySelector("#time_gap_sec");
    var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
    numberBtn.value = values[sliderBtn.value];
    time_gap = numberBtn.value;
    // if (isPremiumFeatureAvailable()) {
    //   chrome.storage.local.set({ time_gap: time_gap });
    // } else {
    //   sendMessageToBackground({
    //     type: "show_premium_popup",
    //     feature: "time_gap",
    //   });
    //   window.close();
    // }
    chrome.storage.local.set({ time_gap: time_gap });
  });
  // take input from the input section and stores it in the local storage
  $("#time_gap_sec").on("change", function () {
    if (isPremiumFeatureAvailable()) {
      var time_gap = document.querySelector("#time_gap_sec").value;
      var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
      if (values.includes(parseInt(time_gap))) {
        const index = values.indexOf(parseInt(time_gap));
        document.querySelector("#slider_time_gap_sec").value = index;
      } else if (time_gap > 20) {
        document.querySelector("#slider_time_gap_sec").value =
          values.length - 1;
      } else if (time_gap == 0) {
        document.querySelector("#slider_time_gap_sec").value = 3;
        document.querySelector("#time_gap_sec").value = 3;
        time_gap = 3;
      }
      chrome.storage.local.set({ time_gap: time_gap });
    } else {
      sendMessageToBackground({
        type: "show_premium_popup",
        feature: "time_gap",
      });
      // window.close();
    }
  });
  // check if the random feature is selected or not
  $("#random").on("change", function () {
    disableNumberTimeGapInput("sec");
    // if (!isPremiumFeatureAvailable()) {
    //   sendMessageToBackground({
    //     type: "show_premium_popup",
    //     feature: "time_gap",
    //   });
    //   window.close();
    // }

  });
  $("#sec").on("change", function () {
    disableNumberTimeGapInput("random");
  });
  $("#slider_batch_size").on("change", function () {
    var values = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    ];
    const batchSize = document.querySelector("#batch_size");
    const sliderBatchSize = document.querySelector("#slider_batch_size");
    batchSize.value = values[sliderBatchSize.value];
    var batch_size = parseInt(document.querySelector("#batch_size").value);
    chrome.storage.local.set({ batch_size: batch_size });

  });
  $("#batch_size").on("change", function () {
    var batch_size = document.querySelector("#batch_size").value;
    var values = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    ];
    if (values.includes(parseInt(batch_size))) {
      const index = values.indexOf(parseInt(batch_size));
      document.querySelector("#slider_batch_size").value = index;
    } else if (batch_size > 50) {
      document.querySelector("#slider_batch_size").value = values.length - 1;
    } else if (batch_size == 0) {
      document.querySelector("#slider_batch_size").value = values.length - 1;
      document.querySelector("#slider_batch_size").value = 50;
      batch_size = 50;
    }
    chrome.storage.local.set({ batch_size: batch_size });

  });
  $("#slider_batch_gap").on("change", function () {
    var values = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    ];
    const batchGap = document.querySelector("#batch_gap");
    const sliderBatchGap = document.querySelector("#slider_batch_gap");
    batchGap.value = values[sliderBatchGap.value];
    var batch_gap = document.querySelector("#batch_gap").value;
    chrome.storage.local.set({ batch_gap: batch_gap });

  });
  $("#batch_gap").on("change", function () {
    var batch_gap = document.querySelector("#batch_gap").value;
    var values = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    ];
    if (values.includes(parseInt(batch_gap))) {
      const index = values.indexOf(parseInt(batch_gap));
      document.querySelector("#slider_batch_gap").value = index;
    } else if (batch_gap > 50) {
      document.querySelector("#slider_batch_gap").value = values.length - 1;
    } else if (batch_gap == 0) {
      document.querySelector("#slider_batch_gap").value = 13;
      batch_gap = 30;
    }
    chrome.storage.local.set({ batch_gap: batch_gap });

  });
  // this check whether input type is random or sec
  $("#time_gap_type input[type=radio]").on("change", function (e) {
    var value = e.target.value;
    chrome.storage.local.set({ time_gap_type: value });
  });
  $("#chat_link_info").off("click").click(function () {
    document.getElementById("chat_link_info_popup").style.display = "block";
  });

  $("#chat_link_info_popup_okay").off("click").click(function () {
    document.getElementById("chat_link_info_popup").style.display = "none";
  });
  $("#numbers").on("change", function (e) {
    var numbers = document.querySelector("textarea#numbers").value;
    chrome.storage.local.set({ popup_numbers: numbers });

  });
  $("#message").on("change", function (e) {
    var message = document.querySelector("textarea#message").value;
    chrome.storage.local.set({ popup_message: message });

  });
  $("#time_gap").on("change", function (e) {
    var time_gap = document.querySelector("#time_gap").value;

  });
  $("#customization").on("change", function (e) {
    var customization = document.querySelector("#customization").checked;
    chrome.storage.local.set({ customization: customization });

    // updating premium usage for customization
    if (customization) {
      chrome.storage.local.get(["premiumUsageObject"], function (result) {
        if (result.premiumUsageObject !== undefined) {
          let updatedPremiumUsageObject = {
            ...result.premiumUsageObject,
            customisation: true,
          };
          chrome.storage.local.set({
            premiumUsageObject: updatedPremiumUsageObject,
          });
        }
      });
    }
  });
  $("#customized_arr").on("change", function (e) {
    var val = document.querySelector("#customized_arr").value;
    var message = document.querySelector("textarea#message").value;
    message += " {{" + val + "}}";
    document.querySelector("textarea#message").value = message;
    chrome.storage.local.set({ popup_message: message });
  });
  $("#schedule_checkbox").on("change", function (e) {
    const isChecked = e.target.checked;
    if (isChecked) {
      document.getElementById("schedule_message_div").hidden = false;
      document.getElementById("schedule").hidden = false;
      document.getElementById("sender").hidden = true;
      document.querySelector("#schedule_day_div").style.display = "flex";
      document.querySelector("#schedule_time_div").style.display = "flex";
    } else {
      document.getElementById("schedule_message_div").hidden = true;
      document.getElementById("schedule").hidden = true;
      document.getElementById("sender").hidden = false;
      document.querySelector("#schedule_day_div").style.display = "none";
      document.querySelector("#schedule_time_div").style.display = "none";
    }
  });
  $("#schedule_time").on("change", function (e) {
    var schedule_time = document.querySelector("#schedule_time").value;
    chrome.storage.local.set({ schedule_time: schedule_time });
  });
  $("#survey_click").off("click").click(function () {
    document.getElementById("survey").style.display = "none";
    chrome.storage.local.set({ survey_click: true });

    window.open("https://forms.gle/uWMMreyGvkGozURb9", "_blank");
  });
  $("#my_number_submit").off("click").click(function () {
    var code = document.querySelector("#my_number_code").value;
    var number = document.querySelector("#my_number").value;
    if (!(code && number)) return;
    my_number = ("" + code + number).replace("+", "");
    document.getElementById("add_number_popup").style.display = "none";
    document.getElementById("confirm_number_popup").style.display = "block";
    document.getElementById("confirm_my_number").innerText = "+" + my_number;
  });
  $("#confirm_number_submit").off("click").click(function () {
    document.getElementById("confirm_number_popup").style.display = "none";
    chrome.storage.local.set({ my_number: my_number });

    sendMessageToBackground({ type: "reload_my_number" });
    // window.close();
  });
  $("#edit_number_submit").off("click").click(function () {
    document.getElementById("confirm_number_popup").style.display = "none";
    document.getElementById("add_number_popup").style.display = "block";

  });
  $("#unsubscribe").off("click").click(function () {
    sendMessageToBackground({ type: "unsubscribe" });

  });
  $("#learn_schedule").off("click").click(function () {
    sendMessageToBackground({ type: "learn_schedule" });

  });
  $("#schedule").off("click").click(function () {

    if (isAdvanceFeatureAvailable()) {

      reset_error();
      const messageSendingTo = messageToggleSwitchValue;
      var schedule_time = document.querySelector("#schedule_time").value;
      var schedule_date = document.querySelector("#schedule_day").value;
      var numbers_str = document.querySelector("textarea#numbers").value;
      var message = document.querySelector("textarea#message").value;
      var attachments_str = document.querySelector(
        "#attachments-container"
      ).innerText;
      var customization = true;
      var time_gap,
        random_delay = false,
        batch_size,
        batch_gap;
      var send_attachment_first = false;
      if ($("#time_gap_checked").is(":checked")) {
        if ($("#time_gap_type input[type='radio']:checked").val() === "sec") {
          time_gap = parseInt(document.querySelector("#time_gap_sec").value);
        }
        if (
          $("#time_gap_type input[type='radio']:checked").val() === "random"
        ) {
          time_gap = 4; //Avg of random delay
          random_delay = true;
        }
      } else {
        if (!isPremiumFeatureAvailable()) {
          time_gap = parseInt(30);
        } else {
          time_gap = parseInt(3);
        }
      }
      if (document.querySelector("#batch_checked").checked) {
        batch_size = document.querySelector("#batch_size").value;
        batch_gap = document.querySelector("#batch_gap").value;
        if (batch_size) batch_size = parseInt(batch_size);
        if (batch_gap) batch_gap = parseInt(batch_gap);
      }
      if ($("#attachment-first-checkbox").is(":checked")) {
        send_attachment_first = true;
      }

      var numbers = getFilteredNumbers(numbers_str)
        .split(",")
        .map((num) => country_info.dial_code + num);
      if (!numbers_str && messageSendingTo == "numbers") {
        show_error("Please enter numbers to send");
        return;
      }
      if (groups_selected.length == 0 && messageSendingTo == "groups") {
        show_error("Please select groups to send");
        return;
      }
      if (contacts_selected.length == 0 && messageSendingTo == "contacts") {
        show_error("Please select contacts to send");
        return;
      }
      if (message.trim().length == 0 && attachments_str.length == 0) {
        show_error("Please enter message or attachment");
        return;
      }
      if (!schedule_time) {
        show_error("Schedule time can't be blank");
        return;
      }

      chrome.storage.local.get(["scheduled_campaigns"], async function (res) {
        let scheduledCampaigns = res.scheduled_campaigns || [];

        // prev_time is the time at which the previous campaign will end
        let prev_time = null;
        let prev_date = null;
        if (scheduledCampaigns && scheduledCampaigns.length > 0) {
          prev_time =
            scheduledCampaigns[scheduledCampaigns.length - 1].campaign_duration;
          prev_date =
            scheduledCampaigns[scheduledCampaigns.length - 1].end_date;
        }
        if (
          prev_time != null &&
          prev_date != null &&
          convertToTimestamp(prev_date, prev_time) >=
          convertToTimestamp(schedule_date, schedule_time)
        ) {
          let scheduleCampaignError = document.querySelector(
            "#schedule_campaign_error"
          );
          const scheduleCampaignErrorTime = document.querySelector(
            "#schedule_campaign_error_time"
          );
          scheduleCampaignError.hidden = false;
          let time = convertTo12Hour(prev_time);
          scheduleCampaignErrorTime.innerHTML =
            formatScheduleDate(prev_date) + " " + time + " ";
          setTimeout(() => {
            scheduleCampaignError.hidden = true;
          }, 10000);
          return;
        }
        if (scheduledCampaigns && scheduledCampaigns.length >= 10) {
          const scheduleCampaignError2 = document.querySelector(
            "#schedule_campaign_error2"
          );
          scheduleCampaignError2.hidden = false;
          setTimeout(() => {
            scheduleCampaignError2.hidden = true;
          }, 10000);
          return;
        } else {
          chrome.storage.local.get(["attachmentsData"], async function (res) {
            const attachmentsData = res.attachmentsData;
            let campaign_name = "Campaign-" + (scheduledCampaigns.length + 1);
            let { time: campaign_duration, date: end_date } =
              addSecondsToScheduleTime(
                schedule_date,
                schedule_time,
                calculateCampaignDuration(
                  time_gap,
                  random_delay,
                  batch_size,
                  batch_gap,
                  numbers
                )
              );
            let caption_customization = $("#caption_customization").is(
              ":checked"
            );
            let caption = await new Promise((resolve) => {
              chrome.storage.local.get(
                ["captionForIndividualAttachment"],
                (res) => {
                  resolve(res.captionForIndividualAttachment || []);
                }
              );
            });

            let recipients, recipients_type, campaign_type;
            if (messageSendingTo === "numbers") {
              recipients = numbers;
              recipients_type = "numbers";
              campaign_type = "number_message";
            } else if (messageSendingTo === "groups") {
              recipients = groups_selected;
              recipients_type = "groups";
              campaign_type = "group_message";
            } else if (messageSendingTo === "contacts") {
              recipients = contacts_selected.map((number) =>
                number.replace("@c.us", "")
              );
              recipients_type = "numbers";
              campaign_type = "number_message";
            }

            let canSendCampaign = await checkIfCanSendCampaign(
              recipients.length
            );
            if (!canSendCampaign) {
              sendMessageToBackground({
                type: "show_message_count_over_popup",
              });
              window.close();
              return;
            }

            scheduledCampaigns.push({
              type: campaign_type,
              [recipients_type]: recipients,
              message,
              time_gap,
              csv_data,
              customization,
              caption_customization,
              random_delay,
              batch_size,
              batch_gap,
              caption,
              send_attachment_first,
              campaign_name,
              schedule_time,
              schedule_date,
              campaign_duration,
              end_date,
              attachmentsData,
            });

            scheduledCampaigns.sort(
              (a, b) =>
                convertToTimestamp(a.schedule_date, a.schedule_time) -
                convertToTimestamp(b.schedule_date, b.schedule_time)
            );
            chrome.storage.local.set({
              scheduled_campaigns: scheduledCampaigns,
            });

            sendMessageToBackground({ type: "schedule_message" });
            // window.close();
          });
        }
      });
    } else {
      sendMessageToBackground({
        type: "show_advance_popup",
        feature: "schedule",
      });
      // window.close();
    }
    // updating premium usage for schedule
    chrome.storage.local.get(["premiumUsageObject"], function (result) {
      if (result.premiumUsageObject !== undefined) {
        let updatedPremiumUsageObject = {
          ...result.premiumUsageObject,
          schedule: true,
        };
        chrome.storage.local.set({
          premiumUsageObject: updatedPremiumUsageObject,
        });
      }
    });
  });
}

function addSecondsToScheduleTime(date, time, seconds) {
  let [hours, minutes] = time.split(":");
  let dateObj = new Date(date);
  dateObj.setHours(hours);
  dateObj.setMinutes(minutes);
  dateObj.setSeconds(dateObj.getSeconds() + seconds);
  hours = dateObj.getHours();
  minutes = dateObj.getMinutes();
  seconds = dateObj.getSeconds();
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1; // Months are 0-based in JavaScript
  let day = dateObj.getDate();
  month = month < 10 ? "0" + month : month;
  day = day < 10 ? "0" + day : day;
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function convertToTimestamp(date, time) {
  let dateTime = new Date(date + "T" + time);
  return dateTime.getTime();
}

function timeToTimestamp(time) {
  let [hours, minutes] = time.split(":");
  return new Date().setHours(parseInt(hours), parseInt(minutes), 0, 0);
}

function convertTo12Hour(time) {
  let [hours, minutes] = time.split(":");
  let date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  let period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  // minutes = minutes < 10 ? '0'+minutes : minutes;

  return `${hours}:${minutes} ${period}`;
}

function getTimeGap(index, batch_size, time_gap, random_delay, batch_gap) {
  if (index == 0) return 1;
  if (batch_size && index % batch_size == 0) return batch_gap;
  if (random_delay) return getRandomNumber(3, 10);
  return time_gap;
}

function calculateCampaignDuration(
  time_gap,
  random_delay,
  batch_size,
  batch_gap,
  numbers
) {
  let total_time = 0;
  for (let i = 0; i < numbers.length; i++) {
    let curr_time_gap = getTimeGap(
      i,
      batch_size,
      time_gap,
      random_delay,
      batch_gap
    );
    total_time += curr_time_gap;
  }

  // add 15 minutes to this total time
  total_time += 15 * 60;
  return total_time;
}

function formatScheduleDate(date) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function hasDateTimePassed(date, time) {
  let dateTime = new Date(date + "T" + time);
  dateTime.setMinutes(dateTime.getMinutes() + 2);

  let now = new Date();
  return now > dateTime;
}

async function scheduleExpiredPopup() {
  // showScheduleExpiredPopup();
  chrome.storage.local.get(["scheduled_campaigns"], function (res) {
    let scheduledCampaigns = res.scheduled_campaigns || [];
    for (let i = 0; i < scheduledCampaigns.length; i++) {
      const date = scheduledCampaigns[i].schedule_date;
      const time = scheduledCampaigns[i].schedule_time;
      if (hasDateTimePassed(date, time)) {
        showScheduleExpiredPopup(scheduledCampaigns[i], i);
        return;
      }
    }
  });
}

async function loadScheduledCampaigns(scheduledCampaigns) {
  $("#schedule_container").html("");

  if (scheduledCampaigns && scheduledCampaigns.length > 0) {
    for (let index = 0; index < scheduledCampaigns.length; index++) {
      let campaignName =
        scheduledCampaigns[index].campaign_name ||
        "Campaign-" + Number(index + 1);
      let scheduleTime = scheduledCampaigns[index].schedule_time;
      let campaignDate = formatScheduleDate(
        scheduledCampaigns[index].schedule_date
      );
      $("#schedule_container").append(`
                <div class="dropdown-item">
                    <p id="${index}" class="campaign_name text">
                        <img src="./logo/pro-excel_icon.png"/>
                        <span style="color: #009A88;">${campaignName}</span>
                        <span style="color: #5D6063;">${campaignDate} ${scheduleTime}</span>
                    </p>
                    <img id="${index}" class="campaign_delete_btn btn CtaBtn" src="./logo/pro-delete-icon.png" />
                </div>`);
    }
  } else {
    $("#schedule_container").append(
      `<div class="dropdown-item">${await translate(
        "No scheduled campaigns"
      )}</div>`
    );
  }

  $(".campaign_delete_btn").click(function () {
    let index = $(this).attr("id");
    const timeoutId = scheduledCampaigns[index].timeOutId;
    if (timeoutId)
      sendMessageToBackground({
        type: "clear_schedule_timeout",
        timeoutId: timeoutId,
      });
    const newScheduledCampaigns = scheduledCampaigns.filter(
      (campaign, i) => i != index
    );
    chrome.storage.local.set({ scheduled_campaigns: newScheduledCampaigns });
    loadScheduledCampaigns(newScheduledCampaigns);
  });
}
// Google Analytics
function getTrackLabel() {
  try {
    return [my_number, plan_type, plan_duration].join(" ").trim();
  } catch {
    return "";
  }
}


function isExpired() {
  return plan_type === "Expired";
}

function isBasic() {
  return true;
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

function isPremiumExpired() {
  return false;
}

function isExpired() {
  return false;
}

function getFilteredNumbers(numbers_str) {
  let numbers = numbers_str.replace(/\n/g, ",").split(",");
  numbers = numbers.map((num) => num.replace(/\D/g, ""));
  numbers = numbers.filter((num) => num.length >= 5 && num.length <= 15);
  let filteredNumbers = numbers.join(",");
  return filteredNumbers;
}

function getItemsName() {
  let itemsElements = document.querySelectorAll(".group");
  let itemsString = Array.from(itemsElements)
    .slice(0, -1)
    .map((item) => item.innerHTML.trim())
    .join(", ");
  return itemsString;
}

function getCampaigns(callback) {
  chrome.storage.local.get(["campaigns"], (res) => {
    let campaigns = res.campaigns || [];
    callback(campaigns);
  });
}

function saveCampaign(campName, campData, callback) {
  getCampaigns((campaigns) => {
    let isCampNameExists = campaigns.some(
      (campaign) => campaign.name === campName
    );

    if (isCampNameExists) {
      alert(`Campaign name "${campName}" already exists!`);
      callback(false);
    } else {
      campaigns.push({ name: campName, ...campData });
      chrome.storage.local.set({ campaigns }, () => callback(true));
    }
  });
}

function updateCampaign(index, campName, campData, callback) {
  getCampaigns((campaigns) => {
    if (campaigns[index]) {
      campaigns[index] = { name: campName, ...campData };
      chrome.storage.local.set({ campaigns }, () => callback(true));
    } else {
      alert("Invalid campaign index.");
      callback(false);
    }
  });
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function getReportDateFormat(date_ms, isDownloadName = false) {
  const today = new Date();
  const reportDate = new Date(date_ms);
  const diffDays = Math.round(
    Math.abs((today - reportDate) / (24 * 60 * 60 * 1000))
  );

  const reportDay = reportDate.getDate();
  const dayString = reportDay + getDaySuffix(reportDay);

  let reportTimeString = reportDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });
  let reportDateString;

  if (isDownloadName || diffDays > 1) {
    reportDateString = `${dayString} ${reportDate.toLocaleDateString("en-US", {
      month: "short",
    })}`;
  } else if (diffDays === 0) {
    reportDateString = "Today";
  } else if (diffDays === 1) {
    reportDateString = "Yesterday";
  }

  if (isDownloadName) {
    return `(Last Run at ${reportDateString} ${reportTimeString})`;
  }
  return `(Last Run: ${reportDateString} ${reportTimeString})`;
}

// Download CSV
function download_csv(rows, filename) {
  const csvContent =
    "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = $("<a>")
    .attr({ href: encodedUri, download: filename })
    .appendTo("body");
  link[0].click();
  link.remove();
}

function getCustomNumberPlaceholder() {
  let defaulltPlaceholder =
    "Enter numbers Eg. ";
  let sampleNumber = $("#country-code-input")
    .attr("placeholder")
    .replace(/\D/g, "");
  console.log('kk', sampleNumber)
  if (sampleNumber === "") {
    sampleNumber = "+91 8003620400, +1 3013424345";
  } else if (sampleNumber.startsWith("0")) {
    sampleNumber = sampleNumber.substr(1);
  }

  let customPlaceholder = "";
  if (sampleNumber != "+91 8003620400, +1 3013424345") {
    let startingDigits = sampleNumber.slice(0, -6);
    let lastSixDigits = sampleNumber.slice(-6);
    let reversedLastSixDigits = lastSixDigits.split("").reverse().join("");
    let sampleNumberTwo = startingDigits + reversedLastSixDigits;

    customPlaceholder =
      defaulltPlaceholder + sampleNumber + ", " + sampleNumberTwo;
  } else customPlaceholder = defaulltPlaceholder + sampleNumber;
  return customPlaceholder;
}

// Add Country Code Selector
function addCountryCodeSelector() {
  // Country Code Selector/Input
  const countrySelector = document.querySelector("#country-code-input");
  const initialCountry = country_info.name_code;
  const preferredCountries =
    initialCountry === "XX" ? [initialCountry] : ["XX", initialCountry];

  const intlTelInputConfig = {
    separateDialCode: true,
    autoHideDialCode: false,
    autoPlaceholder: "off",
    initialCountry: initialCountry,
    preferredCountries: preferredCountries,
    autoPlaceholder: "aggressive",
    utilsScript: "library/intlTelInput.utils.js",
  };
  window.intlTelInput(countrySelector, intlTelInputConfig);
  updateCountryInfo();

  countrySelector.addEventListener("countrychange", () => {
    updateCountryInfo();
    refreshNumbers();
  });
}

function updateCountryInfo() {
  const countrySelector = document.querySelector("#country-code-input");
  const intlTelInputInstance =
    window.intlTelInputGlobals.getInstance(countrySelector);
  let { name, iso2, dialCode } = intlTelInputInstance.getSelectedCountryData();
  if (dialCode === "00") dialCode = "";
  country_info = {
    name: name,
    name_code: iso2.toUpperCase(),
    dial_code: dialCode,
  };
  chrome.storage.local.set({ country_info: country_info });

  // Update Numbers Input Placeholder
  $("#numbers-input").attr("placeholder", getCustomNumberPlaceholder());
}

function refreshNumbers() {
  const numberTags = $("#numbers-display .number-tag .number");
  const numbers = [];
  numberTags.each(function () {
    let nationalNumber = $(this).text().trim();
    numbers.push(nationalNumber);
  });
  const numbers_str = numbers.join(", ");
  replaceNumbers(numbers_str);
}

function replaceNumbers(newNumbers) {
  // Delete all numbers
  $("#numbers-display").empty();
  $("#numbers-input").val("");

  // Add new numbers
  addNumberTags(newNumbers);
}

// Validate the Number and return National Number
function isValidNumber(number) {
  let { dial_code, name_code } = country_info;
  let default_invalid_reason = {
    isValid: false,
    nationalNumber: number,
    reason: "INCORRECT COUNTRY CODE",
  };

  const checkNumber = (num) => {
    try {
      let parsedNumber = libphonenumber.parsePhoneNumber("+" + num);
      if (parsedNumber && parsedNumber.isValid()) {
        if (name_code === "XX") {
          return { isValid: true, nationalNumber: num, reason: "" };
        } else if (name_code === parsedNumber.country) {
          return {
            isValid: true,
            nationalNumber: parsedNumber.nationalNumber,
            reason: "",
          };
        } else {
          return default_invalid_reason;
        }
      }
      return default_invalid_reason;
    } catch (error) {
      return { isValid: false, nationalNumber: num, reason: error.message };
    }
  };

  // check number with / without country code, then return valid response
  let response1 = checkNumber(number);
  let response2 = checkNumber(dial_code + number);

  if (response1.isValid) {
    return response1;
  } else if (response2.isValid) {
    return response2;
  } else {
    return default_invalid_reason;
  }
}

function toggleUploadExcelText(show) {
  const isNumberTagPresent = document.querySelectorAll(".number-tag").length;
  const uploadExcelText = document.querySelector(".upload_excel_text");
  if (uploadExcelText && isNumberTagPresent && !show) {
    uploadExcelText.style.display = "none";
  } else if (uploadExcelText && !isNumberTagPresent && show) {
    uploadExcelText.style.display = "flex";
  }
}

// Adds number tags html from numbers string
function addNumberTags(numbers_str) {
  const numbers = getFilteredNumbers(numbers_str).split(",");
  let numberTagsHtml = "";
  for (let number of numbers) {
    if (number) {
      let { isValid, nationalNumber, reason } = isValidNumber(number);
      numberTagsHtml += `
                <span class="number-tag CtaBtn ${isValid ? "" : "invalid"}">
                    ${isValid
          ? ""
          : '<span class="invalid-reason" hidden="true">' +
          reason +
          "</span>"
        }
                    <span class="number" title="Edit Number">${nationalNumber}</span>
                   <button class="delete-number-tag">
                   <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="12" height="12" x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1zm4.242 13.829a1 1 0 1 1-1.414 1.414L12 13.414l-2.828 2.829a1 1 0 0 1-1.414-1.414L10.586 12 7.758 9.171a1 1 0 1 1 1.414-1.414L12 10.586l2.828-2.829a1 1 0 1 1 1.414 1.414L13.414 12z" data-name="Layer 2" fill="#ff0000" opacity="1" data-original="#000000" class=""/></g></svg>
                   </button>
                </span>`;
    }
  }

  $("#numbers-display").append(numberTagsHtml);
  updateNumbersAndDisplay();
  updateCountryNumberCount();

  // removing upload excel text if number tag is present
  toggleUploadExcelText(false);
}

// Edit / Update Number Tag
function editNumberTag(tag) {
  const currentNumber = $(tag).text();
  const numberTag = $(tag).parent(".number-tag");

  // Add input inside number tag
  const numberTagWidth = $(tag).width() + 7 + "px";
  const numberInput = $(
    `<input type="text" class="number-tag-input" maxlength="16" style="max-width:${numberTagWidth};">`
  );

  // Adding Input inside number tag and some style changes
  numberTag.html(numberInput);
  numberTag.addClass("active-input");
  numberTag.removeClass("CtaBtn");
  numberInput.val(currentNumber);
  numberInput.focus();

  // Handle edit
  numberInput.on("blur keydown keyup", function (event) {
    if (event.keyCode && ![13, 188].includes(event.keyCode)) return;
    let editedNumber = getFilteredNumbers($(this).val()).split(",")[0];

    if (editedNumber) {
      if (is_excel_uploaded) {
        removeNumbers();
      }
      let { isValid, nationalNumber, reason } = isValidNumber(editedNumber);
      //change the edited context inside excel
      for (let i = 0; i < csv_data.length; i++) {
        if (
          csv_data[i][0] &&
          csv_data[i][0].toString().includes(currentNumber)
        ) {
          csv_data[i][0] = parseInt(editedNumber);
          break;
        }
      }
      chrome.storage.local.set({ csv_data: csv_data });
      numberTag.toggleClass("invalid", !isValid);
      numberTag.removeClass("active-input");
      numberTag.addClass("CtaBtn");

      numberTag.html(`
                ${isValid
          ? ""
          : '<span class="invalid-reason" hidden="true">' +
          reason +
          "</span>"
        }
                <span class="number" title="Edit Number">${nationalNumber}</span>
                <img class="delete-number-tag" src="./logo/pro-closeBtn.png" title="Remove Number">
            `);
    } else {
      $(this).parent(".number-tag").remove();
    }
    updateNumbersAndDisplay();
  });
}

// Updates the real numbers input and numbers display
function updateNumbersAndDisplay() {
  // Update actual number input
  const numberTags = $("#numbers-display .number-tag .number");
  const numbers = [];
  numberTags.each(function () {
    let nationalNumber = $(this).text().trim();
    numbers.push(nationalNumber);
  });
  $("#numbers").val(numbers.join(", "));
  $("#numbers").trigger("change");

  // Update invalid number count
  let invalidCount = $(".number-tag.invalid").length;
  if (Number(invalidCount) > 500) invalidCount = "500+";
  $("#invalid-numbers").css("display", invalidCount ? "flex" : "none");
  $("#invalid-count").text(invalidCount);

  // Show/Hide delete all numbers icon
  $("#delete-all-numbers").css("display", numbers.length ? "block" : "none");
  $(".custom__country-num-count-container").css("display", numbers.length ? "flex" : "none");

  // Show/Hide Placeholder
  // $("#numbers-input").attr(
  //   "placeholder",
  //   numbers.length ? "" : getCustomNumberPlaceholder()
  // );

  // Scroll number display to bottom
  $("#numbers-display").animate(
    { scrollTop: $("#numbers-display")[0].scrollHeight },
    500
  );
}

// For attachment and Template

function removeNumbers() {
  unset_csv_styles();
  hideCustomizationContainer();
  toggleUploadExcelText(true);
  isDirty = false;
  selectedChatPhone = "";
}

function handleDeleteBin() {
  $("#delete-all").css(
    "display",
    messageToggleSwitchValue === "groups"
      ? groups_selected.length > 0
        ? "block"
        : "none"
      : contacts_selected.length > 0
        ? "block"
        : "none"
  );
}



function showGroupsCampaignSelectorOrSave() {
  chrome.storage.local.get(["campaigns"], (res) => {
    let isCampaignPresent = false;
    const numbers = getItemsName();
    const campaigns = res.campaigns || [];
    let filteredCampaigns = filterCampaignsByType(
      campaigns,
      messageToggleSwitchValue
    );
    let selectedArray =
      messageToggleSwitchValue === "groups"
        ? groups_selected
        : contacts_selected;

    filteredCampaigns.forEach((campaign) => {
      if (numbers === campaign[messageToggleSwitchValue]) {
        isCampaignPresent = true;
      }
    });
    if (isCampaignPresent || selectedArray.length === 0) {
      $("#campaign_selector_groups").removeClass("hide");
      $("#campaign-save-icon-items").addClass("hide");
    } else {
      $("#campaign_selector_groups").addClass("hide");
      $("#campaign-save-icon-items").removeClass("hide");
    }
  });
}

// Helper function to filter campaigns based on the messageToggleSwitchValue
function filterCampaignsByType(campaigns, type) {
  return campaigns.filter(
    (campaign) => campaign[type] && campaign[type].length > 0
  );
}

$(document).ready(async function () {
  // show version of extension in popup from manifest file
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  chrome.storage.local.get(["country_info", "popup_numbers"], (res) => {
    // Get Country Info and add Country Code Selector
    country_info = res.country_info || {
      name: "India",
      name_code: "IN",
      dial_code: "91",
    };
    addCountryCodeSelector();

    // Get Popup Numbers and set it
    popup_numbers = res.popup_numbers || "";
    replaceNumbers(popup_numbers);
  });

  // Add new number tags
  $("#numbers-input").on("blur keydown keyup", function (event) {
    if (event.keyCode && ![13, 188].includes(event.keyCode)) return;

    const numbers_str = $(this).val();
    $(this).val("");
    addNumberTags(numbers_str);
  });

  // Track manual input to prevent auto-fill override
  $("#numbers-input").on("input", function (event) {
    // Only set dirty if user is actually typing (not programmatic)
    if (event.isTrusted) {
      isDirty = true;
    }
  });

  // Reset dirty flag when numbers are cleared
  $("#delete-all-numbers").on("click", function () {
    isDirty = false;
    selectedChatPhone = "";
  });

  // Edit number tag
  $("#numbers-display").on("click", ".number", function () {
    const numberTag = $(this);
    editNumberTag(numberTag);
  });

  // Delete number tag
  $("#numbers-display").on("click", ".delete-number-tag", async function () {
    $(this).parent(".number-tag").remove();
    let deleted_num = $(this).parent(".number-tag").children().text();
    for (let i = 0; i < csv_data.length; i++) {
      if (csv_data[i][0] && csv_data[i][0].toString().includes(deleted_num)) {
        csv_data.splice(i, 1);
        break;
      }
    }
    chrome.storage.local.set({ csv_data: csv_data });
    updateNumbersAndDisplay();

    if (($('#numbers-display').find('.number-tag').length === 0) && $('#uploaded-csv').is(":visible")) {
      let msg = await translate("Are you sure, you want to delete the last number and the attached excel?");
      const __confirm = confirm(msg);
      if (__confirm) {
        replaceNumbers("");
        removeNumbers();
        isDirty = false;
        selectedChatPhone = "";
        $('.custom__country-num-count-container').css('display', 'none');
        $('#custom__country-num-count').text('0')
        updateCountryNumberCount();
      }
    }

    // Check if this was the auto-filled number
    if (deleted_num === selectedChatPhone) {
      isDirty = false;
      selectedChatPhone = "";
    }

    // adding upload excel text if number tag is not present
    toggleUploadExcelText(true);
  });

  // Focus numbers-input if user clicks on blank space
  $("#numbers-display").on("click", function (e) {
    const ele = $(e.target);
    if (ele && !ele.is(".number, .delete-number-tag, .number-tag-input")) {
      $("#numbers-input").focus();
    }
  });

  // Delete all number tags
  $("#delete-all-numbers").on("click", async function () {
    let msg = await translate("Are you sure, you want to delete all numbers?");
    const __confirm = confirm(msg);
    if (__confirm) {
      replaceNumbers("");
      removeNumbers();
      isDirty = false;
      selectedChatPhone = "";
      $('.custom__country-num-count-container').css('display', 'none');
      $('#custom__country-num-count').text('0')
    }
  });

  $("#groups_container").on("scroll", function () {
    const dropdownContainer = document.getElementById("groups_container");
    let visibleElementsCount = $(
      "#groups_container .dropdown-item:visible"
    ).length;
    if (
      messageToggleSwitchValue === "groups" &&
      allGroups.length - groups_selected.length === visibleElementsCount
    ) {
      lastScrollPosition = dropdownContainer.scrollTop;
    } else if (
      messageToggleSwitchValue === "contacts" &&
      allContacts.length - contacts_selected.length === visibleElementsCount
    ) {
      lastScrollPosition_contacts = dropdownContainer.scrollTop;
    }
  });

  $("#delete-all").on("click", async function (e) {
    let msg = await translate(
      `Are you sure, you want to delete all ${messageToggleSwitchValue === "groups" ? "groups" : "contacts"
      }?`
    );
    const __confirm = confirm(msg);
    if (__confirm) {
      if (messageToggleSwitchValue === "groups") {
        groups_selected = [];
        chrome.storage.local.set({ groups_selected: groups_selected });
      } else {
        contacts_selected = [];
        chrome.storage.local.set({ contacts_selected: contacts_selected });
      }
      updateGroupBoxDisplay();
      if ($(e.target).is($(this))) {
        $("#select-all").prop('checked', false);
        $('#groups-num-count').text('0');
        $('.groups-num-count-container').css('display', 'none')
        // $('.select_all').removeClass('disabled');
        // $('#select-all').prop('disabled', false)
      }
    }
  });

  $("#select_all_text").on("click", function () {
    // if (!$("#select-all").prop('disabled')) {
    $("#select-all").trigger('change')
    // }
  });
  // Handle Select All checkbox
  $("#select-all").on("change", function () {
    if ($(this).is(":checked")) {
      // console.log('Select All Groups/Contacts fetching', fetching)
      !fetching && handleSelectAll();
      handleDeleteBin();
      showGroupsCampaignSelectorOrSave();
      setTimeout(function () {
        updateGroupCount()
      }, 100);
      // $('.select_all').addClass('disabled');
      // $('#select-all').prop('disabled', true)
    }
  });

  // Keep old click handler for text
  $("#select_all_text").on("click", function () {
    $("#select-all").trigger("click");
  });

  // $("#de-select_all_text").on("click", function () {
  //   $("#deselect-all-btn").trigger("click");
  // });

  // Show Invalid Numbers Popup
  $("#invalid-numbers").on("click", function () {
    const topPosition =
      Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + "px";
    $(".invalid-numbers-popup").css("top", topPosition);
    $(".invalid-numbers-popup-container").removeClass("hide");

    const invalidCount = $(".number-tag.invalid").length;
    $("#popup-invalid-count").text(invalidCount);
  });

  // Close Invalid Numbers Popup
  $(".invalid-numbers-popup-close-button").on("click", function () {
    $(".invalid-numbers-popup-container").addClass("hide");
  });

  function getIndexOfInvalidNumbers() {
    let index = [];
    $(".number-tag.invalid").each(function () {
      index.push($(this).index());
    });
    let new_data = csv_data.filter((item, i) => !index.includes(i - 1));
    csv_data = new_data;
    chrome.storage.local.set({ csv_data: new_data });
  }

  // Remove all invalid numbers from list
  $("#remove-all-invalid").on("click", function () {
    getIndexOfInvalidNumbers();
    $(".number-tag.invalid").remove();
    $(".invalid-numbers-popup-container").addClass("hide");
    updateNumbersAndDisplay();
  });

  // Download excel containing the invalid number and reason
  $("#download-all-invalid").on("click", function () {
    const rows = [["Invalid Number", "Reason"]];

    $(".number-tag.invalid").each(function () {
      const number = country_info.dial_code + $(this).find(".number").text();
      const reason = $(this).find(".invalid-reason").text();
      rows.push([number, reason]);
    });

    download_csv(rows, "Invalid Numbers");
    $(".invalid-numbers-popup-container").addClass("hide");
  });

  // $('#input-container').on('click', function () {

  // })

  function handleCaption(
    attLen,
    attachments,
    captionForIndividualAttachment,
    captionAreaHasValue
  ) {
    let a = captionForIndividualAttachment;
    if (
      $("#caption-checkbox").prop("checked") &&
      !document.querySelector(".captionCheckBoxDiv")
    ) {
      let captionCheckBoxDiv = document.createElement("div");
      captionCheckBoxDiv.className = "captionCheckBoxDiv";
      document
        .querySelector("#caption-section")
        .insertBefore(
          captionCheckBoxDiv,
          document.querySelector("#caption-section").children[0]
        );
    }
    let captionHtml = "",
      captionTextAreaHtml = "";
    for (let i = 0; i < attLen; i++) {
      let file = attachments[i];
      let name =
        file.name.length > 9
          ? file.name.trim().substring(0, 9) + "..."
          : file.name.trim();

      captionHtml += `
                <div>
                    <input type="radio" id="radio${i}" name="attachment" class="attachmentNames" value="${name}" style="margin: 0px 5px; cursor: pointer" ${i == 0 ? "checked" : ""
        }>
                    <label for="radio${i}" style="cursor: pointer">${name}</label>
                </div>
            `;

      captionTextAreaHtml += `
                <textarea type="text" id="caption-input${i}" class="caption-input ${i === 0 ? "" : "hide"
        }" 
                        placeholder="Type your caption for the file: ${file.name.trim().length > 50
          ? file.name.trim().substring(0, 50) + "..."
          : file.name.trim()
        }"
                ></textarea>
            `;
    }
    if (attLen == 1) captionHtml = ``;
    $(".captionCheckBoxDiv").html(`${captionHtml}`);
    $(".captionTextAreas").html(`${captionTextAreaHtml}`);
    if (captionAreaHasValue) {
      for (let i = 0; i < attLen; i++) {
        if (
          document.querySelector(`#caption-input${i}`) &&
          captionForIndividualAttachment[i]
        )
          document.querySelector(`#caption-input${i}`).value =
            captionForIndividualAttachment[i];
      }
    }
    document.querySelectorAll(".attachmentNames").forEach((ele) => {
      ele.addEventListener("change", () => {
        for (let i = 0; i < attLen; i++) {
          if (document.getElementById(`radio${i}`).checked) {
            document
              .querySelector(`#caption-input${i}`)
              .classList.remove("hide");
          } else {
            if (
              !document.getElementById(`radio${i}`).classList.contains("hide")
            )
              document
                .querySelector(`#caption-input${i}`)
                .classList.add("hide");
          }
        }
      });
    });
    document.querySelectorAll(".caption-input").forEach((ele) => {
      ele.addEventListener("input", async () => {
        var eleId = ele.id.substring(ele.id.search(/\d/));
        let captionForIndividualAttachment = await new Promise((resolve) => {
          chrome.storage.local.get(
            ["captionForIndividualAttachment"],
            (res) => {
              resolve(res.captionForIndividualAttachment);
            }
          );
        });
        captionForIndividualAttachment[eleId] = ele.value;
        chrome.storage.local.set({
          captionForIndividualAttachment: captionForIndividualAttachment,
        });
      });
    });
  }

  async function showAttachments() {
    $("#attachments-container").html(
      `<span style="margin-right:10px">Fetching...</span>`
    );
    let attachments = await new Promise((resolve) => {
      chrome.storage.local.get(["attachmentsData"], (res) => {
        resolve(res.attachmentsData || []);
      });
    });
    let showAllAttachments = await new Promise((resolve) => {
      chrome.storage.local.get("showAllAttachments", (res) => {
        resolve(res.showAllAttachments || false);
      });
    });
    if (attachments.length > 0) {
      let attHtml = "",
        attLen = attachments.length;
      let containsMedia = true,
        addAttHtml = true;
      for (let i = 0; i < attLen; i++) {
        let file = attachments[i];
        let addComma = true;
        let name = file.name.trim();

        if (attLen - 1 == i) {
          addComma = false;
        }
        if (attLen <= 3) {
          if (name.length > 24 / attLen) {
            name = name.slice(0, 24 / attLen) + "...";
          }
        } else if (i < 2) {
          if (name.length > 8) {
            name = name.slice(0, 8) + "...";
          }
        } else if (!showAllAttachments) {
          addAttHtml = false;
        }
        if (showAllAttachments) {
          if (name.length > 10) name = file.name.trim().slice(0, 10) + "...";
          else name = file.name.trim();
        }

        if (addAttHtml && addComma) {
          attHtml += `<span class="attachment-name">${name}<svg class="close-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1zm4.242 13.829a1 1 0 1 1-1.414 1.414L12 13.414l-2.828 2.829a1 1 0 0 1-1.414-1.414L10.586 12 7.758 9.171a1 1 0 1 1 1.414-1.414L12 10.586l2.828-2.829a1 1 0 1 1 1.414 1.414L13.414 12z" data-name="Layer 2" fill="#ff0000" opacity="1" data-original="#000000" class=""/></g></svg></span>`;
        } else if (addAttHtml) {
          attHtml += `<span class="attachment-name">${name}<svg class="close-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1zm4.242 13.829a1 1 0 1 1-1.414 1.414L12 13.414l-2.828 2.829a1 1 0 0 1-1.414-1.414L10.586 12 7.758 9.171a1 1 0 1 1 1.414-1.414L12 10.586l2.828-2.829a1 1 0 1 1 1.414 1.414L13.414 12z" data-name="Layer 2" fill="#ff0000" opacity="1" data-original="#000000" class=""/></g></svg></span>`;
        }
      }

      if (attLen > 3 && !showAllAttachments) {
        attHtml += `<span class="show_more" style="margin-right: 5px;">and <span style="text-decoration:underline;">${attLen - 2
          } more</span></span>`;
      }
      if (attLen > 3 && showAllAttachments) {
        attHtml += `<span class="show_less" style="margin-right: 5px;">... <span style='text-decoration:underline'>show less</span></span>`;
      }
      $("#attachments-container").html(attHtml);
      if (showAllAttachments) {
        // document.querySelector("#attachments-container").style.textDecoration="underline";
        if ($("#message").val().length == 0)
          document.querySelector("#attachments-container").style.maxWidth =
            "250px";
        else
          document.querySelector("#attachments-container").style.maxWidth =
            "333px";
      } else {
        document.querySelector("#attachments-container").style.textDecoration =
          "none";
        document.querySelector("#attachments-container").style.maxWidth =
          "270px";
      }
      document.querySelector("#message").addEventListener("input", () => {
        if ($("#message").val().length == 0)
          document.querySelector("#attachments-container").style.maxWidth =
            "250px";
        else
          document.querySelector("#attachments-container").style.maxWidth =
            "333px";
      });
      document.querySelectorAll(".attachment-name .close-icon").forEach((element) => {
        element.addEventListener("click", async (e) => {
          let captionForIndividualAttachment = await new Promise((resolve) => {
            chrome.storage.local.get(
              ["captionForIndividualAttachment"],
              (res) => {
                resolve(res.captionForIndividualAttachment || []);
              }
            );
          });
          attachments.splice(element.id, 1);
          captionForIndividualAttachment.splice(element.id, 1);
          if (attachments.length <= 3) {
            chrome.storage.local.set({ showAllAttachments: false });
          }
          chrome.storage.local.set({ attachmentsData: attachments });
          chrome.storage.local.set({
            captionForIndividualAttachment: captionForIndividualAttachment,
          });
          showAttachments();
        });
      });
      if (document.querySelector(".show_more")) {
        document.querySelector(".show_more").addEventListener("click", () => {
          chrome.storage.local.set({ showAllAttachments: true });
          showAttachments();
        });
      }
      if (document.querySelector(".show_less")) {
        document.querySelector(".show_less").addEventListener("click", () => {
          document.querySelector(
            "#attachments-container"
          ).style.textDecoration = "none";
          chrome.storage.local.set({ showAllAttachments: false });
          showAttachments();
        });
      }
      $("#add-attachments").removeClass("contrast-0");
      $("#attachment-first-checkbox-section").prop(
        "hidden",
        $("#message").val().trim().length == 0 ||
        $("#attachments-container").html().trim().length == 0
      );

      // For Caption
      if (containsMedia) {
        let captionForIndividualAttachment = await new Promise((resolve) => {
          chrome.storage.local.get(
            ["captionForIndividualAttachment"],
            (res) => {
              resolve(res.captionForIndividualAttachment || []);
            }
          );
        });
        $("#add-caption-container").prop("hidden", false);
        $("#add-caption-checkbox-section").prop("hidden", false);

        let captionAreaHasValue = false;
        for (let i = 0; i < captionForIndividualAttachment.length; i++) {
          let text = captionForIndividualAttachment[i].replace(/\s/g, "");
          if (text.length != 0) {
            $("#caption-checkbox").prop("checked", true);
            captionAreaHasValue = true;
            break;
          }
        }
        toggleCaptionCustomizationInputDiv();
        $("#caption-section").prop(
          "hidden",
          !$("#caption-checkbox").is(":checked")
        );
        // const captionInputElement=document.querySelector(".caption-input");
        handleCaption(
          attLen,
          attachments,
          captionForIndividualAttachment,
          captionAreaHasValue
        );
        document
          .querySelector("#caption-checkbox")
          .addEventListener("change", () => {
            handleCaption(
              attLen,
              attachments,
              captionForIndividualAttachment,
              captionAreaHasValue
            );
          });
        chrome.storage.local.get(
          ["dsi854", "itc856", "icu861", "tooltip_popup_count"],
          (res) => {
            let dsi854 = res.dsi854;
            if (res.dsi854 === undefined) {
              dsi854 = res.tooltip_popup_count || 1;
            }
            let itc856 = res.itc856;
            let icu861 = res.icu861;
            if ([11, 14, 17, 20].includes(dsi854) && !itc856 && !icu861) {
              $(".caption-tooltip").removeClass("hide");
              $(".checkbox-section > .add-tooltip-overlay").removeClass("hide");
            }
          }
        );
      }
    } else {
      $("#attachments-container").html("");
      $("#add-attachments").addClass("contrast-0");
      $("#add-caption-container").prop("hidden", true);
      $("#add-caption-checkbox-section").prop("hidden", true);
      $("#attachment-first-checkbox-section").prop("hidden", true);
    }
  }
  showAttachments();

  function dataURItoBlob(file) {
    return new Promise((response, reject) => {
      const fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = () => response(fr.result);
      fr.onerror = (err) => reject(err);
    });
  }

  async function validateAttachments(attachments) {
    if (attachments.length == 0) return false;

    if (attachments.length > 10) {
      let msg = await translate("Maximum 10 files can be send at a time.");
      alert(msg);
      return false;
    }

    let isValid = true;
    attachments.every(async (file) => {
      if (
        ("application/pdf" == file.type && file.size > 22e6) ||
        ("application/pdf" != file.type && file.size > 16e6)
      ) {
        const size = file.size / 1000000;
        let msg = await translate(
          `${file.name} size is too large, [ file size: ${size} MB]. Maximum size recommended: 16MB`
        );
        alert(msg);
        $("#select-attachments").val("");
        isValid = false;
      }
      return isValid;
    });
    return isValid;
  }

  $("#select-attachments").change(async function () {
    console.log('clicked select-attachments')
    const selAttachmentsFileList = $(this).get(0).files;
    let selAttachments = Array.from(selAttachmentsFileList);

    const isValid = await validateAttachments(selAttachments);
    if (!isValid) {
      console.log('Validation failed - stopping attachment upload');
      $(this).val(""); // Clear the input
      return;
    }

    $("#attachments-container").html(
      `<span style="margin-right:10px">Fetching...</span>`
    );
    let attachmentsData = await new Promise((resolve) => {
      chrome.storage.local.get(["attachmentsData"], (res) => {
        let dataArr = res.attachmentsData || [];
        let l = dataArr.length;
        // if (validateAttachments(selAttachments)) {
        selAttachments.forEach(async (file) => {
          await dataURItoBlob(file).then(async (blob) => {
            dataArr.push({
              name: file.name,
              data: JSON.stringify(blob),
            });
            if (dataArr.length - l === selAttachments.length) {
              resolve(dataArr);
            }
          });
        });
        chrome.storage.local.get(["attachmentsData"], (res) => {
          a = res.attachmentsData || [];
        });
        // } else {
        // resolve(dataArr);
        // }
      });
    });

    await chrome.storage.local.set({ attachmentsData: attachmentsData });
    await showAttachments();
    $(this).val("");
  });

  $("#add-attachments").click(function () {
    chrome.storage.local.get(["fva853", "facc859"], (res) => {
      let { fva853, facc859 } = res;

      // Handle facc859 logic first
      if (facc859 === 1) {
        if (isLinux) {
          sendMessageToBackground({ type: "add_attachments" });
          window.close();
        } else {
          $("#select-attachments").click();
        }
        chrome.storage.local.set({ facc859: -1 }); // reset
      } else if (facc859 === 0) {
        chrome.storage.local.set({ facc859: 1 }); // set to active
      }

      // Handle fva853 logic
      if (fva853 === true) {
        $(".tooltip-container").addClass("hide");
        $("#add-attachments").addClass("contrast-0");
        chrome.storage.local.set({ fva853: false });
      } else {
        // Normal behavior if tooltip is not active
        if (isLinux) {
          sendMessageToBackground({ type: "add_attachments" });
          window.close();
        } else {
          $("#select-attachments").click();
        }
      }
    });
  });


  $("#how_to_send_messages_to_groups").click(async function () {

    translatedGroupMsgObj = await fetchTranslations(groupMsgObj);
    if (messageToggleSwitchValue !== "groups") {
      document.querySelector("#message_type_groups").click();
    }
    driver(translatedGroupMsgObj).drive();
    removeHighlightTour();
  });

  $("#how_to_send_messages_to_contacts").click(async function () {


    translatedContactMsgObj = await fetchTranslations(contactMsgObj);
    if (messageToggleSwitchValue !== "contacts") {
      document.querySelector("#message_type_contact").click();
    }
    driver(translatedContactMsgObj).drive();
    removeHighlightTour();
  });

  $("#how_to_send_customized_messages").click(async function () {


    translatedCustomObj = await fetchTranslations(customizationObj);
    translatedCustomObj.steps[1].popover.onNextClick = () => {
      const excelElement = document.querySelector(".upload_excel_text");
      excelElement.click();
      $("#csv").on("change", function (e) {
        driver(translatedCustomObj).moveNext();
      });
    };
    if (messageToggleSwitchValue !== "numbers") {
      document.querySelector("#message_type_numbers").click();
    }
    customization_obj = true;
    driver(translatedCustomObj).drive();
    removeHighlightTour();
  });

  $("#how_to_send_attachments").click(async function () {


    translatedAttachments = await fetchTranslations(attachmentObj);
    translatedAttachments.steps[2].popover.onNextClick = () => {
      attachment_obj = true;
      const fileInput = document.querySelector("#select-attachments");
      fileInput.click();
      fileInput.addEventListener(
        "change",
        () => {
          driver(translatedAttachments).moveNext();
        },
        { once: true }
      );
    };
    if (messageToggleSwitchValue !== "numbers") {
      document.querySelector("#message_type_numbers").click();
    }
    driver(translatedAttachments).drive();
    removeHighlightTour();
  });

  $("#how_to_export_unsaved_contacts").click(function () {


    removeHighlightTour();
    sendMessageToBackground({ type: "unsaved_contacts_demo" });
  });

  $("#caption-checkbox").change(function () {
    $("#caption-section").prop("hidden", !$(this).is(":checked"));
    const isChecked = $(this).is(":checked");
    toggleCaptionCustomizationInputDiv();
    // updating premium usage for caption
    let isCaptionChecked = $("#caption-checkbox").is(":checked");
    if (isCaptionChecked) {
      chrome.storage.local.get(["premiumUsageObject"], function (result) {
        if (result.premiumUsageObject !== undefined) {
          let updatedPremiumUsageObject = {
            ...result.premiumUsageObject,
            caption: true,
          };
          chrome.storage.local.set({
            premiumUsageObject: updatedPremiumUsageObject,
          });
        }
      });
    }

  });

  // tooltip popup code starts
  chrome.storage.local.get(
    ["dsi854", "ltod857", "id855", "tooltip_popup_count"],
    (result) => {
      let dsi854 = result.dsi854;
      if (result.dsi854 === undefined) {
        dsi854 = result.tooltip_popup_count || 1;
      }
      const id855 = new Date(result.id855).toDateString();
      const ltod857 = result.ltod857 ? new Date(result.ltod857) : null;
      const today = new Date().toDateString();
      if (id855 && today !== id855) {
        if (ltod857 == null || ltod857.toDateString() !== today) {
          chrome.storage.local.set({ ltod857: today });
          chrome.storage.local.set({
            dsi854: dsi854 + 1,
          });
          chrome.storage.local.set({ itc856: false });
          if (dsi854 < 3) {
            chrome.storage.local.set({ fva853: true });
          }
        }
      }

      chrome.storage.local.get(["dsi854", "itc856"], (res) => {
        let dsi854 = res.dsi854;
        let itc856 = res.itc856;
        if ([1, 4, 7, 10].includes(dsi854) && !itc856) {
          $(".tooltip-popup-container").removeClass("hide");
          $(".add-tooltip-overlay").removeClass("hide");
        }
      });
    }
  );

  $(".close-tooltip").on("click", () => {
    $(".tooltip-popup-container").addClass("hide");
    $(".caption-tooltip").addClass("hide");
    $(".add-tooltip-overlay").addClass("hide");
    chrome.storage.local.set({
      ltod857: new Date().toDateString(),
    });
    chrome.storage.local.set({ itc856: true });
  });



  // Message Template - Feature
  function showTemplateSelectorOrSave() {
    chrome.storage.local.get(["templates"], (res) => {
      let isTextPresent = false;
      const text = $("#message").val().trim();
      const templates = res.templates || [];
      templates.forEach((template) => {
        if (text === template.message) {
          isTextPresent = true;
        }
      });

      if (isTextPresent || text.length == 0) {
        $("#template-selector").removeClass("hide");
        $("#template-save-icon").addClass("hide");
        $(".tooltip-popup-content").removeClass("right-side");
      } else {
        $("#template-selector").addClass("hide");
        $("#template-save-icon").removeClass("hide");
        $(".tooltip-popup-content").addClass("right-side");
      }
    });
  }

  showTemplateSelectorOrSave();
  $("#message").on("input click", function () {
    showTemplateSelectorOrSave();

    $("#template-selector").removeClass("active");
    $(".tooltip-container ").addClass("hide");
    $("#templates-container").addClass("hide");
    $("#attachment-first-checkbox-section").prop(
      "hidden",
      $("#message").val().trim().length == 0 ||
      $("#attachments-container").html().trim().length == 0
    );
  });

  $("#message").on("keydown", function (event) {
    if (event.ctrlKey || event.metaKey) {
      if (event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case "x": // Ctrl + Shift + X for Strikethrough
            event.preventDefault();
            wrapSelectedTextOfMessage("~");
            break;
          case "i": // Ctrl + Shift + I for InlineCode
            event.preventDefault();
            wrapSelectedTextOfMessage("`");
            break;
        }
      } else {
        switch (event.key.toLowerCase()) {
          case "b": // Ctrl + B for Bold
            event.preventDefault();
            wrapSelectedTextOfMessage("*");
            break;
          case "i": // Ctrl + I for Italic
            event.preventDefault();
            wrapSelectedTextOfMessage("_");
            break;
        }
      }
    }
  });

  function wrapSelectedTextOfMessage(ch) {
    const textarea = document.querySelector("#message");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    if (start !== end) {
      const selectedText = text.substring(start, end);

      if (selectedText.startsWith(ch) && selectedText.endsWith(ch)) {
        const unwrappedText = selectedText.slice(ch.length, -ch.length);
        textarea.value =
          text.substring(0, start) + unwrappedText + text.substring(end);
        textarea.setSelectionRange(start, start + unwrappedText.length);
      } else {
        const boldText = `${ch}${selectedText}${ch}`;
        textarea.value =
          text.substring(0, start) + boldText + text.substring(end);
        textarea.setSelectionRange(start, start + boldText.length);
      }
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  $("#template-save-icon").click(function () {
    const topPosition =
      Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + "px";
    $(".template-save-popup").css("top", topPosition);
    $(".template-save-popup-container").removeClass("hide");
    $("#template-msg").val($("#message").val().trim());
    $("#template-name").val("").focus();
  });

  $("#save-template-form").submit(function (e) {
    e.preventDefault();

    const tempName = $("#template-name").val();
    const tempMessage = $("#template-msg").val();
    const editIndex = $("#edit-template-index").val();

    chrome.storage.local.get(["templates"], (res) => {
      let templates = res.templates || [];
      let isTempNameExists = false;

      if (editIndex === "") {
        templates.forEach((template) => {
          if (template.name === tempName) {
            isTempNameExists = true;
          }
        });

        if (isTempNameExists) {
          alert(`Template name "${tempName}" already exists!`);
        } else {
          templates.push({ name: tempName, message: tempMessage });
        }
      } else {
        const index = parseInt(editIndex);
        templates[index].name = tempName;
        templates[index].message = tempMessage;
      }

      chrome.storage.local.set({ templates: templates });
      $(".template-save-popup-container").addClass("hide");
      $(".template-container").addClass("hide");
      $("#template-save-icon").addClass("hide");
      $("#template-selector").removeClass("hide");
      $(".tooltip-popup-content").removeClass("right-side");
      $("#edit-template-index").val("");


    });
  });

  function editTemplate(index) {
    chrome.storage.local.get(["templates"], async (res) => {
      let templates = res.templates;
      let message = templates[index].message;
      let name = templates[index].name;
      const topPosition =
        Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + "px";
      $(".template-save-popup").css("top", topPosition);
      $(".template-save-popup-container").removeClass("hide");
      $("#template-msg").val(message);
      $("#template-name").val(name).focus();
      $("#edit-template-index").val(index);
    });
  }

  function showTemplates() {
    $("#templates-container").html("");
    chrome.storage.local.get(["templates"], async (res) => {
      let templates = res.templates || [];
      if (templates.length > 0) {
        for (let index = templates.length - 1; index >= 0; index--) {
          $("#templates-container").append(`
                    <div class="dropdown-item">
                    <p id="${index}" class="template-text text">${templates[index].name}</p>
                     <img id="${index}" class="template-edit btn" src="./logo/pro-edit_icon.png" />
                    <img id="${index}" class="template-delete btn" src="./logo/pro-template_delete.png" />
                    </div>`);
        }
      } else {
        $("#templates-container").append(`
                    <div class="dropdown-item">${await translate(
          "Nothing to show!"
        )}</div>
                    <div id="create_template_button" class="dropdown-item" style="justify-content:flex-start; gap:10px;font-size:13px;">
                        <img src="./logo/pro-floppy-disk.png" style="width:18px;"/>
                        <span>Add Template</span>
                    </div>
                `);
        $("#create_template_button").click(function () {
          const topPosition =
            Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) +
            "px";
          $(".template-save-popup").css("top", topPosition);
          $(".template-save-popup-container").removeClass("hide");
          $("#template-msg").val($("#message").val().trim());
          $("#template-name").val("").focus();
        });
      }

      $(".template-text").click(function () {
        let id = $(this).attr("id");
        let tempMsg = templates[id].message;
        $("#message").val(tempMsg);

        $("#templates-container").addClass("hide");
        $("#template-selector").removeClass("active");
      });

      $(".template-delete").click(async function () {
        let id = $(this).attr("id");
        let msg = await translate(
          `Are you sure, you want to remove template "TEMPLATE NAME" ?`
        );
        msg = msg.replace(/"(.*?)"/gi, `"${templates[id].name}"`);
        let __confirm = confirm(msg);
        if (__confirm) {
          templates.splice(id, 1);
          chrome.storage.local.set({ templates: templates });
          showTemplates();
        }
      });

      $(".template-edit").click(async function () {
        let id = $(this).attr("id");
        editTemplate(id);
      });
    });
  }

  $("#template-selector").click(function (e) {
    showTemplates();


    $(".tooltip-container ").addClass("hide");
    $("#templates-container").toggleClass("hide");
    $("#template-selector").toggleClass("active");
  });

  $(".template-popup-close-button").click(function () {
    $(".template-save-popup-container").addClass("hide");
  });

  //Campaign Numbers - Feature
  function showCampaignSelectorOrSave() {
    chrome.storage.local.get(["campaigns"], (res) => {
      let isCampaignPresent = false;
      const numbers = getFilteredNumbers($("#numbers").val());
      const campaigns = res.campaigns || [];
      let filteredCampaigns = filterCampaignsByType(
        campaigns,
        messageToggleSwitchValue
      );

      filteredCampaigns.forEach((campaign) => {
        if (numbers === campaign[messageToggleSwitchValue]) {
          isCampaignPresent = true;
        }
      });

      if (isCampaignPresent || numbers.length == 0) {
        $("#campaign-selector").removeClass("hide");
        $("#campaign-save-icon").addClass("hide");
      } else {
        $("#campaign-selector").addClass("hide");
        $("#campaign-save-icon").removeClass("hide");
      }
    });
  }

  showCampaignSelectorOrSave();
  showGroupsCampaignSelectorOrSave();

  $("#numbers").on("click change", function () {
    showCampaignSelectorOrSave();

    $("#campaign-selector").removeClass("active");
    $("#campaigns-container").addClass("hide");
  });
  function helper() {
    const topPosition =
      Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + "px";
    let popupTitle = document.querySelector(".campaign-title");
    let popupBtn = document.querySelector(".campaign-btn");
    let textArea = document.querySelector("#campaign-numbers");

    if (messageToggleSwitchValue !== "numbers")
      textArea.setAttribute("readonly", true);
    else textArea.removeAttribute("readonly");

    popupTitle.innerHTML = `Save Campaign ${String(messageToggleSwitchValue).charAt(0).toUpperCase() +
      String(messageToggleSwitchValue).slice(1)
      }`;
    popupBtn.innerHTML = `Save Campaign ${String(messageToggleSwitchValue).charAt(0).toUpperCase() +
      String(messageToggleSwitchValue).slice(1)
      }`;

    $(".campaign-save-popup").css("top", topPosition);
    $(".campaign-save-popup-container").removeClass("hide");
  }

  $("#campaign-save-icon").click(function () {
    let numbers = getFilteredNumbers($("#numbers").val());
    helper();
    $("#campaign-numbers").val(numbers);
    $("#campaign-name").val(csv_name).focus();
  });

  $("#campaign-save-icon-items").click(function () {
    let items = getItemsName();
    helper();
    $("#campaign-numbers").val(items);
    $("#campaign-name").val(csv_name).focus();
  });

  $("#save-campaign-form").submit(function (e) {
    e.preventDefault();

    const campName = $("#campaign-name").val();
    const editIndex = $("#edit-index").val();
    let campData = {};

    switch (messageToggleSwitchValue) {
      case "numbers":
        campData.numbers = getFilteredNumbers($("#campaign-numbers").val());
        break;
      case "groups":
        campData.groups = getItemsName();
        break;
      case "contacts":
        campData.contacts = getItemsName();
        break;
      default:
        alert("Invalid toggle value!");
        return;
    }

    if (editIndex === "") {
      saveCampaign(campName, campData, (success) => {
        if (success) finalizeCampaignSave();
      });
    } else {
      const index = parseInt(editIndex);
      updateCampaign(index, campName, campData, (success) => {
        if (success) finalizeCampaignSave();
      });
    }
  });

  function finalizeCampaignSave() {
    if (messageToggleSwitchValue === "numbers") {
      $("#campaign-selector").removeClass("hide");
      $("#campaigns-container").addClass("hide");
      $("#campaign-save-icon").addClass("hide");
    } else {
      $("#campaign_selector_groups").removeClass("hide");
      $("#campaigns-container-groups").addClass("hide");
      $("#campaign-save-icon-items").addClass("hide");
    }

    $(".campaign-save-popup-container").addClass("hide");
    $("#edit-index").val("");

  }

  function editCampaignsNumber(index) {
    chrome.storage.local.get(["campaigns"], async (res) => {
      let campaigns = res.campaigns;
      let numbers = campaigns[index][messageToggleSwitchValue];
      let name = campaigns[index].name;
      helper();
      $("#campaign-numbers").val(numbers);
      $("#campaign-name").val(name).focus();
      $("#edit-index").val(index);
    });
  }

  function showCampaigns() {
    const containerMap = {
      numbers: "#campaigns-container",
      groups: "#campaigns-container-groups",
      contacts: "#campaigns-container-groups",
    };

    const containerSelector =
      containerMap[messageToggleSwitchValue] || "#campaigns-container";
    $(containerSelector).html("");
    chrome.storage.local.get(["campaigns"], async (res) => {
      let campaigns = res.campaigns || [];
      let filteredCampaigns = filterCampaignsByType(
        campaigns,
        messageToggleSwitchValue
      );

      if (filteredCampaigns.length > 0) {
        for (let index = filteredCampaigns.length - 1; index >= 0; index--) {
          $(containerSelector).append(`
                        <div class="dropdown-item">
                            <p id="${index}" class="campaign-name text">${filteredCampaigns[index].name
            }</p>
                            <img id="${index}" class="campaign-edit btn ${messageToggleSwitchValue !== "numbers" ? "hide" : ""
            }" src="./logo/pro-edit_icon.png" />
                            <img id="${index}" class="campaign-delete btn" src="./logo/pro-template_delete.png" />
                        </div>`);
        }
      } else {
        $(containerSelector).append(`
                    <div class="dropdown-item">${await translate(
          "Nothing to show!"
        )}</div>
                    ${messageToggleSwitchValue === "numbers"
            ? `<div id="create_campaign_button" class="dropdown-item" style="justify-content:flex-start; gap:10px;font-size:13px;">
                        <img src="./logo/pro-floppy-disk.png" style="width:18px;"/>
                        <span>Add Campaign</span>
                    </div>`
            : ``
          }
                `);
        $("#create_campaign_button").click(function () {
          let numbers = getFilteredNumbers($("#numbers").val());
          const topPosition =
            Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) +
            "px";
          $(".campaign-save-popup").css("top", topPosition);

          $(".campaign-save-popup-container").removeClass("hide");
          $("#campaign-numbers").val(numbers);
          $("#campaign-name").val(csv_name).focus();
        });
      }

      // Campaign selection click handler
      $(".campaign-name").click(function () {
        let id = $(this).attr("id");
        let campaignNumbers = filteredCampaigns[id][messageToggleSwitchValue];
        messageToggleSwitchValue === "numbers"
          ? replaceNumbers(campaignNumbers)
          : renderSelectedItems(campaignNumbers);

        $(containerSelector).addClass("hide");
        messageToggleSwitchValue === "numbers"
          ? $("#campaign-selector").removeClass("active")
          : $("#campaign_selector_groups").removeClass("active");
      });

      // Campaign delete handler
      $(".campaign-delete").click(async function () {
        let id = $(this).attr("id");
        let msg = await translate(
          `Are you sure, you want to remove campaign "CAMPAIGN NAME"?`
        );
        msg = msg.replace(/"(.*?)"/gi, `"${filteredCampaigns[id].name}"`);
        let __confirm = confirm(msg);
        if (__confirm) {
          campaigns = campaigns.filter(
            (campaign) => campaign !== filteredCampaigns[id]
          );
          chrome.storage.local.set({ campaigns });
          showCampaigns();
        }
      });

      // Campaign edit handler
      $(".campaign-edit").click(async function () {
        let id = $(this).attr("id");
        let originalId = campaigns.indexOf(filteredCampaigns[id]);
        editCampaignsNumber(originalId);
      });
    });
  }

  $("#campaign-selector").click(function (e) {
    showCampaigns();


    $("#campaigns-container").toggleClass("hide");
    $("#campaign-selector").toggleClass("active");
  });

  $("#campaign_selector_groups").click(function (e) {
    showCampaigns();

    $("#campaigns-container-groups").toggleClass("hide");
    $("#campaign_selector_groups").toggleClass("active");
  });

  $(".campaign-popup-close-button").click(function () {
    $(".campaign-save-popup-container").addClass("hide");
  });

  $(".invalid-excel-popup-close-button").click(function () {
    $(".invalid-excel-popup-container").addClass("hide");
    unset_csv_styles();
    hideCustomizationContainer();
    replaceNumbers("");
    toggleUploadExcelText(true);
  });

  $(".template-excel-button").click(function () {
    $(".invalid-excel-popup-container").addClass("hide");
    unset_csv_styles();
    hideCustomizationContainer();
    replaceNumbers("");
    toggleUploadExcelText(true);
  });

  //Delivery Reports Dropdown - Feature
  function showReports() {
    $("#reports-container").html("");
    chrome.storage.local.get(["deliveryReports"], async (res) => {
      let reports = res.deliveryReports || [];

      if (reports.length > 0) {
        for (let index = reports.length - 1; index >= 0; index--) {
          let reportDate = getReportDateFormat(reports[index].date);
          let reportName = reports[index].name || "Campaign " + (index + 1);

          $("#reports-container").append(`
                        <div class="dropdown-item">
                            <p id="${index}" class="report-name text">
                                <img src="./logo/pro-excel_icon.png"/>
                                <span style="color: #009A88;">${reportName}</span>
                                <span style="color: #5D6063;">${reportDate}</span>
                            </p>
                            <img id="${index}" class="report-download btn CtaBtn" src="./logo/pro-download_icon.png" />
                        </div>`);
        }
      } else {
        $("#reports-container").append(
          `<div class="dropdown-item">${await translate(
            "Nothing to show!"
          )}</div>`
        );
      }

      $(".report-download").click(function () {
        let id = $(this).prop("id");
        let reportDataURI = encodeURI(reports[id].data);
        let reportDownloadDate = getReportDateFormat(reports[id].date, true);
        let reportName = reports[id].name || "Campaign " + (+id + 1);
        let reportDownloadName = `${reportName} ${reportDownloadDate}.csv`;

        let link = document.createElement("a");
        link.setAttribute("href", reportDataURI);
        link.setAttribute("download", reportDownloadName);
        document.body.appendChild(link);
        link.click();


      });
    });
  }

  $("#report-selector").click(function (e) {
    showReports();


    $("#reports-container").toggleClass("hide");
    $("#report-selector").toggleClass("active");
  });

  // Open groups/contacts selector if user clicks on blacnk space
  // $(".groups_display_box").click(function (e) {
  //   e.stopPropagation();
  //   const ele = $(e.target);
  //   if (ele && !ele.is(".delete_group_tag")) {
  //     $(".search_group_input").click();
  //   }
  // });

  $(".search_group_input").click(function () {
    if (messageToggleSwitchValue === "contacts") {
      if (
        allContacts.length === 0 ||
        contacts_selected.length === allContacts.length
      )
        return;
    }

    if (messageToggleSwitchValue === "groups") {
      if (allGroups.length === 0 || groups_selected.length === allGroups.length)
        return;
    }

    document.querySelector(".search_group_input").value = "";
    $("#select-all").prop("checked", false);

    showItems(messageToggleSwitchValue === "groups");

    $("#groups_container").removeClass("hide");
    const lastPosition =
      messageToggleSwitchValue === "groups"
        ? lastScrollPosition
        : lastScrollPosition_contacts;
    $("#groups_container").scrollTop(lastPosition);

    // $(".message-box").addClass("hide_visibility");
  });

  $('#groups_container').on('click', function () {
    if (messageToggleSwitchValue === "groups" || messageToggleSwitchValue === "contacts") {
      updateGroupCount()
    }
  })

  // For closing dropdown container when user clicks outside of it
  document.addEventListener("click", function (event) {
    const dropdownContainers = document.querySelectorAll(".dropdown-container");
    const dropdownBoxes = document.querySelectorAll(".dropdown-box");
    const dropdownButtons = document.querySelectorAll(".dropdown");
    const groupsSearchBar = document.querySelectorAll(".groups_searchbar");
    for (let i = 0; i < dropdownBoxes.length; i++) {
      if (
        !dropdownBoxes[i].contains(event.target) &&
        !dropdownContainers[i].contains(event.target) &&
        !groupsSearchBar[0].contains(event.target) &&
        !event.target.classList.contains("dropdown-item") &&
        !event.target.classList.contains("dropdown-container")
      ) {
        dropdownContainers[i].classList.add("hide");
        dropdownButtons[i]?.classList.remove("active");
        // $(".message-box").removeClass("hide_visibility");
        document.querySelector(".search_group_input").value = "";
        // $("#select-all").prop("checked", false);  // Original Extension Code
      }
    }
  });

  document
    .querySelector(".groups_display_box")
    .addEventListener("click", function (event) {
      if (event.target && event.target.classList.contains("delete_group_tag")) {
        const deleteTag = event.target;
        const parentTag = deleteTag.closest(".group_tag");

        if (parentTag) {
          let objId = parentTag.id;
          let serizalizeId = parentTag.getAttribute("data-id-field");

          let isGroup = messageToggleSwitchValue === "groups";
          let selectedArray = isGroup ? groups_selected : contacts_selected;

          selectedArray = selectedArray.filter((item) => item !== serizalizeId);

          if (isGroup) {
            groups_selected = selectedArray;
          } else {
            contacts_selected = selectedArray;
          }

          chrome.storage.local.set({
            [isGroup ? "groups_selected" : "contacts_selected"]: selectedArray,
          });
          handleDeleteBin();
          // handleTemplateSaveBtn()
          // handleCampaignBox()
          const itemElement = document.querySelector(
            `#group_container #${objId}`
          );
          if (itemElement) itemElement.classList.remove("hide");

          parentTag.remove();

          const displayBox = document.querySelector(".groups_display_box");
          if (selectedArray.length === 0) {
            displayBox.innerHTML = `<p style="font-size:13px;margin:0px;">Select ${isGroup ? "groups" : "contacts"
              } to message</p>`;
          }

          // Enable select all feature again after deleting a single group/contact
          fetching = false;
          $("#select-all").prop("checked", false);

          // Update group counts
          setTimeout(function () {
            updateGroupCount();
            // $('.select_all').removeClass('disabled');
            // $('#select-all').prop('disabled', false)
          }, 100)
        }
      }
    });

  // Language Translate Feature
  setDefaultLanguageData(); // Initialize defaultTexts data
  populateLanguageOptions(); // Load the language optioins

  function setDefaultLanguageData() {
    let textElements = document.querySelectorAll("[data-translate-text]");
    let defaultTexts = Object.values(textElements).map((ele) => ele.innerText);

    let placeholderElements = document.querySelectorAll(
      "[data-translate-placeholder]"
    );
    let defaultPlaceholders = Object.values(placeholderElements).map(
      (ele) => ele.placeholder
    );

    chrome.storage.local.set({
      defaultLanguageData: {
        texts: defaultTexts,
        placeholders: defaultPlaceholders,
      },
    });
  }

  function populateLanguageOptions() {
    let languageNames = new Intl.DisplayNames(["en"], { type: "language" });
    let selectedLanguageCodes = navigator.languages.map(
      (lang) => lang.split("-")[0]
    );
    selectedLanguageCodes = selectedLanguageCodes.filter(
      (value, index, self) => self.indexOf(value) === index
    );

    let languageSelector = document.getElementById("language-selector");
    languageSelector.innerHTML = "";
    languageSelector.appendChild(createOption("English (Default)", "default"));

    chrome.storage.local.get(["currentLanguage"], (res) => {
      currentLanguage = res.currentLanguage || "default";
      translateAll(currentLanguage);

      // Add selected language options
      selectedLanguageCodes.forEach((language) => {
        if (language === "en") return;
        languageSelector.appendChild(
          createOption(
            languageNames.of(language),
            language,
            language === currentLanguage
          )
        );
      });
      // Add a separator
      languageSelector.appendChild(
        createOption("-----------------------", "", false, true)
      );
      // Add more language options
      allLanguageCodes.forEach((language) => {
        if (language === "en" || selectedLanguageCodes.includes(language))
          return;
        languageSelector.appendChild(
          createOption(
            languageNames.of(language),
            language,
            language === currentLanguage
          )
        );
      });
    });
  }

  $("#language-selector").change(function () {
    currentLanguage = $(this).val();
    chrome.storage.local.set({ currentLanguage: currentLanguage });
    translateAll(currentLanguage);
    sendMessageToBackground({
      type: "translate_language",
      language: currentLanguage,
    });
  });

  async function translateAll(targetLanguage) {
    let textElements = document.querySelectorAll("[data-translate-text]");
    let placeholderElements = document.querySelectorAll(
      "[data-translate-placeholder]"
    );

    chrome.storage.local.get(
      ["defaultLanguageData", "translatedCache"],
      async (res) => {
        let defaultTexts = res.defaultLanguageData.texts;
        let defaultPlaceholders = res.defaultLanguageData.placeholders;
        let cache = res.translatedCache || {};

        const textPromises = defaultTexts.map(async (text) => {
          if (cache[text] && cache[text][targetLanguage]) {
            return cache[text][targetLanguage];
          }

          const translatedText = await translateAPI(text);
          if (!cache[text]) cache[text] = {};
          cache[text][targetLanguage] = translatedText;
          return translatedText;
        });

        const placeholderPromises = defaultPlaceholders.map(
          async (placeholder) => {
            if (cache[placeholder] && cache[placeholder][targetLanguage]) {
              return cache[placeholder][targetLanguage];
            }

            const translatedPlaceholder = await translateAPI(placeholder);
            if (!cache[placeholder]) cache[placeholder] = {};
            cache[placeholder][targetLanguage] = translatedPlaceholder;
            return translatedPlaceholder;
          }
        );

        const translatedTexts = await Promise.all(textPromises);
        const translatedPlaceholders = await Promise.all(placeholderPromises);

        textElements.forEach(
          (ele, index) => (ele.innerText = translatedTexts[index])
        );
        placeholderElements.forEach(
          (ele, index) => (ele.placeholder = translatedPlaceholders[index])
        );

        chrome.storage.local.set({ translatedCache: cache });
      }
    );
  }
});

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

  const translateAPI = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURI(
    text
  )}`;

  return await new Promise((resolve) => {
    try {
      $.getJSON(translateAPI, function (data) {
        let translatedText = data[0].map((row) => row[0]).join(" ");
        resolve(filter(translatedText));
      });
    } catch (err) {
      console.log("Translation Error:", err);
      resolve(filter(text));
    }
  });
}

function createOption(__text, __value, __selected = false, __disabled = false) {
  let option = document.createElement("option");
  option.text = __text;
  option.value = __value;
  option.selected = __selected;
  option.disabled = __disabled;
  return option;
}

function getFet(key) {
  let fet;
  if (key == "groupContactExport") fet = "Export Group Contacts";
  if (key == "customisation") fet = "Customization";
  if (key == "batching") fet = "Batching";
  if (key == "timeGap") fet = "Time Gap";
  if (key == "stop") fet = "Stop";
  if (key == "quickReplies") fet = "Quick Replies";
  if (key == "schedule") fet = "Schedule";
  if (key == "multipleAttachment") fet = "Multiple Attachment";
  if (key == "attachment") fet = "Attachment";
  if (key == "caption") fet = "Caption";
  return fet;
}

async function getMultipleAccountsData() {
  chrome.storage.local.get(["multipleAccountsData"], async function (res) {
    if (!res || !res?.isFetchedToday || subscribed_date == getTodayDate()) {
      try {
        const res = await fetch("api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: parentEmail }),
        });
        // const data = await
      } catch (error) {
        console.log("Error while fetching multiple accounts data", error);
      }
    } else {
    }
  });
}

function showMultipleAccountSection() {
  getMultipleAccountsData();
  if (!isMultipleAccount) return;
  const multiple_account_bloc = document.querySelector(".mult_account_block");
  multiple_account_bloc.classList.remove("hide");
  let show_more_html = "",
    show_less_html = "";
  let top_html = `<div style="color:#fff;display:flex;justify-content:flex-start;align-items:center;gap:5px;flex-wrap:wrap;">
            <p style="margin:0px !important;">Other numbers in the plan :</p>`;
  show_more_html = top_html;
  for (let i = 0; i < 5; i++)
    show_more_html += `<span class="mult_num_tag" style="background:#009a88 !important">${otherNumbers[i]}</span>`;
  show_more_html += `<span class="mult_show_more_section">... <span class="show_all_mult_numbers" style="cursor:pointer;text-decoration:underline;">show more</span></span></div>`;
  show_more_html += "</div>";

  show_less_html = top_html;
  for (let i = 5; i < otherNumbers.length; i++)
    show_less_html += `<span class="mult_num_tag" style="background:#009a88 !important">${otherNumbers[i]}</span>`;
  show_less_html += `<span class="mult_show_more_section"><span class="show_all_mult_numbers" style="cursor:pointer;text-decoration:underline;">show less</span></span></div>`;
  show_less_html += "</div>";
  multiple_account_bloc.innerHTML = show_more_html;

  document
    .querySelector(".mult_show_more_section")
    .addEventListener("click", function () {
      showAllMultNumbers = !showAllMultNumbers;
      if (showAllMultNumbers) multiple_account_bloc.innerHTML = show_more_html;
      else multiple_account_bloc.innerHTML = show_less_html;
      document
        .querySelector(".show_all_mult_numbers")
        .addEventListener("click", function () {
          showAllMultNumbers = !showAllMultNumbers;
          showMultipleAccountSection();
        });
    });
}

function showFaqsSection() {
  const faqSection = document.querySelector(".premium_feature_faq");
  if (!faqSection) return;
  let faqHtml = "";
  FAQS.forEach((faq, index) => {
    faqHtml += `
            <div class="premium_feature_block">
                <div class="faq_question_block">
                    <p class="faq_question">${index + 1}) ${faq.question}</p>
                    <img src="logo/pro-dropdown_icon.png" />
                </div>
                <p class="faq_answer">${faq.answer}</p>
            </div>
            `;
  });

  faqSection.innerHTML = faqHtml;

  const allQuestions = document.querySelectorAll(".faq_question_block");
  if (allQuestions.length > 0) {
    allQuestions.forEach((question, _) => {
      question.addEventListener("click", function () {
        const answer = question.nextElementSibling;
        if (answer.style.display == "block") {
          answer.style.display = "none";
          question.children[1].style.transform = "rotate(0deg)";
        } else {
          answer.style.display = "block";
          question.children[1].style.transform = "rotate(180deg)";
        }
      });
    });
  }
}


// Getting invoice data from the local storage and showing it in the popup
async function getInvoiceData() {
  chrome.storage.local.get(["invoiceObject"], function (result) {
    let data = [];
    const dates = result.invoiceObject;
    if (dates == undefined) {
      data = [];
    } else data = dates;
    const invoiceInputSection = document.getElementById("invoice_input");
    let optionsHtml = "";

    if (data.length > 0) {
      data.map(
        (item) =>
          (optionsHtml += `<option value="${item.date}">${item.date}</option>`)
      );
      document.getElementById("download_invoice_button").href =
        data[0]?.invoice_pdf_url;
    } else {
      optionsHtml = `<option value="invoice_not_found">No Receipt Found</option>`;
    }
    if (optionsHtml == "")
      optionsHtml = `<option value="invoice_not_found">No Receipt Found</option>`;
    invoiceInputSection.innerHTML = optionsHtml;

    invoiceInputSection.addEventListener("change", (e) => {
      const selectedDate = e.target.value;
      const invoice = data.find((item) => {
        return item.date == selectedDate;
      });
      // if invoice found
      if (invoice) {
        document.getElementById("download_invoice_button").href =
          invoice.invoice_pdf_url;
      }
    });

    const invoiceButtonLoader = document.getElementById(
      "invoice_button_loader"
    );
    const invoiceButtonText = document.getElementById("invoice_button_text");

    const downloadInvoiceButtton = document.getElementById(
      "download_invoice_button"
    );
    downloadInvoiceButtton.addEventListener("click", () => {
      invoiceButtonLoader.style.display = "flex";
      invoiceButtonText.style.display = "none";

      setTimeout(() => {
        const invoiceButtonLoader = document.getElementById(
          "invoice_button_loader"
        );
        const invoiceButtonText = document.getElementById(
          "invoice_button_text"
        );
        if (invoiceButtonLoader && invoiceButtonText) {
          invoiceButtonLoader.style.display = "none";
          invoiceButtonText.style.display = "flex";
        }
      }, 5000);
    });
  });
}

async function makeNewDesignResponse(res) {
  try {
    const response = await fetch("https://sheetdb.io/api/v1/wbzt6s0lud7bg", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          "Contact Number": my_number,
          "Yes/No": res,
          "Date/time": new Date().toLocaleString("en-in"),
        },
      ]),
    });
    await response.json();
  } catch (error) {
    console.log("error from sheetdb api call", error);
  }
}

async function showNewDesignReviewButtons() {
  chrome.storage.local.get(
    ["campaignNumber", "newDesignLiked", "newDesignSessions"],
    function (res) {
      let campaignNumber = res.campaignNumber;
      let newDesignLiked = res.newDesignLiked;
      let newDesignSessions = res.newDesignSessions;
      if (res.newDesignLiked == undefined || res.newDesignLiked == null) {
        chrome.storage.local.set({ newDesignLiked: false });
        newDesignLiked = false;
      }
      if (res.newDesignSessions == undefined || res.newDesignSessions == null) {
        chrome.storage.local.set({ newDesignSessions: 0 });
        newDesignSessions = 0;
      }
      const showReviewStrip =
        campaignNumber && !newDesignLiked && newDesignSessions < 10;
      if (showReviewStrip) {
        const getReviewStripInterval = setInterval(() => {
          const reviewStrip = document.querySelector(
            ".new_popup_question_strip"
          );
          if (reviewStrip) {
            clearInterval(getReviewStripInterval);
            reviewStrip.style.display = "flex";
            reviewStrip.hidden = false;

            const yesButton = document.querySelector(".question_yes_button");
            const noButton = document.querySelector(".question_no_button");

            yesButton.addEventListener("click", async () => {
              await makeNewDesignResponse("Yes");
              chrome.storage.local.set({ newDesignLiked: true });
              document.body.removeChild(reviewStrip);
            });
            noButton.addEventListener("click", async () => {
              await makeNewDesignResponse("No");
              chrome.storage.local.set({ newDesignLiked: true });
              document.body.removeChild(reviewStrip);
            });
            chrome.storage.local.set({
              newDesignSessions: newDesignSessions + 1,
            });
          }
        }, 200);
      }
    }
  );
}

showNewDesignReviewButtons();

function elementsToBeHighlighted() {
  const numbersBox = document.querySelector(".numbers-box");
  const messageBox = document.querySelector(".message-box");
  const numberBoxTitle = document.querySelector(".numbers-box .text_title");
  const messageBoxTitle = document.querySelector(".message-box .text_title");
  const actionsButtonContainer = document.querySelector(".action_buttons_div");
  const numbersBoxNavigationContainer = document.querySelectorAll(
    ".numbers-box .navigation_container"
  );
  const messageBoxNavigationContainer = document.querySelectorAll(
    ".message-box .navigation_container"
  );
  const buttonsBoxNavigationContainer = document.querySelectorAll(
    ".action_buttons_div .navigation_container"
  );
  const reportBox = document.querySelector("#report-box");
  const sendButton = document.getElementById("sender");
  const tooltipContainer = document.querySelector(".tooltip-popup-container");

  return [
    {
      element: numbersBox,
      element2: numberBoxTitle,
      child: numbersBoxNavigationContainer,
    },
    {
      element: messageBox,
      child: messageBoxNavigationContainer,
      element2: messageBoxTitle,
      element6: tooltipContainer,
    },
    {
      element: actionsButtonContainer,
      child: buttonsBoxNavigationContainer,
      element3: reportBox,
      element5: sendButton,
      // element6: tooltipContainer
    },
  ];
}

function highlightIndexedSection(index) {
  const elements = elementsToBeHighlighted();
  elements.forEach((element, i) => {
    if (index == i) {
      element.element.classList.add("focus_element");
      element.element2?.classList.add("title_focus");
      element.element3?.classList.add("reduce_opacity");
      element.element4?.classList.add("reduce_opacity");
      element.element5?.classList.add("focus_border");
      element.element6?.classList.add("display_none_class");
      element.child.forEach((child) => {
        child.hidden = false;
      });
    } else {
      element.element.classList.remove("focus_element");
      element.element2?.classList.remove("title_focus");
      element.element3?.classList.remove("reduce_opacity");
      element.element4?.classList.remove("reduce_opacity");
      element.element5?.classList.remove("focus_border");
      element.element6?.classList.remove("display_none_class");
      element.child.forEach((child) => {
        child.hidden = true;
      });
    }
  });
  const tooltipContainer = document.querySelector(".tooltip-popup-container");
  if (tooltipContainer) {
    if (index == 1 || index == 2) {
      tooltipContainer.classList.add("display_none_class");
    } else {
      tooltipContainer.classList.remove("display_none_class");
    }
  }
}

function scrollToSection(index) {
  let currentSection = null;
  if (index == 0) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (index == 1) {
    currentSection = document.querySelector(".message-box");
  } else {
    currentSection = document.querySelector(".action_buttons_div");
  }
  if (currentSection) currentSection.scrollIntoView({ behavior: "smooth" });
}

function startNavigationTour() {
  let index = 0;
  const backgroundOverlay = document.querySelector(".background_overlay");
  if (backgroundOverlay) {
    backgroundOverlay.hidden = false;
    const navigationButtons = document.querySelector(".how_to_use_buttons");
    const prev_button = document.querySelector(".how_to_use_left");
    const next_button = document.querySelector(".how_to_use_right");
    if (navigationButtons) {
      navigationButtons.style.display = "flex";
      navigationButtons.hidden = false;
      prev_button.style.display = "none";
      prev_button.hidden = true;
    }
    scrollToSection(index);
    highlightIndexedSection(index);
    prev_button.addEventListener("click", () => {
      index--;
      index = Math.max(Number(index), 0);
      highlightIndexedSection(index);
      if (index == 0) {
        prev_button.hidden = true;
        prev_button.style.display = "none";
      }
      next_button.innerHTML =
        '<span>Next</span><img src="logo/pro-arrow-right.png" alt="left_arrow">';
      scrollToSection(index);
    });
    next_button.addEventListener("click", () => {
      index++;
      if (index > 2) {
        index = 0;
        backgroundOverlay.hidden = true;
        navigationButtons.hidden = true;
        navigationButtons.style.display = "none";
        next_button.innerHTML =
          '<span>Next</span><img src="logo/pro-arrow-right.png" alt="left_arrow">';
        highlightIndexedSection(3);
        scrollToSection(0);
        return;
      }
      highlightIndexedSection(index);
      if (index == 2) {
        next_button.innerHTML = "<span>Close</span>";
      }
      prev_button.hidden = false;
      prev_button.style.display = "flex";
      scrollToSection(index);
    });
  }
}

function startNavigationTourOnFirstVisit() {
  const navigationInterval = setInterval(async () => {
    const numbersBox = document.querySelector(".numbers-box");

    if (numbersBox) {
      clearInterval(navigationInterval);
      chrome.storage.local.get(["no_of_visit"], function (res) {
        if (res.no_of_visit == 1) {
          removeHighlightTour();
        }
      });
    }
  }, 500);
}

startNavigationTourOnFirstVisit();

function getCurrentTimein24HourFormat() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutes}`;
}

function getCurrentDate() {
  let now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // Months are 0-based in JavaScript
  let day = now.getDate();
  month = month < 10 ? "0" + month : month;
  day = day < 10 ? "0" + day : day;
  return `${year}-${month}-${day}`;
}

function showScheduleExpiredPopup(campaign, index) {
  const container = document.querySelector(".schedule_expired_popup_container");
  if (container) {
    document.body.removeChild(container);
  }
  const schedulePopupContainer = document.createElement("div");
  schedulePopupContainer.className = "schedule_expired_popup_container";
  schedulePopupContainer.innerHTML = `<div class="schedule_popup_title">
    <img src="logo/pro-clock.png" alt="" />
    <p>Reminder: Scheduled campaign not sent</p>
    </div>
    <div class="schedule_popup_content">
    <p>Your campaign scheduled at <span class="schedule_date_time">${formatScheduleDate(
    campaign.schedule_date
  )} ${convertTo12Hour(campaign.schedule_time)}</span> <br /> is not send.</p>
    <div class="schedule_popup_buttons_container">
                <button id="send_schedule_btn" class="CtaBtn" style="background:#fff; color:#009a88; border:2px solid #009a88">Send now</button>
                <button id="reschedule_btn" class="CtaBtn" style="background:#009a88; color:#fff; border: 2px solid #fff">Reschedule</button>
                <button id="delete_schedule_btn" class="CtaBtn" style="color:red; border:2px solid red; background:#fff">Delete</button>
            </div>
        </div>
        <div class="popup-footer">
            <div class="popup-footer-container">
                <div class="logo-div">
                    <img class="logo-icon" src="logo/pro-logo-img.png" alt="Logo"/>
                    <img class="logo-text" src="logo/pro-logo-text.png" alt="Logo Text"/>
                </div>
                <div class="contact-div">
                    <p>Any questions?</p>
                    <a class="handle_help_btn CtaBtn">Contact Support</a>
                </div>
            </div>
        </div>
        `;

  document.body.appendChild(schedulePopupContainer);
  const backgroundOverlay = document.querySelector(".background_overlay");
  if (backgroundOverlay) {
    backgroundOverlay.hidden = false;
  }

  const sendScheduleBtn = document.getElementById("send_schedule_btn");
  const rescheduleBtn = document.getElementById("reschedule_btn");
  const deleteScheduleBtn = document.getElementById("delete_schedule_btn");

  sendScheduleBtn.addEventListener("click", () => {
    sendMessageToBackground(campaign);
    // window.close();
  });

  rescheduleBtn.addEventListener("click", () => {
    chrome.storage.local.get(["scheduled_campaigns"], function (res) {
      const scheduledCampaigns = res.scheduled_campaigns || [];
      scheduledCampaigns.splice(index, 1);
      chrome.storage.local.set({ scheduled_campaigns: scheduledCampaigns });
      backgroundOverlay.hidden = true;
      document.body.removeChild(schedulePopupContainer);
      const schedule_checkbox = document.getElementById("schedule_checkbox");
      if (schedule_checkbox) {
        schedule_checkbox.checked = true;
        document.getElementById("schedule").hidden = false;
        document.getElementById("sender").hidden = true;
        document.querySelector("#schedule_day_div").style.display = "flex";
        document.querySelector("#schedule_time_div").style.display = "flex";
      }
    });
  });

  deleteScheduleBtn.addEventListener("click", () => {
    chrome.storage.local.get(["scheduled_campaigns"], function (res) {
      const scheduledCampaigns = res.scheduled_campaigns || [];
      scheduledCampaigns.splice(index, 1);
      chrome.storage.local.set({ scheduled_campaigns: scheduledCampaigns });
      backgroundOverlay.hidden = true;
      document.body.removeChild(schedulePopupContainer);
    });
  });
}

async function renderSelectedItems(nameFiltersString = "") {
  let isFirst = true;
  const items = messageToggleSwitchValue === "groups" ? allGroups : allContacts;

  const BATCH_SIZE = 100;
  let currentBatch = 0;

  const displayBoxClass = ".groups_display_box";
  const displayBox = document.querySelector(displayBoxClass);

  let selectedArray =
    messageToggleSwitchValue === "groups" ? groups_selected : contacts_selected;

  if (nameFiltersString.trim() !== "") {
    selectedArray = [];
    displayBox.innerHTML = "";
  } else if (selectedArray.length <= 1 || isFirst) {
    displayBox.innerHTML = "";
  }

  const nameFilters = nameFiltersString
    .split(",")
    .map((name) => name.trim().toLowerCase());

  const filteredItems =
    nameFilters.length > 0
      ? items.filter((item) =>
        nameFilters.some((filter) => item.name.toLowerCase() === filter)
      )
      : [];

  filteredItems.forEach((item) => {
    if (!selectedArray.includes(item.id._serialized)) {
      selectedArray.push(item.id._serialized);
    }
  });

  messageToggleSwitchValue === "groups"
    ? (groups_selected = selectedArray)
    : (contacts_selected = selectedArray);

  function renderBatch() {
    const fragment = document.createDocumentFragment();

    for (
      let i = currentBatch * BATCH_SIZE;
      i < Math.min(selectedArray.length, (currentBatch + 1) * BATCH_SIZE);
      i++
    ) {
      const itemId = selectedArray[i];
      const item = items.find((item) => item.id._serialized === itemId);

      if (!item) continue;

      const span = document.createElement("span");
      span.className = "group_tag CtaBtn";
      span.id = item.objId;
      span.setAttribute("data-id-field", item.id._serialized);

      span.innerHTML = `
                <span class="group">${item.name}</span>
                <button class="delete_group_tag" title="Remove ${messageToggleSwitchValue === "groups" ? "Group" : "Contact"}">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="12" height="12" x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1zm4.242 13.829a1 1 0 1 1-1.414 1.414L12 13.414l-2.828 2.829a1 1 0 0 1-1.414-1.414L10.586 12 7.758 9.171a1 1 0 1 1 1.414-1.414L12 10.586l2.828-2.829a1 1 0 1 1 1.414 1.414L13.414 12z" data-name="Layer 2" fill="#ff0000" opacity="1" data-original="#000000" class=""></path></g></svg>
                </button>
            `;

      fragment.appendChild(span);
    }

    displayBox.appendChild(fragment);
    currentBatch++;

    if (currentBatch * BATCH_SIZE < selectedArray.length) {
      requestAnimationFrame(renderBatch);
    }
  }

  requestAnimationFrame(renderBatch);

  chrome.storage.local.set({
    [messageToggleSwitchValue === "groups"
      ? "groups_selected"
      : "contacts_selected"]: selectedArray,
  });

  if (nameFilters.length > 0) handleDeleteBin();
}

function updateGroupBoxDisplay() {
  const boxLabel = document.querySelector("#box_label");
  const template_btn = document.querySelector("#campaign-save-icon-items");
  const displayBox = document.querySelector(".groups_display_box");
  const search = document.querySelector(".search_group_input");
  const boxName = document.querySelector(".selector-box-name");

  boxLabel.innerHTML = `Select ${messageToggleSwitchValue} to message`;
  template_btn.setAttribute(
    "title",
    `Save ${String(messageToggleSwitchValue).charAt(0).toUpperCase() +
    String(messageToggleSwitchValue).slice(1)
    }`
  );
  boxName.innerHTML = `Campaign ${String(messageToggleSwitchValue).charAt(0).toUpperCase() +
    String(messageToggleSwitchValue).slice(1)
    }`;
  search.placeholder = `Search ${messageToggleSwitchValue} by name`;
  displayBox.innerHTML = `<p style="font-size:13px;margin:0px;">Select ${messageToggleSwitchValue} to message</p>`;

  if (
    (messageToggleSwitchValue === "groups" && groups_selected.length > 0) ||
    (messageToggleSwitchValue === "contacts" && contacts_selected.length > 0)
  ) {
    renderSelectedItems();
  }
  handleDeleteBin();

  setTimeout(function () {
    updateGroupCount()
  }, 100)
  // handleTemplateSaveBtn()
  // handleCampaignBox()
}

function toggleSendMessageToInput(selectedValue) {
  messageToggleSwitchValue = selectedValue;

  chrome.storage.local.set({ send_messages_to: messageToggleSwitchValue });

  if (messageToggleSwitchValue === "numbers") {
    document.querySelector(".numbers-box").style.display = "revert";
    document.querySelector(".groups_box").style.display = "none";
    if (csv_data && csv_data.length > 0)
      document.querySelector(".customize_container").style.display = "flex";
  } else {
    document.querySelector(".numbers-box").style.display = "none";
    document.querySelector(".groups_box").style.display = "flex";
    // document.querySelector(".customize_container").style.display = "none";
    updateGroupBoxDisplay();
  }
}

function getTodayDate() {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();

  return yyyy + "-" + mm + "-" + dd;
}

function dateDiffInDays(date1, date2) {
  const [year1, month1, day1] = date1.split("-").map(Number);
  const [year2, month2, day2] = date2.split("-").map(Number);
  const d1 = new Date(year1, month1 - 1, day1);
  const d2 = new Date(year2, month2 - 1, day2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatToIsoDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

function convertCSVtoExcel(csvFile) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      complete: function (result) {
        try {
          const worksheet = XLSX.utils.json_to_sheet(result.data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
          const parsedData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: true,
          });
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      },
      header: true,
      error: function (error) {
        reject(error);
      },
    });
  });
}

// disable number and slider timegap input when random delay enabled
function disableNumberTimeGapInput(type = "random") {
  const sliderTimeGapSec = document.querySelector("#slider_time_gap_sec");
  const numberTimeInput = document.querySelector("#time_gap_sec");
  const randomLabelText = document.querySelector("#random_label_text");
  const shouldDisable = type == "sec" ? true : false;

  if (sliderTimeGapSec) sliderTimeGapSec.disabled = shouldDisable;
  if (numberTimeInput) numberTimeInput.disabled = shouldDisable;
  if (randomLabelText)
    randomLabelText.classList.toggle("text_color_gray", !shouldDisable);
}

async function handleFreeTrialExpiredUser(
  last_plan_type,
  plan_type,
  expiry_date
) {
  try {
    if (!last_plan_type || !plan_type || !expiry_date) {
      return { isFreeTrialExpiredUser: false, freeTrialExpiredUserData: {} };
    }
    if (last_plan_type == "FreeTrial" && plan_type == "Expired") {
      const daysDiff = dateDiffInDays(formatToIsoDate(new Date()), expiry_date);
      if (daysDiff >= freeTrialDuration2) {
        freeTrial6MonthsExpired = true;
        freeTrial3MonthsExpired = true;
      }
      if (daysDiff >= freeTrialDuration1) {
        freeTrial3MonthsExpired = true;
      }

      if (!freeTrial6MonthsExpired && !freeTrial3MonthsExpired) {
        return { isFreeTrialExpiredUser: false, freeTrialExpiredUserData: {} };
      }

      return new Promise((resolve, reject) => {
        chrome.storage.local.get(["freeTrialExpiredUserData"], function (res) {
          try {
            let freeTrialExpiredUserData = res.freeTrialExpiredUserData;
            if (!freeTrialExpiredUserData) {
              freeTrialExpiredUserData = {
                sent_count: 0,
                last_updated_date: formatToIsoDate(new Date()),
                total_count: freeTrial6MonthsExpired
                  ? freeTrialLimit2
                  : freeTrialLimit1,
              };
            } else if (
              freeTrialExpiredUserData.last_updated_date !=
              formatToIsoDate(new Date())
            ) {
              freeTrialExpiredUserData.sent_count = 0;
              freeTrialExpiredUserData.last_updated_date = formatToIsoDate(
                new Date()
              );
              freeTrialExpiredUserData.total_count = freeTrial6MonthsExpired
                ? freeTrialLimit2
                : freeTrialLimit1;
            }
            freeTrialExpiredUserData.total_count = freeTrial6MonthsExpired
              ? freeTrialLimit2
              : freeTrialLimit1;
            chrome.storage.local.set(
              { freeTrialExpiredUserData: freeTrialExpiredUserData },
              function () {
                resolve({
                  isFreeTrialExpiredUser: freeTrial3MonthsExpired,
                  freeTrialExpiredUserData,
                });
              }
            );
          } catch (error) {
            console.log("ERROR FROM handleFreeTrialExpiredUser", error);
            resolve({
              isFreeTrialExpiredUser: false,
              freeTrialExpiredUserData: {},
            });
          }
        });
      });
    } else {
      return { isFreeTrialExpiredUser: false, freeTrialExpiredUserData: {} };
    }
  } catch (error) {
    console.log("ERROR FROM handleFreeTrialExpiredUser", error);
    return { isFreeTrialExpiredUser: false, freeTrialExpiredUserData: {} };
  }
}

async function checkIfCanSendCampaign(campaignLength) {
  const { isFreeTrialExpiredUser, freeTrialExpiredUserData } =
    await handleFreeTrialExpiredUser(last_plan_type, plan_type, expiry_date);
  if (!isFreeTrialExpiredUser) {
    return true;
  }
  if (
    freeTrialExpiredUserData.sent_count + campaignLength <=
    freeTrialExpiredUserData.total_count
  ) {
    return true;
  } else {
    return false;
  }
}

async function showMessgesRemainingDiv(plan_type, last_plan_type, expiry_date) {
  let { isFreeTrialExpiredUser, freeTrialExpiredUserData } =
    await handleFreeTrialExpiredUser(last_plan_type, plan_type, expiry_date);
  if (!isFreeTrialExpiredUser) return;
  const messagesRemainingDiv = document.getElementById(
    "messages_remaining_count_div"
  );
  const messagesRemainingCount = document.getElementById(
    "messages_remaining_count"
  );
  if (messagesRemainingDiv) {
    messagesRemainingDiv.hidden = false;
    let totalCount = freeTrialExpiredUserData.total_count;
    let remainingCount = totalCount - freeTrialExpiredUserData.sent_count;
    messagesRemainingCount.innerText = remainingCount + "/" + totalCount;
  }
}

const tours = [
  { id: "use" },
  { id: "attachments" },
  { id: "group" },
  { id: "contact" },
  { id: "customize" },
  { id: "unsaved" },
];

function isFiveDaysPassed(lastDate, currentDate) {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const differenceInTime = current - last;
  const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
  return differenceInDays >= 5;
}

function getNextTour(callback) {
  chrome.storage.local.get(["tourState"], (result) => {
    const tourState = result.tourState || {
      currentTourIndex: 0,
      lastShownDate: null,
    };

    const currentDate = new Date().toISOString().split("T")[0];

    if (
      !tourState.lastShownDate ||
      isFiveDaysPassed(tourState.lastShownDate, currentDate)
    ) {
      const currentTour = tours[tourState.currentTourIndex];
      tourState.currentTourIndex =
        (tourState.currentTourIndex + 1) % tours.length;
      tourState.lastShownDate = currentDate;

      chrome.storage.local.set({ tourState }, () => {
        callback(currentTour, tourState.currentTourIndex - 1);
      });
    } else {
      chrome.storage.local.set({ tourState }, () => {
        callback(null);
      });
    }
  });
}

function highlightTour(tour, index) {
  let classes = "advance_options_container";
  let toursChild = Array.from(document.getElementById("tours").children);
  isTourRunning = true;
  document.getElementsByClassName(classes)[0].classList.add("blur_section");
  index > 2 || index === -1
    ? document.getElementsByClassName("more-btn")[0].click()
    : "";
  toursChild.forEach((tourChild) => {
    tourChild.classList.contains(tour.id)
      ? tourChild.classList.add("not_blur_child")
      : tourChild.classList.add("blur_section");
  });
}

function removeHighlightTour() {
  console.log(isTourRunning);
  if (isTourRunning) {
    let classes = "advance_options_container";
    let toursChild = Array.from(document.getElementById("tours").children);
    document
      .getElementsByClassName(classes)[0]
      .classList.remove("blur_section");
    toursChild.forEach((tourChild) => {
      tourChild.classList.contains("not_blur_child")
        ? tourChild.classList.remove("not_blur_child")
        : tourChild.classList.remove("blur_section");
    });
    isTourRunning = false;
  }
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

function handleShowTooltip() {
  const elements = [
    {
      query: ".formatting-toolbar",
      hoverElement: "#add-attachments",
      text: "Add an attachment",
      bottom: "-20px",
      right: "0px",
    },
    {
      query: ".template-box",
      hoverElement: "#template-save-icon",
      text: "Save template",
      bottom: "-30px",
    },
    {
      query: ".campaign-box",
      hoverElement: "#campaign-save-icon",
      text: "Save numbers",
      bottom: "-30px",
    },
    {
      query: ".upload_excel_box",
      hoverElement: ".upload_excel_box",
      text: "upload excel",
      bottom: "-35px",
    },
    {
      query: "#download_template",
      hoverElement: "#download_template",
      text: "Download template excel",
      bottom: "-35px",
      left: "20px",
    },
    {
      query: ".response-mode-toggle",
      hoverElement: ".response-mode-toggle",
      text: "Automatically reply to sender's last message",
      bottom: "-28px",
      left: "0px",
    },
    {
      query: ".generate-smart-reply-btn-container",
      hoverElement: ".generate-smart-reply-btn-container",
      text: "Reply for the last msg",
      bottom: "-28px",
      right: "0px",
    },
  ];
  for (let element of elements) {
    const parentElement = document.querySelector(element.query);
    const hoverElement = document.querySelector(element.hoverElement);
    if (parentElement && hoverElement) {
      hoverElement.addEventListener("mouseover", () => {
        showTooltip({
          elementParentClass: element.query,
          text: element.text,
          positionTop: element.top,
          positionLeft: element.left,
          positionRight: element.right,
          positionBottom: element.bottom,
        });
      });
      hoverElement.addEventListener("mouseout", () => {
        removeTooltip();
      });
    }
  }
}

// Auto-fill phone number from selected chat
window.handleChatSelection = function (phone) {
  if (phone && !isDirty) {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (normalizedPhone && normalizedPhone !== selectedChatPhone) {
      selectedChatPhone = normalizedPhone;
      updateNumberInput(normalizedPhone);
    }
  }
}

function normalizePhoneNumber(phone) {
  if (!phone) return '';

  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle different phone number formats
  if (cleaned.length === 10 && country_info && country_info.dial_code) {
    // Add country code for 10-digit numbers
    cleaned = country_info.dial_code + cleaned;
  } else if (cleaned.length > 10 && !cleaned.startsWith(country_info?.dial_code || '91')) {
    // If it's a long number but doesn't start with expected country code,
    // assume it already has a country code
    return cleaned;
  } else if (cleaned.length < 10) {
    // Too short to be a valid number
    return '';
  }

  return cleaned;
}

function updateNumberInput(phone) {
  const numbersInput = document.getElementById('numbers-input');
  if (numbersInput && !isDirty) {
    // Clear existing numbers first
    replaceNumbers('');

    // Add the new number
    numbersInput.value = phone;

    // Trigger the blur event to add number tags
    const event = new Event('blur', { bubbles: true });
    numbersInput.dispatchEvent(event);

    // Show a brief notification that number was auto-filled
    showAutoFillNotification();
  }
}

function showAutoFillNotification() {
  // Remove existing notification if any
  const existingNotification = document.querySelector('.auto-fill-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'auto-fill-notification';
  notification.textContent = '📱 Number auto-filled from selected chat';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #009A88;
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;

  // Add CSS animation
  if (!document.querySelector('#auto-fill-styles')) {
    const style = document.createElement('style');
    style.id = 'auto-fill-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 3000);
}

let lastCheckedChatId = '';

// Check for active chat changes periodically
function checkActiveChat() {
  if (isDirty) return;

  // Check if chrome extension context is still valid
  if (!chrome.runtime?.id) {
    return;
  }

  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        return; // Silently handle errors
      }

      if (tabs[0] && tabs[0].url.includes('web.whatsapp.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getChatArrays' }, (response) => {
          if (chrome.runtime.lastError) {
            return; // Silently handle message errors
          }

          if (response && response.success && response.data.activeChat) {
            const activeChat = response.data.activeChat;
            if (!activeChat.isGroup && activeChat.phone && activeChat.id !== lastCheckedChatId) {
              lastCheckedChatId = activeChat.id;
              window.handleChatSelection(activeChat.phone);
            }
          }
        });
      }
    });
  } catch (e) {
    // Silently handle extension context errors
    if (!e.message || (!e.message.includes('Extension context invalidated') &&
      !e.message.includes('message port closed'))) {
      console.warn('checkActiveChat error:', e.message);
    }
  }
}

// Start checking for active chat changes (reduced frequency)
setInterval(checkActiveChat, 5000); // Check every 5 seconds

// Scroll Down Indicator
$(document).ready(function () {
  const scrollIndicator = $('#scroll-down-indicator');
  const mainContent = $('.main-content');

  function checkScroll() {
    const scrollTop = $(window).scrollTop();
    const windowHeight = $(window).height();
    const docHeight = $(document).height();

    // Show indicator if there's more content below (more than 100px)
    if (docHeight - (scrollTop + windowHeight) > 100) {
      scrollIndicator.fadeIn(300);
    } else {
      scrollIndicator.fadeOut(300);
    }
  }

  // Check on scroll
  $(window).on('scroll', checkScroll);

  // Check on load
  setTimeout(checkScroll, 500);

  // Smooth scroll down on click
  scrollIndicator.on('click', function () {
    $('html, body').animate({
      scrollTop: $(window).scrollTop() + $(window).height() - 100
    }, 500);
  });
});

// Custom Popup js
async function updateCountryNumberCount() {
  const $countryNumCount = $('#custom__country-num-count');
  const getSelectedNum = await chrome.storage.local.get({ popup_numbers })
  const selectedNum = getSelectedNum.popup_numbers.split(',');
  const selectedNumArr = selectedNum.map(item => item.trim());

  const numberTagCount = selectedNumArr.length;

  $countryNumCount.text(numberTagCount);

  if (numberTagCount === 0 && $("#uploaded-csv").is(":visible")) {
    isDirty = false;
    $("#uploaded-csv").prop("hidden", true).text("")
  }

  console.log(`Total number tags found: ${numberTagCount}`);
}

async function updateGroupCount(e) {
  const $groupsNumCount = $('#groups-num-count');
  const getSelectedContact = await chrome.storage.local.get({ contacts_selected })
  const selectedContact = getSelectedContact.contacts_selected;
  const getSelectedGroup = await chrome.storage.local.get({ groups_selected })
  const selectedGroup = getSelectedGroup.groups_selected;

  // console.log('selectedGroup', getSelectedGroup)

  if (messageToggleSwitchValue === "groups") {
    const groupTagCount = selectedGroup.length;

    $groupsNumCount.text(groupTagCount);

    if (groupTagCount > 0) {
      $('.groups-num-count-container').css('display', 'flex')
    }
  }

  if (messageToggleSwitchValue === "contacts") {
    const contactTagCount = selectedContact.length;

    $groupsNumCount.text(contactTagCount);

    if (contactTagCount > 0) {
      $('.groups-num-count-container').css('display', 'flex')
    }
  }
}

// async function updateContactCount(e) {
//   const $groupsNumCount = $('#groups-num-count');
//   const getSelectedContact = await chrome.storage.local.get({ contacts_selected })
//   const selectedContact = getSelectedContact.contacts_selected;

//   console.log('selectedGroup', selectedContact)

//   const contactTagCount = selectedContact.length;

//   $groupsNumCount.text(contactTagCount);

//   if (contactTagCount > 0) {
//     $('.groups-num-count-container').css('display', 'flex')
//   }

//   console.log(`Total group tags found: ${contactTagCount}`);
// }
