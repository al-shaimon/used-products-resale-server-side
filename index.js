const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('unauthorized access');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const userCollection = client.db('simpleNode').collection('products');
    const bookingsCollection = client.db('simpleNode').collection('bookingsCollection');
    const usersCollection = client.db('simpleNode').collection('usersCollection');
    const productsCollection = client.db('simpleNode').collection('productsCollection');

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    };

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

    app.post('/create-payment-intent', async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        payment_method_types: ['card'],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'admin' });
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.put('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: 'admin',
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    app.post('/products', async (req, res) => {
      const doctor = req.body;
      const result = await productsCollection.insertOne(doctor);
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
