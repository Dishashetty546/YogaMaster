const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error(
    "Error: Missing DB_USER or DB_PASSWORD in environment variables."
  );
  process.exit(1);
}

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yogamaster.1kpssad.mongodb.net/?retryWrites=true&w=majority&appName=YogaMaster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("YogaMaster");
    const userCollection = database.collection("users");
    const classesCollection = database.collection("classes");
    const cartCollection = database.collection("cart");
    const paymentCollection = database.collection("payments");
    const enrolledCollection = database.collection("enrolled");
    const appliedCollection = database.collection("applied");

    // Routes
    app.get("/classes", async (req, res) => {
      const query = { status: "approved" }; // Fetch only approved classes
      try {
        const result = await classesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).send({ error: "Failed to fetch classes" });
      }
    });

    app.post("/new-class", async (req, res) => {
      try {
        const newClass = req.body;
        if (!newClass.name || !newClass.instructorEmail) {
          return res.status(400).send({ error: "Invalid class data" });
        }
        // Add a default status if not provided
        newClass.status = newClass.status || "pending";
        const result = await classesCollection.insertOne(newClass);
        res.send(result);
      } catch (error) {
        console.error("Error inserting new class:", error);
        res.status(500).send({ error: "Failed to insert new class" });
      }
    });

    // Get classes by instructor's email
    app.get("/classes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      try {
        const result = await classesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching classes by email:", error);
        res.status(500).send({ error: "Failed to fetch classes by email" });
      }
    });

    //manage classes
    app.get("/classes-manage", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    //update classes status
    app.patch("/change-status/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
          reason: reason,
        },
      };
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //get approved classes
    app.get("/approved-classed", async (req, res) => {
      const email = req.query.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    //get single class details
    app.get("/classes/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });
    //update class details

    app.put("/update-class/:id", async (req, res) => {
      const id = req.params.id;
      const updatedClass = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedClass.name,
          description: updatedClass.description,
          price: updatedClass.price,
          availableSeats: parseInt(updatedClass.availableSeats),
          videoLink: updatedClass.videoLink,
          status: "pending",
        },
      };
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

run().catch(console.dir);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    await client.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
  process.exit(0);
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`Example listening on port ${port}`);
});
