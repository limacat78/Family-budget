import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, TrendingUp, Users, Home, PiggyBank, Plane, Shield, Hammer, Download, Edit, Save, X } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { SummaryData, PersonalExpense, HouseholdExpense, Income } from "../../types";
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';

interface AnnualData {
  year: number;
  catTotal: number;
  guiTotal: number;
  houseTotal: number;
  catIncome: number;
  guiIncome: number;
  totalIncome: number;
  catContributionPercentage: number;
  guiContributionPercentage: number;
  monthlyAverages: {
    cat: number;
    gui: number;
    house: number;
  };
}

const AnnualTab = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const monthlyChartRef = useRef<Chart | null>(null);
  
  // Estados para edição dos objetivos dos fundos
  const [fundGoals, setFundGoals] = useState({
    ferias: 0,
    emergencia: 2000,
    obras: 1500
  });
  
  const [isEditing, setIsEditing] = useState({
    ferias: false,
    emergencia: false,
    obras: false
  });
  
  const [tempGoals, setTempGoals] = useState(fundGoals);
  
  // Carregar objetivos do localStorage na inicialização
  useEffect(() => {
    const savedGoals = localStorage.getItem('fundGoals');
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      setFundGoals(parsedGoals);
      setTempGoals(parsedGoals);
    }
  }, []);
  
  // Funções para gerenciar a edição dos objetivos
  const startEditing = (fundType: 'ferias' | 'emergencia' | 'obras') => {
    setIsEditing(prev => ({ ...prev, [fundType]: true }));
    setTempGoals(prev => ({ ...prev, [fundType]: fundGoals[fundType] }));
  };
  
  const cancelEditing = (fundType: 'ferias' | 'emergencia' | 'obras') => {
    setIsEditing(prev => ({ ...prev, [fundType]: false }));
    setTempGoals(prev => ({ ...prev, [fundType]: fundGoals[fundType] }));
  };
  
  const saveGoal = (fundType: 'ferias' | 'emergencia' | 'obras') => {
    const newGoals = { ...fundGoals, [fundType]: tempGoals[fundType] };
    setFundGoals(newGoals);
    localStorage.setItem('fundGoals', JSON.stringify(newGoals));
    setIsEditing(prev => ({ ...prev, [fundType]: false }));
  };
  
  const handleGoalChange = (fundType: 'ferias' | 'emergencia' | 'obras', value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempGoals(prev => ({ ...prev, [fundType]: numValue }));
  };
  
  // Buscar dados do resumo geral
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });
  
  // Buscar todas as despesas pessoais
  const { data: personalExpenses, isLoading: personalLoading } = useQuery<PersonalExpense[]>({
    queryKey: ['/api/personal-expense'],
  });
  
  // Buscar todas as despesas domésticas
  const { data: householdExpenses, isLoading: householdLoading } = useQuery<HouseholdExpense[]>({
    queryKey: ['/api/household-expense'],
  });
  
  // Buscar todas as receitas
  const { data: incomes, isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/income'],
  });
  
  const isLoading = summaryLoading || personalLoading || householdLoading || incomesLoading;
  
  // Calcular dados mensais
  const calculateMonthlyData = () => {
    if (!personalExpenses || !householdExpenses || !incomes) {
      return {
        monthlyIncomes: Array(12).fill(0).map(() => ({ cat: 0, gui: 0, house: 0 })),
        monthlyExpenses: Array(12).fill(0).map(() => ({ cat: 0, gui: 0, house: 0 }))
      };
    }

    const monthlyIncomes = Array(12).fill(0).map(() => ({ cat: 0, gui: 0, house: 0 }));
    const monthlyExpenses = Array(12).fill(0).map(() => ({ cat: 0, gui: 0, house: 0 }));

    // Filtrar dados do ano selecionado
    const yearIncomes = incomes.filter(income => {
      const incomeYear = new Date(income.date).getFullYear();
      return incomeYear === selectedYear;
    });

    const yearPersonalExpenses = personalExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });

    const yearHouseholdExpenses = householdExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });

    // Calcular receitas mensais
    yearIncomes.forEach(income => {
      const month = new Date(income.date).getMonth();
      const amount = Math.abs(Number(income.amount));
      if (income.userId === 1) {
        monthlyIncomes[month].cat += amount;
      } else if (income.userId === 2) {
        monthlyIncomes[month].gui += amount;
      }
    });

    // Calcular despesas pessoais mensais
    yearPersonalExpenses.forEach(expense => {
      const month = new Date(expense.date).getMonth();
      const amount = Math.abs(Number(expense.amount));
      if (expense.userId === 1) {
        monthlyExpenses[month].cat += amount;
      } else if (expense.userId === 2) {
        monthlyExpenses[month].gui += amount;
      }
    });

    // Calcular despesas domésticas mensais (excluindo fundos especiais)
    const excludedHouseholdCategories = [
      'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
      'Poupança', 'Poupanca', 'poupanca', 
      'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
      'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
    ];
    
    yearHouseholdExpenses.forEach(expense => {
      // Excluir categorias de fundos especiais
      if (!excludedHouseholdCategories.includes(expense.category)) {
        const month = new Date(expense.date).getMonth();
        const amount = Math.abs(Number(expense.amount));
        monthlyExpenses[month].house += amount;
      }
    });

    return { monthlyIncomes, monthlyExpenses };
  };

  // Calcular dados anuais
  const calculateAnnualData = (): AnnualData => {
    if (!personalExpenses || !householdExpenses || !incomes) {
      return {
        year: selectedYear,
        catTotal: 0,
        guiTotal: 0,
        houseTotal: 0,
        catIncome: 0,
        guiIncome: 0,
        totalIncome: 0,
        catContributionPercentage: 0,
        guiContributionPercentage: 0,
        monthlyAverages: { cat: 0, gui: 0, house: 0 }
      };
    }
    
    // Filtrar dados do ano selecionado
    const yearPersonalExpenses = personalExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });
    
    const yearHouseholdExpenses = householdExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });
    
    const yearIncomes = incomes.filter(income => {
      const incomeYear = new Date(income.date).getFullYear();
      return incomeYear === selectedYear;
    });
    
    // Calcular totais de despesas pessoais por pessoa
    const catTotal = yearPersonalExpenses
      .filter(expense => expense.userId === 1)
      .reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
    
    const guiTotal = yearPersonalExpenses
      .filter(expense => expense.userId === 2)
      .reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
    
    // Calcular total de despesas domésticas (excluindo fundos especiais)
    const excludedHouseholdCategories = [
      'Fundo Férias', 'fundo_ferias', 'Fundo de Férias', 
      'Poupança', 'Poupanca', 'poupanca', 
      'fundo_emergencia', 'Fundo Emergência', 'Fundo de Emergência',
      'fundo_obras', 'Fundo Obras', 'Fundo de Obras'
    ];
    
    const houseTotal = yearHouseholdExpenses
      .filter(expense => !excludedHouseholdCategories.includes(expense.category))
      .reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
    
    // Calcular receitas por pessoa
    const catIncome = yearIncomes
      .filter(income => income.userId === 1)
      .reduce((sum, income) => sum + Math.abs(Number(income.amount)), 0);
    
    const guiIncome = yearIncomes
      .filter(income => income.userId === 2)
      .reduce((sum, income) => sum + Math.abs(Number(income.amount)), 0);
    
    const totalIncome = catIncome + guiIncome;
    
    // Calcular percentagens de contribuição para despesas domésticas (excluindo fundos especiais)
    const catHouseContributions = yearHouseholdExpenses
      .filter(expense => expense.paidBy === 'Cat' && !excludedHouseholdCategories.includes(expense.category))
      .reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
    
    const guiHouseContributions = yearHouseholdExpenses
      .filter(expense => expense.paidBy === 'Gui' && !excludedHouseholdCategories.includes(expense.category))
      .reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
    
    const totalHouseContributions = catHouseContributions + guiHouseContributions;
    
    const catContributionPercentage = totalHouseContributions > 0 
      ? Math.round((catHouseContributions / totalHouseContributions) * 100)
      : 0;
    
    const guiContributionPercentage = totalHouseContributions > 0 
      ? Math.round((guiHouseContributions / totalHouseContributions) * 100)
      : 0;
    
    // Calcular médias mensais
    const monthlyAverages = {
      cat: catTotal / 12,
      gui: guiTotal / 12,
      house: houseTotal / 12
    };
    
    return {
      year: selectedYear,
      catTotal,
      guiTotal,
      houseTotal,
      catIncome,
      guiIncome,
      totalIncome,
      catContributionPercentage,
      guiContributionPercentage,
      monthlyAverages
    };
  };
  
  const annualData = calculateAnnualData();
  const monthlyData = calculateMonthlyData();

  // Criar gráfico de linhas mensal
  useEffect(() => {
    if (isLoading) return;

    const canvas = document.getElementById('monthlyCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Destruir gráfico anterior se existir
    if (monthlyChartRef.current) {
      monthlyChartRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Preparar dados para o gráfico (apenas despesas)
    const catExpenseData = monthlyData.monthlyExpenses.map(month => month.cat);
    const guiExpenseData = monthlyData.monthlyExpenses.map(month => month.gui);
    const houseExpenseData = monthlyData.monthlyExpenses.map(month => month.house);

    monthlyChartRef.current = new Chart(ctx, {
      type: 'line' as ChartType,
      data: {
        labels: monthNames,
        datasets: [
          {
            label: 'Despesas Cat',
            data: catExpenseData,
            borderColor: 'rgba(236, 72, 153, 1)', // Pink
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Despesas Gui',
            data: guiExpenseData,
            borderColor: 'rgba(59, 130, 246, 1)', // Blue
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Despesas Casa',
            data: houseExpenseData,
            borderColor: 'rgba(249, 115, 22, 1)', // Orange
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              callback: function(value: any) {
                return new Intl.NumberFormat('pt-PT', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value);
              }
            }
          },
          x: {
            grid: {
              display: false,
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
            labels: {
              usePointStyle: true,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function(context: any) {
                return `${context.dataset.label}: ${new Intl.NumberFormat('pt-PT', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(context.parsed.y)}`;
              }
            }
          }
        }
      }
    });

    // Cleanup no unmount
    return () => {
      if (monthlyChartRef.current) {
        monthlyChartRef.current.destroy();
      }
    };
  }, [selectedYear, isLoading, monthlyData]);
  
  // Calcular o total do Fundo Obras baseado nas despesas da casa com categoria "Fundo Obras"
  const calculateFundoObras = (): number => {
    if (!personalExpenses) return 0;
    
    const yearPersonalExpenses = personalExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });
    
    return yearPersonalExpenses
      .filter(expense => expense.category === 'Fundo Obras' || expense.category === 'fundo_obras')
      .reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
  };
  
  const fundoObrasTotal = calculateFundoObras();
  
  // Gerar anos disponíveis (últimos 5 anos)
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Função para exportar dados para Excel
  const exportToExcel = () => {
    if (!personalExpenses || !householdExpenses) return;
    
    // Filtrar dados do ano selecionado
    const yearPersonalExpenses = personalExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });
    
    const yearHouseholdExpenses = householdExpenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear();
      return expenseYear === selectedYear;
    });
    
    const yearIncomes = incomes?.filter(income => {
      const incomeYear = new Date(income.date).getFullYear();
      return incomeYear === selectedYear;
    }) || [];
    
    // Criar CSV content
    let csvContent = "Tipo,Data,Descrição,Categoria,Valor,Pessoa/Pago Por\n";
    
    // Adicionar receitas
    yearIncomes.forEach(income => {
      const person = income.userId === 1 ? 'Cat' : 'Gui';
      csvContent += `Receita,${new Date(income.date).toLocaleDateString('pt-PT')},${income.description || ''},Receita,${income.amount},${person}\n`;
    });
    
    // Adicionar despesas pessoais
    yearPersonalExpenses.forEach(expense => {
      const person = expense.userId === 1 ? 'Cat' : 'Gui';
      csvContent += `Despesa Pessoal,${new Date(expense.date).toLocaleDateString('pt-PT')},${expense.description || ''},${expense.category},${expense.amount},${person}\n`;
    });
    
    // Adicionar despesas da casa
    yearHouseholdExpenses.forEach(expense => {
      const person = expense.paidBy === 'person1' ? 'Cat' : expense.paidBy === 'person2' ? 'Gui' : 'Partilhado';
      csvContent += `Despesa Casa,${new Date(expense.date).toLocaleDateString('pt-PT')},${expense.description || ''},${expense.category},${expense.amount},${person}\n`;
    });
    
    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financas_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho com seletor de ano */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resumo Anual</h2>
          <p className="text-sm text-gray-600">Visão consolidada das finanças anuais</p>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>
      
      {/* Cards de resumo - Primeira linha com ordem solicitada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(annualData.totalIncome)}
            </div>
            <p className="text-xs text-gray-500">
              Cat: {formatCurrency(annualData.catIncome)} | Gui: {formatCurrency(annualData.guiIncome)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Cat</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {formatCurrency(annualData.catTotal)}
            </div>
            <p className="text-xs text-gray-500">
              Média mensal: {formatCurrency(annualData.monthlyAverages.cat)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Gui</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(annualData.guiTotal)}
            </div>
            <p className="text-xs text-gray-500">
              Média mensal: {formatCurrency(annualData.monthlyAverages.gui)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Casa</CardTitle>
            <Home className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(annualData.houseTotal)}
            </div>
            <p className="text-xs text-gray-500">
              Média mensal: {formatCurrency(annualData.monthlyAverages.house)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(annualData.totalIncome - annualData.catTotal - annualData.guiTotal - annualData.houseTotal)}
            </div>
            <p className="text-xs text-gray-500">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha com os fundos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fundo de Férias</CardTitle>
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-sky-500" />
              {!isEditing.ferias && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('ferias')}
                  className="p-1 h-6 w-6"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">
              {formatCurrency(summary?.vacation?.savings || 0)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-sky-500 transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min((summary?.vacation?.savings || 0) / (fundGoals.ferias || 1) * 100, 100)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                {isEditing.ferias ? (
                  <>
                    <Input
                      type="number"
                      value={tempGoals.ferias}
                      onChange={(e) => handleGoalChange('ferias', e.target.value)}
                      className="w-20 h-6 text-xs"
                      min="0"
                      step="50"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveGoal('ferias')}
                      className="p-1 h-6 w-6 text-green-600"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelEditing('ferias')}
                      className="p-1 h-6 w-6 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    {Math.round((summary?.vacation?.savings || 0) / (fundGoals.ferias || 1) * 100)}% do objetivo ({formatCurrency(fundGoals.ferias)})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fundo de Emergência</CardTitle>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-500" />
              {!isEditing.emergencia && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('emergencia')}
                  className="p-1 h-6 w-6"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.emergency?.savings || 0)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-red-500 transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min((summary?.emergency?.savings || 0) / (fundGoals.emergencia || 1) * 100, 100)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                {isEditing.emergencia ? (
                  <>
                    <Input
                      type="number"
                      value={tempGoals.emergencia}
                      onChange={(e) => handleGoalChange('emergencia', e.target.value)}
                      className="w-20 h-6 text-xs"
                      min="0"
                      step="100"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveGoal('emergencia')}
                      className="p-1 h-6 w-6 text-green-600"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelEditing('emergencia')}
                      className="p-1 h-6 w-6 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    {Math.round((summary?.emergency?.savings || 0) / (fundGoals.emergencia || 1) * 100)}% do objetivo ({formatCurrency(fundGoals.emergencia)})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fundo Obras</CardTitle>
            <div className="flex items-center space-x-2">
              <Hammer className="h-4 w-4 text-amber-700" />
              {!isEditing.obras && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing('obras')}
                  className="p-1 h-6 w-6"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {formatCurrency(fundoObrasTotal)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-amber-700 transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min(fundoObrasTotal / (fundGoals.obras || 1) * 100, 100)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                {isEditing.obras ? (
                  <>
                    <Input
                      type="number"
                      value={tempGoals.obras}
                      onChange={(e) => handleGoalChange('obras', e.target.value)}
                      className="w-20 h-6 text-xs"
                      min="0"
                      step="100"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveGoal('obras')}
                      className="p-1 h-6 w-6 text-green-600"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelEditing('obras')}
                      className="p-1 h-6 w-6 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    {Math.round(fundoObrasTotal / (fundGoals.obras || 1) * 100)}% do objetivo ({formatCurrency(fundGoals.obras)})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Visão Mensal - Tabela e Gráfico de Linhas */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal de Receitas e Despesas</CardTitle>
          <CardDescription>Janeiro - Dezembro {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Tabela Mensal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo Mensal</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Tipo</th>
                      {Array.from({ length: 12 }, (_, index) => {
                        const monthName = new Date(0, index).toLocaleDateString('pt-PT', { month: 'short' });
                        return (
                          <th key={index} className="text-center p-2 font-medium text-gray-700">{monthName}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Seção Receitas */}
                    <tr className="border-b bg-green-50">
                      <td className="p-2 font-medium text-green-700" colSpan={13}>RECEITAS</td>
                    </tr>
                    {/* Receitas Cat */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 text-pink-600 font-medium">Cat</td>
                      {monthlyData.monthlyIncomes.map((month, index) => (
                        <td key={index} className="p-2 text-center text-pink-600 font-medium">
                          {month.cat > 0 ? formatCurrency(month.cat) : '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Receitas Gui */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 text-blue-600 font-medium">Gui</td>
                      {monthlyData.monthlyIncomes.map((month, index) => (
                        <td key={index} className="p-2 text-center text-blue-600 font-medium">
                          {month.gui > 0 ? formatCurrency(month.gui) : '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Total Receitas */}
                    <tr className="border-b bg-green-100 font-semibold">
                      <td className="p-2 text-green-800 font-semibold">Total Receitas</td>
                      {monthlyData.monthlyIncomes.map((month, index) => {
                        const total = month.cat + month.gui;
                        return (
                          <td key={index} className="p-2 text-center text-green-800 font-semibold">
                            {total > 0 ? formatCurrency(total) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Seção Despesas */}
                    <tr className="border-b bg-red-50">
                      <td className="p-2 font-medium text-red-700" colSpan={13}>DESPESAS</td>
                    </tr>
                    {/* Despesas Cat */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 text-pink-600 font-medium">Cat</td>
                      {monthlyData.monthlyExpenses.map((month, index) => (
                        <td key={index} className="p-2 text-center text-pink-600 font-medium">
                          {month.cat > 0 ? formatCurrency(month.cat) : '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Despesas Gui */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 text-blue-600 font-medium">Gui</td>
                      {monthlyData.monthlyExpenses.map((month, index) => (
                        <td key={index} className="p-2 text-center text-blue-600 font-medium">
                          {month.gui > 0 ? formatCurrency(month.gui) : '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Despesas Casa */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 text-orange-600 font-medium">Casa</td>
                      {monthlyData.monthlyExpenses.map((month, index) => (
                        <td key={index} className="p-2 text-center text-orange-600 font-medium">
                          {month.house > 0 ? formatCurrency(month.house) : '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Total Despesas */}
                    <tr className="border-b bg-red-100 font-semibold">
                      <td className="p-2 text-red-800 font-semibold">Total Despesas</td>
                      {monthlyData.monthlyExpenses.map((month, index) => {
                        const total = month.cat + month.gui + month.house;
                        return (
                          <td key={index} className="p-2 text-center text-red-800 font-semibold">
                            {total > 0 ? formatCurrency(total) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico de Linhas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Evolução Mensal de Despesas</h3>
              <div className="h-80" id="monthly-chart">
                <canvas id="monthlyCanvas" width="400" height="300"></canvas>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default AnnualTab;