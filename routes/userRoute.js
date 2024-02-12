const express=require('express');

const router= express.Router();

const {homeHandler}= require('../controllers/userController');

router.get('/',homeHandler);

module.exports=router;