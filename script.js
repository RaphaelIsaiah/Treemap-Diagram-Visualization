const width = 960;
const height = 600;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const url =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json";

d3.json(url).then((data) => {
  // Create treemap layout
  const treemap = d3.treemap().size([width, height]).padding(1).round(true);

  // Create hierarchy
  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  treemap(root); // Compute positions

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
    .attr("x", 5) // Padding from the left edge
    .attr("y", 15) // Padding from the top edge
    .text((d) => {
      // Truncate text if it's too long
      const maxLength = (d.x1 - d.x0) / 8; // Adjust based on font size
      return d.data.name.length > maxLength
        ? d.data.name.substring(0, maxLength) + "..."
        : d.data.name;
    })
    .attr("font-size", (d) => {
      // Adjust font size based on tile size
      const tileWidth = d.x1 - d.x0;
      const tileHeight = d.y1 - d.y0;
      return Math.min(12, tileWidth / 10, tileHeight / 2) + "px";
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
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Legend
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(20, 20)`);

  const categories = [...new Set(root.leaves().map((d) => d.data.category))];

  legend
    .selectAll("rect")
    .data(categories)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", (d) => colorScale(d));

  legend
    .selectAll("text")
    .data(categories)
    .enter()
    .append("text")
    .attr("x", 25)
    .attr("y", (d, i) => i * 25 + 15)
    .text((d) => d);
});
