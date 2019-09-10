import React from 'react';
import './App.css';
import TokensDashboard from "./components/TokensDashboard";
import getWeb3 from "./utils/getWeb3";

// Contracts
import ERC1155 from "./contracts/ERC1155.json";
import AffogatoTokenHandler from "./contracts/AffogatoCoffeeHandler.json";
import AffogatoStandardToken from "./contracts/AffogatoStandardCoffee.json";

class App extends React.Component {
  constructor(props) {
    super(props);
    const { web3, erc1155Contract, accounts } = props;
    this.state = {
      web3,
      erc1155Contract,
      accounts
    };
  }

  async componentDidMount() {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();

      const erc1155Network = ERC1155.networks[networkId];
      const affogatoHandlerNetwork = AffogatoTokenHandler.networks[networkId];
      const affogatoStandardCoffeeNetwork = AffogatoStandardToken.networks[networkId];
      const erc1155Contract = new web3.eth.Contract(
        ERC1155.abi,
        erc1155Network && erc1155Network.address
      );

      const affogatoTokenHandler = new web3.eth.Contract(
        AffogatoTokenHandler.abi,
        affogatoHandlerNetwork && affogatoHandlerNetwork.address
      );

      const standardToken = new web3.eth.Contract(
        AffogatoStandardToken.abi,
        affogatoStandardCoffeeNetwork && affogatoStandardCoffeeNetwork.address
      );

      const context = this;
      // Listen for changes on the accounts
      window.ethereum.on('accountsChanged', function (accounts) {
        console.log(accounts);
        context.setState({ accounts });
      });

      context.setState({
        web3,
        accounts,
        erc1155Contract,
        affogatoTokenHandler,
        standardToken
      })
    } catch (e) {
      alert("Failed to load web3, accounts or erc1155Contract. Check console for details.");
      console.error(e);
    }
  }

  render() {
    const { web3, accounts, erc1155Contract, affogatoTokenHandler, standardToken } = this.state;
    if (!web3) {
      return <a>Loading...</a>
    }

    return <TokensDashboard standardToken={standardToken} web3={web3} erc1155Contract={erc1155Contract} accounts={accounts} affogatoTokenHandler={affogatoTokenHandler} />
  }
}

export default App;
