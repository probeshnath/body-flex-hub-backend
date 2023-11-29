const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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

    // jwt 
    app.post('/jwt', async(req,res) =>{
      const user = req.body;
      // console.log("tokken",user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, {expiresIn: "1hr"})
      // console.log("ttt",token)
      res.send({token})
    })


    // all database collection
    const userDB = client.db("bodyFlex-hub").collection("users");
    const newletterDB = client.db("bodyFlex-hub").collection("newsletters");
    const forumsDB = client.db("bodyFlex-hub").collection("forums");
    const classesDB = client.db("bodyFlex-hub").collection("classes");
    const cartClasseDB = client.db("bodyFlex-hub").collection("cartClass");
    const classPayment = client.db("bodyFlex-hub").collection("classPayment");


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

    // get user by email
    app.get('/users/:email',async(req,res) =>{
      const email = req.params.email;
      // console.log(email)
      const query = {email: email}
      const result = await userDB.findOne(query);
      res.send(result)
    })

    // fetch all trainer
    app.get("/trainers", async (req, res) => {
      const query = { role: "trainer" }
      const trainers = await userDB.find(query).toArray();
      res.send(trainers);
    })

    // get single trainer
    app.get("/trainers/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      // const query = { role: "trainer" }
      const trainer = await userDB.findOne(filter)
      // const trainer = await trainers.filter(train => train._id === filter) 
      res.send(trainer);
    })

    // be beTrainer
    app.patch("/beTrainer/:email", async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      // console.log("email",email)
      // console.log("data",data)
      const filter = { email: email }
      const updatedData = {
        $set: {
          age: data.age,
          available_day: parseInt(data.available_day),
          available_week: parseInt(data.available_week),
          skills: data.skills,
          role: "applied",
          img: data.img,
          slots: data.slots
        }
      }
      const result = await userDB.updateOne(filter, updatedData)
      res.send(result)
    })

    // appliedTrainers
    app.get("/appliedTrainers", async (req, res) => {
      const query = { role: "applied" }
      const result = await userDB.find(query).toArray()
      res.send(result)
    })

    // add trainer to normal user
    app.put("/addTrainer/:email", async (req, res) => {
      const userEmail = req.params.email;
      // console.log(user)
      const filter = { email: userEmail }
      const updatedData = {
        $set: {
          role: "trainer"
        }
      }
      const result = await userDB.updateOne(filter, updatedData)
      res.send(result)
    })



    // newseltters user subscription save
    app.post("/newsletters", async (req, res) => {
      const subscribe = req.body;
      // console.log(subscribe)
      // save
      const result = await newletterDB.insertOne(subscribe);
      res.send(result)
    })

    // get api user subcriptinon
    app.get("/newsletters", async (req, res) => {
      const result = await newletterDB.find().toArray();
      res.send(result)
    })
    // subscriber delete 
    app.delete("/newsletters/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await newletterDB.deleteOne(query)
      res.send(result)
    })

    // forums / post 
    app.post('/forums', async(req,res) =>{
      const post = req.body;
      const result = await forumsDB.insertOne(post);
      res.send(result)
    })

    // get all forum
    app.get("/forums",async(req,res) =>{
      const result = await forumsDB.find().toArray();
      res.send(result)
    })

    // handle like for forum post
    app.patch("/updateFourm/:id", async(req,res)=>{
      const id = req.params.id;
      const post = req.body;
      const query = {_id : new ObjectId(id)}
      // console.log(post)
      const updateData = {
        $set :{
          like : post?.like,
          disLike: post?.disLike
        }
      }
      const result = await forumsDB.updateOne(query,updateData)
      res.send(result)
    })


    // all classes
    app.post("/classes", async(req,res) =>{
      const newClass = req.body;
      const result = await classesDB.insertOne(newClass);
      res.send(result)
    })

    // get all class
    app.get("/classes", async(req,res) =>{
      const result = await classesDB.find().toArray();
      res.send(result)
    })

    // get single class data
    app.get("/classes/:id",async(req,res) =>{
      const id = req.params.id;
      // console.log(id)
      const query = {_id : new ObjectId(id)}
      const data = await classesDB.findOne(query)
      // console.log(data)
      const email = data?.trainer;
      // console.log(email)
      const userEmail = {email: email}

      const trainerInfo = await userDB.findOne(userEmail);
      // console.log(trainerInfo)
      const classInfo = {
        data,
        trainerInfo
      }
      res.send(classInfo)
    })



    // gallery picture
    const galleryDB = client.db("bodyFlex-hub").collection("gallerys");
    app.get("/gallerys",async(req,res) =>{
      const result = await galleryDB.find().toArray();
      res.send(result)
    })



    // cartClass
    app.post("/cartClass",async(req,res) =>{
      const data = req.body;
      // console.log("my added data",data)
      const result = await cartClasseDB.insertOne(data);
      res.send(result)
    })
    // get the singlr class
    app.get("/cartClass/:id", async(req,res) =>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)}
      const result = await cartClasseDB.findOne(query);
      res.send(result);
    })
    // update status
      app.put("/cartClass/:id", async(req,res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id)}
      const body = req.body;
      const updateDoc = {
        $set: {
          status: body.status,
          update_price: body.price,
          classData: body.classData
        }
      }
      const result = await cartClasseDB.updateOne(query,updateDoc);
      res.send(result);
    })






    // payment intent
    app.post("/create-payment-intent",async(req,res) =>{
      const {price} = req.body;
      const amount = parseInt(price * 100)
      console.log("amount",amount)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    // payment for clsaa
    app.post('/payments',async(req,res) =>{
      const payment = req.body;
      const paymentResult = await classPayment.insertOne(payment);

      // carefully delete each item from the cart
      const query = {_id: new ObjectId(payment.bookedId)}
      // console.log(" payment", payment)

      // this clss remove or delete from cart class
      const deleteCartCls = await cartClasseDB.deleteOne(query)

      res.send({paymentResult,deleteCartCls})

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