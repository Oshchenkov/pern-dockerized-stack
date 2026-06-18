const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Force the Rust engine to resolve symlinks in monorepos
      optimize: true,
    },
  },
};

export default config;
