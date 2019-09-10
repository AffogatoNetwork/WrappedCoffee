import React, { Component } from "react";
import { Alert, Nav, Navbar } from "react-bootstrap";
import Blockies from "react-blockies";
import { Image, Link, Icon, EthAddress } from "rimble-ui";
import logo from "../assets/logo.svg";

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: this.props.accounts[0],
      hasBalance: false,
      balance: 0,
      visible: true
    };

    this.onDismiss = this.onDismiss.bind(this);
  }

  componentDidMount() {
    this.hasBalance();
  }

  onDismiss() {
    this.setState({ visible: false });
  }

  async hasBalance() {
    var balance = await this.props.standardToken.methods
      .balanceOf(this.state.account)
      .call({ from: this.state.account });
    var hasBalance = balance > 0 ? true : false;
    this.setState({ hasBalance, balance });
  }

  render() {
    return (
      <>
        <Navbar bg="light">
          <Navbar.Brand href="#home">
            <img
              src={logo}
              height="40"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
          </Navbar.Brand>
          <Nav className="mt-4 d-flex justify-content-end w-100" as="ul">
            <Nav.Item className="ml-2 mr-4 pt-1 text-left ">
              <Link hoverColor="primary" href="/" color="secondary">
                <span>
                  <Icon
                    name="Home"
                    size="20"
                    className="mr-1 icon"
                    display="inline"
                  />
                  Home
                </span>
              </Link>
            </Nav.Item>
            <Nav.Item className="ml-2 mr-4 pt-1 text-left ">
              <Link
                hoverColor="primary"
                href="/instructions/"
                color="secondary"
              >
                <Icon name="Help" size="20" className="mr-1" />
                Help
              </Link>
            </Nav.Item>
            <Nav.Item className="ml-2 mr-4 pt-1 text-left balance">
              <Icon
                name="AccountBalanceWallet"
                size="20"
                className="mr-1"
                color="secondary"
              />
              Balance: {this.state.balance} ACS
            </Nav.Item>
            <Nav.Item className="ml-2 text-right account-info">
              <b>Current Account:</b> <br />
              <label>
                <EthAddress
                  address={this.state.account}
                  truncate={true}
                ></EthAddress>
              </label>
            </Nav.Item>
            <Nav.Item className="ml-2 account-info ">
              <Blockies seed={this.state.account} size={10} scale={5} />
            </Nav.Item>
          </Nav>
        </Navbar>
      </>
    );
  }
}

export default Header;
