import '@testing-library/jest-dom'

// Robust Mock for Framer Motion
jest.mock('framer-motion', () => {
  const React = require('react');

  // List of common motion components to mock
  const tags = ['div', 'span', 'aside', 'nav', 'button', 'section', 'header', 'footer', 'main', 'p', 'h1', 'h2', 'h3', 'a', 'ul', 'li'];

  const motion = tags.reduce((acc, tag) => {
    // eslint-disable-next-line react/display-name
    acc[tag] = React.forwardRef(({ 
      children, 
      layoutId, 
      initial, 
      animate, 
      exit, 
      transition, 
      variants, 
      whileHover, 
      whileTap, 
      layout, 
      viewport,
      onAnimationStart,
      onAnimationComplete,
      onUpdate,
      ...props 
    }, ref) => {
      // We explicitly exclude framer-motion specific props from being passed to the DOM
      return React.createElement(tag, { ...props, ref }, children);
    });
    return acc;
  }, {});

  return {
    motion,
    AnimatePresence: ({ children }) => <>{children}</>,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    useInView: () => [jest.fn(), false],
    useScroll: () => ({ scrollY: 0, scrollYProgress: 0 }),
    useTransform: (v) => v,
    useSpring: (v) => v,
  };
});

// Mock scrollIntoView as it's not implemented in JSDOM
Element.prototype.scrollIntoView = jest.fn()
// Mock socketClient singleton to avoid connection warnings in components
jest.mock('@/lib/socket/socket-client', () => ({
  socketClient: {
    on: jest.fn(),
    off: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(() => true),
    getRawSocket: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connected: true,
    })),
  }
}));
