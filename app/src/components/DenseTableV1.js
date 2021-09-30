import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { BN, Program, Provider, web3 } from "@project-serum/anchor";
import idl2 from "../idl2.json";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const { SystemProgram, Keypair } = web3;
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed",
};
const programID = new PublicKey(idl2.metadata.address);

export default function DenseTable(props) {
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [number, setNumber] = useState(0);
  const [price, setPrice] = useState(0);
  const [value, setValue] = useState("");
  async function getProvider() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, wallet, opts.preflightCommitment);
    return provider;
  }

  const [projectList, setProjectList] = useState([]);

  React.useEffect(() => {
    async function getAllProjects() {
      const provider = await getProvider();
      const program = new Program(idl2, programID, provider);
      return await program.account.project.all();
    }
    // Create an scoped async function in the hook
    getAllProjects().then((projects) => {
      let pl = [];
      projects.forEach((p) => {
        // p.publicKey
        // p.account
        pl.push({
          name: p.account.name,
          number: p.account.totalOffset.toString(),
          price: p.account.offsetPrice.toString(),
          address: p.publicKey,
        });
      });
      setProjectList(pl);
      console.log(projectList[0]);
    });
  }, [projectList]);
  async function update(name, number, price) {
    if (!name) return;
    const provider = await getProvider();
    const projectAccount = web3.Keypair.generate();
    const program = new Program(idl2, programID, provider);
    const tx = await program.rpc.create(new BN(number), new BN(price), name, {
      accounts: {
        project: projectAccount.publicKey,

        seller: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },

      signers: [projectAccount],
    });
  }
  async function buy() {
    const provider = await getProvider();
    const program = new Program(idl2, programID, provider);
    const sellerAccount = web3.Keypair.generate();
    await program.rpc.buy(new BN(3), {
      accounts: {
        //unsure what to put here
        project: projectList[0].address,
        buyer: provider.wallet.publicKey,
        seller: sellerAccount.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
      //unsure what to put here
      signers: [],
    });
  }

  if (!wallet.connected) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <WalletMultiButton />
      </div>
    );
  } else {
    return (
      <div>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Dessert (100g serving)</TableCell>
                <TableCell align="right">Project Name</TableCell>
                <TableCell align="right">CO2e Available (T)</TableCell>
                <TableCell align="right">CO2e Sold (T)</TableCell>
                <TableCell align="right">Price(g)</TableCell>
                <button
                  onClick={() => {
                    buy();
                  }}
                >
                  purchase 10
                </button>
              </TableRow>
            </TableHead>
            <TableBody>
              {projectList.map((row) => (
                <TableRow
                  key={row}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.number}</TableCell>
                  <TableCell align="right">{row.price}</TableCell>
                  <TableCell align="right">{row.address.toString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div>
          {!value && (
            <button
              onClick={() => {
                setValue("connected");
              }}
            >
              Initialize
            </button>
          )}
          {value ? (
            <div>
              <h2>{value}</h2>
              <input
                placeholder="name"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
              <input
                placeholder="number"
                onChange={(e) => setNumber(e.target.value)}
              />
              <input
                placeholder="amount"
                onChange={(e) => setPrice(e.target.value)}
              />
              <button onClick={() => update(name, number, price)}>
                Create New Project
              </button>
            </div>
          ) : (
            <h3>Click here to Initialize</h3>
          )}
        </div>
      </div>
    );
  }
}
