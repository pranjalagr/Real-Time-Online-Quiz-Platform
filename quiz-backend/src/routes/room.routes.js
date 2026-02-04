import express from 'express';
import {createroomcontroller,joinroomcontroller,startquizcontroller,leaveroomcontroller, restartroomcontroller,submitanswercontroller} from '../controllers/room.controllers.js'
import {authMiddleware} from '../middlewares/auth.middlewares.js'
const router=express.Router();
router.post('/',authMiddleware,createroomcontroller);
router.post('/join',authMiddleware,joinroomcontroller);
router.post('/:roomid/start',authMiddleware,startquizcontroller);
router.post('/:roomid/leave',authMiddleware,leaveroomcontroller);
router.post('/:roomid/restart',authMiddleware,restartroomcontroller);
router.post('/:roomid/:quizid/:questionid/submit',authMiddleware,submitanswercontroller);
export default router;