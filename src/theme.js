// =============================================================================
// THEME — swap the active palette here to restyle the whole game
// =============================================================================
//
// Available palettes:
//   'neonArcade'   — magenta / cyan / yellow (energetic, default)
//   'pastelMobile' — soft lavender / mint / peach (calm mobile-game look)
//   'electricNight'— deep blue / violet / ice blue (sleek night mode)
//
// Change ACTIVE_THEME to any key above — no other files need editing.

const THEME_PALETTES = {
  neonArcade: {
    name: 'Neon Arcade',
    bgCenter: '#1a1033',
    bgEdge: '#06020f',
    bgCss: '#06020f',
    panel: 0x221840,
    panelStroke: 0xff006e,
    track: 0x2a1f4d,
    trackGlow: 0x7b2ff7,
    zoneTop: '#00f5d4',
    zoneBottom: '#00bbf9',
    zoneShimmer: 0xffffff,
    indicator: 0xffffff,
    indicatorGlow: 0xffea00,
    accent: 0x00f5d4,
    accentDark: 0x00c4aa,
    secondary: 0xff006e,
    highlight: 0xffea00,
    danger: 0xff3366,
    text: '#ffffff',
    textMuted: '#c4b8e8',
    scoreGlow: '#00f5d4',
    flashHit: 0x00f5d4,
    flashMiss: 0xff3366,
    particle: 0xffea00,
    difficultyLow: 0x00f5d4,
    difficultyHigh: 0xff006e,
    buttonPrimary: 0x00f5d4,
    buttonPrimaryHover: 0x00c4aa,
    buttonPrimaryText: '#06020f',
    buttonSecondary: 0x3d2566,
    buttonSecondaryHover: 0x4e307a,
    buttonSecondaryText: '#ffffff',
  },

  pastelMobile: {
    name: 'Pastel Mobile',
    bgCenter: '#2d2640',
    bgEdge: '#1a1528',
    bgCss: '#1a1528',
    panel: 0x3d3555,
    panelStroke: 0xa8dadc,
    track: 0x4a4268,
    trackGlow: 0xcdb4db,
    zoneTop: '#a8dadc',
    zoneBottom: '#81b29a',
    zoneShimmer: 0xffffff,
    indicator: 0xffffff,
    indicatorGlow: 0xf4a261,
    accent: 0xa8dadc,
    accentDark: 0x81b9bb,
    secondary: 0xe9c46a,
    highlight: 0xf4a261,
    danger: 0xe76f51,
    text: '#ffffff',
    textMuted: '#d4cce8',
    scoreGlow: '#a8dadc',
    flashHit: 0xa8dadc,
    flashMiss: 0xe76f51,
    particle: 0xf4a261,
    difficultyLow: 0xa8dadc,
    difficultyHigh: 0xe76f51,
    buttonPrimary: 0xa8dadc,
    buttonPrimaryHover: 0x81b9bb,
    buttonPrimaryText: '#1a1528',
    buttonSecondary: 0x4a4268,
    buttonSecondaryHover: 0x5a5278,
    buttonSecondaryText: '#ffffff',
  },

  electricNight: {
    name: 'Electric Night',
    bgCenter: '#0f1b3d',
    bgEdge: '#050a18',
    bgCss: '#050a18',
    panel: 0x152248,
    panelStroke: 0x4cc9f0,
    track: 0x1a2d5a,
    trackGlow: 0x4361ee,
    zoneTop: '#4cc9f0',
    zoneBottom: '#4895ef',
    zoneShimmer: 0xffffff,
    indicator: 0xffffff,
    indicatorGlow: 0x7209b7,
    accent: 0x4cc9f0,
    accentDark: 0x3a9fc4,
    secondary: 0x7209b7,
    highlight: 0xb5179e,
    danger: 0xf72585,
    text: '#ffffff',
    textMuted: '#a8b8d8',
    scoreGlow: '#4cc9f0',
    flashHit: 0x4cc9f0,
    flashMiss: 0xf72585,
    particle: 0xb5179e,
    difficultyLow: 0x4cc9f0,
    difficultyHigh: 0xf72585,
    buttonPrimary: 0x4cc9f0,
    buttonPrimaryHover: 0x3a9fc4,
    buttonPrimaryText: '#050a18',
    buttonSecondary: 0x1a2d5a,
    buttonSecondaryHover: 0x243870,
    buttonSecondaryText: '#ffffff',
  },
};

const ACTIVE_THEME = 'neonArcade';

const Theme = {
  palette: THEME_PALETTES[ACTIVE_THEME],

  get colors() {
    return this.palette;
  },

  hexToNumber(hex) {
    return parseInt(hex.replace('#', ''), 16);
  },
};
