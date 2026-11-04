#!/usr/bin/env node
// `npm create skein [dir] -- [options]` is `skein create [dir] [options]` from @skeinui/cli
import { run } from "@skeinui/cli";

await run(["create", ...process.argv.slice(2)]);
