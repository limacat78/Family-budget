import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { VacationDestinationFormData } from "../../types";
import { formatDateForInput, parseDateFromInput } from "@/utils/formatters";

const formSchema = z.object({
  destination: z.string().min(1, "O destino é obrigatório"),
  startDate: z.string().min(1, "A data de início é obrigatória"),
  endDate: z.string().min(1, "A data de fim é obrigatória"),
  budgetPlane: z.coerce.number().min(0, "O valor não pode ser negativo"),
  budgetHotel: z.coerce.number().min(0, "O valor não pode ser negativo"),
  budgetFood: z.coerce.number().min(0, "O valor não pode ser negativo"),
  budgetRentalCar: z.coerce.number().min(0, "O valor não pode ser negativo"),
  budgetActivities: z.coerce.number().min(0, "O valor não pode ser negativo"),
});

interface AddVacationDestinationProps {
  onDestinationAdded: () => void;
}

const AddVacationDestination = ({ onDestinationAdded }: AddVacationDestinationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      startDate: formatDateForInput(new Date().toISOString().split("T")[0]),
      endDate: formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
      budgetPlane: 0,
      budgetHotel: 0,
      budgetFood: 0,
      budgetRentalCar: 0,
      budgetActivities: 0,
    },
  });
  
  const addVacationDestinationMutation = useMutation({
    mutationFn: async (data: VacationDestinationFormData) => {
      // Tentar salvar no servidor primeiro
      try {
        const response = await apiRequest("POST", "/api/vacation-destinations", data);
        return response;
      } catch (error) {
        // Se falhar, salvar apenas localmente
        console.warn("Falha ao salvar no servidor, salvando localmente:", error);
        
        // Salvar no localStorage como backup
        const viagensLocal = localStorage.getItem("viagens");
        const viagensExistentes = viagensLocal ? JSON.parse(viagensLocal) : [];
        
        const novoDestino = {
          id: Date.now(), // ID temporário
          createdAt: new Date().toISOString(),
          destination: data.destination,
          startDate: data.startDate,
          endDate: data.endDate,
          budgetPlane: data.budgetPlane,
          budgetHotel: data.budgetHotel,
          budgetFood: data.budgetFood,
          budgetRentalCar: data.budgetRentalCar,
          budgetActivities: data.budgetActivities,
          amountSaved: 0,
          status: 'planning',
          confirmed: false,
          useVacationFund: true,
          fundAmountUsed: 0,
        };
        
        viagensExistentes.push(novoDestino);
        localStorage.setItem("viagens", JSON.stringify(viagensExistentes));
        
        return novoDestino;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacation-destinations"] });
      form.reset();
      onDestinationAdded();
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addVacationDestinationMutation.mutateAsync({
        destination: values.destination,
        startDate: parseDateFromInput(values.startDate),
        endDate: parseDateFromInput(values.endDate),
        budgetPlane: values.budgetPlane,
        budgetHotel: values.budgetHotel,
        budgetFood: values.budgetFood,
        budgetRentalCar: values.budgetRentalCar,
        budgetActivities: values.budgetActivities,
        amountSaved: 0,
      });
      
      toast({
        title: "Destino adicionado",
        description: `${values.destination} foi adicionado com sucesso.`,
      });
      
      form.reset({
        destination: "",
        startDate: formatDateForInput(new Date().toISOString().split("T")[0]),
        endDate: formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
        budgetPlane: 0,
        budgetHotel: 0,
        budgetFood: 0,
        budgetRentalCar: 0,
        budgetActivities: 0,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o destino.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Adicionar Destino de Férias</CardTitle>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budgetPlane"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>✈️ Avião (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.01} 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budgetHotel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🏨 Hotel (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.01} 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budgetFood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🍽️ Alimentação (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.01} 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budgetRentalCar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🚗 Aluguer de Carro (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.01} 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budgetActivities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🎟️ Lazer (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.01} 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            </div>
            
            <Button type="submit" className="w-full mt-4">Adicionar Destino</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddVacationDestination;