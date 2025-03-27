const toggleButton = document.getElementById('toggleButton');

// Get the current state when the popup opens and update the button text (optional)
browser.storage.local.get('darkModeEnabled').then(result => {
  // You could update the button text or style based on result.darkModeEnabled
  console.log('Popup opened. Dark mode enabled:', !!result.darkModeEnabled);
});

// Add click listener to the button
toggleButton.addEventListener('click', async () => {
  try {
    // Send a message to the background script to toggle dark mode
    await browser.runtime.sendMessage({ command: "toggle" });
    // Optionally, give feedback or close the popup
    // window.close(); // Uncomment to close popup after clicking
  } catch (error) {
    console.error("Error sending toggle message:", error);
  }
}); 