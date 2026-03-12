import { runJudge } from "../execution/judgeRunner";
import { createSubmission,getSubmission,updateSubmission } from "../repositories/submissionRepository";
type CodeSubmission ={
    problemId :string,
    language:string,
    code:string
}
const submitCode = async (data: CodeSubmission)=>{
    const submission = await createSubmission(data);
    const verdict = await runJudge(submission.id,data.problemId,data.code)
    await updateSubmission(submission.id,{status:"finished",output:verdict})
    return {
        submisionId: submission.id,
        verdict
    }
}

const fetchSubmission = async (id:number)=>{
    const submission = await getSubmission(id);
    return submission;
}

export {fetchSubmission, submitCode};