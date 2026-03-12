import fs from "fs/promises"
import path from "path"

export type TestCase = {
    input: string;
    expectedOutput:string
}

export async function loadTestCases(problemId:string):Promise<TestCase []> {
    const problemDir = path.join("problems",problemId);

    const files = await fs.readdir(problemDir);

    const inputs = files.filter(f=>f.startsWith("input"));

    const testcases: TestCase[]=[];

    for(const inpFile of inputs){

        const idx = inpFile.replace("input","").replace(".txt","");

        const input = await fs.readFile(
            path.join(problemDir,`input${idx}.txt`),
            "utf8"
        );
        const output = await fs.readFile(
            path.join(problemDir,`output${idx}.txt`),
            "utf8"
        );
        testcases.push({
            input:input.trim(),
            expectedOutput:output.trim()
        })
    }

    return testcases;
}