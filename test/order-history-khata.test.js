const test = require('node:test');
const assert = require('node:assert/strict');
const dates = require('../lib/dates');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

const history = {
  orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1002, date: '05/01/2022' },
    { id: 1004, date: '30/01/2022' },
    { id: 1007, date: '04/03/2022' },
    { id: 1008, date: '15/03/2022' },
  ],
};

function khataAccount() {
  return {
    nextSettlementId: 1,
    customers: [{ id: 1, name: 'Meera', openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200 }],
  };
}

test('order history sorts newest first and filters by calendar date', () => {
  const ids = orders.list(history).map(order => order.id);
  assert.deepEqual(ids, [1008, 1007, 1004, 1002, 1001]);
  const january = orders.list(history, { from: '2022-01-01', to: '2022-01-31' });
  assert.deepEqual(january.map(order => order.id), [1004, 1002]);
});

test('Khata adds a settlement submitted as text and records a numeric receipt', () => {
  const result = ledger.recordSettlement(khataAccount(), 1, '500');
  assert.equal(result.settlement.amount, 500);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
});

test('date filters include both endpoints and support both stored and ISO dates', () => {
  const db = {
    orders: [
      { id: 1, date: '31/12/2021' },
      { id: 2, date: '1/1/2022' },
      { id: 3, date: '2022-01-31' },
      { id: 4, date: '01/02/2022' },
      { id: 5, date: '31/01/2022' },
    ],
  };
  assert.deepEqual(
    orders.list(db, { from: '01/01/2022', to: '2022-01-31' }).map(order => order.id),
    [5, 3, 2],
  );
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});

test('invalid settlements leave the customer and receipt counter untouched', () => {
  for (const amount of ['invalid', Infinity, '1e308', 0, -1, true, 0.001]) {
    const db = khataAccount();
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
    assert.deepEqual(db, khataAccount());
  }
});

test('Khata keeps decimal amounts numeric across multiple settlements', () => {
  const db = khataAccount();
  db.customers[0].totalSettled = '1200';
  assert.equal(ledger.recordSettlement(db, 1, 0.1).ok, true);
  assert.equal(ledger.recordSettlement(db, 1, '0.2').ok, true);
  assert.equal(db.customers[0].totalSettled, 1200.3);
  assert.equal(db.customers[0].balance, 1231.71);
  assert.deepEqual(db.settlements.map(entry => entry.amount), [0.2, 0.1]);
});
