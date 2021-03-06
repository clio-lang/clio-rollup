import alias from "@rollup/plugin-alias";
import { getBabelOutputPlugin as babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import livereload from "rollup-plugin-livereload";
import nodePolyfills from "rollup-plugin-polyfill-node";
import resolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";

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

const getPlugins = () => [
  sourcemaps(),
  alias({
    entries: [
      {
        find: "./shim/main.clio.js",
        replacement: "./main.clio.js",
      },
      {
        find: "./shim/worker.clio.js",
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
      {
        find: "net",
        replacement: "clio-rollup/shim/empty.js",
      },
      {
        find: "url",
        replacement: "clio-rollup/shim/empty.js",
      },
      {
        find: "child_process",
        replacement: "clio-rollup/shim/empty.js",
      },
      {
        find: "ws",
        replacement: "clio-rollup/shim/ws.js",
      },
    ],
  }),
  json(),
  commonjs(),
  nodePolyfills({ include: null }),
  resolve({
    browser: true,
  }),
  babel({ presets: [["@babel/preset-env", { modules: "umd" }]] }),
  // In dev mode, call `npm run start` once
  // the bundle has been generated
  !production && serve(),

  // Watch the `public` directory and refresh the
  // browser on changes when not in production
  !production && livereload("public"),

  // If we're building for production (npm run build
  // instead of npm run dev), minify
  production && terser(),
];

export default [
  {
    input: ".clio/index.js",
    output: {
      sourcemap: true,
      format: "esm",
      name: "app",
      dir: "public/build",
    },
    plugins: getPlugins(),
    watch: {
      clearScreen: false,
    },
  },
  {
    input: "node_modules/clio-run/src/workers/ww.js",
    output: {
      sourcemap: true,
      format: "esm",
      name: "app",
      dir: "public/build",
    },
    plugins: getPlugins(),
    watch: {
      clearScreen: false,
    },
  },
];
