export interface GradingBand {
  label: string;
  min_percent: number;
  max_percent: number;
}

export function gradeFor(percent: number, bands: GradingBand[]): string {
  const band = bands.find((b) => percent >= Number(b.min_percent) && percent <= Number(b.max_percent));
  return band?.label ?? "—";
}
