import React from 'react';
import axios from 'axios';

import { CardColumns, Card, Button, ButtonGroup } from 'react-bootstrap';

class TokensDashboard extends React.Component {
    constructor(props) {
        super(props);
        const { contract, accounts, web3 } = props;
        this.state = {
            contract,
            web3,
            accounts
        }
    }

    async componentDidMount() {
        const { accounts, contract } = this.state;
        const tokenIds = await contract.methods.getTokensWithBalance(accounts[0]).call({ from: accounts[0] });
        const promises = tokenIds.map((id) => contract.methods.uris(id).call({ from: accounts[0] }));
        const uris = await Promise.all(promises);
        console.log(uris);
        const tokensResponses = await Promise.all(
            uris.map((uri) => axios.get(uri, {
                headers: {
                    'secret-key': '$2a$10$P7M/M/O2fF2MPGg7uc1rxe7vWXtw1cM1DUwXFxaod24D0/OyiANPm',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    'Access-Control-Allow-Origin': "*",
                }
            }))
        );
        console.log(tokensResponses);
        const balances = await Promise.all(
            
        );
        const tokens = tokensResponses.map((response, index) => Object.assign(response.data, { id: tokenIds[index] }));
        this.setState({ tokens });
    }

    render() {
        const { tokens } = this.state;
        if (!tokens) {
            return (<a>Loading tokens...</a>);
        }

        return (
            <div>
                <CardColumns>
                    {this.buildCards(tokens)}
                </CardColumns>
            </div>
        );
    }

    buildCards(tokens) {
        const cards = tokens.map((token) => (
            <Card key={token.id} style={{ width: '18rem' }}>
                <Card.Img variant="top" src={token.image} />
                <Card.Body>
                    <Card.Title>{token.name}</Card.Title>
                    <ButtonGroup vertical>
                        <Button variant="primary">Sell Coffee</Button>
                        <Button variant="info">Mortgage Coffee</Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
        ));

        return cards;
    }
}

export default TokensDashboard;