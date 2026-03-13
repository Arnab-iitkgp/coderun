import { runJudge } from "../execution/judgeRunner";
import { connectRabbitMQ, getChannel, QUEUE_NAME } from "../queue/rabbitmq";
import { updateSubmission } from "../repositories/submissionRepository";
import type { SubmissionJob } from "../types/job";

async function startWorker(){
    await connectRabbitMQ();
    const channel = getChannel();

    await channel.prefetch(1); //giving a worker 1 job at a time, VERY IMP

    console.log("Worker started. Waiting for jobs...");

    channel.consume(
        QUEUE_NAME,
        async (msg:any)=>{
            if(!msg)return;
            const job: SubmissionJob = JSON.parse(msg.content.toString())
            console.log("Processing Submission: ",job.submissionId )

            try {
                await updateSubmission(job.submissionId,{
                    status:"running"
                })
                const verdict = await runJudge(job.submissionId,job.problemId,job.code);

                await updateSubmission(job.submissionId,{
                    status:"finished",
                    output:verdict
                })
                channel.ack(msg);

            } catch (err) {
                console.error("Worker Error: ",err);
                channel.nack(msg,false,true); // false- don't reject multiple msg, true- requeue the msg.
            }
        },
        {noAck:false} // worker must manually ack msg
    );
}

startWorker();