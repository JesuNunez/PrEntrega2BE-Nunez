const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const handlebars = require('express-handlebars');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const productsRouter = require('./routes/products.router')(io);
const cartsRouter = require('./routes/cart.router')(io);

app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.get('/', (req, res) => {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes/products.json'), 'utf-8'));
    res.render('home', { products });
});

app.get('/realtimeproducts', (req, res) => {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes/products.json'), 'utf-8'));
    res.render('realTimeProducts', { products });
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('createProduct', (newProduct) => {
        const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes/products.json'), 'utf-8'));
        products.push(newProduct);
        fs.writeFileSync(path.join(__dirname, 'routes/products.json'), JSON.stringify(products, null, 2));
        io.emit('updateProducts', products);
    });

    socket.on('deleteProduct', (productId) => {
        let products = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes/products.json'), 'utf-8'));
        products = products.filter(product => product.id !== productId);
        fs.writeFileSync(path.join(__dirname, 'routes/products.json'), JSON.stringify(products, null, 2));
        io.emit('updateProducts', products);
    });
});

const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
