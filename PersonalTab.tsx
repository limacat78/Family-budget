import React from "react";
import AddIncomeForm from "./AddIncomeForm";
import AddExpenseForm from "./AddExpenseForm";
import PersonalStats from "./PersonalStats";
import PersonalTransactions from "./PersonalTransactionsNew";
import PersonalOverview from "./PersonalOverview";
import { useQuery } from "@tanstack/react-query";
import { SummaryData } from "../../types";
import { Skeleton } from "@/components/ui/skeleton";

// Função para obter a chave do mês atual no formato "YYYY-MM"
const getMonthKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

interface PersonalTabProps {
  userId: number;
}

const PersonalTab = ({ userId }: PersonalTabProps) => {
  const { data: summary, isLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });

  // Buscar todas as despesas pessoais
  const { data: personalExpenses, isLoading: isExpensesLoading } = useQuery<any[]>({
    queryKey: ["/api/personal-expense", userId],
  });
  
  // Buscar todas as receitas pessoais
  const { data: personalIncomes, isLoading: isIncomesLoading } = useQuery<any[]>({
    queryKey: ["/api/income", userId],
  });

  return (
    <div>
      {/* Visão Geral Personalizada */}
      <PersonalOverview userId={userId} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quadrante superior esquerdo: Formulário de Receitas */}
        <div>
          <AddIncomeForm userId={userId} />
        </div>
        
        {/* Quadrante superior direito: Formulário de Despesas */}
        <div>
          <AddExpenseForm userId={userId} />
        </div>
        
        {/* Quadrante inferior esquerdo: Transações Pessoais */}
        <div>
          {isLoading || isExpensesLoading || isIncomesLoading ? (
            <Skeleton className="w-full h-full min-h-[400px]" />
          ) : (
            <PersonalTransactions 
              expenses={personalExpenses || []}
              incomes={personalIncomes || []}
              userId={userId} 
            />
          )}
        </div>
        
        {/* Quadrante inferior direito: Estatísticas Pessoais */}
        <div>
          <PersonalStats userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default PersonalTab;
