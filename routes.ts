import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIncomeSchema, insertPersonalExpenseSchema, insertHouseholdExpenseSchema, insertVacationGoalSchema, insertVacationContributionSchema, insertVacationDestinationSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints for income
  app.get("/api/income", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const incomes = await storage.getIncomes(userId);
      res.json(incomes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch incomes" });
    }
  });

  app.post("/api/income", async (req, res) => {
    try {
      const validatedIncome = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(validatedIncome);
      res.status(201).json(income);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create income" });
      }
    }
  });
  
  app.delete("/api/income/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteIncome(id);
      
      if (!success) {
        return res.status(404).json({ message: "Income not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete income" });
    }
  });

  // API endpoints for personal expenses
  app.get("/api/personal-expense", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const expenses = await storage.getPersonalExpenses(userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal expenses" });
    }
  });

  app.post("/api/personal-expense", async (req, res) => {
    try {
      const validatedExpense = insertPersonalExpenseSchema.parse(req.body);
      const expense = await storage.createPersonalExpense(validatedExpense);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create personal expense" });
      }
    }
  });
  
  app.delete("/api/personal-expense/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deletePersonalExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Personal expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete personal expense" });
    }
  });

  // API endpoints for household expenses
  app.get("/api/household-expense", async (req, res) => {
    try {
      const expenses = await storage.getHouseholdExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch household expenses" });
    }
  });

  app.post("/api/household-expense", async (req, res) => {
    try {
      const validatedExpense = insertHouseholdExpenseSchema.parse(req.body);
      const expense = await storage.createHouseholdExpense(validatedExpense);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create household expense" });
      }
    }
  });
  
  app.delete("/api/household-expense/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteHouseholdExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Household expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete household expense" });
    }
  });

  // API endpoints for vacation goal
  app.get("/api/vacation-goal", async (req, res) => {
    try {
      const goal = await storage.getVacationGoal();
      if (goal) {
        res.json(goal);
      } else {
        res.status(404).json({ message: "Vacation goal not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vacation goal" });
    }
  });

  app.post("/api/vacation-goal", async (req, res) => {
    try {
      const validatedGoal = insertVacationGoalSchema.parse(req.body);
      const goal = await storage.createOrUpdateVacationGoal(validatedGoal);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create or update vacation goal" });
      }
    }
  });

  // API endpoints for vacation contributions
  app.get("/api/vacation-contribution", async (req, res) => {
    try {
      const contributions = await storage.getVacationContributions();
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vacation contributions" });
    }
  });

  app.post("/api/vacation-contribution", async (req, res) => {
    try {
      const validatedContribution = insertVacationContributionSchema.parse(req.body);
      const contribution = await storage.createVacationContribution(validatedContribution);
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create vacation contribution" });
      }
    }
  });
  
  app.delete("/api/vacation-contribution/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteVacationContribution(id);
      
      if (!success) {
        return res.status(404).json({ message: "Vacation contribution not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vacation contribution" });
    }
  });
  
  // API endpoints for vacation destinations
  app.get("/api/vacation-destinations", async (req, res) => {
    try {
      const destinations = await storage.getVacationDestinations();
      
      // Calcular status baseado na data automaticamente
      const destinationsWithUpdatedStatus = destinations.map(destination => {
        const today = new Date();
        const endDate = new Date(destination.endDate);
        
        // Se a data de fim da viagem já passou, status é "completed"
        const actualStatus = endDate < today ? 'completed' : 'planning';
        
        return {
          ...destination,
          actualStatus // Adicionar campo calculado sem modificar o original
        };
      });
      
      res.json(destinationsWithUpdatedStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vacation destinations" });
    }
  });

  app.get("/api/vacation-destinations/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const destination = await storage.getVacationDestination(id);
      
      if (!destination) {
        return res.status(404).json({ message: "Vacation destination not found" });
      }
      
      res.json(destination);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vacation destination" });
    }
  });

  app.post("/api/vacation-destinations", async (req, res) => {
    try {
      const validatedData = insertVacationDestinationSchema.parse(req.body);
      const destination = await storage.createVacationDestination(validatedData);
      res.status(201).json(destination);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid vacation destination data", 
          errors: fromZodError(error).message 
        });
      } else {
        res.status(500).json({ message: "Failed to create vacation destination" });
      }
    }
  });

  app.patch("/api/vacation-destinations/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      console.log("Recebendo atualização para destino:", id, req.body);
      
      // Verificar e garantir que os campos booleanos sejam booleanos de verdade
      if (req.body.planePaid !== undefined) {
        req.body.planePaid = Boolean(req.body.planePaid);
      }
      if (req.body.hotelPaid !== undefined) {
        req.body.hotelPaid = Boolean(req.body.hotelPaid);
      }
      if (req.body.foodPaid !== undefined) {
        req.body.foodPaid = Boolean(req.body.foodPaid);
      }
      if (req.body.rentalCarPaid !== undefined) {
        req.body.rentalCarPaid = Boolean(req.body.rentalCarPaid);
      }
      if (req.body.activitiesPaid !== undefined) {
        req.body.activitiesPaid = Boolean(req.body.activitiesPaid);
      }
      
      // Criar um schema modificado que aceita todos os campos possíveis
      const updateSchema = insertVacationDestinationSchema.partial().extend({
        planePaid: z.boolean().optional(),
        hotelPaid: z.boolean().optional(),
        foodPaid: z.boolean().optional(),
        rentalCarPaid: z.boolean().optional(),
        activitiesPaid: z.boolean().optional(),
        planePaidBy: z.string().optional(),
        hotelPaidBy: z.string().optional(),
        foodPaidBy: z.string().optional(),
        rentalCarPaidBy: z.string().optional(),
        activitiesPaidBy: z.string().optional(),
      });
      
      // Validar dados com o schema modificado
      const validatedData = updateSchema.parse(req.body);
      
      console.log("Dados validados:", validatedData);
      
      // Buscar o destino atual para comparar o estado anterior
      const currentDestination = await storage.getVacationDestination(id);
      if (!currentDestination) {
        return res.status(404).json({ message: "Vacation destination not found" });
      }
      
      // Calcular valores pagos e descontar do fundo de férias se necessário
      let fundAmountToDeduct = 0;
      
      // Verificar cada item que foi marcado como pago
      if (validatedData.planePaid && !currentDestination.planePaid) {
        fundAmountToDeduct += Number(currentDestination.budgetPlane);
        console.log(`Avião marcado como pago: +${currentDestination.budgetPlane}€`);
      }
      if (validatedData.hotelPaid && !currentDestination.hotelPaid) {
        fundAmountToDeduct += Number(currentDestination.budgetHotel);
        console.log(`Hotel marcado como pago: +${currentDestination.budgetHotel}€`);
      }
      if (validatedData.foodPaid && !currentDestination.foodPaid) {
        fundAmountToDeduct += Number(currentDestination.budgetFood);
        console.log(`Alimentação marcada como paga: +${currentDestination.budgetFood}€`);
      }
      if (validatedData.rentalCarPaid && !currentDestination.rentalCarPaid) {
        fundAmountToDeduct += Number(currentDestination.budgetRentalCar);
        console.log(`Aluguer de carro marcado como pago: +${currentDestination.budgetRentalCar}€`);
      }
      if (validatedData.activitiesPaid && !currentDestination.activitiesPaid) {
        fundAmountToDeduct += Number(currentDestination.budgetActivities);
        console.log(`Atividades marcadas como pagas: +${currentDestination.budgetActivities}€`);
      }
      
      // Atualizar o fundAmountUsed se houver novos pagamentos
      if (fundAmountToDeduct > 0) {
        const newFundAmountUsed = Number(currentDestination.fundAmountUsed || 0) + fundAmountToDeduct;
        validatedData.fundAmountUsed = newFundAmountUsed;
        console.log(`Atualizando fundAmountUsed: ${currentDestination.fundAmountUsed} => ${newFundAmountUsed}€`);
        console.log(`Total deduzido do fundo: ${fundAmountToDeduct}€`);
      }
      
      const updatedDestination = await storage.updateVacationDestination(id, validatedData);
      
      if (!updatedDestination) {
        return res.status(404).json({ message: "Vacation destination not found" });
      }
      
      console.log("Destino atualizado:", updatedDestination);
      
      res.json(updatedDestination);
    } catch (error) {
      console.error("Error updating vacation destination:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update vacation destination" });
      }
    }
  });

  // Confirmar viagem - debita o valor do fundo de férias
  app.patch("/api/vacation-destinations/:id/confirm", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Buscar o destino
      const destination = await storage.getVacationDestination(id);
      if (!destination) {
        return res.status(404).json({ message: "Vacation destination not found" });
      }
      
      // Calcular custo total
      const totalCost = Number(destination.budgetPlane) + 
                       Number(destination.budgetHotel) + 
                       Number(destination.budgetFood) + 
                       Number(destination.budgetRentalCar) + 
                       Number(destination.budgetActivities);
      
      // Atualizar destino como confirmado
      const updatedDestination = await storage.updateVacationDestination(id, {
        confirmed: true,
        status: 'planning', // Manter como planning, status será calculado pela data
        fundAmountUsed: totalCost,
      });
      
      if (!updatedDestination) {
        return res.status(500).json({ message: "Failed to confirm vacation destination" });
      }
      
      res.json(updatedDestination);
    } catch (error) {
      console.error("Error confirming vacation destination:", error);
      res.status(500).json({ message: "Failed to confirm vacation destination" });
    }
  });

  app.delete("/api/vacation-destinations/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteVacationDestination(id);
      
      if (!success) {
        return res.status(404).json({ message: "Vacation destination not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vacation destination" });
    }
  });

  // API endpoints for summary data
  app.get("/api/summary", async (req, res) => {
    try {
      // Obter os dados básicos do armazenamento
      const person1Income = await storage.getTotalIncome(1);
      const person2Income = await storage.getTotalIncome(2);
      const person1Expenses = await storage.getTotalPersonalExpenses(1);
      const person2Expenses = await storage.getTotalPersonalExpenses(2);
      const householdExpenses = await storage.getTotalHouseholdExpenses();
      const person1HouseholdExpenses = await storage.getHouseholdExpensesByPerson("person1");
      const person2HouseholdExpenses = await storage.getHouseholdExpensesByPerson("person2");
      const sharedHouseholdExpenses = await storage.getHouseholdExpensesByPerson("shared");
      const vacationGoal = await storage.getVacationGoal();
      const vacationSavings = await storage.getTotalVacationSavings();
      const emergencySavings = await storage.getTotalEmergencySavings(); // Adicionando o Fundo de Emergência
      const vacationContributions = await storage.getVacationContributions();
      const recentTransactions = await storage.getAllTransactions();

      // Debug para verificar as despesas pessoais
      const allPersonalExpenses = await storage.getPersonalExpenses();
      console.log("DEBUG - Todas as despesas pessoais:", allPersonalExpenses);

      // Calcular os totais de despesas domésticas por pessoa
      const person1HouseholdTotal = person1HouseholdExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const person2HouseholdTotal = person2HouseholdExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const sharedHouseholdTotal = sharedHouseholdExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

      res.json({
        incomes: {
          person1: person1Income,
          person2: person2Income,
          total: person1Income + person2Income
        },
        expenses: {
          person1: {
            personal: person1Expenses,
            household: person1HouseholdTotal + (sharedHouseholdTotal / 2),
            total: person1Expenses + person1HouseholdTotal + (sharedHouseholdTotal / 2)
          },
          person2: {
            personal: person2Expenses,
            household: person2HouseholdTotal + (sharedHouseholdTotal / 2),
            total: person2Expenses + person2HouseholdTotal + (sharedHouseholdTotal / 2)
          },
          household: {
            total: householdExpenses
          }
        },
        balances: {
          person1: person1Income - (person1Expenses + person1HouseholdTotal + (sharedHouseholdTotal / 2)),
          person2: person2Income - (person2Expenses + person2HouseholdTotal + (sharedHouseholdTotal / 2)),
          total: (person1Income + person2Income) - (person1Expenses + person2Expenses + householdExpenses)
        },
        vacation: {
          goal: vacationGoal,
          savings: vacationSavings,
          contributions: vacationContributions,
          progress: vacationGoal ? (vacationSavings / Number(vacationGoal.targetAmount)) * 100 : 0
        },
        emergency: {
          savings: emergencySavings
        },
        recentTransactions: recentTransactions.slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch summary data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
