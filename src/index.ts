#!/usr/bin/env node

import { Command } from "commander";
import { handleCommand } from "./cli/handleCommand.js";
import { runLogin } from "./cli/login.js";
import { runCliTest } from "./cli/test.js";

const program = new Command();

program
  .name("kyte")
  .usage('[command] or "<task>"')
  .argument("[task]", "Task to run")
  .action(async (task?: string) => {
    if (!task) {
      program.help();
      return;
    }
    await handleCommand(task);
  });

program
  .command("login")
  .description("Login and link CLI with web")
  .action(async () => {
    await runLogin();
  });

program
  .command("test")
  .description("Run CLI demo test output")
  .action(async () => {
    await runCliTest();
  });

await program.parseAsync(process.argv);
