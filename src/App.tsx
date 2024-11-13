import React from 'react';
import { useState, useEffect } from "react";
import {fetchTokenSymbolsfromCSV, fetchTokenDatafromCSV} from "./tokenUtils"
import './App.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { NavBar } from "./NavBar"

interface TableComponentProps {
  data: { [key: string]: number | string };
}

const TableComponent: React.FC<TableComponentProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto my-8">
      <table className="w-1/2 mx-auto table-auto border-collapse text-left text-sm text-gray-500 rounded-lg border">
        <thead className="bg-blue-300">
          <tr>
            <th className="px-6 py-3 font-semibold text-gray-700 border-r">CHAIN</th>
            <th className="px-6 py-3 font-semibold text-gray-700">TOTAL SUPPLY</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 border-r">{key.toUpperCase()}</td>
              <td className="px-6 py-4">
                {typeof value === "number" ? value.toLocaleString() : parseFloat(value).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [symbol_list, setSymbolList] = useState<string []>([]);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [sourceChain_list, setSourceChain] = useState<string []>([]);
  const [tokenValue_map, setTokenValueMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const url = "https://raw.githubusercontent.com/wormhole-foundation/wormhole-token-list/refs/heads/main/content/by_source.csv";
  
  //fetch list of symbols once
  useEffect(() => {
      fetchTokenSymbolsfromCSV(url, selectedChain)
      .then(setSymbolList)
      .then(()=>setIsLoading(false))
      .catch((error)=>{
        console.log(error)
      })
      
  }, [selectedChain])
      
  //fetch token data, on setSelectedSymbol
  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
        try {
            const result_list = await fetchTokenDatafromCSV(url, selectedSymbol)
            const sourceChain_list= result_list[1].slice(1)
            const tokenValue_map = result_list[0]
            // Calculate sum of all values except for source and "NA" values
            const sum = Object.entries(tokenValue_map).reduce((acc, [key, value]) => {
              return (key !== selectedChain) ? acc + value : acc;
            }, 0);

            console.log("Sum:", sum);
            tokenValue_map['total']=sum

            setTokenValueMap(tokenValue_map);
            setSourceChain(sourceChain_list);
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
    source: number;
    total: number;
  }

  const bar_data : TokenData [] = [{
    name: selectedSymbol, source: tokenValue_map[selectedChain], total: tokenValue_map['total']
  }]

  if (isLoading) {
    return (
      <div>
        {header()}
        <h1>Loading...</h1>
      </div>
    );
  }

  

  return (
    <div>
      {header()}
      
      <p></p>
      <TableComponent data={tokenValue_map}/>
      {(selectedSymbol.length !== 0) && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <ResponsiveContainer width="60%" height={400} margin-left="auto" margin-right="auto">
          <BarChart layout={'horizontal'} width={400} height={400} data={bar_data} barGap={1} barSize={30}>
            <CartesianGrid strokeDasharray="2 2" stroke="#ccc"/>
            <XAxis dataKey="name" label={{ position: 'insideBottom', offset: -5, dy: 10 }} />
            <YAxis tickFormatter={(value) => value.toExponential(2)}/>
            <Tooltip />
            <Bar dataKey="source" fill="#3B82F6" />
            <Bar dataKey="total" fill="#93C5FD" />
          </BarChart>
        </ResponsiveContainer>
      </div>}
      
    </div>
  );

  function header() {
    return <>
      <h1 className="text-3xl font-bold">Portal Bridge (wormhole) Audit screener </h1>
      <h1 className="text-xs p-4">This screener is designed to verify whether the locked value on the source chain matches the minted value on the destination chain.</h1>
      <NavBar list={sourceChain_list} selected={selectedChain} text_size='text-sm' onSymbolClick={setSelectedChain}></NavBar>
      <NavBar list={symbol_list} selected={selectedSymbol} text_size='text-xs' onSymbolClick={setSelectedSymbol}></NavBar>
    </>;
  }
}

export default App;
