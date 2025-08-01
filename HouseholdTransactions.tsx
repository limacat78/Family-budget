import { Transaction } from "../../types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HouseholdTransactionsProps {
  transactions: Transaction[];
}

const HouseholdTransactions = ({ transactions }: HouseholdTransactionsProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPaidBy, setFilterPaidBy] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  useEffect(() => {
    // Filtra apenas transações domésticas
    const household = transactions.filter(transaction => 'paidBy' in transaction);
    
    // Log para depuração
    console.log("Todas as transações da casa:", household);
    
    // Ordenar as transações por data (mais recentes primeiro)
    const sortedTransactions = [...household].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    setLocalTransactions(sortedTransactions);
    setFilteredTransactions(sortedTransactions);
  }, [transactions]);

  const handleDelete = async (transactionId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const endpoint = `/api/household-expense/${transactionId}`;
    
    if (window.confirm(`Tem certeza que deseja excluir esta despesa familiar?`)) {
      console.log(`Tentando excluir no endpoint: ${endpoint}`);
      
      try {
        await fetch(endpoint, { method: 'DELETE' });
        
        // Atualiza o estado local para remover imediatamente a transação da UI
        setLocalTransactions(prevTransactions => 
          prevTransactions.filter(t => t.id !== transactionId)
        );
        
        toast({
          title: 'Transação removida',
          description: 'A transação foi excluída com sucesso!'
        });
        
        // Invalidar a query após a exclusão bem-sucedida
        queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
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
      'supermercado': '🛒',
      'gasolina': '⛽',
      'electricidade': '💡',
      'água': '🚰',
      'agua_luz_gas': '💧',
      'internet': '📶',
      'vodafone_tv': '📺',
      'emprestimo_habitacao': '🏠',
      'condominio': '🏢',
      'renda_casa': '🏘️',
      'limpeza': '🧹',
      'Poupança': '💰',
      'poupanca': '💰',
      'fundo_emergencia': '💸',
      'Fundo Férias': '💰',
      'Fundo de Férias': '🏖️',
      'Fundo Obras': '🔨',
      'fundo_obras': '🔨',
      'gato_pixel': '🐾',
      'cartao_refeicao': '🍽️',
      'casa_lazer': '🎮',
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
      'agua_luz_gas': 'Água/Luz/Gás',
      'internet': 'Internet',
      'vodafone_tv': 'Vodafone TV',
      'emprestimo_habitacao': 'Empréstimo Habitação',
      'condominio': 'Condomínio',
      'renda_casa': 'Renda Casa',
      'limpeza': 'Limpeza',
      'Poupança': 'Poupança',
      'poupanca': 'Poupança',
      'fundo_emergencia': 'Fundo de Emergência',
      'Fundo Férias': 'Fundo de Férias',
      'gato_pixel': 'Gato Pixel',
      'cartao_refeicao': 'Cartão Refeição',
      'casa_lazer': 'Casa Lazer'
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

  // Função para aplicar filtros às transações
  const applyFilters = () => {
    let filtered = [...localTransactions];
    
    // Filtrar por categoria
    if (filterCategory && filterCategory !== "_todas_") {
      filtered = filtered.filter(t => 'category' in t && t.category === filterCategory);
    }
    
    // Filtrar por quem pagou
    if (filterPaidBy) {
      filtered = filtered.filter(t => 'paidBy' in t && t.paidBy === filterPaidBy);
    }
    
    // Filtrar por data de início
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(t => new Date(t.date) >= fromDate);
    }
    
    // Filtrar por data de fim
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(t => new Date(t.date) <= toDate);
    }
    
    setFilteredTransactions(filtered);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setFilterCategory("");
    setFilterPaidBy("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilteredTransactions(localTransactions);
  };

  // Efeito para aplicar filtros quando qualquer filtro mudar
  useEffect(() => {
    applyFilters();
  }, [filterCategory, filterPaidBy, filterDateFrom, filterDateTo]);

  // Obter categorias únicas das transações
  const getUniqueCategories = () => {
    const categories = localTransactions
      .filter(t => 'category' in t)
      .map(t => t.category as string)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    return categories;
  };

  // Função para obter apenas o nome da categoria sem ícone
  const getCategoryNameOnly = (category: string): string => {
    // Mapeamento para normalizar categorias específicas
    const categoryMap: Record<string, string> = {
      'supermercado': 'Supermercado',
      'gasolina': 'Gasolina',
      'electricidade': 'Electricidade',
      'água': 'Água',
      'agua_luz_gas': 'Água/Luz/Gás',
      'internet': 'Internet',
      'vodafone_tv': 'Vodafone TV',
      'emprestimo_habitacao': 'Empréstimo Habitação',
      'condominio': 'Condomínio',
      'renda_casa': 'Renda Casa',
      'limpeza': 'Limpeza',
      'Poupança': 'Poupança',
      'poupanca': 'Poupança',
      'fundo_emergencia': 'Fundo de Emergência',
      'Fundo Férias': 'Fundo de Férias',
      'gato_pixel': 'Gato Pixel',
      'cartao_refeicao': 'Cartão Refeição',
      'casa_lazer': 'Casa Lazer',
      'via_verde': 'Via Verde',
      'farmacia': 'Farmácia',
      'impostos': 'Impostos',
      'restaurantes': 'Restaurantes',
      'subscricoes': 'Subscrições',
      'uber_carro': 'Uber/Carro'
    };
    
    if (categoryMap[category]) {
      return categoryMap[category];
    }
    
    if (category && category.includes('_')) {
      return category
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    if (category && typeof category === 'string') {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    return 'Sem categoria';
  };

  const getAmountDisplay = (transaction: any) => {
    return (
      <p className="font-medium text-red-600">
        {formatCurrency(Number(transaction.amount))}
      </p>
    );
  };

  // Renderiza um item de transação (para reuso na lista principal e no modal)
  const renderTransactionItem = (transaction: Transaction, fullView = false) => {
    if (!('paidBy' in transaction)) return null;
    
    return (
      <div 
        key={`household-transaction-${transaction.id}-${Math.random()}`} 
        className={`px-4 py-3 flex items-center justify-between ${fullView ? 'border-b border-gray-200 last:border-0' : ''}`}
      >
        <div className="flex items-center">
          <div>
            <p className="font-medium text-sm">{getCategoryDisplay(transaction)}</p>
            <p className="text-gray-500 text-xs">
              {`Pago por: ${getPaidByDisplay(transaction.paidBy)} | ${formatRelativeDate(transaction.date)}`}
            </p>
            {transaction.description && (
              <p className="text-gray-600 text-xs mt-1">{transaction.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {getAmountDisplay(transaction)}
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-gray-400 hover:text-red-500"
            onClick={(e) => handleDelete(transaction.id, e)}
          >
            <span className="material-icons text-base">
              delete
            </span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Transações da Casa</CardTitle>
        </CardHeader>
        {/* Adicionando altura máxima com scroll interno */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-200">
          {localTransactions.length === 0 ? (
            <CardContent className="py-4">
              <p className="text-center text-gray-500">Nenhuma transação doméstica encontrada</p>
            </CardContent>
          ) : (
            // Mostrar as 5 transações mais recentes (já estão ordenadas por data)
          localTransactions
            .slice(0, 5)
            .map((transaction) => renderTransactionItem(transaction))
          )}
        </div>
        <CardFooter className="bg-gray-50 py-3 border-t">
          <Button 
            variant="link" 
            className="text-primary text-sm font-medium mx-auto"
            onClick={() => setShowAllTransactions(true)}
          >
            Ver todas as transações da casa
          </Button>
        </CardFooter>
      </Card>

      {/* Modal para ver todas as transações */}
      <Dialog open={showAllTransactions} onOpenChange={setShowAllTransactions}>
        <DialogContent className="sm:max-w-3xl" aria-describedby="modal-transacoes-descricao">
          <DialogHeader>
            <DialogTitle className="text-xl">Todas as Transações da Casa</DialogTitle>
          </DialogHeader>
          <p id="modal-transacoes-descricao" className="sr-only">
            Lista completa de transações da casa com opções de filtro por categoria, pessoa e período.
          </p>
          
          {/* Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div>
              <Label className="text-sm mb-1 block">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_todas_">Todas as categorias</SelectItem>
                  {getUniqueCategories()
                    .filter(category => category && category.trim() !== '')
                    .map(category => {
                      // Garantimos que cada valor é válido e único
                      const safeValue = category || "sem_categoria";
                      return safeValue ? (
                        <SelectItem key={safeValue} value={safeValue}>
                          {getCategoryIcon(category)} {getCategoryNameOnly(category)}
                        </SelectItem>
                      ) : null;
                    }).filter(Boolean)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">Pago por</Label>
              <Select value={filterPaidBy} onValueChange={setFilterPaidBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="person1">Cat</SelectItem>
                  <SelectItem value="person2">Gui</SelectItem>
                  <SelectItem value="shared">Compartilhado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">De</Label>
              <Input 
                type="date" 
                value={filterDateFrom} 
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">Até</Label>
              <Input 
                type="date" 
                value={filterDateTo} 
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          
          <div className="text-right mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="text-sm"
            >
              Limpar filtros
            </Button>
          </div>
          
          {/* Lista de transações com scroll */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada com os filtros atuais</p>
            ) : (
              filteredTransactions.map((transaction) => renderTransactionItem(transaction, true))
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <p className="text-sm text-gray-500 mr-auto">
              Total: {filteredTransactions.length} transações
            </p>
            <Button onClick={() => setShowAllTransactions(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HouseholdTransactions;