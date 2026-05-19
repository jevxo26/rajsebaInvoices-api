const fs = require('fs');
const path = require('path');
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const dbPath = isVercel ? '/tmp/db.json' : path.join(__dirname, '../data/db.json');

// Ensure database directory and file exist
const ensureDb = () => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  let needsSeed = false;
  if (!fs.existsSync(dbPath)) {
    needsSeed = true;
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if ((!data.customers || data.customers.length === 0) && (!data.services || data.services.length === 0)) {
        needsSeed = true;
      }
    } catch (e) {
      needsSeed = true;
    }
  }

  if (needsSeed) {
    const defaultData = {
      customers: [
        {
          _id: "cust_default_1",
          name: "Rajseba Service Partner",
          phone: "01700000001",
          email: "partner@rajseba.com",
          address: "Rajshahi Corporate Office, Ghoramara, Rajshahi"
        },
        {
          _id: "cust_default_2",
          name: "RDS Interior Studio",
          phone: "01700000002",
          email: "studio@rds.com",
          address: "Sector 11, Uttara, Dhaka"
        }
      ],
      services: [
        {
          _id: "serv_default_1",
          name: "Interior 3D Plan & Layout Design",
          rate: 150.00
        },
        {
          _id: "serv_default_2",
          name: "Minimalist Furniture Woodworking & Installation",
          rate: 220.00
        },
        {
          _id: "serv_default_3",
          name: "Premium Commercial Architectural Consultation",
          rate: 15000.00
        },
        {
          _id: "serv_default_4",
          name: "Structural Plan & Layout Engineering",
          rate: 85.00
        }
      ],
      invoices: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }
};

const readDb = () => {
  ensureDb();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB, resetting to defaults:', err);
    return { customers: [], services: [], invoices: [] };
  }
};

const writeDb = (data) => {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Customer MOCK
const Customer = {
  find: async () => {
    return readDb().customers;
  },
  findOneAndUpdate: async (query, update, options = {}) => {
    const db = readDb();
    const phone = query.phone ? query.phone.trim() : '';
    let custIdx = db.customers.findIndex(c => c.phone === phone);
    let updatedCust;

    if (custIdx >= 0) {
      db.customers[custIdx] = { ...db.customers[custIdx], ...update };
      updatedCust = db.customers[custIdx];
    } else if (options.upsert) {
      updatedCust = {
        _id: 'cust_' + Date.now() + Math.random().toString(36).substr(2, 5),
        phone,
        ...update
      };
      db.customers.push(updatedCust);
    }
    writeDb(db);
    return updatedCust;
  }
};

// Service MOCK
const Service = {
  find: async () => {
    return readDb().services;
  },
  findOneAndUpdate: async (query, update, options = {}) => {
    const db = readDb();
    const name = query.name ? query.name.trim() : '';
    let servIdx = db.services.findIndex(s => s.name === name);
    let updatedServ;

    if (servIdx >= 0) {
      db.services[servIdx] = { ...db.services[servIdx], ...update };
      updatedServ = db.services[servIdx];
    } else if (options.upsert) {
      updatedServ = {
        _id: 'serv_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name,
        ...update
      };
      db.services.push(updatedServ);
    }
    writeDb(db);
    return updatedServ;
  }
};

// Invoice MOCK
class InvoiceInstance {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const db = readDb();
    this._id = 'inv_' + Date.now() + Math.random().toString(36).substr(2, 5);
    this.createdAt = new Date().toISOString();

    // Check invoice number uniqueness
    const exists = db.invoices.some(i => i.invoiceNumber === this.invoiceNumber);
    if (exists) {
      const err = new Error(`Invoice number "${this.invoiceNumber}" already exists.`);
      err.code = 11000;
      throw err;
    }

    db.invoices.push(this);
    writeDb(db);
    return this;
  }
}

const Invoice = {
  find: () => {
    const invoices = readDb().invoices;
    return {
      sort: () => {
        // Return sorted invoices by date descending
        return invoices.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      }
    };
  },
  findById: async (id) => {
    const invoices = readDb().invoices;
    return invoices.find(i => i._id === id) || null;
  }
};

// Attach standard mock queries to the constructor class
const MockedInvoiceClass = Object.assign(InvoiceInstance, Invoice);

module.exports = {
  Customer,
  Service,
  Invoice: MockedInvoiceClass
};
