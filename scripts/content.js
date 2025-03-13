

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
    infoButton.style.backgroundColor = "transparent";
    infoButton.style.border = "none";
    infoButton.style.cursor = "pointer";
    infoButton.style.position = "absolute";
    infoButton.style.right = "7px";
    infoButton.style.top = "-50%";
    infoButton.style.transform = "translateY(-50%)";

    // Create image element for the icon
    const iconImg = document.createElement("img");
    iconImg.src = chrome.runtime.getURL("images/pig_48.png"); // load from extension
    iconImg.alt = "Info";
    iconImg.style.width = "20px";
    iconImg.style.height = "20px";
    iconImg.style.display = "block";

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
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center"; // Keeps the name centered
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";

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
    const buttonRect = button.getBoundingClientRect();
    const panelSize = 120; // Square panel (width = height)
    
    panel.style.top = `${buttonRect.top + window.scrollY - (panelSize / 2) + (buttonRect.height / 2)}px`;
    panel.style.left = `${buttonRect.left + window.scrollX - (panelSize / 2) + (buttonRect.width / 2)}px`;
  }

  //Create a new panel
  const panel = document.createElement("div");
  panel.id = "pigpanel-panel";
  panel.dataset.player = playerName;

  // Style the panel (inline for now, but can be moved to styles.css)
  panel.style.position = "absolute";
  panel.style.top = `${buttonRect.top + window.scrollY - (panelSize / 2) + (buttonRect.height / 2)}px`; // Center on button
  panel.style.left = `${buttonRect.left + window.scrollX - (panelSize / 2) + (buttonRect.width / 2)}px`; // Center on button
  panel.style.width = `${panelSize}px`;
  panel.style.height = `${panelSize}px`;
  panel.style.background = "rgba(255, 255, 255, 0)"; // Light transparency
  panel.style.border = "none";
  panel.style.borderRadius = "10px";
  panel.style.padding = "5px";
  panel.style.zIndex = "1000";
  panel.style.display = "grid";
  panel.style.gridTemplateColumns = "repeat(3, 1fr)";
  panel.style.gridTemplateRows = "repeat(3, 1fr)";
  panel.style.placeItems = "center";
  panel.style.gap = "5px";
  panel.style.pointerEvents = "none";

  positionPanel(panel); // ✅ Set initial position

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
    btn.innerText = btnData.label;
    btn.style.width = "30px";
    btn.style.height = "30px";
    btn.style.fontSize = "18px";
    btn.style.borderRadius = "50%";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.background = "#eee";
    btn.style.gridArea = btnData.gridArea;
    btn.style.pointerEvents = "auto"
    
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
