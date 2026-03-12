import { fetchSubmission,submitCode } from "../services/submissionService";
import type { Request,Response } from "express"; // types are imported like this.

// we use try catch in controller logic, not in services or repositories
export async function submitHandller( req:Request, res:Response) {
    try {
        const {problemId,language,code}= req.body;
        const submission = await submitCode({problemId, code, language})
        return res.json(submission)
    } catch (error) {
        res.status(500).json({
            error:"Submission failed"
        })
    }
}

export async function getSubmissionHandller(req:Request, res:Response){
    try {
        const id = Number(req.params.id); // params return string.
        const submission = await fetchSubmission(id);
        if(!submission){
            return res.status(404).json({
                error:"Submission not found "
            })
        }
      return res.status(200).json(submission)
    } catch (error) {
        res.status(500).json({
            error: "Failed to Fetch the submission"
        })
    }
}