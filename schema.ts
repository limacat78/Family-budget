import { pgTable, text, serial, integer, date, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").default(""),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const personalExpenses = pgTable("personal_expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").default(""),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const householdExpenses = pgTable("household_expenses", {
  id: serial("id").primaryKey(),
  description: text("description").default(""),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  paidBy: text("paid_by").notNull(), // "person1", "person2", or "shared"
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vacationGoal = pgTable("vacation_goal", {
  id: serial("id").primaryKey(),
  destination: text("destination"),
  targetDate: date("target_date"),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentSavings: decimal("current_savings", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vacationDestinations = pgTable("vacation_destinations", {
  id: serial("id").primaryKey(),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  budgetPlane: decimal("budget_plane", { precision: 10, scale: 2 }).notNull().default("0"),
  budgetHotel: decimal("budget_hotel", { precision: 10, scale: 2 }).notNull().default("0"),
  budgetFood: decimal("budget_food", { precision: 10, scale: 2 }).notNull().default("0"),
  budgetRentalCar: decimal("budget_rental_car", { precision: 10, scale: 2 }).notNull().default("0"),
  budgetActivities: decimal("budget_activities", { precision: 10, scale: 2 }).notNull().default("0"),
  amountSaved: decimal("amount_saved", { precision: 10, scale: 2 }).notNull().default("0"),
  confirmed: boolean("confirmed").default(false),
  useVacationFund: boolean("use_vacation_fund").default(true),
  fundAmountUsed: decimal("fund_amount_used", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").default("planning"), // planning, completed
  planePaid: boolean("plane_paid").default(false),
  hotelPaid: boolean("hotel_paid").default(false),
  foodPaid: boolean("food_paid").default(false),
  rentalCarPaid: boolean("rental_car_paid").default(false),
  activitiesPaid: boolean("activities_paid").default(false),
  planePaidBy: text("plane_paid_by").default(""),
  hotelPaidBy: text("hotel_paid_by").default(""),
  foodPaidBy: text("food_paid_by").default(""),
  rentalCarPaidBy: text("rental_car_paid_by").default(""),
  activitiesPaidBy: text("activities_paid_by").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vacationContributions = pgTable("vacation_contributions", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  contributedBy: text("contributed_by").notNull(), // "person1", "person2", or "shared"
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertIncomeSchema = createInsertSchema(incomes).pick({
  userId: true,
  category: true,
  date: true,
}).extend({
  description: z.string().optional().default(""),
  amount: z.number().or(z.string().transform(val => Number(val)))
});

export const insertPersonalExpenseSchema = createInsertSchema(personalExpenses).pick({
  userId: true,
  category: true,
  date: true,
}).extend({
  description: z.string().optional().default(""),
  amount: z.number().or(z.string().transform(val => Number(val)))
});

export const insertHouseholdExpenseSchema = createInsertSchema(householdExpenses).pick({
  category: true,
  paidBy: true,
  date: true,
}).extend({
  description: z.string().optional().default(""),
  amount: z.number().or(z.string().transform(val => Number(val)))
});

export const insertVacationGoalSchema = createInsertSchema(vacationGoal).pick({
  destination: true,
  targetDate: true,
}).extend({
  targetAmount: z.coerce.number().min(0, "Valor deve ser positivo"),
  currentSavings: z.coerce.number().min(0, "Valor não pode ser negativo"),
});

export const insertVacationContributionSchema = createInsertSchema(vacationContributions).pick({
  contributedBy: true,
  date: true,
  note: true,
}).extend({
  amount: z.coerce.number().positive("Valor deve ser positivo"),
});

export const insertVacationDestinationSchema = createInsertSchema(vacationDestinations).pick({
  destination: true,
  startDate: true,
  endDate: true,
}).extend({
  budgetPlane: z.coerce.number().min(0),
  budgetHotel: z.coerce.number().min(0),
  budgetFood: z.coerce.number().min(0),
  budgetRentalCar: z.coerce.number().min(0),
  budgetActivities: z.coerce.number().min(0),
  amountSaved: z.coerce.number().min(0).default(0),
  confirmed: z.boolean().optional().default(false),
  useVacationFund: z.boolean().optional().default(true),
  fundAmountUsed: z.coerce.number().min(0).default(0),
  status: z.enum(['planning', 'confirmed', 'completed']).optional().default('planning'),
  planePaid: z.boolean().optional().default(false),
  hotelPaid: z.boolean().optional().default(false),
  foodPaid: z.boolean().optional().default(false),
  rentalCarPaid: z.boolean().optional().default(false),
  activitiesPaid: z.boolean().optional().default(false),
  planePaidBy: z.string().optional().default(""),
  hotelPaidBy: z.string().optional().default(""),
  foodPaidBy: z.string().optional().default(""),
  rentalCarPaidBy: z.string().optional().default(""),
  activitiesPaidBy: z.string().optional().default(""),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;

export type PersonalExpense = typeof personalExpenses.$inferSelect;
export type InsertPersonalExpense = z.infer<typeof insertPersonalExpenseSchema>;

export type HouseholdExpense = typeof householdExpenses.$inferSelect;
export type InsertHouseholdExpense = z.infer<typeof insertHouseholdExpenseSchema>;

export type VacationGoal = typeof vacationGoal.$inferSelect;
export type InsertVacationGoal = z.infer<typeof insertVacationGoalSchema>;

export type VacationContribution = typeof vacationContributions.$inferSelect;
export type InsertVacationContribution = z.infer<typeof insertVacationContributionSchema>;

export type VacationDestination = typeof vacationDestinations.$inferSelect;
export type InsertVacationDestination = z.infer<typeof insertVacationDestinationSchema>;
