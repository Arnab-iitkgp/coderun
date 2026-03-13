import { runJudge } from "../execution/judgeRunner";
import { createSubmission,getSubmission,updateSubmission } from "../repositories/submissionRepository";
import { publishSubmissionJob } from "../queue/rabbitmq";
type CodeSubmission ={
    problemId :string,
    language:string,
    code:string
}
const submitCode = async (data: CodeSubmission)=>{
    const submission = await createSubmission(data);
    // const verdict = await runJudge(submission.id,data.problemId,data.code)
    // await updateSubmission(submission.id,{status:"finished",output:verdict}) // NO EXECUTION HERE AFTER CREATING MSG QUEUE

    await publishSubmissionJob({
         submissionId: submission.id,
        problemId: data.problemId,
        code: data.code,
        language: data.language
    })

    return {
        submisionId: submission.id,
        status:"queued"
    }
}

const fetchSubmission = async (id:number)=>{
    const submission = await getSubmission(id);
    return submission;
}

export {fetchSubmission, submitCode};