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
import { HouseholdExpenseFormData } from "../../types";

const formSchema = z.object({
  description: z.string().max(100).optional(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Selecione uma categoria"),
  paidBy: z.string().min(1, "Selecione quem pagou"),
  date: z.string().min(1, "Selecione uma data"),
});

const AddHouseholdExpenseForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configurar a mutação para adicionar despesa de casa
  const addHouseholdExpenseMutation = useMutation({
    mutationFn: async (data: HouseholdExpenseFormData) => {
      await apiRequest("POST", "/api/household-expense", data);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/household-expense"] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "",
      paidBy: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addHouseholdExpenseMutation.mutateAsync({
        description: values.description || "",
        amount: values.amount,
        category: values.category,
        paidBy: values.paidBy,
        date: values.date,
      });
      
      toast({
        title: "Despesa adicionada",
        description: `${values.description} (${values.amount}€) adicionada com sucesso.`,
      });
      
      form.reset({
        description: "",
        amount: 0,
        category: "",
        paidBy: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
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
        <CardTitle className="text-lg">Adicionar Despesa da Casa</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Primeira linha: Categoria e Valor lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <span className="text-lg mr-1">🏠</span> Categoria
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
                        <SelectItem value="agua">💧 Água</SelectItem>
                        <SelectItem value="cartao_refeicao">🍽️ Cartão Refeição</SelectItem>
                        <SelectItem value="casa_lazer">🏠 Casa e Lazer</SelectItem>
                        <SelectItem value="condominio">🏢 Condomínio</SelectItem>
                        <SelectItem value="emprestimo_habitacao">🏦 Empréstimo Habitação</SelectItem>
                        <SelectItem value="farmacia">💊 Farmácia</SelectItem>
                        <SelectItem value="Fundo Férias">🏖️ Fundo Férias</SelectItem>
                        <SelectItem value="gasolina">⛽ Gasolina</SelectItem>
                        <SelectItem value="gato_pixel">🐾 Gato Pixel</SelectItem>
                        <SelectItem value="impostos">€ Impostos</SelectItem>
                        <SelectItem value="limpeza">🧹 Limpeza</SelectItem>
                        <SelectItem value="luz_gas">💡 Luz/Gás</SelectItem>
                        <SelectItem value="outros">🏷️ Outros</SelectItem>
                        <SelectItem value="renda_casa">🏠 Renda Casa</SelectItem>
                        <SelectItem value="restaurantes">🍽️ Restaurantes</SelectItem>
                        <SelectItem value="subscricoes">📺 Subscrições</SelectItem>
                        <SelectItem value="supermercado">🛒 Supermercado</SelectItem>
                        <SelectItem value="uber_carro">🚕 Uber Carro</SelectItem>
                        <SelectItem value="via_verde">🛣️ Via Verde</SelectItem>
                        <SelectItem value="vodafone_tv">📺 Vodafone TV</SelectItem>
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
                    <FormLabel className="flex items-center">
                      <span className="text-lg mr-1">💰</span> Valor (€)
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
            
            {/* Segunda linha: Data e Pago por lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <span className="text-lg mr-1">📅</span> Data
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paidBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <span className="text-lg mr-1">👤</span> Pago por
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione quem pagou" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="person1">Cat</SelectItem>
                        <SelectItem value="person2">Gui</SelectItem>
                        <SelectItem value="shared">Partilhado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Terceira linha: Descrição ocupando toda a largura */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="text-lg mr-1">📝</span> Descrição
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full mt-3">Adicionar Despesa</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddHouseholdExpenseForm;
