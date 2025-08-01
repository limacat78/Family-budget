import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useBudgetData } from "@/hooks/useBudgetData";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  contributedBy: z.string().min(1, "Selecione quem está contribuindo"),
  date: z.string().min(1, "Selecione uma data"),
  note: z.string().optional(),
});

const SavingsContributionCard = () => {
  const { addVacationContribution } = useBudgetData();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      contributedBy: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addVacationContribution({
        amount: values.amount,
        contributedBy: values.contributedBy,
        date: values.date,
        note: values.note,
      });
      
      toast({
        title: "Poupança adicionada",
        description: `${values.amount}€ adicionado com sucesso.`,
      });
      
      form.reset({
        amount: 0,
        contributedBy: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a poupança.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Adicionar Poupança</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (€)</FormLabel>
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
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contributedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem contribui</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione quem contribui" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="person1">Pessoa 1</SelectItem>
                      <SelectItem value="person2">Pessoa 2</SelectItem>
                      <SelectItem value="shared">Contribuição Conjunta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-accent hover:bg-yellow-600 transition-colors">
              Adicionar Poupança
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SavingsContributionCard;
