import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { PersonalExpense, Income, SummaryData } from "../../types";
import { formatDate } from "@/utils/formatters";
import { useState, useEffect, useRef } from "react";
import { CalendarIcon, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { Chart, registerables, ChartType, Plugin, ChartData } from 'chart.js';

Chart.register(...registerables);
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PersonalStatsProps {
  userId: number;
  selectedMonth?: string;
}

const PersonalStats = ({ userId, selectedMonth }: PersonalStatsProps) => {
  // Todos os hooks no topo do componente
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);
  
  // Estado para o mês selecionado
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [showMonthDialog, setShowMonthDialog] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });
  
  const { data: personalExpenses, isLoading: expensesLoading } = useQuery<PersonalExpense[]>({
    queryKey: ['/api/personal-expense', userId],
    // Garantir que as despesas são específicas para este usuário
    select: (data) => data.filter(expense => expense.userId === userId),
  });
  
  const { data: incomes, isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/income', userId],
    // Garantir que as receitas são específicas para este usuário
    select: (data) => data.filter(income => income.userId === userId),
  });
  
  const isLoading = summaryLoading || expensesLoading || incomesLoading;

  // Função para obter a chave do mês atual no formato "YYYY-MM"
  const getMonthKey = (date = new Date()) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Função para formatar a chave do mês para exibição (ex: "Maio 2025")
  const formatMonthKey = (key: string): string => {
    const [year, month] = key.split('-');
    const monthNum = parseInt(month) - 1; // Ajuste para índice base 0 dos meses
    return `${getMonthName(monthNum)} ${year}`;
  };

  // Função auxiliar para obter nome do mês em português
  const getMonthName = (monthNum: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNum];
  };

  // Inicializar o mês atual quando o componente for montado
  useEffect(() => {
    const defaultMonth = getMonthKey();
    setCurrentMonth(selectedMonth || defaultMonth);
    
    // Gerar alguns meses para o seletor (últimos 6 meses)
    const today = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(getMonthKey(date));
    }
    setAvailableMonths(months);
  }, [selectedMonth]);

  // Filtrar transações para o mês atual
  const filterTransactionsByMonth = (transactions: any[]) => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      const transactionMonth = getMonthKey(date);
      return transactionMonth === currentMonth;
    });
  };
  
  // Dados de exemplo para desenvolvimento
  const demoSummary = {
    incomes: { person1: 2500, person2: 2200, total: 4700 },
    expenses: {
      person1: { personal: 850, household: 600, total: 1450 },
      person2: { personal: 780, household: 550, total: 1330 },
      household: { total: 1150 }
    },
    balances: { person1: 1050, person2: 870, total: 1920 },
    vacation: { savings: 750, progress: 37.5, contributions: [], goal: { targetAmount: 2000 } },
    recentTransactions: []
  };

  const demoPersonalExpenses = [
    { id: 1, date: '2023-05-15', description: 'Supermercado', amount: 120, category: 'Alimentação', userId: 1, type: 'personal-expense' },
    { id: 2, date: '2023-05-12', description: 'Cinema', amount: 40, category: 'Lazer', userId: 1, type: 'personal-expense' },
    { id: 3, date: '2023-05-10', description: 'Combustível', amount: 80, category: 'Transporte', userId: 1, type: 'personal-expense' }
  ] as PersonalExpense[];

  const demoIncomes = [
    { id: 1, date: '2023-05-05', description: 'Salário', amount: 2500, category: 'Salário', userId: 1, type: 'income' }
  ] as Income[];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Estatísticas Pessoais</CardTitle>
          <Button variant="outline" size="sm" disabled>
            <CalendarIcon className="h-4 w-4 mr-1" />
            Carregando...
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[180px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  // Use dados reais ou de exemplo
  const data = summary || demoSummary;
  const allExpenses = personalExpenses || demoPersonalExpenses;
  const allIncomes = incomes || demoIncomes;
  
  // Filtrar por mês selecionado
  const expenses = filterTransactionsByMonth(allExpenses);
  const userIncomes = filterTransactionsByMonth(allIncomes);
  
  // Calcular valores para o usuário atual
  const userPersonId = userId === 1 ? 'person1' : 'person2';
  const userName = userId === 1 ? 'Cat' : 'Gui';
  
  // Calcular totais de receitas e despesas usando apenas os dados deste usuário específico
  // Ignorar os dados do resumo geral e calcular apenas com as transações filtradas pelo userId
  const totalIncome = userIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
  const balance = totalIncome - totalExpenses;
  
  // Calcular média diária de gastos (excluindo categorias especiais de fundos)
  const specialFundCategories = [
    'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
    'Poupança', 'Poupanca', 'poupanca', 
    'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
    'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
  ];
  
  const expensesForDailyAverage = expenses.filter(expense => 
    !specialFundCategories.includes(expense.category)
  );
  
  const totalExpensesForAverage = expensesForDailyAverage.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
  
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const averageDailyExpense = totalExpensesForAverage / daysInMonth;
  
  // Obter categorias de despesas e seus valores
  const categoryAmounts = expenses.reduce((acc: Record<string, number>, expense) => {
    // Normalizar o nome da categoria para agrupar corretamente
    let category = expense.category.toLowerCase().trim();
    
    // Padronizar todas as categorias para garantir consistência e exibição correta
    if (category.includes('seguro') && category.includes('carro')) {
      category = 'seguro_carro';
    } else if ((category.includes('prestacao') || category.includes('prestação')) && category.includes('carro')) {
      category = 'prestacao_carro';
    } else if (category.includes('comun') || category === 'telemovel' || category === 'telemóvel') {
      category = 'telemovel';
    } else if (category.includes('poupança') || category.includes('poupanca')) {
      category = 'poupanca';
    } else if (category.includes('fundo') && category.includes('emer')) {
      category = 'fundo_emergencia';
    } else if (category.includes('fundo') && (category.includes('feria') || category.includes('féria'))) {
      category = 'fundo_ferias';
    } else if (category.includes('fundo') && category.includes('obra')) {
      category = 'fundo_obras';
    } else if (category.includes('sau')) {
      category = 'saude';
    } else if (category.includes('manuten') && category.includes('conta')) {
      category = 'manutencao_conta';
    } else if (category === 'iuc') {
      category = 'iuc';
    }
    
    // Garantir que todas as categorias são normalizadas para o mesmo formato
    category = category.replace(/ /g, '_').replace(/-/g, '_');
    
    // Logar para verificar a normalização das categorias
    console.log(`Categoria normalizada: "${expense.category}" => "${category}"`);
    
    // Se for "PPR", garantir que é sempre em maiúsculas
    if (category.toLowerCase() === 'ppr') {
      category = 'ppr';
    }
    
    // Se for telemóvel, garantir que é mapeado corretamente
    if (category === 'telemovel' || category === 'telemóvel') {
      category = 'telemovel';
    }
    
    // Usar o valor absoluto para garantir que categorias negativas sejam contabilizadas corretamente
    acc[category] = (acc[category] || 0) + Math.abs(Number(expense.amount));
    return acc;
  }, {});
  
  // Ordenar categorias por valor para encontrar as principais
  const sortedCategories = Object.entries(categoryAmounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Categoria com maior gasto
  const largestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  
  // Calcular o total de despesas pessoais (excluindo fundos de poupança)
  const excludedCategories = [
    'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
    'Poupança', 'Poupanca', 'poupanca', 
    'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
    'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
  ];
  
  const personalExpensesFiltered = expenses.filter(expense => 
    !excludedCategories.includes(expense.category)
  );
  
  const totalPersonalExpensesFiltered = personalExpensesFiltered.reduce((sum, expense) => 
    sum + Math.abs(Number(expense.amount)), 0
  );



  // Gerar cores para o gráfico de categorias
  const categoryColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-indigo-500',
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          Estatísticas Pessoais - {userName}
          <span className="ml-2 text-sm text-muted-foreground font-normal">
            {formatMonthKey(currentMonth)}
          </span>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowMonthDialog(true)}
          className="flex items-center gap-1"
        >
          <CalendarIcon className="h-4 w-4" />
          Mês
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico de Barras Horizontal - Receitas vs Despesas */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Receitas vs Despesas</h3>
          <div className="space-y-4">
            {/* Barra de Receitas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Receitas</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="relative bg-gray-100 h-8 rounded-md overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500 ease-out flex items-center justify-center"
                  style={{ 
                    width: totalIncome > 0 ? `${Math.min((totalIncome / Math.max(totalIncome, totalExpenses, 1)) * 100, 100)}%` : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Barra de Despesas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Despesas</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="relative bg-gray-100 h-8 rounded-md overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-500 ease-out flex items-center justify-center"
                  style={{ 
                    width: totalExpenses > 0 ? `${Math.min((totalExpenses / Math.max(totalIncome, totalExpenses, 1)) * 100, 100)}%` : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Despesas por Categoria */}
        {personalExpensesFiltered.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Despesas por Categoria</h3>
            <div className="relative bg-white rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                {Object.entries(categoryAmounts)
                  .filter(([category]) => !excludedCategories.includes(category))
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([category, amount], index) => {
                    const percentage = totalPersonalExpensesFiltered > 0 ? Math.round((amount / totalPersonalExpensesFiltered) * 100) : 0;
                    const barColor = categoryColors[index % categoryColors.length];
                    
                    // Formatar nome da categoria
                    const formatCategoryName = (cat: string): string => {
                      const categoryMap: Record<string, string> = {
                        'subscricoes': 'Subscrições',
                        'telemovel': 'Telemóvel',
                        'comunicacoes': 'Comunicações',
                        'prestacao_carro': 'Prestação Carro',
                        'seguro_carro': 'Seguro Carro',
                        'ginasio': 'Ginásio',
                        'saude': 'Saúde',
                        'iuc': 'IUC',
                        'ppr': 'PPR',
                        'manutencao_conta': 'Manutenção Conta',
                        'fundo_emergencia': 'Fundo Emergência',
                        'fundo_obras': 'Fundo Obras',
                        'other': 'Outros'
                      };
                      
                      if (categoryMap[cat.toLowerCase()]) {
                        return categoryMap[cat.toLowerCase()];
                      }
                      
                      if (cat.includes('_')) {
                        return cat
                          .split('_')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ');
                      }
                      
                      return cat.charAt(0).toUpperCase() + cat.slice(1);
                    };
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {formatCategoryName(category)}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(amount)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${barColor.replace('bg-', 'bg-')} transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              {totalPersonalExpensesFiltered > 0 && (
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-lg font-semibold">
                    Total das despesas pessoais: {formatCurrency(totalPersonalExpensesFiltered)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </CardContent>
      
      {/* Diálogo de seleção de mês */}
      <Dialog open={showMonthDialog} onOpenChange={setShowMonthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Selecionar Mês</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {availableMonths.map((month) => (
                <Button
                  key={month}
                  variant={month === currentMonth ? "default" : "outline"}
                  onClick={() => {
                    setCurrentMonth(month);
                    setShowMonthDialog(false);
                  }}
                >
                  {formatMonthKey(month)}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PersonalStats;
