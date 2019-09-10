import React from "react";
import axios from "axios";

import {
  CardDeck,
  Card,
  Button,
  ButtonGroup,
  Modal,
  InputGroup,
  FormControl,
  Container,
  ListGroup,
  ListGroupItem
} from "react-bootstrap";

import BigNumber from "bignumber.js";
import Header from "./Header";
import green from "../assets/green.jpg";
import roasted from "../assets/roasted.jpg";
import dry from "../assets/dry.jpg";

const IPFS_GATEWAY_BASE = "https://ipfs.io/ipfs/";

class TokensDashboard extends React.Component {
  constructor(props) {
    super(props);
    const {
      erc1155Contract,
      affogatoTokenHandler,
      standardToken,
      accounts,
      web3
    } = props;

    this.state = {
      erc1155Contract,
      affogatoTokenHandler,
      web3,
      accounts,
      standardToken,
      tokens: {
        approvedTokens: [],
        unapprovedTokens: []
      },
      showMortgageModal: false
    };

    erc1155Contract.events.TransferSingle(
      {
        fromBlock: "latest",
        filter: {
          _to: accounts[0]
        }
      },
      (err, event) => {
        if (err) {
          console.error(err);
          return;
        }

        const { balances, tokens } = this.state;
        const tokenId = event.returnValues["_id"];
        const amount = event.returnValues["_value"];

        let { unapprovedTokens, approvedTokens } = tokens;
        console.log(JSON.stringify(balances));

        let indexOfToken = approvedTokens.findIndex(
          element => element["id"] == tokenId
        );
        if (indexOfToken != -1) {
          const newValue = balances[indexOfToken].plus(amount);
          balances[indexOfToken] = newValue;
        }

        indexOfToken = unapprovedTokens.findIndex(
          element => element["id"] == tokenId
        );
        if (indexOfToken != -1) {
          balances.push(new BigNumber(amount.toString()));
          const token = unapprovedTokens[indexOfToken];
          unapprovedTokens = unapprovedTokens.filter(
            (e, index) => index != indexOfToken
          );
          approvedTokens.push(token);
        }

        this.setState({
          balances,
          tokens: {
            approvedTokens,
            unapprovedTokens
          }
        });
      }
    );

    erc1155Contract.events.TransferSingle(
      {
        fromBlock: "latest",
        filter: {
          _from: accounts[0]
        }
      },
      (err, event) => {
        if (err) {
          console.error(err);
          return;
        }

        const tokenId = event.returnValues["_id"];
        const amount = event.returnValues["_value"];

        const { tokens, balances } = this.state;
        if (tokens.approvedTokens) {
          const indexOfToken = tokens.approvedTokens.findIndex(
            e => e["id"] == tokenId
          );
          if (indexOfToken != -1) {
            const newValue = balances[indexOfToken].minus(amount);
            balances[indexOfToken] = newValue;
            this.setState({ balances });
          }
        }
      }
    );
  }

  handleMortgageCoffeeClick = async (event, id) => {
    event.preventDefault();
    this.setState({
      id,
      showMortgageModal: true
    });
  };

  handleModalClose = event => {
    if (event) event.preventDefault();
    this.setState({ showMortgageModal: false });
  };

  handleApproveTokenClick = async (event, id) => {
    event.preventDefault();
    const { web3, accounts, erc1155Contract } = this.state;
    await erc1155Contract.methods
      .approveTokenCreation(id)
      .send({ from: accounts[0] });
  };

  handleSendMortgageTransaction = async () => {
    this.setState({ showMortgageModal: false });
    const {
      web3,
      accounts,
      affogatoTokenHandler,
      tokenAmount,
      id,
      erc1155Contract,
      standardToken
    } = this.state;
    // We authorize the the handler to manage our erc1155
    await erc1155Contract.methods
      .setApprovalForAll(affogatoTokenHandler._address, true)
      .send({ from: accounts[0], gasLimit: "5000000" });
    await standardToken.methods
      .approve(affogatoTokenHandler._address, tokenAmount)
      .send({ from: accounts[0], gasLimit: "5000000" });
    const result = await affogatoTokenHandler.methods
      .wrapCoffee(id, tokenAmount)
      .send({ from: accounts[0], gasLimit: "500000" });
  };

  handleAmountChange = async event => {
    const tokenAmount = event.currentTarget.value;
    this.setState({ tokenAmount });
  };

  async componentDidMount() {
    const { accounts, erc1155Contract } = this.state;
    const approvedTokenIds = await erc1155Contract.methods
      .getTokensWithBalance(accounts[0])
      .call({ from: accounts[0] });
    const approvedTokenPromises = approvedTokenIds.map(id =>
      erc1155Contract.methods.uris(id).call({ from: accounts[0] })
    );
    const ipfsHashes = await Promise.all(approvedTokenPromises);
    console.log(JSON.stringify(ipfsHashes));

    const approvedTokenResponses = await Promise.all(
      ipfsHashes.map(ipfsHash => axios.get(`${IPFS_GATEWAY_BASE}${ipfsHash}`))
    );

    const balances = await Promise.all(
      approvedTokenIds.map(id =>
        erc1155Contract.methods
          .balanceOf(accounts[0], id)
          .call({ from: accounts[0] })
      )
    );
    const approvedTokens = approvedTokenResponses.map((response, index) =>
      Object.assign(response.data, { id: approvedTokenIds[index] })
    );

    // Get the tokens we still need to approved
    const unapprovedTokenIds = await erc1155Contract.methods
      .getUnapprovedTokensWithBalance(accounts[0])
      .call({ from: accounts[0] });
    const unapprovedTokenPromises = unapprovedTokenIds.map(id =>
      erc1155Contract.methods.uris(id).call({ from: accounts[0] })
    );
    const unapprovedipfsHashes = await Promise.all(unapprovedTokenPromises);

    console.log(JSON.stringify(unapprovedipfsHashes));

    const unapprovedTokenResponses = await Promise.all(
      unapprovedipfsHashes.map(ipfsHash =>
        axios.get(`${IPFS_GATEWAY_BASE}${ipfsHash}`)
      )
    );
    const unapprovedTokens = unapprovedTokenResponses.map((response, index) =>
      Object.assign(response.data, { id: unapprovedTokenIds[index] })
    );
    this.setState({
      tokens: { approvedTokens, unapprovedTokens },
      balances: balances.map(e => new BigNumber(e))
    });
  }

  render() {
    const { tokens, balances, showMortgageModal } = this.state;
    let content;

    if (!tokens || !tokens.approvedTokens) {
      content = <h2>Loading tokens...</h2>;
    } else if (
      tokens.approvedTokens.length == 0 &&
      tokens.unapprovedTokens.length == 0
    ) {
      content = (
        <>
          <h2>
            You don't have any Coffee Tokens<br></br>
          </h2>
          <p>Bring your coffee to the nearest cooperative to get some</p>{" "}
        </>
      );
    } else {
      content = (
        <div>
          {tokens.approvedTokens.length != 0 && (
            <>
              <h1>Coffee Tokens</h1>
              <CardDeck className="justify-content-center">
                {this.buildApprovedTokenCards(tokens.approvedTokens, balances)}
              </CardDeck>
            </>
          )}
          {tokens.unapprovedTokens.length != 0 && (
            <>
              <h1>Pending Tokens</h1>
              <CardDeck className="justify-content-center">
                {this.buildUnapprovedTokenCards(tokens.unapprovedTokens)}
              </CardDeck>
            </>
          )}
          <Modal show={showMortgageModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Trade your Coffee for Money</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <InputGroup className="mb-3">
                <FormControl
                  id="tokenAmount"
                  required
                  placeholder="Amount of Coffee"
                  onChange={this.handleAmountChange}
                  type="number"
                  aria-label="Amount of tokens"
                  aria-describedby="basic-addon1"
                />
                <FormControl.Feedback type="invalid">
                  Please enter a valid amount
                </FormControl.Feedback>
                <InputGroup.Append>
                  <InputGroup.Text id="basic-addon1">QQ</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="btn-accent"
                onClick={this.handleSendMortgageTransaction}
              >
                Mortgage
              </Button>{" "}
              <Button variant="secondary" onClick={this.handleModalClose}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    }

    return (
      <Container>
        <Header
          standardToken={this.props.standardToken}
          web3={this.props.web3}
          accounts={this.props.accounts}
        ></Header>
        {content}
      </Container>
    );
  }

  getImage(coffeeState) {
    console.log("TCL: TokensDashboard -> getImage -> coffeeState", coffeeState);
    let image = roasted;
    switch (coffeeState) {
      case "green":
        image = green;
        break;
      case "roasted":
        image = roasted;
        break;
      case "dry":
        image = dry;
        break;
      default:
        image = roasted;
        break;
    }
    return image;
  }

  buildApprovedTokenCards(tokens, balances) {
    const cards = tokens.map((token, index) => {
      let image = this.getImage(token.properties.coffeeState);

      return (
        <Card key={token.id} style={{ width: "18rem" }}>
          <Card.Img variant="top" src={image} />
          <Card.Header>{token.name}</Card.Header>
          <Card.Body>
            <Card.Title>Properties</Card.Title>
            <ListGroup className="list-group-flush">
              <ListGroupItem>
                <b>Amount: {balances[index].toString()} QQ</b>
              </ListGroupItem>
              <ListGroupItem>Farm: {token.properties.farm.name}</ListGroupItem>
              <ListGroupItem>
                Altitude: {token.properties.altitude}
              </ListGroupItem>
              <ListGroupItem>Process: {token.properties.process}</ListGroupItem>
            </ListGroup>
            <ButtonGroup vertical className="w-100">
              <Button className="btn-accent" disabled>
                Sell Coffee
              </Button>
              <Button
                className="btn-accent"
                onClick={event =>
                  this.handleMortgageCoffeeClick(event, token.id)
                }
              >
                Mortgage Coffee
              </Button>
            </ButtonGroup>
          </Card.Body>
        </Card>
      );
    });

    return cards;
  }

  buildUnapprovedTokenCards(tokens) {
    const cards = tokens.map((token, index) => {
      let image = this.getImage(token.properties.coffeeState);
      return (
        <Card key={token.id} style={{ width: "18rem" }}>
          <Card.Img variant="top" src={image} />
          <Card.Header>{token.name}</Card.Header>
          <Card.Body>
            <Card.Title> Properties</Card.Title>
            <ListGroup className="list-group-flush">
              <ListGroupItem>Farm: {token.properties.farm.name}</ListGroupItem>
              <ListGroupItem>
                Altitude: {token.properties.altitude}
              </ListGroupItem>
              <ListGroupItem>Process: {token.properties.process}</ListGroupItem>
            </ListGroup>

            <Button
              className="btn-accent w-100 mt-4"
              onClick={event => this.handleApproveTokenClick(event, token.id)}
            >
              Approve
            </Button>
          </Card.Body>
        </Card>
      );
    });

    return cards;
  }
}

export default TokensDashboard;
