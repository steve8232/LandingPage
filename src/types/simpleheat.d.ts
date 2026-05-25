// Minimal ambient module declaration for the `simpleheat` package. It ships
// only as a UMD bundle with no .d.ts, so we declare just the surface we use
// in src/app/dashboard/projects/[id]/heatmap/HeatmapClient.tsx.

declare module 'simpleheat' {
  /** Point as `[x_px, y_px, value]`. */
  export type SimpleHeatPoint = [number, number, number];

  export interface SimpleHeatInstance {
    data(points: SimpleHeatPoint[]): SimpleHeatInstance;
    max(value: number): SimpleHeatInstance;
    radius(r: number, blur?: number): SimpleHeatInstance;
    resize(): SimpleHeatInstance;
    gradient(grad: Record<string, string>): SimpleHeatInstance;
    draw(minOpacity?: number): SimpleHeatInstance;
    clear(): SimpleHeatInstance;
  }

  function simpleheat(canvas: HTMLCanvasElement): SimpleHeatInstance;
  export default simpleheat;
}
