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
import { IncomeFormData } from "../../types";

// Função para obter o ícone correspondente à categoria de receita
const getIncomeIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    'ordenado': '💼',
    'bonus': '🎁',
    'cartao_refeicao': '🍽️',
    'default': '💰'
  };
  
  return iconMap[category] || iconMap.default;
};

// Função para formatar o nome da categoria 
const getCategoryLabel = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'ordenado': 'Ordenado',
    'bonus': 'Bónus',
    'cartao_refeicao': 'Cartão Refeição'
  };
  
  return categoryMap[category] || category;
};

// Função para obter nome do usuário
const getUserName = (userId: number): string => {
  return userId === 1 ? 'Cat' : 'Gui';
};

const formSchema = z.object({
  description: z.string().max(100).optional(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Selecione uma categoria"),
  date: z.string().min(1, "Selecione uma data"),
});

interface AddIncomeFormProps {
  userId: number;
}

const AddIncomeForm = ({ userId }: AddIncomeFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configurar a mutação para adicionar receita
  const addIncomeMutation = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      await apiRequest("POST", "/api/income", data);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
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
      await addIncomeMutation.mutateAsync({
        userId,
        description: values.description || "",
        amount: values.amount,
        category: values.category,
        date: values.date,
      });
      
      toast({
        title: "Receita adicionada",
        description: `${values.description} (${values.amount}€) adicionada com sucesso.`,
      });
      
      form.reset({
        description: "",
        amount: 0,
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a receita.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Adicionar Receita</CardTitle>
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
                        💹 Categoria
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
                        <SelectItem value="bonus">🎁 Bónus</SelectItem>
                        <SelectItem value="cartao_refeicao">🍽️ Cartão Refeição</SelectItem>
                        <SelectItem value="ordenado">💼 Ordenado</SelectItem>
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
                      👤 Recebido por
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
            
            <Button type="submit" className="w-full">Adicionar Receita</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddIncomeForm;
