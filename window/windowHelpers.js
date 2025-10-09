export function findGroupByName(groupName, svgElement) {
  return svgElement.querySelector(`g[inkscape\\:label="${groupName}"]`);
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export async function fetchSVGSource(svgId) {
  try {
    // Get the actual hashed filename from the preload link
    const svgPath =
      document.querySelector('link[href*="WINDOW.svg"]')?.href ||
      `${window.location.origin}/public/jaclu-window/WINDOW.svg`;

    const response = await fetch(svgPath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.text();
  } catch (error) {
    console.log(`Error fetching SVG for ${svgId}:`, error);
    return null;
  }
}

export function generateInlineSVG(svgContent, svgId) {
  const svgElement = document.getElementById(svgId); //GET INLINE SVG ELEMENT

  //CONVERT SVG STRING INTO DOM ELEMENTS
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
  const actualSvgElement = svgDoc.documentElement;

  //INJECT THE SVG CONTENT INTO THE INLINE SVG ELEMENT
  svgElement.innerHTML = actualSvgElement.innerHTML;

  return svgElement;
}
