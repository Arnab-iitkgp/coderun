// repositories are made to talk to database only.
import {prisma} from "../lib/prisma"
type CodeSubmission ={
    problemId :string,
    language:string,
    code:string
}
const createSubmission  = async (data:CodeSubmission) => {
    return prisma.submission.create({
        data:{
            ...data,
            status:"queued"
        }
    });
}
const updateSubmission  = async (
    id:number,
    data:{
     output?: string;
     error?: string;
    status :string
    }
)=>{
    return prisma.submission.update({
        where: {id},
        data
    })
}
const getSubmission = async (id:number)=>{
    return prisma.submission.findUnique({
        where:{id}
    })
}




export {createSubmission,getSubmission,updateSubmission};