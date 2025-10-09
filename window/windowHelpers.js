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
    // Both glass-svg and glow-svg use the same WINDOW.svg file
    // Use absolute URL to ensure it works across all deployment environments
    const svgPath = `${window.location.origin}/assets/jaclu-window/WINDOW.svg`;

    const response = await fetch(svgPath);

    if (!response.ok) {
      //CHECK FOR FAILURE
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const svgContent = await response.text(); //STORE THE SVG
    return svgContent;
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
