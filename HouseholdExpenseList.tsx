import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HouseholdExpense } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const HouseholdExpenseList = () => {
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: expenses, isLoading } = useQuery<HouseholdExpense[]>({
    queryKey: ["/api/household-expense"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-lg">Todas as Despesas da Casa</CardTitle>
          <div className="flex items-center">
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Descrição', 'Categoria', 'Valor', 'Pago por', 'Data'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardFooter className="bg-gray-50 flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32" />
        </CardFooter>
      </Card>
    );
  }
  
  if (!expenses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todas as Despesas da Casa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">Não foi possível carregar as despesas.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Apply filter
  const filteredExpenses = filter === "all" 
    ? expenses 
    : expenses.filter(expense => expense.category === filter);
  
  // Apply pagination
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
  const paginatedExpenses = filteredExpenses
    .sort((a, b) => {
      // Sort by date (most recent first)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Category mapping
  const categoryMap: Record<string, string> = {
    'rent': 'Renda/Hipoteca',
    'utilities': 'Contas',
    'groceries': 'Supermercado',
    'restaurants': 'Refeições Fora',
    'other': 'Outros'
  };
  
  // User mapping
  const userMap: Record<string, string> = {
    'person1': 'Pessoa 1',
    'person2': 'Pessoa 2',
    'shared': 'Partilhado'
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap justify-between items-center gap-4">
        <CardTitle className="text-lg">Todas as Despesas da Casa</CardTitle>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Filtrar por:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="rent">Renda/Hipoteca</SelectItem>
              <SelectItem value="utilities">Contas</SelectItem>
              <SelectItem value="groceries">Supermercado</SelectItem>
              <SelectItem value="restaurants">Refeições Fora</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago por</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedExpenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma despesa encontrada
                </td>
              </tr>
            ) : (
              paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryMap[expense.category] || expense.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userMap[expense.paidBy]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(expense.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <CardFooter className="px-5 py-3 bg-gray-50 flex flex-wrap items-center justify-between">
        <div className="flex items-center text-sm text-gray-700">
          Mostrando <span className="font-medium mx-1">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredExpenses.length)}</span> 
          a <span className="font-medium mx-1">{Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</span> 
          de <span className="font-medium mx-1">{filteredExpenses.length}</span> resultados
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          {[...Array(Math.min(totalPages, 3))].map((_, i) => {
            const pageNumber = i + 1;
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HouseholdExpenseList;
