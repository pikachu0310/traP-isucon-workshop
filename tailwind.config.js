module.exports = {
  darkMode: 'class',
  content: [
    './docs/.vitepress/**/*.js',
    './docs/.vitepress/**/*.vue',
    './docs/.vitepress/**/*.ts',
  ],
  options: {
    safelist: ['html', 'body'],
  },
  theme: {
    extend: {
      colors: {
        'primary-100': '#b4e7ff',
        'primary-200': '#81d8ff',
        'primary-300': '#4ac9ff',
        'primary-400': '#19bcff',
        'primary-500': '#00b0ff',
        'primary-600': '#00a1f7',
        'primary-700': '#008ee2',
        'primary-800': '#007dce',
        'primary-900': '#005BAC',
        'light-accent-primary': '#005bac',
        'light-accent-notification': '#f2994a',
        'light-accent-online': '#28f0e4',
        'light-accent-error': '#f26451',
        'light-accent-focus': '#005bacc0',
        'light-back-primary': '#ffffff',
        'light-back-secondary': '#f0f2f5',
        'light-back-tertiary': '#e2e5e9',
        'light-ui-primary': '#49535b',
        'light-ui-secondary': '#6b7d8a',
        'light-ui-tertiary': '#ced6db',
        'light-text-primary': '#333333',
        'light-text-secondary': '#79797a',
        'dark-accent-primary': '#4899f9',
        'dark-accent-notification': '#f2994a',
        'dark-accent-online': '#28f0e4',
        'dark-accent-error': '#f26451',
        'dark-accent-focus': '#4899f9c0',
        'dark-back-primary': '#242b33',
        'dark-back-secondary': '#1e262e',
        'dark-back-tertiary': '#1a242d',
        'dark-ui-primary': '#f2f5f8',
        'dark-ui-secondary': '#c7d0d9',
        'dark-ui-tertiary': '#8795a3',
        'dark-text-primary': '#ffffff',
        'dark-text-secondary': '#bac2c9'

      }
    }
  }
}
