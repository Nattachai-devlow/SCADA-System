import type { ComponentType } from "react";
import Pump3D from "./Pump3D";
import FilterTank3D from "./FilterTank3D";
import HeatExchanger3D from "./HeatExchanger3D";
import Sensor3D from "./Sensor3D";
import Valve3D from "./Valve3D";
import GenericMachine3D from "./GenericMachine3D";

export type MachineVisualProps = {
  id: string;
  name: string;
  running: boolean;
};

/* machines.machine_type is a free-text column with no CHECK constraint,
   so the same machine may already be stored under an older label.
   Keys are compared lowercased with whitespace collapsed. */
const VISUALS: Record<string, ComponentType<MachineVisualProps>> = {
  pump: Pump3D,
  filter: FilterTank3D,
  "sand filter": FilterTank3D,
  "filter tank": FilterTank3D,
  heater: HeatExchanger3D,
  heat: HeatExchanger3D,
  "heat pump": HeatExchanger3D,
  "heat exchanger": HeatExchanger3D,
  sensor: Sensor3D,
  valve: Valve3D,
};

export function getMachineVisual(type: string | null | undefined) {
  const key = (type ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return VISUALS[key] ?? GenericMachine3D;
}
