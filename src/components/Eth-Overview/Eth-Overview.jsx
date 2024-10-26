import React, { Component } from "react";
import axios from "axios";
import { Card, Grid, Icon, Input, Button } from "semantic-ui-react";
import { QRCodeCanvas } from "qrcode.react"; // Correct import for QRCode

const apiKey = "FBXGXMYSW5AGYX7P4YZV2HHCRD3439B4HG"; // Your Etherscan API Key
const openSeaEndpoint = `https://api.opensea.io/api/v1/asset`;
const endpoint = `https://api.etherscan.io/api`;

class EthOverview extends Component {
  constructor() {
    super();
    this.state = {
      ethUSD: "",
      ethBTC: "",
      blockNo: "",
      latestBlock: 0,
      difficulty: "",
      marketCap: 0,
      erc721Transactions: [],
      erc721Metadata: {},
      erc721Price: "",
      erc721Creator: "",
      previousPrice: "N/A",
      priceChangePercentage: "N/A",
      contractAddress: "", // Dynamic input for contract address
    };

    // Bind methods
    this.getLatestBlocks = this.getLatestBlocks.bind(this);
    this.getLatestTxs = this.getLatestTxs.bind(this);
    this.fetchERC721Data = this.fetchERC721Data.bind(this); // Re-bind fetch method for dynamic calls
    this.handleContractAddressChange =
      this.handleContractAddressChange.bind(this);
    this.handleFetchData = this.handleFetchData.bind(this);
  }

  // Handle contract address input change
  handleContractAddressChange(event) {
    this.setState({ contractAddress: event.target.value });
  }

  // Fetch data based on user inputs
  async handleFetchData() {
    if (this.state.contractAddress) {
      // Fetch ERC-721 data (transactions and metadata) when input is valid
      await this.fetchERC721Data();
    } else {
      alert("Please enter a contract address.");
    }
  }

  async componentDidMount() {
    // Fetch basic Ethereum data (price, block, market cap)
    const prices = await axios.get(
      endpoint + `?module=stats&action=ethprice&apikey=${apiKey}`
    );
    let { result } = prices.data;
    this.setState({
      ethUSD: result.ethusd,
      ethBTC: result.ethbtc,
    });

    const marketCap = await axios.get(
      endpoint + `?module=stats&action=ethsupply&apikey=${apiKey}`
    );
    result = marketCap.data.result;
    const priceWei = result.toString();
    const priceEth = priceWei.slice(0, priceWei.length - 18);
    this.setState({
      marketCap: parseInt(priceEth) * this.state.ethUSD,
    });

    const latestBlock = await axios.get(
      endpoint + `?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    );
    this.setState({
      latestBlock: parseInt(latestBlock.data.result),
      blockNo: latestBlock.data.result,
    });

    const blockDetail = await axios.get(
      endpoint +
        `?module=proxy&action=eth_getBlockByNumber&tag=${latestBlock.data.result}&boolean=true&apikey=${apiKey}`
    );
    result = blockDetail.data.result;
    const difficulty = parseInt(result.difficulty).toString();
    const difficultyTH = `${difficulty.slice(0, 4)}.${difficulty.slice(
      4,
      6
    )} TH`;

    this.setState({
      difficulty: difficultyTH,
    });
  }

  // Fetch ERC-721 transactions and metadata
  fetchERC721Data = async () => {
    const { contractAddress } = this.state;
    try {
      const erc721TransactionResponse = await axios.get(
        `${endpoint}?module=account&action=tokennfttx&contractaddress=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${apiKey}`
      );
      const transactions = erc721TransactionResponse.data.result || [];
      this.setState({
        erc721Transactions: Array.isArray(transactions) ? transactions : [],
      });

      const openSeaResponse = await axios.get(
        `${openSeaEndpoint}/${contractAddress}`
      );
      const metadata = openSeaResponse.data;

      let currentPrice = "N/A";
      let previousPrice = "N/A";
      let priceChangePercentage = "N/A";

      // Check if `last_sale` exists
      if (metadata.last_sale) {
        const lastSale = metadata.last_sale;

        // Ensure total_price exists for the last sale
        if (lastSale.total_price) {
          currentPrice = parseFloat(lastSale.total_price) / 1e18; // Convert from wei to ETH
        }

        // Check if previous_price exists in transaction history
        if (lastSale.transaction && lastSale.transaction.previous_price) {
          previousPrice =
            parseFloat(lastSale.transaction.previous_price) / 1e18;
          priceChangePercentage =
            ((currentPrice - previousPrice) / previousPrice) * 100;
        } else {
          // Fallback message if no previous price is available
          previousPrice = "No Previous Sale";
        }
      } else {
        // Fallback when there's no last sale at all
        currentPrice = "No Sale Yet";
        priceChangePercentage = "No Price Change";
      }

      this.setState({
        erc721Metadata: metadata,
        erc721Price:
          currentPrice !== "N/A"
            ? `${currentPrice.toFixed(3)} ETH`
            : "Not Available",
        previousPrice:
          previousPrice !== "N/A"
            ? `${previousPrice.toFixed(3)} ETH`
            : "No Previous Sale",
        priceChangePercentage:
          priceChangePercentage !== "N/A"
            ? `${priceChangePercentage.toFixed(2)}%`
            : "No Price Change",
        erc721Creator: metadata.creator
          ? metadata.creator.user.username
          : "Unknown",
      });
    } catch (error) {
      console.error("Error fetching ERC-721 data: ", error);
    }
  };

  // Render ERC-721 transactions and metadata with QR code
  renderERC721Info = () => {
    const {
      erc721Transactions,
      erc721Metadata,
      erc721Price,
      erc721Creator,
      previousPrice,
      priceChangePercentage,
    } = this.state;

    if (!Array.isArray(erc721Transactions) || erc721Transactions.length === 0) {
      return <p>No ERC-721 transactions found.</p>;
    }

    return (
      <Card>
        <Card.Content>
          <Card.Header style={{ color: "#1d6fa5" }}>
            <Icon name="image outline"></Icon> ERC-721 NFT Information
          </Card.Header>
          <Card.Description>
            <strong>First Registrant:</strong>{" "}
            {erc721Transactions.length > 0
              ? erc721Transactions[0].to
              : "Unknown"}
            <br />
            <strong>Current Price:</strong>{" "}
            {erc721Price !== "N/A" ? `${erc721Price}` : "Not Available"}
            <br />
            <strong>Previous Price:</strong>{" "}
            {previousPrice !== "N/A" ? `${previousPrice}` : "No Previous Sale"}
            <br />
            <strong>Price Change:</strong>{" "}
            {priceChangePercentage !== "N/A"
              ? `${priceChangePercentage}`
              : "No Price Change"}
            <br />
            <strong>Description:</strong> {erc721Metadata.description || "N/A"}
            <br />
            <h4>Ownership History:</h4>
            <ul>
              {erc721Transactions.map((tx, index) => (
                <li key={index}>
                  <strong>From:</strong> {tx.from}, <strong>To:</strong> {tx.to}
                  , <strong>Token ID:</strong> {tx.tokenID},{" "}
                  <strong>Tx Hash:</strong>{" "}
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tx.hash}
                  </a>
                  {/* Use QRCodeCanvas to show QR Code for each transaction */}
                  <QRCodeCanvas
                    value={`https://etherscan.io/tx/${tx.hash}`}
                    size={64}
                  />
                </li>
              ))}
            </ul>
          </Card.Description>
        </Card.Content>
      </Card>
    );
  };

  // Methods for getting the latest blocks and transactions (placeholders for now)
  getLatestBlocks() {
    return <p>Block No: {this.state.latestBlock}</p>;
  }

  getLatestTxs() {
    return <p>Block No (Hex): {this.state.blockNo}</p>;
  }

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
                    <Icon name="usd"></Icon>
                    {ethUSD} <Icon name="at"></Icon> {ethBTC}{" "}
                    <Icon name="bitcoin"></Icon>
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
                  <Card.Description textAlign="left">
                    {difficulty}
                  </Card.Description>
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

        {/* Input fields for contract address and token ID */}
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
          <Grid.Row columns={2}>
            <Grid.Column>{this.getLatestBlocks()}</Grid.Column>
            <Grid.Column>{this.getLatestTxs()}</Grid.Column>
          </Grid.Row>

          {/* New section for ERC-721 Information */}
          <Grid.Row>
            <Grid.Column>{this.renderERC721Info()}</Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default EthOverview;
