const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const handlebars = require('express-handlebars');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Importar routers
const productsRouter = require('./routes/products.router')(io);
const cartsRouter = require('./routes/cart.router')(io);

// Configuración de Handlebars
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Ruta para la vista home
app.get('/', (req, res) => {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes/products.json'), 'utf-8'));
    res.render('home', { products });
});

// Ruta para la vista de productos en tiempo real
app.get('/realtimeproducts', (req, res) => {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes/products.json'), 'utf-8'));
    res.render('realTimeProducts', { products });
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('a user connected');

    // Escuchar eventos de creación y eliminación de productos
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

// Inicializar servidor
const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
