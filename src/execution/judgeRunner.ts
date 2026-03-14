import { executeCpp } from "./cppExecutor.js";
import { loadTestCases } from "./loadTestCases.js";
import { compareOutput } from "./compareOutput.js";
import type { Verdict } from "../types/verdict.js";

export  async function runJudge(
    submisionId:number,
    problemId:string,
    code:string
): Promise<{ verdict: Verdict; time: number }> {

    const testcases = await loadTestCases(problemId);
    const inputs = testcases.map(t=>t.input);
    let output:string;
    let execTime:number=0;
    try {
        const result = await executeCpp(submisionId,code,inputs);
         output = result.output ?? "";
         execTime = result.time ?? 0;;
        if(result.timeout){
            return {verdict:"Time Limit Exceeded",time:execTime}
        }
        if(!result.success){
            return {verdict: result.error === "Compile Error" ? "Compile Error" : "Runtime Error", time:0}
        }
    } catch (error) {
         if (error === "Compile Error") {
      return {verdict:"Compile Error",time:0};
    }

    return {verdict:"Runtime Error",time:0};
    }
    const results = output
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0);
    console.log("RAW OUTPUT FROM CONTAINER:");
    console.log(output);
    for(let i=0;i<testcases.length;i++){
        const expected:any= testcases[i]?.expectedOutput;
        const actual = results[i]?.trim() ?? "";
        console.log("Expected:", expected);
        console.log("Actual:", actual);
        const correct = compareOutput(expected,actual)
        if(!correct){
            return {verdict:"Wrong Answer",time:execTime}
        }
    }
      return {verdict:"Accepted",time:execTime};
}
