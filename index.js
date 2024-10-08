const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://fabrico-d5192.web.app",
        "https://fabrico-d5192.firebaseapp.com"
    ]
}));




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nfgpaoq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();
        // Send a ping to confirm a successful connection

        const productCollection = client.db("fabricoDB").collection("products");

        app.get('/products', async (req, res) => {

            // Retrieve query parameters from req.query
            const { category, brand, minPrice, maxPrice, search, sort, currentPage, productPerPage } = req.query;
            const filter = {
                search: search
            }
            // console.log(currentPage);
            // console.log(productPerPage);

            // Convert query strings back to arrays and integers
            const categoryArray = category ? category.split(',') : [];
            const brandArray = brand ? brand.split(',') : [];
            const min = parseInt(minPrice, 10);
            const max = parseInt(maxPrice, 10);
            const page = parseInt(currentPage);
            const size = parseInt(productPerPage);

            // Construct the query object
            const query = {};

            if (categoryArray.length > 0) {
                query.category = { $in: categoryArray };
            }
            if (brandArray.length > 0) {
                query.brand = { $in: brandArray };
            }
            if (!isNaN(min) && !isNaN(max)) {
                query.price = { $gte: min, $lte: max };
            }

            let sortOption = {};

            if (sort === 'lo2hi') {
                sortOption = { price: 1 };
            }
            else if (sort === 'hi2lo') {
                sortOption = { price: -1 };
            }
            if (sort === 'newest') {
                sortOption = { date: -1 };
            }

            else if (sort === 'oldest') {
                sortOption = { date: 1 };
            }

            const searchQuery = {
                name: { $regex: filter.search, $options: 'i' }
            };

            const combinedQuery = {
                $and: [
                    query,
                    searchQuery,
                ]
            };
            // console.log('after: ', query);

            const result = await productCollection.find(combinedQuery).skip(page * size).limit(size).sort(sortOption).toArray();
            res.send(result);
        })

        app.get('/productCount', async (req, res) => {
            const count = await productCollection.estimatedDocumentCount();
            res.send({ count });
        })


        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('fabrico is running');
})
app.listen(port, () => {
    console.log(`fabrico is running on port ${port}`);
})