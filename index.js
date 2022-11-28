const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
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
    const bookingsCollection = client.db('simpleNode').collection('bookingsCollection');
    const usersCollection = client.db('simpleNode').collection('usersCollection');

    app.get('/products', async (req, res) => {
      const cursor = userCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        model: booking.model,
        email: booking.email,
        price: booking.price,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have booked ${booking.model}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: '' });
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get('/', async (req, res) => {
  res.send('Diamond Tech server is running');
});

app.listen(port, () => console.log(`Diamond Tech Resale portal running on ${port}`));
