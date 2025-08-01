import StatCard from "./StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { SummaryData } from "../../types";

const OverviewSection = () => {
  // Usando diretamente a query para obter os dados de resumo
  const { data: summary, isLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
    refetchInterval: 2000, // Atualiza a cada 2 segundos para garantir dados atualizados
  });

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold font-inter mb-4">Visão Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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

  // Dados de exemplo para renderizar enquanto estamos trabalhando na integração com a API
  const demoData = {
    incomes: { person1: 2500, person2: 2200, total: 4700 },
    expenses: {
      person1: { personal: 850, household: 600, total: 1450 },
      person2: { personal: 780, household: 550, total: 1330 },
      household: { total: 1150 }
    },
    balances: { person1: 1050, person2: 870, total: 1920 },
    vacation: {
      savings: 750,
      progress: 37.5,
      contributions: [],
      goal: { targetAmount: 2000 }
    },
    emergency: {
      savings: 250,
    },
    recentTransactions: []
  };

  // Use o summary se disponível, senão use os dados de exemplo
  const data = summary || demoData;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold font-inter mb-4">Visão Geral</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Receitas Mensais"
          value={data.incomes.total}
          icon="payments"
          iconColor="green"
          trend={{ value: 4.6, direction: "up" }}
          trendText="desde o mês passado"
        />
        
        <StatCard 
          title="Despesas Mensais"
          value={data.expenses.person1.personal + data.expenses.person2.personal + data.expenses.household.total}
          icon="shopping_cart"
          iconColor="red"
          trend={{ value: 2.8, direction: "up" }}
          trendText="desde o mês passado"
        />
        
        <StatCard 
          title="Saldo Mensal"
          value={data.balances.total}
          icon="savings"
          iconColor="blue"
          trend={{ value: 7.2, direction: "up" }}
          trendText="desde o mês passado"
        />
        
        <StatCard 
          title="Fundo de Férias"
          value={data.vacation.savings}
          icon="beach_access"
          iconColor="yellow"
          progressBar={{
            current: data.vacation.savings,
            target: data.vacation.goal?.targetAmount || 1,
            label: `${Math.round(data.vacation.progress)}% do objetivo`
          }}
        />
        
        <StatCard 
          title="Fundo de Emergência"
          value={data.emergency?.savings || 0}
          icon="shield"
          iconColor="purple"
          trend={{ value: 5.0, direction: "up" }}
          trendText="desde o mês passado"
        />
      </div>
    </section>
  );
};

export default OverviewSection;
