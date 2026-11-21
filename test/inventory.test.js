const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('checkout accepts exactly the sellable stock and protects reservations', () => {
  const products = [{ id: 11, name: 'Chilli powder', stock: 4, reserved: 3 }];

  assert.equal(inventory.check(products, [{ id: 11, qty: 1 }]).ok, true);
  assert.equal(inventory.check(products, [{ id: 11, qty: 2 }]).ok, false);
});

test('cancelling a pending order restores physical stock once', () => {
  const order = { id: 1007, status: 'pending', items: [{ id: 6, qty: 2 }] };
  const product = { id: 6, stock: 5, reserved: 2 };
  const db = { products: [product], orders: [order] };

  inventory.reserve(db.products, order.items);
  assert.deepEqual([product.stock, product.reserved], [3, 2]);
  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual([product.stock, product.reserved], [5, 2]);
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.deepEqual([product.stock, product.reserved], [5, 2]);
});

test('checkout checks total demand across repeated lines for the same product', () => {
  const products = [{ id: 11, name: 'Chilli powder', stock: 5, reserved: 2 }];

  assert.equal(inventory.check(products, [{ id: 11, qty: 1 }, { id: '11', qty: 2 }]).ok, true);
  assert.equal(inventory.check(products, [{ id: 11, qty: 2 }, { id: '11', qty: 2 }]).ok, false);
});
