import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bomb,
  CirclePause,
  ClipboardList,
  Coins,
  Crown,
  Gem,
  Home,
  Lock,
  Medal,
  Package,
  Play,
  RotateCcw,
  Settings,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import sceneSelectImage from "./assets/reference/scene-select-desktop.png";
import crystalPalaceImage from "./assets/reference/crystal-palace-preview.png";
import abyssalRelicImage from "./assets/reference/abyssal-relic-preview.png";
import neonCoralImage from "./assets/reference/neon-coral-preview.png";

const NO_TIME_LIMIT = true;
const PEARL_SIGHT_SCORE_BONUS = 0.05;
const PROJECTILE_SPEED = 1600;
const MUSIC_VOLUME = 0.88;
const SFX_AUDIBLE_LEVEL = 1.24;
const SFX_GAIN_LEVEL = 1.18;

const SCENES = [
  {
    id: "crystal",
    index: 1,
    name: "Crystal Palace Tide",
    shortName: "Crystal Palace",
    level: 24,
    stars: 36,
    totalStars: 45,
    badge: "默认",
    image: crystalPalaceImage,
    palette: {
      page: "#062a42",
      deep: "#073554",
      mid: "#0db7cf",
      bright: "#8cf9ff",
      accent: "#f3c26f",
      hot: "#ff7dbb",
      card: "#083d57",
    },
    ballStyle: "pearl",
    railStyle: "glass",
    colors: ["#f95662", "#f7c83f", "#43c855", "#1d9dff", "#a64df4", "#f4eef5"],
    speed: 16,
  },
  {
    id: "abyssal",
    index: 2,
    name: "Abyssal Relic Run",
    shortName: "Abyssal Relic",
    level: 28,
    stars: 24,
    totalStars: 45,
    badge: "遗迹",
    image: abyssalRelicImage,
    palette: {
      page: "#030c17",
      deep: "#071b2d",
      mid: "#0b62a5",
      bright: "#39baff",
      accent: "#d09a45",
      hot: "#8c5cff",
      card: "#111b22",
    },
    ballStyle: "gem",
    railStyle: "stone",
    colors: ["#e8414d", "#dca73e", "#55c13a", "#227de8", "#9b47ee", "#c9d6ef"],
    speed: 14,
  },
  {
    id: "neon",
    index: 3,
    name: "Neon Coral Engine",
    shortName: "Neon Coral",
    level: 31,
    stars: 0,
    totalStars: 45,
    badge: "高能",
    image: neonCoralImage,
    palette: {
      page: "#02151f",
      deep: "#062331",
      mid: "#00a9c6",
      bright: "#18f7ff",
      accent: "#ffb531",
      hot: "#fb4fdc",
      card: "#081b29",
    },
    ballStyle: "energy",
    railStyle: "tube",
    colors: ["#ff3e79", "#ffbf2f", "#67e43c", "#09b7ff", "#be42ff"],
    speed: 18,
  },
];

const POWERUPS = [
  { id: "surge", label: "电光", icon: Zap, count: 1 },
  { id: "freeze", label: "冰冻", icon: Snowflake, count: 1 },
  { id: "burst", label: "爆裂", icon: Sparkles, count: 1 },
  { id: "prism", label: "棱镜", icon: Sparkles, count: 1, className: "rainbow" },
];

const INVENTORY_ITEMS = POWERUPS;

const SHOP_ITEMS = [
  { id: "aquaCore", title: "Aqua Core", price: 1200, value: "-8% chain speed", max: 3 },
  { id: "pearlSight", title: "Pearl Sight", price: 980, value: "+5% score reward", max: 3 },
  { id: "stormCache", title: "Storm Cache", price: 1650, value: "+1 start booster", max: 3 },
];

const POWERUP_SHOP_ITEMS = [
  { id: "surge", priceYuan: 1 },
  { id: "freeze", priceYuan: 1 },
  { id: "burst", priceYuan: 1 },
  { id: "prism", priceYuan: 1 },
];

const QUEST_DEFS = [
  { id: "combo", title: "Combo Tide", target: 25, unit: "combo", reward: { coins: 580, xp: 90, inventory: { surge: 2 } } },
  { id: "relic", title: "Relic Sweep", target: 8, unit: "clears", reward: { coins: 760, xp: 120, inventory: { burst: 1 } } },
  { id: "coral", title: "Coral Charge", target: 120, unit: "orbs", reward: { gems: 5, xp: 140, inventory: { freeze: 2, prism: 1 } } },
];

const BASE_LEADERBOARD = [
  { name: "Mira", score: "128,400" },
  { name: "Kai", score: "117,920" },
  { name: "Nova", score: "109,780" },
];

const PANEL_META = {
  profile: { title: "Profile", kicker: "Diver", icon: Crown },
  wallet: { title: "Resources", kicker: "Wallet", icon: Coins },
  settings: { title: "Settings", kicker: "System", icon: Settings },
  menu: { title: "Main Menu", kicker: "Session", icon: ArrowLeft },
  levels: { title: "Levels", kicker: "Map", icon: Trophy },
  bag: { title: "Bag", kicker: "Inventory", icon: Package },
  shop: { title: "Shop", kicker: "Market", icon: ShoppingBag },
  quests: { title: "Quests", kicker: "Progress", icon: ClipboardList },
  rank: { title: "Rank", kicker: "League", icon: Medal },
};

const LEVELS = [
  {
    id: "crystal-1",
    sceneId: "crystal",
    number: 1,
    title: "Pearl Gate",
    chainLength: 34,
    targetOrbs: 34,
    timer: 112,
    speedScale: 0.9,
    acceleration: 0.04,
    terrain: "single",
    entryCount: 1,
    exitCount: 1,
    targetScore: 1600,
    reward: { coins: 520, gems: 3, xp: 160 },
  },
  {
    id: "crystal-2",
    sceneId: "crystal",
    number: 2,
    title: "Glass Reef",
    chainLength: 42,
    targetOrbs: 42,
    timer: 112,
    speedScale: 1.02,
    acceleration: 0.046,
    terrain: "reefFork",
    entryCount: 2,
    exitCount: 1,
    targetScore: 2300,
    reward: { coins: 640, gems: 4, xp: 190 },
  },
  {
    id: "crystal-3",
    sceneId: "crystal",
    number: 3,
    title: "Moon Shell",
    chainLength: 50,
    targetOrbs: 50,
    timer: 108,
    speedScale: 1.14,
    acceleration: 0.052,
    terrain: "crossCurrent",
    entryCount: 2,
    exitCount: 2,
    targetScore: 3100,
    reward: { coins: 760, gems: 4, xp: 220 },
  },
  {
    id: "crystal-4",
    sceneId: "crystal",
    number: 4,
    title: "Tide Crown",
    chainLength: 58,
    targetOrbs: 58,
    timer: 104,
    speedScale: 1.28,
    acceleration: 0.06,
    terrain: "dualGate",
    entryCount: 2,
    exitCount: 2,
    targetScore: 4200,
    reward: { coins: 920, gems: 6, xp: 270 },
  },
  {
    id: "abyssal-1",
    sceneId: "abyssal",
    number: 1,
    title: "Relic Door",
    chainLength: 38,
    targetOrbs: 38,
    timer: 112,
    speedScale: 0.94,
    acceleration: 0.043,
    terrain: "single",
    entryCount: 1,
    exitCount: 1,
    targetScore: 1800,
    reward: { coins: 560, gems: 3, xp: 170 },
  },
  {
    id: "abyssal-2",
    sceneId: "abyssal",
    number: 2,
    title: "Sunken Rune",
    chainLength: 46,
    targetOrbs: 46,
    timer: 108,
    speedScale: 1.08,
    acceleration: 0.05,
    terrain: "reefFork",
    entryCount: 2,
    exitCount: 1,
    targetScore: 2800,
    reward: { coins: 720, gems: 4, xp: 210 },
  },
  {
    id: "abyssal-3",
    sceneId: "abyssal",
    number: 3,
    title: "Obsidian Loop",
    chainLength: 54,
    targetOrbs: 54,
    timer: 104,
    speedScale: 1.24,
    acceleration: 0.058,
    terrain: "crossCurrent",
    entryCount: 2,
    exitCount: 2,
    targetScore: 3600,
    reward: { coins: 850, gems: 5, xp: 250 },
  },
  {
    id: "abyssal-4",
    sceneId: "abyssal",
    number: 4,
    title: "Leviathan Seal",
    chainLength: 66,
    targetOrbs: 66,
    timer: 100,
    speedScale: 1.42,
    acceleration: 0.068,
    terrain: "dualGate",
    entryCount: 3,
    exitCount: 2,
    targetScore: 5000,
    reward: { coins: 1050, gems: 7, xp: 310 },
  },
  {
    id: "neon-1",
    sceneId: "neon",
    number: 1,
    title: "Current Engine",
    chainLength: 40,
    targetOrbs: 40,
    timer: 108,
    speedScale: 1,
    acceleration: 0.048,
    terrain: "reefFork",
    entryCount: 2,
    exitCount: 1,
    targetScore: 2100,
    reward: { coins: 620, gems: 4, xp: 190 },
  },
  {
    id: "neon-2",
    sceneId: "neon",
    number: 2,
    title: "Glow Vent",
    chainLength: 50,
    targetOrbs: 50,
    timer: 104,
    speedScale: 1.18,
    acceleration: 0.057,
    terrain: "crossCurrent",
    entryCount: 2,
    exitCount: 2,
    targetScore: 3200,
    reward: { coins: 780, gems: 5, xp: 240 },
  },
  {
    id: "neon-3",
    sceneId: "neon",
    number: 3,
    title: "Prism Surge",
    chainLength: 60,
    targetOrbs: 60,
    timer: 100,
    speedScale: 1.36,
    acceleration: 0.066,
    terrain: "dualGate",
    entryCount: 2,
    exitCount: 2,
    targetScore: 4400,
    reward: { coins: 980, gems: 6, xp: 290 },
  },
  {
    id: "neon-4",
    sceneId: "neon",
    number: 4,
    title: "Coral Reactor",
    chainLength: 72,
    targetOrbs: 72,
    timer: 96,
    speedScale: 1.58,
    acceleration: 0.078,
    terrain: "multiVent",
    entryCount: 3,
    exitCount: 3,
    targetScore: 6200,
    reward: { coins: 1240, gems: 8, xp: 360 },
  },
];

const LANGUAGES = [
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
];

const MUSIC_TRACKS = [
  {
    id: "ocean-light",
    sceneId: "crystal",
    zh: "浅海轻波",
    en: "Ocean Light",
    mood: "bright-aquatic",
    audioPath: "/audio/ocean-light.wav",
    source: "downloaded",
    credit: "Aquaria - OpenGameArt CC0",
  },
  {
    id: "mystic-light",
    sceneId: "abyssal",
    zh: "秘境轻梦",
    en: "Mystic Light",
    mood: "mysterious-calm",
    audioPath: "/audio/mystic-light.ogg",
    source: "downloaded",
    credit: "Heavenly Loop - OpenGameArt CC0",
  },
  {
    id: "coral-harp",
    sceneId: "neon",
    zh: "珊瑚竖琴",
    en: "Coral Harp",
    mood: "soft-energy",
    audioPath: "/audio/coral-light.ogg",
    source: "downloaded",
    credit: "Heaven Theme Loop - OpenGameArt CC0",
  },
];

const SPECIAL_SPAWN_CHANCE = 0.1;
const SFX_ACTIONS = ["shoot", "hit", "explosion", "match", "join-impact", "freeze", "roll"];
const SPECIAL_MARBLE_EFFECTS = {
  rainbow: ["halo", "pulse", "rainbow-rings", "inner-star"],
  bomb: ["halo", "pulse", "ember-core", "blast-ring"],
};
const VISUAL_PROFILE = {
  marbleMaterial: "translucent-crystal",
  marbleDimension: "3d-sphere",
  lightingModel: "layered-specular",
  depthCues: ["cast-shadow", "rim-light", "inner-refraction", "specular-highlights"],
  portalLabels: false,
  exitStyle: "dark-hole",
  specialMarbleEffects: SPECIAL_MARBLE_EFFECTS,
};

const SPECIAL_MARBLES = {
  rainbow: {
    id: "rainbow",
    color: "#fff5a4",
    zh: "彩色弹珠",
    en: "Rainbow Marble",
    zhShort: "彩",
    enShort: "RB",
    zhDescription: "直线贯穿前进，炸毁路径上碰到的每一颗弹珠。",
    enDescription: "Pierces forward in a straight line and destroys every marble it touches.",
  },
  bomb: {
    id: "bomb",
    color: "#ff8a3d",
    zh: "炸弹弹珠",
    en: "Bomb Marble",
    zhShort: "爆",
    enShort: "BM",
    zhDescription: "命中后爆炸，清除命中点附近一片弹珠。",
    enDescription: "Explodes on impact and clears a cluster around the hit point.",
  },
};

const I18N = {
  zh: {
    ui: {
      appName: "海底水晶",
      appSubtitle: "弹珠传奇",
      settings: "设置",
      system: "系统",
      mainMenu: "主菜单",
      session: "当前进度",
      levels: "关卡",
      map: "地图",
      bag: "背包",
      inventory: "背包",
      shop: "商店",
      market: "商店",
      quests: "任务",
      progress: "进度",
      rank: "排行",
      league: "联赛",
      powerup: "道具",
      play: "开始",
      continue: "继续",
      audio: "声音",
      music: "背景音乐",
      sfx: "音效",
      on: "开启",
      muted: "静音",
      vfx: "特效",
      high: "高",
      scene: "场景",
      target: "目标",
      clearAllTarget: "清空全部 {count} 颗",
      noTimeLimit: "无时间限制",
      language: "语言",
      musicTrack: "背景音乐",
      chinese: "中文",
      english: "英语",
      level: "关卡",
      levelPrefix: "第 {number} 关",
      targetOrbs: "{count} 颗弹珠",
      seconds: "{count}秒",
      owned: "{count} 个",
      ready: "本局可用",
      wildColorBurst: "万能色爆裂",
      locked: "未解锁",
      stars: "{stars}/3",
      completedCount: "{completed}/{total}",
      coinsPrice: "{price} 金币",
      yuanPrice: "¥{price}",
      paidPowerupPrice: "每个道具 ¥{price}",
      scanPayTitle: "扫码支付",
      scanPayHelp: "请使用微信扫描收款码支付 1 元。确认已付款后，游戏才会发放该道具。",
      paymentManualNote: "当前本地版本未接入微信支付回调，需要你完成扫码后手动确认。",
      confirmPaid: "我已付款，发放道具",
      cancel: "取消",
      upgradeRank: "阶 {rank}/{max}",
      max: "满级",
      claim: "领取",
      claimed: "已领取",
      open: "进行中",
      score: "分数",
      time: "时间",
      speed: "速度",
      speedValue: "速度 x{speed}",
      combo: "连击",
      comboValue: "连击 x{combo}",
      orbs: "弹珠",
      orbsProgress: "{current}/{target} 弹珠",
      frozen: "冻结",
      flowing: "推进中",
      musicOn: "音乐开",
      restart: "重开",
      aimHint: "瞄准并点击发射",
      cleared: "已通关",
      retry: "再试一次",
      gateReached: "链条到达终点",
      timeExpired: "时间耗尽",
      replay: "重玩",
      nextLevel: "下一关 {number}",
      complete: "完成",
      resultLevels: "关卡",
      xp: "经验",
      gems: "宝石",
      coins: "金币",
      you: "你",
      paused: "已暂停",
      sceneCleared: "场景已清空",
      chainReached: "链条到达终点",
      restartHint: "重开，或返回选择其他关卡。",
      sceneSelection: "场景选择",
      levelSelection: "关卡选择",
      powerupInventory: "道具背包",
      mobileNavigation: "移动导航",
      profile: "档案",
      explorer: "潜航员",
      wallet: "资源",
      resources: "资源",
      currentResources: "当前资源",
      tapForDetails: "点击查看说明",
      xpProgressShort: "经验 {xp}/{need}",
      profileLevel: "玩家等级",
      xpProgress: "经验进度",
      levelHelp: "等级从 1 级开始。通关和领取任务奖励会获得经验，经验满后自动升级。",
      levelGuide: "升级说明",
      xpHelp: "经验只记录当前等级内的进度，不会在商店里消耗。",
      coinsHelp: "金币用于购买永久升级，道具补给需要扫码付费购买。",
      coinsGet: "金币通过通关、重复挑战和任务奖励获得。",
      gemsHelp: "宝石是稀有资源，用于奖励结算和稀有进度展示。",
      gemsGet: "宝石主要来自关卡首通和部分任务奖励。",
      itemEffect: "作用",
      itemUse: "使用",
      itemGet: "获取",
      useInLevel: "进入关卡后，点击游戏侧栏或底部的对应道具图标即可使用。",
      getFrom: "可通过关卡奖励、任务奖励，或在商店扫码付费获得。",
      permanentUpgrades: "永久升级",
      powerupSupply: "道具补给",
      gemsPrice: "{price} 宝石",
      rewardItems: "道具",
      noRewardItems: "+0",
      starterPack: "新手包",
      starterPowerups: "新手会获得 3 种基础道具各 1 个：电光、冰冻、爆裂。棱镜是稀有道具，需要通过关卡奖励、任务或商店获得。",
      currentShot: "当前发射",
      nextShot: "下一个",
      normalMarble: "普通弹珠",
      specialMarbleGuide: "特殊弹珠说明",
      specialChance: "特殊弹珠低概率出现，大约每 10 发以内偶尔出现 1 发。",
    },
    scenes: {
      crystal: { name: "水晶宫潮汐", shortName: "水晶宫" },
      abyssal: { name: "深渊遗迹", shortName: "深渊遗迹" },
      neon: { name: "霓虹珊瑚引擎", shortName: "霓虹珊瑚" },
    },
    levels: {
      "crystal-1": "珍珠门",
      "crystal-2": "玻璃礁",
      "crystal-3": "月贝回廊",
      "crystal-4": "潮汐王冠",
      "abyssal-1": "遗迹之门",
      "abyssal-2": "沉没符文",
      "abyssal-3": "黑曜回环",
      "abyssal-4": "利维坦封印",
      "neon-1": "洋流引擎",
      "neon-2": "辉光喷口",
      "neon-3": "棱镜涌流",
      "neon-4": "珊瑚反应堆",
    },
    powerups: {
      surge: "电光",
      freeze: "冰冻",
      burst: "爆裂",
      prism: "棱镜",
    },
    powerupInfo: {
      surge: {
        description: "立即击碎链条最前方最多 7 颗弹珠，适合在链条接近终点时救场。",
        use: "进入关卡后点击电光图标，会从链条前端开始清除弹珠。",
        get: "首通关卡、任务奖励，或在商店扫码付费购买。",
      },
      freeze: {
        description: "短时间冻结链条推进，让你有时间瞄准和制造连消。",
        use: "进入关卡后点击冰冻图标，链条会暂停数秒。",
        get: "任务奖励、首通关卡，或在商店扫码付费购买。",
      },
      burst: {
        description: "在链条中段制造爆裂，清除一片弹珠并触发爆炸特效。",
        use: "进入关卡后点击爆裂图标，会优先炸开链条中部。",
        get: "任务奖励、首通关卡，或在商店扫码付费购买。",
      },
      prism: {
        description: "引爆当前链条里最大的一组同色弹珠，是制造大连消的稀有道具。",
        use: "进入关卡后点击棱镜图标，会自动寻找最大同色组并清除。",
        get: "首通关卡、珊瑚任务奖励，或在商店扫码付费购买。",
      },
    },
    specialMarbles: {
      rainbow: {
        name: "彩色弹珠",
        description: "直线贯穿前进，炸毁路径上碰到的每一颗弹珠。",
      },
      bomb: {
        name: "炸弹弹珠",
        description: "命中后爆炸，清除命中点附近一片弹珠。",
      },
    },
    shop: {
      aquaCore: { title: "水流核心", value: "链条速度 -8%" },
      pearlSight: { title: "珍珠瞄具", value: "通关分数奖励 +5%" },
      stormCache: { title: "风暴补给", value: "开局道具 +1" },
    },
    quests: {
      combo: { title: "连击潮汐", unit: "连击" },
      relic: { title: "遗迹清扫", unit: "通关" },
      coral: { title: "珊瑚充能", unit: "弹珠" },
    },
  },
  en: {
    ui: {
      appName: "Ocean",
      appSubtitle: "Crystal Quest",
      settings: "Settings",
      system: "System",
      mainMenu: "Main Menu",
      session: "Session",
      levels: "Levels",
      map: "Map",
      bag: "Bag",
      inventory: "Inventory",
      shop: "Shop",
      market: "Market",
      quests: "Quests",
      progress: "Progress",
      rank: "Rank",
      league: "League",
      powerup: "Power-up",
      play: "Play",
      continue: "Continue",
      audio: "Audio",
      music: "Music",
      sfx: "SFX",
      on: "On",
      muted: "Muted",
      vfx: "VFX",
      high: "High",
      scene: "Scene",
      target: "Target",
      clearAllTarget: "Clear all {count}",
      noTimeLimit: "No time limit",
      language: "Language",
      musicTrack: "Music",
      chinese: "Chinese",
      english: "English",
      level: "Level",
      levelPrefix: "Level {number}",
      targetOrbs: "{count} orbs",
      seconds: "{count}s",
      owned: "{count} owned",
      ready: "Ready for next run",
      wildColorBurst: "Wild color burst",
      locked: "Locked",
      stars: "{stars}/3",
      completedCount: "{completed}/{total}",
      coinsPrice: "{price} coins",
      yuanPrice: "RMB {price}",
      paidPowerupPrice: "RMB {price} each",
      scanPayTitle: "Scan to pay",
      scanPayHelp: "Scan the WeChat payment QR and pay RMB 1. The item is granted only after payment confirmation.",
      paymentManualNote: "This local version has no WeChat Pay callback, so confirmation is manual after scanning.",
      confirmPaid: "I paid, grant item",
      cancel: "Cancel",
      upgradeRank: "Rank {rank}/{max}",
      max: "Max",
      claim: "Claim",
      claimed: "Claimed",
      open: "Open",
      score: "Score",
      time: "Time",
      speed: "Speed",
      speedValue: "Speed x{speed}",
      combo: "Combo",
      comboValue: "Combo x{combo}",
      orbs: "Orbs",
      orbsProgress: "{current}/{target} orbs",
      frozen: "Frozen",
      flowing: "Flowing",
      musicOn: "Music on",
      restart: "Restart",
      aimHint: "Aim and tap to fire",
      cleared: "Cleared",
      retry: "Retry",
      gateReached: "Gate Reached",
      timeExpired: "Time Expired",
      replay: "Replay",
      nextLevel: "Next {number}",
      complete: "Complete",
      resultLevels: "Levels",
      xp: "XP",
      gems: "Gems",
      coins: "Coins",
      you: "You",
      paused: "Paused",
      sceneCleared: "Scene Cleared",
      chainReached: "Chain Reached The Gate",
      restartHint: "Restart or return to choose another level.",
      sceneSelection: "Scene selection",
      levelSelection: "Level selection",
      powerupInventory: "Power-up inventory",
      mobileNavigation: "Mobile navigation",
      profile: "Profile",
      explorer: "Diver",
      wallet: "Resources",
      resources: "Resources",
      currentResources: "Current resources",
      tapForDetails: "Tap for details",
      xpProgressShort: "XP {xp}/{need}",
      profileLevel: "Player level",
      xpProgress: "XP progress",
      levelHelp: "Level starts at 1. Clearing levels and claiming quests grants XP; leveling up happens automatically.",
      levelGuide: "Leveling guide",
      xpHelp: "XP tracks progress inside the current player level and is not spent in the shop.",
      coinsHelp: "Coins buy permanent upgrades. Power-up supplies use scan-to-pay purchases.",
      coinsGet: "Earn coins from clears, repeat runs, and quest rewards.",
      gemsHelp: "Gems are rare resources used in rewards and rare progress display.",
      gemsGet: "Earn gems mainly from first clears and some quest rewards.",
      itemEffect: "Effect",
      itemUse: "Use",
      itemGet: "Get",
      useInLevel: "In a level, click the matching power-up icon in the side or bottom controls.",
      getFrom: "Earn from level rewards, quest rewards, or scan and pay in the shop.",
      permanentUpgrades: "Permanent upgrades",
      powerupSupply: "Power-up supply",
      gemsPrice: "{price} gems",
      rewardItems: "Items",
      noRewardItems: "+0",
      starterPack: "Starter pack",
      starterPowerups: "New players get 1 each of the 3 basic power-ups: Surge, Freeze, and Burst. Prism is rare and comes from rewards, quests, or the shop.",
      currentShot: "Current shot",
      nextShot: "Next",
      normalMarble: "Normal marble",
      specialMarbleGuide: "Special marble guide",
      specialChance: "Special marbles appear rarely, roughly one occasional shot within about 10 shots.",
    },
    scenes: {
      crystal: { name: "Crystal Palace Tide", shortName: "Crystal Palace" },
      abyssal: { name: "Abyssal Relic Run", shortName: "Abyssal Relic" },
      neon: { name: "Neon Coral Engine", shortName: "Neon Coral" },
    },
    levels: Object.fromEntries(LEVELS.map((level) => [level.id, level.title])),
    powerups: {
      surge: "Surge",
      freeze: "Freeze",
      burst: "Burst",
      prism: "Prism",
    },
    powerupInfo: {
      surge: {
        description: "Destroys up to 7 marbles at the front of the chain, useful when the chain is close to the gate.",
        use: "Click the Surge icon during a level to clear marbles from the front of the chain.",
        get: "Earn from first clears, quests, or scan and pay in the shop.",
      },
      freeze: {
        description: "Freezes chain movement briefly so you can aim and set up matches.",
        use: "Click the Freeze icon during a level to pause the chain for a few seconds.",
        get: "Earn from quests, first clears, or scan and pay in the shop.",
      },
      burst: {
        description: "Creates an explosion near the middle of the chain and clears a cluster of marbles.",
        use: "Click the Burst icon during a level to explode the middle of the chain.",
        get: "Earn from quests, first clears, or scan and pay in the shop.",
      },
      prism: {
        description: "Detonates the largest same-color group currently in the chain, setting up big cascades.",
        use: "Click the Prism icon during a level and it automatically targets the largest color group.",
        get: "Earn from first clears, coral quests, or scan and pay in the shop.",
      },
    },
    specialMarbles: {
      rainbow: {
        name: "Rainbow Marble",
        description: "Pierces forward in a straight line and destroys every marble it touches.",
      },
      bomb: {
        name: "Bomb Marble",
        description: "Explodes on impact and clears a cluster around the hit point.",
      },
    },
    shop: {
      aquaCore: { title: "Aqua Core", value: "-8% chain speed" },
      pearlSight: { title: "Pearl Sight", value: "+5% clear score reward" },
      stormCache: { title: "Storm Cache", value: "+1 start booster" },
    },
    quests: {
      combo: { title: "Combo Tide", unit: "combo" },
      relic: { title: "Relic Sweep", unit: "clears" },
      coral: { title: "Coral Charge", unit: "orbs" },
    },
  },
};

const SAVE_KEY = "ocean-crystal-quest-save-v4";

function getLanguage(language) {
  return language === "en" ? "en" : "zh";
}

function getMusicTrack(trackId) {
  return MUSIC_TRACKS.find((track) => track.id === trackId) || MUSIC_TRACKS[0];
}

function musicTrackText(trackId, language) {
  const track = getMusicTrack(trackId);
  return getLanguage(language) === "en" ? track.en : track.zh;
}

function musicTrackCredit(trackId) {
  return getMusicTrack(trackId).credit || "";
}

function tr(language, key, values = {}) {
  const lang = getLanguage(language);
  const template = I18N[lang].ui[key] ?? I18N.en.ui[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function sceneText(scene, language, field = "name") {
  const lang = getLanguage(language);
  return I18N[lang].scenes[scene.id]?.[field] ?? scene[field];
}

function levelText(level, language) {
  const lang = getLanguage(language);
  return I18N[lang].levels[level.id] ?? level.title;
}

function powerupText(id, language) {
  const lang = getLanguage(language);
  return I18N[lang].powerups[id] ?? id;
}

function shopText(item, language) {
  const lang = getLanguage(language);
  return I18N[lang].shop[item.id] ?? { title: item.title, value: item.value };
}

function questText(quest, language) {
  const lang = getLanguage(language);
  return I18N[lang].quests[quest.id] ?? { title: quest.title, unit: quest.unit };
}

function powerupInfo(id, language) {
  const lang = getLanguage(language);
  return I18N[lang].powerupInfo[id] ?? I18N.en.powerupInfo[id];
}

function formatPrice(price, currency, language) {
  return currency === "gems" ? tr(language, "gemsPrice", { price }) : tr(language, "coinsPrice", { price });
}

function formatYuan(price, language) {
  return tr(language, "yuanPrice", { price });
}

function specialMarbleInfo(id, language) {
  if (!id) return null;
  const lang = getLanguage(language);
  return I18N[lang].specialMarbles[id] ?? I18N.en.specialMarbles[id] ?? SPECIAL_MARBLES[id] ?? null;
}

function specialMarblePayload(language) {
  return Object.fromEntries(
    Object.keys(SPECIAL_MARBLES).map((id) => {
      const info = specialMarbleInfo(id, language);
      return [id, { id, name: info?.name || id, description: info?.description || "" }];
    }),
  );
}

function shotLabel(shot, language) {
  if (!shot?.special) return tr(language, "normalMarble");
  return specialMarbleInfo(shot.special, language)?.name || shot.special;
}

function formatPowerupBundle(bundle, language) {
  const entries = Object.entries(bundle || {}).filter(([, count]) => count > 0);
  if (!entries.length) return tr(language, "noRewardItems");
  return entries.map(([id, count]) => `+${count} ${powerupText(id, language)}`).join(" / ");
}

function xpForLevel(level) {
  return 620 + Math.max(0, level - 1) * 180;
}

function makeDefaultLevelState() {
  return Object.fromEntries(
    LEVELS.map((level) => [
      level.id,
      {
        unlocked: level.number === 1,
        completed: false,
        stars: 0,
        bestScore: 0,
      },
    ]),
  );
}

function makeDefaultSave() {
  return {
    language: "zh",
    musicTrack: MUSIC_TRACKS[0].id,
    musicEnabled: true,
    sfxEnabled: true,
    profileLevel: 1,
    xp: 0,
    coins: 0,
    gems: 0,
    selectedScene: SCENES[0].id,
    selectedLevelId: "crystal-1",
    inventory: { surge: 1, freeze: 1, burst: 1, prism: 0 },
    paidPowerupPurchases: {},
    upgrades: { aquaCore: 0, pearlSight: 0, stormCache: 0 },
    quests: {
      combo: { value: 0, claimed: false },
      relic: { value: 0, claimed: false },
      coral: { value: 0, claimed: false },
    },
    levels: makeDefaultLevelState(),
  };
}

function normalizeSave(raw) {
  const base = makeDefaultSave();
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    ...base,
    ...source,
    language: getLanguage(source.language || base.language),
    musicTrack: getMusicTrack(source.musicTrack || base.musicTrack).id,
    musicEnabled: source.musicEnabled !== false,
    sfxEnabled: source.sfxEnabled !== false,
    inventory: { ...base.inventory, ...(source.inventory || {}) },
    paidPowerupPurchases: { ...base.paidPowerupPurchases, ...(source.paidPowerupPurchases || {}) },
    upgrades: { ...base.upgrades, ...(source.upgrades || {}) },
    quests: { ...base.quests, ...(source.quests || {}) },
    levels: { ...base.levels, ...(source.levels || {}) },
  };
}

function loadGameSave() {
  if (typeof window === "undefined") return makeDefaultSave();
  try {
    return normalizeSave(JSON.parse(window.localStorage.getItem(SAVE_KEY) || "null"));
  } catch {
    return makeDefaultSave();
  }
}

function saveGame(save) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function getLevel(levelId) {
  return LEVELS.find((level) => level.id === levelId) || LEVELS[0];
}

function getSceneLevels(sceneId) {
  return LEVELS.filter((level) => level.sceneId === sceneId);
}

function getNextLevel(levelId) {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  return index >= 0 ? LEVELS[index + 1] || null : null;
}

function getFirstPlayableLevel(save, sceneId) {
  return getSceneLevels(sceneId).find((level) => save.levels[level.id]?.unlocked) || getSceneLevels(sceneId)[0] || LEVELS[0];
}

function addXp(profileLevel, xp, gain) {
  let nextLevel = profileLevel;
  let nextXp = xp + gain;
  let need = xpForLevel(nextLevel);
  while (nextXp >= need) {
    nextXp -= need;
    nextLevel += 1;
    need = xpForLevel(nextLevel);
  }
  return { profileLevel: nextLevel, xp: nextXp };
}

function makeRunPowerups(save) {
  const stormBonus = save.upgrades.stormCache || 0;
  return {
    surge: (save.inventory.surge || 0) + stormBonus,
    freeze: (save.inventory.freeze || 0) + stormBonus,
    burst: (save.inventory.burst || 0) + stormBonus,
    prism: save.inventory.prism || 0,
  };
}

function computeStars(raw, level) {
  if (raw.status !== "complete") return 0;
  let stars = 1;
  if (raw.score >= level.targetScore || raw.removedOrbs >= level.chainLength) stars += 1;
  if (raw.maxCombo >= 4 || raw.score >= level.targetScore * 1.35) stars += 1;
  return clamp(stars, 1, 3);
}

function buildRunResult(raw, level, save) {
  const stars = computeStars(raw, level);
  const prior = save.levels[level.id] || {};
  const firstClear = raw.status === "complete" && !prior.completed;
  const rewardScale = raw.status === "complete" ? (firstClear ? 1 : 0.3) : 0.12;
  const rewardPowerup = POWERUPS[(level.number + SCENES.findIndex((scene) => scene.id === level.sceneId)) % POWERUPS.length]?.id || "surge";
  return {
    ...raw,
    stars,
    firstClear,
    levelId: level.id,
    levelTitle: level.title,
    reward: {
      coins: Math.round(level.reward.coins * rewardScale),
      gems: firstClear ? level.reward.gems : 0,
      xp: Math.round(level.reward.xp * rewardScale),
      powerups: firstClear ? { [rewardPowerup]: 1 } : {},
    },
  };
}

function applyRunResult(save, result) {
  const next = normalizeSave(save);
  const current = next.levels[result.levelId] || { unlocked: true, completed: false, stars: 0, bestScore: 0 };
  next.levels[result.levelId] = {
    ...current,
    unlocked: true,
    completed: current.completed || result.status === "complete",
    stars: Math.max(current.stars || 0, result.stars || 0),
    bestScore: Math.max(current.bestScore || 0, result.score || 0),
  };
  if (result.status === "complete") {
    const nextLevel = getNextLevel(result.levelId);
    if (nextLevel) {
      next.levels[nextLevel.id] = {
        ...(next.levels[nextLevel.id] || {}),
        unlocked: true,
      };
    }
  }
  next.coins += result.reward?.coins || 0;
  next.gems += result.reward?.gems || 0;
  for (const [id, count] of Object.entries(result.reward?.powerups || {})) {
    next.inventory[id] = (next.inventory[id] || 0) + count;
  }
  const leveled = addXp(next.profileLevel, next.xp, result.reward?.xp || 0);
  next.profileLevel = leveled.profileLevel;
  next.xp = leveled.xp;
  next.quests = {
    ...next.quests,
    combo: {
      ...next.quests.combo,
      value: Math.min(QUEST_DEFS[0].target, (next.quests.combo?.value || 0) + (result.maxCombo || 0)),
    },
    relic: {
      ...next.quests.relic,
      value: Math.min(QUEST_DEFS[1].target, (next.quests.relic?.value || 0) + (result.status === "complete" ? 1 : 0)),
    },
    coral: {
      ...next.quests.coral,
      value: Math.min(QUEST_DEFS[2].target, (next.quests.coral?.value || 0) + (result.removedOrbs || 0)),
    },
  };
  return next;
}

const AUDIO_NOTES = {
  crystal: [261.63, 329.63, 392.0, 493.88, 587.33, 659.25, 783.99, 880.0],
  abyssal: [146.83, 220.0, 293.66, 369.99, 440.0, 554.37, 587.33, 739.99],
  neon: [196.0, 246.94, 329.63, 415.3, 493.88, 622.25, 739.99, 987.77],
};

function createGameAudio() {
  const api = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    musicElement: null,
    drone: null,
    pulseTimer: null,
    padOscillators: [],
    chordTimer: null,
    currentSceneId: null,
    currentTrackId: MUSIC_TRACKS[0].id,
    musicStepIndex: 0,
    musicAdvanceMs: 0,
    enabled: true,
    musicEnabled: true,
    sfxEnabled: true,
    started: false,
    lastRollAt: 0,
    events: [],
    eventCounts: {},
    musicProfile: {
      mood: "calm-mystery",
      lowRumble: false,
      drone: false,
      noiseFree: true,
      backgroundMode: "scene-loop",
      selectedTrack: MUSIC_TRACKS[0].id,
      continuousLoop: true,
      audibleLevel: 0.88,
      usesDownloadedAudio: true,
      audioPath: MUSIC_TRACKS[0].audioPath,
      source: "downloaded",
      enabled: true,
    },
    syncGains() {
      this.enabled = this.musicEnabled || this.sfxEnabled;
      if (this.master) this.master.gain.value = this.enabled ? MUSIC_VOLUME : 0;
      if (this.musicGain) this.musicGain.gain.value = this.musicEnabled ? 0.5 : 0;
      if (this.sfxGain) this.sfxGain.gain.value = this.sfxEnabled ? SFX_GAIN_LEVEL : 0;
      if (this.musicElement) {
        this.musicElement.volume = this.musicEnabled ? MUSIC_VOLUME : 0;
        if (!this.musicEnabled) this.musicElement.pause();
      }
    },
    ensure() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.master.gain.value = this.enabled ? MUSIC_VOLUME : 0;
        this.musicGain.gain.value = this.musicEnabled ? 0.5 : 0;
        this.sfxGain.gain.value = this.sfxEnabled ? SFX_GAIN_LEVEL : 0;
        this.musicGain.connect(this.master);
        this.sfxGain.connect(this.master);
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },
    ensureMusicElement() {
      if (!this.musicElement) {
        this.musicElement = new Audio();
        this.musicElement.loop = true;
        this.musicElement.preload = "auto";
        this.musicElement.volume = this.musicEnabled ? MUSIC_VOLUME : 0;
      }
      return this.musicElement;
    },
    log(type) {
      this.eventCounts[type] = (this.eventCounts[type] || 0) + 1;
      this.events.push({ type, at: Date.now() });
      if (this.events.length > 18) this.events.shift();
    },
    setEnabled(enabled) {
      this.musicEnabled = enabled;
      this.sfxEnabled = enabled;
      const ctx = this.ensure();
      if (!ctx) return;
      this.syncGains();
      if (enabled && this.currentSceneId) this.startMusic({ id: this.currentSceneId }, this.currentTrackId);
      if (!enabled) this.stopMusic();
      this.log(enabled ? "audio-on" : "audio-off");
    },
    setMusicEnabled(enabled) {
      this.musicEnabled = enabled;
      const ctx = this.ensure();
      if (!ctx) return;
      this.syncGains();
      this.musicProfile = { ...this.musicProfile, enabled, audibleLevel: enabled ? MUSIC_VOLUME : 0 };
      if (enabled && this.currentSceneId) this.startMusic({ id: this.currentSceneId }, this.currentTrackId);
      if (!enabled) this.stopMusic();
      this.log(enabled ? "music-on" : "music-off");
    },
    setSfxEnabled(enabled) {
      this.sfxEnabled = enabled;
      const ctx = this.ensure();
      if (!ctx) return;
      this.syncGains();
      this.log(enabled ? "sfx-on" : "sfx-off");
    },
    setTrack(trackId) {
      const nextTrack = getMusicTrack(trackId).id;
      if (this.currentTrackId === nextTrack) return;
      this.currentTrackId = nextTrack;
      this.musicProfile = {
        ...this.musicProfile,
        selectedTrack: nextTrack,
        mood: getMusicTrack(nextTrack).mood,
        audioPath: getMusicTrack(nextTrack).audioPath,
      };
      this.stopMusic();
    },
    playMusicPhrase(scene, track) {
      if (!this.musicEnabled || !track?.audioPath) return;
      this.musicStepIndex += 1;
      this.log("music-loop");
    },
    advanceMusic(ms, scene, trackId = this.currentTrackId) {
      if (!this.started || !this.musicEnabled) return;
      const track = getMusicTrack(trackId);
      const interval = track.id === "mystic-light" ? 1120 : track.id === "coral-harp" ? 960 : 1040;
      this.musicAdvanceMs += ms;
      while (this.musicAdvanceMs >= interval) {
        this.musicAdvanceMs -= interval;
        this.playMusicPhrase(scene, track);
      }
    },
    startMusic(scene, trackId = this.currentTrackId) {
      const ctx = this.ensure();
      if (!ctx) return;
      const track = getMusicTrack(trackId);
      if (this.currentSceneId !== scene.id || this.currentTrackId !== track.id) this.stopMusic();
      this.currentSceneId = scene.id;
      this.currentTrackId = track.id;
      this.musicProfile = {
        mood: track.mood,
        lowRumble: false,
        drone: false,
        noiseFree: true,
        backgroundMode: "scene-loop",
        selectedTrack: track.id,
        continuousLoop: true,
        audibleLevel: this.musicEnabled ? MUSIC_VOLUME : 0,
        usesDownloadedAudio: true,
        audioPath: track.audioPath,
        source: track.source,
        credit: track.credit,
        enabled: this.musicEnabled,
      };
      if (!this.musicEnabled) {
        this.started = false;
        this.stopMusic();
        return;
      }
      const element = this.ensureMusicElement();
      if (!element.src.endsWith(track.audioPath)) {
        element.src = track.audioPath;
        element.load();
      }
      element.loop = true;
      element.volume = MUSIC_VOLUME;
      element.play().catch(() => {});
      this.started = true;
      if (!this.pulseTimer) {
        this.playMusicPhrase(scene, track);
        this.pulseTimer = window.setInterval(() => {
          this.playMusicPhrase(scene, track);
        }, track.id === "mystic-light" ? 1120 : track.id === "coral-harp" ? 960 : 1040);
      }
      this.log("music");
    },
    stopMusic() {
      if (this.pulseTimer) {
        window.clearInterval(this.pulseTimer);
        this.pulseTimer = null;
      }
      if (this.musicElement) {
        this.musicElement.pause();
      }
      if (this.chordTimer) {
        window.clearInterval(this.chordTimer);
        this.chordTimer = null;
      }
      if (this.drone && this.ctx) {
        const { osc, gain } = this.drone;
        const stopAt = this.ctx.currentTime + 0.35;
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.14);
        try {
          osc.stop(stopAt);
        } catch {
          // Already stopped.
        }
      }
      this.drone = null;
      this.musicAdvanceMs = 0;
      for (const voice of this.padOscillators) {
        if (!this.ctx) continue;
        const stopAt = this.ctx.currentTime + 0.32;
        voice.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
        try {
          voice.osc.stop(stopAt);
        } catch {
          // Already stopped.
        }
      }
      this.padOscillators = [];
    },
    chime(freq, duration = 0.18, volume = 0.12, type = "sine", out = this.musicGain) {
      const ctx = this.ensure();
      if (!ctx) return;
      const isSfx = out === this.sfxGain;
      if (isSfx ? !this.sfxEnabled : !this.musicEnabled) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), ctx.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.03);
    },
    noise(duration, volume, filterFreq, filterType = "bandpass") {
      const ctx = this.ensure();
      if (!ctx || !this.sfxEnabled) return;
      const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      source.start();
    },
    shoot(scene) {
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.chime(notes[2] * 2, 0.14, 0.3, "triangle", this.sfxGain);
      this.chime(notes[4] * 2, 0.2, 0.18, "sine", this.sfxGain);
      this.log("shoot");
    },
    hit(scene) {
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.chime(notes[1] * 2.5, 0.11, 0.26, "triangle", this.sfxGain);
      this.noise(0.1, 0.11, scene.id === "abyssal" ? 820 : 1300);
      this.log("hit");
    },
    roll(scene) {
      const now = performance.now();
      if (now - this.lastRollAt < 1450) return;
      this.lastRollAt = now;
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.chime(notes[2] * 0.5, 0.12, 0.03, "sine", this.sfxGain);
      this.log("roll");
    },
    match(scene, count = 3) {
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.chime(notes[3] * 2, 0.14, 0.32, "triangle", this.sfxGain);
      this.chime(notes[4] * 2.5, 0.22, 0.24, "sine", this.sfxGain);
      this.noise(0.16, 0.12 + count * 0.007, 1800, "highpass");
      this.log("match");
    },
    explosion(scene) {
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.noise(0.32, 0.26, scene.id === "abyssal" ? 920 : 1200, "bandpass");
      this.chime(notes[1] * 1.25, 0.3, 0.25, "triangle", this.sfxGain);
      this.chime(notes[3] * 1.5, 0.24, 0.22, "triangle", this.sfxGain);
      this.log("explosion");
    },
    joinImpact(scene, power = 1) {
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.chime(notes[5] * 1.4, 0.12, 0.28 + power * 0.018, "triangle", this.sfxGain);
      this.chime(notes[3] * 2.1, 0.2, 0.19 + power * 0.012, "sine", this.sfxGain);
      this.noise(0.14, 0.1 + power * 0.01, 2100, "bandpass");
      this.log("join-impact");
    },
    freeze(scene) {
      const notes = AUDIO_NOTES[scene.id] || AUDIO_NOTES.crystal;
      this.chime(notes[4] * 2.2, 0.38, 0.25, "sine", this.sfxGain);
      this.noise(0.22, 0.08, 2600, "highpass");
      this.log("freeze");
    },
    getState() {
      return {
        enabled: this.enabled,
        controls: {
          musicEnabled: this.musicEnabled,
          sfxEnabled: this.sfxEnabled,
        },
        started: this.started,
        scene: this.currentSceneId,
        musicProfile: { ...this.musicProfile, enabled: this.musicEnabled, audibleLevel: this.musicEnabled ? MUSIC_VOLUME : 0 },
        sfxProfile: {
          enabled: this.sfxEnabled,
          audibleLevel: this.sfxEnabled ? SFX_AUDIBLE_LEVEL : 0,
          gain: this.sfxGain?.gain?.value ?? (this.sfxEnabled ? SFX_GAIN_LEVEL : 0),
          actions: SFX_ACTIONS,
          separatedFromMusic: true,
        },
        eventCounts: { ...this.eventCounts },
        recentEvents: this.events.slice(-8).map((event) => event.type),
      };
    },
  };
  return api;
}

const gameAudio = createGameAudio();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distancePointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq, 0, 1);
  const x = start.x + dx * t;
  const y = start.y + dy * t;
  return Math.hypot(point.x - x, point.y - y);
}

function makeSeededRandom(seedText) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function colorWithAlpha(hex, alpha) {
  const raw = hex.replace("#", "");
  const value = parseInt(raw, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function CatmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function makePathFromAnchors(anchors) {
  const points = [];
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const p0 = anchors[Math.max(0, i - 1)];
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    const p3 = anchors[Math.min(anchors.length - 1, i + 2)];
    for (let step = 0; step < 24; step += 1) {
      points.push(CatmullRomPoint(p0, p1, p2, p3, step / 24));
    }
  }
  points.push(anchors[anchors.length - 1]);

  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) {
    lengths[i] = lengths[i - 1] + distance(points[i], points[i - 1]);
  }
  return { points, lengths, total: lengths[lengths.length - 1] };
}

function buildPath(w, h, scene, level) {
  const portrait = h > w * 1.08;
  const sceneId = scene.id;
  const terrain = level.terrain || "single";
  const entryCount = level.entryCount || 1;
  const exitCount = level.exitCount || 1;
  let anchors;
  const entries = portrait
    ? [
        { x: w * 0.13, y: h * 0.13 },
        { x: w * 0.86, y: h * 0.14 },
        { x: w * 0.50, y: h * 0.08 },
      ]
    : [
        { x: w * 0.06, y: h * 0.19 },
        { x: w * 0.94, y: h * 0.18 },
        { x: w * 0.50, y: h * 0.12 },
      ];
  const exits = portrait
    ? [
        { x: w * 0.18, y: h * 0.90 },
        { x: w * 0.84, y: h * 0.88 },
        { x: w * 0.50, y: h * 0.82 },
      ]
    : [
        { x: w * 0.40, y: h * 0.80 },
        { x: w * 0.88, y: h * 0.74 },
        { x: w * 0.12, y: h * 0.76 },
      ];
  const activeEntry = entries[(level.number + (scene.index || 1) - 2) % entryCount];
  const activeExit = exits[(level.number + (scene.index || 1) - 1) % exitCount];

  if (portrait) {
    const middle =
      terrain === "multiVent"
        ? [
            { x: w * 0.82, y: h * 0.20 },
            { x: w * 0.21, y: h * 0.31 },
            { x: w * 0.80, y: h * 0.42 },
            { x: w * 0.20, y: h * 0.54 },
            { x: w * 0.84, y: h * 0.66 },
            { x: w * 0.24, y: h * 0.77 },
          ]
        : terrain === "dualGate" || terrain === "crossCurrent"
          ? [
              { x: w * 0.80, y: h * 0.20 },
              { x: w * 0.24, y: h * 0.32 },
              { x: w * 0.78, y: h * 0.48 },
              { x: w * 0.20, y: h * 0.60 },
              { x: w * 0.76, y: h * 0.74 },
            ]
          : [
              { x: w * 0.82, y: h * 0.18 },
              { x: w * 0.80, y: h * 0.33 },
              { x: w * 0.18, y: h * 0.37 },
              { x: w * 0.17, y: h * 0.53 },
              { x: w * 0.83, y: h * 0.56 },
              { x: w * 0.78, y: h * 0.72 },
              { x: w * 0.27, y: h * 0.77 },
            ];
    anchors = [activeEntry, ...middle, activeExit];
  } else {
    const middle =
      terrain === "multiVent"
        ? [
            { x: w * 0.90, y: h * 0.20 },
            { x: w * 0.78, y: h * 0.34 },
            { x: w * 0.16, y: h * 0.38 },
            { x: w * 0.20, y: h * 0.55 },
            { x: w * 0.86, y: h * 0.58 },
            { x: w * 0.78, y: h * 0.72 },
            { x: w * 0.18, y: h * 0.74 },
          ]
        : terrain === "dualGate" || terrain === "crossCurrent"
          ? [
              { x: w * 0.90, y: h * 0.20 },
              { x: w * 0.86, y: h * 0.36 },
              { x: w * 0.17, y: h * 0.41 },
              { x: w * 0.15, y: h * 0.58 },
              { x: w * 0.78, y: h * 0.62 },
              { x: w * 0.76, y: h * 0.74 },
            ]
          : sceneId === "abyssal"
            ? [
                { x: w * 0.82, y: h * 0.20 },
                { x: w * 0.88, y: h * 0.34 },
                { x: w * 0.22, y: h * 0.40 },
                { x: w * 0.12, y: h * 0.56 },
                { x: w * 0.76, y: h * 0.60 },
                { x: w * 0.78, y: h * 0.76 },
              ]
            : [
                { x: w * 0.90, y: h * 0.20 },
                { x: w * 0.90, y: h * 0.36 },
                { x: w * 0.16, y: h * 0.40 },
                { x: w * 0.13, y: h * 0.58 },
                { x: w * 0.76, y: h * 0.60 },
                { x: w * 0.80, y: h * 0.75 },
              ];
    anchors = [activeEntry, ...middle, activeExit];
  }

  const main = makePathFromAnchors(anchors);
  const branchPaths = [];
  if (entryCount > 1) {
    for (let i = 0; i < entryCount; i += 1) {
      if (entries[i] === activeEntry) continue;
      branchPaths.push(makePathFromAnchors([entries[i], anchors[2] || anchors[1], anchors[3] || activeExit]));
    }
  }
  if (exitCount > 1) {
    for (let i = 0; i < exitCount; i += 1) {
      if (exits[i] === activeExit) continue;
      branchPaths.push(makePathFromAnchors([anchors.at(-3) || anchors.at(-2), anchors.at(-2), exits[i]]));
    }
  }

  return {
    ...main,
    portrait,
    terrain,
    entries: entries.slice(0, entryCount),
    exits: exits.slice(0, exitCount),
    activeEntry,
    activeExit,
    branchPaths,
  };
}

function pointAt(path, target) {
  const distanceTarget = clamp(target, 0, path.total);
  let lo = 0;
  let hi = path.lengths.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (path.lengths[mid] < distanceTarget) lo = mid + 1;
    else hi = mid;
  }
  const index = Math.max(1, lo);
  const prevLength = path.lengths[index - 1];
  const segmentLength = Math.max(1, path.lengths[index] - prevLength);
  const t = (distanceTarget - prevLength) / segmentLength;
  const p0 = path.points[index - 1];
  const p1 = path.points[index];
  return {
    x: p0.x + (p1.x - p0.x) * t,
    y: p0.y + (p1.y - p0.y) * t,
    angle: Math.atan2(p1.y - p0.y, p1.x - p0.x),
  };
}

function createInitialChain(scene, count, seedSuffix = "") {
  const random = makeSeededRandom(`${scene.id}-${seedSuffix}`);
  const chain = [];
  for (let i = 0; i < count; i += 1) {
    let color = Math.floor(random() * scene.colors.length);
    if (i > 1 && chain[i - 1].colorIndex === color && chain[i - 2].colorIndex === color) {
      color = (color + 1 + Math.floor(random() * (scene.colors.length - 1))) % scene.colors.length;
    }
    chain.push({ id: `${scene.id}-seed-${i}`, colorIndex: color });
  }
  return chain;
}

function loadSceneImage(scene, callback) {
  const image = new Image();
  image.src = scene.image;
  image.onload = callback;
  return image;
}

function drawCoverImage(ctx, image, w, h, alpha, sourceCrop = null) {
  if (!image?.complete || !image.naturalWidth) return;
  const src = sourceCrop || { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
  const scale = Math.max(w / src.w, h / src.h);
  const drawW = src.w * scale;
  const drawH = src.h * scale;
  const x = (w - drawW) / 2;
  const y = (h - drawH) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, src.x, src.y, src.w, src.h, x, y, drawW, drawH);
  ctx.restore();
}

function drawSceneBackdrop(ctx, view, scene, image, time) {
  const { w, h } = view;
  const palette = scene.palette;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, palette.mid);
  bg.addColorStop(0.38, palette.deep);
  bg.addColorStop(1, palette.page);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  drawCoverImage(ctx, image, w, h, scene.id === "neon" ? 0.2 : 0.23);

  const wash = ctx.createRadialGradient(w * 0.5, h * 0.04, 12, w * 0.5, h * 0.1, h * 0.7);
  wash.addColorStop(0, "rgba(155, 246, 255, 0.42)");
  wash.addColorStop(0.42, "rgba(17, 168, 202, 0.12)");
  wash.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  const topMask = ctx.createLinearGradient(0, 0, 0, h * 0.18);
  topMask.addColorStop(0, colorWithAlpha(palette.page, 0.78));
  topMask.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topMask;
  ctx.fillRect(0, 0, w, h * 0.18);
  const bottomMask = ctx.createLinearGradient(0, h * 0.82, 0, h);
  bottomMask.addColorStop(0, "rgba(0,0,0,0)");
  bottomMask.addColorStop(0.48, colorWithAlpha(palette.page, 0.78));
  bottomMask.addColorStop(1, colorWithAlpha(palette.page, 0.92));
  ctx.fillStyle = bottomMask;
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.42;
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 149 + time * 14) % (w + 160)) - 80;
    const y = h * (0.12 + ((i * 73) % 80) / 100);
    const r = 3 + ((i * 17) % 10);
    const bubble = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
    bubble.addColorStop(0, "rgba(255,255,255,0.85)");
    bubble.addColorStop(0.45, colorWithAlpha(scene.palette.bright, 0.16));
    bubble.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = bubble;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = scene.id === "neon" ? 0.55 : 0.35;
  for (let i = 0; i < 9; i += 1) {
    const x = (w * (0.09 + i * 0.11)) % w;
    const y = h * (0.72 + ((i * 19) % 15) / 100);
    const height = h * (0.09 + ((i * 7) % 10) / 100);
    ctx.strokeStyle = i % 2 ? scene.palette.hot : scene.palette.bright;
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.bezierCurveTo(x - 18, y + height * 0.65, x + 14, y + height * 0.35, x, y);
    ctx.stroke();
  }
  ctx.restore();
}

function strokePath(ctx, path) {
  ctx.beginPath();
  path.points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
}

function drawTrack(ctx, path, scene, radius) {
  const palette = scene.palette;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const branch of path.branchPaths || []) {
    strokePath(ctx, branch);
    ctx.strokeStyle = colorWithAlpha(palette.hot, 0.16);
    ctx.lineWidth = radius * 2.15;
    ctx.stroke();
    strokePath(ctx, branch);
    ctx.strokeStyle = colorWithAlpha(palette.bright, 0.22);
    ctx.lineWidth = radius * 0.62;
    ctx.setLineDash([radius * 1.6, radius * 1.05]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  strokePath(ctx, path);
  ctx.strokeStyle = scene.railStyle === "stone" ? "rgba(9, 14, 20, 0.9)" : "rgba(2, 17, 30, 0.72)";
  ctx.lineWidth = radius * 3.3;
  ctx.stroke();

  strokePath(ctx, path);
  ctx.strokeStyle = scene.railStyle === "stone" ? "#30404a" : colorWithAlpha(palette.bright, 0.42);
  ctx.lineWidth = radius * 2.62;
  ctx.stroke();

  strokePath(ctx, path);
  ctx.strokeStyle = scene.railStyle === "tube" ? "rgba(171, 251, 255, 0.34)" : colorWithAlpha(palette.accent, 0.9);
  ctx.lineWidth = radius * 2.1;
  ctx.stroke();

  strokePath(ctx, path);
  ctx.strokeStyle = scene.railStyle === "stone" ? "#1c2730" : "rgba(15, 173, 201, 0.34)";
  ctx.lineWidth = radius * 1.68;
  ctx.stroke();

  strokePath(ctx, path);
  ctx.strokeStyle = scene.railStyle === "tube" ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.12)";
  ctx.lineWidth = radius * 0.48;
  ctx.stroke();

  const drawPortal = (point, active) => {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.shadowColor = active ? palette.bright : palette.hot;
    ctx.shadowBlur = active ? radius * 1.6 : radius * 0.72;
    const rim = ctx.createRadialGradient(0, 0, radius * 0.12, 0, 0, radius * 1.46);
    rim.addColorStop(0, "rgba(0, 3, 8, 0.96)");
    rim.addColorStop(0.42, "rgba(0, 9, 17, 0.94)");
    rim.addColorStop(0.64, active ? colorWithAlpha(palette.bright, 0.38) : colorWithAlpha(palette.hot, 0.22));
    rim.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (active ? 1.32 : 1.05), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = active ? colorWithAlpha(palette.accent, 0.92) : colorWithAlpha(palette.bright, 0.34);
    ctx.lineWidth = Math.max(1, radius * 0.14);
    ctx.stroke();
    ctx.strokeStyle = colorWithAlpha("#ffffff", active ? 0.42 : 0.2);
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.68, -0.2, Math.PI * 1.52);
    ctx.stroke();
    ctx.restore();
  };
  (path.entries || []).forEach((entry) => drawPortal(entry, entry === path.activeEntry));
  (path.exits || []).forEach((exit) => drawPortal(exit, exit === path.activeExit));
  ctx.restore();
}

function drawBall(ctx, x, y, r, color, scene, shine = 1) {
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "rgba(0, 4, 12, 0.76)";
  ctx.beginPath();
  ctx.ellipse(x + r * 0.18, y + r * 0.36, r * 0.78, r * 0.34, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.shadowColor = colorWithAlpha(color, scene.id === "abyssal" ? 0.5 : 0.78);
  ctx.shadowBlur = scene.id === "neon" ? r * 1.05 : r * 0.7;
  const gradient = ctx.createRadialGradient(x - r * 0.42, y - r * 0.52, r * 0.08, x + r * 0.12, y + r * 0.2, r * 1.12);
  gradient.addColorStop(0, colorWithAlpha("#ffffff", 0.98));
  gradient.addColorStop(0.11, colorWithAlpha("#ffffff", 0.72));
  gradient.addColorStop(0.28, colorWithAlpha(color, 0.76));
  gradient.addColorStop(0.62, colorWithAlpha(color, 0.9));
  gradient.addColorStop(0.88, colorWithAlpha(scene.id === "abyssal" ? "#0d1524" : "#022334", 0.86));
  gradient.addColorStop(1, colorWithAlpha("#00131b", 0.92));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  const innerGlow = ctx.createRadialGradient(x - r * 0.16, y - r * 0.1, 0, x, y, r * 0.86);
  innerGlow.addColorStop(0, colorWithAlpha("#ffffff", 0.22 * shine));
  innerGlow.addColorStop(0.46, colorWithAlpha("#d7fbff", 0.08 * shine));
  innerGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.94, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, r * 0.095);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.93, -1.05, Math.PI * 1.24);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha("#00111b", 0.28);
  ctx.lineWidth = Math.max(1, r * 0.11);
  ctx.beginPath();
  ctx.arc(x + r * 0.08, y + r * 0.08, r * 0.72, 0.28, Math.PI * 1.05);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha("#ffffff", 0.2 * shine);
  ctx.lineWidth = Math.max(1, r * 0.045);
  for (let i = 0; i < 3; i += 1) {
    const angle = -0.4 + i * 0.72;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * r * 0.18, y + Math.sin(angle) * r * 0.18);
    ctx.lineTo(x + Math.cos(angle + 0.9) * r * 0.72, y + Math.sin(angle + 0.9) * r * 0.72);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.78 * shine;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.28, y - r * 0.34, r * 0.2, r * 0.11, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.58 * shine;
  ctx.beginPath();
  ctx.arc(x - r * 0.46, y - r * 0.48, r * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.34 * shine;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.22, y + r * 0.2, r * 0.18, r * 0.08, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpecialHalo(ctx, x, y, r, special, scene) {
  if (!special) return;
  const time = performance.now() / 1000;
  const pulse = 0.5 + Math.sin(time * 5.2) * 0.5;
  const palette = scene.palette;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  if (special === "rainbow") {
    const bands = ["#ff4f78", "#ffd85a", "#53f36d", "#50dcff", "#b86cff"];
    bands.forEach((band, index) => {
      ctx.strokeStyle = colorWithAlpha(band, 0.62 - index * 0.05);
      ctx.lineWidth = Math.max(1, r * (0.08 + index * 0.012));
      ctx.beginPath();
      ctx.arc(x, y, r * (1.24 + pulse * 0.18 + index * 0.1), index * 0.72 + time * 0.8, Math.PI * 1.4 + index * 0.72 + time * 0.8);
      ctx.stroke();
    });
    ctx.shadowColor = "#80f7ff";
    ctx.shadowBlur = r * 1.5;
    ctx.strokeStyle = colorWithAlpha("#ffffff", 0.5);
    ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.beginPath();
    ctx.arc(x, y, r * (1.62 + pulse * 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (special === "bomb") {
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * (2.05 + pulse * 0.18));
    glow.addColorStop(0, colorWithAlpha("#fff1a0", 0.38));
    glow.addColorStop(0.38, colorWithAlpha("#ff8a3d", 0.28));
    glow.addColorStop(1, "rgba(255,90,45,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * (2.05 + pulse * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(palette.accent, 0.72);
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r * (1.38 + pulse * 0.2), -0.8 + time, Math.PI * 1.25 + time);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShotBall(ctx, x, y, r, color, scene, special = null, shine = 1) {
  drawSpecialHalo(ctx, x, y, r, special, scene);
  drawBall(ctx, x, y, r, color, scene, special ? shine * 1.12 : shine);
  if (!special) return;
  ctx.save();
  ctx.translate(x, y);
  if (special === "rainbow") {
    const bands = ["#ff4f78", "#ffd85a", "#53f36d", "#50dcff", "#b86cff"];
    bands.forEach((band, index) => {
      ctx.strokeStyle = colorWithAlpha(band, 0.82 - index * 0.08);
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.72 + index * 0.09), index * 0.58, Math.PI * 1.28 + index * 0.58);
      ctx.stroke();
    });
    ctx.fillStyle = colorWithAlpha("#ffffff", 0.86);
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.18, Math.sin(angle) * r * 0.18);
      ctx.lineTo(Math.cos(angle) * r * 0.48, Math.sin(angle) * r * 0.48);
      ctx.stroke();
    }
  }
  if (special === "bomb") {
    ctx.fillStyle = "rgba(20, 13, 18, 0.72)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffcf5d";
    ctx.lineWidth = Math.max(1.5, r * 0.14);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, -0.9, Math.PI * 1.25);
    ctx.stroke();
    ctx.fillStyle = "#ff8050";
    ctx.beginPath();
    ctx.arc(r * 0.28, -r * 0.4, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLauncher(ctx, shooter, scene, currentColor, nextColor, radius, currentSpecial = null, nextSpecial = null) {
  const { x, y, angle } = shooter;
  const palette = scene.palette;
  ctx.save();
  ctx.translate(x, y);

  const base = ctx.createRadialGradient(0, 0, 4, 0, 0, radius * 2.4);
  base.addColorStop(0, colorWithAlpha(palette.bright, 0.8));
  base.addColorStop(0.54, palette.card);
  base.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = base;
  ctx.shadowColor = colorWithAlpha(palette.bright, 0.5);
  ctx.shadowBlur = radius;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = radius * 0.22;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.08, 0.12, Math.PI * 1.88);
  ctx.stroke();

  ctx.rotate(angle);
  ctx.fillStyle = colorWithAlpha(palette.bright, 0.7);
  drawRoundedRect(ctx, radius * 0.4, -radius * 0.28, radius * 1.7, radius * 0.56, radius * 0.18);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colorWithAlpha(palette.bright, 0.42);
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.beginPath();
  ctx.moveTo(x + radius * 0.92, y + radius * 0.42);
  ctx.quadraticCurveTo(x + radius * 1.58, y + radius * 1.02, x + radius * 2.34, y + radius * 0.9);
  ctx.stroke();
  ctx.fillStyle = colorWithAlpha(palette.card, 0.68);
  ctx.strokeStyle = colorWithAlpha(palette.accent, 0.82);
  ctx.lineWidth = Math.max(1, radius * 0.12);
  ctx.beginPath();
  ctx.arc(x + radius * 2.62, y + radius * 0.92, radius * 1.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawShotBall(ctx, x, y, radius * 0.98, currentColor, scene, currentSpecial);
  drawShotBall(ctx, x + radius * 2.62, y + radius * 0.92, radius * 0.78, nextColor, scene, nextSpecial, 0.92);
}

function computeToadState(path, scene, radius, time) {
  if (!path?.points?.length) return { visible: false };
  const mouth = path.activeExit || path.points[path.points.length - 1];
  const prev = path.points[Math.max(0, path.points.length - 10)] || mouth;
  const angle = Math.atan2(prev.y - mouth.y, prev.x - mouth.x);
  const cx = mouth.x - Math.cos(angle) * radius * 1.55;
  const cy = mouth.y - Math.sin(angle) * radius * 1.55;
  const blinkWave = Math.sin(time * 1.8 + scene.index * 0.73) + Math.sin(time * 5.1 + scene.index) * 0.24;
  return {
    visible: true,
    kind: "golden-toad",
    material: "gold",
    form: "frog",
    hasWebbedFeet: true,
    x: Math.round(cx),
    y: Math.round(cy),
    mouthX: Math.round(mouth.x),
    mouthY: Math.round(mouth.y),
    angle: Number(angle.toFixed(3)),
    blink: blinkWave > 0.92,
    suctionStrength: Number((0.58 + Math.sin(time * 2.6 + scene.index) * 0.18).toFixed(2)),
    mouthTarget: "chain-front",
  };
}

function drawToadMaw(ctx, path, scene, radius, time) {
  const state = computeToadState(path, scene, radius, time);
  if (!state.visible) return state;
  const palette = scene.palette;
  const scale = radius;
  const mouthX = state.mouthX;
  const mouthY = state.mouthY;
  const angle = state.angle;
  const pulse = state.suctionStrength;

  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i += 1) {
    const t = (time * 0.86 + i * 0.17) % 1;
    const d = scale * (0.8 + t * 3.4);
    const wobble = Math.sin(time * 3 + i) * scale * 0.28;
    const x = mouthX + Math.cos(angle) * d + Math.cos(angle + Math.PI / 2) * wobble;
    const y = mouthY + Math.sin(angle) * d + Math.sin(angle + Math.PI / 2) * wobble;
    ctx.strokeStyle = colorWithAlpha(i % 2 ? palette.hot : palette.bright, (1 - t) * 0.42);
    ctx.lineWidth = Math.max(1, scale * (0.18 - t * 0.08));
    ctx.beginPath();
    ctx.arc(x, y, scale * (0.25 + t * 0.9), angle - 0.8, angle + 0.8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.rotate(angle);
  ctx.shadowColor = "rgba(255, 204, 79, 0.55)";
  ctx.shadowBlur = scale * 1.45;

  const limb = ctx.createRadialGradient(-scale * 1.4, -scale * 1.2, scale * 0.2, -scale * 1.1, 0, scale * 2.7);
  limb.addColorStop(0, "#fff0a4");
  limb.addColorStop(0.42, "#d99b24");
  limb.addColorStop(1, "#6c3a08");
  ctx.fillStyle = limb;
  [
    { x: -scale * 1.68, y: -scale * 1.35, r: -0.35 },
    { x: -scale * 1.68, y: scale * 1.35, r: 0.35 },
  ].forEach((leg) => {
    ctx.save();
    ctx.translate(leg.x, leg.y);
    ctx.rotate(leg.r);
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 1.1, scale * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 238, 160, 0.72)";
    ctx.lineWidth = scale * 0.08;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 224, 103, 0.96)";
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-scale * 0.78, i * scale * 0.25, scale * 0.26, scale * 0.12, i * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  const body = ctx.createRadialGradient(-scale * 0.6, -scale * 0.6, scale * 0.3, 0, 0, scale * 3.4);
  body.addColorStop(0, "#fff7c4");
  body.addColorStop(0.28, "#f5c34d");
  body.addColorStop(0.62, "#b97816");
  body.addColorStop(1, "#5d3410");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(-scale * 0.25, 0, scale * 2.55, scale * 2.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(scale * 0.72, 0, scale * 1.82, scale * 1.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 239, 170, 0.84)";
  ctx.lineWidth = scale * 0.12;
  ctx.stroke();

  const coin = ctx.createRadialGradient(-scale * 0.35, 0, scale * 0.1, -scale * 0.35, 0, scale * 0.54);
  coin.addColorStop(0, "#fffbe0");
  coin.addColorStop(0.5, "#e8b736");
  coin.addColorStop(1, "#8c5510");
  ctx.fillStyle = coin;
  ctx.beginPath();
  ctx.arc(-scale * 0.35, 0, scale * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(95, 55, 8, 0.55)";
  ctx.lineWidth = scale * 0.08;
  ctx.stroke();
  ctx.fillStyle = "rgba(92, 52, 9, 0.5)";
  drawRoundedRect(ctx, -scale * 0.48, -scale * 0.14, scale * 0.26, scale * 0.28, scale * 0.04);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 246, 188, 0.28)";
  for (let i = 0; i < 10; i += 1) {
    const x = scale * (-1.25 + (i % 5) * 0.55);
    const y = scale * (-0.95 + Math.floor(i / 5) * 1.9);
    ctx.beginPath();
    ctx.arc(x, y, scale * (0.09 + (i % 3) * 0.032), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = limb;
  [
    { x: scale * 0.35, y: -scale * 1.45, r: -0.42, flip: -1 },
    { x: scale * 0.35, y: scale * 1.45, r: 0.42, flip: 1 },
  ].forEach((leg) => {
    ctx.save();
    ctx.translate(leg.x, leg.y);
    ctx.rotate(leg.r);
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 0.82, scale * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 242, 174, 0.62)";
    ctx.lineWidth = scale * 0.06;
    ctx.stroke();
    ctx.fillStyle = "#ffd55b";
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(scale * 0.58, i * scale * 0.15, scale * 0.2, scale * 0.08, i * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  const mouth = ctx.createRadialGradient(scale * 1.15, 0, scale * 0.2, scale * 1.35, 0, scale * 1.45);
  mouth.addColorStop(0, "#050207");
  mouth.addColorStop(0.58, "#3b111f");
  mouth.addColorStop(1, "rgba(255, 96, 117, 0.78)");
  ctx.fillStyle = mouth;
  ctx.beginPath();
  ctx.ellipse(scale * 1.2, 0, scale * (1.12 + pulse * 0.1), scale * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha("#fff5ce", 0.86);
  ctx.lineWidth = scale * 0.12;
  ctx.stroke();

  ctx.fillStyle = colorWithAlpha("#fff0a8", 0.14 + pulse * 0.08);
  ctx.beginPath();
  ctx.ellipse(scale * 1.22, 0, scale * 0.5, scale * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawEye = (x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#fff6cf";
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 0.62, scale * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha("#6b3e08", 0.75);
    ctx.lineWidth = scale * 0.08;
    ctx.stroke();
    if (state.blink) {
      ctx.strokeStyle = "#6b3e08";
      ctx.lineWidth = scale * 0.12;
      ctx.beginPath();
      ctx.moveTo(-scale * 0.38, 0);
      ctx.quadraticCurveTo(0, scale * 0.12, scale * 0.38, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#2a1605";
      ctx.beginPath();
      ctx.arc(scale * 0.14, 0, scale * 0.21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(scale * 0.22, -scale * 0.08, scale * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  drawEye(scale * 0.28, -scale * 1.34);
  drawEye(scale * 0.28, scale * 1.34);

  ctx.restore();
  return state;
}

function makeEngine(scene, level, canvas, onHudChange, options = {}) {
  const ctx = canvas.getContext("2d");
  const random = makeSeededRandom(`${scene.id}-${level.id}-game`);
  const image = loadSceneImage(scene, () => engine.render());
  const copy = {
    paused: "Paused",
    sceneCleared: "Scene Cleared",
    chainReached: "Chain Reached The Gate",
    timeExpired: "Time Expired",
    restartHint: "Restart or return to choose another level.",
    ...(options.copy || {}),
  };
  const upgradeSlow = 1 - (options.upgrades?.aquaCore || 0) * 0.08;
  const scoreBonusRate = (options.upgrades?.pearlSight || 0) * PEARL_SIGHT_SCORE_BONUS;
  const terrainPressure = 1 + Math.max(0, (level.entryCount || 1) + (level.exitCount || 1) - 2) * 0.045;
  const baseSpeed = scene.speed * level.speedScale * upgradeSlow * terrainPressure;
  const engine = {
    scene,
    level,
    ctx,
    canvas,
    image,
    view: { w: 1000, h: 700, dpr: 1 },
    path: null,
    chain: createInitialChain(scene, level.chainLength, level.id),
    head: 0,
    spacing: 31,
    ballRadius: 15,
    baseSpeed,
    speed: baseSpeed,
    speedMultiplier: 1,
    accelerationRate: level.acceleration || 0.015,
    score: 0,
    combo: 1,
    maxCombo: 1,
    timer: null,
    elapsedTime: 0,
    mode: "playing",
    finishReason: null,
    finishSent: false,
    removedOrbs: 0,
    paused: false,
    freezeTime: 0,
    powerups: { surge: 0, freeze: 0, burst: 0, prism: 0, ...(options.initialPowerups || {}) },
    currentColor: 0,
    currentSpecial: null,
    nextColors: [1, 2, 3],
    nextSpecials: [null, null, null],
    forcedSpecial: null,
    nextShotId: 1,
    projectile: null,
    shooter: { x: 500, y: 620, angle: -Math.PI / 2 },
    effects: [],
    particles: [],
    shockwaves: [],
    impactWaves: [],
    collisionRecoil: 0,
    activeGap: null,
    cascadeImpulseCount: 0,
    joinImpactCount: 0,
    lastBlastPush: 0,
    lastJoinPush: 0,
    totalBackwardPush: 0,
    frontRollbackSpeed: 0,
    retreatToEntranceCount: 0,
    impactCount: 0,
    lastImpactKnockback: 0,
    explosionCount: 0,
    lastHud: 0,
    startedAt: performance.now() / 1000,
    raf: 0,
    random,
    resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, rect.width);
      const h = Math.max(420, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.view = { w, h, dpr };
      this.path = buildPath(w, h, scene, level);
      this.ballRadius = clamp(Math.min(w, h) / (this.path.portrait ? 22 : 36), 10, 19);
      this.spacing = this.ballRadius * 1.95;
      this.head = Math.max(this.head, this.path.total * (this.path.portrait ? 0.50 : 0.48));
      this.shooter = {
        x: w * 0.5,
        y: this.path.portrait ? h * 0.90 : h * 0.86,
        angle: this.shooter.angle || -Math.PI / 2,
      };
      this.render();
    },
    nextColor() {
      return Math.floor(this.random() * scene.colors.length);
    },
    nextSpecial() {
      if (this.forcedSpecial && SPECIAL_MARBLES[this.forcedSpecial]) {
        const forced = this.forcedSpecial;
        this.forcedSpecial = null;
        return forced;
      }
      const roll = this.random();
      if (roll < SPECIAL_SPAWN_CHANCE * 0.5) return "rainbow";
      if (roll < SPECIAL_SPAWN_CHANCE) return "bomb";
      return null;
    },
    forceSpecial(kind) {
      if (!SPECIAL_MARBLES[kind]) return;
      this.currentSpecial = kind;
      this.pushHud(true);
      this.render();
    },
    currentShotPayload() {
      return {
        colorIndex: this.currentColor,
        color: scene.colors[this.currentColor],
        special: this.currentSpecial,
      };
    },
    makeShotBall(colorIndex) {
      const ball = { id: `${scene.id}-shot-${this.nextShotId}`, colorIndex };
      this.nextShotId += 1;
      return ball;
    },
    popNext() {
      this.currentColor = this.nextColors.shift();
      this.currentSpecial = this.nextSpecials.shift() || null;
      this.nextColors.push(this.nextColor());
      this.nextSpecials.push(this.nextSpecial());
    },
    reset() {
      this.chain = createInitialChain(scene, level.chainLength, `${level.id}-${this.nextShotId}`);
      this.head = this.path.total * (this.path?.portrait ? 0.50 : 0.48);
      this.score = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.timer = null;
      this.elapsedTime = 0;
      this.speed = this.baseSpeed;
      this.speedMultiplier = 1;
      this.mode = "playing";
      this.finishReason = null;
      this.finishSent = false;
      this.removedOrbs = 0;
      this.paused = false;
      this.freezeTime = 0;
      this.projectile = null;
      this.nextShotId = 1;
      this.currentColor = this.nextColor();
      this.currentSpecial = this.nextSpecial();
      this.nextColors = [this.nextColor(), this.nextColor(), this.nextColor()];
      this.nextSpecials = [this.nextSpecial(), this.nextSpecial(), this.nextSpecial()];
      this.powerups = { surge: 0, freeze: 0, burst: 0, prism: 0, ...(options.initialPowerups || {}) };
      this.effects = [];
      this.particles = [];
      this.shockwaves = [];
      this.impactWaves = [];
      this.collisionRecoil = 0;
      this.activeGap = null;
      this.cascadeImpulseCount = 0;
      this.joinImpactCount = 0;
      this.lastBlastPush = 0;
      this.lastJoinPush = 0;
      this.totalBackwardPush = 0;
      this.frontRollbackSpeed = 0;
      this.retreatToEntranceCount = 0;
      this.impactCount = 0;
      this.lastImpactKnockback = 0;
      this.explosionCount = 0;
      if (options.musicTrack) gameAudio.setTrack(options.musicTrack);
      gameAudio.startMusic(scene, options.musicTrack);
      this.pushHud(true);
      this.render();
    },
    setAim(x, y) {
      const dx = x - this.shooter.x;
      const dy = y - this.shooter.y;
      this.shooter.angle = Math.atan2(dy, dx);
      this.render();
    },
    fire() {
      if (this.mode !== "playing" || this.paused || this.projectile) return;
      if (options.musicTrack) gameAudio.setTrack(options.musicTrack);
      gameAudio.startMusic(scene, options.musicTrack);
      gameAudio.shoot(scene);
      const angle = this.shooter.angle;
      const speed = PROJECTILE_SPEED;
      this.projectile = {
        x: this.shooter.x + Math.cos(angle) * this.ballRadius * 1.8,
        y: this.shooter.y + Math.sin(angle) * this.ballRadius * 1.8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: this.currentColor,
        special: this.currentSpecial,
        piercedIds: {},
      };
      this.addSparkBurst(this.shooter.x, this.shooter.y, this.currentSpecial ? SPECIAL_MARBLES[this.currentSpecial].color : scene.colors[this.currentColor], 8, 0.48);
    },
    usePowerup(kind) {
      if (this.mode !== "playing" || this.powerups[kind] <= 0) return;
      if (options.musicTrack) gameAudio.setTrack(options.musicTrack);
      gameAudio.startMusic(scene, options.musicTrack);
      this.powerups[kind] -= 1;
      options.onPowerupUse?.(kind, this.powerups[kind]);
      if (kind === "freeze") {
        this.freezeTime = 4.2;
        this.effects.push({ kind, t: 0, max: 4.2 });
        gameAudio.freeze(scene);
      }
      if (kind === "surge") {
        const removeCount = Math.min(7, this.chain.length);
        this.addExplosionsForRange(0, removeCount - 1, 1.1);
        this.chain.splice(0, removeCount);
        this.recordRemoved(removeCount);
        this.startGapReturn(0, removeCount, 1.1, "surge");
        this.score += removeCount * 120;
        this.effects.push({ kind, t: 0, max: 0.55 });
        gameAudio.explosion(scene);
      }
      if (kind === "burst") {
        const center = Math.floor(this.chain.length * 0.44);
        const start = Math.max(0, center - 3);
        this.addExplosionsForRange(start, start + 6, 1.45);
        const removed = Math.min(7, this.chain.length - start);
        this.chain.splice(start, removed);
        this.recordRemoved(removed);
        this.startGapReturn(start, removed, 1.45, "burst");
        this.score += 760;
        this.effects.push({ kind, t: 0, max: 0.7 });
        gameAudio.explosion(scene);
      }
      if (kind === "prism") {
        let best = { start: 0, end: Math.min(2, this.chain.length - 1), count: Math.min(3, this.chain.length) };
        let index = 0;
        while (index < this.chain.length) {
          const color = this.chain[index].colorIndex;
          let end = index;
          while (end + 1 < this.chain.length && this.chain[end + 1].colorIndex === color) end += 1;
          const count = end - index + 1;
          if (count > best.count) best = { start: index, end, count };
          index = end + 1;
        }
        const removed = Math.max(0, best.count);
        this.addExplosionsForRange(best.start, best.end, 1.58);
        this.chain.splice(best.start, removed);
        this.recordRemoved(removed);
        this.startGapReturn(best.start, removed, 1.58, "prism");
        this.score += Math.round(removed * 260 * Math.max(1, this.combo));
        this.combo = Math.min(9, this.combo + 1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.effects.push({ kind, t: 0, max: 0.76, count: removed });
        gameAudio.explosion(scene);
      }
      this.checkCompletion("powerup");
      this.pushHud(true);
      this.render();
    },
    togglePause() {
      if (this.mode !== "playing") return;
      this.paused = !this.paused;
      this.pushHud(true);
      this.render();
    },
    toggleFullscreen() {
      const host = canvas.closest(".game-stage");
      if (!document.fullscreenElement) {
        host?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    },
    visibleBalls() {
      if (!this.path) return [];
      return this.chain
        .map((ball, index) => {
          const offset = this.head - index * this.spacing + this.segmentShiftForIndex(index);
          if (offset < -this.spacing || offset > this.path.total + this.spacing) return null;
          const point = pointAt(this.path, offset);
          return { ...ball, index, offset, point };
        })
        .filter(Boolean);
    },
    segmentShiftForIndex(index) {
      if (!this.activeGap) return 0;
      return index < this.activeGap.index ? this.activeGap.frontShift : -this.activeGap.gapDistance;
    },
    ballPointForIndex(index, includeGap = true) {
      if (!this.path) return null;
      const offset = this.head - index * this.spacing + (includeGap ? this.segmentShiftForIndex(index) : 0);
      if (offset < -this.spacing * 2 || offset > this.path.total + this.spacing * 2) return null;
      return pointAt(this.path, offset);
    },
    addSparkBurst(x, y, color, count = 10, power = 0.7) {
      for (let i = 0; i < count; i += 1) {
        const angle = this.random() * Math.PI * 2;
        const speed = (70 + this.random() * 180) * power;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: this.ballRadius * (0.1 + this.random() * 0.22),
          color,
          life: 0,
          max: 0.34 + this.random() * 0.28,
          spin: this.random() * Math.PI,
        });
      }
    },
    addExplosion(x, y, color, power = 1) {
      this.explosionCount += 1;
      this.addSparkBurst(x, y, color, 18 + Math.floor(power * 10), power);
      this.shockwaves.push({
        x,
        y,
        color,
        life: 0,
        max: 0.46 + power * 0.12,
        radius: this.ballRadius * (1.1 + power * 0.7),
        power,
      });
    },
    addExplosionsForRange(start, end, power = 1) {
      const lo = clamp(start, 0, Math.max(0, this.chain.length - 1));
      const hi = clamp(end, 0, Math.max(0, this.chain.length - 1));
      for (let index = lo; index <= hi; index += 1) {
        const point = this.ballPointForIndex(index);
        if (!point) continue;
        this.addExplosion(point.x, point.y, scene.colors[this.chain[index].colorIndex], power);
      }
    },
    recordRemoved(count) {
      this.removedOrbs += Math.max(0, count);
    },
    applyBackwardPush(amount, source = "blast") {
      const push = Math.max(0, amount);
      if (!push) return;
      this.collisionRecoil += push;
      this.totalBackwardPush += push;
      if (source === "blast" || source === "cascade" || source === "powerup") {
        this.lastBlastPush = push;
        this.cascadeImpulseCount += 1;
      }
      if (source === "join") {
        this.lastJoinPush = push;
        this.joinImpactCount += 1;
      }
    },
    startGapReturn(index, removedCount, power = 1, source = "match") {
      const count = Math.max(0, removedCount);
      if (!count) return;
      if (index <= 0 || index >= this.chain.length || this.chain.length <= 1) {
        this.checkCompletion(source);
        return;
      }
      this.lastBlastPush = 0;
      const gapDistance = Math.max(this.spacing * count, this.ballRadius * 2.1);
      const frontRollbackSpeed = clamp(this.baseSpeed * (8.5 + power * 2.6) + this.ballRadius * (18 + count * 2.1), this.ballRadius * 15, this.ballRadius * 62);
      this.activeGap = {
        index: clamp(index, 1, this.chain.length),
        gapDistance,
        frontShift: 0,
        frontRollbackSpeed,
        power,
        source,
        count,
        age: 0,
      };
      this.frontRollbackSpeed = frontRollbackSpeed;
    },
    completeGapReturn(gap) {
      this.head = Math.max(0, this.head - gap.gapDistance);
      if (this.head <= this.spacing * 0.35) this.retreatToEntranceCount += 1;
      this.activeGap = null;
      const joinPush = this.ballRadius * (1.15 + gap.count * 0.18 + gap.power * 0.9);
      this.applyBackwardPush(joinPush, "join");
      const joinPoint = this.ballPointForIndex(Math.max(0, gap.index - 1), false) || this.ballPointForIndex(gap.index, false);
      if (joinPoint) {
        this.impactWaves.push({
          x: joinPoint.x,
          y: joinPoint.y,
          color: scene.palette.accent,
          life: 0,
          max: 0.42,
          index: gap.index,
          knockback: joinPush,
        });
      }
      gameAudio.joinImpact(scene, gap.power);
      this.resolveJoinCascade(gap.index, gap.power);
      this.checkCompletion(gap.source);
    },
    resolveJoinCascade(joinIndex, previousPower = 1) {
      if (this.chain.length < 3 || joinIndex <= 0 || joinIndex >= this.chain.length) return;
      const leftIndex = joinIndex - 1;
      const rightIndex = joinIndex;
      const color = this.chain[leftIndex]?.colorIndex;
      if (color == null || this.chain[rightIndex]?.colorIndex !== color) return;
      let left = leftIndex;
      let right = rightIndex;
      while (left > 0 && this.chain[left - 1].colorIndex === color) left -= 1;
      while (right < this.chain.length - 1 && this.chain[right + 1].colorIndex === color) right += 1;
      const count = right - left + 1;
      if (count < 3) return;
      const power = previousPower + 0.55 + count * 0.045;
      this.addExplosionsForRange(left, right, power);
      gameAudio.explosion(scene);
      this.chain.splice(left, count);
      this.recordRemoved(count);
      this.score += Math.round(count * 280 * Math.max(1, this.combo));
      this.combo = Math.min(12, this.combo + 1);
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.effects.push({ kind: "cascade", t: 0, max: 0.72, count });
      this.startGapReturn(left, count, power, "cascade");
    },
    updateGapReturn(dt) {
      if (!this.activeGap) return;
      const gap = this.activeGap;
      gap.age += dt;
      gap.frontShift = Math.max(-gap.gapDistance, gap.frontShift - gap.frontRollbackSpeed * dt);
      if (gap.frontShift <= -gap.gapDistance + 0.5) this.completeGapReturn(gap);
    },
    getToadState() {
      return computeToadState(this.path, scene, this.ballRadius, performance.now() / 1000);
    },
    frontBallGateState() {
      if (!this.path || !this.chain.length) return { eaten: false, distanceToMouth: null, offset: null };
      const offset = this.head + this.segmentShiftForIndex(0);
      const point = pointAt(this.path, offset);
      const toad = this.getToadState();
      const distanceToMouth = toad.visible ? Math.hypot(point.x - toad.mouthX, point.y - toad.mouthY) : Infinity;
      return {
        eaten: offset >= this.path.total - this.ballRadius * 0.18 && distanceToMouth <= this.ballRadius * 0.92,
        distanceToMouth: Math.round(distanceToMouth),
        offset: Math.round(offset),
      };
    },
    applyCollisionRecoil(index, point, projectile) {
      const incomingSpeed = projectile ? Math.hypot(projectile.vx, projectile.vy) : 520;
      const knockback = clamp(this.ballRadius * (1.35 + incomingSpeed / 720), this.ballRadius * 1.25, this.ballRadius * 2.55);
      this.collisionRecoil = Math.max(this.collisionRecoil, knockback * 0.4) + knockback * 0.62;
      this.totalBackwardPush += knockback;
      this.lastImpactKnockback = knockback;
      this.impactCount += 1;
      if (point) {
        this.impactWaves.push({
          x: point.x,
          y: point.y,
          color: projectile ? scene.colors[projectile.color] : scene.palette.accent,
          life: 0,
          max: 0.32,
          index,
          knockback,
        });
      }
    },
    removeRainbowHit(ball) {
      if (!this.projectile || this.projectile.piercedIds?.[ball.id]) return;
      this.projectile.piercedIds[ball.id] = true;
      const point = this.ballPointForIndex(ball.index);
      const color = scene.colors[this.chain[ball.index]?.colorIndex ?? this.projectile.color];
      if (point) this.addExplosion(point.x, point.y, color, 1.3);
      this.chain.splice(ball.index, 1);
      this.recordRemoved(1);
      this.score += 240;
      this.startGapReturn(Math.max(0, Math.min(ball.index, this.chain.length)), 1, 1.3, "rainbow");
      gameAudio.explosion(scene);
      gameAudio.log("special-rainbow");
      this.checkCompletion("rainbow");
      this.pushHud(true);
    },
    explodeBombHit(index) {
      const visible = this.visibleBalls();
      const hitPoint = this.ballPointForIndex(index);
      const radius = this.ballRadius * 4.1;
      const removeIndexes = visible
        .filter((ball) => hitPoint && Math.hypot(ball.point.x - hitPoint.x, ball.point.y - hitPoint.y) <= radius)
        .map((ball) => ball.index);
      if (!removeIndexes.includes(index)) removeIndexes.push(index);
      const unique = [...new Set(removeIndexes)].sort((a, b) => b - a);
      for (const removeIndex of unique) {
        const point = this.ballPointForIndex(removeIndex);
        const color = scene.colors[this.chain[removeIndex]?.colorIndex ?? this.projectile?.color ?? 0];
        if (point) this.addExplosion(point.x, point.y, color, 1.62);
      }
      for (const removeIndex of unique) {
        if (this.chain[removeIndex]) this.chain.splice(removeIndex, 1);
      }
      const removed = unique.length;
      this.recordRemoved(removed);
      this.score += removed * 260;
      this.startGapReturn(Math.max(0, Math.min(index, this.chain.length)), removed, 1.72, "bomb");
      this.projectile = null;
      this.popNext();
      gameAudio.explosion(scene);
      gameAudio.log("special-bomb");
      this.checkCompletion("bomb");
      this.pushHud(true);
    },
    handleProjectileHit(nearest) {
      if (!this.projectile?.special) {
        this.insertProjectile(nearest.index);
        return;
      }
      gameAudio.hit(scene);
      if (nearest.point) {
        this.impactWaves.push({
          x: nearest.point.x,
          y: nearest.point.y,
          color: this.projectile.special ? SPECIAL_MARBLES[this.projectile.special].color : scene.colors[this.projectile.color],
          life: 0,
          max: 0.32,
          index: nearest.index,
          knockback: 0,
        });
      }
      if (this.projectile.special === "rainbow") {
        this.removeRainbowHit(nearest);
        return;
      }
      if (this.projectile.special === "bomb") {
        this.explodeBombHit(nearest.index);
      }
    },
    insertProjectile(nearestIndex) {
      const insertIndex = clamp(nearestIndex + 1, 0, this.chain.length);
      const hitPoint = this.ballPointForIndex(nearestIndex);
      if (hitPoint && this.projectile) {
        this.addSparkBurst(hitPoint.x, hitPoint.y, scene.colors[this.projectile.color], 12, 0.8);
      }
      this.applyCollisionRecoil(nearestIndex, hitPoint, this.projectile);
      gameAudio.hit(scene);
      this.chain.splice(insertIndex, 0, this.makeShotBall(this.projectile.color));
      this.projectile = null;
      this.popNext();
      this.resolveMatches(insertIndex);
      this.pushHud(true);
    },
    resolveMatches(center) {
      const color = this.chain[center]?.colorIndex;
      if (color == null) return;
      let left = center;
      let right = center;
      while (left > 0 && this.chain[left - 1].colorIndex === color) left -= 1;
      while (right < this.chain.length - 1 && this.chain[right + 1].colorIndex === color) right += 1;
      const count = right - left + 1;
      if (count >= 3) {
        this.addExplosionsForRange(left, right, 1.05 + count * 0.06);
        gameAudio.match(scene, count);
        this.chain.splice(left, count);
        this.recordRemoved(count);
        this.score += Math.round(count * 180 * this.combo);
        this.combo = Math.min(9, this.combo + 1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.effects.push({ kind: "match", t: 0, max: 0.5, count });
        this.startGapReturn(left, count, 1.05 + count * 0.06, "match");
      } else {
        this.combo = 1;
      }
      this.checkCompletion(this.chain.length === 0 ? "cleared-chain" : "match-target");
    },
    checkCompletion(reason = "target") {
      if (this.mode !== "playing") return;
      if (this.chain.length === 0) this.finish("complete", reason === "target" ? "cleared-chain" : reason);
    },
    finish(status, reason) {
      if (this.finishSent) return;
      this.mode = status;
      this.finishReason = reason;
      this.paused = false;
      if (status === "complete" && scoreBonusRate > 0) this.score += Math.round(this.score * scoreBonusRate);
      this.finishSent = true;
      this.pushHud(true);
      this.render();
      window.setTimeout(() => options.onFinish?.(this.buildResult()), 0);
    },
    buildResult() {
      return {
        status: this.mode === "complete" ? "complete" : "failed",
        reason: this.finishReason,
        levelId: level.id,
        score: this.score,
        timer: null,
        elapsedTime: Math.round(this.elapsedTime),
        removedOrbs: this.removedOrbs,
        targetOrbs: level.chainLength,
        targetScore: level.targetScore,
        maxCombo: this.maxCombo,
        remainingOrbs: this.chain.length,
        powerups: { ...this.powerups },
      };
    },
    update(dt) {
      if (!this.path) return;
      if (this.mode === "playing" && !this.paused) {
        this.elapsedTime += dt;
        this.speedMultiplier = clamp(1 + this.elapsedTime * this.accelerationRate, 1, 2.65);
        this.speed = this.baseSpeed * this.speedMultiplier;
        if (this.freezeTime > 0) this.freezeTime = Math.max(0, this.freezeTime - dt);
        else {
          this.head += this.speed * dt;
          gameAudio.roll(scene);
        }
        if (this.collisionRecoil > 0) {
          const recoilStep = Math.min(this.collisionRecoil, (this.baseSpeed * 2.8 + this.ballRadius * 18) * dt);
          this.head = Math.max(0, this.head - recoilStep);
          if (this.head <= this.spacing * 0.35 && recoilStep > 0) this.retreatToEntranceCount += 1;
          this.collisionRecoil = Math.max(0, this.collisionRecoil - recoilStep * 1.45);
        }
        this.updateGapReturn(dt);
        if (this.frontBallGateState().eaten) this.finish("danger", "gate");
        if (this.projectile) {
          const previousPoint = { x: this.projectile.x, y: this.projectile.y };
          this.projectile.x += this.projectile.vx * dt;
          this.projectile.y += this.projectile.vy * dt;
          const currentPoint = { x: this.projectile.x, y: this.projectile.y };
          const visible = this.visibleBalls();
          let nearest = null;
          for (const ball of visible) {
            const d = Math.min(
              Math.hypot(this.projectile.x - ball.point.x, this.projectile.y - ball.point.y),
              distancePointToSegment(ball.point, previousPoint, currentPoint),
            );
            if (d < this.ballRadius * 1.35 && (!nearest || d < nearest.d)) nearest = { ...ball, d };
          }
          if (nearest) this.handleProjectileHit(nearest);
          const margin = this.ballRadius * 3;
          if (
            this.projectile &&
            (this.projectile.x < -margin ||
              this.projectile.x > this.view.w + margin ||
              this.projectile.y < -margin ||
              this.projectile.y > this.view.h + margin)
          ) {
            this.projectile = null;
            this.popNext();
            this.combo = 1;
            this.addSparkBurst(this.shooter.x, this.shooter.y, scene.palette.accent, 5, 0.35);
          }
        }
      }
      this.effects = this.effects
        .map((effect) => ({ ...effect, t: effect.t + dt }))
        .filter((effect) => effect.t < effect.max);
      this.particles = this.particles
        .map((particle) => ({
          ...particle,
          life: particle.life + dt,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          vy: particle.vy + 90 * dt,
          spin: particle.spin + dt * 5,
        }))
        .filter((particle) => particle.life < particle.max);
      this.shockwaves = this.shockwaves
        .map((wave) => ({ ...wave, life: wave.life + dt }))
        .filter((wave) => wave.life < wave.max);
      this.impactWaves = this.impactWaves
        .map((wave) => ({ ...wave, life: wave.life + dt }))
        .filter((wave) => wave.life < wave.max);
      this.pushHud();
      this.render();
    },
    advance(ms) {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) this.update(1 / 60);
      gameAudio.advanceMusic(ms, scene, options.musicTrack);
    },
    drawAim() {
      if (this.mode !== "playing") return;
      const { x, y, angle } = this.shooter;
      ctx.save();
      ctx.fillStyle = this.freezeTime > 0 ? "#bbf8ff" : scene.palette.bright;
      ctx.shadowColor = scene.palette.bright;
      ctx.shadowBlur = 8;
      for (let i = 1; i < 9; i += 1) {
        const px = x + Math.cos(angle) * i * this.ballRadius * 1.45;
        const py = y + Math.sin(angle) * i * this.ballRadius * 1.45;
        ctx.globalAlpha = 1 - i * 0.08;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(2, this.ballRadius * 0.16), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    drawOverlays() {
      if (!this.path) return;
      const { w, h } = this.view;
      ctx.save();
      if (this.freezeTime > 0) {
        ctx.globalAlpha = clamp(this.freezeTime / 4.2, 0.12, 0.32);
        ctx.fillStyle = "#b8f8ff";
        ctx.fillRect(0, 0, w, h);
      }
      const terminal = this.mode === "danger" || this.mode === "complete" || this.paused;
      if (terminal) {
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = "rgba(1, 12, 22, 0.76)";
        drawRoundedRect(ctx, w * 0.5 - 190, h * 0.5 - 88, 380, 176, 24);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = scene.palette.accent;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, w * 0.5 - 190, h * 0.5 - 88, 380, 176, 24);
        ctx.stroke();
        ctx.fillStyle = "#fff4d4";
        ctx.textAlign = "center";
        ctx.font = "700 26px Cinzel, Georgia, serif";
        const title = this.paused
          ? copy.paused
          : this.mode === "complete"
            ? copy.sceneCleared
            : this.finishReason === "timer"
              ? copy.timeExpired
              : copy.chainReached;
        ctx.fillText(title, w * 0.5, h * 0.5 - 12);
        ctx.font = "600 15px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(239, 253, 255, 0.82)";
        ctx.fillText(copy.restartHint, w * 0.5, h * 0.5 + 26);
      }
      ctx.restore();
    },
    drawExplosionEffects() {
      ctx.save();
      for (const wave of this.shockwaves) {
        const t = clamp(wave.life / wave.max, 0, 1);
        const alpha = (1 - t) * 0.85;
        const radius = wave.radius + t * this.ballRadius * (4.4 + wave.power * 2.2);
        ctx.save();
        ctx.translate(wave.x, wave.y);
        ctx.rotate(t * Math.PI * 1.4);
        ctx.strokeStyle = colorWithAlpha("#ffffff", 0.5 * (1 - t));
        ctx.lineWidth = Math.max(1, this.ballRadius * 0.12 * (1 - t));
        ctx.shadowColor = colorWithAlpha(wave.color, 0.9 * (1 - t));
        ctx.shadowBlur = this.ballRadius * 1.7;
        for (let i = 0; i < 10; i += 1) {
          const angle = (Math.PI * 2 * i) / 10;
          const start = radius * 0.2;
          const end = radius * (0.78 + wave.power * 0.12);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
          ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
          ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = colorWithAlpha(wave.color, alpha);
        ctx.lineWidth = Math.max(1.5, this.ballRadius * 0.22 * (1 - t));
        ctx.shadowColor = colorWithAlpha(wave.color, 0.8 * (1 - t));
        ctx.shadowBlur = this.ballRadius * 1.4;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        const glow = ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, radius * 0.8);
        glow.addColorStop(0, colorWithAlpha("#ffffff", 0.18 * (1 - t)));
        glow.addColorStop(0.34, colorWithAlpha(wave.color, 0.16 * (1 - t)));
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colorWithAlpha("#ffffff", Math.max(0, 0.36 - t * 0.8));
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, this.ballRadius * (0.9 + wave.power * 0.2) * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      for (const particle of this.particles) {
        const t = clamp(particle.life / particle.max, 0, 1);
        const alpha = 1 - t;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.spin);
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = this.ballRadius * 0.9;
        ctx.fillStyle = colorWithAlpha(particle.color, alpha);
        ctx.beginPath();
        ctx.moveTo(0, -particle.r * 1.6);
        ctx.lineTo(particle.r * 1.2, 0);
        ctx.lineTo(0, particle.r * 1.6);
        ctx.lineTo(-particle.r * 1.2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = colorWithAlpha("#ffffff", alpha * 0.64);
        ctx.beginPath();
        ctx.arc(0, 0, particle.r * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const wave of this.impactWaves) {
        const t = clamp(wave.life / wave.max, 0, 1);
        ctx.strokeStyle = colorWithAlpha(wave.color, (1 - t) * 0.85);
        ctx.lineWidth = Math.max(1, this.ballRadius * 0.14 * (1 - t));
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = this.ballRadius * 0.85 * (1 - t);
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, this.ballRadius * (1.1 + t * 2.1), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = colorWithAlpha("#ffffff", 0.16 * (1 - t));
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, this.ballRadius * (0.5 + t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    render() {
      if (!this.path) return;
      const { w, h } = this.view;
      ctx.clearRect(0, 0, w, h);
      drawSceneBackdrop(ctx, this.view, scene, this.image, performance.now() / 1000);
      drawTrack(ctx, this.path, scene, this.ballRadius);
      this.lastToadState = drawToadMaw(ctx, this.path, scene, this.ballRadius, performance.now() / 1000);
      this.drawAim();

      const visible = this.visibleBalls();
      for (let i = visible.length - 1; i >= 0; i -= 1) {
        const ball = visible[i];
        drawBall(
          ctx,
          ball.point.x,
          ball.point.y,
          this.ballRadius,
          scene.colors[ball.colorIndex],
          scene,
        );
      }

      if (this.projectile) {
        drawShotBall(
          ctx,
          this.projectile.x,
          this.projectile.y,
          this.ballRadius,
          this.projectile.special ? SPECIAL_MARBLES[this.projectile.special].color : scene.colors[this.projectile.color],
          scene,
          this.projectile.special,
        );
      }
      this.drawExplosionEffects();
      drawLauncher(
        ctx,
        this.shooter,
        scene,
        scene.colors[this.currentColor],
        scene.colors[this.nextColors[0]],
        this.ballRadius,
        this.currentSpecial,
        this.nextSpecials[0],
      );
      this.drawOverlays();
    },
    pushHud(force = false) {
      const now = performance.now();
      if (!force && now - this.lastHud < 120) return;
      this.lastHud = now;
      onHudChange({
        mode: this.mode,
        paused: this.paused,
        rules: { timeLimit: !NO_TIME_LIMIT },
        score: this.score,
        combo: this.combo,
        timer: null,
        elapsedTime: Math.round(this.elapsedTime),
        level: level.number,
        levelTitle: options.levelTitle || level.title,
        balls: this.chain.length,
        freezeTime: this.freezeTime,
        particles: this.particles.length,
        shockwaves: this.shockwaves.length,
        explosionCount: this.explosionCount,
        impactCount: this.impactCount,
        lastImpactKnockback: Math.round(this.lastImpactKnockback),
        chainPhysics: {
          activeGap: Boolean(this.activeGap),
          gapDistance: Math.round(this.activeGap?.gapDistance || 0),
          frontRollbackSpeed: Math.round(this.frontRollbackSpeed),
          cascadeImpulseCount: this.cascadeImpulseCount,
          joinImpactCount: this.joinImpactCount,
          lastBlastPush: Math.round(this.lastBlastPush),
          lastJoinPush: Math.round(this.lastJoinPush),
          totalBackwardPush: Math.round(this.totalBackwardPush),
          retreatToEntranceCount: this.retreatToEntranceCount,
        },
        speedMultiplier: Number(this.speedMultiplier.toFixed(2)),
        currentSpeed: Math.round(this.speed),
        speedLabel: `x${this.speedMultiplier.toFixed(2)}`,
        terrain: level.terrain || "single",
        entries: this.path?.entries?.length || 1,
        exits: this.path?.exits?.length || 1,
        branchCount: this.path?.branchPaths?.length || 0,
        audio: gameAudio.getState(),
        toad: this.getToadState(),
        gateState: this.frontBallGateState(),
        visuals: VISUAL_PROFILE,
        powerups: { ...this.powerups },
        currentShot: this.currentShotPayload(),
        nextShot: {
          colorIndex: this.nextColors[0],
          color: scene.colors[this.nextColors[0]],
          special: this.nextSpecials[0] || null,
        },
        specialMarbles: {
          spawnChance: SPECIAL_SPAWN_CHANCE,
          definitions: specialMarblePayload(options.language || "zh"),
        },
        removedOrbs: this.removedOrbs,
        targetOrbs: level.chainLength,
        targetScore: level.targetScore,
        finishReason: this.finishReason,
      });
    },
    toText() {
      const visible = this.visibleBalls().slice(0, 12);
      return JSON.stringify({
        note: "Canvas coordinate system: origin top-left, x right, y down.",
        mode: this.mode,
        paused: this.paused,
        rules: { timeLimit: !NO_TIME_LIMIT },
        scene: scene.name,
        score: this.score,
        combo: this.combo,
        maxCombo: this.maxCombo,
        timer: null,
        elapsedTime: Math.round(this.elapsedTime),
        visuals: VISUAL_PROFILE,
        level: { id: level.id, number: level.number, title: level.title, targetOrbs: level.chainLength, targetScore: level.targetScore },
        difficulty: {
          terrain: level.terrain || "single",
          entries: this.path?.entries?.length || 1,
          exits: this.path?.exits?.length || 1,
          branchCount: this.path?.branchPaths?.length || 0,
          speedMultiplier: Number(this.speedMultiplier.toFixed(2)),
          currentSpeed: Math.round(this.speed),
          speedLabel: `x${this.speedMultiplier.toFixed(2)}`,
          accelerationRate: this.accelerationRate,
        },
        physics: {
          impactCount: this.impactCount,
          lastImpactKnockback: Math.round(this.lastImpactKnockback),
          collisionRecoil: Math.round(this.collisionRecoil),
        },
        chainPhysics: {
          activeGap: Boolean(this.activeGap),
          gapIndex: this.activeGap?.index ?? null,
          gapDistance: Math.round(this.activeGap?.gapDistance || 0),
          frontShift: Math.round(this.activeGap?.frontShift || 0),
          frontRollbackSpeed: Math.round(this.frontRollbackSpeed),
          cascadeImpulseCount: this.cascadeImpulseCount,
          joinImpactCount: this.joinImpactCount,
          lastBlastPush: Math.round(this.lastBlastPush),
          lastJoinPush: Math.round(this.lastJoinPush),
          totalBackwardPush: Math.round(this.totalBackwardPush),
          retreatToEntranceCount: this.retreatToEntranceCount,
        },
        chain: {
          count: this.chain.length,
          headDistance: Math.round(this.head),
          pathTotal: Math.round(this.path?.total || 0),
          gateState: this.frontBallGateState(),
          visible: visible.map((ball) => ({
            id: ball.id,
            index: ball.index,
            colorIndex: ball.colorIndex,
            color: scene.colors[ball.colorIndex],
            x: Math.round(ball.point.x),
            y: Math.round(ball.point.y),
          })),
        },
        shooter: {
          x: Math.round(this.shooter.x),
          y: Math.round(this.shooter.y),
          angle: Number(this.shooter.angle.toFixed(3)),
          projectileSpeed: PROJECTILE_SPEED,
          currentColor: scene.colors[this.currentColor],
          currentShot: {
            color: scene.colors[this.currentColor],
            special: this.currentSpecial,
          },
          nextColor: scene.colors[this.nextColors[0]],
          nextShot: {
            color: scene.colors[this.nextColors[0]],
            special: this.nextSpecials[0] || null,
          },
          launcherPreview: {
            nextRadiusRatio: 0.78,
            placement: "beside-current",
            specialEffects: SPECIAL_MARBLE_EFFECTS,
          },
        },
        projectile: this.projectile
          ? {
              x: Math.round(this.projectile.x),
              y: Math.round(this.projectile.y),
              color: scene.colors[this.projectile.color],
              special: this.projectile.special || null,
            }
          : null,
        specialMarbles: {
          spawnChance: SPECIAL_SPAWN_CHANCE,
          definitions: specialMarblePayload(options.language || "zh"),
        },
        effects: {
          particles: this.particles.length,
          shockwaves: this.shockwaves.length,
          explosionCount: this.explosionCount,
          activeKinds: this.effects.map((effect) => effect.kind),
        },
        progress: {
          removedOrbs: this.removedOrbs,
          targetOrbs: level.chainLength,
          remainingOrbs: this.chain.length,
          remainingTime: null,
          targetScore: level.targetScore,
          finishReason: this.finishReason,
          gateState: this.frontBallGateState(),
        },
        audio: gameAudio.getState(),
        toad: this.getToadState(),
      });
    },
  };
  engine.currentColor = engine.nextColor();
  engine.currentSpecial = engine.nextSpecial();
  engine.nextColors = [engine.nextColor(), engine.nextColor(), engine.nextColor()];
  engine.nextSpecials = [engine.nextSpecial(), engine.nextSpecial(), engine.nextSpecial()];
  return engine;
}

function StatPill({ icon: Icon, label, value, onClick, showLabel = false }) {
  const Tag = onClick ? "button" : "div";
  const actionProps = onClick ? { type: "button", onClick } : {};
  return (
    <Tag className="stat-pill" aria-label={`${label}: ${value}`} {...actionProps}>
      <Icon size={18} strokeWidth={2.4} />
      {showLabel ? <small>{label}</small> : null}
      <span>{value}</span>
    </Tag>
  );
}

function PowerupButton({ powerup, count, onClick, disabled }) {
  const Icon = powerup.icon;
  return (
    <button className="powerup-button" type="button" onClick={onClick} disabled={disabled} aria-label={powerup.label} title={powerup.description || powerup.label}>
      <Icon size={24} strokeWidth={2.6} />
      <span>{count}</span>
    </button>
  );
}

function SceneCard({ scene, selected, onSelect, stats, language }) {
  const locked = stats.unlocked === false;
  return (
    <button
      className="scene-card"
      data-selected={selected}
      data-scene={scene.id}
      type="button"
      onClick={() => onSelect(scene.id)}
      disabled={locked}
      aria-pressed={selected}
    >
      <span className="scene-frame">
        <img src={scene.image} alt={`${sceneText(scene, language)} gameplay preview`} />
        <span className="scene-glow" />
        <span className="scene-number">{scene.index}</span>
        {locked ? (
          <span className="scene-lock">
            <Lock size={18} />
          </span>
        ) : null}
      </span>
      <span className="scene-title">{sceneText(scene, language)}</span>
      <span className="scene-meta">
        <span>
          <Star size={16} fill="currentColor" /> {stats.stars}/{stats.totalStars}
        </span>
        <span>{tr(language, "completedCount", { completed: stats.completed, total: stats.totalLevels })}</span>
      </span>
    </button>
  );
}

function LevelStrip({ levels, save, selectedLevelId, onSelectLevel, language }) {
  return (
    <section className="level-strip" aria-label="Level selection">
      {levels.map((level) => {
        const state = save.levels[level.id] || {};
        const unlocked = Boolean(state.unlocked);
        const title = levelText(level, language);
        return (
          <button
            className="level-node"
            data-selected={selectedLevelId === level.id}
            data-locked={!unlocked}
            type="button"
            key={level.id}
            onClick={() => unlocked && onSelectLevel(level.id)}
            disabled={!unlocked}
            aria-label={`${level.title} level ${level.number}`}
          >
            <span>{level.number}</span>
            <strong>{title}</strong>
            <small>{unlocked ? tr(language, "stars", { stars: state.stars || 0 }) : tr(language, "locked")}</small>
          </button>
        );
      })}
    </section>
  );
}

function PanelCard({ icon: Icon, title, value, detail, className = "" }) {
  return (
    <article className={`panel-card ${className}`.trim()}>
      <span className="panel-card-icon">
        <Icon size={24} strokeWidth={2.5} />
      </span>
      <strong>{title}</strong>
      <span>{value}</span>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function SelectPanel({
  panelId,
  selected,
  selectedLevel,
  sceneLevels,
  save,
  language,
  musicEnabled,
  sfxEnabled,
  musicTrack,
  onToggleMusic,
  onToggleSfx,
  onMusicTrackChange,
  onLanguageChange,
  onClose,
  onPlay,
  openPanel,
  onSelectLevel,
  onBuyUpgrade,
  onBuyPowerup,
  pendingPayment,
  onCancelPayment,
  onConfirmPayment,
  onClaimQuest,
}) {
  const itemId = panelId.startsWith("item-") ? panelId.replace("item-", "") : null;
  const inventoryItem = itemId ? INVENTORY_ITEMS.find((item) => item.id === itemId) : null;
  const panelCopy = {
    profile: ["profile", "explorer"],
    wallet: ["resources", "wallet"],
    settings: ["settings", "system"],
    menu: ["mainMenu", "session"],
    levels: ["levels", "map"],
    bag: ["bag", "inventory"],
    shop: ["shop", "market"],
    quests: ["quests", "progress"],
    rank: ["rank", "league"],
  };
  const [titleKey, kickerKey] = panelCopy[panelId] || panelCopy.bag;
  const meta = inventoryItem
    ? { title: powerupText(inventoryItem.id, language), kicker: tr(language, "powerup"), icon: inventoryItem.icon }
    : { title: tr(language, titleKey), kicker: tr(language, kickerKey), icon: (PANEL_META[panelId] || PANEL_META.bag).icon };
  const Icon = meta.icon;
  const bestScore = Math.max(...Object.values(save.levels).map((level) => level.bestScore || 0), 0);
  const leaderboard = [...BASE_LEADERBOARD, { name: tr(language, "you"), score: bestScore.toLocaleString(), isYou: true }].sort(
    (a, b) => Number(b.score.replaceAll(",", "")) - Number(a.score.replaceAll(",", "")),
  );

  const renderBody = () => {
    if (panelId === "profile") {
      const xpNeed = xpForLevel(save.profileLevel);
      return (
        <>
          <div className="panel-grid compact">
            <PanelCard icon={Crown} title={tr(language, "profileLevel")} value={`Lv. ${save.profileLevel}`} detail={tr(language, "levelHelp")} />
            <PanelCard icon={Trophy} title={tr(language, "xpProgress")} value={`${save.xp}/${xpNeed}`} detail={tr(language, "xpHelp")} />
          </div>
          <div className="info-stack">
            <article>
              <strong>{tr(language, "levelGuide")}</strong>
              <p>{tr(language, "levelHelp")}</p>
            </article>
            <article>
              <strong>{tr(language, "starterPack")}</strong>
              <p>{tr(language, "starterPowerups")}</p>
            </article>
          </div>
        </>
      );
    }

    if (panelId === "wallet") {
      return (
        <>
          <div className="panel-grid compact">
            <PanelCard icon={Coins} title={tr(language, "coins")} value={save.coins.toLocaleString()} detail={tr(language, "coinsHelp")} />
            <PanelCard icon={Gem} title={tr(language, "gems")} value={save.gems.toLocaleString()} detail={tr(language, "gemsHelp")} />
          </div>
          <div className="info-stack">
            <p>{tr(language, "coinsGet")}</p>
            <p>{tr(language, "gemsGet")}</p>
          </div>
          <div className="panel-actions-row">
            <button className="panel-action-button primary" type="button" onClick={() => openPanel("shop")}>
              <ShoppingBag size={18} />
              {tr(language, "shop")}
            </button>
          </div>
        </>
      );
    }

    if (inventoryItem) {
      const count = save.inventory[inventoryItem.id] || 0;
      const info = powerupInfo(inventoryItem.id, language);
      return (
        <>
          <div className="panel-grid single">
            <PanelCard
              icon={inventoryItem.icon}
              title={powerupText(inventoryItem.id, language)}
              value={tr(language, "owned", { count })}
              detail={info.description}
              className={inventoryItem.className || ""}
            />
          </div>
          <div className="info-stack">
            <article>
              <strong>{tr(language, "itemEffect")}</strong>
              <p>{info.description}</p>
            </article>
            <article>
              <strong>{tr(language, "itemUse")}</strong>
              <p>{info.use || tr(language, "useInLevel")}</p>
            </article>
            <article>
              <strong>{tr(language, "itemGet")}</strong>
              <p>{info.get || tr(language, "getFrom")}</p>
            </article>
          </div>
          <div className="panel-actions-row">
            <button className="panel-action-button" type="button" onClick={() => openPanel("bag")}>
              {tr(language, "bag")}
            </button>
            <button className="panel-action-button primary" type="button" onClick={onPlay}>
              <Play size={18} fill="currentColor" />
              {tr(language, "play")}
            </button>
          </div>
        </>
      );
    }

    if (panelId === "settings") {
      return (
        <div className="panel-list">
          <button className="panel-row-button" data-audio-toggle="music" type="button" onClick={onToggleMusic} aria-pressed={musicEnabled}>
            {musicEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            <span>{tr(language, "music")}</span>
            <strong>{musicEnabled ? tr(language, "on") : tr(language, "muted")}</strong>
          </button>
          <button className="panel-row-button" data-audio-toggle="sfx" type="button" onClick={onToggleSfx} aria-pressed={sfxEnabled}>
            {sfxEnabled ? <Sparkles size={22} /> : <VolumeX size={22} />}
            <span>{tr(language, "sfx")}</span>
            <strong>{sfxEnabled ? tr(language, "on") : tr(language, "muted")}</strong>
          </button>
          <div className="panel-row music-row">
            <Sparkles size={22} />
            <span>{tr(language, "musicTrack")}</span>
            <div className="music-options" role="group" aria-label={tr(language, "musicTrack")}>
              {MUSIC_TRACKS.map((track) => (
                <button
	                  className="music-option"
	                  data-selected={musicTrack === track.id}
	                  data-track={track.id}
	                  data-source={track.source}
	                  type="button"
	                  key={track.id}
	                  title={musicTrackCredit(track.id)}
	                  onClick={() => onMusicTrackChange(track.id)}
	                >
                  {musicTrackText(track.id, language)}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-row language-row">
            <Settings size={22} />
            <span>{tr(language, "language")}</span>
            <div className="language-options" role="group" aria-label="Language">
              {LANGUAGES.map((item) => (
                <button
                  className="language-option"
                  data-selected={language === item.id}
                  type="button"
                  key={item.id}
                  onClick={() => onLanguageChange(item.id)}
                >
                  {item.id === "zh" ? tr(language, "chinese") : tr(language, "english")}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-row">
            <Sparkles size={22} />
            <span>{tr(language, "vfx")}</span>
            <strong>{tr(language, "high")}</strong>
          </div>
          <div className="panel-row">
            <Gem size={22} />
            <span>{tr(language, "scene")}</span>
            <strong>{sceneText(selected, language, "shortName")}</strong>
          </div>
        </div>
      );
    }

    if (panelId === "menu") {
      return (
        <>
          <div className="panel-grid compact">
            <PanelCard
              icon={Gem}
              title={sceneText(selected, language, "shortName")}
              value={tr(language, "levelPrefix", { number: selectedLevel.number })}
              detail={levelText(selectedLevel, language)}
            />
            <PanelCard
              icon={Star}
              title={tr(language, "target")}
              value={tr(language, "clearAllTarget", { count: selectedLevel.chainLength })}
              detail={tr(language, "noTimeLimit")}
            />
          </div>
          <div className="panel-actions-row">
            <button className="panel-action-button" type="button" onClick={() => openPanel("levels")} aria-label="Open levels">
              {tr(language, "levels")}
            </button>
            <button className="panel-action-button" type="button" onClick={onClose} aria-label="Continue menu">
              {tr(language, "continue")}
            </button>
            <button className="panel-action-button primary" type="button" onClick={onPlay}>
              <Play size={18} fill="currentColor" />
              {tr(language, "play")}
            </button>
          </div>
        </>
      );
    }

    if (panelId === "levels") {
      return (
        <LevelStrip
          levels={sceneLevels}
          save={save}
          selectedLevelId={selectedLevel.id}
          onSelectLevel={onSelectLevel}
          language={language}
        />
      );
    }

    if (panelId === "bag") {
      return (
        <div className="panel-grid">
          {INVENTORY_ITEMS.map((item) => {
            const info = powerupInfo(item.id, language);
            return (
              <button
                className={`panel-card panel-card-button ${item.className || ""}`.trim()}
                type="button"
                key={item.id}
                onClick={() => openPanel(`item-${item.id}`)}
                aria-label={`${item.label} details`}
              >
                <span className="panel-card-icon">
                  <item.icon size={24} strokeWidth={2.5} />
                </span>
                <strong>{powerupText(item.id, language)}</strong>
                <span>{tr(language, "owned", { count: save.inventory[item.id] || 0 })}</span>
                <small>{info.description}</small>
              </button>
            );
          })}
        </div>
      );
    }

    if (panelId === "shop") {
      return (
        <>
          {pendingPayment ? (
            <section className="payment-panel" aria-label={tr(language, "scanPayTitle")}>
              <div>
                <p className="eyebrow">{tr(language, "scanPayTitle")}</p>
                <h3>{powerupText(pendingPayment.id, language)} · {formatYuan(pendingPayment.priceYuan, language)}</h3>
                <p>{tr(language, "scanPayHelp")}</p>
                <small>{tr(language, "paymentManualNote")}</small>
              </div>
              <img src="/payment/wechat-pay.jpg" alt="微信收款二维码" />
              <div className="payment-actions">
                <button className="panel-action-button" type="button" onClick={onCancelPayment}>
                  {tr(language, "cancel")}
                </button>
                <button className="panel-action-button primary" type="button" onClick={onConfirmPayment} data-confirm-paid>
                  {tr(language, "confirmPaid")}
                </button>
              </div>
            </section>
          ) : null}
          <p className="panel-section-title">{tr(language, "permanentUpgrades")}</p>
          <div className="panel-grid">
            {SHOP_ITEMS.map((item) => {
              const rank = save.upgrades[item.id] || 0;
              const price = item.price + rank * 420;
              const maxed = rank >= item.max;
              const affordable = save.coins >= price;
              const copy = shopText(item, language);
              return (
                <button
                  className="panel-card panel-card-button shop-card"
                  type="button"
                  key={item.id}
                  onClick={() => onBuyUpgrade(item.id)}
                  disabled={maxed || !affordable}
                  aria-label={`Buy ${item.title}`}
                >
                  <span className="panel-card-icon">
                    <ShoppingBag size={24} strokeWidth={2.5} />
                  </span>
                  <strong>{copy.title}</strong>
                  <span>{copy.value}</span>
                  <small>
                    {maxed
                      ? tr(language, "max")
                      : `${tr(language, "coinsPrice", { price: price.toLocaleString() })} · ${tr(language, "upgradeRank", {
                          rank,
                          max: item.max,
                        })}`}
                  </small>
                </button>
              );
            })}
          </div>
          <p className="panel-section-title">{tr(language, "powerupSupply")}</p>
	          <div className="panel-grid">
	            {POWERUP_SHOP_ITEMS.map((item) => {
	              const definition = INVENTORY_ITEMS.find((powerup) => powerup.id === item.id);
	              const ItemIcon = definition?.icon || ShoppingBag;
	              const info = powerupInfo(item.id, language);
	              return (
	                <button
	                  className={`panel-card panel-card-button shop-card ${definition?.className || ""}`.trim()}
	                  type="button"
	                  key={item.id}
	                  onClick={() => onBuyPowerup(item.id)}
	                  aria-label={`Buy ${definition?.label || item.id}`}
	                  data-shop-powerup={item.id}
	                >
                  <span className="panel-card-icon">
                    <ItemIcon size={24} strokeWidth={2.5} />
	                  </span>
	                  <strong>{powerupText(item.id, language)}</strong>
	                  <span>{tr(language, "owned", { count: save.inventory[item.id] || 0 })}</span>
	                  <small>{tr(language, "paidPowerupPrice", { price: item.priceYuan })} · {info.description}</small>
	                </button>
	              );
	            })}
	          </div>
        </>
      );
    }

    if (panelId === "quests") {
      return (
        <div className="quest-list">
          {QUEST_DEFS.map((quest) => {
            const current = save.quests[quest.id] || { value: 0, claimed: false };
            const progress = clamp((current.value / quest.target) * 100, 0, 100);
            const ready = current.value >= quest.target && !current.claimed;
            const copy = questText(quest, language);
            return (
              <article className="quest-row" key={quest.id}>
                <div>
                  <strong>{copy.title}</strong>
                  <span>
                    {Math.min(current.value, quest.target)} / {quest.target} {copy.unit}
                  </span>
                </div>
                <div className="quest-progress" aria-label={`${quest.title} ${Math.round(progress)}%`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <button className="quest-claim" type="button" disabled={!ready} onClick={() => onClaimQuest(quest.id)}>
                  {current.claimed ? tr(language, "claimed") : ready ? tr(language, "claim") : tr(language, "open")}
                </button>
              </article>
            );
          })}
        </div>
      );
    }

    return (
      <div className="rank-list">
        {leaderboard.map((entry, index) => (
          <article className="rank-row" key={entry.name} data-you={entry.isYou === true}>
            <span>{index + 1}</span>
            <strong>{entry.name}</strong>
            <em>{entry.score}</em>
          </article>
        ))}
      </div>
    );
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={`panel-title-${panelId}`} data-panel={panelId}>
        <header className="modal-header">
          <span className="modal-icon">
            <Icon size={25} strokeWidth={2.5} />
          </span>
          <div>
            <p className="eyebrow">{meta.kicker}</p>
            <h2 id={`panel-title-${panelId}`}>{meta.title}</h2>
          </div>
          <button className="round-icon modal-close" type="button" aria-label="Close panel" onClick={onClose}>
            <X size={21} />
          </button>
        </header>
        <div className="modal-body">{renderBody()}</div>
      </section>
    </div>
  );
}

function SceneSelect({
  selectedScene,
  selectedLevelId,
  save,
  language,
  onSelect,
  onSelectLevel,
  onPlay,
  musicEnabled,
  sfxEnabled,
  musicTrack,
  onToggleMusic,
  onToggleSfx,
  onMusicTrackChange,
  onLanguageChange,
  onBuyUpgrade,
  onBuyPowerup,
  pendingPayment,
  onCancelPayment,
  onConfirmPayment,
  onClaimQuest,
}) {
  const [activePanel, setActivePanel] = useState(null);
  const selected = SCENES.find((scene) => scene.id === selectedScene) || SCENES[0];
  const sceneLevels = getSceneLevels(selectedScene);
  const selectedLevel = getLevel(selectedLevelId);
  const xpNeed = xpForLevel(save.profileLevel);
  const getSceneStats = (sceneId) => {
    const levels = getSceneLevels(sceneId);
    const states = levels.map((level) => save.levels[level.id] || {});
    return {
      stars: states.reduce((sum, state) => sum + (state.stars || 0), 0),
      totalStars: levels.length * 3,
      completed: states.filter((state) => state.completed).length,
      totalLevels: levels.length,
      unlocked: states.some((state) => state.unlocked),
    };
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setActivePanel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const openPanel = (panel) => setActivePanel(panel);
  const closePanel = () => setActivePanel(null);
  const mobileTabs = [
    { id: "shop", label: tr(language, "shop") },
    { id: "quests", label: tr(language, "quests") },
    { id: "home", label: tr(language, "mainMenu") },
    { id: "rank", label: tr(language, "rank") },
    { id: "bag", label: tr(language, "bag") },
  ];

  return (
    <main className="select-screen" style={{ "--scene-bg": `url(${sceneSelectImage})` }}>
      <header className="select-hud">
        <button className="profile-medal" type="button" onClick={() => openPanel("profile")} aria-label={tr(language, "profile")}>
          <div className="profile-shell">
            <Gem size={28} />
          </div>
          <span>Lv. {save.profileLevel}</span>
          <small>{tr(language, "xpProgressShort", { xp: save.xp, need: xpNeed })}</small>
        </button>
        <div className="title-lockup" aria-label={`${tr(language, "appName")} ${tr(language, "appSubtitle")}`}>
          <span>{tr(language, "appName")}</span>
          <strong>{tr(language, "appSubtitle")}</strong>
        </div>
        <div className="select-currencies">
          <StatPill icon={Gem} label={tr(language, "gems")} value={save.gems.toLocaleString()} onClick={() => openPanel("wallet")} showLabel />
          <StatPill icon={Coins} label={tr(language, "coins")} value={save.coins.toLocaleString()} onClick={() => openPanel("wallet")} showLabel />
          <button className="round-icon" type="button" aria-label="Settings" onClick={() => openPanel("settings")}>
            <Settings size={21} />
          </button>
        </div>
      </header>

      <section className="scene-carousel" aria-label={tr(language, "sceneSelection")}>
        {SCENES.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            selected={scene.id === selectedScene}
            onSelect={onSelect}
            stats={getSceneStats(scene.id)}
            language={language}
          />
        ))}
      </section>

      <LevelStrip
        levels={sceneLevels}
        save={save}
        selectedLevelId={selectedLevel.id}
        onSelectLevel={onSelectLevel}
        language={language}
      />

      <footer className="select-actions">
        <button className="round-icon large" type="button" aria-label="Back" onClick={() => openPanel("menu")}>
          <ArrowLeft size={28} />
        </button>
        <button className="play-button" type="button" onClick={onPlay}>
          <Play size={28} fill="currentColor" />
          {tr(language, "play")}
        </button>
        <button className="round-icon large" type="button" aria-label="Inventory" onClick={() => openPanel("bag")}>
          <Package size={26} />
        </button>
      </footer>

      <nav className="inventory-bar" aria-label={tr(language, "powerupInventory")}>
        {INVENTORY_ITEMS.map((powerup) => (
          <button
            className={`inventory-item ${powerup.className || ""}`.trim()}
            type="button"
            key={powerup.id}
            onClick={() => openPanel(`item-${powerup.id}`)}
            aria-label={`${powerup.label} inventory`}
          >
            <powerup.icon size={24} strokeWidth={2.6} />
            <span>{save.inventory[powerup.id] || 0}</span>
          </button>
        ))}
      </nav>

      <nav className="mobile-tabs" aria-label={tr(language, "mobileNavigation")}>
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            className={activePanel === tab.id || (tab.id === "home" && !activePanel) ? "active" : ""}
            type="button"
            onClick={() => (tab.id === "home" ? closePanel() : openPanel(tab.id))}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activePanel ? (
        <SelectPanel
          panelId={activePanel}
          selected={selected}
          selectedLevel={selectedLevel}
          sceneLevels={sceneLevels}
          save={save}
          language={language}
          musicEnabled={musicEnabled}
          sfxEnabled={sfxEnabled}
          musicTrack={musicTrack}
          onToggleMusic={onToggleMusic}
          onToggleSfx={onToggleSfx}
          onMusicTrackChange={onMusicTrackChange}
          onLanguageChange={onLanguageChange}
          onClose={closePanel}
          onPlay={onPlay}
          openPanel={openPanel}
          onSelectLevel={onSelectLevel}
	          onBuyUpgrade={onBuyUpgrade}
	          onBuyPowerup={onBuyPowerup}
	          pendingPayment={pendingPayment}
	          onCancelPayment={onCancelPayment}
	          onConfirmPayment={onConfirmPayment}
	          onClaimQuest={onClaimQuest}
	        />
      ) : null}
    </main>
  );
}

function ResultOverlay({ result, level, nextLevel, language, onReplay, onNext, onExit }) {
  if (!result) return null;
  const won = result.status === "complete";
  const resultTitle = won ? levelText(level, language) : result.reason === "timer" ? tr(language, "timeExpired") : tr(language, "gateReached");
  return (
    <section className="result-overlay" role="dialog" aria-modal="true" aria-label="Level result">
      <div className="result-panel" data-result={result.status}>
        <p className="eyebrow">{won ? tr(language, "cleared") : tr(language, "retry")}</p>
        <h2>{resultTitle}</h2>
        <div className="result-stars" aria-label={`${result.stars} stars`}>
          {[0, 1, 2].map((index) => (
            <Star key={index} size={30} fill={index < result.stars ? "currentColor" : "none"} />
          ))}
        </div>
        <div className="result-grid">
          <span>{tr(language, "score")} <strong>{result.score.toLocaleString()}</strong></span>
          <span>{tr(language, "orbs")} <strong>{result.removedOrbs}/{result.targetOrbs}</strong></span>
          <span>{tr(language, "coins")} <strong>+{result.reward.coins}</strong></span>
          <span>{tr(language, "xp")} <strong>+{result.reward.xp}</strong></span>
          <span>{tr(language, "gems")} <strong>+{result.reward.gems}</strong></span>
          <span>{tr(language, "combo")} <strong>x{result.maxCombo}</strong></span>
          <span>{tr(language, "rewardItems")} <strong>{formatPowerupBundle(result.reward.powerups, language)}</strong></span>
        </div>
        <div className="result-actions">
          <button className="panel-action-button" type="button" onClick={onExit}>
            {tr(language, "resultLevels")}
          </button>
          <button className="panel-action-button" type="button" onClick={onReplay}>
            {tr(language, "replay")}
          </button>
          <button className="panel-action-button primary" type="button" onClick={onNext} disabled={!won || !nextLevel}>
            {nextLevel ? tr(language, "nextLevel", { number: nextLevel.number }) : tr(language, "complete")}
          </button>
        </div>
      </div>
    </section>
  );
}

function GameScreen({
  scene,
  level,
  save,
  language,
  onExit,
  musicEnabled,
  sfxEnabled,
  musicTrack,
  onToggleMusic,
  onToggleSfx,
  onPowerupUse,
  onLevelFinish,
  onNextLevel,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [runKey, setRunKey] = useState(0);
  const [result, setResult] = useState(null);
  const [hud, setHud] = useState({
    mode: "playing",
    paused: false,
    score: 0,
    combo: 1,
    timer: null,
    elapsedTime: 0,
    level: level.number,
    levelTitle: levelText(level, language),
    balls: level.chainLength,
    removedOrbs: 0,
    targetOrbs: level.chainLength,
    targetScore: level.targetScore,
    freezeTime: 0,
    particles: 0,
    shockwaves: 0,
    audio: gameAudio.getState(),
    powerups: makeRunPowerups(save),
    speedMultiplier: 1,
    currentSpeed: 0,
    currentShot: { colorIndex: 0, color: scene.colors[0], special: null },
    nextShot: { colorIndex: 1, color: scene.colors[1], special: null },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    setResult(null);
    gameAudio.setMusicEnabled(musicEnabled);
    gameAudio.setSfxEnabled(sfxEnabled);
    const engine = makeEngine(scene, level, canvas, setHud, {
      initialPowerups: makeRunPowerups(save),
      upgrades: save.upgrades,
      musicTrack,
      language,
      levelTitle: levelText(level, language),
      copy: {
        paused: tr(language, "paused"),
        sceneCleared: tr(language, "sceneCleared"),
        chainReached: tr(language, "chainReached"),
        timeExpired: tr(language, "timeExpired"),
        restartHint: tr(language, "restartHint"),
      },
      onPowerupUse,
      onFinish: (raw) => {
        const finalResult = buildRunResult(raw, level, save);
        setResult(finalResult);
        onLevelFinish(finalResult);
      },
    });
    engineRef.current = engine;
    const resizeObserver = new ResizeObserver(() => engine.resize());
    resizeObserver.observe(canvas);
    engine.resize();
    engine.reset();

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      engine.update(dt);
      engine.raf = requestAnimationFrame(loop);
    };
    engine.raf = requestAnimationFrame(loop);

    const pointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      engine.setAim(x, y);
    };
    const pointerDown = (event) => {
      pointer(event);
      engine.fire();
    };
    const keyDown = (event) => {
      if (event.key === " ") {
        event.preventDefault();
        engine.fire();
      }
      if (event.key === "ArrowLeft") engine.shooter.angle -= 0.12;
      if (event.key === "ArrowRight") engine.shooter.angle += 0.12;
      if (event.key.toLowerCase() === "p") engine.togglePause();
      if (event.key.toLowerCase() === "r") engine.reset();
      if (event.key.toLowerCase() === "f") engine.toggleFullscreen();
      engine.render();
    };

    canvas.addEventListener("pointermove", pointer);
    canvas.addEventListener("pointerdown", pointerDown);
    window.addEventListener("keydown", keyDown);

    window.advanceTime = (ms) => {
      engine.advance(ms);
      return engine.toText();
    };
    window.render_game_to_text = () => engine.toText();
    window.forceSpecialMarble = (kind) => {
      engine.forceSpecial(kind);
      return engine.toText();
    };
    window.debugSetTimer = (seconds) => {
      engine.timer = null;
      engine.elapsedTime = Math.max(0, Number(seconds) || 0);
      engine.pushHud(true);
      engine.render();
      return engine.toText();
    };

    return () => {
      cancelAnimationFrame(engine.raf);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", pointer);
      canvas.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("keydown", keyDown);
      if (window.advanceTime) delete window.advanceTime;
      if (window.render_game_to_text) delete window.render_game_to_text;
      if (window.forceSpecialMarble) delete window.forceSpecialMarble;
      if (window.debugSetTimer) delete window.debugSetTimer;
    };
  }, [scene, level, runKey, language, musicTrack]);

  const powerups = useMemo(
    () =>
      POWERUPS.map((powerup) => ({
        ...powerup,
        count: hud.powerups?.[powerup.id] ?? powerup.count,
      })),
    [hud.powerups],
  );

  return (
    <main className="game-screen" data-scene={scene.id}>
      <header className="game-hud">
        <button className="round-icon" type="button" onClick={onExit} aria-label="Back to scene select">
          <Home size={20} />
        </button>
        <StatPill icon={Trophy} label={tr(language, "score")} value={hud.score.toLocaleString()} />
        <StatPill icon={Crown} label={tr(language, "level")} value={`${scene.index}-${hud.level}`} />
        <StatPill icon={Zap} label={tr(language, "speed")} value={`x${(hud.speedMultiplier || 1).toFixed?.(2) || hud.speedMultiplier || "1.00"}`} />
        <button
          className="round-icon"
          data-hud-audio="music"
          type="button"
          onClick={onToggleMusic}
          aria-label={musicEnabled ? "Mute music" : "Enable music"}
          title={musicEnabled ? tr(language, "music") : tr(language, "music")}
        >
          {musicEnabled ? <Volume2 size={21} /> : <VolumeX size={21} />}
        </button>
        <button
          className="round-icon"
          data-hud-audio="sfx"
          type="button"
          onClick={onToggleSfx}
          aria-label={sfxEnabled ? "Mute sound effects" : "Enable sound effects"}
          title={sfxEnabled ? tr(language, "sfx") : tr(language, "sfx")}
        >
          {sfxEnabled ? <Sparkles size={21} /> : <VolumeX size={21} />}
        </button>
        <button
          className="round-icon"
          type="button"
          onClick={() => engineRef.current?.togglePause()}
          aria-label={hud.paused ? "Resume" : "Pause"}
        >
          <CirclePause size={21} />
        </button>
      </header>

      <section className="game-layout">
        <aside className="game-side-panel">
          <p className="eyebrow">{tr(language, "levelPrefix", { number: level.number })}</p>
          <h1>{levelText(level, language)}</h1>
          <div className="progress-rail">
            <span style={{ width: `${clamp((hud.removedOrbs / hud.targetOrbs) * 100, 8, 100)}%` }} />
          </div>
          <div className="side-stats">
            <span>{tr(language, "comboValue", { combo: hud.combo })}</span>
            <span>{tr(language, "orbsProgress", { current: hud.removedOrbs, target: hud.targetOrbs })}</span>
            <span className="speed-readout">{tr(language, "speedValue", { speed: (hud.speedMultiplier || 1).toFixed?.(2) || hud.speedMultiplier || "1.00" })}</span>
            <span>{hud.freezeTime > 0 ? tr(language, "frozen") : tr(language, "flowing")}</span>
            <span>{musicEnabled ? tr(language, "musicOn") : tr(language, "muted")}</span>
            <span>{sfxEnabled ? tr(language, "sfx") : tr(language, "muted")}</span>
          </div>
          <div className="special-marble-guide">
            <strong>{tr(language, "specialMarbleGuide")}</strong>
            {Object.keys(SPECIAL_MARBLES).map((id) => {
              const info = specialMarbleInfo(id, language);
              return (
                <p key={id} data-special-guide={id}>
                  <span>{info.name}</span>
                  {info.description}
                </p>
              );
            })}
            <small>{tr(language, "specialChance")}</small>
          </div>
          <div className="powerup-stack">
            {powerups.map((powerup) => (
              <PowerupButton
                key={powerup.id}
                powerup={{ ...powerup, label: powerupText(powerup.id, language), description: powerupInfo(powerup.id, language)?.description }}
                count={powerup.count}
                disabled={hud.mode !== "playing" || powerup.count <= 0}
                onClick={() => engineRef.current?.usePowerup(powerup.id)}
              />
            ))}
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setResult(null);
              setRunKey((key) => key + 1);
            }}
          >
            <RotateCcw size={18} />
            {tr(language, "restart")}
          </button>
        </aside>

        <section className="game-stage" aria-label={`${sceneText(scene, language)} playable canvas`}>
          <canvas ref={canvasRef} aria-label="Marble shooter game area" />
          <div className="tap-hint">{tr(language, "aimHint")}</div>
          <ResultOverlay
            result={result}
            level={level}
            nextLevel={getNextLevel(level.id)}
            language={language}
            onReplay={() => {
              setResult(null);
              setRunKey((key) => key + 1);
            }}
            onNext={onNextLevel}
            onExit={onExit}
          />
        </section>
      </section>
    </main>
  );
}

export function App() {
  const [save, setSave] = useState(() => loadGameSave());
  const [selectedScene, setSelectedScene] = useState(() => loadGameSave().selectedScene || SCENES[0].id);
  const [selectedLevelId, setSelectedLevelId] = useState(() => loadGameSave().selectedLevelId || "crystal-1");
  const [screen, setScreen] = useState("select");
  const [pendingPayment, setPendingPayment] = useState(null);
  const scene = SCENES.find((item) => item.id === selectedScene) || SCENES[0];
  const selectedLevel = getLevel(selectedLevelId);
  const language = getLanguage(save.language);
  const musicEnabled = save.musicEnabled !== false;
  const sfxEnabled = save.sfxEnabled !== false;

  useEffect(() => {
    saveGame({ ...save, selectedScene, selectedLevelId });
  }, [save, selectedScene, selectedLevelId]);

  const selectScene = (sceneId) => {
    const nextLevel = getFirstPlayableLevel(save, sceneId);
    setSelectedScene(sceneId);
    setSelectedLevelId(nextLevel.id);
  };

  const selectLevel = (levelId) => {
    const level = getLevel(levelId);
    if (!save.levels[level.id]?.unlocked) return;
    setSelectedScene(level.sceneId);
    setSelectedLevelId(level.id);
  };

  const startGame = () => {
    if (!save.levels[selectedLevel.id]?.unlocked) return;
    gameAudio.setTrack(save.musicTrack);
    gameAudio.setMusicEnabled(musicEnabled);
    gameAudio.setSfxEnabled(sfxEnabled);
    gameAudio.startMusic(scene, save.musicTrack);
    setScreen("game");
  };

  const exitGame = () => {
    gameAudio.stopMusic();
    setScreen("select");
  };

  const consumePowerup = (kind) => {
    setSave((current) => ({
      ...current,
      inventory: {
        ...current.inventory,
        [kind]: Math.max(0, (current.inventory[kind] || 0) - 1),
      },
    }));
  };

  const finishLevel = (result) => {
    setSave((current) => applyRunResult(current, result));
  };

  const goToNextLevel = () => {
    const nextLevel = getNextLevel(selectedLevel.id);
    if (!nextLevel) return;
    setSelectedScene(nextLevel.sceneId);
    setSelectedLevelId(nextLevel.id);
  };

  const buyUpgrade = (upgradeId) => {
    const item = SHOP_ITEMS.find((shopItem) => shopItem.id === upgradeId);
    if (!item) return;
    setSave((current) => {
      const rank = current.upgrades[upgradeId] || 0;
      const price = item.price + rank * 420;
      if (rank >= item.max || current.coins < price) return current;
      return {
        ...current,
        coins: current.coins - price,
        upgrades: {
          ...current.upgrades,
          [upgradeId]: rank + 1,
        },
      };
    });
  };

  const buyPowerup = (powerupId) => {
    const item = POWERUP_SHOP_ITEMS.find((shopItem) => shopItem.id === powerupId);
    if (!item) return;
    setPendingPayment({ id: powerupId, priceYuan: item.priceYuan });
  };

  const cancelPayment = () => {
    setPendingPayment(null);
  };

  const confirmPayment = () => {
    if (!pendingPayment) return;
    const powerupId = pendingPayment.id;
    setSave((current) => {
      return {
        ...current,
        inventory: {
          ...current.inventory,
          [powerupId]: (current.inventory[powerupId] || 0) + 1,
        },
        paidPowerupPurchases: {
          ...(current.paidPowerupPurchases || {}),
          [powerupId]: ((current.paidPowerupPurchases || {})[powerupId] || 0) + 1,
        },
      };
    });
    setPendingPayment(null);
  };

  const claimQuest = (questId) => {
    const quest = QUEST_DEFS.find((item) => item.id === questId);
    if (!quest) return;
    setSave((current) => {
      const currentQuest = current.quests[questId] || { value: 0, claimed: false };
      if (currentQuest.value < quest.target || currentQuest.claimed) return current;
      const leveled = addXp(current.profileLevel, current.xp, quest.reward.xp || 0);
      return {
        ...current,
        coins: current.coins + (quest.reward.coins || 0),
        gems: current.gems + (quest.reward.gems || 0),
        profileLevel: leveled.profileLevel,
        xp: leveled.xp,
        inventory: Object.entries(quest.reward.inventory || {}).reduce(
          (inventory, [id, count]) => ({
            ...inventory,
            [id]: (inventory[id] || 0) + count,
          }),
          { ...current.inventory },
        ),
        quests: {
          ...current.quests,
          [questId]: { ...currentQuest, claimed: true },
        },
      };
    });
  };

  const toggleMusic = () => {
    setSave((current) => {
      const next = current.musicEnabled === false;
      gameAudio.setMusicEnabled(next);
      if (next && screen === "game") gameAudio.startMusic(scene, current.musicTrack);
      return { ...current, musicEnabled: next };
    });
  };

  const toggleSfx = () => {
    setSave((current) => {
      const next = current.sfxEnabled === false;
      gameAudio.setSfxEnabled(next);
      return { ...current, sfxEnabled: next };
    });
  };

  const changeMusicTrack = (trackId) => {
    const nextTrack = getMusicTrack(trackId).id;
    setSave((current) => ({ ...current, musicTrack: nextTrack }));
    gameAudio.setTrack(nextTrack);
    if (musicEnabled && screen === "game") gameAudio.startMusic(scene, nextTrack);
  };

  const changeLanguage = (languageId) => {
    const nextLanguage = getLanguage(languageId);
    setSave((current) => ({ ...current, language: nextLanguage }));
  };

  return screen === "select" ? (
    <SceneSelect
      selectedScene={selectedScene}
      selectedLevelId={selectedLevel.id}
      save={save}
      language={language}
      onSelect={selectScene}
      onSelectLevel={selectLevel}
      onPlay={startGame}
      musicEnabled={musicEnabled}
      sfxEnabled={sfxEnabled}
      musicTrack={save.musicTrack}
      onToggleMusic={toggleMusic}
      onToggleSfx={toggleSfx}
      onMusicTrackChange={changeMusicTrack}
      onLanguageChange={changeLanguage}
      onBuyUpgrade={buyUpgrade}
      onBuyPowerup={buyPowerup}
      pendingPayment={pendingPayment}
      onCancelPayment={cancelPayment}
      onConfirmPayment={confirmPayment}
      onClaimQuest={claimQuest}
    />
  ) : (
    <GameScreen
      scene={scene}
      level={selectedLevel}
      save={save}
      language={language}
      onExit={exitGame}
      musicEnabled={musicEnabled}
      sfxEnabled={sfxEnabled}
      musicTrack={save.musicTrack}
      onToggleMusic={toggleMusic}
      onToggleSfx={toggleSfx}
      onPowerupUse={consumePowerup}
      onLevelFinish={finishLevel}
      onNextLevel={goToNextLevel}
    />
  );
}
