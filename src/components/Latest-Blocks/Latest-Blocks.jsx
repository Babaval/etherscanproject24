import React, { Component } from "react";
import { Table, Label } from "semantic-ui-react";
import axios from "axios";

const apiKey = "FBXGXMYSW5AGYX7P4YZV2HHCRD3439B4HG";
const endpoint = `https://api.etherscan.io/api`;

class LatestBlocks extends Component {
  constructor(props) {
    super(props); // Fix: Call super(props)
    this.state = {
      blocks: [],
    };
  }

  componentDidMount = () => {
    this.getBlocks();
  };

  getBlocks = async () => {
    const { latestBlock } = this.props;
  
    let blocks = [];
  
    // Check if latestBlock exists
    if (latestBlock) {
      for (let i = 0; i < 2; i++) {
        try {
          // Get the block transaction
          const blockDetail = await axios.get(
            endpoint +
              `?module=proxy&action=eth_getBlockByNumber&tag=${(
                latestBlock - i
              ).toString(16)}&boolean=true&apikey=${apiKey}`
          );
  
          const { result } = blockDetail.data;
  
          // Ensure result and result.transactions exist
          if (result && result.transactions) {
            blocks.push(
              <Table.Row key={i}>
                <Table.Cell>
                  <Label color="blue">Bk</Label> {latestBlock - i}
                </Table.Cell>
                <Table.Cell>
                  Miner {result.miner} <br />
                  Txs {result.transactions.length} {/* Safely access transactions */}
                </Table.Cell>
                <Table.Cell>
                  <Label color="blue">Size</Label> {parseInt(result.size)} bytes
                </Table.Cell>
              </Table.Row>
            );
          } else {
            console.error(`No transactions found for block ${latestBlock - i}`);
          }
  
          this.setState({
            blocks: blocks,
          });
        } catch (error) {
          console.error("Error fetching block details:", error);
        }
      }
    }
  };  

  render() {
    return (
      <Table fixed>
        <Table.Header>
          <Table.Row>
            <Table.Cell style={{ color: "#1d6fa5" }}>
              <h4>Latest Blocks</h4>
            </Table.Cell>
          </Table.Row>
        </Table.Header>

        <Table.Body>{this.state.blocks}</Table.Body>
      </Table>
    );
  }
}

export default LatestBlocks;
