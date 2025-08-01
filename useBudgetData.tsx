import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { 
  SummaryData, 
  IncomeFormData,
  ExpenseFormData,
  HouseholdExpenseFormData,
  VacationGoalFormData,
  VacationContributionFormData
} from "../types";

// Define the shape of our context
interface BudgetDataContextType {
  currentUser: "person1" | "person2";
  setCurrentUser: (user: "person1" | "person2") => void;
  summary: SummaryData | undefined;
  isLoading: boolean;
  addIncome: (data: IncomeFormData) => Promise<void>;
  addPersonalExpense: (data: ExpenseFormData) => Promise<void>;
  addHouseholdExpense: (data: HouseholdExpenseFormData) => Promise<void>;
  updateVacationGoal: (data: VacationGoalFormData) => Promise<void>;
  addVacationContribution: (data: VacationContributionFormData) => Promise<void>;
}

// Create the context
const BudgetDataContext = createContext<BudgetDataContextType | undefined>(undefined);

// Provider component
export function BudgetDataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<"person1" | "person2">("person1");
  const queryClient = useQueryClient();

  // Get all summary data
  const { data: summary, isLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });

  // Add income
  const addIncomeMutation = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      await apiRequest("POST", "/api/income", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
    },
  });

  // Add personal expense
  const addPersonalExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      await apiRequest("POST", "/api/personal-expense", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-expense"] });
    },
  });

  // Add household expense
  const addHouseholdExpenseMutation = useMutation({
    mutationFn: async (data: HouseholdExpenseFormData) => {
      await apiRequest("POST", "/api/household-expense", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/household-expense"] });
    },
  });

  // Update vacation goal
  const updateVacationGoalMutation = useMutation({
    mutationFn: async (data: VacationGoalFormData) => {
      await apiRequest("POST", "/api/vacation-goal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vacation-goal"] });
    },
  });

  // Add vacation contribution
  const addVacationContributionMutation = useMutation({
    mutationFn: async (data: VacationContributionFormData) => {
      await apiRequest("POST", "/api/vacation-contribution", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vacation-contribution"] });
    },
  });

  // Create value object
  const value = {
    currentUser,
    setCurrentUser,
    summary,
    isLoading,
    addIncome: addIncomeMutation.mutateAsync,
    addPersonalExpense: addPersonalExpenseMutation.mutateAsync,
    addHouseholdExpense: addHouseholdExpenseMutation.mutateAsync,
    updateVacationGoal: updateVacationGoalMutation.mutateAsync,
    addVacationContribution: addVacationContributionMutation.mutateAsync
  };

  return (
    <BudgetDataContext.Provider value={value}>
      {children}
    </BudgetDataContext.Provider>
  );
}

// Hook to use the context
export function useBudgetData() {
  const context = useContext(BudgetDataContext);
  if (context === undefined) {
    throw new Error("useBudgetData must be used within a BudgetDataProvider");
  }
  return context;
}