console.log("✅ footywire-content.js is running!");

// ✅ Detect if on the correct search page
function runWhenReady() {
  const currentUrl = window.location.href;
  console.log(`🌐 Current URL: ${currentUrl}`);

  if (/\/player_search\/?$/.test(currentUrl)) {
    console.log("🔍 On player search page. Starting selection...");
    startPlayerSelection();
  } else {
    console.log("⚠️ Not on the correct player search page. No action taken.");
  }
}

// ✅ Fill in search fields and press Enter to search
function startPlayerSelection() {
  chrome.storage.local.get("selectedPlayerName", ({ selectedPlayerName }) => {
    if (!selectedPlayerName) {
      console.log("❌ No player name found in storage.");
      return;
    }

    console.log(`✅ Retrieved player: ${selectedPlayerName}`);

    const nameParts = selectedPlayerName.trim().split(" ");
    const firstName = nameParts[0];
    const lastNames = nameParts.slice(1).join(" "); // Everything after the first space

    console.log(`🔹 First Name: ${firstName}`);
    console.log(`🔹 Last Name(s): ${lastNames}`);

    waitForSearchBoxes((firstNameInput, lastNameInput) => {
      console.log("✅ Filling in search fields...");

      firstNameInput.focus();
      firstNameInput.value = firstName;
      firstNameInput.dispatchEvent(new Event("input", { bubbles: true }));

      setTimeout(() => {
        lastNameInput.focus();
        lastNameInput.value = lastNames;
        lastNameInput.dispatchEvent(new Event("input", { bubbles: true }));

        console.log("✅ Name entered. Pressing Enter to search...");

        setTimeout(() => {
          triggerSearchWithEnter(lastNameInput);
        }, 500); // Small delay before pressing Enter
      }, 500);
    });
  });
}

// ✅ Wait for search input fields to appear
function waitForSearchBoxes(callback) {
  console.log("⏳ Waiting for search input fields...");

  function checkInputs() {
    const firstNameInput = document.querySelector("input[name='fn']");
    const lastNameInput = document.querySelector("input[name='ln']");
    
    if (firstNameInput && lastNameInput) {
      console.log("✅ Search input fields found!");
      callback(firstNameInput, lastNameInput);
      return true;
    }
    return false;
  }

  if (checkInputs()) return;

  console.log("👀 Watching for input fields...");
  const observer = new MutationObserver(() => {
    if (checkInputs()) observer.disconnect();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ✅ Press Enter key on the Last Name input field
function triggerSearchWithEnter(lastNameInput) {
  console.log("🔎 Pressing Enter to trigger search...");

  lastNameInput.focus();
  lastNameInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  lastNameInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
}

// ✅ Start script when page is ready
runWhenReady();