import { 
  users, type User, type InsertUser,
  incomes, type Income, type InsertIncome,
  personalExpenses, type PersonalExpense, type InsertPersonalExpense,
  householdExpenses, type HouseholdExpense, type InsertHouseholdExpense,
  vacationGoal, type VacationGoal, type InsertVacationGoal,
  vacationDestinations, type VacationDestination, type InsertVacationDestination,
  vacationContributions, type VacationContribution, type InsertVacationContribution
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Income operations
  getIncomes(userId?: number): Promise<Income[]>;
  getIncome(id: number): Promise<Income | undefined>;
  createIncome(income: InsertIncome): Promise<Income>;
  deleteIncome(id: number): Promise<boolean>;
  
  // Personal expenses operations
  getPersonalExpenses(userId?: number): Promise<PersonalExpense[]>;
  getPersonalExpense(id: number): Promise<PersonalExpense | undefined>;
  createPersonalExpense(expense: InsertPersonalExpense): Promise<PersonalExpense>;
  deletePersonalExpense(id: number): Promise<boolean>;
  
  // Household expenses operations
  getHouseholdExpenses(): Promise<HouseholdExpense[]>;
  getHouseholdExpense(id: number): Promise<HouseholdExpense | undefined>;
  createHouseholdExpense(expense: InsertHouseholdExpense): Promise<HouseholdExpense>;
  deleteHouseholdExpense(id: number): Promise<boolean>;
  
  // Vacation goal operations
  getVacationGoal(): Promise<VacationGoal | undefined>;
  createOrUpdateVacationGoal(goal: InsertVacationGoal): Promise<VacationGoal>;
  
  // Vacation destinations operations
  getVacationDestinations(): Promise<VacationDestination[]>;
  getVacationDestination(id: number): Promise<VacationDestination | undefined>;
  createVacationDestination(destination: InsertVacationDestination): Promise<VacationDestination>;
  updateVacationDestination(id: number, destination: Partial<InsertVacationDestination>): Promise<VacationDestination | undefined>;
  deleteVacationDestination(id: number): Promise<boolean>;
  
  // Vacation contributions operations
  getVacationContributions(): Promise<VacationContribution[]>;
  createVacationContribution(contribution: InsertVacationContribution): Promise<VacationContribution>;
  deleteVacationContribution(id: number): Promise<boolean>;
  
  // Summary operations
  getTotalIncome(userId?: number): Promise<number>;
  getTotalPersonalExpenses(userId?: number): Promise<number>;
  getTotalHouseholdExpenses(): Promise<number>;
  getHouseholdExpensesByPerson(paidBy: string): Promise<HouseholdExpense[]>;
  getTotalVacationSavings(): Promise<number>;
  getTotalEmergencySavings(): Promise<number>; // Nova função para o fundo de emergência
  
  // Get all transactions
  getAllTransactions(): Promise<(Income | PersonalExpense | HouseholdExpense | VacationContribution)[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private incomes: Map<number, Income>;
  private personalExpenses: Map<number, PersonalExpense>;
  private householdExpenses: Map<number, HouseholdExpense>;
  private vacationGoals: Map<number, VacationGoal>;
  private vacationDestinations: Map<number, VacationDestination>;
  private vacationContributions: Map<number, VacationContribution>;
  
  private userId: number = 1;
  private incomeId: number = 1;
  private personalExpenseId: number = 1;
  private householdExpenseId: number = 1;
  private vacationGoalId: number = 1;
  private vacationDestinationId: number = 1;
  private vacationContributionId: number = 1;

  constructor() {
    this.users = new Map();
    this.incomes = new Map();
    this.personalExpenses = new Map();
    this.householdExpenses = new Map();
    this.vacationGoals = new Map();
    this.vacationDestinations = new Map();
    this.vacationContributions = new Map();
    
    // Initialize with two default users
    this.createUser({ username: "person1", password: "password" });
    this.createUser({ username: "person2", password: "password" });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Income operations
  async getIncomes(userId?: number): Promise<Income[]> {
    const incomes = Array.from(this.incomes.values());
    if (userId !== undefined) {
      return incomes.filter((income) => income.userId === userId);
    }
    return incomes;
  }
  
  async getIncome(id: number): Promise<Income | undefined> {
    return this.incomes.get(id);
  }
  
  async createIncome(insertIncome: InsertIncome): Promise<Income> {
    const id = this.incomeId++;
    const income: Income = { 
      ...insertIncome, 
      id, 
      createdAt: new Date()
    };
    this.incomes.set(id, income);
    return income;
  }
  
  async deleteIncome(id: number): Promise<boolean> {
    if (!this.incomes.has(id)) {
      return false;
    }
    return this.incomes.delete(id);
  }
  
  // Personal expenses operations
  async getPersonalExpenses(userId?: number): Promise<PersonalExpense[]> {
    const expenses = Array.from(this.personalExpenses.values());
    if (userId !== undefined) {
      return expenses.filter((expense) => expense.userId === userId);
    }
    return expenses;
  }
  
  async getPersonalExpense(id: number): Promise<PersonalExpense | undefined> {
    return this.personalExpenses.get(id);
  }
  
  async createPersonalExpense(insertExpense: InsertPersonalExpense): Promise<PersonalExpense> {
    const id = this.personalExpenseId++;
    const expense: PersonalExpense = { 
      ...insertExpense, 
      id, 
      createdAt: new Date()
    };
    this.personalExpenses.set(id, expense);
    return expense;
  }
  
  async deletePersonalExpense(id: number): Promise<boolean> {
    if (!this.personalExpenses.has(id)) {
      return false;
    }
    return this.personalExpenses.delete(id);
  }
  
  // Household expenses operations
  async getHouseholdExpenses(): Promise<HouseholdExpense[]> {
    return Array.from(this.householdExpenses.values());
  }
  
  async getHouseholdExpense(id: number): Promise<HouseholdExpense | undefined> {
    return this.householdExpenses.get(id);
  }
  
  async createHouseholdExpense(insertExpense: InsertHouseholdExpense): Promise<HouseholdExpense> {
    const id = this.householdExpenseId++;
    const expense: HouseholdExpense = { 
      ...insertExpense, 
      id, 
      createdAt: new Date()
    };
    this.householdExpenses.set(id, expense);
    return expense;
  }
  
  async deleteHouseholdExpense(id: number): Promise<boolean> {
    if (!this.householdExpenses.has(id)) {
      return false;
    }
    return this.householdExpenses.delete(id);
  }
  
  // Vacation goal operations
  async getVacationGoal(): Promise<VacationGoal | undefined> {
    if (this.vacationGoals.size > 0) {
      return Array.from(this.vacationGoals.values())[0];
    }
    return undefined;
  }
  
  async createOrUpdateVacationGoal(insertGoal: InsertVacationGoal): Promise<VacationGoal> {
    const existingGoal = await this.getVacationGoal();
    
    if (existingGoal) {
      const updatedGoal: VacationGoal = {
        ...existingGoal,
        ...insertGoal,
        updatedAt: new Date()
      };
      this.vacationGoals.set(existingGoal.id, updatedGoal);
      return updatedGoal;
    } else {
      const id = this.vacationGoalId++;
      const goal: VacationGoal = { 
        ...insertGoal, 
        id, 
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.vacationGoals.set(id, goal);
      return goal;
    }
  }
  
  // Vacation contributions operations
  async getVacationContributions(): Promise<VacationContribution[]> {
    return Array.from(this.vacationContributions.values());
  }
  
  async createVacationContribution(insertContribution: InsertVacationContribution): Promise<VacationContribution> {
    const id = this.vacationContributionId++;
    const contribution: VacationContribution = { 
      ...insertContribution, 
      id, 
      createdAt: new Date()
    };
    this.vacationContributions.set(id, contribution);
    
    // Update current vacation savings
    const vacationGoal = await this.getVacationGoal();
    if (vacationGoal) {
      const newSavings = Number(vacationGoal.currentSavings) + Number(insertContribution.amount);
      await this.createOrUpdateVacationGoal({
        ...vacationGoal,
        currentSavings: newSavings
      });
    }
    
    return contribution;
  }
  
  async deleteVacationContribution(id: number): Promise<boolean> {
    const contribution = this.vacationContributions.get(id);
    if (!contribution) {
      return false;
    }
    
    // Atualizar o objetivo de férias reduzindo o valor da contribuição removida
    const vacationGoal = await this.getVacationGoal();
    if (vacationGoal) {
      const newSavings = Math.max(0, Number(vacationGoal.currentSavings) - Number(contribution.amount));
      await this.createOrUpdateVacationGoal({
        ...vacationGoal,
        currentSavings: newSavings
      });
    }
    
    return this.vacationContributions.delete(id);
  }
  
  // Summary operations
  async getTotalIncome(userId?: number): Promise<number> {
    const incomes = await this.getIncomes(userId);
    return incomes.reduce((sum, income) => sum + Number(income.amount), 0);
  }
  
  async getTotalPersonalExpenses(userId?: number): Promise<number> {
    const expenses = await this.getPersonalExpenses(userId);
    
    // Soma todas as despesas como valores positivos (para fins contábeis)
    // CORREÇÃO: Agora todas as despesas (incluindo Fundo Férias) contribuem para o total de despesas mensais
    return expenses.reduce((sum, expense) => {
      // Certifica-se de que o valor é um número
      const amount = Number(expense.amount);
      
      // Lista de possíveis nomes para a categoria "Fundo Férias"
      const fundoFeriasNames = ["Fundo Férias", "fundo_ferias", "Fundo de Férias", "Poupança"];
      
      // CORRECTED: Todas as despesas, incluindo Fundo Férias, são contabilizadas no total
      console.log(`Incluindo ${expense.category} (ID ${expense.id}) no cálculo de despesas totais: +${Math.abs(amount)}`);
      
      // Usamos o valor absoluto porque as despesas são armazenadas como valores negativos
      return sum + Math.abs(amount);
    }, 0);
  }
  
  async getTotalHouseholdExpenses(): Promise<number> {
    const expenses = await this.getHouseholdExpenses();
    
    // CORREÇÃO: Para despesas domésticas, todas as categorias (incluindo Fundo Férias) 
    // são contabilizadas no total de despesas mensais
    return expenses.reduce((sum, expense) => {
      const amount = Number(expense.amount);
      
      // Lista de possíveis nomes para a categoria "Fundo Férias"
      const fundoFeriasNames = ["Fundo Férias", "fundo_ferias", "Fundo de Férias"];
      
      // CORRECTED: Todas as despesas domésticas são incluídas no total
      console.log(`Incluindo despesa doméstica ${expense.category} (ID ${expense.id}) no cálculo: +${Math.abs(amount)}`);
      return sum + Math.abs(amount);
    }, 0);
  }
  
  async getHouseholdExpensesByPerson(paidBy: string): Promise<HouseholdExpense[]> {
    const expenses = await this.getHouseholdExpenses();
    return expenses.filter((expense) => expense.paidBy === paidBy);
  }
  
  async getTotalVacationSavings(): Promise<number> {
    try {
      /**
       * Estamos com problema no cálculo do Fundo de Férias após adições de novas contribuições.
       * Vamos criar uma solução fixa seguindo o exemplo do usuário.
       */
      
      // Lista de possíveis nomes para a categoria "Fundo Férias"
      const fundoFeriasNames = ["Fundo Férias", "fundo_ferias", "Fundo de Férias", "Poupança"];
      
      // Para despesas pessoais
      const personalExpenses = await this.getPersonalExpenses();
      const fundoFeriasPessoais = personalExpenses
        .filter(exp => fundoFeriasNames.includes(exp.category))
        .reduce((sum, exp) => sum + Math.abs(Number(exp.amount)), 0);
      
      console.log("=== CONTRIBUIÇÕES PESSOAIS PARA FUNDO DE FÉRIAS ===");
      personalExpenses
        .filter(exp => fundoFeriasNames.includes(exp.category))
        .forEach(exp => {
          console.log(`Contribuição pessoal ID ${exp.id} (${exp.category}): ${exp.amount}€ => +${Math.abs(Number(exp.amount))}€`);
        });
      console.log(`Total contribuições pessoais: ${fundoFeriasPessoais}€`);
      
      // Para despesas domésticas
      const householdExpenses = await this.getHouseholdExpenses();
      const fundoFeriasDomesticas = householdExpenses
        .filter(exp => fundoFeriasNames.includes(exp.category))
        .reduce((sum, exp) => sum + Math.abs(Number(exp.amount)), 0);
      
      console.log("=== CONTRIBUIÇÕES DOMÉSTICAS PARA FUNDO DE FÉRIAS ===");
      householdExpenses
        .filter(exp => fundoFeriasNames.includes(exp.category))
        .forEach(exp => {
          console.log(`Contribuição doméstica ID ${exp.id} (${exp.category}): ${exp.amount}€ => +${Math.abs(Number(exp.amount))}€`);
        });
      console.log(`Total contribuições domésticas: ${fundoFeriasDomesticas}€`);
      
      // Calcular valores gastos em viagens (fundAmountUsed)
      const vacationDestinations = await this.getVacationDestinations();
      const totalFundUsed = vacationDestinations.reduce((sum, destination) => {
        const fundUsed = Number(destination.fundAmountUsed || 0);
        if (fundUsed > 0) {
          console.log(`Viagem ${destination.destination}: -${fundUsed}€ gastos do fundo`);
        }
        return sum + fundUsed;
      }, 0);
      
      console.log(`=== GASTOS DO FUNDO DE FÉRIAS ===`);
      console.log(`Total gasto em viagens: ${totalFundUsed}€`);
      
      // Total de contribuições menos gastos
      const totalFundoFerias = fundoFeriasPessoais + fundoFeriasDomesticas - totalFundUsed;
      console.log(`SALDO TOTAL DO FUNDO DE FÉRIAS: ${fundoFeriasPessoais + fundoFeriasDomesticas}€ (contribuições) - ${totalFundUsed}€ (gastos) = ${totalFundoFerias}€`);
      
      // Atualizar objetivo no banco de dados
      const vacationGoal = await this.getVacationGoal();
      if (vacationGoal) {
        console.log(`Atualizando meta: ${vacationGoal.currentSavings}€ => ${totalFundoFerias}€`);
        const targetAmountAsNumber = typeof vacationGoal.targetAmount === 'string' 
          ? Number(vacationGoal.targetAmount) 
          : vacationGoal.targetAmount;
          
        await this.createOrUpdateVacationGoal({
          targetAmount: targetAmountAsNumber,
          currentSavings: totalFundoFerias,
          destination: vacationGoal.destination,
          targetDate: vacationGoal.targetDate
        });
      } else {
        // Criar objetivo padrão se não existir
        await this.createOrUpdateVacationGoal({
          targetAmount: 2000,
          currentSavings: totalFundoFerias,
          destination: null,
          targetDate: null
        });
      }
      
      return totalFundoFerias;
    } catch (error) {
      console.error("Erro ao calcular saldo do Fundo de Férias:", error);
      return 0;
    }
  }
  
  // Função para calcular o saldo total do Fundo de Emergência
  async getTotalEmergencySavings(): Promise<number> {
    try {
      // Lista de possíveis nomes para categorias de Fundo de Emergência
      const fundoEmergenciaNames = ["Fundo Emergência", "fundo_emergencia", "Fundo de Emergência", "Emergência"];
      
      // Para despesas pessoais
      const personalExpenses = await this.getPersonalExpenses();
      const fundoEmergenciaPessoais = personalExpenses
        .filter(exp => fundoEmergenciaNames.includes(exp.category))
        .reduce((sum, exp) => sum + Math.abs(Number(exp.amount)), 0);
      
      console.log("=== CONTRIBUIÇÕES PESSOAIS PARA FUNDO DE EMERGÊNCIA ===");
      personalExpenses
        .filter(exp => fundoEmergenciaNames.includes(exp.category))
        .forEach(exp => {
          console.log(`Contribuição pessoal ID ${exp.id} (${exp.category}): ${exp.amount}€ => +${Math.abs(Number(exp.amount))}€`);
        });
      console.log(`Total contribuições pessoais para emergência: ${fundoEmergenciaPessoais}€`);
      
      // Para despesas domésticas
      const householdExpenses = await this.getHouseholdExpenses();
      const fundoEmergenciaDomesticas = householdExpenses
        .filter(exp => fundoEmergenciaNames.includes(exp.category))
        .reduce((sum, exp) => sum + Math.abs(Number(exp.amount)), 0);
      
      console.log("=== CONTRIBUIÇÕES DOMÉSTICAS PARA FUNDO DE EMERGÊNCIA ===");
      householdExpenses
        .filter(exp => fundoEmergenciaNames.includes(exp.category))
        .forEach(exp => {
          console.log(`Contribuição doméstica ID ${exp.id} (${exp.category}): ${exp.amount}€ => +${Math.abs(Number(exp.amount))}€`);
        });
      console.log(`Total contribuições domésticas para emergência: ${fundoEmergenciaDomesticas}€`);
      
      // Total de contribuições combinadas
      const totalFundoEmergencia = fundoEmergenciaPessoais + fundoEmergenciaDomesticas;
      console.log(`SALDO TOTAL DO FUNDO DE EMERGÊNCIA: ${totalFundoEmergencia}€`);
      
      return totalFundoEmergencia;
    } catch (error) {
      console.error("Erro ao calcular saldo do Fundo de Emergência:", error);
      return 0;
    }
  }

  async getTotalObrasSavings(): Promise<number> {
    try {
      // Lista de possíveis nomes para categorias de Fundo de Obras
      const fundoObrasNames = ["Fundo Obras", "fundo_obras", "Fundo de Obras"];
      
      // Para despesas pessoais apenas (agora Fundo Obras é categoria pessoal)
      const personalExpenses = await this.getPersonalExpenses();
      const fundoObrasPessoais = personalExpenses
        .filter(exp => fundoObrasNames.includes(exp.category))
        .reduce((sum, exp) => sum + Math.abs(Number(exp.amount)), 0);
      
      console.log("=== CONTRIBUIÇÕES PESSOAIS PARA FUNDO DE OBRAS ===");
      personalExpenses
        .filter(exp => fundoObrasNames.includes(exp.category))
        .forEach(exp => {
          console.log(`Contribuição pessoal ID ${exp.id} (${exp.category}): ${exp.amount}€ => +${Math.abs(Number(exp.amount))}€`);
        });
      console.log(`Total contribuições pessoais para obras: ${fundoObrasPessoais}€`);
      
      console.log(`SALDO TOTAL DO FUNDO DE OBRAS: ${fundoObrasPessoais}€`);
      
      return fundoObrasPessoais;
    } catch (error) {
      console.error("Erro ao calcular saldo do Fundo de Obras:", error);
      return 0;
    }
  }
  
  // Vacation destinations operations
  async getVacationDestinations(): Promise<VacationDestination[]> {
    return Array.from(this.vacationDestinations.values());
  }

  async getVacationDestination(id: number): Promise<VacationDestination | undefined> {
    return this.vacationDestinations.get(id);
  }

  async createVacationDestination(insertDestination: InsertVacationDestination): Promise<VacationDestination> {
    const id = this.vacationDestinationId++;
    const createdAt = new Date();
    
    const destination: VacationDestination = {
      id,
      createdAt,
      destination: insertDestination.destination,
      startDate: insertDestination.startDate,
      endDate: insertDestination.endDate,
      budgetPlane: insertDestination.budgetPlane,
      budgetHotel: insertDestination.budgetHotel,
      budgetFood: insertDestination.budgetFood,
      budgetRentalCar: insertDestination.budgetRentalCar,
      budgetActivities: insertDestination.budgetActivities,
      amountSaved: insertDestination.amountSaved,
      confirmed: insertDestination.confirmed || false,
      useVacationFund: insertDestination.useVacationFund !== undefined ? insertDestination.useVacationFund : true,
      fundAmountUsed: insertDestination.fundAmountUsed || "0",
      status: insertDestination.status || "planning",
      planePaid: insertDestination.planePaid || false,
      hotelPaid: insertDestination.hotelPaid || false,
      foodPaid: insertDestination.foodPaid || false,
      rentalCarPaid: insertDestination.rentalCarPaid || false,
      activitiesPaid: insertDestination.activitiesPaid || false,
      planePaidBy: insertDestination.planePaidBy || "",
      hotelPaidBy: insertDestination.hotelPaidBy || "",
      foodPaidBy: insertDestination.foodPaidBy || "",
      rentalCarPaidBy: insertDestination.rentalCarPaidBy || "",
      activitiesPaidBy: insertDestination.activitiesPaidBy || "",
    };
    
    this.vacationDestinations.set(id, destination);
    return destination;
  }

  async updateVacationDestination(id: number, updateData: Partial<InsertVacationDestination>): Promise<VacationDestination | undefined> {
    const destination = await this.getVacationDestination(id);
    if (!destination) {
      return undefined;
    }
    
    console.log("Atualizando destino, dados recebidos:", updateData);
    
    const updatedDestination: VacationDestination = {
      ...destination,
      ...(updateData.destination !== undefined && { destination: updateData.destination }),
      ...(updateData.startDate !== undefined && { startDate: updateData.startDate }),
      ...(updateData.endDate !== undefined && { endDate: updateData.endDate }),
      ...(updateData.budgetPlane !== undefined && { budgetPlane: updateData.budgetPlane }),
      ...(updateData.budgetHotel !== undefined && { budgetHotel: updateData.budgetHotel }),
      ...(updateData.budgetFood !== undefined && { budgetFood: updateData.budgetFood }),
      ...(updateData.budgetRentalCar !== undefined && { budgetRentalCar: updateData.budgetRentalCar }),
      ...(updateData.budgetActivities !== undefined && { budgetActivities: updateData.budgetActivities }),
      ...(updateData.amountSaved !== undefined && { amountSaved: updateData.amountSaved }),
      ...(updateData.confirmed !== undefined && { confirmed: updateData.confirmed }),
      ...(updateData.useVacationFund !== undefined && { useVacationFund: updateData.useVacationFund }),
      ...(updateData.fundAmountUsed !== undefined && { fundAmountUsed: updateData.fundAmountUsed }),
      ...(updateData.status !== undefined && { status: updateData.status }),
      ...(updateData.planePaid !== undefined && { planePaid: updateData.planePaid }),
      ...(updateData.hotelPaid !== undefined && { hotelPaid: updateData.hotelPaid }),
      ...(updateData.foodPaid !== undefined && { foodPaid: updateData.foodPaid }),
      ...(updateData.rentalCarPaid !== undefined && { rentalCarPaid: updateData.rentalCarPaid }),
      ...(updateData.activitiesPaid !== undefined && { activitiesPaid: updateData.activitiesPaid }),
      ...(updateData.planePaidBy !== undefined && { planePaidBy: updateData.planePaidBy }),
      ...(updateData.hotelPaidBy !== undefined && { hotelPaidBy: updateData.hotelPaidBy }),
      ...(updateData.foodPaidBy !== undefined && { foodPaidBy: updateData.foodPaidBy }),
      ...(updateData.rentalCarPaidBy !== undefined && { rentalCarPaidBy: updateData.rentalCarPaidBy }),
      ...(updateData.activitiesPaidBy !== undefined && { activitiesPaidBy: updateData.activitiesPaidBy }),
    };
    
    console.log("Destino atualizado:", updatedDestination);
    
    this.vacationDestinations.set(id, updatedDestination);
    return updatedDestination;
  }

  async deleteVacationDestination(id: number): Promise<boolean> {
    return this.vacationDestinations.delete(id);
  }
  
  async getAllTransactions(): Promise<(Income | PersonalExpense | HouseholdExpense | VacationContribution)[]> {
    const incomes = await this.getIncomes();
    const personalExpenses = await this.getPersonalExpenses();
    const householdExpenses = await this.getHouseholdExpenses();
    const vacationContributions = await this.getVacationContributions();
    
    console.log("DEBUG - Todas as despesas pessoais:", personalExpenses);
    
    // Verifica se há despesas com categoria PPR
    const pprExpenses = personalExpenses.filter(expense => expense.category === 'ppr');
    if (pprExpenses.length > 0) {
      console.log("DEBUG - Despesas PPR encontradas:", pprExpenses);
    }
    
    const allTransactions = [
      ...incomes,
      ...personalExpenses,
      ...householdExpenses,
      ...vacationContributions
    ];
    
    // Sort by date (most recent first)
    return allTransactions.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }
}

export const storage = new MemStorage();
