const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const keys = new Set();
const FIELD_MATURE_AGE = 2;
const TREE_MATURE_AGE = 4;
const TREE_DAILY_TARTS = 1;
const COW_MILK_FEED = 10;
const PREMIUM_MILK_CHANCE = 0.007;
const MAX_COWS = 5;
const PURCHASE_PLOT_LIMIT = 15;
const REWARD_PLOTS = 5;
const SAVE_KEY = "bogiyaEggTartFarmSaveV2";
const FULL_UPGRADE_TEST_KEY = "bogiyaFullUpgradeTestAppliedV1";
const ENABLE_FULL_UPGRADE_TEST = false;
let audioCtx = null;
let musicTimer = null;
let musicOn = false;
let musicPart = 0;
let activeOscillators = [];
let menuMusicTimer = null;
let menuMusicOn = false;
let menuMusicPart = 0;

const itemMeta = {
  basicSeed: { label: "기본 씨앗", detail: "밭에 심기", type: "field" },
  strawberry: { label: "딸기", detail: "딸기 타르트 재료", type: "field" },
  chocolate: { label: "초코", detail: "초코 타르트 재료", type: "field" },
  matcha: { label: "말차", detail: "말차 타르트 재료", type: "field" },
  sapling: { label: "묘목", detail: "나무밭에 심기", type: "tree" },
  hay: { label: "건초", detail: "젖소 먹이", type: "material" },
  carriedHay: { label: "들고 있는 건초", detail: "젖소에게 주기", type: "tool" },
  waterCan: { label: "물뿌리개", detail: "매일 물 주기", type: "tool" },
  drill: { label: "드릴", detail: "보물 확률 상승", type: "tool" },
  tartBasic: { label: "기본 에그타르트", detail: "판매 100원", type: "tart", price: 100 },
  tartStrawberry: { label: "딸기 에그타르트", detail: "판매 300원", type: "tart", price: 300 },
  tartChocolate: { label: "초코 에그타르트", detail: "판매 200원", type: "tart", price: 200 },
  tartMatcha: { label: "말차 에그타르트", detail: "판매 250원", type: "tart", price: 250 },
  milk: { label: "우유", detail: "판매 1000원", type: "farmGood", price: 1000 },
  premiumMilk: { label: "고급우유", detail: "판매 3000원", type: "farmGood", price: 3000 },
  bronze: { label: "동", detail: "판매 100원", type: "treasure", price: 100 },
  silver: { label: "은", detail: "판매 500원", type: "treasure", price: 500 },
  gold: { label: "금", detail: "판매 1000원", type: "treasure", price: 1000 },
};

const flavorByItem = {
  basicSeed: "basic",
  strawberry: "strawberry",
  chocolate: "chocolate",
  matcha: "matcha",
};

const tartByFlavor = {
  basic: "tartBasic",
  strawberry: "tartStrawberry",
  chocolate: "tartChocolate",
  matcha: "tartMatcha",
};

const seasonOrder = [
  { name: "봄", length: 10 },
  { name: "여름", length: 10 },
  { name: "가을", length: 10 },
  { name: "겨울", length: 10 },
];

const state = {
  started: false,
  scene: "home",
  day: 1,
  season: "봄",
  money: 300,
  pendingMoney: 0,
  hasUpgradeReward: false,
  villageSalesDay: 1,
  villageSoldResidents: [],
  selectedItem: "basicSeed",
  message: "작은 나무집에서 첫 아침이 밝았어요.",
  bubble: "zzz..",
  bubbleQueue: [],
  npcBubble: null,
  player: { x: 360, y: 268, speed: 6.15, dir: "down" },
  outfit: "basic",
  water: 20,
  maxWater: 20,
  upgrades: {
    seedLevel: 1,
    waterLevel: 1,
    harvestLevel: 1,
  },
  inventory: {
    basicSeed: 6,
    strawberry: 0,
    chocolate: 0,
    matcha: 0,
    sapling: 3,
    hay: 0,
    carriedHay: 0,
    waterCan: 1,
    drill: 0,
    outfitSpring: 0,
    outfitSummer: 0,
    outfitAutumn: 0,
    outfitWinter: 0,
    tartBasic: 0,
    tartStrawberry: 0,
    tartChocolate: 0,
    tartMatcha: 0,
    milk: 0,
    premiumMilk: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
  },
  plots: createPlots(6),
  treeSpots: createTreeSpots(3),
  cows: createCows(1),
  forestTrees: createForestTrees(),
  digSpots: createDigSpots(),
};

const shopItems = [
  { kind: "item", id: "basicSeed", price: 70, name: "기본 씨앗", desc: "가장 기본적인 에그타르트가 자라요." },
  { kind: "item", id: "strawberry", price: 150, name: "딸기", desc: "봄에는 구매가도 200원으로 올라요." },
  { kind: "item", id: "chocolate", price: 150, name: "초코", desc: "겨울에는 구매가도 200원으로 올라요." },
  { kind: "item", id: "matcha", price: 150, name: "말차", desc: "가을에는 구매가도 200원으로 올라요." },
  { kind: "item", id: "sapling", price: 200, name: "에그타르트 묘목", desc: "나무밭에 심는 작은 묘목이에요." },
  { kind: "item", id: "hay", price: 50, name: "건초", desc: "젖소 먹이예요. 1개씩 주문해요." },
  { kind: "plot", id: "fieldPlot", price: 3500, name: "밭 추가", desc: "새 밭 칸을 하나 더 만들어요." },
  { kind: "treePlot", id: "treePlot", price: 4500, name: "나무밭 추가", desc: "묘목을 심을 나무밭을 하나 더 만들어요." },
  { kind: "cow", id: "cow", price: 5000, name: "젖소", desc: "목장에 젖소를 한 마리 더 데려와요. 최대 5마리." },
];

const clothingItems = [
  { kind: "clothing", id: "outfitSpring", outfit: "spring", price: 3000, name: "빨간셔츠", desc: "봄에 어울리는 산뜻한 셔츠예요." },
  { kind: "clothing", id: "outfitSummer", outfit: "summer", price: 3000, name: "에그타르트 반팔", desc: "여름용 반팔. 작은 타르트 무늬가 있어요." },
  { kind: "clothing", id: "outfitAutumn", outfit: "autumn", price: 3000, name: "갈색코트", desc: "가을 농장길에 잘 어울리는 코트예요." },
  { kind: "clothing", id: "outfitWinter", outfit: "winter", price: 3000, name: "초록잠바", desc: "겨울에도 따뜻한 초록색 잠바예요." },
];

const secretItems = [
  { kind: "item", id: "drill", price: 10000, name: "드릴", desc: "숲의 수상한 땅을 파서 동/은/금을 찾을 수 있어요." },
];

const upgradeItems = [
  { upgrade: "seedLevel", level: 2, price: 5000, name: "씨앗 뿌리기 Lv.2", desc: "씨앗과 재료를 한 번에 2칸까지 심어요." },
  { upgrade: "seedLevel", level: 3, price: 12000, name: "씨앗 뿌리기 Lv.3", desc: "씨앗과 재료를 한 번에 3칸까지 심어요." },
  { upgrade: "waterLevel", level: 2, price: 5000, name: "물뿌리개 Lv.2", desc: "한 번에 2칸까지 물을 줘요." },
  { upgrade: "waterLevel", level: 3, price: 12000, name: "물뿌리개 Lv.3", desc: "한 번에 3칸까지 물을 줘요." },
  { upgrade: "harvestLevel", level: 2, price: 5000, name: "수확 Lv.2", desc: "한 번 수확할 때 에그타르트를 2개 얻어요." },
  { upgrade: "harvestLevel", level: 3, price: 12000, name: "수확 Lv.3", desc: "한 번 수확할 때 에그타르트를 3개 얻어요." },
];

function createPlots(count) {
  const positions = [
    [516, 126],
    [568, 126],
    [620, 126],
    [516, 178],
    [568, 178],
    [620, 178],
    [516, 230],
    [568, 230],
    [620, 230],
    [516, 282],
    [568, 282],
    [620, 282],
    [516, 334],
    [568, 334],
    [620, 334],
  ];
  return positions.slice(0, count).map(([x, y]) => ({ x, y, crop: null, unlocked: true }));
}

function createRewardPlots() {
  return [
    [92, 468],
    [144, 468],
    [92, 520],
    [144, 520],
    [248, 520],
  ].map(([x, y]) => ({ x, y, crop: null, unlocked: true, reward: true }));
}

function createCows(count) {
  const positions = [
    [300, 304],
    [454, 246],
    [612, 340],
    [744, 268],
    [876, 360],
  ];
  return positions.slice(0, count).map(([x, y]) => ({ x, y, feed: 0 }));
}

function createForestTrees() {
  return [
    [140, 118],
    [250, 94],
    [360, 128],
    [510, 86],
    [660, 132],
    [790, 96],
    [198, 300],
    [350, 342],
    [612, 324],
    [820, 320],
  ].map(([x, y]) => ({ x, y, hasSeed: false }));
}

function createDigSpots() {
  return [
    [228, 484],
    [398, 470],
    [552, 500],
    [720, 462],
    [884, 506],
  ].map(([x, y]) => ({ x, y, treasure: null, dug: false }));
}

function createTreeSpots(count) {
  const positions = [
    [790, 80],
    [850, 80],
    [910, 80],
    [790, 166],
    [850, 166],
    [910, 166],
    [790, 252],
    [850, 252],
    [910, 252],
  ];
  return positions.slice(0, count).map(([x, y]) => ({ x, y, tree: null, unlocked: true }));
}

function farmSolids() {
  return [
    { x: 70, y: 76, w: 270, h: 160 },
    { x: 0, y: 0, w: canvas.width, h: 34 },
    { x: 0, y: 606, w: 1120, h: 34 },
    { x: 0, y: 0, w: 34, h: 640 },
    { x: 1086, y: 0, w: 34, h: 640 },
  ];
}

function villageSolids() {
  return [
    { x: 0, y: 0, w: canvas.width, h: 28 },
    { x: 0, y: 612, w: canvas.width, h: 28 },
    { x: 0, y: 0, w: 28, h: 640 },
    { x: canvas.width - 28, y: 0, w: 28, h: 640 },
  ];
}

function forestSolids() {
  return [
    { x: 0, y: 0, w: canvas.width, h: 28 },
    { x: 0, y: 612, w: canvas.width, h: 28 },
    { x: 0, y: 0, w: 28, h: 640 },
    { x: canvas.width - 28, y: 0, w: 28, h: 640 },
  ];
}

function pastureSolids() {
  return [
    { x: 0, y: 0, w: canvas.width, h: 28 },
    { x: 0, y: 612, w: 498, h: 28 },
    { x: 622, y: 612, w: canvas.width - 622, h: 28 },
    { x: 0, y: 0, w: 28, h: 640 },
    { x: canvas.width - 28, y: 0, w: 28, h: 640 },
    { x: 58, y: 322, w: 166, h: 110 },
    { x: 864, y: 174, w: 204, h: 106 },
  ];
}

function homeSolids() {
  return [
    { x: 0, y: 0, w: canvas.width, h: 88 },
    { x: 0, y: 552, w: canvas.width, h: 88 },
    { x: 0, y: 0, w: 210, h: 640 },
    { x: 850, y: 0, w: canvas.width - 850, h: 640 },
    { x: 250, y: 136, w: 96, h: 148 },
    { x: 610, y: 132, w: 132, h: 78 },
    { x: 434, y: 330, w: 120, h: 98 },
    { x: 260, y: 390, w: 130, h: 72 },
  ];
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playerFeet() {
  return { x: state.player.x + 18, y: state.player.y + 54 };
}

function playerHitbox(x = state.player.x, y = state.player.y) {
  return { x: x + 10, y: y + 42, w: 28, h: 18 };
}

function nearRect(rect, pad = 30) {
  const feet = playerFeet();
  return feet.x >= rect.x - pad && feet.x <= rect.x + rect.w + pad && feet.y >= rect.y - pad && feet.y <= rect.y + rect.h + pad;
}

function tryMove(dx, dy) {
  if (dx === 0 && dy === 0) return;
  const solids =
    state.scene === "farm"
      ? farmSolids()
      : state.scene === "forest"
        ? forestSolids()
        : state.scene === "village"
          ? villageSolids()
          : state.scene === "pasture"
            ? pastureSolids()
            : homeSolids();
  const nextX = Math.max(24, Math.min(canvas.width - 60, state.player.x + dx));
  if (!solids.some((solid) => rectsOverlap(playerHitbox(nextX, state.player.y), solid))) {
    state.player.x = nextX;
  }
  const nextY = Math.max(24, Math.min(570, state.player.y + dy));
  if (!solids.some((solid) => rectsOverlap(playerHitbox(state.player.x, nextY), solid))) {
    state.player.y = nextY;
  }
}

function isPlayerStuck() {
  const solids =
    state.scene === "farm"
      ? farmSolids()
      : state.scene === "forest"
        ? forestSolids()
        : state.scene === "village"
          ? villageSolids()
          : state.scene === "pasture"
            ? pastureSolids()
            : homeSolids();
  return solids.some((solid) => rectsOverlap(playerHitbox(), solid));
}

function movePlayerToSafeSpot() {
  const safeSpots = {
    home: { x: 370, y: 316 },
    farm: { x: 186, y: 252 },
    forest: { x: 92, y: 440 },
    village: { x: 560, y: 520 },
    pasture: { x: 560, y: 520 },
  };
  const spot = safeSpots[state.scene] || safeSpots.home;
  state.player.x = spot.x;
  state.player.y = spot.y;
}

function update() {
  let dx = 0;
  let dy = 0;
  if (state.started) {
    if (keys.has("KeyA")) dx -= state.player.speed;
    if (keys.has("KeyD")) dx += state.player.speed;
    if (keys.has("KeyW")) dy -= state.player.speed;
    if (keys.has("KeyS")) dy += state.player.speed;
  }
  if (dx !== 0 && dy !== 0) {
    dx *= 0.72;
    dy *= 0.72;
  }
  if (dx < 0) state.player.dir = "left";
  if (dx > 0) state.player.dir = "right";
  if (dy < 0) state.player.dir = "up";
  if (dy > 0) state.player.dir = "down";
  tryMove(dx, dy);
  draw();
  requestAnimationFrame(update);
}

function draw() {
  if (state.scene === "farm") drawFarm();
  else if (state.scene === "forest") drawForest();
  else if (state.scene === "village") drawVillage();
  else if (state.scene === "pasture") drawPasture();
  else drawHome();
  drawPlayer();
  drawSpeechBubble();
  drawNpcSpeechBubble();
  drawInteractionCursor();
}

function drawFarm() {
  drawPixelBackground();
  drawLongFence();
  drawFarmPaths();
  drawFlowers();
  drawHouse();
  drawWaterCanStand();
  drawPlots();
  drawTreeSpots();
  drawBasketAndTruck();
  drawPixelTexture();
}

function drawPixelBackground() {
  const palette = {
    봄: ["#7fb965", "#74ad5d"],
    여름: ["#70b85f", "#62a84f"],
    가을: ["#b98754", "#a87545"],
    겨울: ["#d8ecf4", "#c2dce8"],
  }[state.season];
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = palette[1];
  for (let y = 38; y < 604; y += 22) {
    for (let x = 44; x < canvas.width - 44; x += 22) {
      if ((x * 3 + y * 5) % 7 < 2) ctx.fillRect(x, y, 8, 4);
    }
  }
  if (state.season === "여름") {
    ctx.fillStyle = "#ffd965";
    ctx.fillRect(1012, 68, 58, 58);
  }
  if (state.season === "가을") drawLeaves();
  if (state.season === "겨울") drawSnow();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 48; y < 600; y += 80) ctx.fillRect(42, y, canvas.width - 84, 3);
}

function drawPixelTexture() {
  ctx.fillStyle = "rgba(52, 42, 24, 0.08)";
  for (let i = 0; i < 220; i += 1) {
    const x = 44 + ((i * 73) % 1030);
    const y = 42 + ((i * 41) % 548);
    ctx.fillRect(x, y, i % 3 === 0 ? 8 : 5, i % 4 === 0 ? 8 : 4);
  }
  ctx.fillStyle = "rgba(250, 255, 222, 0.12)";
  for (let i = 0; i < 90; i += 1) {
    const x = 50 + ((i * 97) % 1010);
    const y = 52 + ((i * 59) % 520);
    ctx.fillRect(x, y, 6, 3);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  for (let y = 58; y < 590; y += 32) {
    ctx.beginPath();
    ctx.moveTo(44, y);
    ctx.lineTo(canvas.width - 44, y);
    ctx.stroke();
  }
}

function drawLeaves() {
  const colors = ["#d6793c", "#c24f2b", "#e0a14a"];
  for (let i = 0; i < 36; i += 1) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect((i * 87) % 1040 + 42, (i * 53) % 520 + 54, 10, 6);
  }
}

function drawSnow() {
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 70; i += 1) {
    ctx.fillRect((i * 61) % 1080 + 30, (i * 43) % 560 + 44, 5, 5);
  }
}

function drawLongFence() {
  ctx.fillStyle = "#6d4528";
  ctx.fillRect(34, 34, 510, 14);
  ctx.fillRect(632, 34, canvas.width - 666, 14);
  ctx.fillRect(34, 592, canvas.width - 68, 14);
  ctx.fillRect(34, 34, 14, 238);
  ctx.fillRect(34, 338, 14, 268);
  ctx.fillRect(canvas.width - 48, 34, 14, 404);
  ctx.fillRect(canvas.width - 48, 526, 14, 80);
  ctx.fillStyle = "#b47b44";
  for (let x = 48; x < canvas.width - 56; x += 54) {
    if (x > 530 && x < 638) continue;
    ctx.fillRect(x, 24, 16, 34);
    ctx.fillRect(x, 582, 16, 34);
  }
  for (let y = 50; y < 586; y += 54) {
    ctx.fillRect(24, y, 34, 16);
    if (y < 438 || y > 500) ctx.fillRect(canvas.width - 58, y, 34, 16);
  }
  ctx.fillStyle = "#d69a5a";
  ctx.fillRect(544, 34, 88, 14);
  ctx.fillRect(34, 272, 14, 66);
  ctx.fillRect(34, 420, 14, 70);
  ctx.fillRect(canvas.width - 48, 438, 14, 88);
}

function drawFarmPaths() {
  ctx.fillStyle = "#cfad72";
  // Main path: house door -> bend -> shipping basket and truck.
  ctx.fillRect(170, 236, 58, 146);
  ctx.fillRect(170, 382, 752, 50);
  ctx.fillRect(922, 432, 50, 92);
  ctx.fillRect(972, 462, 112, 42);
  ctx.fillRect(548, 432, 54, 150);
  ctx.fillRect(48, 430, 138, 44);
  // Field branch.
  ctx.fillRect(458, 146, 42, 236);
  ctx.fillRect(500, 146, 16, 42);
  // Tree branch.
  ctx.fillRect(724, 100, 42, 282);
  ctx.fillRect(766, 100, 24, 42);
  // Pasture branch.
  ctx.fillRect(548, 36, 54, 86);
  ctx.fillRect(458, 88, 90, 34);
  ctx.fillStyle = "rgba(104,74,40,0.18)";
  for (let x = 190; x < 1060; x += 28) ctx.fillRect(x, 405, 12, 5);
  for (let y = 160; y < 374; y += 26) {
    ctx.fillRect(476, y, 5, 12);
    ctx.fillRect(742, y - 32, 5, 12);
  }
  ctx.fillRect(742, 354, 5, 12);
  for (let x = 476; x < 548; x += 24) ctx.fillRect(x, 104, 12, 5);
  for (let y = 48; y < 124; y += 22) ctx.fillRect(572, y, 6, 12);
  ctx.fillStyle = "#fff3b6";
  ctx.fillRect(546, 16, 88, 18);
  ctx.fillStyle = "#5b321d";
  ctx.font = "bold 12px Gulim, sans-serif";
  ctx.fillText("목장", 576, 30);
}

function isVillageUnlocked() {
  return true;
}

function drawPasture() {
  ctx.fillStyle = "#8ed6ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPastureMountains();
  ctx.fillStyle = "#79b95e";
  ctx.fillRect(0, 170, canvas.width, canvas.height - 170);
  ctx.fillStyle = "#6aad55";
  for (let y = 188; y < 600; y += 24) {
    for (let x = 32; x < canvas.width - 32; x += 26) {
      if ((x + y) % 4 === 0) ctx.fillRect(x, y, 12, 4);
      if ((x * 2 + y) % 9 === 0) ctx.fillRect(x + 8, y + 8, 5, 9);
    }
  }
  drawPastureFence();
  drawPastureFlowers();
  drawHayStack();
  drawPastureSign();
  state.cows.forEach((cow, index) => drawCow(cow.x + (index % 2) * 4, cow.y + ((state.day + index) % 2) * 3, cow.feed));
  ctx.fillStyle = "#cfad72";
  ctx.fillRect(498, 536, 124, 78);
  ctx.fillStyle = "rgba(104,74,40,0.18)";
  for (let y = 552; y < 606; y += 22) ctx.fillRect(548, y, 8, 12);
  ctx.fillStyle = "#fff3b6";
  ctx.fillRect(510, 590, 100, 22);
  ctx.fillStyle = "#5b321d";
  ctx.font = "bold 13px Gulim, sans-serif";
  ctx.fillText("농장으로", 532, 606);
  drawPixelTexture();
}

function drawPastureMountains() {
  ctx.fillStyle = "#6e985d";
  ctx.beginPath();
  ctx.moveTo(0, 190);
  ctx.lineTo(170, 88);
  ctx.lineTo(360, 190);
  ctx.lineTo(0, 190);
  ctx.fill();
  ctx.fillStyle = "#5d824f";
  ctx.beginPath();
  ctx.moveTo(248, 190);
  ctx.lineTo(500, 70);
  ctx.lineTo(734, 190);
  ctx.fill();
  ctx.fillStyle = "#759d61";
  ctx.beginPath();
  ctx.moveTo(656, 190);
  ctx.lineTo(930, 82);
  ctx.lineTo(1120, 190);
  ctx.fill();
  ctx.fillStyle = "#eef9ff";
  ctx.fillRect(154, 102, 42, 18);
  ctx.fillRect(486, 88, 54, 18);
  ctx.fillRect(908, 100, 48, 16);
}

function drawPastureFence() {
  ctx.fillStyle = "#6d4528";
  ctx.fillRect(34, 214, canvas.width - 68, 12);
  ctx.fillRect(34, 592, 464, 12);
  ctx.fillRect(622, 592, canvas.width - 656, 12);
  ctx.fillRect(34, 214, 12, 390);
  ctx.fillRect(canvas.width - 46, 214, 12, 390);
  ctx.fillStyle = "#b47b44";
  for (let x = 52; x < canvas.width - 56; x += 56) {
    ctx.fillRect(x, 202, 16, 34);
    if (x < 498 || x > 622) ctx.fillRect(x, 582, 16, 32);
  }
  for (let y = 238; y < 584; y += 58) {
    ctx.fillRect(24, y, 34, 16);
    ctx.fillRect(canvas.width - 58, y, 34, 16);
  }
}

function drawPastureFlowers() {
  const blooms = [
    [254, 456, "#f7a8c8"],
    [398, 420, "#f4d35e"],
    [552, 472, "#e97171"],
    [742, 452, "#f7a8c8"],
    [934, 496, "#f4d35e"],
    [170, 530, "#e97171"],
  ];
  blooms.forEach(([x, y, color]) => {
    ctx.fillStyle = "#4d7d3f";
    ctx.fillRect(x + 4, y + 8, 4, 12);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 6, 6);
    ctx.fillRect(x + 8, y, 6, 6);
    ctx.fillRect(x + 4, y - 5, 6, 6);
  });
}

function drawPastureSign() {
  ctx.fillStyle = "#70411f";
  ctx.fillRect(954, 268, 10, 72);
  ctx.fillStyle = "#fff9e8";
  ctx.fillRect(864, 174, 204, 106);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(864, 174, 204, 5);
  ctx.fillRect(864, 275, 204, 5);
  ctx.fillRect(864, 174, 5, 106);
  ctx.fillRect(1063, 174, 5, 106);
  ctx.fillStyle = "#122047";
  ctx.font = "bold 13px Gulim, sans-serif";
  ctx.fillText("목장 사용법", 890, 204);
  ctx.font = "bold 12px Gulim, sans-serif";
  ctx.fillText("건초더미에서 2개씩 챙겨요.", 884, 228);
  ctx.fillText("젖소에게 10개를 먹이면", 884, 248);
  ctx.fillText("우유나 고급우유를 얻어요.", 884, 268);
}

function drawHayStack() {
  ctx.fillStyle = "#7b4d24";
  ctx.fillRect(74, 406, 126, 22);
  ctx.fillStyle = "#e0b34f";
  ctx.fillRect(82, 358, 80, 50);
  ctx.fillRect(126, 334, 66, 40);
  ctx.fillRect(108, 386, 84, 28);
  ctx.fillStyle = "#f2cf69";
  ctx.fillRect(92, 370, 58, 7);
  ctx.fillRect(136, 346, 42, 6);
  ctx.fillRect(122, 398, 54, 6);
  ctx.fillStyle = "#5b321d";
  ctx.font = "bold 16px Gulim, sans-serif";
  ctx.fillText(`건초 ${state.inventory.hay}`, 92, 324);
}

function drawCow(x, y, feed) {
  ctx.fillStyle = "rgba(24,34,55,0.18)";
  ctx.fillRect(x + 2, y + 42, 62, 8);
  ctx.fillStyle = "#f7f6ed";
  ctx.fillRect(x + 8, y + 14, 46, 30);
  ctx.fillRect(x + 46, y + 4, 24, 24);
  ctx.fillStyle = "#2b2b2f";
  ctx.fillRect(x + 16, y + 18, 12, 10);
  ctx.fillRect(x + 34, y + 30, 12, 10);
  ctx.fillStyle = "#f4b7b7";
  ctx.fillRect(x + 52, y + 18, 18, 10);
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 58, y + 10, 4, 5);
  ctx.fillStyle = "#6a442a";
  ctx.fillRect(x + 50, y - 4, 6, 10);
  ctx.fillRect(x + 64, y - 4, 6, 10);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(x + 14, y + 42, 7, 14);
  ctx.fillRect(x + 42, y + 42, 7, 14);
  ctx.fillStyle = "#fff9e8";
  ctx.fillRect(x + 8, y - 16, 50, 14);
  ctx.fillStyle = "#122047";
  ctx.font = "bold 10px Gulim, sans-serif";
  ctx.fillText(`${feed}/${COW_MILK_FEED}`, x + 18, y - 5);
}

function drawFlowers() {
  if (state.season !== "봄") return;
  const flowers = [
    [92, 292, "#f4d35e"],
    [126, 360, "#e97171"],
    [312, 320, "#f7a8c8"],
    [604, 116, "#f4d35e"],
    [872, 116, "#e97171"],
    [860, 520, "#f7a8c8"],
    [102, 532, "#f4d35e"],
    [360, 530, "#e97171"],
  ];
  flowers.forEach(([x, y, color]) => {
    ctx.fillStyle = "#35783e";
    ctx.fillRect(x + 7, y + 10, 4, 12);
    ctx.fillStyle = color;
    ctx.fillRect(x + 4, y + 2, 5, 5);
    ctx.fillRect(x + 10, y + 2, 5, 5);
    ctx.fillRect(x + 7, y - 1, 5, 5);
    ctx.fillRect(x + 7, y + 6, 5, 5);
    ctx.fillStyle = "#fff5a6";
    ctx.fillRect(x + 8, y + 3, 4, 4);
  });
}

function drawForest() {
  ctx.fillStyle = "#426b40";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#315832";
  for (let y = 32; y < 610; y += 34) {
    for (let x = 32; x < canvas.width - 32; x += 34) {
      if ((x + y) % 3 !== 0) ctx.fillRect(x, y, 14, 8);
    }
  }
  ctx.fillStyle = "#c8a15c";
  ctx.fillRect(34, 420, 180, 54);
  ctx.fillRect(34, 448, 42, 90);
  drawForestSign();
  state.forestTrees.forEach(drawForestTree);
  state.digSpots.forEach(drawDigSpot);
}

function drawForestSign() {
  ctx.fillStyle = "#6b4328";
  ctx.fillRect(118, 354, 16, 42);
  ctx.fillStyle = "#d7aa65";
  ctx.fillRect(76, 318, 102, 44);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(86, 332, 82, 6);
  ctx.fillRect(96, 344, 62, 5);
}

function drawForestTree(tree) {
  ctx.fillStyle = "#5a371f";
  ctx.fillRect(tree.x + 24, tree.y + 54, 18, 48);
  ctx.fillStyle = "#3f803b";
  ctx.beginPath();
  ctx.arc(tree.x + 32, tree.y + 32, 38, 0, Math.PI * 2);
  ctx.arc(tree.x + 8, tree.y + 48, 28, 0, Math.PI * 2);
  ctx.arc(tree.x + 58, tree.y + 48, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawDigSpot(spot) {
  ctx.fillStyle = spot.dug ? "#5c3a27" : "#8b6542";
  ctx.fillRect(spot.x, spot.y, 48, 34);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(spot.x + 8, spot.y + 8, 28, 4);
}

function drawHouse() {
  ctx.fillStyle = "#6e3f24";
  ctx.fillRect(70, 130, 270, 106);
  ctx.fillStyle = "#b96e3a";
  ctx.fillRect(94, 98, 222, 138);
  ctx.fillStyle = "#4e2b1b";
  ctx.beginPath();
  ctx.moveTo(82, 98);
  ctx.lineTo(204, 34);
  ctx.lineTo(326, 98);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7d4328";
  ctx.fillRect(94, 98, 222, 14);
  ctx.fillStyle = "#e8b56b";
  ctx.fillRect(166, 164, 62, 72);
  ctx.fillStyle = "#f6d28b";
  ctx.fillRect(172, 170, 50, 66);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(192, 202, 8, 8);
  drawWindow(112, 148);
  drawWindow(260, 148);
}

function drawWaterCanStand() {
  ctx.fillStyle = "#6e4b2e";
  ctx.fillRect(344, 244, 58, 34);
  ctx.fillStyle = "#6fa4c9";
  ctx.fillRect(360, 218, 28, 36);
  ctx.fillStyle = "#497b9f";
  ctx.fillRect(388, 226, 18, 8);
  ctx.fillStyle = "#bfe8ff";
  ctx.fillRect(366, 224, 12, 22);
}

function drawWindow(x, y) {
  ctx.fillStyle = "#214166";
  ctx.fillRect(x - 4, y - 4, 46, 42);
  ctx.fillStyle = "#bde8ff";
  ctx.fillRect(x, y, 38, 34);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x + 5, y + 4, 9, 26);
  ctx.fillStyle = "#214166";
  ctx.fillRect(x + 17, y, 4, 34);
  ctx.fillRect(x, y + 15, 38, 4);
}

function drawPlots() {
  state.plots.forEach((plot) => {
    drawFieldTile(plot.x, plot.y, plot.crop?.watered);
    if (!plot.crop) return;
    const age = Math.min(plot.crop.age, FIELD_MATURE_AGE);
    if (age < FIELD_MATURE_AGE) drawSprout(plot.x, plot.y, age);
    else drawTart(plot.x + 6, plot.y + 6, plot.crop.flavor, 0.78);
  });
}

function drawFieldTile(x, y, watered) {
  ctx.fillStyle = "#6d4326";
  ctx.fillRect(x, y, 46, 46);
  ctx.fillStyle = watered ? "#6f4b37" : "#9a6237";
  ctx.fillRect(x + 4, y + 4, 38, 38);
  ctx.fillStyle = watered ? "rgba(145,196,216,0.28)" : "rgba(255,218,158,0.16)";
  for (let i = 0; i < 4; i += 1) ctx.fillRect(x + 8, y + 10 + i * 8, 30, 3);
}

function drawSprout(x, y, age) {
  ctx.fillStyle = "#3c7e3f";
  ctx.fillRect(x + 21, y + 25 - age * 5, 5, 15 + age * 5);
  ctx.fillRect(x + 13, y + 24, 20, 6);
  ctx.fillStyle = "#66ad55";
  ctx.fillRect(x + 18, y + 15, 17, 7);
}

function drawTreeSpots() {
  state.treeSpots.forEach((spot) => {
    if (!spot.tree) {
      ctx.fillStyle = "#6d4326";
      ctx.fillRect(spot.x + 2, spot.y + 64, 58, 38);
      ctx.fillStyle = "#a36a3c";
      ctx.fillRect(spot.x + 10, spot.y + 70, 42, 24);
      return;
    }
    if (spot.tree.age < TREE_MATURE_AGE) {
      const size = 22 + spot.tree.age * 9;
      ctx.fillStyle = "#684124";
      ctx.fillRect(spot.x + 28, spot.y + 70 - spot.tree.age * 5, 10, 24 + spot.tree.age * 8);
      ctx.fillStyle = spot.tree.watered ? getTreeSeasonColors().watered : getTreeSeasonColors().leaf;
      ctx.beginPath();
      ctx.arc(spot.x + 33, spot.y + 60 - spot.tree.age * 8, size, 0, Math.PI * 2);
      ctx.fill();
      if (state.season === "봄" && spot.tree.age >= 2) drawTreeBlossoms(spot.x + 10, spot.y + 24, 5);
      if (spot.tree.watered) drawWaterGlow(spot.x + 2, spot.y + 38, 66, 68);
      return;
    }
    const colors = getTreeSeasonColors();
    ctx.fillStyle = "#5a371f";
    ctx.fillRect(spot.x + 20, spot.y + 46, 22, 52);
    if (state.season === "겨울") {
      ctx.fillStyle = "#5a371f";
      ctx.fillRect(spot.x + 8, spot.y + 34, 52, 8);
      ctx.fillRect(spot.x + 4, spot.y + 20, 10, 24);
      ctx.fillRect(spot.x + 54, spot.y + 18, 10, 26);
      ctx.fillStyle = "#e9f3ff";
      ctx.fillRect(spot.x + 6, spot.y + 16, 12, 5);
      ctx.fillRect(spot.x + 50, spot.y + 14, 18, 5);
    } else {
      ctx.fillStyle = colors.leaf;
      ctx.beginPath();
      ctx.arc(spot.x + 32, spot.y + 26, 44, 0, Math.PI * 2);
      ctx.arc(spot.x + 2, spot.y + 46, 30, 0, Math.PI * 2);
      ctx.arc(spot.x + 62, spot.y + 46, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.highlight;
      ctx.beginPath();
      ctx.arc(spot.x + 16, spot.y + 16, 14, 0, Math.PI * 2);
      ctx.arc(spot.x + 54, spot.y + 34, 12, 0, Math.PI * 2);
      ctx.fill();
      if (state.season === "봄") drawTreeBlossoms(spot.x - 8, spot.y - 6, 9);
    }
    if (spot.tree.watered) drawWaterGlow(spot.x - 10, spot.y - 8, 86, 96);
    const available = spot.tree.availableTarts ?? TREE_DAILY_TARTS;
    if (available > 0) drawTart(spot.x + 4, spot.y + 12, "basic", 0.58);
    if (available > 0 && state.upgrades.harvestLevel >= 2) drawTart(spot.x + 40, spot.y + 28, "basic", 0.5);
    if (available > 0 && state.upgrades.harvestLevel >= 3) drawTart(spot.x + 24, spot.y + 2, "basic", 0.42);
  });
}

function getTreeSeasonColors() {
  if (state.season === "봄") return { leaf: "#78b965", watered: "#82c774", highlight: "#f5a9c9" };
  if (state.season === "여름") return { leaf: "#3f8d45", watered: "#55a95b", highlight: "#6fbd61" };
  if (state.season === "가을") return { leaf: "#c77838", watered: "#d18a44", highlight: "#e6b34c" };
  return { leaf: "#6f6a5d", watered: "#7c7768", highlight: "#dce8f5" };
}

function drawTreeBlossoms(x, y, count) {
  for (let i = 0; i < count; i += 1) {
    const px = x + ((i * 19) % 74);
    const py = y + ((i * 13) % 54);
    ctx.fillStyle = "#ffe2ee";
    ctx.fillRect(px, py, 5, 5);
    ctx.fillStyle = "#f59dbc";
    ctx.fillRect(px + 2, py + 2, 3, 3);
  }
}

function drawWaterGlow(x, y, w, h) {
  ctx.fillStyle = "rgba(128, 202, 232, 0.34)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#9ee4ff";
  ctx.fillRect(x + 8, y + h - 10, 10, 4);
  ctx.fillRect(x + w - 20, y + h - 18, 12, 4);
  ctx.fillRect(x + w / 2, y + h - 4, 10, 4);
}

function drawTart(x, y, flavor, scale = 1) {
  const s = 34 * scale;
  const top =
    flavor === "strawberry" ? "#ff6f87" : flavor === "chocolate" ? "#7a461f" : flavor === "matcha" ? "#7eaa52" : "#f2b642";
  ctx.fillStyle = "#4d2a14";
  ctx.fillRect(x, y + s * 0.2, s, s * 0.66);
  ctx.fillStyle = "#f3c161";
  ctx.fillRect(x + s * 0.08, y + s * 0.1, s * 0.84, s * 0.62);
  ctx.fillStyle = top;
  ctx.fillRect(x + s * 0.18, y + s * 0.18, s * 0.64, s * 0.38);
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.fillRect(x + s * 0.2, y + s * 0.16, s * 0.38, s * 0.08);
  ctx.fillStyle = "#112047";
  ctx.fillRect(x + s * 0.3, y + s * 0.42, s * 0.12, s * 0.12);
  ctx.fillRect(x + s * 0.62, y + s * 0.42, s * 0.12, s * 0.12);
}

function getItemPrice(id) {
  const base = itemMeta[id]?.price || 0;
  if (state.season === "봄" && id === "tartStrawberry") return 400;
  if (state.season === "겨울" && id === "tartChocolate") return 400;
  if (state.season === "가을" && id === "tartMatcha") return 400;
  return base;
}

function getShopItemPrice(item) {
  if (item.id === "strawberry" && state.season === "봄") return 200;
  if (item.id === "chocolate" && state.season === "겨울") return 200;
  if (item.id === "matcha" && state.season === "가을") return 200;
  return item.price;
}

function drawBasketAndTruck() {
  ctx.fillStyle = "#8f562d";
  ctx.fillRect(908, 488, 72, 48);
  ctx.fillStyle = "#d89a54";
  ctx.fillRect(919, 474, 50, 20);
  ctx.fillStyle = "#f5cf7a";
  ctx.fillRect(931, 510, 24, 8);

  ctx.fillStyle = "#466b92";
  ctx.fillRect(988, 468, 88, 50);
  ctx.fillStyle = "#6fa4c9";
  ctx.fillRect(1022, 438, 44, 36);
  ctx.fillStyle = "#bfe8ff";
  ctx.fillRect(1030, 446, 24, 18);
  ctx.fillStyle = "#232a38";
  ctx.fillRect(1002, 514, 18, 18);
  ctx.fillRect(1048, 514, 18, 18);
  ctx.fillStyle = "#fff3c4";
  ctx.fillRect(992, 478, 16, 10);
}

function drawVillage() {
  ctx.fillStyle = "#8bc07a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#b86f52";
  ctx.fillRect(0, 292, canvas.width, 70);
  ctx.fillRect(526, 0, 70, canvas.height);
  ctx.fillStyle = "#d49c73";
  for (let x = 0; x < canvas.width; x += 42) ctx.fillRect(x, 322, 22, 8);
  for (let y = 0; y < canvas.height; y += 42) ctx.fillRect(556, y, 8, 22);
  drawFountain(560, 326);
  drawVillageSign(488, 114);
  drawVillageDecorations();
  drawResidentHouse(146, 78, "#f5a6c9", "Rabbit", "rabbit");
  drawResidentHouse(790, 78, "#2f2f35", "Cat", "cat");
  drawResidentHouse(146, 362, "#c74735", "Monkey", "monkey");
  drawResidentHouse(790, 362, "#8fd3ff", "Dog", "dog");
}

function drawVillageDecorations() {
  const grasses = [
    [96, 64],
    [214, 68],
    [292, 78],
    [350, 120],
    [720, 122],
    [874, 68],
    [960, 98],
    [1000, 72],
    [104, 420],
    [230, 430],
    [318, 402],
    [372, 508],
    [724, 502],
    [820, 404],
    [956, 430],
    [1018, 420],
  ];
  grasses.forEach(([x, y]) => {
    ctx.fillStyle = "#4f8a46";
    ctx.fillRect(x, y + 12, 5, 14);
    ctx.fillRect(x + 9, y + 8, 5, 18);
    ctx.fillRect(x + 18, y + 13, 5, 13);
    ctx.fillStyle = "#72ad5c";
    ctx.fillRect(x + 4, y + 20, 22, 6);
  });
  const flowers = [
    [88, 178, "#f7a8c8"],
    [112, 250, "#ffd75d"],
    [286, 262, "#f06f83"],
    [356, 250, "#f7a8c8"],
    [742, 178, "#f06f83"],
    [742, 252, "#ffd75d"],
    [932, 260, "#f7a8c8"],
    [1018, 252, "#f7a8c8"],
    [112, 530, "#f06f83"],
    [256, 558, "#f7a8c8"],
    [356, 596, "#ffd75d"],
    [742, 596, "#f06f83"],
    [864, 558, "#ffd75d"],
    [1018, 530, "#ffd75d"],
  ];
  flowers.forEach(([x, y, color]) => {
    ctx.fillStyle = "#35783e";
    ctx.fillRect(x + 7, y + 10, 4, 13);
    ctx.fillStyle = color;
    ctx.fillRect(x + 3, y + 3, 6, 6);
    ctx.fillRect(x + 11, y + 3, 6, 6);
    ctx.fillRect(x + 7, y - 1, 6, 6);
    ctx.fillRect(x + 7, y + 7, 6, 6);
    ctx.fillStyle = "#fff6b0";
    ctx.fillRect(x + 8, y + 4, 4, 4);
  });
}

function drawVillageSign(x, y) {
  ctx.fillStyle = "#6b4328";
  ctx.fillRect(x + 28, y + 52, 12, 46);
  ctx.fillStyle = "#f6d58a";
  ctx.fillRect(x, y, 68, 52);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(x, y, 68, 6);
  ctx.fillRect(x, y + 46, 68, 6);
  ctx.fillRect(x + 8, y + 16, 52, 5);
  ctx.fillRect(x + 14, y + 28, 40, 5);
}

function drawFountain(x, y) {
  ctx.fillStyle = "#587a9f";
  ctx.beginPath();
  ctx.arc(x, y, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#aee7ff";
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1f7ff";
  ctx.fillRect(x - 8, y - 34, 16, 44);
}

function drawResidentHouse(x, y, color, name, animal) {
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(x, y + 64, 170, 112);
  ctx.fillStyle = color;
  ctx.fillRect(x + 14, y + 44, 142, 132);
  ctx.fillStyle = "#4e2b1b";
  ctx.beginPath();
  ctx.moveTo(x, y + 52);
  ctx.lineTo(x + 85, y);
  ctx.lineTo(x + 170, y + 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f6d28b";
  ctx.fillRect(x + 70, y + 106, 36, 70);
  ctx.fillStyle = "#fff4cf";
  ctx.fillRect(x + 44, y + 72, 82, 22);
  ctx.fillStyle = "#4d2a14";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, x + 85, y + 88);
  ctx.textAlign = "left";
  drawResident(x + 70, y + 194, animal);
}

function drawResident(x, y, animal) {
  const color = animal === "rabbit" ? "#fff3f6" : animal === "cat" ? "#31353c" : animal === "monkey" ? "#9a5d37" : "#bde8ff";
  const accent = animal === "rabbit" ? "#f4a9bd" : animal === "cat" ? "#f7f0d6" : animal === "monkey" ? "#f0c18a" : "#f6fbff";
  ctx.fillStyle = color;
  if (animal === "monkey") {
    ctx.fillRect(x - 16, y - 20, 16, 20);
    ctx.fillRect(x + 44, y - 20, 16, 20);
  }
  if (animal === "cat") {
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 26);
    ctx.lineTo(x + 16, y - 46);
    ctx.lineTo(x + 24, y - 26);
    ctx.moveTo(x + 20, y - 26);
    ctx.lineTo(x + 30, y - 46);
    ctx.lineTo(x + 38, y - 26);
    ctx.fill();
  }
  if (animal === "dog") {
    ctx.beginPath();
    ctx.roundRect(x + 1, y - 22, 12, 26, 6);
    ctx.roundRect(x + 31, y - 22, 12, 26, 6);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 44, 52);
  ctx.fillRect(x + 6, y - 26, 32, 32);
  if (animal === "rabbit") {
    ctx.fillRect(x + 5, y - 48, 8, 26);
    ctx.fillRect(x + 30, y - 48, 8, 26);
    ctx.fillRect(x + 34, y + 28, 16, 14);
  }
  if (animal === "monkey") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + 38, y + 28);
    ctx.lineTo(x + 64, y + 24);
    ctx.arc(x + 64, y + 14, 10, Math.PI / 2, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(x + 12, y - 18, 20, 18);
    ctx.fillRect(x - 12, y - 14, 8, 10);
    ctx.fillRect(x + 48, y - 14, 8, 10);
  }
  if (animal === "dog") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x + 38, y + 32);
    ctx.lineTo(x + 62, y + 22);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(x + 12, y - 17, 20, 14);
  }
  if (animal === "cat") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 38, y + 30);
    ctx.lineTo(x + 64, y + 20);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(x + 13, y - 17, 18, 13);
  }
  ctx.fillStyle = "#101936";
  ctx.fillRect(x + 14, y - 12, 5, 6);
  ctx.fillRect(x + 27, y - 12, 5, 6);
  ctx.fillStyle = animal === "cat" ? "#f29bb2" : "#d96f75";
  ctx.fillRect(x + 21, y - 2, 4, 3);
}

function drawHome() {
  ctx.fillStyle = "#151515";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#c9945b";
  ctx.fillRect(210, 88, 640, 464);
  ctx.fillStyle = "#b77c47";
  for (let y = 120; y < 530; y += 34) ctx.fillRect(222, y, 616, 4);
  ctx.fillStyle = "#8a5635";
  ctx.fillRect(210, 88, 640, 14);
  ctx.fillRect(210, 538, 640, 14);
  ctx.fillRect(210, 88, 14, 464);
  ctx.fillRect(836, 88, 14, 464);
  drawHomeWindow(416, 116);
  drawHomeWindow(506, 116);
  drawBed();
  drawComputerDesk();
  drawRoundTable();
  drawSofa();
  drawWardrobe();
  drawExitMat();
}

function drawHomeWindow(x, y) {
  ctx.fillStyle = "#5a3727";
  ctx.fillRect(x - 6, y - 6, 62, 54);
  ctx.fillStyle = "#bde8ff";
  ctx.fillRect(x, y, 50, 42);
  ctx.fillStyle = "#275071";
  ctx.fillRect(x + 22, y, 5, 42);
  ctx.fillRect(x, y + 19, 50, 5);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x + 6, y + 5, 12, 30);
}

function drawBed() {
  ctx.fillStyle = "#5f3b2a";
  ctx.fillRect(250, 136, 96, 148);
  ctx.fillStyle = "#b7d7ff";
  ctx.fillRect(262, 148, 72, 124);
  ctx.fillStyle = "#fff7e4";
  ctx.fillRect(272, 158, 52, 34);
  ctx.fillStyle = "#88b7ef";
  ctx.fillRect(262, 198, 72, 74);
}

function drawComputerDesk() {
  ctx.fillStyle = "#70482c";
  ctx.fillRect(610, 168, 132, 42);
  ctx.fillRect(624, 208, 14, 36);
  ctx.fillRect(708, 208, 14, 36);
  ctx.fillStyle = "#4d3e64";
  ctx.fillRect(642, 124, 68, 46);
  ctx.fillStyle = "#aee7ff";
  ctx.fillRect(650, 132, 52, 30);
  ctx.fillStyle = "#2e2541";
  ctx.fillRect(664, 172, 24, 8);
  ctx.fillStyle = "#7f5a3d";
  ctx.fillRect(652, 236, 48, 32);
  ctx.fillStyle = "#5f3e2b";
  ctx.fillRect(662, 268, 10, 24);
  ctx.fillRect(684, 268, 10, 24);
}

function drawRoundTable() {
  ctx.fillStyle = "#5a3727";
  ctx.fillRect(466, 418, 52, 34);
  ctx.fillStyle = "#d59b5a";
  ctx.beginPath();
  ctx.arc(492, 382, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2cc75";
  ctx.beginPath();
  ctx.arc(492, 382, 34, 0, Math.PI * 2);
  ctx.fill();
  drawDiary(474, 362);
}

function drawDiary(x, y) {
  ctx.fillStyle = "#5a3727";
  ctx.fillRect(x, y, 38, 30);
  ctx.fillStyle = "#fff2c5";
  ctx.fillRect(x + 4, y + 4, 30, 22);
  ctx.fillStyle = "#7d5235";
  ctx.fillRect(x + 18, y + 5, 3, 20);
  ctx.fillRect(x + 8, y + 11, 8, 2);
  ctx.fillRect(x + 23, y + 11, 7, 2);
}

function drawSofa() {
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(260, 420, 130, 42);
  ctx.fillStyle = "#8d5b3b";
  ctx.fillRect(270, 390, 110, 52);
  ctx.fillStyle = "#b77c56";
  ctx.fillRect(280, 400, 42, 30);
  ctx.fillRect(328, 400, 42, 30);
  ctx.fillStyle = "#70482c";
  ctx.fillRect(252, 404, 18, 42);
  ctx.fillRect(380, 404, 18, 42);
}

function drawWardrobe() {
  ctx.fillStyle = "#5f3b2a";
  ctx.fillRect(734, 330, 72, 128);
  ctx.fillStyle = "#8f5a34";
  ctx.fillRect(744, 342, 52, 104);
  ctx.fillStyle = "#d0a061";
  ctx.fillRect(768, 342, 4, 104);
  ctx.fillStyle = "#f0cf84";
  ctx.fillRect(758, 392, 6, 6);
  ctx.fillRect(776, 392, 6, 6);
}

function drawExitMat() {
  ctx.fillStyle = "#75513b";
  ctx.fillRect(504, 504, 112, 36);
  ctx.fillStyle = "#d1a46b";
  ctx.fillRect(520, 514, 80, 14);
}

function drawPlayer() {
  const { x, y } = state.player;
  const sy = y;
  const outfitColor =
    state.outfit === "spring"
      ? "#d9574d"
      : state.outfit === "summer"
        ? "#f5c96e"
        : state.outfit === "autumn"
          ? "#8f5a34"
          : state.outfit === "winter"
            ? "#4f8f5d"
            : "#9ec5f6";
  ctx.fillStyle = "rgba(24, 34, 55, 0.2)";
  ctx.fillRect(x - 1, sy + 50, 50, 10);
  ctx.fillStyle = "#061b48";
  ctx.fillRect(x + 4, sy + 6, 10, 12);
  ctx.fillRect(x + 34, sy + 6, 10, 12);
  ctx.fillStyle = "#8bb9f2";
  ctx.fillRect(x + 6, sy + 9, 36, 27);
  ctx.fillStyle = "#afd1ff";
  ctx.fillRect(x + 10, sy + 12, 28, 21);
  ctx.fillStyle = outfitColor;
  ctx.fillRect(x + 12, sy + 34, 24, 28);
  ctx.fillRect(x + 4, sy + 38, 10, 20);
  ctx.fillRect(x + 34, sy + 38, 10, 20);
  if (state.outfit === "summer") {
    ctx.fillStyle = "#6d4326";
    ctx.fillRect(x + 20, sy + 44, 8, 5);
  }
  ctx.fillStyle = "#f5f9ff";
  ctx.fillRect(x + 12, sy + 18, 10, 10);
  ctx.fillRect(x + 27, sy + 18, 10, 10);
  ctx.fillStyle = "#061b48";
  ctx.fillRect(x + 16, sy + 21, 5, 6);
  ctx.fillRect(x + 27, sy + 21, 5, 6);
  ctx.fillRect(x + 23, sy + 30, 5, 5);
  ctx.fillStyle = "#f3a7bd";
  ctx.fillRect(x + 9, sy + 28, 7, 4);
  ctx.fillRect(x + 34, sy + 28, 7, 4);
}

function drawSpeechBubble() {
  if (!state.bubble) return;
  const text = state.bubble;
  const x = Math.round(state.player.x - 10);
  const y = Math.round(state.player.y - 34);
  const w = Math.max(44, text.length * 15 + 20);
  ctx.fillStyle = "#fff9e8";
  ctx.fillRect(x, y, w, 28);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + 25, w, 3);
  ctx.fillRect(x, y, 3, 28);
  ctx.fillRect(x + w - 3, y, 3, 28);
  ctx.fillStyle = "#fff9e8";
  ctx.fillRect(x + 18, y + 26, 12, 10);
  ctx.fillStyle = "#5b321d";
  ctx.font = "bold 18px ui-rounded, system-ui, sans-serif";
  ctx.fillText(text, x + 12, y + 20);
}

function drawNpcSpeechBubble() {
  if (!state.npcBubble) return;
  if (Date.now() > state.npcBubble.until) {
    state.npcBubble = null;
    return;
  }
  const { text, x, y } = state.npcBubble;
  const w = Math.max(50, text.length * 15 + 20);
  ctx.fillStyle = "#fff9e8";
  ctx.fillRect(x - w / 2, y, w, 28);
  ctx.fillStyle = "#5b321d";
  ctx.fillRect(x - w / 2, y, w, 3);
  ctx.fillRect(x - w / 2, y + 25, w, 3);
  ctx.fillRect(x - w / 2, y, 3, 28);
  ctx.fillRect(x + w / 2 - 3, y, 3, 28);
  ctx.fillStyle = "#fff9e8";
  ctx.fillRect(x - 4, y + 26, 12, 10);
  ctx.fillStyle = "#5b321d";
  ctx.font = "bold 18px ui-rounded, system-ui, sans-serif";
  ctx.fillText(text, x - w / 2 + 12, y + 20);
}

function drawInteractionCursor() {
  const target = currentTarget();
  if (!target) return;
  ctx.strokeStyle = "#fff0a8";
  ctx.lineWidth = 4;
  ctx.strokeRect(target.x - 4, target.y - 4, target.w + 8, target.h + 8);
  ctx.strokeStyle = "#5b321d";
  ctx.lineWidth = 2;
  ctx.strokeRect(target.x - 2, target.y - 2, target.w + 4, target.h + 4);
}

function currentTarget() {
  if (state.scene === "farm") {
    const door = { x: 154, y: 222, w: 92, h: 48, kind: "door" };
    const waterCan = { x: 344, y: 218, w: 64, h: 62, kind: "waterCan" };
    const pastureGate = { x: 528, y: 26, w: 116, h: 72, kind: "pastureGate" };
    const forestGate = { x: 30, y: 420, w: 40, h: 72, kind: "forestGate" };
    const villageGate = { x: 528, y: 558, w: 88, h: 50, kind: "villageGate" };
    const basket = { x: 908, y: 474, w: 170, h: 64, kind: "ship" };
    const plot = state.plots.find((p) => nearRect({ x: p.x, y: p.y, w: 46, h: 46 }, 48));
    const tree = state.treeSpots.find((t) => nearRect({ x: t.x + 6, y: t.y + 44, w: 56, h: 52 }, 52));
    if (nearRect(door, 72)) return door;
    if (nearRect(waterCan, 48)) return waterCan;
    if (nearRect(pastureGate, 58)) return pastureGate;
    if (nearRect(forestGate, 42)) return forestGate;
    if (nearRect(villageGate, 48)) return villageGate;
    if (plot) return { x: plot.x, y: plot.y, w: 46, h: 46, kind: "plot", data: plot };
    if (tree) return { x: tree.x + 6, y: tree.y + 44, w: 56, h: 52, kind: "tree", data: tree };
    if (nearRect(basket, 42)) return basket;
  } else if (state.scene === "home") {
    const computer = { x: 610, y: 124, w: 132, h: 168, kind: "computer" };
    const bed = { x: 250, y: 136, w: 96, h: 148, kind: "bed" };
    const diary = { x: 434, y: 330, w: 120, h: 98, kind: "diary" };
    const wardrobe = { x: 734, y: 330, w: 72, h: 128, kind: "wardrobe" };
    const exit = { x: 504, y: 504, w: 112, h: 42, kind: "exit" };
    if (nearRect(computer, 76)) return computer;
    if (nearRect(bed, 62)) return bed;
    if (nearRect(diary, 54)) return diary;
    if (nearRect(wardrobe, 54)) return wardrobe;
    if (nearRect(exit, 50)) return exit;
  }
  if (state.scene === "forest") {
    const exit = { x: 30, y: 420, w: 54, h: 118, kind: "farmGate" };
    const sign = { x: 76, y: 318, w: 102, h: 78, kind: "forestSign" };
    const tree = state.forestTrees.find((t) => nearRect({ x: t.x, y: t.y, w: 72, h: 106 }, 42));
    const dig = state.digSpots.find((s) => nearRect({ x: s.x, y: s.y, w: 48, h: 34 }, 38));
    if (nearRect(sign, 44)) return sign;
    if (tree) return { x: tree.x, y: tree.y, w: 72, h: 106, kind: "forestTree", data: tree };
    if (dig) return { x: dig.x, y: dig.y, w: 48, h: 34, kind: "digSpot", data: dig };
    if (nearRect(exit, 48)) return exit;
  }
  if (state.scene === "village") {
    const exit = { x: 528, y: 558, w: 88, h: 50, kind: "villageExit" };
    const sign = { x: 488, y: 114, w: 68, h: 98, kind: "villageSign" };
    const residents = [
      { id: "rabbit", x: 216, y: 272, w: 64, h: 72, kind: "resident", want: "tartStrawberry", name: "토끼", line: "안녕... 딸기 에그타르트 먹고 싶어!" },
      { id: "cat", x: 860, y: 272, w: 64, h: 72, kind: "resident", want: "tartMatcha", name: "고양이", line: "말차 에그타르트 하나 줄래?" },
      { id: "monkey", x: 216, y: 556, w: 64, h: 72, kind: "resident", want: "tartChocolate", name: "원숭이", line: "초코 에그타르트가 최고야!" },
      { id: "dog", x: 860, y: 556, w: 64, h: 72, kind: "resident", want: "tartBasic", name: "강아지", line: "기본 에그타르트가 좋아!" },
    ];
    const resident = residents.find((r) => nearRect(r, 64));
    if (resident) return resident;
    if (nearRect(sign, 62)) return sign;
    if (nearRect(exit, 52)) return exit;
  }
  if (state.scene === "pasture") {
    const exit = { x: 498, y: 548, w: 124, h: 72, kind: "pastureExit" };
    const hayStack = { x: 58, y: 322, w: 166, h: 110, kind: "hayStack" };
    const sign = { x: 864, y: 174, w: 204, h: 106, kind: "pastureSign" };
    const cow = state.cows.find((c) => nearRect({ x: c.x, y: c.y, w: 72, h: 58 }, 56));
    if (cow) return { x: cow.x, y: cow.y, w: 72, h: 58, kind: "cow", data: cow };
    if (nearRect(hayStack, 54)) return hayStack;
    if (nearRect(sign, 50)) return sign;
    if (nearRect(exit, 56)) return exit;
  }
  return null;
}

function action() {
  if (!state.started) return;
  if (advanceBubble()) return;
  const target = currentTarget();
  if (!target) {
    setMessage("Bogiya는 잠깐 멈춰 주변을 둘러봤어요. ...");
    return;
  }
  if (target.kind === "door") return enterHome();
  if (target.kind === "pastureGate") return enterPasture();
  if (target.kind === "pastureExit") return exitPasture();
  if (target.kind === "pastureSign") return openPastureSign();
  if (target.kind === "forestGate") return enterForest();
  if (target.kind === "villageGate") return tryEnterVillage();
  if (target.kind === "farmGate") return exitForest();
  if (target.kind === "villageExit") return exitVillage();
  if (target.kind === "resident") return talkToResident(target);
  if (target.kind === "villageSign") return openVillageSign();
  if (target.kind === "waterCan") return takeWaterCan();
  if (target.kind === "hayStack") return takeHay();
  if (target.kind === "cow") return feedCow(target.data);
  if (target.kind === "exit") return exitHome();
  if (target.kind === "computer") return openShop();
  if (target.kind === "bed") return openSleepDialog();
  if (target.kind === "diary") return openDiary();
  if (target.kind === "wardrobe") return openWardrobe();
  if (target.kind === "forestSign") return openForestSign();
  if (target.kind === "forestTree") return shakeForestTree(target.data);
  if (target.kind === "digSpot") return digTreasure(target.data);
  if (target.kind === "ship") return shipTarts();
  if (target.kind === "plot") return usePlot(target.data);
  if (target.kind === "tree") return useTree(target.data);
}

function setBubble(text, queue = []) {
  state.bubble = text;
  state.bubbleQueue = [...queue];
}

function advanceBubble() {
  if (state.bubbleQueue.length === 0) return false;
  state.bubble = state.bubbleQueue.shift();
  return true;
}

function startGame() {
  state.started = true;
  state.scene = "home";
  if (!loadGame()) {
    state.player.x = 370;
    state.player.y = 316;
    setBubble("zzz..", ["..."]);
    refreshForest();
    setMessage("Bogiya가 침대에서 조용히 일어났어요.");
  }
  if (isPlayerStuck()) movePlayerToSafeSpot();
  applyFullUpgradeTest();
  grantUpgradeReward();
  document.querySelector("#startScreen").classList.add("is-hidden");
  document.activeElement?.blur();
  canvas.focus();
  renderUI();
}

function beginStartTransition() {
  const screen = document.querySelector("#startScreen");
  const overlay = document.querySelector("#transitionOverlay");
  stopMenuMusic();
  playSfx("start");
  screen.classList.add("is-leaving");
  overlay.classList.add("is-active");
  window.setTimeout(() => {
    startGame();
    screen.classList.remove("is-leaving");
    overlay.classList.remove("is-active");
  }, 620);
}

function getSaveData() {
  return {
    day: state.day,
    season: state.season,
    money: state.money,
    pendingMoney: state.pendingMoney,
    selectedItem: state.selectedItem,
    message: state.message,
    bubble: state.bubble,
    bubbleQueue: state.bubbleQueue,
    player: state.player,
    water: state.water,
    maxWater: state.maxWater,
    outfit: state.outfit,
    upgrades: state.upgrades,
    inventory: state.inventory,
    plots: state.plots,
    treeSpots: state.treeSpots,
    cows: state.cows,
    forestTrees: state.forestTrees,
    digSpots: state.digSpots,
    hasUpgradeReward: state.hasUpgradeReward,
    villageSalesDay: state.villageSalesDay,
    villageSoldResidents: state.villageSoldResidents,
  };
}

function saveGame() {
  setMessage("게임이 저장됐어요.");
  persistGame();
}

function persistGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(getSaveData()));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data, { started: true, scene: "home" });
    state.player = { x: 360, y: 268, speed: 6.15, dir: "down", ...state.player, speed: 6.15 };
    state.upgrades = { seedLevel: 1, waterLevel: 1, harvestLevel: 1, ...state.upgrades };
    state.inventory = {
      basicSeed: 0,
      strawberry: 0,
      chocolate: 0,
      matcha: 0,
      sapling: 0,
      hay: 0,
      carriedHay: 0,
      waterCan: 1,
      drill: 0,
      outfitSpring: 0,
      outfitSummer: 0,
      outfitAutumn: 0,
      outfitWinter: 0,
      tartBasic: 0,
      tartStrawberry: 0,
      tartChocolate: 0,
      tartMatcha: 0,
      milk: 0,
      premiumMilk: 0,
      bronze: 0,
      silver: 0,
      gold: 0,
      ...state.inventory,
    };
    state.plots = (state.plots?.length ? state.plots : createPlots(6)).map((plot) => ({ x: plot.x, y: plot.y, crop: plot.crop || null, unlocked: true }));
    const treeLayout = createTreeSpots(state.treeSpots?.length || 3);
    state.treeSpots = (state.treeSpots?.length ? state.treeSpots : createTreeSpots(3)).map((spot, index) => {
      const tree = spot.tree ? { age: 0, watered: false, fruitDays: 0, ...spot.tree } : null;
      if (tree && tree.availableTarts === undefined) tree.availableTarts = tree.age >= TREE_MATURE_AGE ? TREE_DAILY_TARTS : 0;
      return {
        x: treeLayout[index]?.x ?? spot.x,
        y: treeLayout[index]?.y ?? spot.y,
        tree,
        unlocked: true,
      };
    });
    state.forestTrees = state.forestTrees?.length ? state.forestTrees : createForestTrees();
    state.digSpots = state.digSpots?.length ? state.digSpots : createDigSpots();
    const cowLayout = createCows(state.cows?.length || 1);
    state.cows = (state.cows?.length ? state.cows : createCows(1)).slice(0, MAX_COWS).map((cow, index) => ({
      x: cowLayout[index]?.x ?? cow.x,
      y: cowLayout[index]?.y ?? cow.y,
      feed: cow.feed || 0,
    }));
    state.hasUpgradeReward = Boolean(state.hasUpgradeReward);
    state.villageSalesDay = state.villageSalesDay || state.day;
    state.villageSoldResidents = state.villageSoldResidents || [];
    state.season = getSeasonForDay(state.day);
    state.message = data.message || "저장된 하루로 돌아왔어요.";
    state.bubble = data.bubble || "...";
    state.outfit = data.outfit || "basic";
    state.bubbleQueue = data.bubbleQueue || [];
    setMessage("저장된 게임을 불러왔어요.");
    return true;
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return false;
  }
}

function applyFullUpgradeTest() {
  if (!ENABLE_FULL_UPGRADE_TEST) return;
  if (localStorage.getItem(FULL_UPGRADE_TEST_KEY) === "1") return;
  state.money = Math.max(state.money, 50000);
  state.upgrades.seedLevel = 3;
  state.upgrades.waterLevel = 3;
  state.upgrades.harvestLevel = 3;
  state.maxWater = Math.max(state.maxWater, 60);
  state.water = state.maxWater;
  state.inventory.basicSeed = Math.max(state.inventory.basicSeed, 20);
  state.inventory.strawberry = Math.max(state.inventory.strawberry, 20);
  state.inventory.chocolate = Math.max(state.inventory.chocolate, 20);
  state.inventory.matcha = Math.max(state.inventory.matcha, 20);
  state.inventory.sapling = Math.max(state.inventory.sapling, 12);
  state.inventory.drill = 1;
  state.inventory.outfitSpring = 1;
  state.inventory.outfitSummer = 1;
  state.inventory.outfitAutumn = 1;
  state.inventory.outfitWinter = 1;
  state.inventory.tartBasic = Math.max(state.inventory.tartBasic, 5);
  state.inventory.tartStrawberry = Math.max(state.inventory.tartStrawberry, 5);
  state.inventory.tartChocolate = Math.max(state.inventory.tartChocolate, 5);
  state.inventory.tartMatcha = Math.max(state.inventory.tartMatcha, 5);
  state.plots = createPlots(15).map((plot, index) => state.plots[index] || plot);
  state.treeSpots = createTreeSpots(9).map((spot, index) => ({ ...spot, tree: state.treeSpots[index]?.tree || null }));
  setMessage("테스트용으로 모든 업그레이드를 Lv.3으로 맞췄어요. 이제 마을을 확인할 수 있어요.");
  localStorage.setItem(FULL_UPGRADE_TEST_KEY, "1");
  persistGame();
}

function saveAndExit() {
  saveGame();
  stopGameMusic();
  state.started = false;
  state.scene = "home";
  document.querySelector("#startScreen").classList.remove("is-hidden");
  startMenuMusic();
  setMessage("저장했어요. 다시 시작하면 이어서 할 수 있어요.");
}

function playSaveExitTransition() {
  const overlay = document.querySelector("#transitionOverlay");
  overlay.classList.add("is-exiting");
  window.setTimeout(() => {
    saveAndExit();
  }, 420);
  window.setTimeout(() => {
    overlay.classList.remove("is-exiting");
  }, 900);
}

function resetGameData() {
  localStorage.removeItem(SAVE_KEY);
  state.started = false;
  state.scene = "home";
  state.day = 1;
  state.season = "봄";
  state.money = 300;
  state.pendingMoney = 0;
  state.hasUpgradeReward = false;
  state.villageSalesDay = 1;
  state.villageSoldResidents = [];
  state.selectedItem = "basicSeed";
  state.message = "작은 나무집에서 첫 아침이 밝았어요.";
  state.bubble = "zzz..";
  state.bubbleQueue = [];
  state.npcBubble = null;
  state.player = { x: 370, y: 316, speed: 6.15, dir: "down" };
  state.outfit = "basic";
  state.water = 20;
  state.maxWater = 20;
  state.upgrades = { seedLevel: 1, waterLevel: 1, harvestLevel: 1 };
  state.inventory = {
    basicSeed: 6,
    strawberry: 0,
    chocolate: 0,
    matcha: 0,
    sapling: 3,
    hay: 0,
    carriedHay: 0,
    waterCan: 1,
    drill: 0,
    outfitSpring: 0,
    outfitSummer: 0,
    outfitAutumn: 0,
    outfitWinter: 0,
    tartBasic: 0,
    tartStrawberry: 0,
    tartChocolate: 0,
    tartMatcha: 0,
    milk: 0,
    premiumMilk: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
  };
  state.plots = createPlots(6);
  state.treeSpots = createTreeSpots(3);
  state.cows = createCows(1);
  state.forestTrees = createForestTrees();
  state.digSpots = createDigSpots();
  refreshForest();
  stopGameMusic();
  stopMenuMusic();
  localStorage.removeItem(FULL_UPGRADE_TEST_KEY);
  document.querySelector("#startScreen").classList.remove("is-hidden");
  document.querySelector("#startScreen").classList.remove("is-leaving");
  setMessage("저장된 게임을 초기화했어요. 처음부터 다시 시작할 수 있어요.");
  setBubble("zzz..");
  renderUI();
}

function openInfo(title, text) {
  document.querySelector("#infoTitle").textContent = title;
  document.querySelector("#infoText").textContent = text;
  document.querySelector("#infoDialog").showModal();
}

function openSleepDialog() {
  setMessage("침대가 포근해요. 잠잘지 정할 수 있어요.");
  document.querySelector("#sleepDialog").showModal();
}

function openDiary() {
  openInfo(
    "Bogiya의 일기",
    "조용히 혼자 살고 싶어서 작은 시골집을 샀다. 첫 며칠은 평범하게 밭과 나무를 돌봤다. 그런데 밭에서, 그리고 나무에서 에그타르트가 자라났다. 처음엔 당황했지만 한 입 먹어보니 너무 맛있었다. 이 땅은 이상하지만 따뜻하다. 내가 좋아하는 것을 매일 키우며, 조용한 행복을 조금씩 모아가기로 했다."
  );
}

function openForestSign() {
  openInfo(
    "숲 안내판",
    "이 숲에서는 나무를 흔들어 무료 재료를 얻을 수 있어요. 수상한 땅은 드릴을 가지고 파면 동, 은, 금을 찾을 수 있어요. 보물은 하루에 조금씩만 새로 나타나요."
  );
}

function openVillageSign() {
  openInfo(
    "마을 안내판",
    [
      "주민마다 좋아하는 에그타르트 맛이 있어요.",
      "원하는 맛을 알아채서 직접 건네주면 바로 판매 수익을 얻을 수 있어요.",
      "",
      "단, 하루에 한 주민에게 하나씩만 판매할 수 있어요.",
      "돈이 지금 바로 필요할 때 마을 판매를 활용해보세요.",
    ].join("\n")
  );
}

function openSeasonInfo() {
  openInfo(
    "계절 정보",
    [
      "1. 계절 순서",
      "봄 10일 -> 여름 10일 -> 가을 10일 -> 겨울 10일",
      "",
      "2. 계절별 가격변동",
      "봄: 딸기 에그타르트 300원 -> 400원 인상 / 딸기 씨앗 150원 -> 200원 인상",
      "여름: 가격변동 없음",
      "가을: 말차 에그타르트 250원 -> 400원 인상 / 말차 씨앗 150원 -> 200원 인상",
      "겨울: 초코 에그타르트 200원 -> 400원 인상 / 초코 씨앗 150원 -> 200원 인상",
      "",
      "3. 기본 가격",
      "기본 에그타르트 100원",
      "딸기 에그타르트 300원",
      "초코 에그타르트 200원",
      "말차 에그타르트 250원",
      "우유 1000원",
      "고급우유 3000원",
    ].join("\n")
  );
}

function openWardrobe() {
  const owned = clothingItems.filter((item) => state.inventory[item.id] > 0);
  if (owned.length === 0) {
    openInfo("옷장", "아직 가진 옷이 없어요. TartNet의 옷 섹션에서 옷을 살 수 있어요.");
    return;
  }
  renderWardrobe();
  document.querySelector("#wardrobeDialog").showModal();
}

function renderWardrobe() {
  const holder = document.querySelector("#wardrobeItems");
  holder.innerHTML = "";
  const basic = {
    outfit: "basic",
    name: "기본 파란 곰",
    desc: "Bogiya의 조용한 기본 모습이에요.",
  };
  [basic, ...clothingItems.filter((item) => state.inventory[item.id] > 0)].forEach((item) => {
    const selected = state.outfit === item.outfit;
    const card = document.createElement("div");
    card.className = `shop-card ${selected ? "is-owned" : ""}`;
    card.innerHTML = `
      <strong>${item.name}</strong>
      <p>${item.desc}</p>
      <button type="button">${selected ? "입는 중" : "갈아입기"}</button>
    `;
    const button = card.querySelector("button");
    button.disabled = selected;
    button.addEventListener("click", () => selectOutfit(item));
    holder.append(card);
  });
}

function selectOutfit(item) {
  state.outfit = item.outfit;
  setMessage(`${item.name}으로 갈아입었어요.`);
  setBubble("!");
  persistGame();
  renderUI();
  document.querySelector("#wardrobeDialog").close();
}

function enterForest() {
  state.scene = "forest";
  state.player.x = 92;
  state.player.y = 440;
  setMessage("울타리 옆 지름길로 숲에 들어왔어요.");
  setBubble("*o*");
}

function exitForest() {
  state.scene = "farm";
  state.player.x = 72;
  state.player.y = 436;
  setMessage("농장으로 돌아왔어요.");
  setBubble("...");
}

function enterPasture() {
  showLoading("목장 가는중...", () => {
    state.scene = "pasture";
    state.player.x = 560;
    state.player.y = 520;
    setMessage("넓은 목장에 도착했어요. 젖소들이 풀밭에서 천천히 쉬고 있어요.");
    setBubble("*o*");
    persistGame();
  });
}

function exitPasture() {
  showLoading("농장 나가는중...", () => {
    state.scene = "farm";
    state.player.x = 574;
    state.player.y = 88;
    setMessage("농장으로 돌아왔어요.");
    setBubble("...");
    persistGame();
  });
}

function showLoading(text, done) {
  const overlay = document.querySelector("#loadingOverlay");
  document.querySelector("#loadingText").textContent = text;
  overlay.classList.add("is-active");
  window.setTimeout(() => {
    overlay.classList.remove("is-active");
    done();
  }, 3000);
}

function tryEnterVillage() {
  showLoading("마을 가는중...", () => {
    state.scene = "village";
    state.player.x = 560;
    state.player.y = 520;
    setMessage("마을에 도착했어요. 주민들은 각자 좋아하는 에그타르트를 기다려요.");
    setBubble("*o*");
    persistGame();
  });
}

function exitVillage() {
  showLoading("집 가는중...", () => {
    state.scene = "farm";
    state.player.x = 560;
    state.player.y = 528;
    setMessage("농장으로 돌아왔어요.");
    setBubble("...");
    persistGame();
  });
}

function openPastureSign() {
  setMessage("건초더미에서 건초를 2개씩 챙기고, 젖소에게 총 10개를 먹이면 우유를 얻어요. 아주 가끔 고급우유도 나와요.");
  setBubble("!");
}

function talkToResident(resident) {
  resetVillageSalesIfNeeded();
  if (state.villageSoldResidents.includes(resident.id)) {
    setMessage(`${resident.name}: 오늘은 이미 받았어. 내일 다시 와줘.`);
    setBubble("...");
    return;
  }
  const wanted = resident.want;
  if (state.inventory[wanted] > 0) {
    state.inventory[wanted] -= 1;
    state.money += 400;
    state.villageSoldResidents.push(resident.id);
    setMessage(`${resident.name}에게 ${itemMeta[wanted].label}를 팔고 바로 400원을 받았어요.`);
    state.npcBubble = {
      text: "^^b",
      x: resident.x + resident.w / 2,
      y: resident.y - 40,
      until: Date.now() + 1800,
    };
    playSfx("drop");
    persistGame();
    renderUI();
    return;
  }
  const anyTart = ["tartBasic", "tartStrawberry", "tartChocolate", "tartMatcha"].some((id) => state.inventory[id] > 0);
  setMessage(anyTart ? `${resident.name}: 다른 맛은 안 먹어. ${itemMeta[wanted].label}가 좋아.` : `${resident.name}: ${resident.line}`);
  setBubble("...");
}

function resetVillageSalesIfNeeded() {
  if (state.villageSalesDay === state.day) return;
  state.villageSalesDay = state.day;
  state.villageSoldResidents = [];
}

function takeWaterCan() {
  state.water = state.maxWater;
  state.selectedItem = "waterCan";
  setMessage("물뿌리개에 물을 가득 채웠어요.");
  setBubble("!");
  playSfx("waterFill");
  persistGame();
  renderUI();
}

function takeHay() {
  const amount = Math.min(2, state.inventory.hay);
  if (amount <= 0) {
    setMessage("건초가 없어요. TartNet에서 건초를 주문할 수 있어요.");
    setBubble("...");
    playSfx("error");
    return;
  }
  state.inventory.hay -= amount;
  state.inventory.carriedHay += amount;
  state.selectedItem = "carriedHay";
  setMessage(`건초 ${amount}개를 챙겼어요. 젖소에게 먹일 수 있어요.`);
  setBubble("!");
  persistGame();
  renderUI();
}

function feedCow(cow) {
  if (state.inventory.carriedHay <= 0) {
    setMessage("건초 더미에서 건초를 먼저 2개씩 챙겨와야 해요.");
    setBubble("...");
    return;
  }
  const amount = Math.min(state.inventory.carriedHay, COW_MILK_FEED - cow.feed);
  state.inventory.carriedHay -= amount;
  cow.feed += amount;
  if (cow.feed >= COW_MILK_FEED) {
    cow.feed -= COW_MILK_FEED;
    const isPremium = Math.random() < PREMIUM_MILK_CHANCE;
    const milkId = isPremium ? "premiumMilk" : "milk";
    state.inventory[milkId] += 1;
    setMessage(isPremium ? "젖소가 아주 귀한 고급우유 1개를 줬어요!" : "젖소가 우유 1개를 줬어요.");
    setBubble("^^v");
    playSfx("sparkle");
  } else {
    setMessage(`젖소에게 건초를 줬어요. ${cow.feed}/${COW_MILK_FEED}`);
    setBubble("!");
    playSfx("drop");
  }
  persistGame();
  renderUI();
}

function enterHome() {
  state.scene = "home";
  state.player.x = 544;
  state.player.y = 462;
  setMessage("집 안은 조용하고 따뜻해요.");
  setBubble("...");
  playSfx("door");
}

function exitHome() {
  state.scene = "farm";
  state.player.x = 186;
  state.player.y = 252;
  setMessage("농장 공기가 포근해요.");
  setBubble("*o*");
  playSfx("door");
}

function usePlot(plot) {
  if (plot.crop && plot.crop.age >= FIELD_MATURE_AGE) {
    const tartId = tartByFlavor[plot.crop.flavor];
    state.inventory[tartId] += state.upgrades.harvestLevel;
    plot.crop = null;
    setMessage(`${itemMeta[tartId].label}를 ${state.upgrades.harvestLevel}개 수확했어요.`);
    setBubble("^^v");
    persistGame();
    renderUI();
    return;
  }
  if (plot.crop && state.selectedItem === "waterCan") {
    if (state.water <= 0) {
      setMessage("물뿌리개가 비었어요. 집 옆 물뿌리개 자리에서 물을 채워야 해요.");
      setBubble("...");
      renderUI();
      return;
    }
    const watered = waterNearbyPlots(plot);
    setMessage(watered > 0 ? `밭 ${watered}칸에 물을 줬어요.` : "이 근처 밭은 오늘 이미 촉촉해요.");
    if (watered > 0) state.water = Math.max(0, state.water - watered);
    if (watered > 0) playSfx("waterPour");
    setBubble(watered > 0 ? ";;;;" : "...");
    if (watered > 0) persistGame();
    renderUI();
    return;
  }
  if (plot.crop) {
    const days = FIELD_MATURE_AGE - plot.crop.age;
    setMessage(plot.crop.watered ? `자라는 중이에요. ${days}일 더 필요해요.` : "오늘 물을 줘야 자라요.");
    return;
  }
  const selected = state.selectedItem;
  if (!itemMeta[selected] || itemMeta[selected].type !== "field" || state.inventory[selected] <= 0) {
    setMessage("밭에는 기본 씨앗, 딸기, 초코, 말차를 심을 수 있어요.");
    return;
  }
  const planted = plantNearbyPlots(plot, selected);
  setMessage(`${itemMeta[selected].label}을 ${planted}칸에 심었어요. 물도 줘야 해요.`);
  setBubble(";;;;");
  playSfx("plant");
  persistGame();
  renderUI();
}

function useTree(spot) {
  if (spot.tree && spot.tree.age >= TREE_MATURE_AGE) {
    const available = spot.tree.availableTarts ?? TREE_DAILY_TARTS;
    if (available <= 0) {
      setMessage("오늘 열린 에그타르트는 이미 모두 수확했어요. 내일 다시 열려요.");
      setBubble("...");
      return;
    }
    const amount = state.upgrades.harvestLevel;
    state.inventory.tartBasic += amount;
    spot.tree.availableTarts = 0;
    spot.tree.watered = false;
    setMessage(`나무에서 기본 에그타르트 ${amount}개를 수확했어요.`);
    setBubble("^^v");
    persistGame();
    renderUI();
    return;
  }
  if (spot.tree && state.selectedItem === "waterCan") {
    if (state.water <= 0) {
      setMessage("물뿌리개가 비었어요. 집 옆 물뿌리개 자리에서 물을 채워야 해요.");
      setBubble("...");
      renderUI();
      return;
    }
    const watered = waterNearbyTrees(spot);
    setMessage(watered > 0 ? `나무밭 ${watered}칸에 물을 줬어요.` : "이 근처 나무밭은 오늘 이미 촉촉해요.");
    if (watered > 0) state.water = Math.max(0, state.water - watered);
    if (watered > 0) playSfx("waterPour");
    setBubble(watered > 0 ? ";;;;" : "...");
    if (watered > 0) persistGame();
    renderUI();
    return;
  }
  if (spot.tree) {
    const days = TREE_MATURE_AGE - spot.tree.age;
    setMessage(spot.tree.watered ? `나무는 천천히 자라요. ${days}일 더 필요해요.` : "나무밭도 매일 물을 줘야 자라요.");
    return;
  }
  if (state.selectedItem !== "sapling" || state.inventory.sapling <= 0) {
    setMessage("빈 나무밭에는 묘목을 심을 수 있어요.");
    return;
  }
  state.inventory.sapling -= 1;
  spot.tree = { age: 0, watered: false, fruitDays: 0, availableTarts: 0 };
  setMessage("묘목을 심었어요. 매일 물을 주면 5일차에 열매가 맺혀요.");
  setBubble(";;;;");
  playSfx("treePlant");
  persistGame();
  renderUI();
}

function shakeForestTree(tree) {
  if (!tree.hasSeed) {
    setMessage("나무를 흔들었지만 오늘은 아무것도 없어요.");
    setBubble("...");
    return;
  }
  const seeds = ["basicSeed", "strawberry", "chocolate", "matcha"];
  const found = seeds[Math.floor(Math.random() * seeds.length)];
  state.inventory[found] += 1;
  tree.hasSeed = false;
  setMessage(`${itemMeta[found].label}을 숲 나무에서 찾았어요.`);
  setBubble("><!");
  playSfx("sparkle");
  persistGame();
  renderUI();
}

function digTreasure(spot) {
  const hasDrill = state.inventory.drill > 0;
  if (!hasDrill) {
    setMessage("땅을 파려면 비밀사이트에서 드릴을 사야 해요.");
    setBubble("...");
    return;
  }
  if (spot.dug) {
    setMessage("이미 판 땅이에요. 내일 다시 확인해봐요.");
    return;
  }
  if (!spot.treasure) {
    setMessage("파봤지만 아무것도 나오지 않았어요.");
    spot.dug = true;
    setBubble("...");
    persistGame();
    return;
  }
  state.inventory[spot.treasure] += 1;
  setMessage(`${itemMeta[spot.treasure].label}을 찾았어요.`);
  spot.treasure = null;
  spot.dug = true;
  setBubble("$0$");
  playSfx("treasure");
  persistGame();
  renderUI();
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function plantNearbyPlots(origin, itemId) {
  const limit = Math.min(state.upgrades.seedLevel, state.inventory[itemId]);
  const candidates = state.plots
    .filter((plot) => !plot.crop)
    .sort((a, b) => distanceBetween(origin, a) - distanceBetween(origin, b))
    .slice(0, limit);
  candidates.forEach((plot) => {
    state.inventory[itemId] -= 1;
    plot.crop = { flavor: flavorByItem[itemId], age: 0, watered: false };
  });
  return candidates.length;
}

function waterNearbyPlots(origin) {
  const candidates = state.plots
    .filter((plot) => plot.crop && !plot.crop.watered)
    .sort((a, b) => distanceBetween(origin, a) - distanceBetween(origin, b))
    .slice(0, state.upgrades.waterLevel);
  candidates.forEach((plot) => {
    plot.crop.watered = true;
  });
  return candidates.length;
}

function waterNearbyTrees(origin) {
  const candidates = state.treeSpots
    .filter((spot) => spot.tree && !spot.tree.watered)
    .sort((a, b) => distanceBetween(origin, a) - distanceBetween(origin, b))
    .slice(0, state.upgrades.waterLevel);
  candidates.forEach((spot) => {
    spot.tree.watered = true;
  });
  return candidates.length;
}

function shipTarts() {
  let total = 0;
  ["tartBasic", "tartStrawberry", "tartChocolate", "tartMatcha", "milk", "premiumMilk", "bronze", "silver", "gold"].forEach((id) => {
    total += state.inventory[id] * getItemPrice(id);
    state.inventory[id] = 0;
  });
  if (total === 0) {
    setMessage("바구니가 비어 있어요. 판매할 에그타르트가 없어요.");
    return;
  }
  state.pendingMoney += total;
  setMessage(`바구니와 트럭에 실었어요. 내일 ${total}원이 들어와요.`);
  playSfx("drop");
  persistGame();
  renderUI();
}

function normalPlotCount() {
  return state.plots.filter((plot) => !plot.reward).length;
}

function rebuildNormalPlots(count) {
  const rewardPlots = state.plots.filter((plot) => plot.reward);
  const normalPlots = state.plots.filter((plot) => !plot.reward);
  const rebuilt = createPlots(count).map((plot, index) => normalPlots[index] || plot);
  state.plots = [...rebuilt, ...rewardPlots];
}

function grantUpgradeReward() {
  if (state.hasUpgradeReward) return;
  if (state.upgrades.seedLevel < 3 || state.upgrades.waterLevel < 3 || state.upgrades.harvestLevel < 3) return;
  state.hasUpgradeReward = true;
  const existingRewards = state.plots.filter((plot) => plot.reward);
  if (existingRewards.length < REWARD_PLOTS) {
    const rewards = createRewardPlots().filter((_, index) => !existingRewards[index]);
    state.plots = [...state.plots, ...rewards].slice(0, normalPlotCount() + REWARD_PLOTS);
  }
  setMessage("모든 업그레이드 완료 보상으로 집 아래쪽에 밭 5개가 생겼어요.");
  setBubble("!");
}

function sleep() {
  state.day += 1;
  state.season = getSeasonForDay(state.day);
  resetVillageSalesIfNeeded();
  state.money += state.pendingMoney;
  const earned = state.pendingMoney;
  state.pendingMoney = 0;
  state.plots.forEach((plot) => {
    if (!plot.crop) return;
    if (plot.crop.watered) plot.crop.age += 1;
    plot.crop.watered = false;
  });
  state.treeSpots.forEach((spot) => {
    if (!spot.tree) return;
    if (spot.tree.watered) spot.tree.age += 1;
    if (spot.tree.age >= TREE_MATURE_AGE) {
      spot.tree.fruitDays = (spot.tree.fruitDays || 0) + 1;
      if (spot.tree.fruitDays >= 3) {
        spot.tree = null;
        return;
      }
      spot.tree.availableTarts = TREE_DAILY_TARTS;
    }
    spot.tree.watered = false;
  });
  refreshForest();
  if (state.day === 3) setMessage("밭에 노란 무언가가 자랐어요. ...?");
  else if (state.day === 5) setMessage("나무에도 에그타르트가 열렸어요. 이 땅, 이상해.");
  else if (state.day === 7) {
    state.inventory.strawberry += 1;
    setMessage("먹던 딸기가 밭에 떨어졌어요. 혹시 새로운 맛이 될까요?");
  } else if (earned > 0) setMessage(`밤새 판매 수입 ${earned}원이 들어왔어요.`);
  else setMessage("조용한 아침이에요. 오늘도 물을 줘야 해요.");
  if (state.day === 3) setBubble("뭐지?", ["?!"]);
  else if (state.day === 5) setBubble("*o*");
  else setBubble("zzz..", ["..."]);
  persistGame();
  renderUI();
}

function getSeasonForDay(day) {
  const cycleLength = seasonOrder.reduce((sum, season) => sum + season.length, 0);
  let cursor = ((day - 1) % cycleLength) + 1;
  for (const season of seasonOrder) {
    if (cursor <= season.length) return season.name;
    cursor -= season.length;
  }
  return "봄";
}

function refreshForest() {
  state.forestTrees.forEach((tree) => {
    tree.hasSeed = Math.random() < 0.42;
  });
  const hasDrill = state.inventory.drill > 0;
  state.digSpots.forEach((spot) => {
    spot.dug = false;
    spot.treasure = rollTreasure(hasDrill);
  });
}

function rollTreasure(hasDrill) {
  const roll = Math.random();
  if (hasDrill) {
    if (roll < 0.06) return "gold";
    if (roll < 0.2) return "silver";
    if (roll < 0.44) return "bronze";
    return null;
  }
  if (roll < 0.03) return "gold";
  if (roll < 0.12) return "silver";
  if (roll < 0.32) return "bronze";
  return null;
}

function openShop() {
  renderShop();
  document.querySelector("#shopDialog").showModal();
}

function buyItem(item, quantity = 1) {
  let count = quantity;
  if (item.kind === "plot") count = Math.min(quantity, PURCHASE_PLOT_LIMIT - normalPlotCount());
  if (item.kind === "treePlot") count = Math.min(quantity, 9 - state.treeSpots.length);
  if (item.kind === "cow") count = Math.min(quantity, MAX_COWS - state.cows.length);
  if (item.kind === "clothing") count = 1;
  const unitCount = item.bundle || 1;
  if (count <= 0) {
    setMessage(item.kind === "plot" ? "밭은 구매로 최대 15칸까지 늘릴 수 있어요." : item.kind === "cow" ? "젖소는 최대 5마리까지 키울 수 있어요." : "나무밭은 최대 9칸까지 늘릴 수 있어요.");
    playSfx("error");
    return;
  }
  const price = getShopItemPrice(item);
  const totalPrice = price * count;
  if (state.money < totalPrice) {
    setMessage("돈이 조금 부족해요.");
    playSfx("error");
    return;
  }
  if (item.kind === "plot" && normalPlotCount() >= PURCHASE_PLOT_LIMIT) {
    setMessage("밭은 구매로 최대 15칸까지 늘릴 수 있어요.");
    playSfx("error");
    return;
  }
  if (item.kind === "treePlot" && state.treeSpots.length >= 9) {
    setMessage("나무밭은 최대 9칸까지 늘릴 수 있어요.");
    playSfx("error");
    return;
  }
  state.money -= totalPrice;
  if (item.kind === "item") state.inventory[item.id] += count * unitCount;
  if (item.kind === "clothing") {
    state.inventory[item.id] = 1;
    state.outfit = item.outfit;
  }
  if (item.kind === "plot") rebuildNormalPlots(normalPlotCount() + count);
  if (item.kind === "treePlot") state.treeSpots = createTreeSpots(state.treeSpots.length + count).map((spot, index) => ({ ...spot, tree: state.treeSpots[index]?.tree || null }));
  if (item.kind === "cow") state.cows = createCows(state.cows.length + count).map((cow, index) => ({ ...cow, feed: state.cows[index]?.feed || 0 }));
  setMessage(`${item.name}을 ${count * unitCount}개 주문했어요.`);
  persistGame();
  renderUI();
  renderShop();
}

function buyUpgrade(item) {
  if (state.upgrades[item.upgrade] >= item.level) {
    setMessage("이미 적용된 업그레이드예요.");
    renderShop();
    return;
  }
  if (item.level > state.upgrades[item.upgrade] + 1) {
    setMessage("이전 레벨부터 업그레이드해야 해요.");
    playSfx("error");
    return;
  }
  if (state.money < item.price) {
    setMessage("돈이 조금 부족해요.");
    playSfx("error");
    return;
  }
  state.money -= item.price;
  state.upgrades[item.upgrade] = item.level;
  setMessage(`${item.name} 업그레이드를 적용했어요.`);
  grantUpgradeReward();
  persistGame();
  renderUI();
  renderShop();
}

function setMessage(text) {
  state.message = text;
  document.querySelector("#statusText").textContent = text;
}

function renderUI() {
  document.querySelector("#dayText").textContent = `${state.day}일차 · ${state.season}`;
  document.querySelector("#moneyText").textContent = `${state.money}원`;
  document.querySelector("#statusText").textContent = state.message;
  renderWaterGauge();
  renderInventory();
  renderTasks();
}

function renderWaterGauge() {
  const holder = document.querySelector("#waterGauge");
  const drops = Array.from({ length: state.maxWater }, (_, index) => {
    const empty = index >= state.water ? " is-empty" : "";
    return `<span class="drop${empty}"></span>`;
  }).join("");
  holder.innerHTML = `물뿌리개 ${state.water}/${state.maxWater}<div class="water-drops">${drops}</div>`;
}

function renderInventory() {
  const holder = document.querySelector("#inventory");
  holder.innerHTML = "";
  const groups = [
    { title: "씨앗 / 재료", ids: ["basicSeed", "strawberry", "chocolate", "matcha", "sapling", "hay"] },
    { title: "도구", ids: ["waterCan", "carriedHay", "drill"] },
    { title: "수확한 것", ids: ["tartBasic", "tartStrawberry", "tartChocolate", "tartMatcha", "milk", "premiumMilk"] },
    { title: "보물", ids: ["bronze", "silver", "gold"] },
  ];
  groups.forEach((group) => {
    const section = document.createElement("div");
    section.className = "inventory-group";
    const title = document.createElement("div");
    title.className = "inventory-title";
    title.textContent = group.title;
    section.append(title);
    group.ids.forEach((id) => {
      const count = state.inventory[id];
      const meta = itemMeta[id];
      const price = meta.price ? getItemPrice(id) : 0;
      const detail = meta.price ? `판매 ${price}원` : meta.detail;
      const label = id === "hay" || id === "carriedHay" ? `${meta.label} ${count}` : `${meta.label} × ${count}`;
      const button = document.createElement("button");
      button.className = `item ${state.selectedItem === id ? "is-selected" : ""}`;
      button.type = "button";
      button.innerHTML = `${label}<small>${detail}</small>`;
      button.addEventListener("click", () => {
        state.selectedItem = id;
        renderInventory();
      });
      section.append(button);
    });
    holder.append(section);
  });
}

function renderTasks() {
  const tasks = [];
  tasks.push(`씨앗 Lv.${state.upgrades.seedLevel}, 물뿌리개 Lv.${state.upgrades.waterLevel}, 수확 Lv.${state.upgrades.harvestLevel}`);
  tasks.push("밭과 나무밭에 심은 뒤 물뿌리개로 물 주기");
  tasks.push("목장에서 건초를 챙겨 젖소에게 먹이고 우유 얻기");
  tasks.push("집 안 컴퓨터 TartNet에서 재료, 목장 물품, 업그레이드 구매하기");
  tasks.push("오른쪽 아래 바구니와 트럭에 수확물과 우유 싣기");
  tasks.push("왼쪽 지름길 숲에서 씨앗과 드릴 보물 찾기");
  if (state.day <= 3) tasks.push("3일차에 밭의 에그타르트 확인하기");
  if (state.day <= 5) tasks.push("5일차에 나무의 에그타르트 확인하기");
  document.querySelector("#taskList").innerHTML = tasks.map((task) => `<li>${task}</li>`).join("");
}

function renderShop() {
  const holder = document.querySelector("#shopItems");
  holder.innerHTML = "";
  const purchaseTitle = document.createElement("h3");
  purchaseTitle.textContent = "구매";
  purchaseTitle.className = "shop-section-title";
  holder.append(purchaseTitle);
  shopItems.forEach((item) => {
    const price = getShopItemPrice(item);
    const bundleText = item.bundle ? ` / ${item.bundle}개` : "";
    const card = document.createElement("div");
    card.className = "shop-card";
    card.innerHTML = `
      <strong>${item.name} · ${price}원${bundleText}</strong>
      <p>${item.desc}</p>
      <div class="buy-options">
        <button type="button" data-quantity="1">1개</button>
        <button type="button" data-quantity="5">5개</button>
        <button type="button" data-quantity="10">10개</button>
      </div>
    `;
    card.querySelectorAll("[data-quantity]").forEach((button) => {
      button.addEventListener("click", () => buyItem(item, Number(button.dataset.quantity)));
    });
    holder.append(card);
  });
  const secretTitle = document.createElement("h3");
  secretTitle.textContent = "비밀사이트";
  secretTitle.className = "shop-section-title";
  holder.append(secretTitle);
  secretItems.forEach((item) => {
    const owned = state.inventory[item.id] > 0;
    const card = document.createElement("div");
    card.className = `shop-card ${owned ? "is-owned" : ""}`;
    card.innerHTML = `
      <strong>${item.name} · ${item.price}원</strong>
      <p>${item.desc}</p>
      <button type="button">${owned ? "보유중" : "구매"}</button>
    `;
    const button = card.querySelector("button");
    button.disabled = owned;
    button.addEventListener("click", () => buyItem(item));
    holder.append(card);
  });
  const clothingTitle = document.createElement("h3");
  clothingTitle.textContent = "옷";
  clothingTitle.className = "shop-section-title";
  holder.append(clothingTitle);
  clothingItems.forEach((item) => {
    const owned = state.inventory[item.id] > 0;
    const card = document.createElement("div");
    card.className = `shop-card ${owned ? "is-owned" : ""}`;
    card.innerHTML = `
      <strong>${item.name} · ${item.price}원</strong>
      <p>${item.desc}</p>
      <button type="button">${owned ? "보유중" : "구매"}</button>
    `;
    const button = card.querySelector("button");
    button.disabled = owned;
    button.addEventListener("click", () => buyItem(item));
    holder.append(card);
  });
  const upgradeTitle = document.createElement("h3");
  upgradeTitle.textContent = "업그레이드";
  upgradeTitle.className = "shop-section-title";
  holder.append(upgradeTitle);
  upgradeItems.forEach((item) => {
    const current = state.upgrades[item.upgrade];
    const locked = item.level > current + 1;
    const owned = current >= item.level;
    const card = document.createElement("div");
    card.className = `shop-card ${owned ? "is-owned" : ""}`;
    card.innerHTML = `
      <strong>${item.name} · ${item.price}원</strong>
      <p>${item.desc}</p>
      <button type="button">${owned ? "완료" : locked ? "잠김" : "업그레이드"}</button>
    `;
    const button = card.querySelector("button");
    button.disabled = owned || locked;
    button.addEventListener("click", () => buyUpgrade(item));
    holder.append(card);
  });
}

function noteToFrequency(note) {
  const notes = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };
  const match = note.match(/^([A-G]s?)(\d)$/);
  if (!match) return 440;
  const [, pitch, octave] = match;
  const midi = (Number(octave) + 1) * 12 + notes[pitch];
  return 440 * 2 ** ((midi - 69) / 12);
}

function playTone(note, start, duration, type = "sine", gain = 0.035) {
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = noteToFrequency(note);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.03);
  amp.gain.linearRampToValueAtTime(0.001, start + duration);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.04);
  activeOscillators.push(osc);
  osc.onended = () => {
    activeOscillators = activeOscillators.filter((active) => active !== osc);
  };
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx.currentTime;
}

function playNoise(start, duration, gain = 0.04, filterFreq = 900) {
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const amp = audioCtx.createGain();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  source.buffer = buffer;
  source.connect(filter).connect(amp).connect(audioCtx.destination);
  source.start(start);
  source.stop(start + duration);
}

function playSfx(type) {
  const now = ensureAudio();
  if (type === "plant") {
    playNoise(now, 0.18, 0.045, 520);
    playTone("C3", now, 0.14, "triangle", 0.018);
  }
  if (type === "treePlant") {
    playTone("C3", now, 0.22, "triangle", 0.05);
    playTone("G2", now + 0.04, 0.2, "sine", 0.028);
  }
  if (type === "sparkle") {
    ["C5", "E5", "G5", "C6"].forEach((note, index) => playTone(note, now + index * 0.055, 0.14, "sine", 0.035));
  }
  if (type === "treasure") {
    playTone("C4", now, 0.12, "square", 0.03);
    playTone("G4", now + 0.08, 0.16, "square", 0.035);
    playTone("C5", now + 0.18, 0.26, "triangle", 0.04);
  }
  if (type === "waterFill") {
    playNoise(now, 0.32, 0.035, 1800);
    playTone("A4", now + 0.04, 0.18, "sine", 0.018);
  }
  if (type === "waterPour") {
    playNoise(now, 0.34, 0.03, 2200);
    playTone("E5", now + 0.06, 0.12, "sine", 0.014);
  }
  if (type === "door") {
    playTone("D3", now, 0.18, "sawtooth", 0.028);
    playTone("A2", now + 0.08, 0.18, "triangle", 0.02);
  }
  if (type === "drop") {
    playTone("A3", now, 0.12, "triangle", 0.035);
    playNoise(now + 0.04, 0.12, 0.025, 700);
  }
  if (type === "start") {
    ["G4", "C5", "E5", "G5", "C6"].forEach((note, index) => playTone(note, now + index * 0.055, 0.18, "sine", 0.032));
  }
  if (type === "exit") {
    playTone("C3", now, 0.18, "square", 0.035);
    playTone("C3", now + 0.22, 0.2, "square", 0.035);
    playTone("G3", now + 0.44, 0.28, "triangle", 0.026);
    playNoise(now + 0.12, 0.5, 0.018, 1200);
  }
  if (type === "error") {
    playTone("C3", now, 0.12, "square", 0.035);
    playTone("B2", now + 0.13, 0.16, "square", 0.032);
  }
}

function scheduleMusicLoop() {
  if (!musicOn || !audioCtx) return;
  const now = audioCtx.currentTime + 0.05;
  const parts = [
    {
      melody: ["E5", "D5", "C5", "G4", "A4", "C5", "D5", "G4", "E5", "G5", "A5", "G5", "E5", "D5", "C5", "G4"],
      bass: ["C3", "G3", "A3", "F3", "C3", "E3", "F3", "G3"],
    },
    {
      melody: ["G4", "A4", "C5", "D5", "E5", "D5", "C5", "A4", "G4", "C5", "E5", "D5", "C5", "A4", "G4", "E4"],
      bass: ["F3", "C3", "G3", "C3", "A3", "E3", "F3", "G3"],
    },
    {
      melody: ["C5", "E5", "G5", "E5", "D5", "C5", "A4", "G4", "A4", "C5", "D5", "E5", "G5", "E5", "D5", "C5"],
      bass: ["A3", "E3", "F3", "C3", "D3", "A3", "G3", "C3"],
    },
  ];
  const part = parts[musicPart % parts.length];
  musicPart += 1;
  part.melody.forEach((note, index) => playTone(note, now + index * 0.45, 0.34, "sine", 0.024));
  part.bass.forEach((note, index) => playTone(note, now + index * 0.9, 0.76, "triangle", 0.015));
  musicTimer = window.setTimeout(scheduleMusicLoop, 7200);
}

async function toggleMusic() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  musicOn = !musicOn;
  document.querySelector("#musicButton").textContent = musicOn ? "BGM 끄기" : "BGM 켜기";
  if (musicOn) scheduleMusicLoop();
  else {
    window.clearTimeout(musicTimer);
    musicTimer = null;
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    activeOscillators = [];
  }
}

function stopGameMusic() {
  musicOn = false;
  document.querySelector("#musicButton").textContent = "BGM 켜기";
  window.clearTimeout(musicTimer);
  musicTimer = null;
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {}
  });
  activeOscillators = [];
}

function scheduleMenuMusic() {
  if (!menuMusicOn || !audioCtx || state.started) return;
  const now = audioCtx.currentTime + 0.05;
  const parts = [
    ["C5", "E5", "G5", "E5", "D5", "C5", "A4", "G4"],
    ["G4", "B4", "D5", "G5", "E5", "D5", "B4", "G4"],
  ];
  const melody = parts[menuMusicPart % parts.length];
  menuMusicPart += 1;
  melody.forEach((note, index) => playTone(note, now + index * 0.55, 0.38, "sine", 0.018));
  ["C3", "F3", "G3", "C3"].forEach((note, index) => playTone(note, now + index * 1.1, 0.8, "triangle", 0.012));
  menuMusicTimer = window.setTimeout(scheduleMenuMusic, 4400);
}

async function startMenuMusic() {
  if (state.started || menuMusicOn) return;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  menuMusicOn = true;
  scheduleMenuMusic();
}

function stopMenuMusic() {
  menuMusicOn = false;
  window.clearTimeout(menuMusicTimer);
  menuMusicTimer = null;
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {}
  });
  activeOscillators = [];
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (key === " " || key === "enter") event.preventDefault();
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(code)) {
    event.preventDefault();
    return;
  }
  if (code === "Space" || code === "KeyE") {
    event.preventDefault();
    if (!event.repeat) action();
    return;
  }
  if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(code)) {
    event.preventDefault();
    keys.add(code);
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

document.querySelectorAll("[data-move]").forEach((button) => {
  const map = { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD" };
  const key = map[button.dataset.move];
  button.addEventListener("pointerdown", () => keys.add(key));
  button.addEventListener("pointerup", () => keys.delete(key));
  button.addEventListener("pointerleave", () => keys.delete(key));
});

document.querySelector("[data-action]").addEventListener("click", action);

document.querySelector("#startButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  beginStartTransition();
});

document.querySelector("#aboutButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  const about = document.querySelector("#aboutText");
  about.hidden = !about.hidden;
});

document.querySelector("#resetButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  resetGameData();
});

document.querySelector("#confirmSleepButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  document.querySelector("#sleepDialog").close();
  const overlay = document.querySelector("#transitionOverlay");
  overlay.classList.add("is-sleeping");
  window.setTimeout(() => {
    sleep();
  }, 820);
  window.setTimeout(() => {
    overlay.classList.remove("is-sleeping");
  }, 1700);
});

document.querySelector("#musicButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  toggleMusic();
});

document.querySelector("#seasonButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  openSeasonInfo();
});

document.querySelector("#saveButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  document.querySelector("#saveDialog").showModal();
});

document.querySelector("#confirmSaveButton").addEventListener("click", (event) => {
  event.currentTarget.blur();
  document.querySelector("#saveDialog").close();
  playSaveExitTransition();
});

document.querySelector("#startScreen").addEventListener("pointerdown", () => {
  startMenuMusic();
});

renderUI();
update();
