const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wgk9s.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run (){
try{
  const appointmentCollection = client.db('doctors_portal').collection('appointmentOptions');

  //get appointment
  // app.get('/appointment', async (req, res) => {
  //   const query = {}
  //   const cursor = appointmentCollection.find(query);
  //   const appointments = await cursor.toArray();
  //   res.send(appointments);
  // });
  
  app.get('/appointment',async(req,res)=>{
    const query = {};
    const cursor = appointmentCollection.find(query);
    const appointments = await cursor.toArray();
    res.send(appointments);
  })

}

 finally{

  }
}

run().catch(err => console.err(err));

app.get('/', (req, res) => {
  res.send('Hello from doctors portal')
})

app.listen(port, () => {
  console.log(` Doctors portal listening on port ${port}`)
})