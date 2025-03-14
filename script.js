// Set dimensions
const width = 960;
const height = 600;
const legendHeight = 120; // Reduced legend height to fit better

// Create SVG
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height + legendHeight);

// Load data
const url =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json";

d3.json(url).then((data) => {
  // Treemap layout
  const treemap = d3
    .treemap()
    .size([width, height])
    .tile(d3.treemapSquarify) // Ensures best space allocation
    .paddingInner(1) // Ensures better spacing between tiles
    .round(true);

  // Create hierarchy
  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  treemap(root);

  // Color scale
  const colorScale = d3
    .scaleOrdinal()
    .domain(root.leaves().map((d) => d.data.category))
    .range(d3.schemeCategory10);

  // Draw tiles
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

  // Add text to tiles
  cells
    .append("text")
    .attr("x", 5)
    .attr("y", 15)
    .text((d) => {
      const maxLength = Math.floor((d.x1 - d.x0) / 10);
      return d.data.name.length > maxLength
        ? d.data.name.substring(0, maxLength) + "..."
        : d.data.name;
    })
    .attr("font-size", (d) => {
      const tileWidth = d.x1 - d.x0;
      const tileHeight = d.y1 - d.y0;
      return Math.min(14, tileWidth / 8, tileHeight / 2) + "px";
    })
    .attr("fill", "white");

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  cells
    .on("mouseover", (event, d) => {
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
        .style("top", `${Math.max(event.pageY - 40, 10)}px`); // Ensures it stays within viewport
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Legend improvements
  const legendWidth = 600;
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${(width - legendWidth) / 2}, ${height + 20})`
    );

  const categories = [...new Set(root.leaves().map((d) => d.data.category))];

  legend
    .selectAll("rect")
    .data(categories)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", (d, i) => (i % 5) * 120) // Creates rows of legend items
    .attr("y", (d, i) => Math.floor(i / 5) * 25) // Stacks legend items
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => colorScale(d));

  legend
    .selectAll("text")
    .data(categories)
    .enter()
    .append("text")
    .attr("x", (d, i) => (i % 5) * 120 + 25)
    .attr("y", (d, i) => Math.floor(i / 5) * 25 + 15)
    .text((d) => d);
});
