import { Router } from "express";
import { submitHandller, getSubmissionHandller } from "../controllers/submissionController";
const router = Router();

router.post('/submit',submitHandller);
router.get('/submission/:id',getSubmissionHandller);

export default router;