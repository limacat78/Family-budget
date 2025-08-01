interface HeaderProps {
  currentUser: "person1" | "person2";
  setCurrentUser: (user: "person1" | "person2") => void;
}

const Header = ({ currentUser, setCurrentUser }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="material-icons text-primary text-3xl">account_balance_wallet</span>
          <h1 className="text-xl font-semibold font-inter text-primary">Gestor de Orçamento Familiar</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Utilizador:</span>
          <div className="relative">
            <select 
              id="user-select" 
              className="bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value as "person1" | "person2")}
            >
              <option value="person1">Cat</option>
              <option value="person2">Gui</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
