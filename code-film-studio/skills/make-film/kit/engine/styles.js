// engine/styles.js — lighting moods + universal switchable visual styles.
// A MOOD defines the lighting situation of a location (day, golden, dusk, night, storm, interiorWarm, interiorCool, studio, void).
// A STYLE re-grades every mood (palette overrides + per-channel lift/gamma/gain LUT + post settings).
// Scenes should pull environment colours from mood()/S() so switching `style` in config.json re-themes the film cleanly.

export const COATS = {
  cream:    '#f6efdd',
  sage:     '#cfe3c8',
  peach:    '#e9b79d',
  sky:      '#bcd7ee',
  butter:   '#f1d98a',
  coral:    '#e58b78',
  lavender: '#cec4ea',
  slate:    '#4b566b',
  charcoal: '#2a2935',
  crimson:  '#c84b43',
  mustard:  '#eab84e',
  teal:     '#4f9a94',
};

export const BASE_MOODS = {
  day:          { sky: ['#7ea8dc', '#bcd6ee', '#f2e8d8'], ambient: '#7783a6', key: '#fff5e0', rim: '#ffe9c2', wall: '#8f8ba8', floor: '#65617c', dark: '#302d42', practical: '#ffe3a8', grass: '#599862', road: '#5d5b6e', fog: '#e2e7f4' },
  golden:       { sky: ['#68588e', '#cc7c78', '#f0a66e', '#fae0a8'], ambient: '#6e6592', key: '#ffd294', rim: '#f2a864', wall: '#62485c', floor: '#483546', dark: '#281d29', practical: '#ffe6b0', grass: '#547348', road: '#4a3e4c', fog: '#f0c59c' },
  dusk:         { sky: ['#463b72', '#8e6292', '#e4936c', '#f8d29c'], ambient: '#6b6798', key: '#ffc98c', rim: '#eea865', wall: '#584868', floor: '#40344e', dark: '#241d30', practical: '#ffd89e', grass: '#426052', road: '#3d354a', fog: '#c89298' },
  night:        { sky: ['#121836', '#242e5e', '#44407a'], ambient: '#3c426e', key: '#d2dcff', rim: '#b4c4ff', wall: '#2e3356', floor: '#20243e', dark: '#111428', practical: '#ffbe68', grass: '#264840', road: '#262940', fog: '#444d7e' },
  storm:        { sky: ['#182038', '#2d385c', '#455078'], ambient: '#384264', key: '#e0e8ff', rim: '#c8d6ff', wall: '#303856', floor: '#20273e', dark: '#101524', practical: '#bed2ff', grass: '#294c42', road: '#262c3e', fog: '#505c86' },
  interiorWarm: { sky: ['#c98a74', '#f2b585', '#f7cf98'], ambient: '#6e668e', key: '#ffd8a0', rim: '#eea865', wall: '#665b84', floor: '#4b4364', dark: '#282338', practical: '#ffd48e', grass: '#426052', road: '#3d354a', fog: '#b88a84' },
  interiorCool: { sky: ['#323d6c', '#6272a8'], ambient: '#5c608c', key: '#d6e0ff', rim: '#c4d2ff', wall: '#565884', floor: '#3e4064', dark: '#1e2038', practical: '#a8e4ff', grass: '#2c5048', road: '#2c3048', fog: '#586090' },
  studio:       { sky: ['#ece8df', '#dfd9cd'], ambient: '#9692a6', key: '#ffffff', rim: '#f4a862', wall: '#dcd6ca', floor: '#c5beb0', dark: '#4a4754', practical: '#ffd28a', grass: '#6ba36e', road: '#7a7886', fog: '#ebe7de' },
  void:         { sky: ['#0d1324', '#18223c'], ambient: '#2e3858', key: '#ffffff', rim: '#96c0f0', wall: '#18223c', floor: '#10182c', dark: '#090d18', practical: '#ffd682', grass: '#204038', road: '#181e30', fog: '#24304e' },
};

const UI = {
  card: 'rgba(22,26,46,.93)',
  cardLine: 'rgba(175,190,235,.26)',
  text: '#d8e0f2',
  sub: '#8e9ab8',
  accent: '#f08c55',
  gold: '#ffd47e',
  cream: '#fff6e6',
  blueprint: '#92bce8',
  bpBg: '#0e172a',
  good: '#6fd89c',
  captionBg: 'rgba(14,16,28,.84)',
};

export const STYLES = {
  awaken: {
    name: 'Awaken Twilight',
    desc: 'Warm 2.5D curiosity look: twilight periwinkle shadows, sunset peach/amber rim light, soft gradients, clean full-bleed framing.',
    ink: '#18161f', inkFar: '#2e2b3f', feature: '#fff6e6', coatShadow: '#78749e', rimWidth: 3.5,
    ui: { ...UI, card: 'rgba(28,26,48,.92)', cardLine: 'rgba(240,196,150,.28)', text: '#e8e4f4', sub: '#9e98ba', accent: '#f29a58', gold: '#f7c96e', blueprint: '#9ac4f2', bpBg: '#141a30', good: '#7ed9a6' },
    grade: { contrast: 1.03, sat: 1.05, lift: [0.015, 0.01, 0.028], gamma: [1.01, 1.0, 1.02], gain: [1.03, 1.0, 0.98], vignette: 0.26, grain: 0.018, bloom: 0.5 },
    moods: {
      dusk:         { sky: ['#483c74', '#8e5e90', '#e8966c', '#fae0a8'], ambient: '#7470a2', key: '#ffd498', rim: '#eea865', wall: '#666394', floor: '#4c4972', dark: '#26233c', practical: '#ffe0a6', fog: '#d69aa0' },
      interiorCool: { sky: ['#383d6e', '#6872a8'], ambient: '#7270a2', key: '#e8ecff', rim: '#eea865', wall: '#676597', floor: '#514f7a', dark: '#282640', practical: '#ffd89c', fog: '#6e72a4' },
      interiorWarm: { sky: ['#c98a74', '#f2b585', '#fae0a8'], ambient: '#786c96', key: '#ffe0aa', rim: '#f2ad68', wall: '#6e5e7e', floor: '#524462', dark: '#2a2136', practical: '#ffe2a2', fog: '#c8968e' },
    },
  },
  daylight: {
    name: 'Clean Daylight',
    desc: 'Bright, high-key universal look for comedy, crisp explainers, everyday slice-of-life, and upbeat stories.',
    ink: '#191820', inkFar: '#383648', feature: '#fffaf0', coatShadow: '#8c96b2', rimWidth: 3.0,
    ui: { ...UI, card: 'rgba(26,34,52,.92)', cardLine: 'rgba(140,180,230,.32)', text: '#e8f0fa', sub: '#9cb0cc', accent: '#f06c4e', gold: '#f6c24a', blueprint: '#6fb6f0', bpBg: '#102238', good: '#52c986' },
    grade: { contrast: 1.02, sat: 1.06, lift: [0.01, 0.012, 0.016], gamma: [1.0, 1.0, 1.0], gain: [1.02, 1.02, 1.01], vignette: 0.12, grain: 0.008, bloom: 0.35 },
    moods: {
      day:          { sky: ['#6ca4e4', '#aedeff', '#f7f2e6'], ambient: '#8c9ab8', key: '#fffaf0', rim: '#fff2d2', wall: '#d8d2c6', floor: '#b6aea0', dark: '#484658', practical: '#ffe49c', fog: '#eef4fc' },
      dusk:         { sky: ['#74aee8', '#b8e0ff', '#fdf4e2'], ambient: '#8ea2c0', key: '#fff8e8', rim: '#ffe6a8', wall: '#d2cec4', floor: '#9aa6b8', dark: '#445066', practical: '#ffe294', fog: '#eaf2fc' },
      golden:       { sky: ['#7cb4ec', '#cbe6ff', '#fff2d6'], ambient: '#92a0bc', key: '#fff6de', rim: '#ffe29a', wall: '#d6cfc2', floor: '#a8a296', dark: '#484858', practical: '#ffe294', fog: '#f4efe2' },
      interiorWarm: { sky: ['#8cc0f0', '#dff0ff'], ambient: '#968ea8', key: '#fff6e4', rim: '#ffd08e', wall: '#cfc4b4', floor: '#a69682', dark: '#48403c', practical: '#ffd88a', fog: '#efe6d8' },
      interiorCool: { sky: ['#7cb4ec', '#d6ecff'], ambient: '#8e9cb8', key: '#ffffff', rim: '#cbe6ff', wall: '#cfd8e4', floor: '#9eaab8', dark: '#3e4a5c', practical: '#bae2ff', fog: '#e6eef8' },
    },
  },
  cinema: {
    name: 'Ink & Ember',
    desc: 'Warm storybook cinema: deep slate-navy fields, rich ember-amber focal light, tactile paper-cut contrast for narrative drama.',
    ink: '#141c28', inkFar: '#27384c', feature: '#f6ecd6', coatShadow: '#5e7288', rimWidth: 3.8,
    ui: { ...UI, card: 'rgba(20,32,46,.94)', cardLine: 'rgba(233,180,76,.3)', text: '#f4e8cf', sub: '#93aab8', accent: '#e9b44c', gold: '#e9b44c', blueprint: '#8fb89a', bpBg: '#12202e', good: '#8fb89a' },
    grade: { contrast: 1.07, sat: 1.04, lift: [0.0, 0.015, 0.028], gamma: [1.02, 1.0, 0.97], gain: [1.05, 1.01, 0.93], vignette: 0.42, grain: 0.03, bloom: 0.55 },
    moods: {
      dusk:         { sky: ['#172333', '#2c4658', '#9c6b45', '#e9b44c'], ambient: '#4a6274', key: '#f4d084', rim: '#e9b44c', wall: '#263849', floor: '#172633', dark: '#0e1822', practical: '#f2c86b', fog: '#6c7e88' },
      night:        { sky: ['#0f1926', '#172333', '#263e50'], ambient: '#365064', key: '#cbe0ec', rim: '#e9b44c', wall: '#1f3142', floor: '#14222e', dark: '#0b141e', practical: '#e9b44c', fog: '#365061' },
      interiorWarm: { sky: ['#243447', '#36576a'], ambient: '#4c6272', key: '#f4cf82', rim: '#e9b44c', wall: '#263849', floor: '#172633', dark: '#0f1a24', practical: '#e9b44c', fog: '#5c6e78' },
    },
  },
  noir: {
    name: 'Midnight Noir',
    desc: 'High-contrast suspense & horror: deep obsidian shadows, cold moonlight, sharp sodium rim lights, tense atmosphere.',
    ink: '#0b0c12', inkFar: '#222534', feature: '#eef2fa', coatShadow: '#464c66', rimWidth: 3.6,
    ui: { ...UI, card: 'rgba(12,14,22,.95)', cardLine: 'rgba(180,196,226,.25)', text: '#d8e0ee', sub: '#7c869c', accent: '#e05248', gold: '#f0b860', blueprint: '#8ca8cc', bpBg: '#090c14', good: '#78b89a' },
    grade: { contrast: 1.18, sat: 0.72, lift: [0.0, 0.005, 0.018], gamma: [0.94, 0.96, 1.02], gain: [0.98, 1.0, 1.06], vignette: 0.68, grain: 0.055, bloom: 0.6 },
    moods: {
      night:        { sky: ['#05070e', '#0e1426', '#1c2640'], ambient: '#283048', key: '#c8d6f0', rim: '#d8e4ff', wall: '#161b2c', floor: '#0e121e', dark: '#060810', practical: '#f0a850', fog: '#2a3450' },
      dusk:         { sky: ['#0c1020', '#242844', '#684848', '#b88460'], ambient: '#323650', key: '#e0b890', rim: '#f0b878', wall: '#1c2032', floor: '#121522', dark: '#080a12', practical: '#f0b060', fog: '#484c68' },
    },
  },
  emerald: {
    name: 'Emerald Pulse',
    desc: 'Deep forest-green shadows, warm gold key light, crisp mint-lime rim light, rich sci-fi contrast.',
    ink: '#0a1410', inkFar: '#1f362c', feature: '#f2ffe8', coatShadow: '#4c6e5e', rimWidth: 4.0,
    ui: { ...UI, card: 'rgba(8,30,22,.94)', cardLine: 'rgba(140,255,170,.28)', text: '#a8e8c0', sub: '#6fa88a', accent: '#b8f246', gold: '#ffd45a', blueprint: '#7dffb0', bpBg: '#061a12', good: '#b8f246' },
    grade: { contrast: 1.08, sat: 1.12, lift: [0.0, 0.03, 0.018], gamma: [0.97, 1.05, 0.97], gain: [1.02, 1.08, 0.9], vignette: 0.52, grain: 0.04, bloom: 0.72 },
    moods: {
      dusk:         { sky: ['#0c2a22', '#1f5a44', '#7ab05a', '#f2d36a'], key: '#ffd77a', rim: '#c6ff4d', wall: '#1e3a30', floor: '#152a22', dark: '#0a1812', practical: '#ffe28a', fog: '#5a8a6a' },
      golden:       { sky: ['#1a4a38', '#8ab04a', '#f6d45a'], rim: '#d8ff6a', key: '#ffd36a' },
      night:        { sky: ['#03100c', '#0a2a20', '#164a36'], rim: '#7dffb0', practical: '#ffd45a', wall: '#10261e' },
      interiorWarm: { rim: '#c6ff4d', wall: '#233a2e', practical: '#ffd45a' },
      void:         { sky: ['#03100c', '#08201a'], rim: '#7dffb0' },
    },
  },
  ember: {
    name: 'Ember Forge',
    desc: 'Charcoal world lit by fire: crimson shadows, molten copper rim light, hot orange glows, heavy dramatic contrast.',
    ink: '#120909', inkFar: '#321a18', feature: '#fff2e4', coatShadow: '#744844', rimWidth: 3.8,
    ui: { ...UI, card: 'rgba(30,12,10,.94)', cardLine: 'rgba(255,140,90,.3)', text: '#f0b49a', sub: '#a8705c', accent: '#ff4b3a', gold: '#ffa53d', blueprint: '#ff9a6a', bpBg: '#1a0806', good: '#ffc53d' },
    grade: { contrast: 1.15, sat: 1.16, lift: [0.045, 0.0, 0.0], gamma: [1.06, 0.95, 0.88], gain: [1.16, 0.96, 0.78], vignette: 0.65, grain: 0.05, bloom: 0.78 },
    moods: {
      dusk:         { sky: ['#1a0606', '#5a140e', '#c8401e', '#ffa040'], key: '#ff9a4a', rim: '#ff7a2e', wall: '#3a1612', floor: '#2a100c', dark: '#140606', practical: '#ffb050', fog: '#8a3a26' },
      night:        { sky: ['#0a0404', '#2a0a08', '#5a1a10'], rim: '#ff6a2e', practical: '#ffa53d', wall: '#241010' },
      golden:       { sky: ['#4a1a10', '#d0602a', '#ffb860'], rim: '#ff8a3a' },
      interiorWarm: { rim: '#ff7a2e', wall: '#3a1a16' },
    },
  },
  arctic: {
    name: 'Arctic Glass',
    desc: 'Clean icy world: steel-teal shadows, crisp white key, cyan rim light, sharp clinical precision for tech & science.',
    ink: '#0c1620', inkFar: '#2c4254', feature: '#f4fdff', coatShadow: '#648296', rimWidth: 3.5,
    ui: { ...UI, card: 'rgba(10,30,44,.92)', cardLine: 'rgba(160,240,255,.3)', text: '#bfefff', sub: '#7aaabf', accent: '#3de0ff', gold: '#e8fbff', blueprint: '#9af2ff', bpBg: '#071822', good: '#5fffd2' },
    grade: { contrast: 1.04, sat: 0.86, lift: [0.018, 0.045, 0.065], gamma: [0.95, 1.02, 1.07], gain: [0.94, 1.04, 1.1], vignette: 0.34, grain: 0.018, bloom: 0.6 },
    moods: {
      dusk:         { sky: ['#123044', '#2e6a86', '#8ad0e0', '#e6f8ff'], key: '#eaf8ff', rim: '#7ff0ff', wall: '#2a4656', floor: '#1e3442', dark: '#0e1e28', practical: '#c8f6ff', fog: '#8ab8c8' },
      golden:       { sky: ['#2a5a76', '#a0d8e8', '#f0fcff'], rim: '#a8f6ff', key: '#f4fcff' },
      night:        { sky: ['#040e16', '#0c2636', '#18465a'], rim: '#5fe8ff', practical: '#e8fbff' },
      interiorWarm: { rim: '#9af2ff', wall: '#2e4a58', practical: '#e0faff' },
    },
  },
  sakura: {
    name: 'Sakura Bloom',
    desc: 'Dreamy rose-and-peach world: plum shadows, soft pink sky, warm peach key, gentle haze for romance, memory, and poetry.',
    ink: '#1c101a', inkFar: '#4a2c42', feature: '#fff5f7', coatShadow: '#8c6882', rimWidth: 4.0,
    ui: { ...UI, card: 'rgba(50,20,40,.9)', cardLine: 'rgba(255,170,210,.3)', text: '#ffc4dc', sub: '#c088a4', accent: '#ff5fa0', gold: '#ffd0a0', blueprint: '#ffb0d4', bpBg: '#220e1c', good: '#ffa0c8' },
    grade: { contrast: 0.97, sat: 1.05, lift: [0.06, 0.025, 0.05], gamma: [1.06, 1.0, 1.03], gain: [1.08, 0.97, 1.02], vignette: 0.3, grain: 0.03, bloom: 0.65 },
    moods: {
      dusk:         { sky: ['#4a2050', '#b05a8a', '#f2a0b4', '#ffe0d0'], key: '#ffcfb0', rim: '#ffa0c8', wall: '#5a3048', floor: '#46243a', dark: '#2a1222', practical: '#ffd8c0', fog: '#d08aa8' },
      night:        { sky: ['#1a0a24', '#3a1a48', '#6a3a70'], rim: '#ff9ad0', practical: '#ffc8a0' },
      golden:       { sky: ['#8a4a7a', '#f2a0a0', '#ffe4c4'], rim: '#ffb4c8' },
      interiorWarm: { rim: '#ffa0c8', wall: '#5a3448' },
    },
  },
  retro: {
    name: 'Retro Print',
    desc: 'Vintage poster look: faded teal and mustard, sepia-warm highlights, muted saturation, tactile print grain for history.',
    ink: '#1e1814', inkFar: '#4a4036', feature: '#fbf2dc', coatShadow: '#7e7464', rimWidth: 4.2,
    ui: { ...UI, card: 'rgba(36,40,36,.92)', cardLine: 'rgba(230,200,140,.3)', text: '#e8d8b0', sub: '#a89878', accent: '#e8603a', gold: '#e8b83a', blueprint: '#8ac0b0', bpBg: '#1a2420', good: '#9ac06a' },
    grade: { contrast: 0.92, sat: 0.74, lift: [0.07, 0.06, 0.04], gamma: [1.05, 1.03, 0.96], gain: [1.05, 1.0, 0.88], vignette: 0.44, grain: 0.085, bloom: 0.35 },
    moods: {
      dusk:   { sky: ['#2a4a48', '#5a8a80', '#e0a050', '#f2d8a0'], key: '#f2c880', rim: '#f2c070', wall: '#4a4038', floor: '#3a322c', dark: '#221c18', practical: '#f2d090', fog: '#a89070' },
      night:  { sky: ['#14201e', '#24403c', '#3a5a54'], rim: '#e8c070', practical: '#e8603a' },
      golden: { sky: ['#4a7a70', '#e0a050', '#f6dca8'], rim: '#f6c87a' },
    },
  },
};

export const STYLE_IDS = Object.keys(STYLES);
