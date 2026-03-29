/**
 * Carbon Intensity Data Service
 * 
 * Simulates integration with the Green Software Foundation's Carbon Aware SDK.
 * In production, this would call the Carbon Aware SDK API endpoints:
 *   GET /emissions/bylocations?location={region}&time={start}&toTime={end}
 *   GET /emissions/forecasts/current?location={region}
 * 
 * The SDK provides marginal carbon intensity (gCO2eq/kWh) for electricity grids.
 * We model realistic diurnal patterns per region based on their energy mix.
 */

export interface CarbonIntensityPoint {
  timestamp: Date;
  intensity: number; // gCO2eq/kWh
  region: string;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  /** Average grid carbon intensity baseline (gCO2eq/kWh) */
  baselineIntensity: number;
  /** Renewable percentage of grid mix */
  renewablePercent: number;
  /** Timezone offset from UTC */
  utcOffset: number;
  /** Diurnal variation amplitude (0-1) */
  variationAmplitude: number;
}

export const REGIONS: Region[] = [
  {
    id: "westus",
    name: "West US (California)",
    country: "US",
    baselineIntensity: 220,
    renewablePercent: 33,
    utcOffset: -8,
    variationAmplitude: 0.35,
  },
  {
    id: "northeurope",
    name: "North Europe (Ireland)",
    country: "IE",
    baselineIntensity: 320,
    renewablePercent: 40,
    utcOffset: 0,
    variationAmplitude: 0.3,
  },
  {
    id: "uksouth",
    name: "UK South (London)",
    country: "GB",
    baselineIntensity: 260,
    renewablePercent: 42,
    utcOffset: 0,
    variationAmplitude: 0.4,
  },
  {
    id: "francecentral",
    name: "France Central (Paris)",
    country: "FR",
    baselineIntensity: 85,
    renewablePercent: 75,
    utcOffset: 1,
    variationAmplitude: 0.2,
  },
  {
    id: "norwayeast",
    name: "Norway East (Oslo)",
    country: "NO",
    baselineIntensity: 28,
    renewablePercent: 98,
    utcOffset: 1,
    variationAmplitude: 0.1,
  },
  {
    id: "eastus",
    name: "East US (Virginia)",
    country: "US",
    baselineIntensity: 380,
    renewablePercent: 18,
    utcOffset: -5,
    variationAmplitude: 0.25,
  },
  {
    id: "australiaeast",
    name: "Australia East (Sydney)",
    country: "AU",
    baselineIntensity: 650,
    renewablePercent: 22,
    utcOffset: 11,
    variationAmplitude: 0.3,
  },
  {
    id: "southindia",
    name: "South India (Chennai)",
    country: "IN",
    baselineIntensity: 700,
    renewablePercent: 15,
    utcOffset: 5.5,
    variationAmplitude: 0.2,
  },
];

/**
 * Generate realistic carbon intensity data for a region over a time window.
 * 
 * Models:
 * - Diurnal cycle: lower at night (less demand, higher wind), higher during day
 * - Solar peak: intensity dips mid-day in high-solar regions
 * - Random variation: ±15% noise to simulate real-world volatility
 * - Weekend effect: ~10% lower intensity on weekends
 * 
 * Resolution: 30-minute intervals (matching Carbon Aware SDK granularity)
 */
export function generateCarbonIntensity(
  region: Region,
  startTime: Date,
  endTime: Date,
  intervalMinutes: number = 30
): CarbonIntensityPoint[] {
  const points: CarbonIntensityPoint[] = [];
  const current = new Date(startTime);
  // Seed from region id for reproducibility
  let seed = hashCode(region.id + startTime.toISOString().slice(0, 10));

  while (current <= endTime) {
    const localHour = ((current.getUTCHours() + region.utcOffset + 24) % 24);
    
    // Diurnal pattern: peaks ~18:00 local, troughs ~04:00 local
    const diurnalFactor = 1 + region.variationAmplitude * Math.sin(
      ((localHour - 4) / 24) * 2 * Math.PI
    );
    
    // Solar dip: lower intensity 10:00-15:00 for high-renewable regions
    let solarDip = 1;
    if (region.renewablePercent > 25 && localHour >= 10 && localHour <= 15) {
      solarDip = 1 - (region.renewablePercent / 100) * 0.3 * 
        Math.sin(((localHour - 10) / 5) * Math.PI);
    }
    
    // Weekend effect
    const dayOfWeek = current.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.9 : 1;
    
    // Pseudo-random noise ±15%
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = 1 + ((seed % 300 - 150) / 1000);
    
    const intensity = Math.max(
      10,
      Math.round(region.baselineIntensity * diurnalFactor * solarDip * weekendFactor * noise)
    );
    
    points.push({
      timestamp: new Date(current),
      intensity,
      region: region.id,
    });
    
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return points;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface JobConfig {
  durationMinutes: number;
  earliestStart: Date;
  latestFinish: Date;
  regions: string[];
  /** Estimated power draw in kW */
  powerDrawKW: number;
}

export interface CandidateSchedule {
  region: string;
  regionName: string;
  startTime: Date;
  endTime: Date;
  avgIntensity: number; // gCO2eq/kWh
  estimatedEmissions: number; // gCO2eq
  rank: number;
  savingsVsBaseline: number; // percentage
  intensityProfile: CarbonIntensityPoint[];
}

export interface ScheduleReport {
  baseline: CandidateSchedule;
  optimized: CandidateSchedule;
  allCandidates: CandidateSchedule[];
  emissionsReduction: number; // gCO2eq
  reductionPercent: number;
}

/**
 * Core scheduling algorithm:
 * 1. For each candidate region, generate carbon intensity forecast
 * 2. Use sliding window to find all valid start times
 * 3. For each window, compute average intensity and estimated emissions
 * 4. Rank all (region, time) pairs by emissions
 * 5. Return baseline (run now, first region) vs best option
 */
export function computeSchedule(config: JobConfig): ScheduleReport {
  const allCandidates: CandidateSchedule[] = [];
  
  for (const regionId of config.regions) {
    const region = REGIONS.find(r => r.id === regionId);
    if (!region) continue;
    
    // Generate forecast data for the entire window
    const forecast = generateCarbonIntensity(
      region,
      config.earliestStart,
      config.latestFinish
    );
    
    if (forecast.length === 0) continue;
    
    // Sliding window: find all valid start times
    const durationMs = config.durationMinutes * 60 * 1000;
    const intervalMs = 30 * 60 * 1000; // 30-min steps
    
    const windowStart = config.earliestStart.getTime();
    const windowEnd = config.latestFinish.getTime() - durationMs;
    
    for (let startMs = windowStart; startMs <= windowEnd; startMs += intervalMs) {
      const slotStart = new Date(startMs);
      const slotEnd = new Date(startMs + durationMs);
      
      // Get intensity points within this slot
      const slotPoints = forecast.filter(
        p => p.timestamp >= slotStart && p.timestamp <= slotEnd
      );
      
      if (slotPoints.length === 0) continue;
      
      const avgIntensity = slotPoints.reduce((s, p) => s + p.intensity, 0) / slotPoints.length;
      
      // Emissions = intensity (gCO2/kWh) * power (kW) * duration (h)
      const durationHours = config.durationMinutes / 60;
      const estimatedEmissions = avgIntensity * config.powerDrawKW * durationHours;
      
      allCandidates.push({
        region: regionId,
        regionName: region.name,
        startTime: slotStart,
        endTime: slotEnd,
        avgIntensity: Math.round(avgIntensity),
        estimatedEmissions: Math.round(estimatedEmissions),
        rank: 0,
        savingsVsBaseline: 0,
        intensityProfile: slotPoints,
      });
    }
  }
  
  // Sort by emissions (ascending = greenest first)
  allCandidates.sort((a, b) => a.estimatedEmissions - b.estimatedEmissions);
  
  // Assign ranks
  allCandidates.forEach((c, i) => { c.rank = i + 1; });
  
  // Baseline: run immediately in the first selected region
  const baselineRegion = REGIONS.find(r => r.id === config.regions[0])!;
  const baselineForecast = generateCarbonIntensity(
    baselineRegion,
    config.earliestStart,
    new Date(config.earliestStart.getTime() + config.durationMinutes * 60 * 1000)
  );
  const baselineAvg = baselineForecast.length > 0
    ? baselineForecast.reduce((s, p) => s + p.intensity, 0) / baselineForecast.length
    : baselineRegion.baselineIntensity;
  const baselineEmissions = Math.round(baselineAvg * config.powerDrawKW * (config.durationMinutes / 60));
  
  const baseline: CandidateSchedule = {
    region: config.regions[0],
    regionName: baselineRegion.name,
    startTime: config.earliestStart,
    endTime: new Date(config.earliestStart.getTime() + config.durationMinutes * 60 * 1000),
    avgIntensity: Math.round(baselineAvg),
    estimatedEmissions: baselineEmissions,
    rank: 0,
    savingsVsBaseline: 0,
    intensityProfile: baselineForecast,
  };
  
  // Calculate savings vs baseline for all candidates
  allCandidates.forEach(c => {
    c.savingsVsBaseline = baselineEmissions > 0
      ? Math.round(((baselineEmissions - c.estimatedEmissions) / baselineEmissions) * 100)
      : 0;
  });
  
  const optimized = allCandidates[0] || baseline;
  const emissionsReduction = baselineEmissions - optimized.estimatedEmissions;
  const reductionPercent = baselineEmissions > 0
    ? Math.round((emissionsReduction / baselineEmissions) * 100)
    : 0;
  
  return {
    baseline,
    optimized,
    allCandidates: allCandidates.slice(0, 20), // Top 20
    emissionsReduction,
    reductionPercent,
  };
}

/** Format gCO2 to human-readable */
export function formatEmissions(gCO2: number): string {
  if (gCO2 >= 1_000_000) return `${(gCO2 / 1_000_000).toFixed(2)} tCO₂`;
  if (gCO2 >= 1_000) return `${(gCO2 / 1_000).toFixed(1)} kgCO₂`;
  return `${gCO2} gCO₂`;
}

export function getIntensityLevel(intensity: number): 'low' | 'medium' | 'high' {
  if (intensity < 150) return 'low';
  if (intensity < 400) return 'medium';
  return 'high';
}
