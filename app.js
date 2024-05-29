require('dotenv/config');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');


app.use(cors());
app.options('*', cors())

//middleware  
app.use(bodyParser.json());
app.use(morgan('tiny'));   
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler);

//Routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

//Database
const start = async ()=>{  
    try {
         await mongoose.connect(process.env.CONNECTION_STRING, {  
            useNewUrlParser: true,
            useUnifiedTopology: true,   
        })
         app.listen(PORT, ()=>{
            console.log(`server is running localhost ${PORT}... and DB is connected` );
         })
    } catch (error) {
       console.log(error); 
    }
}
start();