const mediaSelectors = 'img, svg, video, iframe, embed';

// Function to remove filter from media elements
function disableMediaFilter() {
  document.querySelectorAll(mediaSelectors).forEach(el => {
    // Store original filter if not already stored
    if (!el.dataset.originalFilter) {
        // Check inline style first, then computed style for filters set via CSS
        let originalFilter = el.style.filter;
        if (!originalFilter || originalFilter === 'none') {
           const computedStyle = window.getComputedStyle(el);
           originalFilter = computedStyle.filter !== 'none' ? computedStyle.filter : 'none';
        }
         el.dataset.originalFilter = originalFilter;
    }
    // Apply 'filter: none !important'
    el.style.setProperty('filter', 'none', 'important');
    // Optional: Add a class to mark as modified
    el.classList.add('dark-mode-unfiltered');
  });
  console.log('Content script: Disabled filters for media elements.');
}

// Function to restore original filter to media elements
function restoreMediaFilter() {
  // Use a slight delay to ensure background script has removed the main CSS filter first
  setTimeout(() => {
    document.querySelectorAll(mediaSelectors + '.dark-mode-unfiltered').forEach(el => {
      // Restore original filter
      const originalFilter = el.dataset.originalFilter || 'none';
      if (originalFilter === 'none') {
          el.style.removeProperty('filter'); // Remove if original was none or only from CSS
      } else {
          // Try restoring original - !important might be lost if originally set via CSS,
          // but setProperty should handle inline !important correctly if it was there.
          // We won't add !important back if it wasn't originally inline.
           el.style.filter = originalFilter;
      }
      // Remove marker class
      el.classList.remove('dark-mode-unfiltered');
      // Clean up dataset attribute
      delete el.dataset.originalFilter;
    });
     console.log('Content script: Restored filters for media elements.');
  }, 50); // 50ms delay
}

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.command === 'applyDarkMode') {
    // Delay slightly to ensure CSS filter is likely applied first
    setTimeout(disableMediaFilter, 50);
  } else if (message.command === 'removeDarkMode') {
    restoreMediaFilter(); // Restore has its own internal delay
  }
});

// Initial check when the script loads
// Ask the background script if dark mode is currently enabled for this tab
browser.runtime.sendMessage({ command: 'queryState' }, response => {
    if (browser.runtime.lastError) {
        // Ignore errors like "Receiving end does not exist" which can happen
        // during page load or if the background script isn't ready yet.
        if (!browser.runtime.lastError.message.includes('Receiving end does not exist')) {
             console.error('Error querying state:', browser.runtime.lastError);
        }
        return;
    }
    if (response && response.darkModeEnabled) {
        console.log('Content script: Initial state is dark, disabling filters.');
        // Use setTimeout to ensure CSS has likely been applied
        setTimeout(disableMediaFilter, 150); // Slightly longer delay on initial load
    } else {
        console.log('Content script: Initial state is light.');
    }
});

console.log("Simple Dark Mode content script loaded."); // Log to confirm loading 