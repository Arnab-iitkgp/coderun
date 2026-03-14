import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"

export type ExecutionResult = {
  success: boolean;
  output?: string;
  error?: string;
  timeout?: boolean;
  time?: number;
}
const TIME_LIMIT = 2000;

async function createExecutionDir(submissionId: number) {
  const dir = path.join("temp", submissionId.toString());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
async function writeCodeFile(dir: string, code: string) {
  const filePath = path.join(dir, "main.cpp");
  await fs.writeFile(filePath, code);
  return filePath;
}
// this compilecode and runprogram function not required in docker environment so can be removed safely
async function compileCode(dir: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {

    const compile = spawn("g++", ["main.cpp", "-o", "program"], {
      cwd: dir
    });

    let error = "";

    compile.stderr.on("data", (data) => {
      error += data.toString();
    });

    compile.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: error
        });
      }
    });

  });
}

async function runProgram(
  dir: string,
  input: string
): Promise<ExecutionResult> {

  return new Promise((resolve) => {

    const run = spawn("./program", {
      cwd: dir
    });

    let output = "";
    let error = "";
    let finished = false;

    const timer = setTimeout(() => {

      if (!finished) {
        run.kill("SIGKILL");

        resolve({
          success: false,
          timeout: true,
          error: "Time Limit Exceeded"
        });
      }

    }, TIME_LIMIT);

    run.stdout.on("data", (data) => {
      output += data.toString();
    });

    run.stderr.on("data", (data) => {
      error += data.toString();
    });

    run.stdin.write(input);
    run.stdin.end();

    run.on("close", (code) => {

      if (finished) return;
      finished = true;

      clearTimeout(timer);

      if (code === 0) {
        resolve({
          success: true,
          output: output.trim()
        });
      } else {
        resolve({
          success: false,
          error
        });
      }

    });

  });
}

//TODO : Add memory limit exceeded check. use container resource limit docker.
async function cleanup(dir: string) {
  await fs.rm(dir, { recursive: true, force: true });
}
async function runDockerSandbox(
  dir: string,
  input: string
): Promise<ExecutionResult> {

  return new Promise((resolve) => {

    const docker = spawn("docker", [
      "run",
      "--rm",
      "--memory=256m",
      "--cpus=1",
      "--network",
      "none",
      "-v",
      `${process.cwd()}/${dir}:/app`,
      "codeforge-cpp-runner",
      "bash",
      "-c",
      `g++ main.cpp -o program && echo "${input}" | timeout 2 ./program`
    ]);

    let output = "";
    let error = "";

    docker.stdout.on("data", (data) => {
      output += data.toString();
    });

    docker.stderr.on("data", (data) => {
      error += data.toString();
    });

    docker.on("close", (code) => {

      if (code === 0) {
        resolve({
          success: true,
          output: output.trim()
        });
      } else {
        resolve({
          success: false,
          error
        });
      }

    });

  });
}

async function runDocker(dir: string): Promise<ExecutionResult> {

  return new Promise((resolve) => {

    const start = Date.now();

    const docker = spawn("docker", [
      "run",
      "--rm",
      "--memory=256m",
      "--cpus=1",
      "--network",
      "none",
      "-v",
      `${process.cwd()}/${dir}:/app`,
      "codeforge-cpp-runner",
      "bash",
      "/app/run.sh"
    ]);

    let output = "";
    let error = "";

    docker.stdout.on("data", (data) => {
      output += data.toString();
    });

    docker.stderr.on("data", (data) => {
      error += data.toString();
    });

    docker.on("close", (code) => {

      const end = Date.now();
      //TODO: COMPILE ERROR NOT WORKING RN, DO LATER
      if (output.includes("__COMPILE_ERROR__")) {
        resolve({
          success: false,
          error: "Compile Error"
        });
        return;
      }
      if (error.includes("__COMPILE_ERROR__")) {
        resolve({
          success: false,
          error: "Compile Error"
        });
        return;
      }

      if (output.includes("__TLE__")) {
        resolve({
          success: false,
          timeout: true,
          error: "Time Limit Exceeded"
        });
        return;
      }
      resolve({
        success: code === 0,
        output: output.trim(),
        error,
        time: end - start
      });

    });

  });

}
async function writeTestcases(dir: string, inputs: string[]) {
  for (const [i, input] of inputs.entries()) {
    const file = path.join(dir, `input${i + 1}.txt`);
    await fs.writeFile(file, input);
  }
}
export async function executeCpp(
  submissionId: number,
  code: string,
  inputs: string[]
) {

  const dir = await createExecutionDir(submissionId);

  try {

    await writeCodeFile(dir, code);

    // local environment
    // const compile = await compileCode(dir);  

    // if (!compile.success) {
    //   return compile;
    // }

    // const run = await runProgram(dir, input);

    // return run;

    // Docker enviorment
    // const result = await runDockerSandbox(dir, input);
    //optimisation

    await writeTestcases(dir, inputs);

    await writeRunnerScript(dir);

    const output = await runDocker(dir);

    return output;

  } finally {
    await cleanup(dir);
  }
}
async function writeRunnerScript(dir: string) {
  const script = `
#!/bin/bash

g++ main.cpp -o program
if [ $? -ne 0 ]; then
  echo "__COMPILE_ERROR__"
  exit 1
fi

for file in $(ls input*.txt | sort -V)
do
  timeout 2 ./program < "$file"

  if [ $? -eq 124 ]; then
    echo "__TLE__"
    exit 124
  fi

  echo ""
done
`;

  const pathFile = path.join(dir, "run.sh");

  await fs.writeFile(pathFile, script);
}