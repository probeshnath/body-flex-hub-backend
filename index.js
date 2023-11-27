const express = require('express');
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_KEY;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection


    // all database collection
    const userDB = client.db("bodyFlex-hub").collection("users");
    const newletterDB = client.db("bodyFlex-hub").collection("newsletters");

    // create user
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user)
      const query = { email: user?.email }
      const isExistUser = await userDB.findOne(query)

      if (isExistUser) {
        return res.send({ message: "User Already Exist" })
      }
      const result = await userDB.insertOne(user)
      res.send(result)
    })

    // fetch all trainer
    app.get("/trainers", async(req,res) =>{
      const query = {role: "trainer"}
      const trainers = await userDB.find(query).toArray();
      res.send(trainers);
    })

    // be beTrainer
    app.patch("/beTrainer/:email", async(req,res) =>{
      const email = req.params.email;
      const data = req.body;
      // console.log("email",email)
      // console.log("data",data)
      const filter = {email : email}
      const updatedData = {
        $set:{
          age: data.age,
          available_day: parseInt(data.available_day),
          available_week: parseInt(data.available_week) ,
          skills: data.skills,
          role: "applied",
          img: data.img
        }
      }
      const result = await userDB.updateOne(filter, updatedData)
      res.send(result)
    })



    // newseltters user subscription save
    app.post("/newsletters",async(req,res) =>{
      const subscribe = req.body;
      // console.log(subscribe)
      // save
      const result = await newletterDB.insertOne(subscribe);
      res.send(result)
    })

    // get api user subcriptinon
    app.get("/newsletters", async(req,res)=>{
      const result = await newletterDB.find().toArray();
      res.send(result)
    })
    // subscriber delete 
    app.delete("/newsletters/:id", async(req,res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await newletterDB.deleteOne(query)
      res.send(result)
    })



    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
  res.send("Hi api ready");
})

// listen the server
app.listen(port, () => {
  console.log(`localhost runing on ${port}`)
})