import StatCard from "../overview/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { SummaryData, PersonalExpense, Income } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface PersonalOverviewProps {
  userId: number;
}

const PersonalOverview = ({ userId }: PersonalOverviewProps) => {
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });
  
  const { data: personalExpenses, isLoading: expensesLoading } = useQuery<PersonalExpense[]>({
    queryKey: ['/api/personal-expense', userId],
    select: (data) => data.filter(expense => expense.userId === userId),
  });
  
  const { data: incomes, isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/income', userId],
    select: (data) => data.filter(income => income.userId === userId),
  });

  const isLoading = summaryLoading || expensesLoading || incomesLoading;

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold font-inter mb-4">Visão Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mt-3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Calcular valores pessoais
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  
  // Filtrar transações do mês atual
  const currentMonthExpenses = personalExpenses?.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date instanceof Date ? expense.date.toISOString() : expense.date.toString();
    return expenseDate.slice(0, 7) === currentMonth;
  }) || [];
  
  const currentMonthIncomes = incomes?.filter(income => {
    if (!income.date) return false;
    const incomeDate = income.date instanceof Date ? income.date.toISOString() : income.date.toString();
    return incomeDate.slice(0, 7) === currentMonth;
  }) || [];

  // Calcular totais mensais
  const monthlyIncome = currentMonthIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
  const monthlyExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Calcular média diária de gastos (excluindo categorias especiais de fundos)
  const specialFundCategories = [
    'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
    'Poupança', 'Poupanca', 'poupanca', 
    'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
    'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
  ];
  
  const expensesForDailyAverage = currentMonthExpenses.filter(expense => 
    !specialFundCategories.includes(expense.category)
  );
  
  const monthlyExpensesForAverage = expensesForDailyAverage.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
  
  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dailyAverage = monthlyExpensesForAverage / daysInMonth;

  // Nome do usuário
  const userName = userId === 1 ? 'Cat' : 'Gui';
  const userPersonId = userId === 1 ? 'person1' : 'person2';

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold font-inter mb-4">Visão Geral - {userName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Receitas Mensais"
          value={monthlyIncome}
          icon="payments"
          iconColor="green"
          trend={{ value: 5, direction: "up" }}
          trendText="desde o mês passado"
        />
        
        <StatCard 
          title="Despesas Mensais"
          value={monthlyExpenses}
          icon="shopping_cart"
          iconColor="red"
          trend={{ value: 3, direction: "up" }}
          trendText="desde o mês passado"
        />
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Média Diária Gastos</p>
              <h3 className="text-2xl font-semibold mt-1">{formatCurrency(dailyAverage)}</h3>
            </div>
            <div className="text-purple-500 bg-purple-100 p-2 rounded-full flex items-center justify-center w-10 h-10">
              <span className="text-lg font-bold">€</span>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-green-600 flex items-center">
            <span className="material-icons text-sm mr-1">trending_up</span>
            <span>2%</span> por dia
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalOverview;