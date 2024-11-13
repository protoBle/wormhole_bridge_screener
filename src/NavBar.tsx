interface SourceChainProps {
    list: string[];
    selected: string | null;
    text_size: string;
    onSymbolClick: (symbol: string) => void;
  }
  
export const NavBar: React.FC<SourceChainProps> = ({ list , selected, text_size, onSymbolClick }) => {

// Handler function for clicking on a symbol
const handleSymbolClick = (symbol: string) => {
    onSymbolClick(symbol);
    console.log(`Selected chain: ${symbol}`);
};

return (
    <div className="flex items-center justify-center">
        <div className="flex space-x-4 p-0 rounded-md border-b-2 overflow-x-auto">
            
            {list.map((symbol, index) => (
                <button onClick={() => handleSymbolClick(symbol)} className={`relative px-4 py-2 text-black rounded ${text_size}`}>
                    {symbol}
                    <span
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-blue-300 ${
                        symbol === selected ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                    }`}></span>
                </button>
            ))}
        </div>
    </div>
    );
};