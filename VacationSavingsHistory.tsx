import { useEffect, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VacationContribution } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useBudgetData } from "@/hooks/useBudgetData";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const VacationSavingsHistory = () => {
  const { summary, isLoading } = useBudgetData();
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const { data: contributions } = useQuery<VacationContribution[]>({
    queryKey: ["/api/vacation-contribution"],
  });

  useEffect(() => {
    if (!chartRef.current || !contributions || contributions.length === 0) return;
    
    // Sort contributions by date
    const sortedContributions = [...contributions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Prepare data for line chart - cumulative savings over time
    const dates: string[] = [];
    const amounts: number[] = [];
    let cumulativeAmount = 0;
    
    sortedContributions.forEach(contribution => {
      const formattedDate = formatDate(contribution.date);
      cumulativeAmount += Number(contribution.amount);
      
      dates.push(formattedDate);
      amounts.push(cumulativeAmount);
    });
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Poupanças Acumuladas',
            data: amounts,
            backgroundColor: 'rgba(255, 197, 66, 0.2)',
            borderColor: 'rgba(255, 197, 66, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 197, 66, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
              }
            }
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [contributions]);

  if (isLoading || !summary) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-lg">Histórico de Poupanças</CardTitle>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full rounded-lg mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const savingsAmount = summary.vacation.savings;
  const contributionsList = contributions || [];
  
  // Sort contributions by date (most recent first)
  const sortedContributions = [...contributionsList].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  // User mapping
  const userMap: Record<string, string> = {
    'person1': 'Pessoa 1',
    'person2': 'Pessoa 2',
    'shared': 'Contribuição Conjunta'
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-lg">Histórico de Poupanças</CardTitle>
        <div className="flex items-center gap-2">
          <span className="material-icons text-accent">beach_access</span>
          <span className="font-medium">{formatCurrency(savingsAmount)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-[4/3] bg-gray-50 rounded-lg mb-6">
          <canvas ref={chartRef} />
        </div>

        <div className="space-y-4">
          {sortedContributions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma contribuição registrada</p>
          ) : (
            sortedContributions.map((contribution) => (
              <div 
                key={contribution.id} 
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{userMap[contribution.contributedBy]}</div>
                  <div className="text-xs text-gray-500">{formatDate(contribution.date)}</div>
                </div>
                <div className="text-accent font-medium">+{formatCurrency(contribution.amount)}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VacationSavingsHistory;
