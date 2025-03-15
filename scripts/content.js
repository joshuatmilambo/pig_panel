

//wait for page to load
window.addEventListener("load", () => {
  setTimeout(() => {
    injectInfoButtons();
    observeDynamicChanges();
  }, 1000);
});

function injectInfoButtons() {
  //select all player sections
  const playerSections = document.querySelectorAll("div[class*='sc-erIqft']");

  playerSections.forEach((playerSection) => {
    //Avoid adding duplicate buttons
    if (playerSection.closest('.pigpanel-wrapper')) return;

    //create the info button
    const infoButton = document.createElement("button");
    infoButton.className = "pigpanel-info-btn";

    // Create image element for the icon
    const iconImg = document.createElement("img");
    iconImg.className = "pigpanel-info-btn-icon"
    iconImg.src = chrome.runtime.getURL("images/pig_48.png"); // load from extension
    iconImg.alt = "Info";

    // Append image to button
    infoButton.appendChild(iconImg);

    //Add click event listener
    infoButton.addEventListener("click", (event) => {
      event.stopPropagation();

      const existingPanel = document.getElementById("pigpanel-panel");
    
      // Check if panel already exists and is for the same player
      if (existingPanel && existingPanel.dataset.player === playerSection.innerText) {
        existingPanel.remove();  // ✅ Close if same player is clicked again
        window.removeEventListener("scroll", updatePanelPosition);
      } else {
          showPlayerPanel(playerSection, infoButton);  // ✅ Otherwise, show new panel
      }
    });

    const wrapper = document.createElement('div');
    wrapper.className = "pigpanel-wrapper";

    // Insert wrapper and move elements inside
    playerSection.parentNode.insertBefore(wrapper, playerSection);
    wrapper.appendChild(playerSection);
    wrapper.appendChild(infoButton);
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
      // ✅ Disconnect observer before injecting buttons
      observer.disconnect();
      injectInfoButtons();

      // ✅ Reconnect observer only if elements are still being added
      setTimeout(() => {
        if (document.body) {
          observeDynamicChanges();
        }
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function cleanupPanel(panel, observer) {
  if (panel) panel.remove();
  if (observer) observer.disconnect();
  window.removeEventListener("scroll", updatePanelPosition);
}

function updatePanelPosition(button, panel) {
  if (!panel || !button) return; // ✅ Exit if panel or button doesn't exist

  const buttonRect = button.getBoundingClientRect();
  const panelSize = 120;
  panel.style.top = `${buttonRect.top + window.scrollY - (panelSize / 2) + (buttonRect.height / 2)}px`;
  panel.style.left = `${buttonRect.left + window.scrollX - (panelSize / 2) + (buttonRect.width / 2)}px`;
}

function showPlayerPanel(playerSection, button) {
  //Remove existing panel
  const existingPanel = document.getElementById("pigpanel-panel");
  if (existingPanel && existingPanel.dataset.player === playerSection.innerText) {
    cleanupPanel(existingPanel, observer)
    return;
  }

  const playerName = playerSection.innerText;

  //Create a new panel
  const panel = document.createElement("div");
  panel.id = "pigpanel-panel";
  panel.dataset.player = playerName;
  panel.className = "pigpanel-panel";
  updatePanelPosition(button, panel);

  window.addEventListener("scroll", updatePanelPosition);

// ✅ Detect if the player card's **parent** is changing (fix for flip issue)
const parentElement = playerSection.parentNode;
let parentObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === "attributes" || mutation.type === "childList") {
            console.log("⚠️ Player card flipped or modified! Closing panel.");
            cleanupPanel(panel, parentObserver)
            return; // Exit to avoid unnecessary checks
        }
    }
});

if (parentElement) {
    parentObserver.observe(parentElement, { attributes: true, childList: true, subtree: true });
}

  const buttonData = [
    { 
      imgSrc: "images/dfs.png", gridArea: "1 / 2", // Bottom-right
      action: () => {
      console.log(`DFS Button Clicked! Searching for ${playerName}`);
      chrome.storage.local.set({ selectedPlayerName: playerName }, () => {
        console.log("✅ Player name stored in Chrome storage.");
        window.open("https://dfsaustralia.com/afl-fantasy-player-summary/", "_blank");
        })
      }
    },
    {
      imgSrc: "images/footywire.png", gridArea: "3 / 2", 
      action: () => {
        console.log(`FW Button Clicked! Searching for ${playerName}`);
    
        chrome.storage.local.set({ selectedPlayerName: playerName }, () => {
          console.log("✅ Player name stored in Chrome storage.");
          
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
        console.warn(`⚠️ Skipping button at ${btnData.gridArea || index} - Missing label and imgSrc`);
        return;
    }

    const btn = document.createElement("button");
    btn.className = "pigpanel-panel-grid-btn";
    btn.style.gridArea = btnData.gridArea;

    // ✅ If an image is provided, use an <img> instead of text
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
        console.log(`🟢 Clicked button: ${btnData.label || btnData.imgSrc || "Unknown"}`);
  
        if (btnData.action) {
            try {
                btnData.action();
            } catch (error) {
                console.error(`❌ Error executing action for ${btnData.label || btnData.imgSrc}:`, error);
            }
        }
  
        cleanupPanel(panel, parentObserver)
    });

    panel.appendChild(btn); 
  });

  document.body.appendChild(panel);

  // ✅ Close the panel when clicking outside of it
  setTimeout(() => {
      document.addEventListener("click", (event) => {
          if (!panel.contains(event.target) && event.target !== button) {
            cleanupPanel(panel, parentObserver)
          }
      }, { once: true });
  }, 50);

}
