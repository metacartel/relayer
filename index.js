const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const Tx = require('ethereumjs-tx');

const factoryAbi = [{"anonymous":false,"inputs":[],"name":"DomainTransfersLocked","type":"event"},{"constant":false,"inputs":[],"name":"lockDomainOwnershipTransfers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_subdomain","type":"string"},{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"},{"name":"_owner","type":"address"},{"name":"_target","type":"address"}],"name":"newSubdomain","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousRegistry","type":"address"},{"indexed":true,"name":"newRegistry","type":"address"}],"name":"RegistryUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"creator","type":"address"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"subdomain","type":"string"},{"indexed":false,"name":"domain","type":"string"},{"indexed":false,"name":"topdomain","type":"string"}],"name":"SubdomainCreated","type":"event"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"transferContractOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousResolver","type":"address"},{"indexed":true,"name":"newResolver","type":"address"}],"name":"ResolverUpdated","type":"event"},{"constant":false,"inputs":[{"name":"_node","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"transferDomainOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_registry","type":"address"}],"name":"updateRegistry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_resolver","type":"address"}],"name":"updateResolver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_registry","type":"address"},{"name":"_resolver","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"}],"name":"domainOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"locked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registry","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_subdomain","type":"string"},{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"}],"name":"subdomainOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_subdomain","type":"string"},{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"}],"name":"subdomainTarget","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
const emptyAddress = '0x0000000000000000000000000000000000000000';
// const factoryAddress = "0xe47405AF3c470e91a02BFC46921C3632776F9C6b"; //mainnet
const factoryAddress = "0x62d6C93DF120FCa09a08258f3a644B5059aa12f0"; //ropsten



const privKey = new Buffer('cf06f0b35515af10b5dfef470e3a1e743470bf9033d06f198b4e829cb2e7ef05', 'hex');
const pubKey = "0x37386A1c592Ad2f1CafFdc929805aF78C71b1CE7";

const Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://ropsten.infura.io/rqmgop6P5BDFqz6yfGla'));

const personalWallet = require('./build/contracts/PersonalWallet.json');
let contract = new web3.eth.Contract(personalWallet.abi);
const factoryContract = new web3.eth.Contract(factoryAbi, factoryAddress);

// let deploy = contract.deploy({
//   data: personalWallet.bytecode,
//   arguments: "0x37386A1c592Ad2f1CafFdc929805aF78C71b1CE7"
// }).encodeABI();

const _registerENS = async (ensName, address) => {

  const data = await factoryContract.methods.newSubdomain(ensName, 'tenz-id', 'xyz', address, "0x37386A1c592Ad2f1CafFdc929805aF78C71b1CE7",).encodeABI();
  const nonce = await web3.eth.getTransactionCount(pubKey);
  const chainId = await web3.eth.net.getId();
  const rawTx = {
    "nonce": nonce,
    "from": pubKey,
    "to": address,
    "gas": 40000,
    "gasPrice": 500000000000, // converts the gwei price to wei
    "chainId": 3,
    "data": data
  };
  const tx = new Tx(rawTx);
  tx.sign(privKey);
   const serializedTx = tx.serialize();
   web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
     .on('transactionHash', (txHash) => {
       console.log('Subdomain transferred:' , txHash);
     })
     .on('confirmation', (conf, msg) => {
       //after account gets money
       if (conf === 0) {
         console.log('& Confirmed:' , conf);
       }
     })
}

// _registerENS('marker', '0x37386A1c592Ad2f1CafFdc929805aF78C71b1CE7');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/deploy/:address/:ensName', async (req, res) => {
  console.log('ADDRESS: ', req.params.address)
  console.log('ENS_NAME: ', req.params.ensName)
    try {
      const receipt = await contract.deploy({
        data: personalWallet.bytecode, arguments: [req.params.address]
      }).encodeABI();
      const nonce = await web3.eth.getTransactionCount(pubKey);
      const data = receipt || '';
      const chainId = await web3.eth.net.getId();
      const rawTx = {
        nonce: nonce,
        from: pubKey,
        gasPrice: 20000000000,
        gasLimit: 3000000,
        data,
        chainId,
      };

      const tx = new Tx(rawTx);
      tx.sign(privKey);
      const serializedTx = tx.serialize();
      web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('transactionHash', (txHash) => {
          console.log('TransactionHash:' , txHash);
        })
        .on('receipt', (rec) => {
          console.log('Receipt:' , rec);
          console.log('Receipt CA:' , rec.contractAddress);
          _registerENS(req.params.ensName, rec.contractAddress)
        })

      res.status(200)
      res.json({res: JSON.stringify(receipt._address)})
    } catch(e) {
      console.log("ERROR: ", e)
    }
})

io.on('connection', socket => {
  console.log('a user connected')
  socket.on('disconnect', () => {
    console.log('user disconnected')
  });
  socket.on('data', (e) => {
    console.log('data');
    io.emit('transfer', e)
  })
});


server.listen(4000, () => {
  console.log('The server is running: http://localhost:4000')
})