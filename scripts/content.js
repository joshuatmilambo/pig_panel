

//wait for page to load
document.addEventListener("DOMContentLoaded", () => {
  injectInfoButtons();
  observeDynamicChanges();
})

function injectInfoButtons() {
  //select all player sections
  const playerSections = document.querySelectorAll("div[class*='sc-erIqft']");

    playerSections.forEach((playerSection) => {
      //Avoid adding duplicate buttons
      if (playerSection.querySelector(".pigpanel-info-btn")) return;

      //create the info button
      const infoButton = document.createElement("button");
      infoButton.innerText = "i"; //unicode info can replace with image
      infoButton.className = "pigpanel-info-btn";

      //Add click event listener
      infoButton.addEventListener("click", (event) => {
        event.stopPropagation();
        console.log("Button clicked for player:", playerSection.innerText);
        //showPlayerPanel(playerSection);
      });

      const wrapper = document.createElement('div');
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

injectInfoButtons();

function observeDynamicChanges() {
  const observer = new MutationObserver(() => {
    injectInfoButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/*function showPlayerPanel(playerSection) {
  const playerName = playerSelection.querySelector(".player-name")?.innerText || "Unknown Player";
  //Remove existing panel
  const existingPanel = document.getElementById("pigpanel-panel");
  if (existingPanel) existingPanel.remove();

  //Create a new panel
  const panel = document.createElement("div");
    panel.id = "pigpanel-panel";
    panel.innerHTML = `
        <div class="pigpanel-header">
            <h3>${playerName}</h3>
            <button id="pigpanel-close">❌</button>
        </div>
        <div class="pigpanel-content">
            <p>Loading data for ${playerName}...</p>
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

    // Close button functionality
    panel.querySelector("#pigpanel-close").addEventListener("click", () => {
        panel.remove();
    });

    // Append panel to the body
    document.body.appendChild(panel);

    // Fetch player data (to be implemented)
    fetchPlayerData(playerName);
}

function fetchPlayerData(playerName) {
  // This is where you can pull real player data from an API later
  setTimeout(() => {
      document.querySelector(".pigpanel-content").innerHTML = `<p>Stats and news coming soon for ${playerName}!</p>`;
  }, 1000);
}

// Detect dynamically loaded player sections
function observeDynamicChanges() {
  const observer = new MutationObserver(() => {
      injectInfoButtons(); // Re-check and add buttons when new players appear
  });

  observer.observe(document.body, {
      childList: true,
      subtree: true
  });
}*/