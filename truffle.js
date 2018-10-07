module.exports = {
  compilers: {
    solc: {
      version: "0.4.24",
      docker: true
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    kovan: {
      host: 'sasquatch.network',
      port: 10545,
      network_id: '*'
    },
    sasquatch_ws: {
      host: 'sasquatch.network',
      port: 19546,
      network_id: '4'
    }
  }
}