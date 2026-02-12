import { LangtonsAnt, Direction, CellColor } from "./langtons-ant";

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ant: LangtonsAnt;
  private cellSize: number;
  private isRunning: boolean;
  private animationId: number | null;
  private stepsPerFrame: number;

  constructor(
    canvas: HTMLCanvasElement,
    cellSize: number = 5,
    stepsPerFrame: number = 1
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = ctx;
    this.cellSize = cellSize;
    this.stepsPerFrame = stepsPerFrame;
    this.ant = new LangtonsAnt(0, 0);
    this.isRunning = false;
    this.animationId = null;
  }

  private drawGrid(): void {
    const bounds = this.ant.getGridBounds();
    const grid = this.ant.getGrid();
    const antPos = this.ant.getAntPosition();

    // Calculate padding
    const padding = 50;

    // Calculate offset to center the grid (accounting for padding)
    const offsetX = -bounds.minX * this.cellSize + padding;
    const offsetY = -bounds.minY * this.cellSize + padding;

    // Clear canvas
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw black cells
    this.ctx.fillStyle = "red";
    for (const [key, color] of grid.entries()) {
      if (color === CellColor.Black) {
        const [x, y] = key.split(",").map(Number);
        this.ctx.fillRect(
          x * this.cellSize + offsetX,
          y * this.cellSize + offsetY,
          this.cellSize,
          this.cellSize
        );
      }
    }

    // Draw ant (make it more visible and distinct from trail)
    const antScreenX = antPos.x * this.cellSize + offsetX;
    const antScreenY = antPos.y * this.cellSize + offsetY;

    // Draw ant with a distinct blue color and make it slightly larger
    this.ctx.fillStyle = "#0066ff";
    this.ctx.fillRect(
      antScreenX - 1,
      antScreenY - 1,
      this.cellSize + 2,
      this.cellSize + 2
    );

    // Draw ant outline to make it more visible
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      antScreenX - 1,
      antScreenY - 1,
      this.cellSize + 2,
      this.cellSize + 2
    );

    // Draw direction indicator (make it more visible)
    const direction = this.ant.getAntDirection();
    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    const centerX = antScreenX + this.cellSize / 2;
    const centerY = antScreenY + this.cellSize / 2;
    const arrowLength = this.cellSize * 0.7;

    let endX = centerX;
    let endY = centerY;
    switch (direction) {
      case Direction.North:
        endY = centerY - arrowLength;
        break;
      case Direction.East:
        endX = centerX + arrowLength;
        break;
      case Direction.South:
        endY = centerY + arrowLength;
        break;
      case Direction.West:
        endX = centerX - arrowLength;
        break;
    }
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }

  private updateCanvasSize(): void {
    const bounds = this.ant.getGridBounds();
    const padding = 50;

    // Ensure minimum size to show at least the ant's current position
    const minWidth = Math.max(
      (bounds.maxX - bounds.minX + 1) * this.cellSize,
      this.cellSize * 10
    );
    const minHeight = Math.max(
      (bounds.maxY - bounds.minY + 1) * this.cellSize,
      this.cellSize * 10
    );

    this.canvas.width = Math.max(minWidth + padding * 2, 800);
    this.canvas.height = Math.max(minHeight + padding * 2, 600);
  }

  private animate = (): void => {
    if (!this.isRunning) {
      return;
    }

    // Run multiple steps per frame for faster simulation
    for (let i = 0; i < this.stepsPerFrame; i++) {
      this.ant.step();
    }

    this.updateCanvasSize();
    this.drawGrid();

    this.animationId = requestAnimationFrame(this.animate);
  };

  start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.updateCanvasSize();
    this.drawGrid();
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  step(): void {
    this.ant.step();
    this.updateCanvasSize();
    this.drawGrid();
  }

  draw(): void {
    this.updateCanvasSize();
    this.drawGrid();
  }

  reset(): void {
    this.stop();
    this.ant = new LangtonsAnt(0, 0);
    this.updateCanvasSize();
    this.drawGrid();
  }

  setStepsPerFrame(steps: number): void {
    this.stepsPerFrame = steps;
  }

  getAnt(): LangtonsAnt {
    return this.ant;
  }
}
