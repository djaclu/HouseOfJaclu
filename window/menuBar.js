import "/styles/menu-bar.css";

/**
 * Dynamic Menu Bar Generator for JACLU Website
 * This function generates menu bars dynamically based on page type
 */

function generateMenuBar() {
  // Get current page filename to determine menu type
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Dynamically load menu bar CSS if not already loaded
  if (!document.querySelector('link[href*="menu-bar.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./menuBar.css";
    document.head.appendChild(link);
  }

  // Create menu bar element
  const menuBar = document.createElement("nav");
  menuBar.className = "menu-bar";

  // Create menu container
  const menuContainer = document.createElement("div");
  menuContainer.className = "menu-container";

  // Create logo section
  const menuLogo = document.createElement("div");
  menuLogo.className = "menu-logo";
  const logoLink = document.createElement("a");
  logoLink.href = "index.html";
  logoLink.textContent = "JACLU";
  menuLogo.appendChild(logoLink);

  // Create left menu section (Manifesto)
  const leftMenuSection = document.createElement("div");
  leftMenuSection.className = "menu-left";

  // Create Manifesto link
  const manifestoLink = document.createElement("a");
  manifestoLink.href = "manifesto.html";
  manifestoLink.className = "menu-link";
  manifestoLink.textContent = "MANIFESTO";
  leftMenuSection.appendChild(manifestoLink);

  // Create right menu section (Shop Relics)
  const rightMenuSection = document.createElement("div");
  rightMenuSection.className = "menu-right";

  // Create Shop Relics link
  const relicsLink = document.createElement("a");
  relicsLink.href = "https://www.etsy.com/shop/jaclu";
  relicsLink.className = "menu-link";
  relicsLink.textContent = "SHOP";
  relicsLink.target = "_blank";
  relicsLink.rel = "noopener noreferrer";

  // Add carriage icon to relics link on all pages
  const carriageIcon = document.createElement("img");
  carriageIcon.src = "/icons/carriage.svg";
  carriageIcon.alt = "carriage";
  carriageIcon.className = "menu-icon";
  // relicsLink.appendChild(carriageIcon);

  // Add active class to relics link if on product pages
  if (currentPage === "martyrs-choker.html") {
    relicsLink.classList.add("active");
  }

  rightMenuSection.appendChild(relicsLink);

  // Assemble menu bar with logo on top, links below
  menuBar.appendChild(menuLogo);
  menuBar.appendChild(menuContainer);

  // Assemble menu container with links
  menuContainer.appendChild(leftMenuSection);
  menuContainer.appendChild(rightMenuSection);

  // Insert menu bar at the beginning of body
  document.body.insertBefore(menuBar, document.body.firstChild);
}

// Auto-generate menu bar when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", generateMenuBar);
} else {
  generateMenuBar();
}

// Export for manual use if needed
window.generateMenuBar = generateMenuBar;
