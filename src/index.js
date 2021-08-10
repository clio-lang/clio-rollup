import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import nodePolyfills from "rollup-plugin-polyfill-node";
import alias from "@rollup/plugin-alias";
import json from "@rollup/plugin-json";
import sourcemaps from "rollup-plugin-sourcemaps";
import { getBabelOutputPlugin as babel } from "@rollup/plugin-babel";

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"],
        {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default {
  input: [".clio/index.js", "node_modules/clio-run/src/workers/ww.js"],
  output: {
    sourcemap: true,
    format: "esm",
    name: "app",
    dir: "public/build",
  },
  plugins: [
    sourcemaps(),
    alias({
      entries: [
        {
          find: "main.clio.js",
          replacement: "./main.clio.js",
        },
        {
          find: "worker.clio.js",
          replacement: "clio-rollup/shim/worker.js",
        },
        {
          find: "async_hooks",
          replacement: "clio-rollup/shim/empty.js",
        },
        {
          find: "worker_threads",
          replacement: "clio-rollup/shim/empty.js",
        },
      ],
    }),
    json(),
    commonjs(),
    nodePolyfills({ include: null }),
    resolve({
      browser: true,
    }),
    babel({ presets: ["@babel/preset-env"] }),
    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
