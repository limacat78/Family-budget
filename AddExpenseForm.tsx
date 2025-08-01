import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { ExpenseFormData } from "../../types";

const formSchema = z.object({
  description: z.string().max(100).optional(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Selecione uma categoria"),
  date: z.string().min(1, "Selecione uma data"),
});

interface AddExpenseFormProps {
  userId: number;
}

const AddExpenseForm = ({ userId }: AddExpenseFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configurar a mutação para adicionar despesa pessoal
  const addExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      await apiRequest("POST", "/api/personal-expense", data);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-expense"] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Definimos quais categorias devem ser tratadas como contribuições positivas
      // versus despesas regulares (negativas)
      const isSpecialCategory = values.category === "saude";
      
      // Trate a categoria "saude" como despesa normal (valor negativo)
      const amount = -Math.abs(values.amount);
      
      console.log("Enviando despesa para o backend:", {
        userId,
        description: values.description || "",
        amount: amount,
        category: values.category,
        date: values.date,
        isSpecialCategory: isSpecialCategory
      });
      
      await addExpenseMutation.mutateAsync({
        userId,
        description: values.description || "",
        amount: amount,
        category: values.category,
        date: values.date,
      });
      
      toast({
        title: "Despesa adicionada",
        description: `${values.description || values.category} (${values.amount}€) adicionada com sucesso.`,
      });
      
      form.reset({
        description: "",
        amount: 0,
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
      
      // Forçar atualização das queries imediatamente
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-expense"] });
      
    } catch (error) {
      console.error("Erro ao adicionar despesa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Adicionar Despesa</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-1">
                        🏠 Categoria
                      </span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cabeleireiro">💇 Cabeleireiro</SelectItem>
                        <SelectItem value="fundo_emergencia">🚨 Fundo Emergência</SelectItem>
                        <SelectItem value="Fundo Férias">🏖️ Fundo Férias</SelectItem>
                        <SelectItem value="fundo_obras">🔨 Fundo Obras</SelectItem>
                        <SelectItem value="ginasio">🏋️ Ginásio</SelectItem>
                        <SelectItem value="iuc">📝 IUC</SelectItem>
                        <SelectItem value="manutencao_conta">🏦 Manutenção conta</SelectItem>
                        <SelectItem value="outros">📌 Outros</SelectItem>
                        <SelectItem value="PPR">💰 PPR</SelectItem>
                        <SelectItem value="prestacao_carro">🚗 Prestação Carro</SelectItem>
                        <SelectItem value="revisao_carro">🔧 Revisão carro</SelectItem>
                        <SelectItem value="roupa">👕 Roupa</SelectItem>
                        <SelectItem value="saude">🩺 Saúde</SelectItem>
                        <SelectItem value="seguro_carro">🔒 Seguro carro</SelectItem>
                        <SelectItem value="subscricoes">📺 Subscrições</SelectItem>
                        <SelectItem value="telemovel">📱 Telemóvel</SelectItem>
                        <SelectItem value="visa">💳 Visa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-1">
                        💰 Valor (€)
                      </span>
                    </FormLabel>
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-1">
                        📅 Data
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-end">
                <FormItem className="w-full">
                  <FormLabel>
                    <span className="flex items-center gap-1">
                      👤 Pago por
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input value={userId === 1 ? 'Cat' : 'Gui'} disabled />
                  </FormControl>
                </FormItem>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="flex items-center gap-1">
                      📝 Descrição
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">Adicionar Despesa</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddExpenseForm;
