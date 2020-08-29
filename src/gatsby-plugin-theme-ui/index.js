import chronoblogTheme from 'gatsby-theme-chronoblog/src/gatsby-plugin-theme-ui';

const buttonHover = {
  '&:hover': {
    opacity: 0.8,
    cursor: 'pointer',
    boxShadow: (theme) => `inset 0 0 0 1px ${theme.colors.secondary}`
  }
};

export default {
  ...chronoblogTheme,
  initialColorMode: 'dark',
  colors: {
    ...chronoblogTheme.color,
    text: '#2e3440',
    background: '#eceff4',
    link: '#bf616a',
    primary: '#a3be8c',
    secondary: '#b48ead',
    muted: '#d8dee9',
    modes: {
      ...chronoblogTheme.colors.modes,
      dark: {
        ...chronoblogTheme.colors.modes.dark,
        text: '#e5e9f0',
        background: '#2e3440',
        link: '#81a1c1',
        muted: '#3b4252'
      }
    }
  },
  fontSizes: [13, 15, 16, 17, 22, 24, 28, 32],
  borderRadius: {
    ...chronoblogTheme.borderRadius,
    card: 3,
    button: 3,
    search: 3,
    code: 3,
    img: 3,
    authorBanner: 3
  },
  borderWidth: {
    ...chronoblogTheme.borderWidth,
    card: 1,
    search: 1
  },
  buttons: {
    ...chronoblogTheme.buttons,
    primary: {
      ...chronoblogTheme.buttons.primary,
      ...buttonHover
    },
    active: {
      ...chronoblogTheme.buttons.active,
      ...buttonHover
    },
    special: {
      ...chronoblogTheme.buttons.special,
      ...buttonHover
    }
  },
  fonts: {
    ...chronoblogTheme.fonts,
    body:
      'Source Code Pro, -apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif',
    heading: 'inherit',
    monospace: 'Menlo, monospace'
  }
};
