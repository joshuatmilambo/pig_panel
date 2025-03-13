console.log("✅ footywire-content.js is running!");

// Ensure the script runs only when FW is fully loaded
function runWhenReady() {
  if (document.readyState === "complete") {
    console.log("✅ FW page fully loaded!");
    startPlayerSelection();
  } else {
    console.log("⏳ FW page still loading... waiting...");
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "complete") {
        console.log("✅ FW page fully loaded on second check!");
        startPlayerSelection();
      }
    });
  }
}

function startPlayerSelection() {
  chrome.storage.local.get("selectedPlayerName", ({ selectedPlayerName }) => {
    if (!selectedPlayerName) {
      console.log("❌ No player name found in storage.");
      return;
    }

    console.log("✅ Retrieved player from storage:", selectedPlayerName);

    const nameParts = selectedPlayerName.trim().split(" ");
    const firstName = nameParts[0];
    const lastNames = nameParts.slice(1).join(" "); // Everything after the first space

    console.log(`🔹 First Name: ${firstName}`);
    console.log(`🔹 Last Name(s): ${lastNames}`);

    let observer;

    function waitForSearchBox(callback) {
      console.log("⏳ Waiting for search input field...");
      observer = new MutationObserver((mutations, obs) => {
        const nameInputs = document.querySelectorAll(".textinput"); // Replace with actual class name
        if (nameInputs.length >= 2) {
          console.log("✅ Search input fields found!");

          const firstNameInput = nameInputs[0]; // First input field
          const lastNameInput = nameInputs[1]; // Second input field

          obs.disconnect(); // Stop observing once the inputs appear
          callback(firstNameInput, lastNameInput);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForSearchBox((inputElement) => {
      observer.disconnect(); // ✅ Stop observing after input field is found

      firstNameInput.focus();
      firstNameInput.value = firstName;
      firstNameInput.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => {
        lastNameInput.focus();
        lastNameInput.value = lastNames;
        lastNameInput.dispatchEvent(new Event("input", { bubbles: true }));

        // ✅ Trigger search after entering last name
        triggerSearch();
      }, 300);  // Small delay to simulate typing
    });
  });
}

function triggerSearch() {
  const searchButton = document.querySelector(".button"); // Replace with actual selector

  if (searchButton) {
    console.log("✅ Clicking search button.");
    searchButton.click();
  } else {
    console.warn("⚠️ No search button found, trying Enter key.");
    const lastNameInput = document.querySelector(".textinput:last-of-type"); // Assuming last input triggers search
    if (lastNameInput) {
      lastNameInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      lastNameInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    }
  }

  // ✅ Wait for results to appear, then select first result
  setTimeout(() => {
    const playerLinks = Array.from(document.querySelectorAll("a")); // Select all links
    const selectedPlayer = lastNames + ", " + firstName; // Replace with dynamic player name

    const firstMatch = playerLinks.find(link => 
        link.innerText.trim().toLowerCase() === selectedPlayer.toLowerCase()
    );

    if (firstMatch) {
        console.log(`✅ Clicking result: ${firstMatch.innerText}`);
        firstMatch.click();
    } else {
        console.error("❌ No matching player found.");
    }
  }, 1000);
}

// Start the script when the page is ready
runWhenReady();