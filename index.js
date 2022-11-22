const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt  = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wgk9s.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req,res,next){
// console.log('token inside',req.header.authorization);

const authHeader = req.header.authorization

if(!authHeader){
  return res.send(401).send('unauthorized access');
}
const token = authHeader.split('')[1];
jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
  if(err){
    return res.status(403).send({message: 'forbidden access'})
  }
  req.decoded = decoded
})

}


async function run (){

try {

  const appointmentOptionsCollection = client.db('doctors_portal').collection('appointmentOptions');

const bookingsCollection  = client.db('doctors_portal').collection('bookings');

const usersCollection  = client.db('doctors_portal').collection('users');

const doctorsCollection  = client.db('doctors_portal').collection('doctors');

  //get appointment
  
  app.get('/appointmentOptions',async(req,res)=>{
    const date = req.query.date;
    // console.log(date);
    const query = {};
    const options = await appointmentOptionsCollection.find(query).toArray();

    // get the bookings of the provided date

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


app.get('/appointmentSpecialty',async(req,res)=>{
  const query = {}
  const result = await appointmentOptionsCollection.find(query).project({name:1}).toArray();
  res.send(result);

})


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

app.get('/bookings',verifyJWT, async(req,res)=>{
  const email = req.query.email;
  const decodedEmail =req.decoded.email;

if(email!== decodedEmail){
  return res.status(403).res.send({message:'forbidden access'})
}

  const query = {email:email};
  const bookings = await bookingsCollection.find(query).toArray();
  res.send( bookings);
})


//users

app.post('/users',async(req,res)=>{
const user = req.body;
const result = await usersCollection.insertOne(user);
res.send(result);
});


 app.get ('/users',async(req,res)=>{
const query = {};
const users = await usersCollection.find(query).toArray();
res.send(users);
 })

app.get('/users/admin/:email',async(req,res)=>{
  const email = req.params.email;
  const query = {email};
  const user = await usersCollection.findOne(query);
  res.send({isAdmin: user?.role === 'admin'})
});



app.put('/users/admin/:id',verifyJWT, async(req,res)=>{
 const decodedEmail = req.decodedEmail.emai;
 const query = { email: decodedEmail};

 const user = await usersCollection.findOne(query);

 if(user?.role !== 'admin'){
  return res.status(403).send({message: 'forbidden access'})
 }
  const id = req.params.id;
 const filter = {_id:ObjectId(id)}
 const options = {upsert: true};
 const updatedDoc = {
  $set: {
    role: 'admin'
  }
 }
 const result = await usersCollection.updateOne(filter,updatedDoc,options);
 res.send(result);
})



app.get('/jwt',async(req,res)=>{
  const email = req.query.email;
  const query = {email:email};
  const user = await usersCollection.findOne(query);

  if(user){
const token = jwt.sign({email},process.env.ACCESS_TOKEN, {expiresIn: '1h'})
return res.send({accessToken: token})
  }
 res.status(403).send({accessToken: ''})

});

//add doctors

app.post('/doctors',async(req,res)=>{
  const doctor = req.body;
  const result = await doctorsCollection.insertOne(doctor);
  res.send(result);
})

app.get('/doctors',async(req,res)=>{
  const query = {}
  const doctors = await doctorsCollection.find(query).toArray();
  res.send(doctors);
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