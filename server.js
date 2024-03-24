const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Users = require("./Users");
const Orders = require("./Order");

const Products = require("./Products");

const stripe = require("stripe")(
  "sk_test_51OwaFvSAYmxyccwdBdfDYallI7s2HAsPjV27RoSbNWdfY3clIFQ1PeqFGmxt53dc5wlGXpwXBVSK517egfPfBrE300LVT85oLk"
);

const app = express();
const port = process.env.PORT || 8000;

// Middlewares
app.use(express.json());
app.use(cors());

//* Connection URL
const connection_url =
  "mongodb+srv://malikxae12:malik@clusteramazon.6fxjy2b.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAmazon";
mongoose.connect(connection_url);

// API

app.get("/", (req, res) => res.status(200).send("Home Page"));

// add product

app.post("/products/add", (req, res) => {
  const productDetail = req.body;

  console.log("Product Detail >>>>", productDetail);

  Products.create(productDetail)
    .then((product) => {
      res.status(200).send(product);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get("/products/get", (req, res) => {
  Products.find()
    .then((product) => {
      res.status(200).send(product);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

// API for PAYMENT

app.post("/payment/create", async (req, res) => {
  const total = req.body.amount;
  console.log("Payment Request recieved for this ruppess", total);

  const payment = await stripe.paymentIntents.create({
    amount: total * 100,
    currency: "inr",
  });

  res.status(201).send({
    clientSecret: payment.client_secret,
  });
});

//* api for sign up
// API for SIGNUP

app.post("/auth/signup", async (req, res) => {
  const { email, password, fullName } = req.body;

  const encrypt_password = await bcrypt.hash(password, 10);

  const userDetail = {
    email: email,
    password: encrypt_password,
    fullName: fullName,
  };

  const user_exist = await Users.findOne({ email: email });

  if (user_exist) {
    res.send({ message: "The Email is already in use !" });
  } else {
    Users.create(userDetail)
      .then(() => {
        res.send({ message: "User Created Succesfully" });
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
});

//* API for LOGIN

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const userDetail = await Users.findOne({ email: email });

  if (userDetail) {
    if (await bcrypt.compare(password, userDetail.password)) {
      res.send(userDetail);
    } else {
      res.send({ error: "invaild Password" });
    }
  } else {
    res.send({ error: "user is not exist" });
  }
});

//* api to add order details
app.post("/orders/add", async (req, res) => {
  const products = req.body.basket;
  const price = req.body.price;
  const email = req.body.email;
  const address = req.body.address;

  const orderDetail = {
    products: products,
    price: price,
    email: email,
    address: address,
  };
  // console.log("Order Detail >>>>", orderDetail);
  Orders.create(orderDetail)
    .then((response) => console.log("Order Detail>>", response))
    .catch((error) => console.log("Order Detail>>", error));
});

app.post("/orders/get", async (req, res) => {
  const email = req.body.email;
  Orders.find()
    .then((response) => {
      console.log(response);
      const userOrders = response.filter((order) => order.email === email);
      res.send(userOrders);
    })
    .catch((err) => console.log("Order Detail>>", err));
});
app.listen(port, () => console.log("listening on the port", port)); 
