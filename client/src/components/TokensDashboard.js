import React from 'react';
import axios from 'axios';

import { CardColumns, Card, Button, ButtonGroup, Modal, Form, InputGroup, FormControl } from 'react-bootstrap';

class TokensDashboard extends React.Component {
    constructor(props) {
        super(props);
        const {
            erc1155Contract,
            affogatoTokenHandler,
            standardToken,
            accounts,
            web3 } = props;

        this.state = {
            erc1155Contract,
            affogatoTokenHandler,
            web3,
            accounts,
            standardToken,
            showMortgageModal: false,
        }
    }

    handleMortgageCoffeeClick = async (event, id) => {
        event.preventDefault();
        this.setState({
            id,
            showMortgageModal: true,
        })
    }

    handleModalClose = (event) => {
        if (event) event.preventDefault();
        this.setState({ showMortgageModal: false })
    }

    handleSendMortgageTransaction = async () => {
        const { web3, accounts, affogatoTokenHandler, tokenAmount, id, erc1155Contract, standardToken } = this.state;
        // We authorize the the handler to manage our erc1155
        // await erc1155Contract.methods.setApprovalForAll(affogatoTokenHandler._address, true).send({ from: accounts[0], gasLimit: '5000000' });
        // // console.log(`address => ${affogatoTokenHandler._address} + amount => ${tokenAmount}`)
        console.log(affogatoTokenHandler._address);
        await standardToken.methods.approve(affogatoTokenHandler._address, tokenAmount).send({ from: accounts[0], gasLimit: '5000000' });
        // console.log(`account => ${accounts[0]} and id => ${id}`);
        const result = await affogatoTokenHandler
            .methods
            .wrapCoffee(id,
                tokenAmount)
            .send({ from: accounts[0], gasLimit: '500000' });

        // console.log(result);
    }

    handleAmountChange = async (event) => {
        const tokenAmount = event.currentTarget.value;
        this.setState({ tokenAmount })
    }

    async componentDidMount() {
        const { accounts, erc1155Contract } = this.state;
        const tokenIds = await erc1155Contract.methods.getTokensWithBalance(accounts[0]).call({ from: accounts[0] });
        const promises = tokenIds.map((id) => erc1155Contract.methods.uris(id).call({ from: accounts[0] }));
        const uris = await Promise.all(promises);
        console.log(tokenIds);
        const tokensResponses = await Promise.all(
            uris.map((uri) => axios.get(uri, {
                headers: {
                    'secret-key': '$2a$10$P7M/M/O2fF2MPGg7uc1rxe7vWXtw1cM1DUwXFxaod24D0/OyiANPm',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    'Access-Control-Allow-Origin': "*",
                }
            }))
        );
        const balances = await Promise.all(tokenIds.map((id) => erc1155Contract.methods.balanceOf(accounts[0], id).call({ from: accounts[0] })));
        const tokens = tokensResponses.map((response, index) => Object.assign(response.data, { id: tokenIds[index] }));
        this.setState({ tokens, balances });
    }

    render() {
        const { tokens, balances, showMortgageModal } = this.state;
        if (!tokens) {
            return (<a>Loading tokens...</a>);
        }

        return (
            <div>
                <CardColumns>
                    {this.buildCards(tokens, balances)}
                </CardColumns>
                <Modal show={showMortgageModal} onHide={this.handleModalClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Get Money</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <InputGroup className="mb-3">
                            <FormControl
                                id="tokenAmount"
                                required
                                placeholder="5"
                                onChange={this.handleAmountChange}
                                type="number"
                                aria-label="Amount of tokens"
                                aria-describedby="basic-addon1" />
                            <FormControl.Feedback type="invalid">Please enter a valid amount</FormControl.Feedback>
                            <InputGroup.Append>
                                <InputGroup.Text id="basic-addon1">ASC</InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.handleModalClose}>
                            Cancel
                            </Button>
                        <Button variant="primary" onClick={this.handleSendMortgageTransaction}>
                            Mortgage
                            </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }

    buildCards(tokens, balances) {
        const cards = tokens.map((token, index) => (
            <Card key={token.id} style={{ width: '18rem' }}>
                <Card.Img variant="top" src={token.image} />
                <Card.Header>{token.name}</Card.Header>
                <Card.Body>
                    <Card.Title>{balances[index]}</Card.Title>
                    <ButtonGroup vertical>
                        <Button variant="primary" >Sell Coffee</Button>
                        <Button variant="info" onClick={(event) => this.handleMortgageCoffeeClick(event, token.id)}>Mortgage Coffee</Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
        ));

        return cards;
    }
}

export default TokensDashboard;