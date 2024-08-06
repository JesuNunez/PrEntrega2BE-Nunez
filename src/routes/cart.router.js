const express = require('express');
const fs = require('fs');
const path = require('path');
const cartsFilePath = path.join(__dirname, 'cart.json');
const productsFilePath = path.join(__dirname, 'products.json');

const getCarts = () => JSON.parse(fs.readFileSync(cartsFilePath, 'utf-8'));
const saveCarts = (carts) => fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
const getProducts = () => JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));

module.exports = (io) => {
    const router = express.Router();

    router.post('/', (req, res) => {
        const carts = getCarts();
        const id = (carts.length ? Math.max(...carts.map(c => parseInt(c.id))) + 1 : 1).toString();
        const newCart = { id, products: [] };
        carts.push(newCart);
        saveCarts(carts);
        res.status(201).json(newCart);
    });

    router.get('/:cid', (req, res) => {
        const carts = getCarts();
        const cart = carts.find(c => c.id === req.params.cid);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.json(cart.products);
    });

    router.post('/:cid/product/:pid', (req, res) => {
        const carts = getCarts();
        const cartIndex = carts.findIndex(c => c.id === req.params.cid);
        if (cartIndex === -1) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        const products = getProducts();
        const product = products.find(p => p.id === req.params.pid);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const cart = carts[cartIndex];
        const productInCart = cart.products.find(p => p.id === req.params.pid);
        if (productInCart) {
            productInCart.quantity += 1;
        } else {
            cart.products.push({ id: req.params.pid, quantity: 1 });
        }
        saveCarts(carts);
        res.status(201).json(cart);
    });

    return router;
};
