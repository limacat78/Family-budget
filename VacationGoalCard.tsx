import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBudgetData } from "@/hooks/useBudgetData";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { calculateMonthsUntil } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  destination: z.string().optional(),
  targetDate: z.string().min(1, "Selecione uma data"),
  targetAmount: z.coerce.number().positive("Valor deve ser positivo"),
  currentSavings: z.coerce.number().min(0, "Valor não pode ser negativo"),
});

const VacationGoalCard = () => {
  const { summary, updateVacationGoal, isLoading } = useBudgetData();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      targetDate: "",
      targetAmount: 0,
      currentSavings: 0,
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (summary?.vacation.goal) {
      const goal = summary.vacation.goal;
      form.reset({
        destination: goal.destination || "",
        targetDate: goal.targetDate 
          ? new Date(goal.targetDate).toISOString().split("T")[0]
          : "",
        targetAmount: Number(goal.targetAmount),
        currentSavings: Number(summary.vacation.savings),
      });
    }
  }, [summary?.vacation.goal, summary?.vacation.savings, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateVacationGoal({
        destination: values.destination,
        targetDate: values.targetDate,
        targetAmount: values.targetAmount,
        currentSavings: values.currentSavings,
      });
      
      toast({
        title: "Objetivo atualizado",
        description: "O objetivo de férias foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o objetivo de férias.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Objectivo de Férias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-48 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  const vacationGoal = summary.vacation.goal;
  const progress = summary.vacation.progress;
  
  // Calculate monthly savings needed
  const monthsRemaining = vacationGoal?.targetDate 
    ? calculateMonthsUntil(vacationGoal.targetDate)
    : 1;
  
  const amountRemaining = vacationGoal 
    ? Number(vacationGoal.targetAmount) - summary.vacation.savings
    : 0;
  
  const monthlySavingsNeeded = amountRemaining / monthsRemaining;
  
  // Extract target month for display
  const targetMonth = vacationGoal?.targetDate 
    ? new Date(vacationGoal.targetDate).toLocaleString('default', { month: 'long' })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Objectivo de Férias</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* Beach vacation image */}
                <img 
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
                  alt="Beach vacation destination" 
                  className="w-full h-48 object-cover rounded-lg shadow-sm mb-4"
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Destino de Férias</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Data da Viagem</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Orçamento Total (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          step={50} 
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
                  name="currentSavings"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Poupança Atual (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          step={10} 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-primary mb-2">Progresso para Objetivo</h4>
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-accent h-3 rounded-full" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>€0</span>
                      <span>{formatCurrency(vacationGoal?.targetAmount || 0)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="mb-1">Progresso: <span className="font-medium">{Math.round(progress)}%</span></p>
                    <p className="mb-1">Valor em falta: <span className="font-medium">{formatCurrency(amountRemaining)}</span></p>
                    {vacationGoal?.targetDate && (
                      <p>Necessário poupar: <span className="font-medium">{formatCurrency(monthlySavingsNeeded)}/mês</span> até {targetMonth}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <Button type="submit">Atualizar Objetivo</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VacationGoalCard;
