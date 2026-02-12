export enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

export enum CellColor {
  White = 0,
  Black = 1,
}

export class LangtonsAnt {
  private grid: Map<string, CellColor>;
  private antX: number;
  private antY: number;
  private direction: Direction;
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;

  constructor(startX: number = 0, startY: number = 0) {
    this.grid = new Map();
    this.antX = startX;
    this.antY = startY;
    this.direction = Direction.North;
    this.minX = startX;
    this.maxX = startX;
    this.minY = startY;
    this.maxY = startY;
  }

  private getCellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private getCellColor(x: number, y: number): CellColor {
    const key = this.getCellKey(x, y);
    return this.grid.get(key) || CellColor.White;
  }

  private setCellColor(x: number, y: number, color: CellColor): void {
    const key = this.getCellKey(x, y);
    if (color === CellColor.White) {
      this.grid.delete(key);
    } else {
      this.grid.set(key, color);
    }
  }

  private updateBounds(x: number, y: number): void {
    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
  }

  step(): void {
    const currentColor = this.getCellColor(this.antX, this.antY);

    // Turn based on current cell color
    if (currentColor === CellColor.White) {
      // Turn clockwise (right)
      this.direction = (this.direction + 1) % 4;
    } else {
      // Turn counterclockwise (left)
      this.direction = (this.direction + 3) % 4;
    }

    // Flip the color of the current cell
    const newColor =
      currentColor === CellColor.White ? CellColor.Black : CellColor.White;
    this.setCellColor(this.antX, this.antY, newColor);

    // Move forward one unit
    switch (this.direction) {
      case Direction.North:
        this.antY -= 1;
        break;
      case Direction.East:
        this.antX += 1;
        break;
      case Direction.South:
        this.antY += 1;
        break;
      case Direction.West:
        this.antX -= 1;
        break;
    }

    this.updateBounds(this.antX, this.antY);
  }

  run(steps: number): void {
    for (let i = 0; i < steps; i++) {
      this.step();
    }
  }

  getAntPosition(): { x: number; y: number } {
    return { x: this.antX, y: this.antY };
  }

  getAntDirection(): Direction {
    return this.direction;
  }

  getGridBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
    };
  }

  getGrid(): Map<string, CellColor> {
    return new Map(this.grid);
  }

  getCellColorAt(x: number, y: number): CellColor {
    return this.getCellColor(x, y);
  }
}
