import React from 'react';
import { useState, useEffect } from "react";
import {fetchTokenSymbolsfromCSV, fetchTokenDatafromCSV, getTokenData} from "./tokenUtils"
import './App.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';


interface TableComponentProps {
  data: { [key: string]: number | string };
}

const TableComponent: React.FC<TableComponentProps> = ({ data }) => {
  return (
    <div style={{padding: "0 20px"}}>
      <table className="styled-table">
        <tbody>
        <tr>
          <th>Symbol</th>
          <th>TotalSupply</th>
        </tr>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} >
              <td style={{ textAlign: "left" }}>{key.toUpperCase()}</td>
              <td style={{ textAlign: "left" }}>
                {typeof value === "number" ? value.toLocaleString() : parseFloat(value).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface CryptoTableProps {
  cryptoSymbols: string[];
  onSymbolClick: (symbol: string) => void;
}

const CryptoTable: React.FC<CryptoTableProps> = ({ cryptoSymbols , onSymbolClick }) => {
  const symbolsWithoutFirst = cryptoSymbols.slice(1)

  // Handler function for clicking on a symbol
  const handleSymbolClick = (symbol: string) => {
    onSymbolClick(symbol);
    console.log(`Selected symbol: ${symbol}`);
  };

  return (
    <div>
      <h1>Wormhole Bridge Audit screener{" "}  </h1>
      <div style={{ overflowX: "auto" }}>
          <table className="styled-table">
                <thead>
                    <tr>
                        {symbolsWithoutFirst.map((symbol, index) => (
                           <th key={index} onClick={() => handleSymbolClick(symbol)}>{symbol}</th>
                        ))}
                    </tr>
                </thead>
          </table>
      </div>
    </div>
  );
};

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [symbol_list, setSymbolList] = useState<string []>([]);
  const [tokenValue_map, setTokenValueMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const url = "https://raw.githubusercontent.com/wormhole-foundation/wormhole-token-list/refs/heads/main/content/by_source.csv";
  
  //fetch list of symbols once
  useEffect(() => {
    const fetchSymbol = async () => {
      
      const symbol_list = await fetchTokenSymbolsfromCSV(url)
      setSymbolList(symbol_list);
    }
    fetchSymbol()
  }, [])
      
  //fetch token data, on setSelectedSymbol
  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
        try {
            const tokenValue_map = await fetchTokenDatafromCSV(url, selectedSymbol)
            // Calculate sum of all values except for "eth" and "NA" values
            const sum = Object.entries(tokenValue_map).reduce((acc, [key, value]) => {
              return (key !== "eth") ? acc + value : acc;
            }, 0);

            console.log("Sum:", sum);
            tokenValue_map['total']=sum

            setTokenValueMap(tokenValue_map);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [selectedSymbol]);


  interface TokenData {
    name: string;
    value: number;
  }

  // Convert data to an array suitable for Recharts, excluding zero values
  const bar_data: TokenData[] = Object.entries(tokenValue_map)
  .filter(([, value]) => value > 0)
  .map(([name, value]) => ({
    name,
    value: value as number,
  }));

  if (isLoading) {
    return (
      <div>
        <CryptoTable cryptoSymbols={symbol_list} onSymbolClick={setSelectedSymbol}></CryptoTable>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div>
      <CryptoTable cryptoSymbols={symbol_list} onSymbolClick={setSelectedSymbol}></CryptoTable>
      <TableComponent data={tokenValue_map}/>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <ResponsiveContainer width="60%" height={400} margin-left="auto" margin-right="auto">
          <BarChart layout={'horizontal'} width={400} height={400} data={bar_data} barGap={10} barSize={30}>
            <CartesianGrid strokeDasharray="2 2" stroke="#ccc"/>
            <XAxis dataKey="name" label={{ position: 'insideBottom', offset: -5, dy: 10 }} />
            <YAxis tickFormatter={(value) => value.toExponential(2)}/>
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}

export default App;
