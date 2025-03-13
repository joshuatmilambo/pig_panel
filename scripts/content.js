

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

function showPlayerPanel(playerSection, button) {
  //Remove existing panel
  const existingPanel = document.getElementById("pigpanel-panel");
  if (existingPanel && existingPanel.dataset.player === playerSection.innerText) {
    existingPanel.remove();
    window.removeEventListener("scroll", updatePanelPosition);
    return;
  }

  const playerName = playerSection.innerText;

  // Get the button position to place panel beside it
  const buttonRect = button.getBoundingClientRect();
  const panelSize = 120;

  // Function to position the panel correctly
  function positionPanel(panel) {
    panel.style.top = `${buttonRect.top + window.scrollY - (panelSize / 2) + (buttonRect.height / 2)}px`;
    panel.style.left = `${buttonRect.left + window.scrollX - (panelSize / 2) + (buttonRect.width / 2)}px`;
  }

  //Create a new panel
  const panel = document.createElement("div");
  panel.id = "pigpanel-panel";
  panel.dataset.player = playerName;
  panel.className = "pigpanel-panel";
  positionPanel(panel);

  // ✅ Move panel on scroll
  function updatePanelPosition() {
      const existingPanel = document.getElementById("pigpanel-panel");
      if (existingPanel) {
          positionPanel(existingPanel);
      }
  }
  window.addEventListener("scroll", updatePanelPosition);

  // ✅ Detect if the player card's **parent** is changing (fix for flip issue)
  const parentElement = playerSection.parentNode;
  let closeTimeout;

  const observer = new MutationObserver((mutations) => {
    clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
        console.log("⚠️ Player card flipped! Closing panel.");
        panel.remove();
        observer.disconnect();
        window.removeEventListener("scroll", updatePanelPosition);
    }, 100);
  });

  if (parentElement) {
      observer.observe(parentElement, { attributes: true, childList: true, subtree: true });
  }

  const buttonData = [
    { label: "🔼", gridArea: "1 / 2" },  // Top-center
    { label: "F", gridArea: "1 / 3" },  // Top-right
    { label: "🐷", gridArea: "2 / 3", action: () => {
      console.log(`🐷 DFS Button Clicked! Searching for ${playerName}`);
      chrome.storage.local.set({ selectedPlayerName: playerName }, () => {
        console.log("✅ Player name stored in Chrome storage.");
        window.open("https://dfsaustralia.com/afl-fantasy-player-summary/", "_blank");
        })
      }
    },  // Center-right
    { label: "🔽", gridArea: "3 / 2" },  // Bottom-center
    { label: "N", gridArea: "3 / 3" }   // Bottom-right
  ];

  buttonData.forEach((btnData) => {
    const btn = document.createElement("button");
    btn.className = "pigpanel-panel-grid-btn"
    btn.innerText = btnData.label;
    btn.style.gridArea = btnData.gridArea;
    
    // Assign custom action for each button
    btn.addEventListener("click", () => {
      console.log(`Clicked button: ${btnData.label}`);
      if (btnData.action) {  // ✅ Prevents errors for buttons without actions
        btnData.action();
      }
      panel.remove(); // Close panel after clicking
      observer.disconnect(); // Stop observing
      window.removeEventListener("scroll", updatePanelPosition);
    });

    panel.appendChild(btn);
    
  });

  document.body.appendChild(panel);

  // ✅ Close the panel when clicking outside of it
  setTimeout(() => {
      document.addEventListener("click", (event) => {
          if (!panel.contains(event.target) && event.target !== button) {
              panel.remove();
              observer.disconnect(); // Stop observing
              window.removeEventListener("scroll", updatePanelPosition);
          }
      }, { once: true });
  }, 50);

}
