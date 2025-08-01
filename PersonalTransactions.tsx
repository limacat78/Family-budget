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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  CalendarIcon,
  FilterIcon,
  XIcon,
  History as HistoryIcon 
} from "lucide-react";

// Interface para transações pessoais (uso próprio do componente)
interface PersonalTransaction {
  id: number;
  userId: number;
  description: string;
  amount: number;
  category: string;
  date: string | Date;
  createdAt?: string | Date;
  type: 'income' | 'personal-expense';
}

interface PersonalTransactionsProps {
  expenses: any[]; // Usando any[] para evitar problemas com tipagem
  incomes: any[]; // Usando any[] para evitar problemas com tipagem
  userId: number;
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

// Função para obter ícone da categoria
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    // Receitas
    'ordenado': '💼',
    'bonus': '🎁',
    'cartao_refeicao': '🍽️',
    
    // Despesas Pessoais
    'telemovel': '📱',
    'subscricoes': '📺',
    'ginasio': '🏋️',
    'prestacao_carro': '🚗',
    'seguro_carro': '🔒',
    'revisao_carro': '🔧',
    'iuc': '📝',
    'visa': '💳',
    'roupa': '👕',
    'cabeleireiro': '💇',
    'manutencao_conta': '🏦',
    'PPR': '💰',
    'saude': '🩺',
    'fundo_emergencia': '🚨',
    'Fundo Férias': '🏖️',
    'fundo férias': '🏖️',
    'poupança': '💰',
    'Poupança': '💰',
    'outros': '📌'
  };
  
  // Verificação especial para Fundo Férias
  if (category && typeof category === 'string') {
    const lowerCategory = category.toLowerCase();
    
    // Se a descrição contém "fundo" e "férias", usar ícone de praia
    if (lowerCategory.includes('fundo') && lowerCategory.includes('féria')) {
      return '🏖️';
    }
  }
  
  return icons[category] || icons[category.toLowerCase()] || '📋';
};

// Função para formatar nome da categoria
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'ordenado': 'Ordenado',
    'bonus': 'Bónus',
    'cartao_refeicao': 'Cartão Refeição',
    'telemovel': 'Telemóvel',
    'subscricoes': 'Subscrições',
    'ginasio': 'Ginásio',
    'prestacao_carro': 'Prestação Carro',
    'seguro_carro': 'Seguro Carro',
    'revisao_carro': 'Revisão Carro',
    'iuc': 'IUC',
    'visa': 'Visa',
    'roupa': 'Roupa',
    'cabeleireiro': 'Cabeleireiro',
    'manutencao_conta': 'Manutenção Conta',
    'PPR': 'PPR',
    'saude': 'Saúde',
    'fundo_emergencia': 'Fundo Emergência',
    'fundo_obras': 'Fundo Obras',
    'Fundo Férias': 'Fundo Férias',
    'outros': 'Outros',
    'comunicações': 'Telemóvel',
    'Comunicações': 'Telemóvel',
    'poupança': 'Poupança',
    'Poupança': 'Poupança'
  };
  
  return labels[category] || category;
};

const PersonalTransactions = ({ expenses, incomes, userId }: PersonalTransactionsProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localTransactions, setLocalTransactions] = useState<PersonalTransaction[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<PersonalTransaction[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterApplied, setFilterApplied] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthKey());
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<Record<string, PersonalTransaction[]>>({});

  // Efeito para processar e combinar as transações iniciais
  useEffect(() => {
    // Filtragem e conversão segura com verificação de tipo
    const userExpenses = expenses
      .filter(expense => 'userId' in expense && expense.userId === userId)
      .map(expense => {
        return {
          ...expense,
          type: 'personal-expense' as const
        };
      });
    
    const userIncomes = incomes
      .filter(income => 'userId' in income && income.userId === userId)
      .map(income => {
        return {
          ...income,
          type: 'income' as const
        };
      });
    
    // Combinar todas as transações do usuário
    const allTransactions: PersonalTransaction[] = [...userExpenses, ...userIncomes];
    
    // Filtrar apenas transações do mês atual
    const currentMonthTransactions = allTransactions.filter(t => isCurrentMonth(t.date));
    
    // Ordenar por data (mais recentes primeiro)
    const sortedTransactions = [...currentMonthTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    
    console.log("Transações pessoais para o usuário", userId, ":", sortedTransactions);
    setLocalTransactions(sortedTransactions);
    setFilteredTransactions(sortedTransactions);
    
    // Organizar todas as transações por mês para o histórico
    const monthlyData: Record<string, PersonalTransaction[]> = {};
    
    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      
      monthlyData[monthKey].push(transaction);
    });
    
    // Salvar o histórico para uso posterior
    setMonthlyHistory(monthlyData);
    
    // Obter lista de meses disponíveis
    setAvailableMonths(Object.keys(monthlyData).sort().reverse()); // Mais recente primeiro
    
  }, [expenses, incomes, userId]);

  // Função para obter o ícone de direção da transação
  const getDirectionIcon = (transaction: PersonalTransaction) => {
    if (transaction.type === 'income') {
      return <ArrowUpIcon className="text-green-500 h-4 w-4" />;
    } else {
      return <ArrowDownIcon className="text-red-500 h-4 w-4" />;
    }
  };
  
  // Função para formatar o valor com o sinal correto
  const getFormattedAmount = (transaction: PersonalTransaction) => {
    if (transaction.type === 'income') {
      return `+${formatCurrency(transaction.amount)}`;
    } else {
      // Verifica se o valor já é negativo para evitar duplo sinal (--100,00)
      const amount = Math.abs(transaction.amount);
      return `-${formatCurrency(amount)}`;
    }
  };

  // Função para aplicar filtros às transações
  const applyFilters = () => {
    const transactionsToFilter = selectedMonth === getMonthKey() 
      ? localTransactions 
      : monthlyHistory[selectedMonth] || [];
    
    let filtered = [...transactionsToFilter];
    
    // Filtrar por categoria se selecionada
    if (filterCategory) {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    
    // Filtrar por tipo se selecionado
    if (filterType) {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    setFilteredTransactions(filtered);
    setFilterApplied(true);
  };
  
  // Função para limpar filtros
  const clearFilters = () => {
    setFilterCategory("");
    setFilterType("");
    setFilterApplied(false);
    
    // Restaurar transações com base no mês selecionado
    if (selectedMonth === getMonthKey()) {
      setFilteredTransactions(localTransactions);
    } else {
      setFilteredTransactions(monthlyHistory[selectedMonth] || []);
    }
  };
  
  // Função para alternar entre meses no histórico
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month === getMonthKey()) {
      // Se é o mês atual, mostra as transações locais (podem incluir as mais recentes)
      setFilteredTransactions(localTransactions);
    } else {
      // Se é um mês anterior, busca do histórico
      setFilteredTransactions(monthlyHistory[month] || []);
    }
    setShowHistoryDialog(false);
  };

  const handleDelete = async (transaction: PersonalTransaction, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    let transactionType = '';
    let endpoint = '';
    
    // Determinar o tipo de transação e endpoint correspondente
    if (transaction.type === 'income') {
      transactionType = 'Receita';
      endpoint = `/api/income/${transaction.id}`;
    } else if (transaction.type === 'personal-expense') {
      transactionType = 'Despesa pessoal';
      endpoint = `/api/personal-expense/${transaction.id}`;
    }
    
    if (!endpoint) {
      toast({
        title: "Erro",
        description: "Não foi possível determinar o tipo da transação",
        variant: "destructive"
      });
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir esta ${transactionType}?`)) {
      console.log(`Tentando excluir no endpoint: ${endpoint}`);
      
      try {
        await fetch(endpoint, { method: 'DELETE' });
        
        // Atualiza o estado local para remover imediatamente a transação da UI
        setLocalTransactions(prevTransactions => 
          prevTransactions.filter(t => t.id !== transaction.id)
        );
        
        // Remover a transação do histórico mensal também
        const updatedHistory = { ...monthlyHistory };
        Object.keys(updatedHistory).forEach(monthKey => {
          updatedHistory[monthKey] = updatedHistory[monthKey].filter(t => t.id !== transaction.id);
        });
        
        setMonthlyHistory(updatedHistory);
        
        toast({
          title: 'Transação removida',
          description: 'A transação foi excluída com sucesso!'
        });
        
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/income', userId] });
        queryClient.invalidateQueries({ queryKey: ['/api/personal-expense', userId] });
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
  
  // Função para renderizar estado vazio
  const renderEmptyState = () => (
    <div className="text-center py-6">
      <p className="text-muted-foreground">Não há transações registradas para este período.</p>
    </div>
  );

  // Lista de categorias únicas para filtros
  const getAllCategories = () => {
    const allTransactions = Object.values(monthlyHistory).flat();
    const categories = new Set<string>();
    
    allTransactions.forEach(transaction => {
      if (transaction.category) {
        categories.add(transaction.category);
      }
    });
    
    return Array.from(categories).sort();
  };

  // Transações a serem exibidas
  const transactionsToShow = filterApplied ? filteredTransactions : 
                           (selectedMonth === getMonthKey() ? localTransactions : 
                           monthlyHistory[selectedMonth] || []);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Transações Pessoais</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowHistoryDialog(true)}
            className="flex items-center gap-1"
          >
            <CalendarIcon className="h-4 w-4" />
            {formatMonthKey(selectedMonth)}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterApplied(!filterApplied)}
            className={filterApplied ? "bg-primary/10" : ""}
          >
            <FilterIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {/* Filtros */}
      {filterApplied && (
        <CardContent className="pb-0 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Categoria</Label>
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {getAllCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="personal-expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={applyFilters} 
                size="sm" 
                className="flex-1"
              >
                Aplicar Filtros
              </Button>
              <Button 
                onClick={clearFilters} 
                variant="outline" 
                size="sm"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      )}
      
      {/* Lista de transações */}
      <CardContent className="pt-4">
        {transactionsToShow.length === 0 ? renderEmptyState() : (
          <div className="space-y-2">
            {transactionsToShow.map(transaction => (
              <div 
                key={`transaction-${transaction.id}`}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {getDirectionIcon(transaction)}
                  </div>
                  
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {getCategoryIcon(transaction.category)} {getCategoryLabel(transaction.category)}
                    </div>
                    <div className="text-sm text-muted-foreground">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeDate(new Date(transaction.date))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className={transaction.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {getFormattedAmount(transaction)}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(transaction, e)}
                    className="h-7 px-2 text-muted-foreground hover:text-red-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Diálogo de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico de Transações</DialogTitle>
            <DialogDescription>
              Selecione um mês para visualizar as transações desse período.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {availableMonths.map(month => (
              <Button
                key={month}
                variant={month === selectedMonth ? "default" : "outline"}
                onClick={() => handleMonthChange(month)}
                className="w-full justify-start"
              >
                {formatMonthKey(month)}
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PersonalTransactions;