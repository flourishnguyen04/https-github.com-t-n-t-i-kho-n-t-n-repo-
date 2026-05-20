import {
  Apple,
  BookOpen,
  Cloud,
  CupSoda,
  Dumbbell,
  Footprints,
  GlassWater,
  Globe,
  Heart,
  HeartPulse,
  Leaf,
  Moon,
  PenLine,
  SearchCheck,
  Sandwich,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils
} from "lucide-react";
import { getTaskMeta } from "../data/taskMeta";
import CurvedPath from "./CurvedPath";
import TaskNode from "./TaskNode";

const MAP_POSITIONS = {
  1: { x: 72, y: 86 },
  2: { x: 28, y: 71 },
  3: { x: 72, y: 56 },
  4: { x: 28, y: 41 },
  5: { x: 72, y: 26 },
  6: { x: 50, y: 10 }
};

const PATTERN_ICONS = {
  "fast-food": [Sandwich, CupSoda, Utensils],
  exercise: [Dumbbell, Footprints, HeartPulse],
  sleep: [Moon, Star, Cloud],
  "mental-health": [Heart, Cloud, Sparkles],
  "healthy-lifestyle": [Apple, Leaf, GlassWater],
  "online-health": [SearchCheck, ShieldCheck, Globe],
  paper: [BookOpen, PenLine, Sparkles]
};

const PATTERN_POSITIONS = [
  { x: "9%", y: "10%", r: "-10deg" },
  { x: "78%", y: "10%", r: "8deg" },
  { x: "44%", y: "18%", r: "-4deg" },
  { x: "15%", y: "31%", r: "7deg" },
  { x: "84%", y: "39%", r: "-8deg" },
  { x: "48%", y: "47%", r: "6deg" },
  { x: "12%", y: "58%", r: "-6deg" },
  { x: "82%", y: "64%", r: "10deg" },
  { x: "43%", y: "75%", r: "-8deg" },
  { x: "17%", y: "86%", r: "5deg" }
];

const getStepStatus = (step, currentType) => {
  if (!step?.isUnlocked) return "locked";
  if (step.isCompleted) return "completed";
  if ((step.slug || step.type) === currentType) return "current";
  return "available";
};

const BackgroundPattern = ({ theme }) => {
  const icons = PATTERN_ICONS[theme] || PATTERN_ICONS.paper;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.055]" aria-hidden="true">
      {PATTERN_POSITIONS.map((position, index) => {
        const Icon = icons[index % icons.length];

        return (
          <Icon
            key={`${theme}-${position.x}-${position.y}`}
            size={58}
            strokeWidth={2.2}
            className="absolute text-primary"
            style={{
              left: position.x,
              top: position.y,
              transform: `rotate(${position.r})`
            }}
          />
        );
      })}
    </div>
  );
};

const MissionMap = ({ miniTopic, steps, onTaskSelect }) => {
  const missionTheme = miniTopic?.mapTheme || "paper";
  const mapClass = `mission-map-bg-${missionTheme}`;
  const allComplete = steps.length > 0 && steps.every((step) => step.isCompleted);
  const currentType = steps.find((step) => step.isUnlocked && !step.isCompleted)?.slug || "";

  return (
    <div className={`paper-panel relative overflow-hidden rounded-paper border border-border shadow-tactile ${mapClass}`}>
      <BackgroundPattern theme={missionTheme} />
      <div className="relative z-10 mx-auto min-h-[1040px] max-w-3xl px-3 py-8 sm:px-6">
        <CurvedPath allComplete={allComplete} />

        {steps.map((step) => {
          const meta = getTaskMeta(step);
          const status = getStepStatus(step, currentType);

          return (
            <TaskNode
              key={step.slug || step.type}
              meta={meta}
              step={step}
              status={status}
              position={MAP_POSITIONS[meta.taskNumber]}
              onSelect={onTaskSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MissionMap;
