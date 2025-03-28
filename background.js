const CSS = "dark-mode.css";

// Function to apply dark mode CSS and notify content script
async function applyDarkMode(tabId) {
  try {
    await browser.scripting.insertCSS({
      target: { tabId: tabId },
      files: [CSS]
    });
    // Send message to content script AFTER CSS is inserted
    await browser.tabs.sendMessage(tabId, { command: 'applyDarkMode' });
    console.log("Dark mode CSS applied and content script notified for tab:", tabId);
  } catch (err) {
    // Avoid logging errors when the tab context is invalid (e.g., during navigation)
    if (!err.message.includes('Invalid tab ID') && !err.message.includes('Receiving end does not exist')) {
        console.error(`Failed to apply dark mode or notify content script: ${err}`);
    }
  }
}

// Function to remove dark mode CSS and notify content script
async function removeDarkMode(tabId) {
  try {
    // Send message to content script BEFORE removing CSS
    await browser.tabs.sendMessage(tabId, { command: 'removeDarkMode' });
    await browser.scripting.removeCSS({
      target: { tabId: tabId },
      files: [CSS]
    });
    console.log("Dark mode CSS removed and content script notified for tab:", tabId);
  } catch (err) {
    // Avoid logging errors when the tab context is invalid (e.g., during navigation)
     if (!err.message.includes('Invalid tab ID') && !err.message.includes('Receiving end does not exist')) {
        console.error(`Failed to remove dark mode or notify content script: ${err}`);
     }
  }
}

// Function to update dark mode based on stored state
async function updateTabDarkMode(tabId) {
   const result = await browser.storage.local.get('darkModeEnabled');
   const enabled = !!result.darkModeEnabled;
   console.log(`Updating tab ${tabId}. Dark mode enabled: ${enabled}`);
   if (enabled) {
     await applyDarkMode(tabId);
   } else {
     await removeDarkMode(tabId);
   }
}

// Listener for messages from popup and content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle toggle from popup
  if (message.command === "toggle") {
    console.log("Toggle command received");
    (async () => { // Use async IIFE for await
        const result = await browser.storage.local.get('darkModeEnabled');
        const newState = !result.darkModeEnabled;
        await browser.storage.local.set({ darkModeEnabled: newState });
        console.log("Dark mode state saved:", newState);

        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (currentTab && currentTab.id) {
            if (newState) {
                await applyDarkMode(currentTab.id);
            } else {
                await removeDarkMode(currentTab.id);
            }
        }
    })();
    return true; // Indicate async response (optional but good practice)
  }

  // Handle state query from content script
  if (message.command === "queryState") {
    console.log("State query received from tab:", sender.tab?.id);
    (async () => { // Use async IIFE for await
        const result = await browser.storage.local.get('darkModeEnabled');
        sendResponse({ darkModeEnabled: !!result.darkModeEnabled });
    })();
    return true; // Indicate that we will send a response asynchronously
  }

  // Default: Handle other messages or ignore
  // return false; // Or nothing, if no other messages expected
});

// Apply/Remove dark mode when a tab finishes loading or URL changes
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Ensure the page is loaded and it's a relevant URL (http/https)
    // 'complete' status is often best, but 'loading' can work if CSS injection is fast
    if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
        console.log(`Tab ${tabId} updated to status: ${changeInfo.status}, URL: ${tab.url}`);
        await updateTabDarkMode(tabId);
    }
});

// Initial setup when the extension is installed/updated
browser.runtime.onInstalled.addListener(() => {
  // Set default state to disabled
  browser.storage.local.get('darkModeEnabled', (result) => {
      if (result.darkModeEnabled === undefined) {
          browser.storage.local.set({ darkModeEnabled: false });
          console.log("Initialized dark mode state to false.");
      }
  });
}); 