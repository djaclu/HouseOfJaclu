/**
 * Cursor Effect Module
 * Creates an interactive cursor effect that reveals SVG paths within a radius of the cursor
 */

export class CursorEffect {
  constructor(svgElement, options = {}) {
    this.svgElement = svgElement;
    this.radius = options.radius || 500; // Default radius of 100px
    this.fadeInDuration = options.fadeInDuration || 200; // ms
    this.fadeOutDuration = options.fadeOutDuration || 300; // ms
    this.isActive = false;
    this.mousePosition = { x: 0, y: 0 };
    this.paths = [];
    this.visiblePaths = new Set();
    this.updateScheduled = false; // Add throttling flag
    this.debugMode = options.debugMode || false; // Add debug mode option
    this.isMouseOverWindow = false; // Track if mouse is over the window
    this.shimmerInterval = null; // For random shimmer effect
    this.shimmerPaths = new Set(); // Paths currently in shimmer mode
    this.autoSweepInterval = null; // For automatic sweep effect
    this.autoSweepIndex = 0; // Current position in the sweep
    this.autoSweepRadius = options.autoSweepRadius || 400; // Radius of the sweep window
    this.isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0; // Detect mobile device

    // Adjust radius for mobile devices (larger radius for easier touch interaction)
    if (this.isMobile) {
      this.radius = Math.max(this.radius, 300); // Ensure minimum radius on mobile
    }

    // Cache for expensive coordinate calculations
    this.coordinateCache = {
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      lastRect: null,
      lastViewBox: null,
    };

    this.init();
  }

  init() {
    // Get all path elements from the SVG, excluding those in the stains group
    const allPaths = Array.from(this.svgElement.querySelectorAll("path"));
    const stainsGroup = this.svgElement.querySelector(
      'g[inkscape\\:label="stains"]'
    );

    // Filter out paths that are within the stains group
    this.paths = allPaths.filter((path) => {
      if (!stainsGroup) return true; // If no stains group found, include all paths
      return !stainsGroup.contains(path);
    });

    // Sort paths by center coordinates (top to bottom)
    this.sortPathsByCenter();

    // Initially hide all paths
    this.hideAllPaths();

    // Add event listeners
    this.addEventListeners();

    // Add resize listener to invalidate cache
    this.addResizeListener();

    // Initialize debug elements if debug mode is enabled
    if (this.debugMode) {
      this.initDebugElements();
    }
  }

  hideAllPaths() {
    this.paths.forEach((path) => {
      path.style.visibility = "hidden";
    });
  }

  revealAllPaths() {
    this.paths.forEach((path) => {
      path.style.visibility = "visible";
    });
  }

  addEventListeners() {
    // Store reference to the event handler for cleanup
    this.mouseMoveHandler = (e) => {
      this.updateMousePosition(e);
      this.updatePathVisibility();
    };

    // Touch event handlers for mobile support
    this.touchMoveHandler = (e) => {
      // Only prevent default if we're over the SVG element to avoid interfering with page scrolling
      const rect = this.svgElement.getBoundingClientRect();
      const touch = e.touches[0];
      const isOverSVG =
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom;

      if (isOverSVG) {
        e.preventDefault(); // Prevent scrolling only when over the SVG
      }

      if (e.touches.length > 0) {
        // Use the first touch point
        const touch = e.touches[0];
        // Create a synthetic mouse event-like object
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
        };
        this.updateMousePosition(syntheticEvent);
        this.updatePathVisibility();
      }
    };

    this.touchStartHandler = (e) => {
      this.isMouseOverWindow = true;
      this.stopAutoSweep();
      // Also handle the initial touch position
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
        };
        this.updateMousePosition(syntheticEvent);
        this.updatePathVisibility();
      }
    };

    this.touchEndHandler = (e) => {
      this.isMouseOverWindow = false;
      this.startAutoSweep();
    };

    // Mouse enter/leave handlers for the window area
    this.mouseEnterHandler = () => {
      this.isMouseOverWindow = true;
      this.stopAutoSweep();
    };

    this.mouseLeaveHandler = () => {
      this.isMouseOverWindow = false;
      this.startAutoSweep();
    };

    // Global mouse move event - works anywhere on the page
    document.addEventListener("mousemove", this.mouseMoveHandler);

    // Global touch events for mobile support
    document.addEventListener("touchmove", this.touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("touchstart", this.touchStartHandler, {
      passive: false,
    });
    document.addEventListener("touchend", this.touchEndHandler);

    // Add window area detection
    this.svgElement.addEventListener("mouseenter", this.mouseEnterHandler);
    this.svgElement.addEventListener("mouseleave", this.mouseLeaveHandler);

    // Touch events for the SVG element
    this.svgElement.addEventListener("touchstart", this.touchStartHandler, {
      passive: false,
    });
    this.svgElement.addEventListener("touchend", this.touchEndHandler);

    // Always active - no need for enter/leave events
    this.isActive = true;

    // Start auto sweep effect initially
    this.startAutoSweep();
  }

  addResizeListener() {
    // Throttled resize handler to invalidate coordinate cache
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Invalidate cache by resetting it
        this.coordinateCache = {
          scaleX: 1,
          scaleY: 1,
          offsetX: 0,
          offsetY: 0,
          lastRect: null,
          lastViewBox: null,
        };
      }, 100); // Debounce resize events
    };

    window.addEventListener("resize", handleResize);

    // Store reference for cleanup
    this.resizeHandler = handleResize;
  }

  updateMousePosition(e) {
    const rect = this.svgElement.getBoundingClientRect();
    const viewBox = this.svgElement.viewBox.baseVal;

    // Get cached transformation or calculate new one
    const transform = this.getCoordinateTransform(rect, viewBox);

    // Get the global mouse position and convert to SVG coordinates
    // Check if mouse is within the SVG bounds
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to SVG coordinate system using cached transform
    this.mousePosition = {
      x: mouseX * transform.scaleX + transform.offsetX,
      y: mouseY * transform.scaleY + transform.offsetY,
    };

    // Update debug elements if debug mode is enabled
    this.updateDebugElements();
  }

  getCoordinateTransform(rect, viewBox) {
    // Check if we can use cached values
    const rectChanged =
      !this.coordinateCache.lastRect ||
      this.coordinateCache.lastRect.width !== rect.width ||
      this.coordinateCache.lastRect.height !== rect.height;

    const viewBoxChanged =
      !this.coordinateCache.lastViewBox ||
      this.coordinateCache.lastViewBox.width !== viewBox.width ||
      this.coordinateCache.lastViewBox.height !== viewBox.height;

    // If nothing changed, return cached values
    if (!rectChanged && !viewBoxChanged) {
      return {
        scaleX: this.coordinateCache.scaleX,
        scaleY: this.coordinateCache.scaleY,
        offsetX: this.coordinateCache.offsetX,
        offsetY: this.coordinateCache.offsetY,
      };
    }

    // Calculate new transformation
    const svgAspectRatio = viewBox.width / viewBox.height;
    const rectAspectRatio = rect.width / rect.height;

    let scaleX,
      scaleY,
      offsetX = 0,
      offsetY = 0;

    if (svgAspectRatio > rectAspectRatio) {
      // SVG is wider than the rect - it will be letterboxed (black bars top/bottom)
      scaleX = viewBox.width / rect.width;
      scaleY = scaleX; // Keep aspect ratio
      const scaledHeight = rect.height * scaleY;
      offsetY = (viewBox.height - scaledHeight) / 2;
    } else {
      // SVG is taller than the rect - it will be pillarboxed (black bars left/right)
      scaleY = viewBox.height / rect.height;
      scaleX = scaleY; // Keep aspect ratio
      const scaledWidth = rect.width * scaleX;
      offsetX = (viewBox.width - scaledWidth) / 2;
    }

    // Cache the results
    this.coordinateCache = {
      scaleX,
      scaleY,
      offsetX,
      offsetY,
      lastRect: { width: rect.width, height: rect.height },
      lastViewBox: { width: viewBox.width, height: viewBox.height },
    };

    return { scaleX, scaleY, offsetX, offsetY };
  }

  updatePathVisibility() {
    // Only update based on cursor when mouse is over the window
    if (!this.isMouseOverWindow) return;

    // Use requestAnimationFrame to throttle updates to 30fps (half of 60fps)
    if (this.updateScheduled) return;
    this.updateScheduled = true;

    requestAnimationFrame(() => {
      this.paths.forEach((path) => {
        const pathCenter = this.getPathCenter(path);
        const distance = this.getDistance(this.mousePosition, pathCenter);
        const isWithinRadius = distance <= this.radius;

        if (isWithinRadius && !this.visiblePaths.has(path)) {
          this.showPath(path);
          this.visiblePaths.add(path);
        } else if (!isWithinRadius && this.visiblePaths.has(path)) {
          this.hidePath(path);
          this.visiblePaths.delete(path);
        }
      });
      this.updateScheduled = false;

      // Skip the next frame to achieve 30fps instead of 60fps
      requestAnimationFrame(() => {
        this.updateScheduled = false;
      });
    });
  }

  getPathCenter(path) {
    // Get the bounding box of the path
    const bbox = path.getBBox();
    const center = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };
    return center;
  }

  sortPathsByCenter() {
    // Sort paths by their center Y coordinate (top to bottom)
    // Paths with smaller Y values (further up) come first
    this.paths.sort((pathA, pathB) => {
      const centerA = this.getPathCenter(pathA);
      const centerB = this.getPathCenter(pathB);

      // Primary sort by Y coordinate (top to bottom)
      if (centerA.y !== centerB.y) {
        return centerA.y - centerB.y;
      }

      // Secondary sort by X coordinate (left to right) for paths at same Y level
      return centerA.x - centerB.x;
    });
  }

  getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  showPath(path) {
    path.style.visibility = "visible";
    path.style.opacity = "1";
    path.style.transition = `opacity ${this.fadeInDuration}ms ease-in`;
  }

  hidePath(path) {
    path.style.opacity = "0";
    path.style.transition = `opacity ${this.fadeOutDuration}ms ease-out`;

    // Hide completely after transition
    setTimeout(() => {
      if (path.style.opacity === "0") {
        path.style.visibility = "hidden";
      }
    }, this.fadeOutDuration);
  }

  // Shimmer effect methods
  startShimmerEffect() {
    if (this.shimmerInterval) return; // Already running

    this.shimmerInterval = setInterval(() => {
      this.updateShimmerEffect();
    }, 100 + Math.random() * 200); // Random interval between 100-300ms
  }

  stopShimmerEffect() {
    if (this.shimmerInterval) {
      clearInterval(this.shimmerInterval);
      this.shimmerInterval = null;
    }

    // Hide all shimmering paths
    this.shimmerPaths.forEach((path) => {
      this.hidePath(path);
    });
    this.shimmerPaths.clear();
  }

  updateShimmerEffect() {
    // Randomly select 1-3 paths to shimmer
    const numPathsToShimmer = Math.floor(Math.random() * 3) + 1;
    const availablePaths = this.paths.filter(
      (path) => !this.shimmerPaths.has(path)
    );

    // Add new shimmering paths
    for (let i = 0; i < numPathsToShimmer && availablePaths.length > 0; i++) {
      const randomPath =
        availablePaths[Math.floor(Math.random() * availablePaths.length)];
      this.shimmerPaths.add(randomPath);
      this.showPath(randomPath);

      // Remove from available paths to avoid duplicates
      const index = availablePaths.indexOf(randomPath);
      availablePaths.splice(index, 1);
    }

    // Randomly hide some shimmering paths
    const pathsToHide = Array.from(this.shimmerPaths).filter(
      () => Math.random() < 0.3
    );
    pathsToHide.forEach((path) => {
      this.hidePath(path);
      this.shimmerPaths.delete(path);
    });
  }

  // Auto sweep effect methods
  startAutoSweep() {
    if (this.autoSweepInterval) return; // Already running

    // Reset to start from the top
    this.autoSweepIndex = 0;

    // Use requestAnimationFrame for smooth animation
    const animate = () => {
      if (!this.autoSweepInterval) return; // Stop if interval was cleared

      this.updateAutoSweep();

      // Continue animation loop (roughly 60fps)
      this.autoSweepInterval = requestAnimationFrame(animate);
    };

    this.autoSweepInterval = requestAnimationFrame(animate);
  }

  stopAutoSweep() {
    if (this.autoSweepInterval) {
      cancelAnimationFrame(this.autoSweepInterval);
      this.autoSweepInterval = null;
    }

    // Hide all paths that were visible from auto sweep
    this.visiblePaths.forEach((path) => {
      this.hidePath(path);
    });
    this.visiblePaths.clear();
  }

  updateAutoSweep() {
    if (this.paths.length === 0) return;

    // Increment the sweep position (moves down the page)
    // Speed can be adjusted here - higher values = faster sweep
    this.autoSweepIndex += 2;

    // If we've reached the end, reset to the top after a brief pause
    if (this.autoSweepIndex > this.paths.length + 50) {
      this.autoSweepIndex = 0;
      // Hide all paths before restarting
      this.visiblePaths.forEach((path) => {
        this.hidePath(path);
      });
      this.visiblePaths.clear();
      return;
    }

    // Create a virtual sweep position based on the sorted path order
    // The sweep reveals paths within a "window" that moves down
    const currentPaths = new Set();

    // Determine which paths should be visible based on the sweep position
    this.paths.forEach((path, index) => {
      // Calculate distance from the current sweep position
      const distance = Math.abs(index - this.autoSweepIndex);

      // Reveal paths within the sweep radius
      if (distance < 20) {
        // Adjust this value to change sweep window size
        currentPaths.add(path);
      }
    });

    // Show newly visible paths
    currentPaths.forEach((path) => {
      if (!this.visiblePaths.has(path)) {
        this.showPath(path);
        this.visiblePaths.add(path);
      }
    });

    // Hide paths that are no longer in the sweep window
    this.visiblePaths.forEach((path) => {
      if (!currentPaths.has(path)) {
        this.hidePath(path);
        this.visiblePaths.delete(path);
      }
    });
  }

  // Public methods for configuration
  setRadius(radius) {
    this.radius = radius;
  }

  setFadeInDuration(duration) {
    this.fadeInDuration = duration;
  }

  setFadeOutDuration(duration) {
    this.fadeOutDuration = duration;
  }

  destroy() {
    // Remove document-level mouse move event listener
    if (this.mouseMoveHandler) {
      document.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    // Remove document-level touch event listeners
    if (this.touchMoveHandler) {
      document.removeEventListener("touchmove", this.touchMoveHandler);
    }
    if (this.touchStartHandler) {
      document.removeEventListener("touchstart", this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      document.removeEventListener("touchend", this.touchEndHandler);
    }

    // Remove window area event listeners
    if (this.mouseEnterHandler) {
      this.svgElement.removeEventListener("mouseenter", this.mouseEnterHandler);
    }
    if (this.mouseLeaveHandler) {
      this.svgElement.removeEventListener("mouseleave", this.mouseLeaveHandler);
    }

    // Remove SVG element touch event listeners
    if (this.touchStartHandler) {
      this.svgElement.removeEventListener("touchstart", this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      this.svgElement.removeEventListener("touchend", this.touchEndHandler);
    }

    // Stop auto sweep effect
    this.stopAutoSweep();

    // Clean up resize listener
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }

    this.hideAllPaths();
  }

  // Debug methods
  initDebugElements() {
    // Create debug circle for mouse position
    this.debugMouseCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    this.debugMouseCircle.setAttribute("r", "5");
    this.debugMouseCircle.setAttribute("fill", "red");
    this.debugMouseCircle.setAttribute("opacity", "0.8");
    this.svgElement.appendChild(this.debugMouseCircle);

    // Create debug circle for radius
    this.debugRadiusCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    this.debugRadiusCircle.setAttribute("r", this.radius);
    this.debugRadiusCircle.setAttribute("fill", "none");
    this.debugRadiusCircle.setAttribute("stroke", "red");
    this.debugRadiusCircle.setAttribute("stroke-width", "2");
    this.debugRadiusCircle.setAttribute("opacity", "0.5");
    this.svgElement.appendChild(this.debugRadiusCircle);
  }

  updateDebugElements() {
    if (!this.debugMode) return;

    if (this.debugMouseCircle) {
      this.debugMouseCircle.setAttribute("cx", this.mousePosition.x);
      this.debugMouseCircle.setAttribute("cy", this.mousePosition.y);
    }

    if (this.debugRadiusCircle) {
      this.debugRadiusCircle.setAttribute("cx", this.mousePosition.x);
      this.debugRadiusCircle.setAttribute("cy", this.mousePosition.y);
    }
  }
}
