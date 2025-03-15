// Constants
const DATASETS = {
  movies: {
    TITLE: "Movie Sales",
    DESCRIPTION: "Top 100 Highest Grossing Movies Grouped By Genre",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json",
  },
  videogames: {
    TITLE: "Video Game Sales",
    DESCRIPTION: "Top 100 Most Sold Video Games Grouped by Platform",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json",
  },
  kickstarter: {
    TITLE: "Kickstarter Pledges",
    DESCRIPTION:
      "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json",
  },
};

// Global variables
let width, height, svg, tooltip;

// Initialize the visualization
function init() {
  const selectedDataset = getSelectedDataset();
  updateTitleAndDescription(selectedDataset);
  setupSVG();
  setupTooltip();
  loadAndDrawDataset(selectedDataset);
  setupEventListeners();
}

// Get the selected dataset from the URL
function getSelectedDataset() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("dataset") || "movies"; // Default to movies
}

// Update the title and description
function updateTitleAndDescription(dataset) {
  document.getElementById("title").innerHTML = DATASETS[dataset].TITLE;
  document.getElementById("description").innerHTML =
    DATASETS[dataset].DESCRIPTION;
}

// Set up the SVG canvas
function setupSVG() {
  width = window.innerWidth * 0.9; // 90% of window width
  height = window.innerHeight * 0.6; // 60% of window height
  svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height + 120); // Add space for the legend
}

// Set up the tooltip
function setupTooltip() {
  tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
}

// Load and draw the dataset
function loadAndDrawDataset(dataset) {
  d3.json(DATASETS[dataset].FILE_PATH).then((data) => {
    drawTreemap(data);
  });
}

// Draw the treemap
function drawTreemap(data) {
  svg.selectAll("*").remove(); // Clear existing treemap

  const treemap = createTreemapLayout();
  const root = createHierarchy(data);
  treemap(root);

  const colorScale = createColorScale(root);
  drawTiles(root, colorScale);
  drawLegend(root, colorScale);
}

// Create the treemap layout
function createTreemapLayout() {
  return d3
    .treemap()
    .size([width, height])
    .tile(d3.treemapSquarify)
    .paddingInner(0);
}

// Create the hierarchy
function createHierarchy(data) {
  return d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);
}

// Create the color scale
function createColorScale(root) {
  return d3
    .scaleOrdinal()
    .domain(root.leaves().map((d) => d.data.category))
    .range(d3.schemeCategory10);
}

// Draw the tiles
function drawTiles(root, colorScale) {
  const cells = svg
    .selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  cells
    .append("rect")
    .attr("class", "tile")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => colorScale(d.data.category))
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value);

  cells
    .append("text")
    .attr("x", 5)
    .attr("y", 15)
    .text((d) => truncateText(d.data.name, d.x1 - d.x0))
    .attr("font-size", (d) => calculateFontSize(d.x1 - d.x0, d.y1 - d.y0))
    .attr("fill", "white");

  cells
    .on("mouseover", (event, d) => showTooltip(event, d))
    .on("mouseout", hideTooltip);
}

// Truncate text if it's too long
function truncateText(text, tileWidth) {
  const maxLength = Math.floor(tileWidth / (width < 600 ? 6 : 10));
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Calculate font size based on tile size
function calculateFontSize(tileWidth, tileHeight) {
  return Math.min(width < 600 ? 10 : 14, tileWidth / 8, tileHeight / 2) + "px";
}

// Show the tooltip
function showTooltip(event, d) {
  tooltip.transition().duration(200).style("opacity", 0.9);
  tooltip
    .html(
      `
    ${d.data.name}<br>
    Category: ${d.data.category}<br>
    Value: ${d.data.value}
  `
    )
    .attr("data-value", d.data.value)
    .style("left", `${Math.min(event.pageX + 10, width - 150)}px`)
    .style("top", `${Math.max(event.pageY - 40, 10)}px`);
}

// Hide the tooltip
function hideTooltip() {
  tooltip.transition().duration(500).style("opacity", 0);
}

// Draw the legend
function drawLegend(root, colorScale) {
  const legendWidth = Math.min(600, width * 0.9);
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${(width - legendWidth) / 2}, ${height + 20})`
    );

  const categories = [...new Set(root.leaves().map((d) => d.data.category))];
  const legendItemsPerRow = Math.floor(legendWidth / 120);
  const legendRowHeight = 25;
  const legendRows = Math.ceil(categories.length / legendItemsPerRow);
  const legendTotalHeight = legendRows * legendRowHeight;

  svg.attr("height", height + legendTotalHeight + 40); // Adjust SVG height

  legend
    .selectAll("rect")
    .data(categories)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", (d, i) => (i % legendItemsPerRow) * 120)
    .attr("y", (d, i) => Math.floor(i / legendItemsPerRow) * legendRowHeight)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => colorScale(d));

  legend
    .selectAll("text")
    .data(categories)
    .enter()
    .append("text")
    .attr("x", (d, i) => (i % legendItemsPerRow) * 120 + 25)
    .attr(
      "y",
      (d, i) => Math.floor(i / legendItemsPerRow) * legendRowHeight + 15
    )
    .text((d) => d);
}

// Handle window resize
function handleResize() {
  width = window.innerWidth * 0.9;
  height = window.innerHeight * 0.6;
  svg.attr("width", width).attr("height", height + 120);

  const selectedDataset = getSelectedDataset();
  loadAndDrawDataset(selectedDataset);
}

// Set up event listeners
function setupEventListeners() {
  // Dataset link clicks
  document.querySelectorAll("#dataset-links a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const dataset = event.target.getAttribute("href").split("=")[1];
      window.history.pushState({}, "", `?dataset=${dataset}`);
      updateTitleAndDescription(dataset);
      loadAndDrawDataset(dataset);
    });
  });

  // Back/forward navigation
  window.addEventListener("popstate", () => {
    const selectedDataset = getSelectedDataset();
    updateTitleAndDescription(selectedDataset);
    loadAndDrawDataset(selectedDataset);
  });

  // Window resize
  window.addEventListener("resize", handleResize);
}

// Initialize the visualization
init();
