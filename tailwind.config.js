module.exports = {
  content: ['./index.html', './casos/*.html', './assets/app.js'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      colors: { brand: { DEFAULT: '#cc0000', dark: '#a80000' } }
    }
  }
};
