import {spawn} from "child_process"
import fs from "fs/promises"
import path from "path"

export type ExecutionResult ={
    success:boolean;
    output?:string;
    error?:string;
    timeout?: boolean
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
export async function executeCpp(
  submissionId: number,
  code: string,
  input: string
): Promise<ExecutionResult> {

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
    const result = await runDockerSandbox(dir, input);

    return result;

  } finally {
    await cleanup(dir);
  }
}