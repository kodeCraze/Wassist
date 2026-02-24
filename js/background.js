// Background script for side panel functionality and auto-logout

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Content scripts are automatically injected via manifest
// This function is kept for compatibility but does nothing
async function ensureWhatsAppContentInjected() {
  console.log('Content scripts are handled by manifest');
}

// Extension lifecycle event handlers
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  chrome.runtime.setUninstallURL("https://www.google.com");

  // Clear session on install/update/enable
  if (details.reason === 'install' || details.reason === 'update' || details.reason === 'enable') {
    chrome.storage.session.clear();
    chrome.alarms.clear('autoLogout');
  }
  await ensureWhatsAppContentInjected();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started - clearing session');
  chrome.storage.session.clear();
  chrome.alarms.clear('autoLogout');
  await ensureWhatsAppContentInjected();
});

chrome.action.onClicked.addListener(async () => {
  await ensureWhatsAppContentInjected();
});

// Handle 24-hour auto-logout alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoLogout') {
    console.log('24-hour auto-logout triggered');
    performAutoLogout();
  }
});

// Auto-logout function
async function performAutoLogout() {
  const keysToRemove = [
    'authenticated',
    'csrf_token',
    'logout_token',
    'user_email',
    'user_data',
    'session_timestamp'
  ];

  try {
    console.log('Session cleared');
    await chrome.storage.local.remove(keysToRemove);
    chrome.alarms.clear('autoLogout');
    console.log('Auth data cleared successfully!');
  } catch (error) {
    console.log('Logout attempt failed:', error);
  }
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SET_LOGOUT_ALARM') {
    // Set 24-hour alarm
    chrome.alarms.create('autoLogout', { delayInMinutes: 7 * 24 * 60 });
    console.log('24-hour logout alarm set');
  }

  if (request.type === 'CLEAR_LOGOUT_ALARM') {
    chrome.alarms.clear('autoLogout');
    console.log('Logout alarm cleared');
  }

  if (request.type === 'ENSURE_CONTENT_INJECTED') {
    ensureWhatsAppContentInjected();
    sendResponse({ success: true });
  }

  if (request.type === "send_notification") {
    if (String(request.title || "").trim().toLowerCase() === "your messages are sent") {
      console.log("Notification blocked to avoid spam");
      chrome.storage.local.remove("attachmentsData");
      chrome.runtime.sendMessage({ from: "bg", type: "CLEAR_ATTACHMENTS" });
    }
  }

  // AI SMART_REPLIES handler removed

  if (request?.type === 'TRANSLATE_TEXT') {
    (async () => {
      try {
        const { q, sl = 'auto', tl } = request;
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(q)}`;

        const res = await fetch(url);
        const data = await res.json();
        const detected = data?.[2] || sl;
        const translated = (data?.[0] || []).map(row => row?.[0]).join(' ');

        sendResponse({ ok: true, detected, translated });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }
});

const readyTabs = new Set();

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "CONTENT_READY" && sender.tab?.id) {
    readyTabs.add(sender.tab.id);
  }
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading") readyTabs.delete(tabId);
});