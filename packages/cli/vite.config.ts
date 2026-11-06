import { defineConfig } from "vite-plus";

export default defineConfig({
  // e2e installs generated projects from npm and drives them in Chrome: what it depends on isn't files the task
  // reads, so a cached result would replay an old one. Never cache it
  run: {
    tasks: {
      e2e: { command: "node tests/e2e/run.mjs", cache: false },
    },
  },
});
