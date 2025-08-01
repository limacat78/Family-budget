import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VacationDestination } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './VacationManagement.css';

interface VacationManagementProps {
  fundAmount: number;
  onAddDestinationClick?: () => void;
  onEditDestinationClick?: (destination: VacationDestination) => void;
}

const VacationManagement: React.FC<VacationManagementProps> = ({ fundAmount, onAddDestinationClick, onEditDestinationClick }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    year: 'all',
    month: 'all',
    status: 'all'
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState<VacationDestination | null>(null);

  // Persistência com localStorage usando hook customizado
  const [localDestinations, setLocalDestinations] = useLocalStorage<VacationDestination[]>("viagens", []);

  // Query para buscar destinos do servidor
  const { data: serverDestinations = [], isLoading } = useQuery<VacationDestination[]>({
    queryKey: ['/api/vacation-destinations'],
  });

  // Sincronizar com servidor quando os dados do servidor mudarem
  useEffect(() => {
    if (serverDestinations.length > 0) {
      // Apenas sincronizar se os dados do servidor forem diferentes dos locais
      const serverIds = serverDestinations.map(dest => dest.id).sort();
      const localIds = localDestinations.map(dest => dest.id).sort();
      
      if (JSON.stringify(serverIds) !== JSON.stringify(localIds)) {
        setLocalDestinations(serverDestinations);
      }
    }
  }, [serverDestinations]);

  // Combinar destinos do servidor e locais, removendo duplicados
  const allDestinations = [...serverDestinations];
  
  // Adicionar destinos locais que não existem no servidor
  localDestinations.forEach(localDest => {
    const existsInServer = serverDestinations.some(serverDest => 
      serverDest.id === localDest.id
    );
    if (!existsInServer) {
      allDestinations.push(localDest);
    }
  });
  
  const destinations = allDestinations;

  // Mutation para confirmar viagem
  const confirmTripMutation = useMutation({
    mutationFn: async (destinationId: number) => {
      return apiRequest(`/api/vacation-destinations/${destinationId}/confirm`, 'PATCH');
    },
    onSuccess: (_, destinationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      
      // Atualizar também o estado local
      setLocalDestinations(prev => 
        prev.map(dest => 
          dest.id === destinationId ? { ...dest, status: 'confirmed' } : dest
        )
      );
      
      toast({
        title: "Viagem confirmada",
        description: "O valor foi descontado do fundo de férias.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a viagem.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar viagem
  const deleteTripMutation = useMutation({
    mutationFn: async (destinationId: number) => {
      return apiRequest(`/api/vacation-destinations/${destinationId}`, 'DELETE');
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-destinations'] });
      
      // Remover também do estado local
      setLocalDestinations(prev => 
        prev.filter(dest => dest.id !== deletedId)
      );
      
      toast({
        title: "Viagem removida",
        description: "A viagem foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a viagem.",
        variant: "destructive",
      });
    },
  });

  const calcularCustoTotal = (destination: VacationDestination) => {
    return Number(destination.budgetPlane) + 
           Number(destination.budgetHotel) + 
           Number(destination.budgetFood) + 
           Number(destination.budgetRentalCar) + 
           Number(destination.budgetActivities);
  };

  // Função para calcular quanto foi pago (rubricas marcadas como pagas)
  const calcularValorPago = (destination: VacationDestination) => {
    let totalPago = 0;
    
    if (destination.planePaid) {
      totalPago += Number(destination.budgetPlane);
    }
    if (destination.hotelPaid) {
      totalPago += Number(destination.budgetHotel);
    }
    if (destination.foodPaid) {
      totalPago += Number(destination.budgetFood);
    }
    if (destination.rentalCarPaid) {
      totalPago += Number(destination.budgetRentalCar);
    }
    if (destination.activitiesPaid) {
      totalPago += Number(destination.budgetActivities);
    }
    
    return totalPago;
  };

  // Função para calcular valor por pagar (custo total - valor pago)
  const calcularValorPorPagar = (destination: VacationDestination) => {
    const custoTotal = calcularCustoTotal(destination);
    const valorPago = calcularValorPago(destination);
    return Math.max(custoTotal - valorPago, 0); // Não pode ser negativo
  };

  const calcularProgresso = (destination: VacationDestination) => {
    const custoTotal = calcularCustoTotal(destination);
    const valorPago = calcularValorPago(destination);
    return custoTotal > 0 ? Math.min((valorPago / custoTotal) * 100, 100) : 0;
  };

  const formatarData = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Função para calcular o status atual baseado na data
  const getActualStatus = (destination: VacationDestination) => {
    const today = new Date();
    const endDate = typeof destination.endDate === 'string' 
      ? parseISO(destination.endDate) 
      : new Date(destination.endDate);
    
    // Se a data de fim da viagem já passou, status é "completed"
    if (endDate < today) {
      return 'completed';
    }
    
    // Caso contrário, status é "planning"
    return 'planning';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return 'A planear';
      case 'completed':
        return 'Concluída';
      default:
        return 'A planear';
    }
  };

  const handleEditDestination = (destination: VacationDestination) => {
    if (onEditDestinationClick) {
      onEditDestinationClick(destination);
    } else {
      setEditingDestination(destination);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return '📋';
      case 'completed':
        return '✅';
      default:
        return '📋';
    }
  };

  const filteredDestinations = destinations.filter((dest: VacationDestination) => {
    if (filters.year !== 'all') {
      const year = new Date(dest.startDate).getFullYear().toString();
      if (year !== filters.year) return false;
    }
    
    if (filters.month !== 'all') {
      const month = (new Date(dest.startDate).getMonth() + 1).toString();
      if (month !== filters.month) return false;
    }
    
    if (filters.status !== 'all' && getActualStatus(dest) !== filters.status) {
      return false;
    }
    
    return true;
  });

  const totalPlanned = (destinations as VacationDestination[])
    .filter((d: VacationDestination) => d.useVacationFund && getActualStatus(d) !== 'completed')
    .reduce((sum: number, d: VacationDestination) => sum + calcularCustoTotal(d), 0);

  const remainingFund = Math.max(0, fundAmount - totalPlanned);

  if (isLoading) {
    return <div className="viagens-container">Carregando viagens...</div>;
  }

  return (
    <div className="viagens-container">
      <div className="viagens-header">
        <h2>Gestão de Viagens</h2>
        <button 
          className="add-trip-btn"
          onClick={() => onAddDestinationClick ? onAddDestinationClick() : setShowAddForm(true)}
        >
          + Adicionar Viagem
        </button>
      </div>

      {/* Integração com Fundo de Férias */}
      <div className={`fund-integration ${remainingFund < fundAmount * 0.1 ? 'fund-warning' : ''}`}>
        <span>💰</span>
        <div>
          <strong>Fundo de Férias: </strong>
          <span className="fund-amount">{fundAmount.toFixed(2)}€</span>
          {totalPlanned > 0 && (
            <>
              {' '} | Planeado: <span className="fund-amount">{totalPlanned.toFixed(2)}€</span>
              {' '} | Restante: <span className="fund-amount">{remainingFund.toFixed(2)}€</span>
            </>
          )}
        </div>
        {localDestinations.length > serverDestinations.length && (
          <div className="sync-indicator">
            <span>🔄</span>
            <span>Dados salvos localmente</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <select 
          className="filter-select"
          value={filters.year}
          onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
        >
          <option value="all">Todos os anos</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

        <select 
          className="filter-select"
          value={filters.month}
          onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
        >
          <option value="all">Todos os meses</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {format(new Date(2024, i), 'MMMM', { locale: ptBR })}
            </option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">Todos os estados</option>
          <option value="planning">A planear</option>
          <option value="completed">Concluída</option>
        </select>
      </div>

      {/* Tabela de Viagens */}
      {filteredDestinations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✈️</div>
          <h3>Nenhuma viagem encontrada</h3>
          <p>Adicione sua primeira viagem para começar a planear!</p>
        </div>
      ) : (
        <table className="tabela-viagens">
          <thead>
            <tr>
              <th>Destino</th>
              <th>Datas</th>
              <th>Custo Total</th>
              <th>Valor por pagar</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredDestinations.map((destination: VacationDestination) => {
              const custoTotal = calcularCustoTotal(destination);
              const valorPorPagar = calcularValorPorPagar(destination);
              const progresso = calcularProgresso(destination);
              const actualStatus = getActualStatus(destination);
              
              return (
                <tr key={destination.id}>
                  <td className="destino-cell">{destination.destination}</td>
                  <td className="datas-cell">
                    {formatarData(destination.startDate)} – {formatarData(destination.endDate)}
                  </td>
                  <td className="custo-cell">{custoTotal.toFixed(2)} €</td>
                  <td className="poupado-cell">{valorPorPagar.toFixed(2)} €</td>
                  <td>
                    <span className={`estado ${actualStatus}`}>
                      {getStatusIcon(actualStatus)} {getStatusLabel(actualStatus)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleEditDestination(destination)}
                    >
                      Editar
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteTripMutation.mutate(destination.id)}
                      disabled={deleteTripMutation.isPending}
                    >
                      {deleteTripMutation.isPending ? 'Removendo...' : 'Remover'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VacationManagement;