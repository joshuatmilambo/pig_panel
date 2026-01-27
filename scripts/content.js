let playersData = null; // Global variable to store loaded player data

async function fetchPlayersData() {
  if (playersData) return playersData; // If already loaded, return it

  // Need to sanitise
  const response = await fetch("https://fantasy.afl.com.au/json/fantasy/players.json");
  playersData = await response.json();
  console.log("Player data loaded!");
  return playersData;
}

// Load the players data **ONCE** when the page loads
window.addEventListener("load", async () => {
  await fetchPlayersData();
});

// Wait for page to load
window.addEventListener("load", () => {
  setTimeout(() => {
    injectInfoButtons();
    observeDynamicChanges();
  }, 1000);
});

function injectInfoButtons() {
  // Select all player sections
  const playerSectionsIn = document.querySelectorAll('div[aria-label="Player information"]');
  const playerSectionsOut = document.querySelectorAll('[role="gridcell"]');
  const playerSections = [...playerSectionsIn, ...playerSectionsOut];

  const listViewBtn = document.querySelector('button[aria-label="select list view"]');

  const isListView = listViewBtn && listViewBtn.style.background.includes("var(--color-tertiary-light-sky)");

  playerSections.forEach((playerSection) => {
    // Avoid duplicate buttons
    const existingInTeamButton = playerSection.querySelector(".pigpanel-info-btn-inTeam");
    const existingOutTeamButton = playerSection.querySelector(".pigpanel-info-btn-outTeam");

    if (existingInTeamButton) existingInTeamButton.remove();
    if (existingOutTeamButton) existingOutTeamButton.remove();

    // Create the info button
    const infoButton = document.createElement("button");
    // Set classnames for CSS
    if (playerSection.matches('[aria-label*="Player information"]')) {
      if (isListView) {
        infoButton.className = "pigpanel-info-btn-inTeam pigpanel-rowview"; // List view
      } else {
        infoButton.className = "pigpanel-info-btn-inTeam pigpanel-cardview"; // Oval view
      }
    } else {
      infoButton.className = "pigpanel-info-btn-outTeam"; // Out Team
    }

    // Create image element for the icon
    const iconImg = document.createElement("img");
    iconImg.className = "pigpanel-info-btn-icon"
    iconImg.src = chrome.runtime.getURL("images/pig_48.png"); // load from extension
    iconImg.alt = "Info";

    // Append image to button
    infoButton.appendChild(iconImg);

    // Add click event listener
    infoButton.addEventListener("click", (event) => {
      event.stopPropagation();

      const existingPanel = document.getElementById("pigpanel-panel");

      // If panel exists, remove it
      if (existingPanel) {
        cleanupPanel(existingPanel);
        return; //Exit function early if panel existed
      }
      // Otherwise, open the new panel
      showPlayerPanel(playerSection, infoButton);
    });

    // Place buttons in the correct position
    if (!playerSection) {
      console.warn("Element not found for:", playerSection);
    } else {
      playerSection.appendChild(infoButton);
    }
  });
}

function observeDynamicChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldInject = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        shouldInject = true;
        break;
      }
    }

    if (shouldInject) {
      // Disconnect observer before injecting buttons
      observer.disconnect();
      
      // Ensure buttons are not removed before reinjection
      injectInfoButtons();

      // Reconnect observer immediately after injection
      observeDynamicChanges();
    }
  });

  // Start observing body for changes
  observer.observe(document.body, { childList: true, subtree: true });
}

function showPlayerPanel(playerSection, button) {
  // Remove existing panel
  const existingPanel = document.getElementById("pigpanel-panel");
  if (existingPanel && existingPanel.dataset.player === playerSection.innerText) {
    cleanupPanel(existingPanel, observer)
    return;
  }

  let playerName; // Declare playerName before the if statement
  let lines;
  if (button.className == "pigpanel-info-btn-inTeam pigpanel-cardview") {
    lines = playerSection.innerText.split("\n"); // Split by new lines
    console.log("InCard: " + lines);
    playerName = confirmFullName(lines[0].trim(), lines[6]);
  } else {
    lines = playerSection.innerText.split("\n"); // Split by new lines
    console.log("InRow: " + lines);
    playerName = confirmFullName(lines[0].trim(), lines[3]);
  }

  // Create a new panel
  const panel = document.createElement("div");
  panel.id = "pigpanel-panel";
  panel.dataset.player = playerName;
  panel.className = "pigpanel-panel";
  updatePanelPosition(button, panel);

  window.addEventListener("scroll", updatePanelPosition);

  const parentElement = playerSection.parentNode;
  let parentObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
          // Ignore text changes
          if (mutation.type === "characterData") continue;
          
          // Check if the element is actually being removed
          if (mutation.removedNodes.length > 0 && [...mutation.removedNodes].includes(playerSection)) {
              console.log("Player card removed! Closing panel.");
              cleanupPanel(panel, parentObserver);
              return;
          }
  
          // Ignore non-relevant mutations
          if (mutation.type === "attributes" && mutation.attributeName !== "class") continue;
  
          console.log("Significant player card change detected! Closing panel.");
          cleanupPanel(panel, parentObserver);
          return; // Exit to avoid unnecessary checks
      }
  });

  const buttonData = [
    { 
      imgSrc: "images/dfs.png", gridArea: "1 / 3", // Bottom-right
      action: () => {
      console.log(`DFS Button Clicked! Searching for ${playerName}`);
      chrome.storage.local.set({ selectedPlayerName: playerName }, () => {
        console.log("Player name stored in Chrome storage.");
        window.open("https://dfsaustralia.com/afl-fantasy-player-summary/?playerId=CD_I293222", "_blank");
        })
      }
    },
    {
      imgSrc: "images/footywire.png", gridArea: "3 / 3", 
      action: () => {
        console.log(`FW Button Clicked! Searching for ${playerName}`);
    
        chrome.storage.local.set({ selectedPlayerName: playerName }, () => {
          console.log("Player name stored in Chrome storage.");
          
          const nameParts = playerName.trim().split(" ");
          const firstName = nameParts[0];
          const lastNames = nameParts.slice(1).join("+"); // Convert spaces in last name to `+`
    
          const searchUrl = `https://www.footywire.com/afl/footy/player_search?fn=${firstName}&ln=${lastNames}`;
          console.log(`🔗 Redirecting to: ${searchUrl}`);
    
          window.open(searchUrl, "_blank");
        });
      }
    }
  ];

  buttonData.forEach((btnData, index) => {
    if (!btnData.label && !btnData.imgSrc) {
        console.warn(`Skipping button at ${btnData.gridArea || index} - Missing label and imgSrc`);
        return;
    }

    const btn = document.createElement("button");
    btn.className = "pigpanel-panel-grid-btn";
    btn.style.gridArea = btnData.gridArea;

    // Use image as provided
    if (btnData.imgSrc) {
        const img = document.createElement("img");
        img.src = chrome.runtime.getURL(btnData.imgSrc);  // Load image from extension
        img.alt = btnData.label || "Icon";
        img.className = "pigpanel-grid-btn-icon";  // Use CSS class for styling
        btn.appendChild(img);
    } else if (btnData.label) {
        btn.innerText = btnData.label;
    }

    // Assign custom action for each button
    btn.addEventListener("click", () => {
        console.log(`Clicked button: ${btnData.label || btnData.imgSrc || "Unknown"}`);
  
        if (btnData.action) {
            try {
                btnData.action();
            } catch (error) {
                console.error(`Error executing action for ${btnData.label || btnData.imgSrc}:`, error);
            }
        }
  
        cleanupPanel(panel, parentObserver)
    });

    panel.appendChild(btn); 
  });

  document.body.appendChild(panel);

  document.addEventListener("click", (event) => {
    const panel = document.getElementById("pigpanel-panel");
    if (panel && !panel.contains(event.target) && event.target !== button) {
      cleanupPanel(panel);
    }
  });

}

//Helper functions
function cleanupPanel(panel, observer) {
  if (panel) panel.remove();
  if (observer) observer.disconnect();
  window.removeEventListener("scroll", updatePanelPosition);
}

function updatePanelPosition(button, panel) {
  if (!panel || !button) return; // Exit if panel or button doesn't exist

  const buttonRect = button.getBoundingClientRect();
  const panelSize = 100;
  panel.style.top = `${buttonRect.top + window.scrollY - (panelSize / 2) + (buttonRect.height / 2)}px`;
  panel.style.left = `${buttonRect.left + window.scrollX - (panelSize / 2) + (buttonRect.width / 2)}px`;
}

function confirmFullName(playerText, playerPriceText) {
  if (!playersData) {
    console.error("Player data not loaded yet.");
    return null;
  }

  // Extract first initial & last name
  const nameParts = playerText.trim().split(" ");
  if (nameParts.length !== 2 || !nameParts[0].endsWith(".")) {
    console.error(`Invalid player format: "${playerText}"`);
    return null;
  }

  const firstInitial = nameParts[0][0]; // "R"
  const playerLastName = nameParts[1]; // "Marshall"

  const regexPrice = playerPriceText.match(/([\d.]+)([MK])/i);

  let uiPrice = 0;
  if (regexPrice) {
    const number = parseFloat(regexPrice[1]);
    const unit = regexPrice[2].toUpperCase();
  
    if (unit === "M") {
      uiPrice = number * 1_000_000;
    } else if (unit === "K") {
      uiPrice = number * 1_000;
    }
  }

  console.log(`Searching for: ${firstInitial}. ${playerLastName}, Price: ${uiPrice}`);
  
  // LOG all players with matching last name BEFORE filtering further
  const potentialMatches = Object.values(playersData).filter(player => 
    player.lastName.toLowerCase() === playerLastName.toLowerCase()
  );

  console.log(`Found ${potentialMatches.length} players with last name '${playerLastName}':`, potentialMatches);

  // Find exact match using `.find()`
  const match = potentialMatches.find(player => 
    player.firstName.charAt(0).toLowerCase() === firstInitial.toLowerCase() &&
    Math.abs(player.price - uiPrice) <= 1000
  );

  if (match) {
    const fullName = `${match.firstName} ${match.lastName}`;
    console.log(`Search Complete: ${fullName} (ID: ${match.id}, Price: ${match.price})`);
    return fullName; // Ensure it's a string
  } else {
    console.error(`No exact match found.`);
    return "Unknown Player"; // Return a fallback string
  }
}