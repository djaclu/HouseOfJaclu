import { colorPalettes } from "./colorPalettes.js";
import { CursorEffect } from "./cursorEffect.js";
import { fetchSVGSource, generateInlineSVG } from "./windowHelpers.js";

async function loadWindow() {
  const svgContent = await fetchSVGSource("glass-svg");
  loadSVGAndApplyColors("glow-svg", svgContent); //LOAD GLOW
  loadSVGAndApplyColors("glass-svg", svgContent); //LOAD GLASS
}

function loadSVGAndApplyColors(svgId, svgContent) {
  const svgElement = generateInlineSVG(svgContent, svgId);

  if (svgId === "glass-svg") {
    initGlass(svgElement);
    initCreed(svgElement, true);
  } else if (svgId === "glow-svg") {
    initGlowEffect(svgElement);
  }
}

function initCreed(svgElement, debug = false) {
  const creedPathElement = document.getElementById("creed-path");

  const sourcePath = svgElement.querySelector(
    'path[inkscape\\:label="creed-path"]'
  );

  if (sourcePath && creedPathElement) {
    creedPathElement.setAttribute("d", sourcePath.getAttribute("d"));
  }
}

function setShardsColors(group, groupName) {
  const palette = colorPalettes[groupName];

  if (!palette) {
    return;
  }

  const paths = group.querySelectorAll("path");

  paths.forEach((path) => {
    const randomColor = palette[Math.floor(Math.random() * palette.length)];

    path.style.setProperty("fill", randomColor, "important");

    path.removeAttribute("stroke");
    path.removeAttribute("stroke-width");
    path.removeAttribute("stroke-opacity");
    path.style.stroke = "none";
  });
}

function setShardsLight(group, groupName) {
  const paths = group.querySelectorAll("path");

  paths.forEach((path) => {
    path.removeAttribute("fill-opacity");
    path.style.fillOpacity = "1";

    if (groupName !== "stains") {
      const rgbString = path.style.fill;

      if (rgbString) {
        const rgbMatch = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);

          // Create a unique filter ID for this color
          const filterId = `glow-${r}-${g}-${b}`;

          // Check if filter already exists, if not create it
          let filterElement = document.getElementById(filterId);
          if (!filterElement) {
            filterElement = createGlowFilter(filterId, r, g, b);
            // Add filter to the SVG's defs section
            let defs = path.ownerSVGElement.querySelector("defs");
            if (!defs) {
              defs = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "defs"
              );
              path.ownerSVGElement.insertBefore(
                defs,
                path.ownerSVGElement.firstChild
              );
            }
            defs.appendChild(filterElement);
          }

          // Apply the SVG filter using the filter attribute
          path.setAttribute("filter", `url(#${filterId})`);
        }
      }
    }
  });
}

function createGlowFilter(id, r, g, b) {
  const filter = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "filter"
  );
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  // Create multiple gaussian blur layers for a better glow effect
  const blurs = [
    { stdDev: 2, opacity: 1.0 },
    { stdDev: 8, opacity: 0.9 },
    { stdDev: 16, opacity: 0.8 },
    { stdDev: 24, opacity: 0.6 },
  ];

  // SourceGraphic for the original shape
  const feFlood = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feFlood"
  );
  feFlood.setAttribute("flood-color", `rgb(${r}, ${g}, ${b})`);
  feFlood.setAttribute("result", "flood");
  filter.appendChild(feFlood);

  const feComposite = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feComposite"
  );
  feComposite.setAttribute("in", "flood");
  feComposite.setAttribute("in2", "SourceGraphic");
  feComposite.setAttribute("operator", "in");
  feComposite.setAttribute("result", "color");
  filter.appendChild(feComposite);

  // Create merge node to combine all blur layers
  const feMerge = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feMerge"
  );

  // Add each blur layer
  blurs.forEach((blur, index) => {
    const feGaussianBlur = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur"
    );
    feGaussianBlur.setAttribute("in", "color");
    feGaussianBlur.setAttribute("stdDeviation", blur.stdDev);
    feGaussianBlur.setAttribute("result", `blur${index}`);
    filter.appendChild(feGaussianBlur);

    const feComponentTransfer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComponentTransfer"
    );
    feComponentTransfer.setAttribute("in", `blur${index}`);
    feComponentTransfer.setAttribute("result", `opacity${index}`);

    const feFuncA = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feFuncA"
    );
    feFuncA.setAttribute("type", "linear");
    feFuncA.setAttribute("slope", blur.opacity);
    feComponentTransfer.appendChild(feFuncA);
    filter.appendChild(feComponentTransfer);

    const feMergeNode = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    feMergeNode.setAttribute("in", `opacity${index}`);
    feMerge.appendChild(feMergeNode);
  });

  // Add the original graphic on top
  const feMergeNodeSource = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feMergeNode"
  );
  feMergeNodeSource.setAttribute("in", "SourceGraphic");
  feMerge.appendChild(feMergeNodeSource);

  filter.appendChild(feMerge);

  return filter;
}

function setShardsAttributes(svgElement, glow = false) {
  const groups = svgElement.querySelectorAll("g[inkscape\\:label]");

  groups.forEach((group) => {
    const groupName = group.getAttribute("inkscape:label");
    setShardsColors(group, groupName);
    if (glow) {
      setShardsLight(group, groupName);
    }
  });
}

function initGlass(svgElement) {
  setShardsAttributes(svgElement);
}

function initGlowEffect(svgElement) {
  setShardsAttributes(svgElement, true);

  const cursorEffect = new CursorEffect(svgElement, {
    radius: 200,
    fadeInDuration: 200,
    fadeOutDuration: 300,
    debugMode: false,
  });
}

loadWindow();
