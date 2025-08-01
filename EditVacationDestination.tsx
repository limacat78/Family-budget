import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseISO, format } from "date-fns";
import { VacationDestination } from "../../types";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { formatDateForInput, parseDateFromInput } from "@/utils/formatters";

const formSchema = z.object({
  destination: z.string().min(1, "Preencha o destino"),
  startDate: z.string().min(1, "Selecione uma data de início"),
  endDate: z.string().min(1, "Selecione uma data de fim"),
  budgetPlane: z.coerce.number().min(0, "Valor não pode ser negativo"),
  budgetHotel: z.coerce.number().min(0, "Valor não pode ser negativo"),
  budgetFood: z.coerce.number().min(0, "Valor não pode ser negativo"),
  budgetRentalCar: z.coerce.number().min(0, "Valor não pode ser negativo"),
  budgetActivities: z.coerce.number().min(0, "Valor não pode ser negativo"),
  planePaid: z.boolean().default(false),
  hotelPaid: z.boolean().default(false),
  foodPaid: z.boolean().default(false),
  rentalCarPaid: z.boolean().default(false),
  activitiesPaid: z.boolean().default(false),
  planePaidBy: z.string().default(""),
  hotelPaidBy: z.string().default(""),
  foodPaidBy: z.string().default(""),
  rentalCarPaidBy: z.string().default(""),
  activitiesPaidBy: z.string().default(""),
});

interface EditVacationDestinationProps {
  destination: VacationDestination;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditVacationDestination = ({ destination, onSuccess, onCancel }: EditVacationDestinationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Inicializar formulário com valores existentes
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: destination.destination,
      startDate: typeof destination.startDate === 'string' 
        ? formatDateForInput(destination.startDate.split('T')[0]) 
        : formatDateForInput(format(destination.startDate, 'yyyy-MM-dd')),
      endDate: typeof destination.endDate === 'string' 
        ? formatDateForInput(destination.endDate.split('T')[0]) 
        : formatDateForInput(format(destination.endDate, 'yyyy-MM-dd')),
      budgetPlane: destination.budgetPlane,
      budgetHotel: destination.budgetHotel,
      budgetFood: destination.budgetFood,
      budgetRentalCar: destination.budgetRentalCar,
      budgetActivities: destination.budgetActivities,
      planePaid: destination.planePaid || false,
      hotelPaid: destination.hotelPaid || false,
      foodPaid: destination.foodPaid || false,
      rentalCarPaid: destination.rentalCarPaid || false,
      activitiesPaid: destination.activitiesPaid || false,
      planePaidBy: destination.planePaidBy || "",
      hotelPaidBy: destination.hotelPaidBy || "",
      foodPaidBy: destination.foodPaidBy || "",
      rentalCarPaidBy: destination.rentalCarPaidBy || "",
      activitiesPaidBy: destination.activitiesPaidBy || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Enviando dados para atualização:", values);
      
      // Certifique-se de que os valores booleanos são realmente booleanos e converta datas
      const formattedValues = {
        ...values,
        startDate: parseDateFromInput(values.startDate),
        endDate: parseDateFromInput(values.endDate),
        planePaid: Boolean(values.planePaid),
        hotelPaid: Boolean(values.hotelPaid),
        foodPaid: Boolean(values.foodPaid),
        rentalCarPaid: Boolean(values.rentalCarPaid),
        activitiesPaid: Boolean(values.activitiesPaid)
      };
      
      // Remova valores vazios de "paidBy" se o item não estiver marcado como pago
      if (!formattedValues.planePaid) formattedValues.planePaidBy = "";
      if (!formattedValues.hotelPaid) formattedValues.hotelPaidBy = "";
      if (!formattedValues.foodPaid) formattedValues.foodPaidBy = "";
      if (!formattedValues.rentalCarPaid) formattedValues.rentalCarPaidBy = "";
      if (!formattedValues.activitiesPaid) formattedValues.activitiesPaidBy = "";
      
      console.log("Dados formatados:", formattedValues);
      
      await apiRequest(
        "PATCH",
        `/api/vacation-destinations/${destination.id}`,
        formattedValues
      );
      
      // Invalidar cache para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-destinations'] });
      
      toast({
        title: "Destino atualizado",
        description: `${values.destination} foi atualizado com sucesso.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar destino:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o destino. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Editar Destino de Férias</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Paris, França" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="DD/MM/AA" 
                        maxLength={8}
                        {...field} 
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                          if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 7);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="DD/MM/AA" 
                        maxLength={8}
                        {...field} 
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                          if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 7);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Grid com 2 colunas para as rubricas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Avião */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">✈️ Avião</h3>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budgetPlane"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">Orçamento (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="planePaid"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 mt-3">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                          <FormLabel className="text-sm font-medium text-gray-600">Pago</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Hotel */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">🏨 Hotel</h3>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budgetHotel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">Orçamento (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hotelPaid"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 mt-3">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                          <FormLabel className="text-sm font-medium text-gray-600">Pago</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Alimentação */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">🍽️ Alimentação</h3>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budgetFood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">Orçamento (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="foodPaid"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 mt-3">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                          <FormLabel className="text-sm font-medium text-gray-600">Pago</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Aluguer de Carro */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">🚗 Aluguer de Carro</h3>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budgetRentalCar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">Orçamento (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rentalCarPaid"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 mt-3">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                          <FormLabel className="text-sm font-medium text-gray-600">Pago</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Lazer */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">🎟️ Lazer</h3>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budgetActivities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-600">Orçamento (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="activitiesPaid"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 mt-3">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                          <FormLabel className="text-sm font-medium text-gray-600">Pago</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            
            <div className="flex justify-end mt-6 space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "A salvar..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditVacationDestination;