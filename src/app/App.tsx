// ============================================================
// AutoGuard AI — Complete Production Implementation
// Autonomous Vehicle Intelligence Platform
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
// emailjs replaced by backend
import {
  Car, Cpu, Activity, Brain, Shield, Wrench, Bell, AlertTriangle,
  CheckCircle, Thermometer, Battery, Droplets, ChevronRight,
  Package, Calendar, Mail, User, Navigation, AlertOctagon,
  BarChart2, Settings, Hash, Phone, RefreshCw, Wifi,
  ArrowRight, Eye, MessageSquare,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Vehicle {
  ownerName: string;
  ownerEmail: string;
  phone: string;
  serviceCenterEmail: string;
  vehicleNumber: string;
  manufacturer: string;
  model: string;
  year: string;
  currentMileage: string;
}

interface Telemetry {
  engineTemp: number;
  batteryPercent: number;
  oilLevel: "Normal" | "Fair" | "Low" | "Critical";
  mileage: number;
  brakeHealth: "Good" | "Fair" | "Poor" | "Critical";
  dtc: string | null;
  timestamp: string;
}

interface AgentData {
  commander?: {
    overallHealth: string;
    priority: string;
    summary: string;
    recommendedNextAction: string;
  };
  faultvision?: {
    rootCause: string;
    severity: string;
    faultDescription: string;
    affectedComponents: string[];
  };
  lifepulse?: {
    remainingUsefulLife: string;
    maintenanceWindow: string;
    riskPercentage: number;
  };
  driveassist?: {
    drivingRecommendation: string;
    safe: boolean;
    speedAdvice: string;
    emergencyFlag: boolean;
  };
  servicesync?: {
    nearestServiceDate: string;
    estimatedTime: string;
    estimatedCost: string;
    googleCalendarStatus: string;
    emailStatus: string;
  };
  careconnect?: {
    customerEmail: string;
    smsStatus: string;
    ownerNotification: string;
  };
  shieldwatch?: {
    warrantyStatus: string;
    recallAlerts: string[];
    coverage: string;
  };
  partslink?: {
    requiredParts: string[];
    availability: string;
    priority: string;
    inspectionItems: string[];
  };
  insightforge?: {
    failureTrend: string;
    designImprovement: string;
    reliabilityImpact: string;
    futureMonitoring: string;
  };
}

interface ConsoleEntry {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "agent";
}

// ============================================================
// CONSTANTS
// ============================================================

const N8N_WEBHOOK_URL = "https://srividha.app.n8n.cloud/webhook/vehicle-register";
const TELEMETRY_INTERVAL_MS = 20000;
const FAULT_CODES = ["P0217", "P0116", "P0420", "C0031", "B1325", "U0100", "P0171", "P0300"];

// ============================================================
// EMAILJS CONFIGURATION
// ============================================================

const EMAILJS_SERVICE_ID     = "service_zhymees";
const EMAILJS_FAULT_TEMPLATE = "template_51cjf4w";
const EMAILJS_SVC_TEMPLATE   = "template_bzprb55";
const EMAILJS_PUBLIC_KEY     = "1fBKgyawJ7Ks_vZCy";

const EMAIL_READY = !EMAILJS_PUBLIC_KEY.startsWith("your_");

// ============================================================
// ECU SIMULATOR
// ============================================================

function generateTelemetry(baseMileage: number, cycle: number): Telemetry {
  // Cycles 0-1: always clean (healthy startup)
  // Cycle 2: guaranteed fault — so demo users see it after ~10 seconds
  // Cycle 3+: low random chance, simulates real-world occasional faults
  const faultChance = cycle < 2 ? 0 : cycle === 2 ? 1 : 0.12;
  const isFaulty   = Math.random() < faultChance;
  const isCritical = isFaulty && Math.random() < 0.3;
  return {
    engineTemp: isCritical
      ? 108 + Math.floor(Math.random() * 12)
      : isFaulty
      ? 96 + Math.floor(Math.random() * 8)
      : 78 + Math.floor(Math.random() * 14),
    batteryPercent: isFaulty
      ? 25 + Math.floor(Math.random() * 25)
      : 88 + Math.floor(Math.random() * 10),
    oilLevel: isCritical ? "Critical" : isFaulty ? "Low" : Math.random() < 0.05 ? "Fair" : "Normal",
    mileage: baseMileage + Math.floor(Math.random() * 6),
    brakeHealth: isCritical ? "Critical" : isFaulty ? "Poor" : Math.random() < 0.05 ? "Fair" : "Good",
    dtc: isFaulty ? FAULT_CODES[Math.floor(Math.random() * FAULT_CODES.length)] : null,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// MOCK AGENT RESPONSE GENERATOR
// ============================================================

function generateMockResponse(vehicle: Vehicle, tele: Telemetry): AgentData {
  const hasFault = tele.dtc !== null;
  const isOverheat = tele.engineTemp > 105;
  const isCritical = isOverheat || tele.oilLevel === "Critical";
  const health = isCritical
    ? 35 + Math.floor(Math.random() * 18)
    : hasFault
    ? 52 + Math.floor(Math.random() * 18)
    : 79 + Math.floor(Math.random() * 17);
  const warrantyActive = parseInt(vehicle.year) >= 2022;

  return {
    commander: {
      overallHealth: `${health}%`,
      priority: isCritical ? "CRITICAL" : hasFault ? "HIGH" : "NORMAL",
      summary: isCritical
        ? `Critical fault: ${tele.dtc}. Engine ${tele.engineTemp}°C. Oil ${tele.oilLevel}. Immediate action required.`
        : hasFault
        ? `Fault ${tele.dtc} detected. Engine ${tele.engineTemp}°C elevated. Service required within 48 h.`
        : "All primary systems nominal. Routine monitoring active. Next service in ~2,500 km.",
      recommendedNextAction: isCritical
        ? "STOP VEHICLE — contact service center immediately"
        : hasFault
        ? "Schedule service within 24–48 hours"
        : "Continue normal operation. Monitor telemetry.",
    },
    faultvision: {
      rootCause: hasFault
        ? isOverheat
          ? "Cooling system failure — thermostat blockage or coolant leak suspected"
          : "ECM sensor anomaly in engine management circuit"
        : "No active fault codes detected",
      severity: isCritical ? "CRITICAL" : hasFault ? "MODERATE" : "NONE",
      faultDescription: hasFault
        ? `DTC ${tele.dtc}: ${isOverheat ? "Engine over-temp — coolant exceeds threshold" : "Abnormal reading in monitored sensor circuit"}`
        : "All diagnostic checks passed",
      affectedComponents: hasFault
        ? isOverheat
          ? ["Thermostat", "Coolant System", "Radiator", "Water Pump"]
          : ["ECM Module", "O2 Sensor", "Air-Fuel Control"]
        : [],
    },
    lifepulse: {
      remainingUsefulLife: hasFault
        ? `${11 + Math.floor(Math.random() * 10)}k km`
        : `${35 + Math.floor(Math.random() * 25)}k km`,
      maintenanceWindow: hasFault ? "Within 1–2 weeks" : `${2 + Math.floor(Math.random() * 5)} months`,
      riskPercentage: isCritical
        ? 72 + Math.floor(Math.random() * 20)
        : hasFault
        ? 48 + Math.floor(Math.random() * 18)
        : 12 + Math.floor(Math.random() * 15),
    },
    driveassist: {
      drivingRecommendation: isCritical
        ? "STOP DRIVING — Pull over safely and shut off engine"
        : hasFault
        ? "Limit to essential trips. Proceed to nearest service center."
        : "Safe to drive. Maintain normal habits.",
      safe: !isCritical,
      speedAdvice: isCritical
        ? "Do not drive — tow vehicle if necessary"
        : hasFault
        ? "Max 60 km/h — avoid highway driving"
        : "No speed restrictions active",
      emergencyFlag: isCritical,
    },
    servicesync: {
      nearestServiceDate: hasFault
        ? new Date(Date.now() + 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : new Date(Date.now() + 28 * 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      estimatedTime: hasFault ? (isCritical ? "3–5 hours" : "2–3 hours") : "45 min",
      estimatedCost: hasFault ? (isCritical ? "$420 – $680" : "$280 – $420") : "$55 – $75",
      googleCalendarStatus: hasFault ? "Event Created" : "Routine reminder set",
      emailStatus: hasFault ? "Alert sent to service center" : "Routine update sent",
    },
    careconnect: {
      customerEmail: `Notification dispatched to ${vehicle.ownerEmail}`,
      smsStatus: `SMS delivered to ${vehicle.phone.slice(0, 5)}***`,
      ownerNotification: isCritical
        ? "URGENT: Emergency alert sent — immediate action required"
        : hasFault
        ? "Service alert sent — appointment recommended"
        : "Routine status report delivered",
    },
    shieldwatch: {
      warrantyStatus: warrantyActive
        ? "Active — Full Manufacturer Warranty"
        : "Expired — Extended plan available",
      recallAlerts:
        hasFault && Math.random() < 0.35
          ? [`Recall #NHTSA-${Math.floor(Math.random() * 90000 + 10000)} — Cooling System Inspection`]
          : [],
      coverage: warrantyActive ? "Powertrain · Electrical · Comprehensive" : "No active coverage",
    },
    partslink: {
      requiredParts: hasFault
        ? isOverheat
          ? ["Thermostat Assembly — OEM", "Coolant Flush Kit", "Water Pump Gasket Set"]
          : ["O2 Sensor — Upstream", "Air Filter — OEM Grade", "MAF Sensor Cleaner"]
        : [],
      availability: hasFault ? "In Stock — 1–2 business days" : "N/A — no parts required",
      priority: isCritical ? "URGENT" : hasFault ? "STANDARD" : "NONE",
      inspectionItems: ["Brake Fluid Level", "Transmission Fluid", "Tire Pressure", "Cabin Air Filter"],
    },
    insightforge: {
      failureTrend: `${vehicle.manufacturer} ${vehicle.model} (${vehicle.year}) — ${hasFault ? "above-average" : "below-average"} fault frequency for this mileage`,
      designImprovement: hasFault
        ? isOverheat
          ? "Coolant system redesign recommended — batch shows elevated thermostat failure rate"
          : "Enhanced sensor shielding recommended for EMI-prone environments"
        : "No design flags — vehicle within expected reliability parameters",
      reliabilityImpact: hasFault
        ? `Moderate — affects ~${8 + Math.floor(Math.random() * 18)}% of similar ${vehicle.year} units`
        : `High — top ${10 + Math.floor(Math.random() * 20)}th percentile for model year`,
      futureMonitoring: "Enhanced thermal & electrical monitoring active. 24-hour anomaly detection enabled.",
    },
  };
}

// ============================================================
// UTILITIES
// ============================================================

function fmtTime(d = new Date()) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function uid() { return Math.random().toString(36).slice(2, 8); }
function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

// ============================================================
// EMAIL SERVICE
// ============================================================

interface EmailResult { success: boolean; message: string; }
interface DualEmailResult { owner: EmailResult; service: EmailResult; }

function buildReportHTML(vehicle: Vehicle, tele: Telemetry, agents: AgentData, forOwner: boolean): string {
  const priority = agents.commander?.priority ?? "NORMAL";
  const severityColor = priority === "CRITICAL" ? "#dc2626" : priority === "HIGH" ? "#b45309" : "#166534";
  const severityBgColor = priority === "CRITICAL" ? "#fef2f2" : priority === "HIGH" ? "#fffbeb" : "#f0fdf4";
  const parts = agents.partslink?.requiredParts ?? [];
  const inspection = agents.partslink?.inspectionItems ?? [];
  const components = agents.faultvision?.affectedComponents ?? [];
  const recalls = agents.shieldwatch?.recallAlerts ?? [];
  const now = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  const section = (title: string) =>
    `<tr><td colspan="2" style="padding:18px 0 6px;"><div style="background:#f0f4fb;border-left:4px solid #1a3a6b;padding:7px 14px;font-family:monospace;font-size:11px;font-weight:700;color:#1a3a6b;letter-spacing:0.08em;text-transform:uppercase;">${title}</div></td></tr>`;

  const row = (label: string, value: string, color = "#1e293b") =>
    `<tr><td style="padding:5px 8px 5px 0;font-family:monospace;font-size:11px;color:#94a3b8;width:42%;vertical-align:top;">${label}</td><td style="padding:5px 0;font-family:monospace;font-size:11px;color:${color};font-weight:600;">${value}</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">

<div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,58,107,0.10);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a3a6b,#0f2744);padding:32px 36px 24px;">
    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.04em;">AutoGuard <span style="color:#c9a84c;">AI</span></div>
    <div style="font-size:9px;color:#c9a84c;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">Autonomous Vehicle Intelligence Platform</div>
    <div style="margin-top:18px;background:rgba(255,255,255,0.08);border-radius:8px;padding:14px 18px;display:inline-block;">
      <div style="font-size:9px;color:#93b4d8;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">FAULT DIAGNOSTIC REPORT</div>
      <div style="font-size:13px;color:#ffffff;font-weight:700;">${vehicle.manufacturer} ${vehicle.model} ${vehicle.year} &nbsp;·&nbsp; ${vehicle.vehicleNumber}</div>
      <div style="font-size:10px;color:#93b4d8;margin-top:3px;">${now}</div>
    </div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,#c9a84c,#e8c97a);"></div>

  <!-- Severity Banner -->
  <div style="background:${severityBgColor};border-bottom:1px solid ${severityColor}22;padding:14px 36px;display:flex;align-items:center;gap:12px;">
    <div style="width:10px;height:10px;border-radius:50%;background:${severityColor};flex-shrink:0;"></div>
    <div>
      <span style="font-family:monospace;font-size:11px;font-weight:800;color:${severityColor};letter-spacing:0.1em;">${priority} PRIORITY</span>
      <span style="font-family:monospace;font-size:11px;color:${severityColor};margin-left:12px;">DTC: ${tele.dtc ?? "None"}</span>
    </div>
    <div style="margin-left:auto;font-family:monospace;font-size:13px;font-weight:800;color:${severityColor};">Health: ${agents.commander?.overallHealth ?? "—"}</div>
  </div>

  <!-- Body -->
  <div style="padding:28px 36px;">
    <table style="width:100%;border-collapse:collapse;">

      ${section("Vehicle Information")}
      ${row("Owner", vehicle.ownerName)}
      ${row("Plate / VIN", vehicle.vehicleNumber)}
      ${row("Make / Model", `${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`)}
      ${row("Mileage at Report", `${tele.mileage.toLocaleString()} km`)}
      ${row("Owner Email", vehicle.ownerEmail)}
      ${row("Phone", vehicle.phone)}
      ${forOwner ? "" : row("Service Center", vehicle.serviceCenterEmail)}

      ${section("Fault Summary")}
      ${row("DTC Fault Code", tele.dtc ?? "None", tele.dtc ? "#dc2626" : "#166534")}
      ${row("Severity", priority, severityColor)}
      ${row("Overall Health", agents.commander?.overallHealth ?? "—", severityColor)}
      ${row("Summary", "")}
    </table>
    ${agents.commander?.summary ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-family:monospace;font-size:11px;color:#475569;line-height:1.7;margin-bottom:8px;">${agents.commander.summary}</div>` : ""}
    <table style="width:100%;border-collapse:collapse;">
      ${row("Recommended Action", agents.commander?.recommendedNextAction ?? "—", priority === "CRITICAL" ? "#dc2626" : "#1a3a6b")}

      ${section("Live Telemetry")}
    </table>

    <!-- Telemetry Grid -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <tr>
        ${[
          { label: "Engine Temp", value: `${tele.engineTemp}°C`, alert: tele.engineTemp > 105 },
          { label: "Battery", value: `${tele.batteryPercent}%`, alert: tele.batteryPercent < 30 },
          { label: "Oil Level", value: tele.oilLevel, alert: tele.oilLevel === "Critical" || tele.oilLevel === "Low" },
          { label: "Brake Health", value: tele.brakeHealth, alert: tele.brakeHealth === "Critical" || tele.brakeHealth === "Poor" },
        ].map(m => `
          <td style="width:25%;padding:4px;">
            <div style="background:${m.alert ? "#fef2f2" : "#f0f9ff"};border:1px solid ${m.alert ? "#fecaca" : "#bae6fd"};border-radius:8px;padding:10px 12px;text-align:center;">
              <div style="font-family:monospace;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;">${m.label}</div>
              <div style="font-family:monospace;font-size:15px;font-weight:800;color:${m.alert ? "#dc2626" : "#1e40af"};">${m.value}</div>
            </div>
          </td>`).join("")}
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;">
      ${section("AI Fault Diagnosis")}
      ${row("Fault Description", agents.faultvision?.faultDescription ?? "No active faults")}
      ${row("Root Cause", agents.faultvision?.rootCause ?? "—")}
      ${components.length ? row("Affected Components", components.join(", "), "#b45309") : ""}

      ${section("Maintenance & Lifecycle")}
      ${row("Remaining Useful Life", agents.lifepulse?.remainingUsefulLife ?? "—", "#1a3a6b")}
      ${row("Maintenance Window", agents.lifepulse?.maintenanceWindow ?? "—")}
      ${row("Risk Level", `${agents.lifepulse?.riskPercentage ?? 0}%`, (agents.lifepulse?.riskPercentage ?? 0) > 65 ? "#dc2626" : "#b45309")}

      ${section("Service Appointment")}
      ${row("Appointment Date", agents.servicesync?.nearestServiceDate ?? "TBD", "#1a3a6b")}
      ${row("Estimated Duration", agents.servicesync?.estimatedTime ?? "—")}
      ${row("Estimated Cost", agents.servicesync?.estimatedCost ?? "—", "#166534")}

      ${section("Driving Safety")}
      ${row("Safe to Drive", agents.driveassist?.safe ? "YES" : "NO", agents.driveassist?.safe ? "#166534" : "#dc2626")}
      ${row("Speed Advice", agents.driveassist?.speedAdvice ?? "—")}
    </table>

    ${agents.driveassist?.drivingRecommendation ? `<div style="background:${agents.driveassist.emergencyFlag ? "#fef2f2" : "#f0fdf4"};border:1px solid ${agents.driveassist.emergencyFlag ? "#fecaca" : "#bbf7d0"};border-radius:8px;padding:12px 14px;font-family:monospace;font-size:11px;color:${agents.driveassist.emergencyFlag ? "#dc2626" : "#166534"};line-height:1.7;margin:8px 0;">${agents.driveassist.drivingRecommendation}</div>` : ""}

    <table style="width:100%;border-collapse:collapse;">
      ${!forOwner && parts.length ? `${section("Required Parts")}${parts.map(p => row("•", p, "#b45309")).join("")}` : ""}
      ${!forOwner && inspection.length ? `${section("Inspection Checklist")}${inspection.map(i => row("•", i)).join("")}` : ""}

      ${section("Warranty & Recall")}
      ${row("Warranty Status", agents.shieldwatch?.warrantyStatus ?? "—", agents.shieldwatch?.warrantyStatus?.includes("Active") ? "#166534" : "#b45309")}
      ${row("Coverage", agents.shieldwatch?.coverage ?? "—")}
    </table>

    ${recalls.length ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 14px;font-family:monospace;font-size:11px;color:#92400e;line-height:1.7;margin:8px 0;"><strong>⚠ RECALL ALERT:</strong> ${recalls[0]}</div>` : ""}

  </div>

  <!-- Footer -->
  <div style="background:#1a3a6b;padding:18px 36px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:monospace;font-size:9px;color:#93b4d8;">AutoGuard AI — Autonomous Vehicle Intelligence</div>
    <div style="font-family:monospace;font-size:9px;color:#c9a84c;">CONFIDENTIAL</div>
  </div>

</div>

</body>
</html>`;
}

function buildOwnerParams(vehicle: Vehicle, tele: Telemetry, agents: AgentData) {
  return {
    to_name:           vehicle.ownerName,
    to_email:          vehicle.ownerEmail,
    reply_to:          "autoguard-noreply@autoguard.ai",
    vehicle_number:    vehicle.vehicleNumber,
    vehicle_make:      `${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`,
    fault_code:        tele.dtc ?? "None",
    severity:          agents.commander?.priority ?? "NORMAL",
    engine_temp:       `${tele.engineTemp}°C`,
    battery_level:     `${tele.batteryPercent}%`,
    oil_level:         tele.oilLevel,
    brake_health:      tele.brakeHealth,
    fault_description: agents.faultvision?.faultDescription ?? "No active faults",
    action_required:   agents.commander?.recommendedNextAction ?? "Continue monitoring",
    appointment_date:  agents.servicesync?.nearestServiceDate ?? "TBD",
    estimated_cost:    agents.servicesync?.estimatedCost ?? "TBD",
    estimated_time:    agents.servicesync?.estimatedTime ?? "TBD",
    remaining_life:    agents.lifepulse?.remainingUsefulLife ?? "TBD",
    maintenance_window: agents.lifepulse?.maintenanceWindow ?? "TBD",
    risk_percentage:   `${agents.lifepulse?.riskPercentage ?? 0}%`,
    report_body:       buildReportHTML(vehicle, tele, agents, true),
  };
}

function buildServiceParams(vehicle: Vehicle, tele: Telemetry, agents: AgentData) {
  const parts = agents.partslink?.requiredParts?.length
    ? agents.partslink.requiredParts.join("\n• ")
    : "No parts required";
  const inspection = agents.partslink?.inspectionItems?.length
    ? agents.partslink.inspectionItems.join("\n• ")
    : "Standard inspection";
  const components = agents.faultvision?.affectedComponents?.length
    ? agents.faultvision.affectedComponents.join(", ")
    : "None";

  return {
    to_name:             "Service Center Team",
    to_email:            vehicle.serviceCenterEmail,
    reply_to:            vehicle.ownerEmail,
    vehicle_number:      vehicle.vehicleNumber,
    vehicle_make:        `${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`,
    owner_name:          vehicle.ownerName,
    owner_phone:         vehicle.phone,
    fault_code:          tele.dtc ?? "None",
    severity:            agents.commander?.priority ?? "NORMAL",
    engine_temp:         `${tele.engineTemp}°C`,
    battery_level:       `${tele.batteryPercent}%`,
    oil_level:           tele.oilLevel,
    brake_health:        tele.brakeHealth,
    fault_description:   agents.faultvision?.faultDescription ?? "No active faults",
    root_cause:          agents.faultvision?.rootCause ?? "Under investigation",
    affected_components: components,
    required_parts:      `• ${parts}`,
    inspection_items:    `• ${inspection}`,
    parts_availability:  agents.partslink?.availability ?? "Check inventory",
    appointment_date:    agents.servicesync?.nearestServiceDate ?? "TBD",
    estimated_time:      agents.servicesync?.estimatedTime ?? "TBD",
    action_required:     agents.commander?.recommendedNextAction ?? "Inspect vehicle",
    report_body:         buildReportHTML(vehicle, tele, agents, false),
  };
}

const BACKEND_URL = "http://localhost:3001";

async function sendBothFaultEmails(vehicle: Vehicle, tele: Telemetry, agents: AgentData): Promise<DualEmailResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/send-fault-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle, telemetry: tele, agents }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      owner:   data.owner   ?? { success: false, message: "No response" },
      service: data.service ?? { success: false, message: "No response" },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AutoGuard] Backend email error:", msg);
    return {
      owner:   { success: false, message: `Backend error: ${msg.slice(0, 80)}` },
      service: { success: false, message: `Backend error: ${msg.slice(0, 80)}` },
    };
  }
}

// ============================================================
// COLOR UTILITIES
// ============================================================

function severityBg(s: string) {
  if (s === "CRITICAL" || s === "URGENT") return "bg-red-50 border-red-200 text-red-700";
  if (s === "HIGH" || s === "MODERATE" || s === "UNSAFE") return "bg-amber-50 border-amber-200 text-amber-700";
  if (s === "NONE" || s === "NORMAL" || s === "SAFE") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  return "bg-blue-50 border-blue-200 text-blue-700";
}
function tempColor(t: number) { return t > 105 ? "text-red-600" : t > 95 ? "text-amber-600" : "text-emerald-600"; }
function battColor(b: number) { return b < 30 ? "text-red-600" : b < 55 ? "text-amber-600" : "text-emerald-600"; }
function oilColor(o: string) { return o === "Critical" ? "text-red-600" : o === "Low" ? "text-amber-600" : o === "Fair" ? "text-yellow-600" : "text-emerald-600"; }
function brakeColor(b: string) { return b === "Critical" ? "text-red-600" : b === "Poor" ? "text-amber-600" : b === "Fair" ? "text-yellow-600" : "text-emerald-600"; }

// ============================================================
// STYLE TOKENS
// ============================================================

const NAVY = "#1a3a6b";
const GOLD  = "#c9a84c";

const glass: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(26,58,107,0.1)",
  boxShadow: "0 1px 4px rgba(26,58,107,0.05), 0 6px 24px rgba(26,58,107,0.07)",
};
const glassActive: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(26,58,107,0.22)",
  boxShadow: "0 4px 28px rgba(26,58,107,0.13), 0 1px 4px rgba(26,58,107,0.06)",
};
const monoFont = { fontFamily: "'JetBrains Mono', monospace" } as React.CSSProperties;
const displayFont = { fontFamily: "'Plus Jakarta Sans', sans-serif" } as React.CSSProperties;

// icon accent background
const iconBg: React.CSSProperties = {
  background: "rgba(26,58,107,0.07)",
  border: "1px solid rgba(26,58,107,0.14)",
};

// ============================================================
// SHARED SUBCOMPONENTS
// ============================================================

function DataRow({
  label, value, valueClass = "text-slate-700",
}: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-400 shrink-0" style={monoFont}>{label}</span>
      <span className={`text-xs text-right font-medium ${valueClass}`} style={monoFont}>{value}</span>
    </div>
  );
}

function AgentCard({
  title, icon, status, active, children,
}: {
  title: string; icon: React.ReactNode; status?: string; active?: boolean; children: React.ReactNode;
}) {
  return (
    <motion.div layout className="rounded-2xl p-7 flex flex-col gap-5 relative overflow-hidden h-full" style={{ ...(active ? glassActive : glass), minHeight: "240px" }}>
      {active && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: "linear-gradient(135deg, rgba(26,58,107,0.04), transparent 60%)" }}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={iconBg}>
            <span style={{ color: NAVY }}>{icon}</span>
          </div>
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase" style={displayFont}>{title}</span>
        </div>
        {status && (
          <span className={`text-xs px-3 py-1 rounded-full border font-bold ${severityBg(status)}`} style={monoFont}>{status}</span>
        )}
        {!status && active && (
          <span className="text-xs px-3 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-700 font-bold" style={monoFont}>ACTIVE</span>
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1">{children}</div>
    </motion.div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-8">
      <motion.span className="text-sm text-slate-400" style={monoFont} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}>
        {text}
      </motion.span>
    </div>
  );
}

// ============================================================
// AGENT CARDS
// ============================================================

function CommanderCard({ data }: { data?: AgentData["commander"] }) {
  const h = data ? parseInt(data.overallHealth ?? "0") : null;
  const hc = h !== null ? (h < 50 ? "text-red-600" : h < 70 ? "text-amber-600" : "text-emerald-600") : "text-slate-400";
  const summary = data?.summary ?? "";
  const action = data?.recommendedNextAction ?? "";
  return (
    <AgentCard title="Commander" icon={<Brain size={15} />} status={data?.priority} active={!!data}>
      {data ? (
        <>
          <div className="text-center py-3">
            <div className={`text-5xl font-bold ${hc}`} style={monoFont}>{data.overallHealth ?? "—"}</div>
            <div className="text-[10px] text-slate-400 tracking-widest uppercase mt-1" style={monoFont}>Overall Health Score</div>
          </div>
          <DataRow label="Summary" value={<span className="text-slate-600 text-left leading-relaxed">{summary.slice(0, 90)}{summary.length > 90 ? "…" : ""}</span>} />
          <DataRow label="Action" value={action.slice(0, 55)} valueClass={data.priority === "CRITICAL" ? "text-red-600" : "text-blue-700"} />
        </>
      ) : <Placeholder text="Awaiting orchestration…" />}
    </AgentCard>
  );
}

function FaultVisionCard({ data }: { data?: AgentData["faultvision"] }) {
  const desc = data?.faultDescription ?? "";
  const root = data?.rootCause ?? "";
  const components = data?.affectedComponents ?? [];
  return (
    <AgentCard title="FaultVision" icon={<Eye size={15} />} status={data?.severity} active={!!data && data.severity !== "NONE"}>
      {data ? (
        <>
          <div className={`text-xs px-3 py-2.5 rounded-xl border leading-relaxed ${severityBg(data.severity ?? "NONE")}`} style={monoFont}>
            {desc.slice(0, 70)}
          </div>
          <DataRow label="Root Cause" value={root.slice(0, 60)} />
          {components.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5" style={monoFont}>Affected Components</div>
              <div className="flex flex-wrap gap-1.5">
                {components.map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700" style={monoFont}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : <Placeholder text="Scanning diagnostics…" />}
    </AgentCard>
  );
}

function LifePulseCard({ data }: { data?: AgentData["lifepulse"] }) {
  const r = data?.riskPercentage ?? 0;
  const rc = r > 65 ? "bg-red-500" : r > 40 ? "bg-amber-400" : "bg-emerald-500";
  const rtc = r > 65 ? "text-red-600" : r > 40 ? "text-amber-600" : "text-emerald-600";
  return (
    <AgentCard title="LifePulse" icon={<Activity size={15} />} active={!!data}>
      {data ? (
        <>
          <DataRow label="Remaining Life" value={data.remainingUsefulLife} valueClass="text-blue-700" />
          <DataRow label="Maint. Window" value={data.maintenanceWindow} />
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-slate-400" style={monoFont}>Risk Level</span>
              <span className={`text-xs font-semibold ${rtc}`} style={monoFont}>{r}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-100">
              <motion.div className={`h-full rounded-full ${rc}`} initial={{ width: 0 }} animate={{ width: `${r}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
            </div>
          </div>
        </>
      ) : <Placeholder text="Predicting maintenance…" />}
    </AgentCard>
  );
}

function DriveAssistCard({ data }: { data?: AgentData["driveassist"] }) {
  const st = data?.emergencyFlag ? "CRITICAL" : data?.safe === false ? "UNSAFE" : data ? "SAFE" : undefined;
  const rec = data?.drivingRecommendation ?? "";
  const speed = data?.speedAdvice ?? "";
  return (
    <AgentCard title="DriveAssist" icon={<Navigation size={13} />} status={st} active={!!data && (!data.safe || !!data.emergencyFlag)}>
      {data ? (
        <>
          <div className={`text-[11px] px-3 py-2 rounded-lg text-center leading-relaxed border ${
            data.emergencyFlag
              ? "bg-red-50 text-red-700 border-red-200"
              : data.safe
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`} style={monoFont}>
            {rec.slice(0, 70)}
          </div>
          <DataRow label="Speed Advice" value={speed} valueClass={data.emergencyFlag ? "text-red-600" : "text-slate-700"} />
          {data.emergencyFlag && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertOctagon size={11} className="text-red-600 shrink-0" />
              <span className="text-[10px] text-red-700" style={monoFont}>Emergency — Immediate Action</span>
            </div>
          )}
        </>
      ) : <Placeholder text="Evaluating safety…" />}
    </AgentCard>
  );
}

function ServiceSyncCard({ data }: { data?: AgentData["servicesync"] }) {
  return (
    <AgentCard title="ServiceSync" icon={<Calendar size={13} />} active={!!data}>
      {data ? (
        <>
          <DataRow label="Appointment" value={data.nearestServiceDate ?? "TBD"} valueClass="text-blue-700" />
          <DataRow label="Duration"    value={data.estimatedTime ?? "—"} />
          <DataRow label="Est. Cost"   value={data.estimatedCost ?? "—"} valueClass="text-emerald-600" />
          <DataRow label="Calendar"    value={data.googleCalendarStatus ?? "—"} valueClass="text-blue-700" />
          <DataRow label="Email"       value={data.emailStatus ?? "—"} />
        </>
      ) : <Placeholder text="Scheduling service…" />}
    </AgentCard>
  );
}

function CareConnectCard({
  data,
  dualEmail,
  emailSending,
}: {
  data?: AgentData["careconnect"];
  dualEmail?: DualEmailResult | null;
  emailSending?: boolean;
}) {
  const EmailRow = ({ label, result }: { label: string; result?: EmailResult }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <Mail size={10} className={`mt-0.5 shrink-0 ${
        emailSending ? "text-blue-600 animate-pulse"
        : result?.success ? "text-emerald-600"
        : result ? "text-red-600"
        : "text-slate-400"
      }`} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] text-slate-400 uppercase tracking-widest" style={monoFont}>{label}</span>
        {emailSending ? (
          <motion.span className="text-[10px] text-blue-700" style={monoFont} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}>
            Sending…
          </motion.span>
        ) : result ? (
          <span className={`text-[10px] leading-relaxed break-all ${result.success ? "text-emerald-700" : "text-red-700"}`} style={monoFont}>
            {result.success ? "✓ " : "✗ "}{result.message}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400" style={monoFont}>
            {EMAIL_READY ? "Awaiting fault…" : "Configure EmailJS"}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <AgentCard title="CareConnect" icon={<MessageSquare size={13} />} active={!!data}>
      {data ? (
        <>
          <DataRow label="Alert" value={(data.ownerNotification ?? "").slice(0, 48)} valueClass="text-blue-700" />
          <DataRow label="SMS" value={data.smsStatus ?? "—"} valueClass="text-emerald-600" />
          <div className="rounded-lg px-2.5 py-1.5 mt-0.5 flex flex-col" style={{ background: "rgba(26,58,107,0.03)", border: "1px solid rgba(26,58,107,0.08)" }}>
            <EmailRow label="Owner Email" result={dualEmail?.owner} />
            <EmailRow label="Service Email" result={dualEmail?.service} />
          </div>
          {!EMAIL_READY && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle size={9} className="text-amber-600 shrink-0" />
              <span className="text-[9px] text-amber-700" style={monoFont}>Set EMAILJS_* keys in App.tsx</span>
            </div>
          )}
        </>
      ) : <Placeholder text="Notifying owner…" />}
    </AgentCard>
  );
}

function ShieldWatchCard({ data }: { data?: AgentData["shieldwatch"] }) {
  const warranty = data?.warrantyStatus ?? "";
  const recalls = data?.recallAlerts ?? [];
  return (
    <AgentCard title="ShieldWatch" icon={<Shield size={13} />} active={!!data}>
      {data ? (
        <>
          <DataRow label="Warranty" value={warranty || "—"} valueClass={warranty.includes("Active") ? "text-emerald-600" : "text-amber-600"} />
          <DataRow label="Coverage" value={data.coverage ?? "—"} />
          {recalls.length > 0 ? (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              <AlertTriangle size={11} className="text-amber-600 mt-0.5 shrink-0" />
              <span className="text-[10px] text-amber-700 leading-relaxed" style={monoFont}>{recalls[0]}</span>
            </div>
          ) : (
            <DataRow label="Recalls" value="No active recalls" valueClass="text-emerald-600" />
          )}
        </>
      ) : <Placeholder text="Checking warranty…" />}
    </AgentCard>
  );
}

function PartsLinkCard({ data }: { data?: AgentData["partslink"] }) {
  const parts = data?.requiredParts ?? [];
  const items = data?.inspectionItems ?? [];
  const avail = data?.availability ?? "";
  return (
    <AgentCard title="PartsLink" icon={<Package size={13} />} status={data?.priority !== "NONE" ? data?.priority : undefined} active={!!data && data?.priority !== "NONE"}>
      {data ? (
        <>
          {parts.length > 0 ? (
            <div>
              <div className="text-[9px] text-slate-400 mb-1" style={monoFont}>Required Parts</div>
              {parts.map((p) => (
                <div key={p} className="text-[10px] text-amber-700 py-0.5 flex items-center gap-1.5" style={monoFont}>
                  <ChevronRight size={9} />{p}
                </div>
              ))}
            </div>
          ) : (
            <DataRow label="Parts" value="None required" valueClass="text-emerald-600" />
          )}
          <DataRow label="Availability" value={avail || "—"} valueClass={avail.includes("Stock") ? "text-emerald-600" : "text-slate-500"} />
          <div>
            <div className="text-[9px] text-slate-400 mb-1" style={monoFont}>Inspect Also</div>
            {items.slice(0, 3).map((i) => (
              <div key={i} className="text-[10px] text-slate-500 py-0.5 flex items-center gap-1.5" style={monoFont}>
                <ChevronRight size={9} />{i}
              </div>
            ))}
          </div>
        </>
      ) : <Placeholder text="Checking inventory…" />}
    </AgentCard>
  );
}

function InsightForgeCard({ data }: { data?: AgentData["insightforge"] }) {
  const trend    = data?.failureTrend ?? "";
  const improve  = data?.designImprovement ?? "";
  const reliable = data?.reliabilityImpact ?? "";
  const monitor  = data?.futureMonitoring ?? "";
  return (
    <AgentCard title="InsightForge" icon={<BarChart2 size={13} />} active={!!data}>
      {data ? (
        <>
          <DataRow label="Trend"       value={trend.slice(0, 55)} />
          <DataRow label="Improvement" value={improve.slice(0, 55)} valueClass="text-blue-700" />
          <DataRow label="Reliability" value={reliable.slice(0, 50)} valueClass={reliable.includes("top") ? "text-emerald-600" : "text-amber-600"} />
          <DataRow label="Monitoring"  value={monitor.slice(0, 50)} />
        </>
      ) : <Placeholder text="Analyzing patterns…" />}
    </AgentCard>
  );
}

// ============================================================
// DIAGNOSTIC CONSOLE
// ============================================================

function DiagnosticConsole({ entries }: { entries: ConsoleEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [entries]);

  const typeColor = (t: ConsoleEntry["type"]) => {
    if (t === "error")   return "text-red-600";
    if (t === "warning") return "text-amber-600";
    if (t === "success") return "text-emerald-700";
    if (t === "agent")   return "text-blue-700";
    return "text-slate-500";
  };
  const typeTag = (t: ConsoleEntry["type"]) => {
    if (t === "error")   return "[ERR]";
    if (t === "warning") return "[WRN]";
    if (t === "success") return "[ OK]";
    if (t === "agent")   return "[AGT]";
    return "[SYS]";
  };

  return (
    <div className="rounded-2xl flex flex-col" style={{ ...glass, height: "480px" }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-sm text-slate-500 tracking-widest uppercase ml-1 font-semibold" style={monoFont}>Diagnostic Console</span>
        <div className="ml-auto flex items-center gap-2">
          <motion.div className="w-2.5 h-2.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <span className="text-sm text-emerald-700 font-bold" style={monoFont}>LIVE</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5 bg-slate-50/50 rounded-b-2xl" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }} className="flex items-start gap-3 text-sm">
              <span className="text-slate-400 shrink-0 tabular-nums w-20" style={monoFont}>{e.time}</span>
              <span className={`shrink-0 w-10 font-semibold ${typeColor(e.type)}`} style={monoFont}>{typeTag(e.type)}</span>
              <span className={typeColor(e.type)} style={monoFont}>{e.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ============================================================
// PIPELINE TIMELINE
// ============================================================

const STEPS = [
  { label: "Vehicle Registered",   icon: <Car size={11} /> },
  { label: "ECU Online",           icon: <Cpu size={11} /> },
  { label: "Telemetry Received",   icon: <Activity size={11} /> },
  { label: "AI Analysis",          icon: <Brain size={11} /> },
  { label: "Maintenance Prediction", icon: <Wrench size={11} /> },
  { label: "Appointment Scheduled", icon: <Calendar size={11} /> },
  { label: "Customer Notified",    icon: <Bell size={11} /> },
  { label: "Completed",            icon: <CheckCircle size={11} /> },
];

function PipelineTimeline({ step }: { step: number }) {
  return (
    <div className="rounded-2xl p-7 flex flex-col" style={{ ...glass, height: "480px" }}>
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 shrink-0">
        <motion.div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: NAVY }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="text-sm text-slate-500 tracking-widest uppercase font-semibold" style={monoFont}>Analysis Pipeline</span>
      </div>
      <div className="flex flex-col justify-between flex-1">
        {STEPS.map((s, i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center gap-3 relative">
              {i < STEPS.length - 1 && (
                <div
                  className="absolute left-[13px] top-7 w-0.5"
                  style={{ height: "calc(100% + 2px)", background: done ? "rgba(26,58,107,0.45)" : "rgba(26,58,107,0.08)" }}
                />
              )}
              <motion.div
                className="rounded-full flex items-center justify-center shrink-0 z-10"
                style={{
                  width: 26, height: 26,
                  background: done ? "rgba(26,58,107,0.18)" : active ? "rgba(26,58,107,0.1)" : "rgba(26,58,107,0.04)",
                  border: `1.5px solid ${done ? "rgba(26,58,107,0.7)" : active ? "rgba(26,58,107,0.45)" : "rgba(26,58,107,0.12)"}`,
                }}
                animate={active ? { boxShadow: [`0 0 0px rgba(26,58,107,0.1)`, `0 0 16px rgba(26,58,107,0.4)`, `0 0 0px rgba(26,58,107,0.1)`] } : {}}
                transition={active ? { duration: 1.4, repeat: Infinity } : {}}
              >
                {done
                  ? <CheckCircle size={13} style={{ color: NAVY }} />
                  : <span style={{ color: active ? NAVY : "rgba(26,58,107,0.35)" }}>{s.icon}</span>}
              </motion.div>
              <span className="text-sm" style={{ ...monoFont, color: done ? "#475569" : active ? "#1a3a6b" : "#94a3b8", fontWeight: active ? 700 : 400 }}>
                {s.label}
              </span>
              {active && (
                <motion.div className="ml-auto w-2 h-2 rounded-full" style={{ background: NAVY }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TELEMETRY PANEL
// ============================================================

function TelemetryPanel({ tele, analyzing }: { tele: Telemetry | null; analyzing: boolean }) {
  const metrics = tele ? [
    { label: "Engine Temp",  value: `${tele.engineTemp}°C`,          color: tempColor(tele.engineTemp),  icon: <Thermometer size={12} /> },
    { label: "Battery",      value: `${tele.batteryPercent}%`,        color: battColor(tele.batteryPercent), icon: <Battery size={12} /> },
    { label: "Oil Level",    value: tele.oilLevel,                    color: oilColor(tele.oilLevel),     icon: <Droplets size={12} /> },
    { label: "Brake Health", value: tele.brakeHealth,                 color: brakeColor(tele.brakeHealth), icon: <Shield size={12} /> },
    { label: "Mileage",      value: `${tele.mileage.toLocaleString()} km`, color: "text-slate-600",      icon: <Navigation size={12} /> },
    { label: "DTC Code",     value: tele.dtc ?? "None",               color: tele.dtc ? "text-red-600" : "text-emerald-600", icon: <AlertTriangle size={12} /> },
  ] : [];

  return (
    <div className="rounded-2xl p-7" style={glass}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Activity size={16} style={{ color: NAVY }} />
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase" style={displayFont}>Live Telemetry</span>
        </div>
        <div className="flex items-center gap-2">
          {analyzing && (
            <motion.span className="text-xs text-blue-700 flex items-center gap-1.5" style={monoFont} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.7, repeat: Infinity }}>
              <RefreshCw size={11} className="animate-spin" /> Analyzing
            </motion.span>
          )}
          <motion.div className="w-2 h-2 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        </div>
      </div>
      {tele ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl px-5 py-4 flex flex-col gap-2" style={{ background: "rgba(26,58,107,0.04)", border: "1px solid rgba(26,58,107,0.08)" }}>
              <div className="flex items-center gap-2 text-slate-400">
                {m.icon}
                <span className="text-[10px] tracking-wide uppercase font-medium" style={monoFont}>{m.label}</span>
              </div>
              <span className={`text-xl font-bold leading-tight ${m.color}`} style={monoFont}>{m.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-28 flex items-center justify-center">
          <motion.span className="text-xs text-slate-400" style={monoFont} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}>
            Waiting for ECU data…
          </motion.span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ECU STATUS CARD
// ============================================================

function ECUStatusCard({ cycleCount, lastUpdate }: { cycleCount: number; lastUpdate: string }) {
  return (
    <div className="rounded-2xl p-7" style={glass}>
      <div className="flex items-center gap-2.5 mb-5">
        <Cpu size={16} style={{ color: NAVY }} />
        <span className="text-xs font-bold text-slate-700 tracking-wide uppercase" style={displayFont}>ECU Status</span>
      </div>
      <div className="flex flex-col gap-3.5">
        {[
          { label: "Connection",  value: "ONLINE",           vc: "text-emerald-700", pulse: true  },
          { label: "Protocol",    value: "OBD-II / CAN Bus", vc: "text-blue-700",    pulse: false },
          { label: "Cycle Count", value: String(cycleCount), vc: "text-blue-700",    pulse: false },
          { label: "Last Update", value: lastUpdate || "—",  vc: "text-slate-600",   pulse: false },
          { label: "Interval",    value: "20 seconds",       vc: "text-slate-600",   pulse: false },
          { label: "Mode",        value: "Autonomous",       vc: "text-blue-700",    pulse: false },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="text-xs text-slate-400" style={monoFont}>{r.label}</span>
            <div className="flex items-center gap-2">
              {r.pulse && <motion.div className="w-2 h-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
              <span className={`text-xs font-semibold ${r.vc}`} style={monoFont}>{r.value}</span>
            </div>
          </div>
        ))}
        <div className="h-1.5 rounded-full overflow-hidden mt-1 bg-slate-100">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${NAVY}, #3b6cb7)`, width: "50%" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VEHICLE PROFILE CARD
// ============================================================

function VehicleProfileCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="rounded-2xl p-7" style={glass}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Car size={16} style={{ color: NAVY }} />
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase" style={displayFont}>Vehicle Profile</span>
        </div>
        <span className="text-[10px] px-3 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold" style={monoFont}>REGISTERED</span>
      </div>
      <div className="flex flex-col gap-3.5">
        {[
          { label: "Owner",        value: vehicle.ownerName },
          { label: "Plate",        value: vehicle.vehicleNumber },
          { label: "Make / Model", value: `${vehicle.manufacturer} ${vehicle.model}` },
          { label: "Year",         value: vehicle.year },
          { label: "Mileage",      value: `${parseInt(vehicle.currentMileage).toLocaleString()} km` },
          { label: "Contact",      value: vehicle.phone },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="text-xs text-slate-400" style={monoFont}>{r.label}</span>
            <span className="text-xs font-semibold text-slate-700" style={monoFont}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD HEADER
// ============================================================

function DashboardHeader({ vehicle, demoMode }: { vehicle: Vehicle; demoMode: boolean }) {
  const [time, setTime] = useState(fmtTime());
  useEffect(() => {
    const id = setInterval(() => setTime(fmtTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 px-8 py-5 flex items-center justify-between gap-4"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(26,58,107,0.1)",
        boxShadow: "0 1px 20px rgba(26,58,107,0.07)",
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #0f2744)`, boxShadow: "0 2px 16px rgba(26,58,107,0.35)" }}
          >
            <Car size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xl font-bold leading-none" style={{ ...displayFont, color: NAVY, letterSpacing: "0.04em" }}>
              AutoGuard <span style={{ color: GOLD }}>AI</span>
            </div>
            <div className="text-xs text-slate-400 tracking-widest uppercase mt-1" style={monoFont}>Autonomous Intelligence Platform</div>
          </div>
        </div>
        <div className="hidden md:block w-px h-5 shrink-0" style={{ background: "rgba(26,58,107,0.1)" }} />
        <div className="hidden md:flex items-center gap-3 min-w-0">
          <Hash size={13} className="text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 truncate" style={monoFont}>{vehicle.vehicleNumber}</span>
          <span className="text-slate-300 shrink-0">·</span>
          <span className="text-sm text-slate-500 truncate" style={monoFont}>{vehicle.manufacturer} {vehicle.model} {vehicle.year}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {demoMode && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hidden lg:block font-medium" style={monoFont}>
            DEMO — Configure N8N Webhook
          </span>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)" }}>
          <Wifi size={13} className="text-emerald-600" />
          <motion.div className="w-2 h-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-xs text-emerald-700 font-semibold" style={monoFont}>ECU LIVE</span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block tabular-nums font-medium" style={monoFont}>{time}</span>
      </div>
    </header>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ vehicle }: { vehicle: Vehicle }) {
  const [tele, setTele] = useState<Telemetry | null>(null);
  const [agents, setAgents] = useState<AgentData>({});
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [dualEmail, setDualEmail] = useState<DualEmailResult | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const mileRef = useRef(parseInt(vehicle.currentMileage) || 24500);
  const cycleCountRef = useRef(0);
  const lastEmailedDTC = useRef<string | null>(null);
  const faultHandled = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const log = useCallback((message: string, type: ConsoleEntry["type"] = "info") => {
    setLogs((prev) => [...prev.slice(-100), { id: uid(), time: fmtTime(), message, type }]);
  }, []);

  // Boot sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      log("AutoGuard AI system initialized", "success");
      log(`Vehicle ${vehicle.vehicleNumber} registered — ${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`, "info");
      log("Virtual ECU simulator starting…", "info");
      setStep(0);
      toast.success("Vehicle Connected", { description: `${vehicle.manufacturer} ${vehicle.model} — ECU initializing` });
    }, 400);
    const t2 = setTimeout(() => {
      log("ECU handshake complete — OBD-II / CAN Bus protocol active", "success");
      log("Telemetry stream initialized — 20-second polling interval", "info");
      setStep(1);
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Main autonomous cycle
  useEffect(() => {
    const runCycle = async () => {
      const currentCycle = cycleCountRef.current;
      cycleCountRef.current += 1;
      const t = generateTelemetry(mileRef.current, currentCycle);
      mileRef.current = t.mileage;
      setTele(t);
      setLastUpdate(fmtTime());
      setCycles(cycleCountRef.current);
      setStep(2);

      log("Telemetry packet received from ECU", "info");
      log(`Eng:${t.engineTemp}°C  Batt:${t.batteryPercent}%  Oil:${t.oilLevel}  Brake:${t.brakeHealth}${t.dtc ? `  DTC:${t.dtc}` : ""}`, "info");

      if (t.dtc) {
        log(`⚠ FAULT DETECTED — DTC ${t.dtc} — Dispatching AI agents`, "warning");
        toast.error("Fault Detected", { description: `DTC ${t.dtc} — AI orchestration activated` });
      }

      setStep(3);
      setAnalyzing(true);
      log("Master Orchestrator — dispatching to 9 specialized agents", "agent");
      await delay(180);

      let result: AgentData;
      let isDemo = false;

      try {
        const res = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "telemetry_update", vehicle, telemetry: t }),
          signal: AbortSignal.timeout(11000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        result = await res.json();
      } catch {
        result = generateMockResponse(vehicle, t);
        isDemo = true;
      }

      setDemoMode(isDemo);

      log("Commander Agent — orchestration complete", "agent");
      await delay(110);
      log("FaultVision Agent — diagnostic scan complete", "agent");
      await delay(100);
      log("LifePulse Agent — predictive maintenance complete", "agent");
      await delay(100);
      setStep(4);
      log("DriveAssist Agent — safety evaluation complete", "agent");
      await delay(95);
      log("ServiceSync Agent — appointment scheduled", "agent");
      setStep(5);

      if (t.dtc && result.servicesync?.nearestServiceDate) {
        toast.info("Service Scheduled", { description: `Appointment: ${result.servicesync.nearestServiceDate} · Est. ${result.servicesync.estimatedCost}` });
      }

      await delay(90);
      log("CareConnect Agent — owner notified via email + SMS", "agent");
      setStep(6);
      await delay(85);
      log("ShieldWatch Agent — warranty & recall check complete", "agent");
      await delay(80);
      log("PartsLink Agent — parts recommendation ready", "agent");
      await delay(80);
      log("InsightForge Agent — manufacturer analytics generated", "agent");
      setStep(7);
      await delay(100);
      log("All agents complete — dashboard updated", "success");
      setStep(8);

      if (t.dtc && result.shieldwatch?.recallAlerts?.length) {
        toast.warning("Recall Alert", { description: result.shieldwatch.recallAlerts[0] });
      }
      if (result.careconnect) {
        log(result.careconnect.ownerNotification, "success");
      }

      setAgents(result);
      setAnalyzing(false);

      // Autonomous email dispatch — send once per vehicle
      if (t.dtc && !faultHandled.current) {
        lastEmailedDTC.current = t.dtc;
        setEmailSending(true);
        log(`CareConnect — fault ${t.dtc} detected — sending emails to owner & service center…`, "agent");

        const dual = await sendBothFaultEmails(vehicle, t, result);
        setEmailSending(false);
        setDualEmail(dual);

        if (dual.owner.success) {
          log(`✓ Owner email sent → ${vehicle.ownerEmail}`, "success");
          toast.success("Owner Notified", { description: dual.owner.message });
        } else {
          log(`Owner email: ${dual.owner.message}`, EMAIL_READY ? "error" : "warning");
        }

        if (dual.service.success) {
          log(`✓ Service center email sent → ${vehicle.serviceCenterEmail}`, "success");
          toast.success("Service Center Notified", { description: dual.service.message });
        } else {
          log(`Service email: ${dual.service.message}`, EMAIL_READY ? "error" : "warning");
        }

        faultHandled.current = true;
        log("Email dispatch complete — monitoring continues, no further emails will be sent.", "info");
      }

      setTimeout(() => setStep(2), 3500);
    };

    const first = setTimeout(runCycle, 2600);
    intervalRef.current = setInterval(runCycle, TELEMETRY_INTERVAL_MS);
    return () => { clearTimeout(first); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [vehicle, log]);

  const agentGrid = [
    <CommanderCard  key="cmd" data={agents.commander} />,
    <FaultVisionCard key="fv" data={agents.faultvision} />,
    <LifePulseCard  key="lp"  data={agents.lifepulse} />,
    <DriveAssistCard key="da" data={agents.driveassist} />,
    <ServiceSyncCard key="ss" data={agents.servicesync} />,
    <CareConnectCard key="cc" data={agents.careconnect} dualEmail={dualEmail} emailSending={emailSending} />,
    <ShieldWatchCard key="sw" data={agents.shieldwatch} />,
    <PartsLinkCard  key="pl"  data={agents.partslink} />,
    <InsightForgeCard key="if" data={agents.insightforge} />,
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f7fb" }}>
      <DashboardHeader vehicle={vehicle} demoMode={demoMode} />

      <main className="flex-1 px-6 md:px-10 py-8 space-y-8 w-full max-w-[1700px] mx-auto">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VehicleProfileCard vehicle={vehicle} />
          <ECUStatusCard cycleCount={cycles} lastUpdate={lastUpdate} />
          <TelemetryPanel tele={tele} analyzing={analyzing} />
        </div>

        {/* AI Operations Center */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: "rgba(26,58,107,0.1)" }} />
            <div className="flex items-center gap-2.5 px-5 py-2 rounded-full" style={{ border: `1px solid rgba(26,58,107,0.18)`, background: "rgba(26,58,107,0.05)" }}>
              <Brain size={13} style={{ color: NAVY }} />
              <span className="text-sm font-bold tracking-widest uppercase" style={{ ...monoFont, color: NAVY }}>AI Operations Center</span>
              {analyzing && (
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: NAVY }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
              )}
            </div>
            <div className="h-px flex-1" style={{ background: "rgba(26,58,107,0.1)" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {agentGrid.map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                {card}
              </motion.div>
            ))}
          </div>
        </div>

        {/* EmailJS Setup Banner */}
        {!EMAIL_READY && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}
          >
            <Mail size={16} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-amber-700 mb-1" style={displayFont}>Activate Live Email Notifications</div>
              <div className="text-[11px] text-amber-700/80 leading-relaxed" style={monoFont}>
                <span className="text-amber-700 font-semibold">Step 1</span> — Sign up free at{" "}
                <span className="text-amber-800">emailjs.com</span> and connect your Gmail or SMTP service.{"  "}
                <span className="text-amber-700 font-semibold">Step 2</span> — Create a template using variables:{" "}
                <span className="text-amber-800">{"{{to_name}}"}</span>,{" "}
                <span className="text-amber-800">{"{{fault_code}}"}</span>,{" "}
                <span className="text-amber-800">{"{{severity}}"}</span>.{"  "}
                <span className="text-amber-700 font-semibold">Step 3</span> — Paste your{" "}
                <span className="text-amber-800">Service ID</span>, <span className="text-amber-800">Template IDs</span> &{" "}
                <span className="text-amber-800">Public Key</span> into{" "}
                <span className="text-amber-800">EMAILJS_*</span> constants in <span className="text-amber-800">App.tsx</span>.
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <DiagnosticConsole entries={logs} />
          <PipelineTimeline step={step} />
        </div>
      </main>
    </div>
  );
}

// ============================================================
// REGISTRATION PAGE
// ============================================================

function RegistrationPage({ onSubmit }: { onSubmit: (v: Vehicle) => void }) {
  const empty: Vehicle = { ownerName: "", ownerEmail: "", phone: "", serviceCenterEmail: "", vehicleNumber: "", manufacturer: "", model: "", year: "", currentMileage: "" };
  const [form, setForm] = useState<Vehicle>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v.trim())) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "vehicle_registered", vehicle: form }) });
    } catch { /* proceed regardless */ }
    setTimeout(() => { setLoading(false); onSubmit(form); }, 1100);
  };

  const fields: { name: keyof Vehicle; label: string; placeholder: string; type: string; icon: React.ReactNode }[] = [
    { name: "ownerName",          label: "Owner Name",              placeholder: "Sarah Mitchell",         type: "text",   icon: <User size={13} /> },
    { name: "ownerEmail",         label: "Owner Email",             placeholder: "sarah@example.com",      type: "email",  icon: <Mail size={13} /> },
    { name: "phone",              label: "Phone Number",            placeholder: "+1 (555) 012-3456",      type: "tel",    icon: <Phone size={13} /> },
    { name: "serviceCenterEmail", label: "Service Center Email",    placeholder: "service@autocare.com",   type: "email",  icon: <Wrench size={13} /> },
    { name: "vehicleNumber",      label: "Vehicle / Plate Number",  placeholder: "MH-01-AB-1234",          type: "text",   icon: <Hash size={13} /> },
    { name: "manufacturer",       label: "Manufacturer",            placeholder: "Toyota, BMW, Ford…",     type: "text",   icon: <Car size={13} /> },
    { name: "model",              label: "Model",                   placeholder: "Camry, X5, F-150…",      type: "text",   icon: <Settings size={13} /> },
    { name: "year",               label: "Year",                    placeholder: "2023",                   type: "number", icon: <Calendar size={13} /> },
    { name: "currentMileage",     label: "Current Mileage (km)",    placeholder: "28500",                  type: "number", icon: <Navigation size={13} /> },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "#f4f7fb",
        backgroundImage: [
          "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(26,58,107,0.09) 0%, transparent 70%)",
          "linear-gradient(rgba(26,58,107,0.03) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(26,58,107,0.03) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="w-full max-w-3xl">
        {/* Logo / Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-6">
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{
                width: 64, height: 64,
                background: `linear-gradient(135deg, ${NAVY}, #0f2744)`,
                boxShadow: "0 6px 32px rgba(26,58,107,0.4)",
              }}
            >
              <Car size={30} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold" style={{ ...displayFont, color: NAVY, letterSpacing: "0.03em" }}>
                AutoGuard <span style={{ color: GOLD }}>AI</span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-widest uppercase mt-1" style={monoFont}>Autonomous Vehicle Intelligence</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-5" style={{ background: "rgba(26,58,107,0.06)", border: "1px solid rgba(26,58,107,0.1)" }}>
            <motion.div className="w-2 h-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span className="text-xs text-slate-500 tracking-wider" style={monoFont}>9 AI Agents · Real-time ECU · Autonomous Monitoring</span>
          </div>
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Register your vehicle to activate real-time ECU monitoring, AI diagnostics, and fully autonomous maintenance orchestration.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-12" style={glass}>
          <div className="flex items-center gap-3 mb-7 pb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,58,107,0.08)", border: "1px solid rgba(26,58,107,0.14)" }}>
              <Car size={15} style={{ color: NAVY }} />
            </div>
            <span className="text-sm font-bold text-slate-700 tracking-widest uppercase" style={displayFont}>Vehicle Registration</span>
            <motion.div className="ml-auto w-2 h-2 rounded-full" style={{ background: GOLD }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>

          <form onSubmit={submit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
              {fields.map((f) => (
                <div key={f.name} className={f.name === "currentMileage" ? "sm:col-span-2 sm:max-w-[calc(50%-8px)]" : ""}>
                  <label className="block text-[10px] text-slate-500 mb-2 tracking-wide uppercase font-semibold" style={monoFont}>{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(26,58,107,0.5)" }}>{f.icon}</span>
                    <input
                      name={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.name]}
                      onChange={set}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all text-slate-700 placeholder-slate-300"
                      style={{
                        ...monoFont,
                        background: "rgba(26,58,107,0.03)",
                        border: "1px solid rgba(26,58,107,0.12)",
                        fontSize: "12px",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = "1px solid rgba(26,58,107,0.4)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,58,107,0.07)";
                        e.currentTarget.style.background = "#ffffff";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = "1px solid rgba(26,58,107,0.12)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "rgba(26,58,107,0.03)";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2" style={monoFont}>
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-5 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-60"
              style={{
                ...displayFont,
                background: loading
                  ? "rgba(26,58,107,0.5)"
                  : `linear-gradient(135deg, ${NAVY} 0%, #0f2744 100%)`,
                boxShadow: loading ? "none" : "0 6px 28px rgba(26,58,107,0.35)",
                letterSpacing: "0.03em",
              }}
            >
              {loading ? (
                <><RefreshCw size={17} className="animate-spin" /> Registering Vehicle…</>
              ) : (
                <><Cpu size={17} /> Register & Launch ECU Monitor <ArrowRight size={17} /></>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-slate-400 text-xs" style={monoFont}>
            Autonomous monitoring activates immediately upon registration
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================

export default function App() {
  const [page, setPage] = useState<"reg" | "dash">("reg");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster
        position="top-right"
        theme="light"
        toastOptions={{
          style: {
            background: "#ffffff",
            border: "1px solid rgba(26,58,107,0.12)",
            color: "#0f1c35",
            backdropFilter: "blur(16px)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            boxShadow: "0 4px 24px rgba(26,58,107,0.1)",
          },
        }}
      />
      <AnimatePresence mode="wait">
        {page === "reg" ? (
          <motion.div key="reg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
            <RegistrationPage onSubmit={(v) => { setVehicle(v); setPage("dash"); }} />
          </motion.div>
        ) : (
          <motion.div key="dash" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Dashboard vehicle={vehicle!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
