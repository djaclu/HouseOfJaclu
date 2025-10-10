import { colorPalettes } from "./colorPalettes.js";
import { CursorEffect } from "./cursorEffect.js";
import { fetchSVGSource, generateInlineSVG } from "./windowHelpers.js";

function loadWindow() {
  // setTimeout(() => {
  //   loadSVGAndApplyColors("jaclu-window"); //LOAD GLASS
  // }, 5000);

  loadSVGAndApplyColors("glow-svg"); //LOAD GLOW
  // loadSVGAndApplyColors("glass-svg"); //LOAD GLASS
}

async function loadSVGAndApplyColors(svgId) {
  const svgContent = await fetchSVGSource(svgId);
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

          const glowFilter = `drop-shadow(0 0 2px rgba(${r}, ${g}, ${b}, 1.0)) drop-shadow(0 0 8px rgba(${r}, ${g}, ${b}, 0.9)) drop-shadow(0 0 16px rgba(${r}, ${g}, ${b}, 0.8)) drop-shadow(0 0 24px rgba(${r}, ${g}, ${b}, 0.6))`;

          path.style.filter = glowFilter;
          path.style.setProperty("filter", glowFilter, "important");
        }
      }
    }
  });
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
