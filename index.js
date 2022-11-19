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

  const appointmentOptionsCollection = client.db('doctors_portal').collection('appointmentOptions');

const bookingsCollection  = client.db('doctors_portal').collection('bookings');

  //get appointment
  
  app.get('/appointmentOptions',async(req,res)=>{
    const date = req.query.date;
    // console.log(date);
    const query = {};
    const options = await appointmentOptionsCollection.find(query).toArray();

    // // get the bookings of the provided date

    const bookingQuery = {appointment:date}
    const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

        // code carefully :D

options.forEach(option =>{
  const optionBooked = alreadyBooked.filter(book=> book.treatment === option.name);

  const bookedSlots = optionBooked.map(book => book.slot);const reamingSlots = option.slots.filter(slot =>!bookedSlots.includes(slot))
  option.slots = reamingSlots;
});

res.send(options);
    // const cursor = appointmentCollection.find(query);
    // const appointments = await cursor.toArray();

  });


app.get('/v2/appointmentOptions',async(req,res)=>{

const date = req.query.date;
const options = await appointmentOptionsCollection.aggregate([
  {
      $lookup: {
          from: 'bookings',
          localField: 'name',
          foreignField: 'treatment',
          pipeline: [
              {
                  $match: {
                      $expr: {
                          $eq: ['$appointmentDate', date]
                      }
                  }
              }
          ],
          as: 'booked'
      }
  },
  {
      $project: {
          name: 1,
          slots: 1,
          booked: {
              $map: {
                  input: '$booked',
                  as: 'book',
                  in: '$$book.slot'
              }
          }
      }
  },
  {
      $project: {
          name: 1,
          slots: {
              $setDifference: ['$slots', '$booked']
          }
      }
  }
]).toArray();
res.send(options);
})

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
 const query = {
  appointmentDate:booking.treatment,
  email:booking.email,
  treatment:booking.treatment
 }

 const alreadyBooked = await bookingsCollection.find(query).toArray();
 if(alreadyBooked.length){
  const message = `You already have a booking on ${booking.appointmentDate}`
  return res.send({acknowledge:false,message})
 }
 const result = await bookingsCollection.insertOne(booking);
 res.send(result);

});


//get booking

app.get('/bookings',async(req,res)=>{
  const email = req.query.email;
  const query = {email:email};
  const bookings = await bookingsCollection.find(query).toArray();
  res.send( bookings);
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