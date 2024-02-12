async function homeHandler(req, res){
    //console.log('hello');
    return res.render('home');
}

module.exports={
    homeHandler,
}