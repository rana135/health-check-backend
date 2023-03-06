const express = require('express')
const cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// middleware:-
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7j04p.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        const productCollection = client.db("db-health-check").collection("health-service");
        const doctorCollection = client.db("db-health-check").collection("doctor");
        const userCollection = client.db("db-health-check").collection("user");

        // get All product:-
        app.get('/product', async (req, res) => {
            const query = {}
            const cursor = productCollection.find(query)
            const result = await cursor.toArray()
            // const result = await productCollection.find().toArray()
            res.send(result)
        })
        // get All Doctor:-
        app.get('/doctors', async (req, res) => {
            const query = {}
            const cursor = doctorCollection.find(query)
            const result = await cursor.toArray()
            // const result = await productCollection.find().toArray()
            res.send(result)
        })
        // get single product:-
        app.get("/product/:serviceId", async (req, res) => {
            const id = req.params.serviceId
            const query = { _id: ObjectId(id) }
            const result = await productCollection.findOne(query)
            res.send(result)
        })
        // post Method:-
        app.post("/addProduct",verifyJWT, async (req, res) => {
            const query = req.body
            const result = await productCollection.insertOne(query)
            res.send(result)
        })
        // Delete Method:-
        app.delete("/productDelete/:id",verifyJWT, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(query)
            res.send(result)
        })
        // PUT method:-
        app.put('/editProduct/:id',verifyJWT, async (req, res) => {
            const id = req.params.id
            const data = req.body
            const query = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: data
            }
            const result = await productCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })
        // PUT method for user:-
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(query, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
            res.send({ result, token: token });
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('health check!')
})

app.listen(port, () => {
    console.log(`health check listening on port ${port}`)
})