import AddHouseholdExpenseForm from "./AddHouseholdExpenseForm";
import HouseholdStats from "./HouseholdStats";
import MonthlyHouseholdTransactions from "./MonthlyHouseholdTransactions";
import { useQuery } from "@tanstack/react-query";
import { SummaryData, HouseholdExpense } from "../../types";
import { Skeleton } from "@/components/ui/skeleton";

const HouseholdTab = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });
  
  // Buscar todas as despesas da casa diretamente
  const { data: householdExpenses, isLoading: expensesLoading } = useQuery<HouseholdExpense[]>({
    queryKey: ["/api/household-expense"],
  });
  
  const isLoading = summaryLoading || expensesLoading;
  
  // Criar um array de transações combinando os dados recebidos com o tipo correto
  const allTransactions = householdExpenses?.map(expense => ({
    ...expense,
    type: 'household-expense' as const
  })) || [];

  return (
    <div>
      {/* Formulário e Transações lado a lado com espaçamento adequado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="md:pr-2">
          <AddHouseholdExpenseForm />
        </div>
        <div className="md:pl-2">
          {isLoading ? (
            <Skeleton className="w-full h-[400px]" />
          ) : (
            <MonthlyHouseholdTransactions transactions={allTransactions} />
          )}
        </div>
      </div>
      
      {/* Estatísticas da casa */}
      <div className="mt-4">
        <HouseholdStats />
      </div>
    </div>
  );
};

export default HouseholdTab;
