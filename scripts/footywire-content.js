console.log("✅ footywire-content.js is running!");

function runWhenReady() {
    const currentUrl = window.location.href;
    console.log(`🌐 Current URL: ${currentUrl}`);

    if (currentUrl.includes("/player_search?fn=")) {
        console.log("🔍 Detected search results page. Looking for results...");
        setTimeout(() => clickFirstSearchResult(), 1000); // Wait for results
    } else {
        console.log("⚠️ Not on search results page. No action taken.");
    }
}

// ✅ Find and click the first valid player link
function clickFirstSearchResult() {
    console.log("👀 Searching for player links...");

    const playerLinks = Array.from(document.querySelectorAll("a"));

    // ✅ Ensure we select only valid player links (which contain ", ")
    const firstValidPlayer = playerLinks.find(link => link.innerText.includes(", "));

    if (firstValidPlayer) {
        console.log(`✅ Clicking result: ${firstValidPlayer.innerText}`);
        window.location.href = firstValidPlayer.href;
    } else {
        console.error("❌ No matching player found.");
    }
}

// ✅ Start the script when the page is ready
runWhenReady();