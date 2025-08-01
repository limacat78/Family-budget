import { Transaction, HouseholdExpense } from "../../types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatRelativeDate } from "../../utils/formatters";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MonthlyHouseholdTransactionsProps {
  transactions: Transaction[];
}

// Função auxiliar para formatar a chave do mês no formato YYYY-MM
const getMonthKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Função auxiliar para obter nome do mês em português
const getMonthName = (monthNum: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthNum];
};

// Função para formatar a chave do mês para exibição (ex: "Maio 2025")
const formatMonthKey = (key: string): string => {
  const [year, month] = key.split('-');
  const monthNum = parseInt(month) - 1; // Ajuste para índice base 0 dos meses
  return `${getMonthName(monthNum)} ${year}`;
};

// Função para verificar se uma data está no mês atual
const isCurrentMonth = (date: string | Date): boolean => {
  const transactionDate = new Date(date);
  const now = new Date();
  return transactionDate.getMonth() === now.getMonth() && 
         transactionDate.getFullYear() === now.getFullYear();
};

// Função para verificar se uma data pertence a um mês específico (formato YYYY-MM)
const isInMonth = (date: string | Date, monthKey: string): boolean => {
  const transactionDate = new Date(date);
  const [year, month] = monthKey.split('-');
  return transactionDate.getMonth() === parseInt(month) - 1 && 
         transactionDate.getFullYear() === parseInt(year);
};

const MonthlyHouseholdTransactions = ({ transactions }: MonthlyHouseholdTransactionsProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPaidBy, setFilterPaidBy] = useState<string>("");
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(getMonthKey());
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthKey());
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<Record<string, Transaction[]>>({});
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);

  // Carregar histórico do localStorage ao iniciar
  useEffect(() => {
    loadHistoryFromStorage();
  }, []);

  // Efeito para processar as transações iniciais
  useEffect(() => {
    // Filtra apenas transações domésticas
    const household = transactions.filter(transaction => 'paidBy' in transaction);
    
    // Separa as transações do mês atual
    const currentMonthTransactions = household.filter(t => isCurrentMonth(t.date));
    
    // Ordenar as transações por data (mais recentes primeiro)
    const sortedTransactions = [...currentMonthTransactions].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    setLocalTransactions(sortedTransactions);
    
    // Organizar todas as transações por mês
    const monthlyData: Record<string, Transaction[]> = {};
    
    household.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      
      monthlyData[monthKey].push(transaction);
    });
    
    // Salvar o histórico em localStorage
    saveMonthlyDataToStorage(monthlyData);
    
    // Atualizar o estado com os dados mensais
    setMonthlyHistory(monthlyData);
    
    // Obter lista de meses disponíveis
    setAvailableMonths(Object.keys(monthlyData).sort().reverse()); // Mais recente primeiro
    
  }, [transactions]);

  // Efeito para verificar mudança de mês e resetar quando necessário
  useEffect(() => {
    const now = new Date();
    const currentMonth = getMonthKey(now);
    
    // Se já temos um mês atual definido e é diferente do mês real atual
    if (currentMonthKey !== currentMonth) {
      // Significa que mudamos de mês
      setCurrentMonthKey(currentMonth);
      
      // Adicionar o novo mês aos disponíveis se ainda não existir
      if (!availableMonths.includes(currentMonth)) {
        setAvailableMonths(prev => [currentMonth, ...prev]);
      }
      
      // Filtrar transações apenas do mês atual
      const currentMonthTransactions = localTransactions.filter(t => isCurrentMonth(t.date));
      setLocalTransactions(currentMonthTransactions);
      
      toast({
        title: 'Novo mês iniciado',
        description: `As transações foram automaticamente filtradas para ${formatMonthKey(currentMonth)}`
      });
    }
  }, [currentMonthKey]);

  // Função para salvar dados mensais no localStorage
  const saveMonthlyDataToStorage = (data: Record<string, Transaction[]>) => {
    try {
      // Para cada mês, salvar suas transações
      Object.keys(data).forEach(monthKey => {
        localStorage.setItem(`despesas-${monthKey}`, JSON.stringify(data[monthKey]));
      });
    } catch (error) {
      console.error('Erro ao salvar histórico mensal:', error);
    }
  };

  // Função para carregar histórico do localStorage
  const loadHistoryFromStorage = () => {
    try {
      // Procurar por todas as entradas que começam com "despesas-"
      const monthlyData: Record<string, Transaction[]> = {};
      const availableMonthsList: string[] = [];
      
      // Iterar sobre todas as chaves no localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('despesas-')) {
          const monthKey = key.replace('despesas-', '');
          const storedData = localStorage.getItem(key);
          
          if (storedData) {
            const parsedData = JSON.parse(storedData) as Transaction[];
            monthlyData[monthKey] = parsedData;
            availableMonthsList.push(monthKey);
          }
        }
      }
      
      // Ordenar meses disponíveis (mais recentes primeiro)
      availableMonthsList.sort().reverse();
      
      setMonthlyHistory(monthlyData);
      setAvailableMonths(availableMonthsList);
      
    } catch (error) {
      console.error('Erro ao carregar histórico mensal:', error);
    }
  };

  const handleDelete = async (transactionId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const endpoint = `/api/household-expense/${transactionId}`;
    
    if (window.confirm("Tem certeza que deseja excluir esta despesa familiar?")) {
      console.log(`Tentando excluir no endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, { method: 'DELETE' });
        
        if (!response.ok) {
          throw new Error('Falha ao excluir');
        }
        
        // Atualiza o estado local para remover imediatamente a transação da UI
        setLocalTransactions(prevTransactions => 
          prevTransactions.filter(t => t.id !== transactionId)
        );
        
        // Remover a transação do histórico mensal também
        const updatedHistory = { ...monthlyHistory };
        Object.keys(updatedHistory).forEach(monthKey => {
          updatedHistory[monthKey] = updatedHistory[monthKey].filter(t => t.id !== transactionId);
        });
        
        setMonthlyHistory(updatedHistory);
        
        // Atualizar o localStorage
        saveMonthlyDataToStorage(updatedHistory);
        
        // Atualizar a lista de transações filtradas também
        setFilteredTransactions(prevTransactions => 
          prevTransactions.filter(t => t.id !== transactionId)
        );
        
        toast({
          title: 'Transação removida',
          description: 'A transação foi excluída com sucesso!'
        });
        
        // Invalidar a query após a exclusão bem-sucedida
        queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/household-expense'] });
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a transação. Tente novamente mais tarde.',
          variant: 'destructive'
        });
      }
    }
  };

  const getPaidByDisplay = (paidBy: string) => {
    if (paidBy === 'person1') return 'Cat';
    if (paidBy === 'person2') return 'Gui';
    return 'Compartilhado';
  };

  // Função para obter o ícone apropriado para cada categoria
  const getCategoryIcon = (category: string): string => {
    // Mapeamento de categorias para ícones
    const iconMap: Record<string, string> = {
      'agua': '💧',
      'cartao_refeicao': '🍽️',
      'casa_lazer': '🏠',
      'condominio': '🏢',
      'electricidade': '💡',
      'emprestimo_habitacao': '🏠',
      'farmacia': '💊',
      'fundo_emergencia': '💸',
      'fundo_ferias': '🏖️',
      'fundo_obras': '🔨',
      'Fundo de Férias': '🏖️',
      'Fundo Férias': '🏖️',
      'Fundo Obras': '🔨',
      'gasolina': '⛽',
      'gato_pixel': '🐾',
      'impostos': '€',
      'internet': '📶',
      'limpeza': '🧹',
      'luz_gas': '💡',
      'outros': '🏷️',
      'Poupança': '💰',
      'renda_casa': '🏘️',
      'restaurantes': '🍽️',
      'subscricoes': '📺',
      'supermercado': '🛒',
      'uber_carro': '🚕',
      'via_verde': '🛣️',
      'vodafone_tv': '📺',
      'default': '📊'
    };
    
    return iconMap[category] || iconMap.default;
  };

  const getCategoryDisplay = (transaction: any) => {
    // Mapeamento para normalizar categorias específicas
    const categoryMap: Record<string, string> = {
      'supermercado': 'Supermercado',
      'gasolina': 'Gasolina',
      'electricidade': 'Electricidade',
      'água': 'Água',
      'agua': 'Água',
      'luz_gas': 'Luz/Gás',
      'agua_luz_gas': 'Água/Luz/Gás',
      'internet': 'Internet',
      'vodafone_tv': 'Vodafone TV',
      'emprestimo_habitacao': 'Empréstimo Habitação',
      'condominio': 'Condomínio',
      'renda_casa': 'Renda Casa',
      'limpeza': 'Limpeza',
      'Poupança': 'Fundo de Férias',
      'poupanca': 'Fundo de Férias',
      'fundo_emergencia': 'Fundo de Emergência',
      'Fundo Férias': 'Fundo de Férias',
      'gato_pixel': 'Gato Pixel',
      'cartao_refeicao': 'Cartão Refeição',
      'casa_lazer': 'Casa Lazer',
      'impostos': 'Impostos'
    };
    
    // Obtém o ícone para a categoria
    const icon = getCategoryIcon(transaction.category);
    
    // Usa o nome normalizado se disponível no mapeamento
    if (categoryMap[transaction.category]) {
      return `${icon} ${categoryMap[transaction.category]}`;
    }
    
    // Conversão genérica se não estiver no mapeamento:
    // Substituir underscores por espaços e colocar em Title Case
    if (transaction.category && transaction.category.includes('_')) {
      const formattedCategory = transaction.category
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      return `${icon} ${formattedCategory}`;
    }
    
    // Se já for um texto sem underscore, apenas verifica se começa com letra maiúscula
    if (transaction.category && typeof transaction.category === 'string') {
      const formattedCategory = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
      return `${icon} ${formattedCategory}`;
    }
    
    return '📊 Sem categoria';
  };

  // Função para aplicar filtros às transações no histórico
  const applyFilters = () => {
    if (!monthlyHistory[selectedMonth]?.length) {
      setFilteredTransactions([]);
      return;
    }
    
    let filtered = [...monthlyHistory[selectedMonth]];
    
    console.log("Aplicando filtros:", {
      categoria: filterCategory,
      pagador: filterPaidBy,
      transacoesAntesDoFiltro: filtered.length
    });
    
    // Filtrar por categoria
    if (filterCategory && filterCategory !== "_todas_") {
      filtered = filtered.filter(t => 'category' in t && t.category === filterCategory);
    }
    
    // Filtrar por quem pagou
    if (filterPaidBy && filterPaidBy !== "_todos_") {
      filtered = filtered.filter(t => 'paidBy' in t && t.paidBy === filterPaidBy);
    }
    
    console.log("Transações após filtros:", filtered.length);
    
    // Ordenar por data (mais recentes primeiro)
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    // Importante: marcar que os filtros foram aplicados
    // Isso garante que os filtros permaneçam ativos até serem explicitamente limpos
    setFiltersApplied(true);
    
    setFilteredTransactions(filtered);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    // Resetar os valores dos filtros para o estado inicial
    setFilterCategory("_todas_");
    setFilterPaidBy("_todos_");
    
    // Marcar que não há mais filtros aplicados
    setFiltersApplied(false);
    
    if (monthlyHistory[selectedMonth]) {
      // Ordenar por data (mais recentes primeiro)
      const sortedTransactions = [...monthlyHistory[selectedMonth]].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      
      // Mostrar todas as transações sem filtro
      setFilteredTransactions(sortedTransactions);
    } else {
      setFilteredTransactions([]);
    }
  };

  // Este efeito só carrega todas as transações quando o mês selecionado muda,
  // Respeita os filtros aplicados anteriormente
  useEffect(() => {
    // Apenas carregamos as transações quando muda o mês, verificando se filtros já estão aplicados
    if (monthlyHistory[selectedMonth]) {
      
      // Se filtros estiverem aplicados e mudamos apenas o mês, 
      // vamos aplicar novamente os filtros de forma explícita
      if (filtersApplied) {
        // Reaplicamos os filtros para o novo mês selecionado
        const filtered = [...monthlyHistory[selectedMonth]].filter(transaction => {
          // Verificamos a categoria se foi selecionada
          const matchesCategory = filterCategory === "_todas_" || 
            ('category' in transaction && transaction.category === filterCategory);
          
          // Verificamos quem pagou se foi selecionado
          const matchesPaidBy = filterPaidBy === "_todos_" || 
            ('paidBy' in transaction && transaction.paidBy === filterPaidBy);
            
          return matchesCategory && matchesPaidBy;
        });
        
        // Ordenamos por data (mais recentes primeiro)
        const sortedFiltered = [...filtered].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        
        setFilteredTransactions(sortedFiltered);
      } else {
        // Se não houver filtros aplicados, mostramos tudo
        const sortedTransactions = [...monthlyHistory[selectedMonth]].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        
        setFilteredTransactions(sortedTransactions);
      }
    } else {
      setFilteredTransactions([]);
    }
  }, [selectedMonth, monthlyHistory]);

  // Obter todas as categorias únicas para o dropbox
  const getUniqueCategories = (): string[] => {
    const allCategories = new Set<string>();
    
    // Coletar todas as categorias de todas as transações
    transactions.forEach(transaction => {
      if ('category' in transaction) {
        allCategories.add(transaction.category);
      }
    });
    
    return Array.from(allCategories);
  };

  // Obter somátório total das transações filtradas
  const getFilteredTransactionsTotal = (transactions: Transaction[]): number => {
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
  };
  
  // Obter texto correto para a contagem de transações (singular/plural)
  const getTransactionCountText = (count: number): string => {
    return count === 1 ? "1 transação" : `${count} transações`;
  };

  // Renderiza um item de transação (para reuso na lista principal e no histórico)
  const renderTransactionItem = (transaction: Transaction, showDelete = true) => {
    if (!('paidBy' in transaction)) return null;
    
    const householdTransaction = transaction as HouseholdExpense;
    
    return (
      <div 
        key={`household-transaction-${householdTransaction.id}`} 
        className="px-4 py-3 flex items-center justify-between border-b border-gray-200 last:border-0"
      >
        <div className="flex items-center">
          <div>
            <p className="font-medium text-sm">{getCategoryDisplay(householdTransaction)}</p>
            <p className="text-gray-500 text-xs">
              {`Pago por: ${getPaidByDisplay(householdTransaction.paidBy)} | ${formatRelativeDate(householdTransaction.date)}`}
            </p>
            {householdTransaction.description && (
              <p className="text-gray-600 text-xs mt-1">{householdTransaction.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {getAmountDisplay(householdTransaction)}
          {showDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 text-gray-400 hover:text-red-500"
              onClick={(e) => handleDelete(householdTransaction.id, e)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getAmountDisplay = (transaction: any) => {
    return (
      <p className="font-medium text-red-600">
        {formatCurrency(Number(transaction.amount))}
      </p>
    );
  };

  // Componente para cabeçalho do mês selecionado (no diálogo do histórico)
  const SelectedMonthHeader = () => (
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-medium">
        {formatMonthKey(selectedMonth)}
      </h3>
      {filteredTransactions.length ? (
        <span className="text-sm text-gray-500">
          {getTransactionCountText(filteredTransactions.length)} neste mês
        </span>
      ) : null}
    </div>
  );

  // Obtém lista de todas as categorias existentes nas transações
  const uniqueCategories = getUniqueCategories();

  // Obtém o texto para a contagem de transações
  const transactionCountText = getTransactionCountText(localTransactions.length);

  // Obtém o total das transações (para o mês atual)
  const totalAmount = getFilteredTransactionsTotal(localTransactions);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Transações da Casa ({formatMonthKey(currentMonthKey)})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryDialog(true)}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Ver Histórico
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="max-h-72 overflow-y-auto border rounded-md">
          {localTransactions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Sem transações neste mês.
            </div>
          ) : (
            <div>
              {localTransactions.map((transaction) => renderTransactionItem(transaction))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <span className="text-sm text-gray-500">{transactionCountText} neste mês</span>
        <span className="font-medium">Total: {formatCurrency(totalAmount)}</span>
      </CardFooter>

      {/* Modal de Histórico Mensal */}
      <Dialog 
        open={showHistoryDialog} 
        onOpenChange={setShowHistoryDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Transações</DialogTitle>
            <DialogDescription>
              Consulte as transações mensais ou filtre por categoria e quem pagou.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seleção de Mês */}
            <div className="grid gap-2">
              <Label htmlFor="month">Selecione o mês</Label>
              <Select
                value={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder="Selecione um mês" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((monthKey) => (
                    <SelectItem key={monthKey} value={monthKey}>
                      {formatMonthKey(monthKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtros por categoria e pagador */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={filterCategory}
                  onValueChange={(value) => setFilterCategory(value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_todas_">Todas</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryDisplay({ category }).replace(/^.{1,2} /, '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="paid-by">Quem pagou</Label>
                <Select
                  value={filterPaidBy}
                  onValueChange={(value) => setFilterPaidBy(value)}
                >
                  <SelectTrigger id="paid-by">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_todos_">Todos</SelectItem>
                    <SelectItem value="person1">Cat</SelectItem>
                    <SelectItem value="person2">Gui</SelectItem>
                    <SelectItem value="shared">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Botões para aplicar e limpar filtros */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="sm"
              >
                Limpar filtros
              </Button>
              <Button 
                variant="default" 
                onClick={applyFilters}
                size="sm"
              >
                Aplicar Filtros
              </Button>
            </div>

            {/* Exibir lista de transações filtradas */}
            <div className="mt-4">
              <SelectedMonthHeader />
              
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {filteredTransactions.length ? (
                  <div>
                    {filteredTransactions.map(transaction => renderTransactionItem(transaction, false))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma transação encontrada para o período/filtros selecionados.
                  </div>
                )}
              </div>
              
              {filteredTransactions.length > 0 && (
                <div className="mt-2 text-right">
                  <span className="font-medium">
                    Total: {formatCurrency(getFilteredTransactionsTotal(filteredTransactions))}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowHistoryDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MonthlyHouseholdTransactions;