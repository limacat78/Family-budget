import { useEffect, useRef, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { HouseholdExpense, SummaryData } from "../../types";
import { Chart, registerables, ChartType, Plugin, ChartData } from 'chart.js';

Chart.register(...registerables);

const HouseholdStats = () => {
  const [currentUser, setCurrentUser] = useState<"person1" | "person2">("person1"); // Usado para rastrear o utilizador atual
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const contributionChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);
  const contributionChartInstance = useRef<Chart | null>(null);
  
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/summary"],
  });
  
  const { data: householdExpenses, isLoading: expensesLoading } = useQuery<HouseholdExpense[]>({
    queryKey: ["/api/household-expense"],
  });
  
  const isLoading = summaryLoading || expensesLoading;
  
  // Dados de exemplo para desenvolvimento
  const demoSummary = {
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
    recentTransactions: []
  };
  
  const demoHouseholdExpenses = [
    { id: 1, date: '2023-05-15', description: 'Aluguel', amount: 800, category: 'rent', paidBy: 'person1', type: 'household-expense' },
    { id: 2, date: '2023-05-10', description: 'Supermercado', amount: 150, category: 'groceries', paidBy: 'person2', type: 'household-expense' },
    { id: 3, date: '2023-05-05', description: 'Conta de Luz', amount: 90, category: 'utilities', paidBy: 'person1', type: 'household-expense' },
    { id: 4, date: '2023-05-01', description: 'Internet', amount: 60, category: 'utilities', paidBy: 'person2', type: 'household-expense' }
  ] as HouseholdExpense[];

  // Hook para renderizar o gráfico de categorias
  useEffect(() => {
    // Use dados reais ou de exemplo
    const expenses = householdExpenses || demoHouseholdExpenses;
    if (!categoryChartRef.current || expenses.length === 0) return;
    
    // Categorias a serem excluídas do gráfico (fundos de poupança)
    const excludedCategories = [
      'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
      'Poupança', 'Poupanca', 'poupanca', 
      'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
      'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
    ];
    
    // Filtrar apenas as despesas do mês atual
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Filtramos para incluir apenas despesas do mês atual E excluir categorias de fundos
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isCurrentMonth = expenseDate.getMonth() === currentMonth && 
                            expenseDate.getFullYear() === currentYear;
      
      // Excluir despesas de categorias relacionadas a fundos
      const isExcludedCategory = excludedCategories.includes(expense.category);
      
      return isCurrentMonth && !isExcludedCategory;
    });
    
    console.log(`Total de despesas: ${expenses.length}, Filtradas (mês atual sem fundos): ${filteredExpenses.length}`);
    
    // Calculate category totals separated by person (já excluindo categorias de poupança)
    const categoryTotalsByPerson: Record<string, { person1: number, person2: number }> = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category;
      if (!categoryTotalsByPerson[category]) {
        categoryTotalsByPerson[category] = { person1: 0, person2: 0 };
      }
      
      const amount = Number(expense.amount);
      
      // Handle shared expenses - divide equally between both persons
      if (expense.paidBy === 'shared' || expense.paidBy === 'Partilhado') {
        console.log(`Despesa partilhada em ${category}: ${amount}€ dividida em ${amount/2}€ para cada pessoa`);
        categoryTotalsByPerson[category].person1 += amount / 2;
        categoryTotalsByPerson[category].person2 += amount / 2;
      } else {
        // Handle individual expenses
        const person = expense.paidBy === 'person1' ? 'person1' : 'person2';
        console.log(`Despesa individual em ${category}: ${amount}€ para ${person}`);
        categoryTotalsByPerson[category][person] += amount;
      }
    });
    
    console.log('Totais por categoria:', categoryTotalsByPerson);
    
    // Função para formatar nomes de categorias (title case e substituição de underscores)
    const formatCategoryName = (category: string): string => {
      // Mapeamento específico para categorias conhecidas
      const categoryMap: Record<string, string> = {
        'rent': 'Renda/Hipoteca',
        'utilities': 'Contas',
        'groceries': 'Supermercado',
        'restaurants': 'Refeições Fora',
        'vodafone_tv': 'Vodafone TV',
        'agua_luz_gas': 'Água/Luz/Gás',
        'emprestimo_habitacao': 'Empréstimo Habitação',
        'poupanca': 'Poupança',
        'gato_pixel': 'Gato Pixel',
        'other': 'Outros'
      };
      
      // Se tiver um mapeamento específico, use-o
      if (categoryMap[category]) {
        return categoryMap[category];
      }
      
      // Caso contrário, aplique a formatação padrão (substituir underscores por espaços e colocar em title case)
      if (category.includes('_')) {
        return category
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      // Se for uma palavra única, apenas capitalize a primeira letra
      return category.charAt(0).toUpperCase() + category.slice(1);
    };
    
    // Prepare data for grouped chart
    const categories = Object.keys(categoryTotalsByPerson);
    const labels = categories.map(cat => formatCategoryName(cat));
    
    // Calculate total amount per category for sorting
    const categoryTotalAmounts = categories.map(cat => 
      categoryTotalsByPerson[cat].person1 + categoryTotalsByPerson[cat].person2
    );
    
    // Ordenar dados do maior para o menor valor total
    const sortedData = labels.map((label, i) => ({ 
      label, 
      category: categories[i],
      totalAmount: categoryTotalAmounts[i],
      person1: categoryTotalsByPerson[categories[i]].person1,
      person2: categoryTotalsByPerson[categories[i]].person2
    })).sort((a, b) => b.totalAmount - a.totalAmount);
    
    const sortedLabels = sortedData.map(item => item.label);
    const sortedPerson1Amounts = sortedData.map(item => item.person1);
    const sortedPerson2Amounts = sortedData.map(item => item.person2);
    
    // Destroy existing chart if it exists
    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }
    
    // Create new horizontal bar chart
    const ctx = categoryChartRef.current.getContext('2d');
    if (ctx) {
      categoryChartInstance.current = new Chart(ctx, {
        type: 'bar' as ChartType,
        data: {
          labels: sortedLabels,
          datasets: [{
            label: 'Cat',
            data: sortedPerson1Amounts,
            backgroundColor: 'rgba(67, 97, 238, 0.8)',  // Blue for Cat
            borderColor: 'rgba(67, 97, 238, 1)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
            stack: 'stack1',
          }, {
            label: 'Gui',
            data: sortedPerson2Amounts,
            backgroundColor: 'rgba(72, 191, 145, 0.8)', // Green for Gui
            borderColor: 'rgba(72, 191, 145, 1)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
            stack: 'stack1',
          }]
        },
        options: {
          indexAxis: 'y' as const, // Barras horizontais
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index' as const,
            intersect: false,
          },
          scales: {
            x: {
              stacked: true,
              beginAtZero: true,
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)',
              },
              border: {
                display: false,
              },
              ticks: {
                display: true,
                callback: function(value: any) {
                  return new Intl.NumberFormat('pt-PT', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(value);
                }
              }
            },
            y: {
              stacked: true,
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
              ticks: {
                display: true,
                maxRotation: 0,
                font: {
                  size: 11
                }
              }
            }
          },
          layout: {
            padding: {
              left: 10,
              right: 10,
              top: 10,
              bottom: 10
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              enabled: true, // Ativando tooltip para hover
              backgroundColor: 'rgba(0,0,0,0.85)',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              padding: 12,
              displayColors: true, // Mostrar cor da categoria
              callbacks: {
                title: function(context) {
                  // Mostrar categoria no título
                  return context[0].label;
                },
                label: function(context) {
                  const value = context.raw as number;
                  const person = context.dataset.label; // Cat or Gui
                  // Calculate total for the category across both persons
                  const categoryIndex = context.dataIndex;
                  const person1Value = context.chart.data.datasets[0].data[categoryIndex] as number;
                  const person2Value = context.chart.data.datasets[1].data[categoryIndex] as number;
                  const categoryTotal = person1Value + person2Value;
                  
                  const percentage = categoryTotal > 0 ? Math.round((value / categoryTotal) * 100) : 0;
                  return [
                    `${person}: ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)}`,
                    `% na categoria: ${percentage}%`,
                  ];
                }
              }
            }
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
    };
  }, [householdExpenses]);

  // Hook para renderizar o gráfico de contribuições
  useEffect(() => {
    const expenses = householdExpenses || demoHouseholdExpenses;
    if (!contributionChartRef.current || expenses.length === 0) return;
    
    // Filtrar apenas as despesas do mês atual
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    
    // Categorias a serem excluídas das estatísticas (fundos de poupança)
    const excludedCategories = [
      'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
      'Poupança', 'Poupanca', 'poupanca', 
      'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
      'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
    ];
    
    // Filtrar transações do mês atual, excluindo categorias de fundos
    const filteredExpenses = currentMonthExpenses.filter(expense => 
      !excludedCategories.includes(expense.category)
    );
    
    // Calcular as contribuições do mês atual
    let person1Contribution = 0;
    let person2Contribution = 0;
    
    filteredExpenses.forEach(expense => {
      const amount = Number(expense.amount);
      
      if (expense.paidBy === 'person1') {
        person1Contribution += amount;
      } else if (expense.paidBy === 'person2') {
        person2Contribution += amount;
      } else if (expense.paidBy === 'shared') {
        // Despesas compartilhadas são divididas igualmente
        const halfAmount = amount / 2;
        person1Contribution += halfAmount;
        person2Contribution += halfAmount;
      }
    });
    
    const totalContribution = person1Contribution + person2Contribution;
    const person1Percentage = totalContribution > 0 ? (person1Contribution / totalContribution) * 100 : 0;
    const person2Percentage = totalContribution > 0 ? (person2Contribution / totalContribution) * 100 : 0;
    
    // Destruir gráfico anterior se existir
    if (contributionChartInstance.current) {
      contributionChartInstance.current.destroy();
    }
    
    // Dados para o gráfico de pizza
    const pieData: ChartData = {
      labels: ['Cat', 'Gui'],
      datasets: [{
        data: [person1Contribution, person2Contribution],
        backgroundColor: [
          'rgba(67, 97, 238, 0.7)',  // Azul para Cat
          'rgba(72, 191, 145, 0.7)'  // Verde para Gui
        ],
        borderColor: [
          'rgba(67, 97, 238, 1)',
          'rgba(72, 191, 145, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    // Criar novo gráfico de pizza
    const ctxPie = contributionChartRef.current.getContext('2d');
    if (ctxPie) {
      contributionChartInstance.current = new Chart(ctxPie, {
        type: 'pie' as ChartType,
        data: pieData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const percentage = totalContribution > 0 
                    ? ((value / totalContribution) * 100).toFixed(1) 
                    : "0.0";
                  return `${context.label}: ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
    
    // Cleanup
    return () => {
      if (contributionChartInstance.current) {
        contributionChartInstance.current.destroy();
      }
    };
  }, [householdExpenses]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas da Casa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          </div>
          <div className="mt-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-2 w-full mb-4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Use dados reais ou de exemplo
  const data: any = summary || demoSummary;
  const expenses: HouseholdExpense[] = householdExpenses || demoHouseholdExpenses;
  
  // Filtra as despesas para conter apenas o mês atual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  // Filtramos para incluir apenas despesas do mês atual
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });
  
  // Categorias a serem excluídas das estatísticas (fundos de poupança)
  const excludedCategories = [
    'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
    'Poupança', 'Poupanca', 'poupanca', 
    'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
    'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
  ];
  
  // Filtrar transações do mês atual, excluindo categorias de fundos
  const filteredExpenses = currentMonthExpenses.filter(expense => 
    !excludedCategories.includes(expense.category)
  );
  
  console.log(`Total de despesas: ${expenses.length}, Despesas do mês atual: ${currentMonthExpenses.length}, Após excluir fundos: ${filteredExpenses.length}`);
  
  // Calcular as contribuições do mês atual (excluindo fundos)
  let person1MonthlyContribution = 0;
  let person2MonthlyContribution = 0;
  let totalMonthlyHousehold = 0;
  
  filteredExpenses.forEach(expense => {
    const amount = Number(expense.amount);
    totalMonthlyHousehold += amount;
    
    if (expense.paidBy === 'person1') {
      person1MonthlyContribution += amount;
    } else if (expense.paidBy === 'person2') {
      person2MonthlyContribution += amount;
    }
    // Despesas compartilhadas são divididas igualmente
    else if (expense.paidBy === 'shared') {
      const halfAmount = amount / 2;
      person1MonthlyContribution += halfAmount;
      person2MonthlyContribution += halfAmount;
    }
  });
  
  // Usar os valores do mês atual em vez dos valores totais
  const totalHousehold = totalMonthlyHousehold;
  const person1Contribution = person1MonthlyContribution;
  const person2Contribution = person2MonthlyContribution;
  const person1Percentage = totalHousehold > 0 ? (person1Contribution / totalHousehold) * 100 : 0;
  const person2Percentage = totalHousehold > 0 ? (person2Contribution / totalHousehold) * 100 : 0;
  
  // Log para debug
  console.log(`Contribuições do mês atual - Total: ${totalHousehold}€, Cat: ${person1Contribution}€ (${person1Percentage.toFixed(1)}%), Gui: ${person2Contribution}€ (${person2Percentage.toFixed(1)}%)`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estatísticas da Casa</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grid para os dois gráficos lado a lado em telas maiores, com proporção 2/3 - 1/3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gráfico de barras horizontais para categorias - ocupa 2/3 do espaço */}
          <div className="flex flex-col md:col-span-2">
            <h4 className="font-medium text-base mb-3 text-left">Despesas por Categoria</h4>
            <div className="bg-gray-50 rounded-lg flex-grow" style={{ height: '280px', minHeight: '280px' }}>
              <canvas ref={categoryChartRef} />
            </div>
            <div className="mt-4 text-center border-t pt-3">
              <span className="font-semibold text-base">Total das despesas da casa: {formatCurrency(totalHousehold)}</span>
            </div>
          </div>
          
          {/* Gráfico de pizza para contribuições por pessoa - ocupa 1/3 do espaço */}
          <div className="flex flex-col md:col-span-1">
            <h4 className="font-medium text-sm mb-3">Contribuição por Pessoa</h4>
            <div className="bg-gray-50 rounded-lg mb-3 flex-grow" style={{ height: '220px', minHeight: '220px' }}>
              <canvas ref={contributionChartRef} />
            </div>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-gray-600">Cat</span>
                <span className="font-medium">{formatCurrency(person1Contribution)} ({person1Percentage.toFixed(1)}%)</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-600">Gui</span>
                <span className="font-medium">{formatCurrency(person2Contribution)} ({person2Percentage.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HouseholdStats;
