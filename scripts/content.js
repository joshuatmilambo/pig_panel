

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
          existingPanel.remove();  // Close if same player is clicked again
        } else {
          showPlayerPanel(playerSection.innerText);  // Otherwise, show new panel
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
      // Disconnect observer temporarily to avoid recursive calls
      observer.disconnect();

      // Safely inject buttons
      injectInfoButtons();

      // Reconnect observer after brief delay
      setTimeout(() => {
        observeDynamicChanges();
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function showPlayerPanel(playerName) {
  //Remove existing panel
  const existingPanel = document.getElementById("pigpanel-panel");
  if (existingPanel) existingPanel.remove();

  const dfsUrl = "https://dfsaustralia.com/afl-fantasy-player-summary"; // DFS URL

  //Create a new panel
  const panel = document.createElement("div");
    panel.id = "pigpanel-panel";
    panel.dataset.player = playerName;
    panel.innerHTML = `
        <div class="pigpanel-header">
            <h3>${playerName}</h3>
            <button id="pigpanel-close">❌</button>
        </div>
        <div class="pigpanel-content">
            <p>Loading data for ${playerName}...</p>
            <a href="${dfsUrl}" target="_blank" class="dfs-link">View DFS Stats</a>
        </div>
    `;
    // Style the panel (inline for now, but can be moved to styles.css)
    panel.style.position = "fixed";
    panel.style.top = "50px";
    panel.style.right = "20px";
    panel.style.width = "300px";
    panel.style.background = "#fff";
    panel.style.border = "1px solid #ccc";
    panel.style.padding = "10px";
    panel.style.zIndex = "1000";
    panel.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.2)";

    document.body.appendChild(panel);

    // ✅ Now safely select the close button AFTER the panel is added
    const closeButton = document.getElementById("pigpanel-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        panel.remove();
      });
    } else {
      console.error("Close button not found!");
    }
  
    // ✅ Store player name in local storage when clicking DFS button
    const dfsLink = panel.querySelector(".dfs-link");
    if (dfsLink) {
      dfsLink.addEventListener("click", () => {
        chrome.storage.local.set({ selectedPlayerName: playerName }, () => {
          console.log("Stored Player Name:", playerName);
        });
      });
    } else {
      console.error("DFS link not found!");
    }
  }
