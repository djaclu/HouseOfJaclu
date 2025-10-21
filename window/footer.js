/**
 * Dynamic Footer Generator for JACLU Website
 * This function generates footers dynamically based on page type
 */

function generateFooter() {
  // Get current page filename to determine footer type
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Dynamically load footer CSS if not already loaded
  if (!document.querySelector('link[href*="footer.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "styles/footer.css";
    document.head.appendChild(link);
  }

  // Create footer element
  const footer = document.createElement("footer");
  footer.className = "footer";

  footer.innerHTML = `    
        <div class="sub-footer">
            <div class="sub-footer-text">
                <p>COPYRIGHT © 2025 DANIEL JACOBS LUENGO</p>
            </div>
        </div>
    `;

  // Append footer to body
  document.body.appendChild(footer);
}

// Auto-generate footer when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", generateFooter);
} else {
  generateFooter();
}

// Export for manual use if needed
window.generateFooter = generateFooter;
