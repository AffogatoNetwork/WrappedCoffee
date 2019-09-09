import React from 'react';
import axios from 'axios';

import {
    CardColumns,
    Card,
    Button,
    ButtonGroup,
    Modal,
    InputGroup,
    FormControl,
    Container
} from 'react-bootstrap';

import BigNumber from 'bignumber.js';

const IPFS_GATEWAY_BASE = "https://ipfs.io/ipfs/";

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

        erc1155Contract.events.TransferSingle({
            fromBlock: 'latest',
            filter: {
                _to: accounts[0],
            }
        }, (err, event) => {
            if (err) {
                console.error(err);
                return;
            }

            const { balances, tokens } = this.state;
            const tokenId = event.returnValues['_id'];
            const amount = event.returnValues['_value'];
            if (tokens) {
                const indexOfToken = tokens.findIndex((e) => e['id'] == tokenId);
                if (indexOfToken != -1) {
                    const newValue = balances[indexOfToken].plus(amount);
                    balances[indexOfToken] = newValue;
                    this.setState({ balances });
                }
            }
        })

        erc1155Contract.events.TransferSingle({
            fromBlock: 'latest', filter: {
                _from: accounts[0]
            }
        }, (err, event) => {
            if (err) {
                console.error(err);
                return;
            }

            const tokenId = event.returnValues['_id'];
            const amount = event.returnValues['_value'];

            const { tokens, balances } = this.state;
            if (tokens) {
                const indexOfToken = tokens.findIndex((e) => e['id'] == tokenId);
                if (indexOfToken != -1) {
                    const newValue = balances[indexOfToken].minus(amount);
                    balances[indexOfToken] = newValue;
                    this.setState({ balances });
                }
            }
        });
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

    handleApproveTokenClick = async (event, id) => {
        event.preventDefault();
        const { web3, accounts, erc1155Contract } = this.state;
        await erc1155Contract.methods.approveTokenCreation(id).send({ from: accounts[0] });
    }

    handleSendMortgageTransaction = async () => {
        this.setState({ showMortgageModal: false });
        const { web3, accounts, affogatoTokenHandler, tokenAmount, id, erc1155Contract, standardToken } = this.state;
        // We authorize the the handler to manage our erc1155
        await erc1155Contract.methods.setApprovalForAll(affogatoTokenHandler._address, true).send({ from: accounts[0], gasLimit: '5000000' });
        await standardToken.methods.approve(affogatoTokenHandler._address, tokenAmount).send({ from: accounts[0], gasLimit: '5000000' });
        const result = await affogatoTokenHandler
            .methods
            .wrapCoffee(id,
                tokenAmount)
            .send({ from: accounts[0], gasLimit: '500000' });
    }

    handleAmountChange = async (event) => {
        const tokenAmount = event.currentTarget.value;
        this.setState({ tokenAmount })
    }

    async componentDidMount() {
        const { accounts, erc1155Contract } = this.state;
        const approvedTokenIds = await erc1155Contract.methods.getTokensWithBalance(accounts[0]).call({ from: accounts[0] });
        const approvedTokenPromises = approvedTokenIds.map((id) => erc1155Contract.methods.uris(id).call({ from: accounts[0] }));
        const ipfsHashes = await Promise.all(approvedTokenPromises);

        const approvedTokenResponses = await Promise.all(
            ipfsHashes.map((ipfsHash) => axios.get(`${IPFS_GATEWAY_BASE}${ipfsHash}`))
        );


        const balances = await Promise.all(approvedTokenIds.map((id) => erc1155Contract.methods.balanceOf(accounts[0], id).call({ from: accounts[0] })));
        const approvedTokens = approvedTokenResponses.map((response, index) => Object.assign(response.data, { id: approvedTokenIds[index] }));

        // Get the tokens we still need to approved
        const unapprovedTokenIds = await erc1155Contract.methods.getUnapprovedTokensWithBalance(accounts[0]).call({ from: accounts[0] });
        const unapprovedTokenPromises = unapprovedTokenIds.map((id) => erc1155Contract.methods.uris(id).call({ from: accounts[0] }));
        const unapprovedipfsHashes = await Promise.all(unapprovedTokenPromises);
        console.log(unapprovedipfsHashes);

        const unapprovedTokenResponses = await Promise.all(
            unapprovedipfsHashes.map((ipfsHash) => axios.get(`${IPFS_GATEWAY_BASE}${ipfsHash}`))
        );
        console.log(JSON.stringify(unapprovedTokenResponses))
        const unapprovedTokens = unapprovedTokenResponses.map((response, index) => Object.assign(response.data, { id: unapprovedTokenIds[index] }));
        console.log(unapprovedTokens)
        this.setState({ tokens: { approvedTokens, unapprovedTokens }, balances: balances.map((e) => new BigNumber(e)) });
    }

    render() {
        const { tokens, balances, showMortgageModal } = this.state;
        let content;
        if (!tokens || !tokens.approvedTokens) {
            content = (<a>Loading tokens...</a>);
        } else if (tokens.approvedTokens.length == 0 && tokens.unapprovedTokens.length == 0) {
            content = (<a>No tokens at this time...</a>)
        } else {
            content = (<div>
                <h1>Approved Tokens</h1>
                <CardColumns>
                    {this.buildApprovedTokenCards(tokens.approvedTokens, balances)}
                </CardColumns>
                <h1>Unapproved Tokens</h1>
                <CardColumns>
                    {this.buildUnapprovedTokenCards(tokens.unapprovedTokens)}
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
            </div>)
        }

        return (
            <Container>
                {content}
            </Container>
        );
    }

    buildApprovedTokenCards(tokens, balances) {
        const cards = tokens.map((token, index) => (
            <Card key={token.id} style={{ width: '18rem' }}>
                <Card.Img variant="top" src={token.image} />
                <Card.Header>{token.name}</Card.Header>
                <Card.Body>
                    <Card.Title>{balances[index].toString()}</Card.Title>
                    <ButtonGroup vertical>
                        <Button variant="primary" disabled>Sell Coffee</Button>
                        <Button variant="info" onClick={(event) => this.handleMortgageCoffeeClick(event, token.id)}>Mortgage Coffee</Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
        ));

        return cards;
    }

    buildUnapprovedTokenCards(tokens) {
        const cards = tokens.map((token, index) => (
            <Card key={token.id} style={{ width: '18rem' }}>
                <Card.Img variant="top" src={token.image} />
                <Card.Header>{token.name}</Card.Header>
                <Card.Body>
                    <ButtonGroup vertical>
                        <Button variant="primary" onClick={(event) => this.handleApproveTokenClick(event, token.id)}>Approve</Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
        ));

        return cards;
    }
}

export default TokensDashboard;