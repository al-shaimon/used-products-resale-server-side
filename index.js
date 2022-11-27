const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// const jwt = require('jsonwebtoken');
require('dotenv').config();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zeydczn.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const userCollection = client.db('simpleNode').collection('products');

    app.get('/products', async (req, res) => {
      const cursor = userCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
  } finally {
  }
}
run().catch(console.log);

app.get('/', async (req, res) => {
  res.send('Diamond Tech server is running');
});

app.listen(port, () => console.log(`Diamond Tech Resale portal running on ${port}`));
