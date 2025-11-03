// Shop Gallery Navigation
document.addEventListener("DOMContentLoaded", function () {
  // Image gallery data
  const images = [
    "/relics/martyrsChoker/MARTYRS_CHOKER.jpeg",
    "/relics/martyrsChoker/IMG_1883.jpeg",
    "/relics/martyrsChoker/IMG_1878.jpeg",
  ];

  let currentIndex = 0;

  // Get elements
  const productImage = document.querySelector(".product-image img");
  const leftArrow = document.querySelector(".image-nav-left");
  const rightArrow = document.querySelector(".image-nav-right");
  const thumbnailsContainer = document.querySelector(".product-thumbnails");

  // Create thumbnails
  function createThumbnails() {
    images.forEach((imageSrc, index) => {
      const thumbnail = document.createElement("img");
      thumbnail.src = imageSrc;
      thumbnail.alt = `Martyrs Choker - Image ${index + 1}`;
      thumbnail.className = "product-thumbnail";
      if (index === 0) {
        thumbnail.classList.add("active");
      }
      thumbnail.addEventListener("click", () => showImage(index));
      thumbnailsContainer.appendChild(thumbnail);
    });
  }

  // Navigation functions
  function showImage(index) {
    if (index < 0) {
      currentIndex = images.length - 1;
    } else if (index >= images.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    productImage.src = images[currentIndex];
    updateActiveThumbnail();
  }

  // Update active thumbnail
  function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll(".product-thumbnail");
    thumbnails.forEach((thumb, index) => {
      if (index === currentIndex) {
        thumb.classList.add("active");
      } else {
        thumb.classList.remove("active");
      }
    });
  }

  function nextImage() {
    showImage(currentIndex + 1);
  }

  function previousImage() {
    showImage(currentIndex - 1);
  }

  // Initialize
  if (leftArrow && rightArrow && productImage && thumbnailsContainer) {
    // Create thumbnails
    createThumbnails();

    // Event listeners
    leftArrow.addEventListener("click", previousImage);
    rightArrow.addEventListener("click", nextImage);

    // Optional: Add keyboard navigation
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        previousImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      }
    });
  }
});
