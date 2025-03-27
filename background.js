const CSS = "dark-mode.css";

// Function to apply dark mode CSS
async function applyDarkMode(tabId) {
  try {
    await browser.scripting.insertCSS({
      target: { tabId: tabId },
      files: [CSS]
    });
    console.log("Dark mode CSS applied to tab:", tabId);
  } catch (err) {
    console.error(`Failed to insert CSS: ${err}`);
  }
}

// Function to remove dark mode CSS
async function removeDarkMode(tabId) {
  try {
    await browser.scripting.removeCSS({
      target: { tabId: tabId },
      files: [CSS]
    });
     console.log("Dark mode CSS removed from tab:", tabId);
  } catch (err) {
    console.error(`Failed to remove CSS: ${err}`);
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


// Listener for messages from the popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.command === "toggle") {
    console.log("Toggle command received");
    // 1. Get current state
    const result = await browser.storage.local.get('darkModeEnabled');
    const newState = !result.darkModeEnabled;

    // 2. Save new state
    await browser.storage.local.set({ darkModeEnabled: newState });
    console.log("Dark mode state saved:", newState);

    // 3. Update the current tab
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (currentTab && currentTab.id) {
        if (newState) {
            await applyDarkMode(currentTab.id);
        } else {
            await removeDarkMode(currentTab.id);
        }
    }
  }
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