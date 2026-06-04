import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Send, CheckCircle, X, AlertCircle, TrendingUp, FileText, CreditCard, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Invoice, InvoiceStatus, InvoiceLineItem, Payment, Expense, ExpenseCategory } from "../types";
import Logo from "../components/ui/Logo";

const TAX_RATE = 19.25;
const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);
const PAYMENT_METHODS = ["bankTransfer","mobileMoney","cash","check","card"];
const EXPENSE_CATS: ExpenseCategory[] = ["court_fees","travel","printing","postage","filing","expert_fees","translation","meals","accommodation","office","other"];
const COLORS = ["#0B1F3A","#C9A84C","#1A7F4B","#C0392B","#1D6FA4","#6741D9","#B45309","#718096"];
