import { LangtonsAnt } from "./langtons-ant";

// Console version for Node.js
function runConsoleVersion(): void {
  console.log("Langton's Ant - Console Version");
  console.log("===============================\n");

  const ant = new LangtonsAnt(0, 0);
  const steps = 11000;

  console.log(`Running ${steps} steps...`);
  const startTime = Date.now();
  ant.run(steps);
  const endTime = Date.now();

  const bounds = ant.getGridBounds();
  const grid = ant.getGrid();
  const antPos = ant.getAntPosition();

  console.log(`\nCompleted in ${endTime - startTime}ms`);
  console.log(
    `Grid bounds: x[${bounds.minX}, ${bounds.maxX}], y[${bounds.minY}, ${bounds.maxY}]`
  );
  console.log(
    `Grid size: ${bounds.maxX - bounds.minX + 1} x ${
      bounds.maxY - bounds.minY + 1
    }`
  );
  console.log(`Black cells: ${grid.size}`);
  console.log(`Ant position: (${antPos.x}, ${antPos.y})`);
}

// Run console version if in Node.js
if (typeof window === "undefined") {
  runConsoleVersion();
}

// Export for browser use
export { LangtonsAnt, Direction, CellColor } from "./langtons-ant";
export { Visualizer } from "./visualizer";
