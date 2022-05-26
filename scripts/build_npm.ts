#!/usr/bin/env -S deno run --allow-read --allow-write=./,/Users/qwtel/Library/Caches/deno --allow-net --allow-env=HOME,DENO_AUTH_TOKENS,DENO_DIR --allow-run=git,pnpm

import { basename } from "https://deno.land/std@0.133.0/path/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

import { 
  copyMdFiles, mkPackage,
} from 'https://gist.githubusercontent.com/qwtel/ecf0c3ba7069a127b3d144afc06952f5/raw/latest-version.ts'

await emptyDir("./npm");

const name = basename(Deno.cwd())

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {},
  test: false,
  typeCheck: false,
  declaration: true,
  package: await mkPackage(name),
  packageManager: 'pnpm',
  compilerOptions: {
    sourceMap: true,
    target: 'ES2019',
  },
  mappings: {
    "https://ghuc.cc/qwtel/kv-storage-interface/index.d.ts": {
      name: "kv-storage-interface",
      version: "latest",
    },
    "https://cdn.skypack.dev/idb-key-to-string?dts": {
      name: "idb-key-to-string",
      version: "latest",
    },
    "https://cdn.skypack.dev/@cloudflare/workers-types@3.11.0?dts": {
      name: "@cloudflare/workers-types",
      version: "^3.11.0",
    },
    "https://cdn.skypack.dev/typeson@7.0.2?dts": {
      name: "typeson",
      version: "^7.0.2",
    },
    "https://unpkg.com/typeson-registry@3.0.0/dist/index.js": {
      name: "typeson-registry",
      version: "^3.0.0",
    },
    "https://cdn.skypack.dev/msgpackr@1.5.5?dts": {
      name: "msgpackr",
      version: "^1.5.5",
    },
  },
});

// post build steps
await copyMdFiles()
