// One palette for the reveal and the PDF. These values mirror the :root custom
// properties in reveal/index.html; design_tokens.test.js guards against drift.
export const TOKENS = {
  paper: '#f7f3ed',
  paperDim: '#efeae0',
  ink: '#22211f',
  inkSoft: '#4d4c4a',
  inkFaint: '#918f8c',
  rule: '#dcd5c7',
  dark: '#1c1b18',
  darkSoft: '#bdbab5',
  darkFaint: '#8a8782'
};

export const TOKENS_DARK = {
  bg: '#0b0805',
  paper: '#f7f3ed',
  ink: '#f3ead9',
  inkSoft: 'rgba(243,234,217,0.74)',
  inkFaint: 'rgba(243,234,217,0.42)',
  rule: 'rgba(243,234,217,0.18)',
  dark: '#1c1b18',
  darkSoft: '#bdbab5',
  darkFaint: '#8a8782'
};
