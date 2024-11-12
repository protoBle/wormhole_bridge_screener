interface SourceChainProps {
    list: string[];
    selected: string | null;
    onSymbolClick: (symbol: string) => void;
  }
  
export const NavBar: React.FC<SourceChainProps> = ({ list , selected, onSymbolClick }) => {

// Handler function for clicking on a symbol
const handleSymbolClick = (symbol: string) => {
    onSymbolClick(symbol);
    console.log(`Selected chain: ${symbol}`);
};

return (
    <div>
    <h1>Wormhole Bridge Audit screener{" "}  </h1>
    <div style={{ overflowX: "auto" }}>
        <table className="styled-table">
                <thead>
                    <tr>
                    <th style={{color:"green"}}>CHAIN:</th>
                        {list.map((symbol, index) => (
                            <th key={index} onClick={() => handleSymbolClick(symbol)} 
                            style={{color: symbol === selected ? "black" : "white"}}>{symbol}</th>
                        ))}
                    </tr>
                </thead>
        </table>
    </div>
    </div>
    );
};