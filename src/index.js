import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const MODEL_PATH = path.resolve(__dirname, "../models/Phi-2.Q4_K_M.gguf");
const MODEL_PATH = path.resolve(
  __dirname,
  "../models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
);
const LLAMA_BIN = path.resolve(__dirname, "../bin/llama-cli");

console.clear();
console.log(
  chalk.cyanBright.bold(":brain:  Local IDE Assistant – powered by llama.cpp")
);
console.log(
  chalk.gray("Type ") + chalk.yellow.bold("exit") + chalk.gray(" to quit.\n")
);

while (true) {
  let userPrompt;
  try {
    ({ userPrompt } = await inquirer.prompt({
      type: "input",
      name: "userPrompt",
      role: "user",
      message: chalk.yellow(">"),
    }));
  } catch (err) {
    // Ctrl‑C or TTY closed → graceful exit
    if (err.message?.includes("ExitPromptError")) process.exit(0);
    throw err; // real error
  }

  if (userPrompt.trim().toLowerCase() === "exit") break;

  const spinner = ora("Thinking…").start();
  // command for Phi-2.Q4_K_M 
  //   const args = [
  //     "-m",
  //     MODEL_PATH,
  //     "--threads",
  //     "8",
  //     "--gpu-layers",
  //     "32",
  //     "--ctx-size",
  //     "512",
  //     "--temp",
  //     "0.7",
  //     "--n-predict",
  //     "512",
  //     "-p",
  //     userPrompt,
  //   ];

const args = [
  "-m",
  MODEL_PATH,
  "--threads",
  "8",
  "--gpu-layers",
  "16",
  "--ctx-size",
  "512",
  "--temp",
  "0.7",
  "--n-predict",
  "128", // faster generation
  "--batch-size",
  "256", // less memory load
  "--no-mmap", // try disabling mmap
  "-p",
  userPrompt,
];

  const llm = spawn(LLAMA_BIN, args);
  let out = "";

  llm.stdout.on("data", (d) => (out += d));
  // (stderr usually just logs progress; ignore or pipe if you like)

  // :key: await the child process
  await new Promise((res) => llm.on("close", res));
  spinner.stop();

  // drop echoed prompt
  const response = out
    .split("\n")
    .filter((l) => !l.toLowerCase().startsWith(userPrompt.toLowerCase()))
    .join("\n")
    .trim();

  console.log(chalk.greenBright("\n:scroll: " + response + "\n"));
}

console.log(chalk.gray(" Done."));