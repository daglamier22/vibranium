const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

const mongoose = require('mongoose');
const MONGODB_URI = process.env.CI ?
  'mongodb://localhost' :
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DEFAULT_DATABASE}-test?retryWrites=true`;

const Transaction = require('../../../models/transaction');
const { editTransaction } = require('../../../controllers/transaction/editTransaction');

describe('Transaction Controller - Edit Transaction', function() {
  let res;

  before(function(done) {
    mongoose
      .connect(MONGODB_URI)
      .then(result => {
        const transaction = new Transaction({
          _id: '6c0f66b979af55031b34728a',
          userId: '5c0f66b979af55031b34728a',
          date: '02-25-2019',
          accountName: '5c0f66b979af55031b34728a',
          description: 'description',
          categoryParent: 'categoryParent',
          categoryChild: 'categoryChild',
          amount: '10.00',
          transactionType: 'debit',
          note: ''
        });
        return transaction.save();
      })
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  beforeEach(function() {
    res = {
      statusCode: null,
      apiStatus: null,
      apiMessage: null,
      errorCode: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.apiStatus = data.apiStatus;
        this.apiMessage = data.apiMessage;
        this.errorCode = data.errorCode;
        this.values = data.values;
      }
    };
  });

  it('should return an error if retrieving from the database fails', function(done) {
    sinon.stub(mongoose.Model, 'findById');
    mongoose.Model.findById.throws();

    const req = {
      userId: '5c0f66b979af55031b34728a',
      body: {
        date: '02-25-2019',
        accountName: '5c0f66b979af55031b34728a',
        description: 'new description',
        categoryParent: 'new categoryParent',
        categoryChild: 'new categoryChild',
        amount: '20.0',
        transactionType: 'debit',
        note: 'test'
      }
    };
    editTransaction(req, res, () => {}).then(() => {
      expect(res).to.have.property('statusCode');
      expect(res.statusCode).to.equal(500);
      expect(res).to.have.property('apiStatus');
      expect(res.apiStatus).to.be.equal('FAILURE');
      expect(res).to.have.property('apiMessage');
      expect(res.apiMessage).to.be.equal('Unable to edit transaction');
      expect(res).to.have.property('errorCode');
      expect(res.errorCode).to.be.equal(4);
      done();
    }).catch(err => {
      done(err);
    });

    mongoose.Model.findById.restore();
  });

  it('should return an error if the transaction cannot be found', function(done) {
    const req = {
      userId: '5c0f66b979af55031b34728a',
      body: {
        _id: '7c0f66b979af55031b34728b', // needs to be diffeerent than _id setup in before function
        date: '02-25-2019',
        accountName: '5c0f66b979af55031b34728a',
        description: 'new description',
        categoryParent: 'new categoryParent',
        categoryChild: 'new categoryChild',
        amount: '20.0',
        transactionType: 'debit',
        note: 'test'
      }
    };
    editTransaction(req, res, () => {}).then(() => {
      expect(res).to.have.property('statusCode');
      expect(res.statusCode).to.equal(404);
      expect(res).to.have.property('apiStatus');
      expect(res.apiStatus).to.be.equal('FAILURE');
      expect(res).to.have.property('apiMessage');
      expect(res.apiMessage).to.be.equal('Could not find transaction');
      expect(res).to.have.property('errorCode');
      expect(res.errorCode).to.be.equal(2);
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return an error if the userid trying to make the edit does not match the userid of the transaction owner', function(done) {
    const req = {
      userId: '5c0f66b979af55031b34728b', // must be different than the userId in the before function
      body: {
        _id: '6c0f66b979af55031b34728a',
        date: '02-25-2019',
        accountName: '5c0f66b979af55031b34728a',
        description: 'new description',
        categoryParent: 'new categoryParent',
        categoryChild: 'new categoryChild',
        amount: '20.0',
        transactionType: 'debit',
        note: 'test'
      }
    };
    editTransaction(req, res, () => {}).then(() => {
      expect(res).to.have.property('statusCode');
      expect(res.statusCode).to.equal(403);
      expect(res).to.have.property('apiStatus');
      expect(res.apiStatus).to.be.equal('FAILURE');
      expect(res).to.have.property('apiMessage');
      expect(res.apiMessage).to.be.equal('Not authorized');
      expect(res).to.have.property('errorCode');
      expect(res.errorCode).to.be.equal(3);
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return success if transaction created', function(done) {
    const req = {
      userId: '5c0f66b979af55031b34728a',
      body: {
        _id: '6c0f66b979af55031b34728a',
        date: '02-25-2019',
        accountNameId: '5c0f66b979af55031b34728a',
        description: 'new description',
        categoryParent: 'new categoryParent',
        categoryChild: 'new categoryChild',
        amount: '20.0',
        transactionType: 'debit',
        note: 'test'
      }
    };
    editTransaction(req, res, () => {}).then(() => {
      expect(res).to.have.property('statusCode');
      expect(res.statusCode).to.be.equal(200);
      expect(res).to.have.property('apiStatus');
      expect(res.apiStatus).to.equal('SUCCESS');
      expect(res).to.have.property('apiMessage');
      expect(res.apiMessage).to.equal('Transaction updated');
      expect(res).to.have.property('errorCode');
      expect(res.errorCode).to.equal(0);
      done();
    }).catch(err => {
      done(err);
    });
  });

  after(function(done) {
    Transaction.deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      });
  });
});
