const toggle = document.getElementById("darkModeToggle");

chrome.storage.sync.get("darkMode", ({ darkMode }) => {
  toggle.checked = darkMode;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ darkMode: toggle.checked });
});