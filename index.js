const express = require('express');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;


// middleware
app.use(cors());

app.get("/",(req,res)=>{
    res.send("Hi api ready");
})


// listen the server
app.listen(port,()=>{
    console.log(`localhost runing on ${port}`)
})