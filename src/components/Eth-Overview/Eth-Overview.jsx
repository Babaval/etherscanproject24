import React, { Component } from "react";
import axios from "axios";
import { Card, Grid, Icon, Input, Button } from "semantic-ui-react";
import { QRCodeCanvas } from "qrcode.react"; // QR code component

const apiKey = "FBXGXMYSW5AGYX7P4YZV2HHCRD3439B4HG"; // Etherscan API Key
const openSeaEndpoint = `https://api.opensea.io/api/v1/asset`;
const endpoint = `https://api.etherscan.io/api`;

class EthOverview extends Component {
  constructor() {
    super();
    this.state = {
      ethUSD: "",
      ethBTC: "",
      latestBlock: 0,
      difficulty: "",
      marketCap: 0,
      erc721Transactions: [],
      erc721Metadata: {},
      erc721Price: "N/A",
      previousPrice: "N/A",
      priceChangePercentage: "N/A",
      contractAddress: "", // User-input for contract address
    };
  }

  handleContractAddressChange = (event) => {
    this.setState({ contractAddress: event.target.value });
  };

  handleFetchData = async () => {
    if (this.state.contractAddress) {
      await this.fetchERC721Data();
    } else {
      alert("Please enter a contract address.");
    }
  };

  async componentDidMount() {
    await this.fetchEthereumData();
  }

  fetchEthereumData = async () => {
    try {
      const { data: pricesData } = await axios.get(
        `${endpoint}?module=stats&action=ethprice&apikey=${apiKey}`
      );
      const ethUSD = pricesData.result.ethusd;
      const ethBTC = pricesData.result.ethbtc;

      const { data: marketCapData } = await axios.get(
        `${endpoint}?module=stats&action=ethsupply&apikey=${apiKey}`
      );
      const marketCap = (parseInt(marketCapData.result.slice(0, -18)) * ethUSD).toFixed(2);

      const { data: latestBlockData } = await axios.get(
        `${endpoint}?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
      );
      const latestBlock = parseInt(latestBlockData.result, 16);

      const { data: blockDetailData } = await axios.get(
        `${endpoint}?module=proxy&action=eth_getBlockByNumber&tag=${latestBlockData.result}&boolean=true&apikey=${apiKey}`
      );
      const difficulty = `${(parseInt(blockDetailData.result.difficulty) / 1e12).toFixed(2)} TH`;

      this.setState({ ethUSD, ethBTC, latestBlock, difficulty, marketCap });
    } catch (error) {
      console.error("Error fetching Ethereum data: ", error);
    }
  };

  fetchERC721Data = async () => {
    const { contractAddress } = this.state;
    try {
      const erc721TransactionResponse = await axios.get(
        `${endpoint}?module=account&action=tokennfttx&contractaddress=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${apiKey}`
      );
      const transactions = erc721TransactionResponse.data.result || [];

      // Deduplicate transactions based on `txHash`
      const uniqueTransactions = transactions.reduce((acc, tx) => {
        if (!acc.find(item => item.hash === tx.hash)) acc.push(tx);
        return acc;
      }, []);

      this.setState({ erc721Transactions: uniqueTransactions });

      // Fetch Metadata and Price from OpenSea
      const openSeaResponse = await axios.get(`${openSeaEndpoint}/${contractAddress}/1`); // Fetch data for token ID 1, or replace with a specific token ID if needed
      const metadata = openSeaResponse.data;

      const currentPrice = metadata?.last_sale?.total_price ? 
        (parseFloat(metadata.last_sale.total_price) / 1e18).toFixed(3) + " ETH" : 
        "No Sale Yet";
      
      const previousPrice = metadata?.last_sale?.transaction?.previous_price ? 
        (parseFloat(metadata.last_sale.transaction.previous_price) / 1e18).toFixed(3) + " ETH" : 
        "No Previous Sale";
      
      const priceChangePercentage = previousPrice && currentPrice !== "No Sale Yet" ?
        ((parseFloat(currentPrice) - parseFloat(previousPrice)) / parseFloat(previousPrice) * 100).toFixed(2) + "%" :
        "No Price Change";

      this.setState({
        erc721Metadata: metadata,
        erc721Price: currentPrice,
        previousPrice,
        priceChangePercentage,
      });
    } catch (error) {
      console.error("Error fetching ERC-721 data: ", error);
    }
  };

  renderERC721Info = () => {
    const {
      erc721Transactions,
      erc721Metadata,
      erc721Price,
      previousPrice,
      priceChangePercentage,
    } = this.state;

    if (erc721Transactions.length === 0) {
      return <p>No ERC-721 transactions found.</p>;
    }

    const firstRegistrant = erc721Transactions[0].to;

    return (
      <Card>
        <Card.Content>
          <Card.Header style={{ color: "#1d6fa5" }}>
            <Icon name="image outline"></Icon> ERC-721 NFT Information
          </Card.Header>
          <Card.Description>
            <strong>First Registrant:</strong> {firstRegistrant || "Unknown"}
            <br />
            <strong>Current Price:</strong> {erc721Price}
            <br />
            <strong>Previous Price:</strong> {previousPrice}
            <br />
            <strong>Price Change:</strong> {priceChangePercentage}
            <br />
            <strong>Description:</strong> {erc721Metadata.description || "N/A"}
            <h4>Ownership History:</h4>
            <ul>
              {erc721Transactions.map((tx, index) => (
                <li key={index}>
                  <strong>From:</strong> {tx.from}, <strong>To:</strong> {tx.to},{" "}
                  <strong>Token ID:</strong> {tx.tokenID},{" "}
                  <strong>Tx Hash:</strong>{" "}
                  <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                    {tx.hash}
                  </a>
                  <QRCodeCanvas value={`https://etherscan.io/tx/${tx.hash}`} size={64} />
                </li>
              ))}
            </ul>
          </Card.Description>
        </Card.Content>
      </Card>
    );
  };

  render() {
    const { ethUSD, ethBTC, latestBlock, difficulty, marketCap } = this.state;
    return (
      <div>
        <Grid>
          <Grid.Row>
            <Grid.Column width={4}>
              <Card>
                <Card.Content>
                  <Card.Header style={{ color: "#1d6fa5" }}>
                    <Icon name="ethereum"></Icon> ETHER PRICE
                  </Card.Header>
                  <Card.Description textAlign="left">
                    <Icon name="usd"></Icon> {ethUSD} <Icon name="at"></Icon> {ethBTC} <Icon name="bitcoin"></Icon>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
            <Grid.Column width={4}>
              <Card>
                <Card.Content>
                  <Card.Header style={{ color: "#1d6fa5" }}>
                    <Icon name="list alternate outline"></Icon> LATEST BLOCK
                  </Card.Header>
                  <Card.Description textAlign="left">
                    <Icon name="square"></Icon> {latestBlock}
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
            <Grid.Column width={4}>
              <Card>
                <Card.Content>
                  <Card.Header style={{ color: "#1d6fa5" }}>
                    <Icon name="setting"></Icon> DIFFICULTY
                  </Card.Header>
                  <Card.Description textAlign="left">{difficulty}</Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
            <Grid.Column width={4}>
              <Card>
                <Card.Content>
                  <Card.Header style={{ color: "#1d6fa5" }}>
                    <Icon name="world"></Icon> MARKET CAP
                  </Card.Header>
                  <Card.Description textAlign="left">
                    <Icon name="usd"></Icon> {marketCap}
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Grid>
          <Grid.Row>
            <Grid.Column width={6}>
              <Input
                placeholder="Contract Address"
                onChange={this.handleContractAddressChange}
                value={this.state.contractAddress}
                fluid
              />
            </Grid.Column>
            <Grid.Column width={2}>
              <Button onClick={this.handleFetchData} color="blue">
                Fetch Data
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Grid divided="vertically">
          <Grid.Row>
            <Grid.Column>{this.renderERC721Info()}</Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default EthOverview;
