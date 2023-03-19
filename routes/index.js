import express from 'express'
import generalRouter from '../apiServices/general/route.js'


const router = express.Router()


router.get("/", generalRouter)


export default router