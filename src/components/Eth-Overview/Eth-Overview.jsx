import React, { Component } from "react";
import axios from "axios";
import { Card, Grid, Icon } from "semantic-ui-react";

// Placeholder for LatestBlocks component
const LatestBlocks = () => {
  return <p>Latest Blocks Placeholder</p>;
};

// Placeholder for LatestTxs component
const LatestTxs = () => {
  return <p>Latest Transactions Placeholder</p>;
};

// import api key from the env variable
const apiKey = "FBXGXMYSW5AGYX7P4YZV2HHCRD3439B4HG";
const openSeaEndpoint = `https://api.opensea.io/api/v1/asset`;
const contractAddress = "0xBA9BBEa08241845013b40a061E4A77c9345e4562"; // Replace with ERC-721 contract address
const tokenID = "1"; // Replace with actual token ID of the NFT
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
      erc721Transactions: [], // Ensure it's an empty array by default
      erc721Metadata: {},
      erc721Price: "",
      erc721Creator: "",
    };
  }

  async componentDidMount() {
    // get the ethereum price
    const prices = await axios.get(
      endpoint + `?module=stats&action=ethprice&apikey=${apiKey}`
    );
    let { result } = prices.data;
    this.setState({
      ethUSD: result.ethusd,
      ethBTC: result.ethbtc,
    });

    // get the market cap of ether in USD
    const marketCap = await axios.get(
      endpoint + `?module=stats&action=ethsupply&apikey=${apiKey}`
    );

    result = marketCap.data.result;
    // in wei
    const priceWei = result.toString();
    const priceEth = priceWei.slice(0, priceWei.length - 18); // Convert wei to ether

    this.setState({
      marketCap: parseInt(priceEth) * this.state.ethUSD,
    });

    // get the latest block number
    const latestBlock = await axios.get(
      endpoint + `?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    );
    this.setState({
      latestBlock: parseInt(latestBlock.data.result),
      blockNo: latestBlock.data.result, // save block no in hex
    });

    // get the block difficulty
    const blockDetail = await axios.get(
      endpoint +
        `?module=proxy&action=eth_getBlockByNumber&tag=${latestBlock.data.result}&boolean=true&apikey=${apiKey}`
    );
    result = blockDetail.data.result;

    const difficulty = parseInt(result.difficulty).toString();
    const difficultyTH = `${difficulty.slice(0, 4)}.${difficulty.slice(4, 6)} TH`;

    this.setState({
      difficulty: difficultyTH,
    });

    // Fetch ERC-721 transactions and metadata
    await this.fetchERC721Data();
  }

  // Fetch ERC-721 transactions and metadata
  fetchERC721Data = async () => {
    try {
      // 1. Fetch ERC-721 transactions (from Etherscan)
      const erc721TransactionResponse = await axios.get(
        `${endpoint}?module=account&action=tokennfttx&contractaddress=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${apiKey}`
      );

      // Ensure we receive an array of transactions
      const transactions = erc721TransactionResponse.data.result || [];
      this.setState({ erc721Transactions: Array.isArray(transactions) ? transactions : [] });

      // 2. Fetch Metadata and Price (from OpenSea)
      const openSeaResponse = await axios.get(
        `${openSeaEndpoint}/${contractAddress}/${tokenID}`
      );
      const metadata = openSeaResponse.data;
      this.setState({
        erc721Metadata: metadata,
        erc721Price: metadata.last_sale ? metadata.last_sale.total_price : "N/A",
        erc721Creator: metadata.creator ? metadata.creator.user.username : "Unknown",
      });
    } catch (error) {
      console.error("Error fetching ERC-721 data: ", error);
    }
  };

  getLatestBlocks = () => {
    if (this.state.latestBlock) {
      return <LatestBlocks latestBlock={this.state.latestBlock}></LatestBlocks>;
    }
  };

  getLatestTxs = () => {
    if (this.state.blockNo) {
      return <LatestTxs blockNo={this.state.blockNo}></LatestTxs>;
    }
  };

  // Render ERC-721 transactions and metadata
  renderERC721Info = () => {
    const { erc721Transactions, erc721Metadata, erc721Price, erc721Creator } = this.state;

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
            <strong>Name:</strong> {erc721Metadata.name || "N/A"}
            <br />
            <strong>Creator:</strong> {erc721Creator || "Unknown"}
            <br />
            <strong>Current Price:</strong> {erc721Price !== "N/A" ? `${erc721Price} ETH` : "Not Available"}
            <br />
            <strong>Description:</strong> {erc721Metadata.description || "N/A"}
            <br />
            <h4>Ownership History:</h4>
            <ul>
              {erc721Transactions.map((tx, index) => (
                <li key={index}>
                  <strong>From:</strong> {tx.from}, <strong>To:</strong> {tx.to},{" "}
                  <strong>Token ID:</strong> {tx.tokenID}, <strong>Tx Hash:</strong>{" "}
                  <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                    {tx.hash}
                  </a>
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
