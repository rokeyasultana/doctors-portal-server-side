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

try {

  const appointmentCollection = client.db('doctors_portal').collection('appointmentOptions');

const bookingsCollection  = client.db('doctors_portal').collection('bookings');

  //get appointment
  
  app.get('/appointment',async(req,res)=>{
    const query = {};
    const cursor = appointmentCollection.find(query);
    const appointments = await cursor.toArray();
    res.send(appointments);
  });
  
  /****
   * API Naming Convention
   * bookings
   * app.get('/bookings')
   *  app.get('/bookings/:id')
   *  app.post('/bookings')
   *  app.patch('/bookings/:id')
   *  app.delete('/bookings/:id')
   */

app.post('/bookings',async(req,res)=> {
  
 const booking = req.body;
 console.log(booking);
 const result = await bookingsCollection.insertOne(booking);
 res.send(result);

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