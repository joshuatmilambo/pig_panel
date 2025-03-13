console.log("✅ dfs-content.js is running!");

// Ensure the script runs only when DFS is fully loaded
function runWhenReady() {
  if (document.readyState === "complete") {
    console.log("✅ DFS page fully loaded!");
    startPlayerSelection();
  } else {
    console.log("⏳ DFS page still loading... waiting...");
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "complete") {
        console.log("✅ DFS page fully loaded on second check!");
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

    let observer; // Store observer reference so we can disconnect it

    function waitForSearchBox(callback) {
      console.log("⏳ Waiting for search input field...");
      observer = new MutationObserver((mutations, obs) => {
        const inputElement = document.querySelector("#selectPlayer-ts-control");
        if (inputElement) {
          console.log("✅ Search input field found!");
          obs.disconnect(); // Stop observing once the input appears
          callback(inputElement);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForSearchBox((inputElement) => {
      observer.disconnect(); // ✅ Stop observing after input field is found
      inputElement.focus();
      inputElement.value = selectedPlayerName; // ✅ Directly set full name

      // ✅ Trigger real events so DFS processes the change
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));
      console.log("✅ Full name pasted into search box!");

      setTimeout(() => {
        // Step 3: Click the highlighted player option
        const activeOption = document.querySelector(".ts-dropdown-content .option.active");
        console.log("🔍 Found active option:", activeOption);

        if (activeOption) {
          console.log("✅ Clicking active option:", activeOption.innerText);
          activeOption.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          activeOption.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          activeOption.dispatchEvent(new MouseEvent("click", { bubbles: true }));

          // ✅ Prevent looping by clearing storage after selection
          chrome.storage.local.remove("selectedPlayerName", () => {
            console.log("🛑 Removed player name from storage to stop looping.");
          });
        } else {
          console.error("❌ No active player found in dropdown.");
        }
      }, 500);
    });
  });
}

// Run the function when DFS is fully ready
runWhenReady();