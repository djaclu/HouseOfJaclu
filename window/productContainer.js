/**
 * Creates a product container with gallery and product details
 * @param {string} productName - The name of the product
 * @param {string} price - The price of the product
 * @param {string} description - The product description
 * @param {Array} photos - Array of photo URLs (optional)
 * @returns {Object} - Object containing the HTML elements
 */
function createProductContainer(
  productName,
  subtitle,
  price,
  productXP,
  description,
  photos = []
) {
  // Create main container
  const container = document.createElement("div");
  container.className = "product-container";

  // Create left section (gallery)
  const gallerySection = document.createElement("div");
  gallerySection.className = "product-gallery";

  // Create gallery container
  const galleryContainer = document.createElement("div");
  galleryContainer.className = "gallery-container";

  // Create main image display
  const mainImageContainer = document.createElement("div");
  mainImageContainer.className = "main-image-container";

  const mainImage = document.createElement("img");
  mainImage.className = "main-image";
  mainImage.alt = productName;

  // If photos exist, use first photo, otherwise show placeholder
  if (photos.length > 0) {
    mainImage.src = photos[0];
  } else {
    // Create placeholder square
    mainImage.style.backgroundColor = "#f0f0f0";
    mainImage.style.border = "2px solid #ddd";
    mainImage.style.display = "flex";
    mainImage.style.alignItems = "center";
    mainImage.style.justifyContent = "center";
    mainImage.style.color = "#999";
    mainImage.style.fontSize = "14px";
    mainImage.style.fontFamily = "Isenheim, serif";
    mainImage.textContent = "No Image";
  }

  mainImageContainer.appendChild(mainImage);
  galleryContainer.appendChild(mainImageContainer);

  // Create thumbnail gallery if multiple photos
  if (photos.length > 1) {
    const thumbnailContainer = document.createElement("div");
    thumbnailContainer.className = "thumbnail-container";

    photos.forEach((photo, index) => {
      const thumbnail = document.createElement("img");
      thumbnail.className = "thumbnail";
      thumbnail.src = photo;
      thumbnail.alt = `${productName} - Image ${index + 1}`;
      thumbnail.addEventListener("click", () => {
        mainImage.src = photo;
      });
      thumbnailContainer.appendChild(thumbnail);
    });

    galleryContainer.appendChild(thumbnailContainer);
  }

  gallerySection.appendChild(galleryContainer);

  // Create right section (product details)
  const productInfoSection = document.createElement("div");
  productInfoSection.className = "product-info-container";

  const topSection = document.createElement("div");
  topSection.className = "product-top-section";

  // Create top section (name and price)
  const topRow = document.createElement("div");
  topRow.className = "top-row-section";

  const productNameElement = document.createElement("h1");
  productNameElement.className = "product-name";
  productNameElement.textContent = productName;

  const productPriceElement = document.createElement("div");
  productPriceElement.className = "product-price";
  productPriceElement.textContent = price;

  topRow.appendChild(productNameElement);
  topRow.appendChild(productPriceElement);

  const bottomRow = document.createElement("div");
  bottomRow.className = "bottom-row-section";

  const productSubtitleElement = document.createElement("div");
  productSubtitleElement.className = "product-subtitle";
  productSubtitleElement.textContent = subtitle;

  bottomRow.appendChild(productSubtitleElement);

  topSection.appendChild(topRow);
  topSection.appendChild(bottomRow);

  // Create bottom section (description and add to cart)
  const bottomSection = document.createElement("div");
  bottomSection.className = "product-bottom-section";

  const productXPContent = document.createElement("div");
  productXPContent.className = "product-xp";
  productXPContent.textContent = productXP;

  const productDescriptionElement = document.createElement("div");
  productDescriptionElement.className = "product-description";
  // productDescriptionElement.innerHTML = "PROVENANCE<br><br>" + description;
  productDescriptionElement.innerHTML = description;

  const actionSection = document.createElement("div");
  actionSection.className = "action-section";

  const addToCartButton = document.createElement("button");
  addToCartButton.className = "add-to-cart-button";
  addToCartButton.textContent = "add to cart";

  bottomSection.appendChild(productXPContent);
  bottomSection.appendChild(productDescriptionElement);
  actionSection.appendChild(addToCartButton);
  bottomSection.appendChild(actionSection);

  productInfoSection.appendChild(topSection);
  productInfoSection.appendChild(bottomSection);

  // Assemble the container
  container.appendChild(gallerySection);
  container.appendChild(productInfoSection);

  return {
    container: container,
    gallerySection: gallerySection,
    detailsSection: productInfoSection,
    productNameElement: productNameElement,
    productPriceElement: productPriceElement,
    productDescriptionElement: productDescriptionElement,
    addToCartButton: addToCartButton,
    mainImage: mainImage,
  };
}

// Export the function for use in other modules
export { createProductContainer };
