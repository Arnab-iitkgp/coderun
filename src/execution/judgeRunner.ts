import { executeCpp } from "./cppExecutor.js";
import { loadTestCases } from "./loadTestCases.js";
import { compareOutput } from "./compareOutput.js";
import type { Verdict } from "../types/verdict.js";

export  async function runJudge(
    submisionId:number,
    problemId:string,
    code:string
): Promise<Verdict> {

    const testcases = await loadTestCases(problemId);
    
    for(const testcase of testcases){
        const result = await executeCpp(
            submisionId,
            code,
            testcase.input
        )
        // stop execution on first failure.
        if(!result.success){

            if(result.timeout){
                return "Time Limit Exceeded";
            }

            if(result.error?.includes("error")){
                return "Compile Error";
            }

            return "Runtime Error"
        }
        const correct = compareOutput(testcase.expectedOutput,result.output ?? "")
        if(!correct){
            return "Wrong Answer";
        }
    }
      return "Accepted";
}
