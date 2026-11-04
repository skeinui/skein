#!/usr/bin/env node
// `npx skeinui <command>` is `skein <command>` from @skeinui/cli
import { run } from "@skeinui/cli";

const args = process.argv.slice(2);
// Someone who installed skeinui for the components: say where they are before the help
if (args.length === 0 || ["help", "-h", "--help"].includes(args[0]))
  console.log("Components: npm install @skeinui/ui @skeinui/themes\n");
await run(args);
