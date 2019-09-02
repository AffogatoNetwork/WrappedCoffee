import React from 'react';
import './App.css';
import TokensDashboard from "./components/TokensDashboard";
import getWeb3 from "./utils/getWeb3";

// Contracts
import ERC1155 from "./contracts/ERC1155.json";

class App extends React.Component {
  constructor(props) {
    super(props);
    const { web3, contract, accounts } = props;
    this.state = {
      web3,
      contract,
      accounts
    };
  }

  async componentDidMount() {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();

      const deployedNetwork = ERC1155.networks[networkId];
      const contract = new web3.eth.Contract(
        ERC1155.abi,
        deployedNetwork && deployedNetwork.address
      );

      const context = this;
      // Listen for changes on the accounts
      window.ethereum.on('accountsChanged', function (accounts) {
        context.setState({ accounts });
      });

      context.setState({
        web3,
        accounts,
        contract,
      })
    } catch (e) {
      alert("Failed to load web3, accounts or contract. Check console for details.");
      console.error(e);
    }
  }

  render() {
    const { web3, accounts, contract } = this.state;
    if (!web3) {
      return <a>Loading...</a>
    }
    return <TokensDashboard web3={web3} contract={contract} accounts={accounts} />
  }
}

export default App;
