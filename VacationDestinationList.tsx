import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  differenceInDays, 
  differenceInWeeks, 
  format, 
  parseISO 
} from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { VacationDestination } from "../../types";
import EditVacationDestination from "./EditVacationDestination";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VacationDestinationListProps {
  destinations: VacationDestination[];
  onAddClick: () => void;
  editingDestination?: VacationDestination | null;
  onEditComplete?: () => void;
}

const VacationDestinationList = ({ destinations, onAddClick, editingDestination: propEditingDestination, onEditComplete }: VacationDestinationListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localEditingDestination, setLocalEditingDestination] = useState<VacationDestination | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Usar o destino de edição vindo da prop ou o local
  const editingDestination = propEditingDestination || localEditingDestination;
  
  const calculateTotalBudget = (destination: VacationDestination) => {
    return (
      destination.budgetPlane +
      destination.budgetHotel +
      destination.budgetFood +
      destination.budgetRentalCar +
      destination.budgetActivities
    );
  };
  
  const calculateAmountToSave = (destination: VacationDestination) => {
    const totalBudget = calculateTotalBudget(destination);
    const itemsPaidAmount = calculateItemsPaidAmount(destination);
    const remainingAmount = totalBudget - itemsPaidAmount; // Apenas o que não foi pago ainda
    
    const today = new Date();
    const startDate = typeof destination.startDate === 'string' 
      ? parseISO(destination.startDate) 
      : destination.startDate;
    
    const daysUntilTravel = differenceInDays(startDate, today);
    const weeksUntilTravel = differenceInWeeks(startDate, today);
    
    return {
      remaining: remainingAmount > 0 ? remainingAmount : 0,
      perDay: daysUntilTravel > 0 ? (remainingAmount > 0 ? remainingAmount / daysUntilTravel : 0) : 0,
      perWeek: weeksUntilTravel > 0 ? (remainingAmount > 0 ? remainingAmount / weeksUntilTravel : 0) : 0,
      daysLeft: daysUntilTravel,
      weeksLeft: weeksUntilTravel
    };
  };
  
  const calculateNumberOfNights = (destination: VacationDestination) => {
    const startDate = typeof destination.startDate === 'string' 
      ? parseISO(destination.startDate) 
      : destination.startDate;
    
    const endDate = typeof destination.endDate === 'string' 
      ? parseISO(destination.endDate) 
      : destination.endDate;
    
    return differenceInDays(endDate, startDate);
  };
  
  const calculateItemsPaidAmount = (destination: VacationDestination) => {
    let totalPaid = 0;
    
    if (destination.planePaid) {
      totalPaid += destination.budgetPlane;
    }
    
    if (destination.hotelPaid) {
      totalPaid += destination.budgetHotel;
    }
    
    if (destination.foodPaid) {
      totalPaid += destination.budgetFood;
    }
    
    if (destination.rentalCarPaid) {
      totalPaid += destination.budgetRentalCar;
    }
    
    if (destination.activitiesPaid) {
      totalPaid += destination.budgetActivities;
    }
    
    return totalPaid;
  };
  
  const calculateProgress = (destination: VacationDestination) => {
    const totalBudget = calculateTotalBudget(destination);
    const itemsPaidAmount = calculateItemsPaidAmount(destination);
    return totalBudget > 0 ? (itemsPaidAmount / totalBudget) * 100 : 0;
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
  
  const handleEditDestination = (destination: VacationDestination) => {
    setLocalEditingDestination(destination);
  };
  
  const handleEditSuccess = () => {
    setLocalEditingDestination(null);
    if (onEditComplete) onEditComplete();
    toast({
      title: "Destino atualizado",
      description: "O destino foi atualizado com sucesso.",
    });
  };
  
  const handleDeleteDestination = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este destino?")) {
      try {
        await apiRequest(
          "DELETE",
          `/api/vacation-destinations/${id}`
        );
        
        // Invalidar cache para recarregar dados
        queryClient.invalidateQueries({ queryKey: ['/api/vacation-destinations'] });
        
        toast({
          title: "Destino excluído",
          description: "O destino foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir destino:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o destino.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Se estiver editando um destino, mostrar o formulário de edição
  if (editingDestination) {
    return (
      <EditVacationDestination 
        destination={editingDestination} 
        onSuccess={handleEditSuccess} 
        onCancel={() => {
          setLocalEditingDestination(null);
          if (onEditComplete) onEditComplete();
        }}
      />
    );
  }

  if (destinations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Destinos de Férias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Ainda não tem nenhum destino de férias definido.</p>
            <Button variant="outline" onClick={onAddClick}>Adicionar Destino</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Meus Destinos de Férias</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {destinations.map((destination) => {
              const totalBudget = calculateTotalBudget(destination);
              const savings = calculateAmountToSave(destination);
              const progress = calculateProgress(destination);
              const actualStatus = getActualStatus(destination);
              
              return (
                <AccordionItem value={`item-${destination.id}`} key={destination.id}>
                  <AccordionTrigger className="hover:bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">{destination.destination}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            actualStatus === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getStatusIcon(actualStatus)} {getStatusLabel(actualStatus)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {typeof destination.startDate === 'string' 
                            ? format(parseISO(destination.startDate), 'dd/MM/yyyy')
                            : format(destination.startDate, 'dd/MM/yyyy')}
                          {' — '}
                          {typeof destination.endDate === 'string' 
                            ? format(parseISO(destination.endDate), 'dd/MM/yyyy')
                            : format(destination.endDate, 'dd/MM/yyyy')}
                          {' • '}
                          <span className="font-medium">{calculateNumberOfNights(destination)} noites</span>
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className="font-medium">
                          {formatCurrency(calculateItemsPaidAmount(destination))} / {formatCurrency(totalBudget)}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Progresso dos pagamentos:</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${progress > 100 ? 100 : progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <h4 className="font-medium mb-2">Orçamento</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="py-2 w-1/3">Item</TableHead>
                                <TableHead className="py-2 text-center w-1/3">Valor</TableHead>
                                <TableHead className="py-2 text-right w-1/3">Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="py-2">✈️ Avião</TableCell>
                                <TableCell className="py-2 text-center">{formatCurrency(destination.budgetPlane)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  {destination.planePaid ? (
                                    <span className="text-green-600 text-sm">Pago</span>
                                  ) : (
                                    <span className="text-red-600 text-sm">Em falta</span>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2">🏨 Hotel</TableCell>
                                <TableCell className="py-2 text-center">{formatCurrency(destination.budgetHotel)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  {destination.hotelPaid ? (
                                    <span className="text-green-600 text-sm">Pago</span>
                                  ) : (
                                    <span className="text-red-600 text-sm">Em falta</span>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2">🍽️ Alimentação</TableCell>
                                <TableCell className="py-2 text-center">{formatCurrency(destination.budgetFood)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  {destination.foodPaid ? (
                                    <span className="text-green-600 text-sm">Pago</span>
                                  ) : (
                                    <span className="text-red-600 text-sm">Em falta</span>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2">🚗 Aluguer de Carro</TableCell>
                                <TableCell className="py-2 text-center">{formatCurrency(destination.budgetRentalCar)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  {destination.rentalCarPaid ? (
                                    <span className="text-green-600 text-sm">Pago</span>
                                  ) : (
                                    <span className="text-red-600 text-sm">Em falta</span>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2">🎟️ Lazer</TableCell>
                                <TableCell className="py-2 text-center">{formatCurrency(destination.budgetActivities)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  {destination.activitiesPaid ? (
                                    <span className="text-green-600 text-sm">Pago</span>
                                  ) : (
                                    <span className="text-red-600 text-sm">Em falta</span>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2 font-medium">Total</TableCell>
                                <TableCell className="py-2 text-center font-medium">{formatCurrency(totalBudget)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  {calculateItemsPaidAmount(destination) > 0 ? (
                                    <span className="text-blue-600 text-sm">
                                      {formatCurrency(calculateItemsPaidAmount(destination))} pago
                                    </span>
                                  ) : ''}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Poupança</h4>
                          <Table>
                            <TableBody>

                              {calculateItemsPaidAmount(destination) > 0 && (
                                <TableRow>
                                  <TableCell className="py-2">Valor já pago (do fundo)</TableCell>
                                  <TableCell className="py-2 text-right text-blue-600">
                                    {formatCurrency(calculateItemsPaidAmount(destination))}
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow>
                                <TableCell className="py-2">Valor em falta</TableCell>
                                <TableCell className="py-2 text-right">{formatCurrency(savings.remaining)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2">Tempo até à viagem</TableCell>
                                <TableCell className="py-2 text-right">
                                  {savings.daysLeft} dias ({savings.weeksLeft} semanas)
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2 font-medium">Poupança semanal necessária</TableCell>
                                <TableCell className="py-2 text-right font-medium">
                                  {formatCurrency(savings.perWeek)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-2">Poupança diária necessária</TableCell>
                                <TableCell className="py-2 text-right">
                                  {formatCurrency(savings.perDay)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditDestination(destination)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteDestination(destination.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default VacationDestinationList;