interface TabNavigationProps {
  activeTab: "personal" | "household" | "vacation" | "annual";
  onTabChange: (tab: "personal" | "household" | "vacation" | "annual") => void;
}

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const getTabClasses = (tab: string) => {
    return activeTab === tab 
      ? "border-primary text-primary border-b-2 font-medium text-sm"
      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent font-medium text-sm";
  };
  
  return (
    <div className="mb-8 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button 
          className={`px-1 py-4 ${getTabClasses("annual")}`}
          onClick={() => onTabChange("annual")}
        >
          Resumo Anual
        </button>
        <button 
          className={`px-1 py-4 ${getTabClasses("personal")}`}
          onClick={() => onTabChange("personal")}
        >
          Pessoal
        </button>
        <button 
          className={`px-1 py-4 ${getTabClasses("household")}`}
          onClick={() => onTabChange("household")}
        >
          Casa
        </button>
        <button 
          className={`px-1 py-4 ${getTabClasses("vacation")}`}
          onClick={() => onTabChange("vacation")}
        >
          Férias
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;
