'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Cpu,
  Grid,
  HardDrive,
  Palette,
  Keyboard,
  Apple,
  AppWindow,
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

/** ⚡ (60 FPS WebGL Rendering) → ZapHoverIcon */
export const ZapHoverIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-amber-400", size = 24 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.25, rotate: [0, -10, 10, -5, 0] }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <motion.div
        animate={isHovered ? { filter: "drop-shadow(0px 0px 10px rgba(251, 191, 36, 0.9))" } : { filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))" }}
      >
        <Zap size={size} className="fill-amber-400/20 stroke-amber-400" />
      </motion.div>
    </motion.div>
  );
};

/** 🦀 (Rust PTY Backend) → CpuHoverIcon */
export const CpuHoverIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-[#3C95F0]", size = 24 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.2, y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 12 }}
    >
      <motion.div
        animate={isHovered ? { rotate: [0, 90, 180, 270, 360], filter: "drop-shadow(0px 0px 10px rgba(60, 149, 240, 0.8))" } : { rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Cpu size={size} className="stroke-[#3C95F0]" />
      </motion.div>
    </motion.div>
  );
};

/** ⊞ (1–16 Pane Grid) → GridHoverIcon */
export const GridHoverIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-[#3C95F0]", size = 24 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.25 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <motion.div
        animate={isHovered ? { scale: [1, 1.15, 1], filter: "drop-shadow(0 0 10px rgba(60, 149, 240, 0.85))" } : { scale: 1 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <Grid size={size} className="stroke-[#3C95F0]" />
      </motion.div>
    </motion.div>
  );
};

/** 💾 (Workspaces) → HardDriveHoverIcon */
export const HardDriveHoverIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-cyan-400", size = 24 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.2, y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 14 }}
    >
      <motion.div
        animate={isHovered ? { y: [0, -2, 2, 0], filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.85))" } : { y: 0 }}
      >
        <HardDrive size={size} className="stroke-cyan-400" />
      </motion.div>
    </motion.div>
  );
};

/** 🎨 (7 Built-in Themes) → PaletteHoverIcon */
export const PaletteHoverIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-purple-400", size = 24 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.25, rotate: 20 }}
      transition={{ type: "spring", stiffness: 350, damping: 12 }}
    >
      <motion.div
        animate={isHovered ? { filter: "drop-shadow(0 0 10px rgba(192, 132, 252, 0.85))" } : {}}
      >
        <Palette size={size} className="stroke-purple-400" />
      </motion.div>
    </motion.div>
  );
};

/** ⌨️ (Command Palette) → KeyboardHoverIcon */
export const KeyboardHoverIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-sky-400", size = 24 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.2, y: 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      <motion.div
        animate={isHovered ? { scale: [1, 0.9, 1.1, 1], filter: "drop-shadow(0 0 10px rgba(56, 189, 248, 0.85))" } : {}}
      >
        <Keyboard size={size} className="stroke-sky-400" />
      </motion.div>
    </motion.div>
  );
};

/** 🍎 (macOS Download) → AppleHoverIcon */
export const AppleHoverIcon: React.FC<IconProps> = ({ className = "w-8 h-8 text-white", size = 32 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.2, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
    >
      <motion.div
        animate={isHovered ? { filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))" } : { filter: "drop-shadow(0 0 0px transparent)" }}
      >
        <Apple size={size} className="fill-white stroke-white" />
      </motion.div>
    </motion.div>
  );
};

/** 🪟 (Windows Download) → WindowHoverIcon */
export const WindowHoverIcon: React.FC<IconProps> = ({ className = "w-8 h-8 text-sky-400", size = 32 }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.2, rotate: -5, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
    >
      <motion.div
        animate={isHovered ? { filter: "drop-shadow(0 0 12px rgba(56, 189, 248, 0.9))" } : { filter: "drop-shadow(0 0 0px transparent)" }}
      >
        <AppWindow size={size} className="stroke-sky-400" />
      </motion.div>
    </motion.div>
  );
};


