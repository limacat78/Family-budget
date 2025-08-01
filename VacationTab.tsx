import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AddVacationDestination from "./AddVacationDestination";
import VacationDestinationList from "./VacationDestinationList";
import VacationManagement from "./VacationManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { VacationDestination } from "@shared/schema";

const VacationTab = () => {
  const [activeTab, setActiveTab] = useState<string>("management");
  const [editingDestination, setEditingDestination] = useState<VacationDestination | null>(null);
  
  const { data: destinations, isLoading } = useQuery<VacationDestination[]>({
    queryKey: ["/api/vacation-destinations"],
  });

  const { data: summary } = useQuery({
    queryKey: ['/api/summary'],
    refetchInterval: 1000, // Recarregar a cada segundo para garantir dados atualizados
  });
  
  const onDestinationAdded = () => {
    setActiveTab("management");
  };

  const handleEditDestination = (destination: VacationDestination) => {
    setEditingDestination(destination);
    setActiveTab("destinations");
  };

  const fundAmount = (summary as any)?.vacation?.savings || 0;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Separator />
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Planeamento de Férias</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="management">Gestão de Viagens</TabsTrigger>
          <TabsTrigger value="destinations">Meus Destinos</TabsTrigger>
          <TabsTrigger value="add">Adicionar Destino</TabsTrigger>
        </TabsList>
        
        <TabsContent value="management" className="mt-6">
          <VacationManagement 
            fundAmount={fundAmount} 
            onAddDestinationClick={() => setActiveTab("add")}
            onEditDestinationClick={handleEditDestination}
          />
        </TabsContent>
        
        <TabsContent value="destinations" className="mt-6">
          <VacationDestinationList 
            destinations={destinations || []} 
            onAddClick={() => setActiveTab("add")}
            editingDestination={editingDestination}
            onEditComplete={() => {
              setEditingDestination(null);
              setActiveTab("management");
            }}
          />
        </TabsContent>
        
        <TabsContent value="add" className="mt-6">
          <AddVacationDestination onDestinationAdded={onDestinationAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VacationTab;